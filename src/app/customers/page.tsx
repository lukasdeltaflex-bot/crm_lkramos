
'use client';
import React, { Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { AppLayout } from '@/components/app-layout';
import { PageHeader } from '@/components/page-header';
import { CustomerDataTable, type CustomerDataTableHandle } from './data-table';
import { getColumns } from './columns';
import { Button } from '@/components/ui/button';
import { PlusCircle, Sparkles, FileDown, UserCheck, UserX } from 'lucide-react';
import { CustomerForm } from './customer-form';
import type { Customer } from '@/lib/types';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, doc, updateDoc, setDoc, query, where } from 'firebase/firestore';
import { toast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { CustomerAiForm } from '@/components/customers/customer-ai-form';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getAge } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

function cleanCustomerData(data: any): any {
    if (data === null || data === undefined) return null;
    if (Array.isArray(data)) return data.map(item => cleanCustomerData(item)).filter(i => i !== undefined);
    if (typeof data === 'object') {
        const cleaned: any = {};
        Object.keys(data).forEach(key => {
            const val = data[key];
            if (val !== undefined) cleaned[key] = cleanCustomerData(val);
        });
        return cleaned;
    }
    return data;
}

function CustomersPageContent() {
  const { user } = useUser();
  const firestore = useFirestore();
  const searchParams = useSearchParams();
  const router = useRouter();

  const [isDialog, setIsDialog] = React.useState(false);
  const [isAiModalOpen, setIsAiModalOpen] = React.useState(false);
  const [selectedCustomer, setSelectedCustomer] = React.useState<Customer | undefined>(undefined);
  const [defaultValues, setDefaultValues] = React.useState<any | undefined>(undefined);
  const [sheetMode, setSheetMode] = React.useState<'new' | 'edit'>('new');
  const [rowSelection, setRowSelection] = React.useState({});
  const [isSaving, setIsSaving] = React.useState(false);
  const tableRef = React.useRef<CustomerDataTableHandle>(null);
  const [filter, setFilter] = React.useState('active');

  const customersQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, 'customers'), where('ownerId', '==', user.uid));
  }, [firestore, user]);

  const { data: customers, isLoading: isCustomersLoading } = useCollection<Customer>(customersQuery);

  const [activeCustomers, setActiveCustomers] = React.useState<Customer[]>([]);
  const [inactiveCustomers, setInactiveCustomers] = React.useState<Customer[]>([]);

  const handleNewCustomer = React.useCallback(() => {
    setSelectedCustomer(undefined);
    setDefaultValues(undefined);
    setSheetMode('new');
    setIsDialog(true);
  }, []);

  React.useEffect(() => {
    const action = searchParams.get('action');
    if (action === 'new' && !isDialog && !isCustomersLoading) {
      handleNewCustomer();
      router.replace('/customers', { scroll: false });
    }
  }, [searchParams, router, isCustomersLoading, isDialog, handleNewCustomer]);

  const handleEditCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    setDefaultValues(undefined);
    setSheetMode('edit');
    setIsDialog(true);
  };

  const handleAiFormSubmit = (aiData: any) => {
    setSelectedCustomer(undefined);
    setDefaultValues(aiData);
    setSheetMode('new');
    setIsAiModalOpen(false);
    setIsDialog(true);
  }
  
  const nonAnonymizedCustomers = React.useMemo(() => customers?.filter(c => c.name !== 'Cliente Removido') || [], [customers]);

  React.useEffect(() => {
    const active: Customer[] = [];
    const inactive: Customer[] = [];

    nonAnonymizedCustomers.forEach(customer => {
      const status = customer.status || 'active';
      const age = getAge(customer.birthDate);
      if (status === 'inactive' || age >= 75) inactive.push(customer);
      else active.push(customer);
    });

    setActiveCustomers(active);
    setInactiveCustomers(inactive);
  }, [nonAnonymizedCustomers]);

  const displayedCustomers = React.useMemo(() => {
    return filter === 'active' ? activeCustomers : inactiveCustomers;
  }, [filter, activeCustomers, inactiveCustomers]);

  const handleExportToExcel = async () => {
    const table = tableRef.current?.table;
    if (!table) return;
    const { utils, writeFile } = await import('xlsx');
    const rows = table.getFilteredRowModel().rows;
    const worksheet = utils.json_to_sheet(rows.map(r => r.original));
    const workbook = utils.book_new();
    utils.book_append_sheet(workbook, worksheet, 'Clientes');
    writeFile(workbook, 'clientes.xlsx');
  };

  const handleAnonymizeCustomer = async (customerId: string) => {
    if (!firestore) return;
    const docRef = doc(firestore, 'customers', customerId);
    updateDoc(docRef, { name: 'Cliente Removido', cpf: '000.000.000-00', status: 'inactive' })
        .then(() => toast({ title: 'Cliente Anonimizado' }));
  };

  const handleFormSubmit = async (formData: any) => {
    if (!firestore || !user) return;
    setIsSaving(true);
    try {
        const cleanedData = cleanCustomerData({ ...formData, ownerId: user.uid });
        const docRef = sheetMode === 'edit' && selectedCustomer ? doc(firestore, 'customers', selectedCustomer.id) : doc(collection(firestore, 'customers'));
        
        const finalData = {
            ...cleanedData,
            id: docRef.id,
            numericId: (sheetMode === 'edit' && selectedCustomer) ? selectedCustomer.numericId : (customers?.length ? Math.max(...customers.map(c => c.numericId || 0)) + 1 : 1)
        };

        setDoc(docRef, finalData, { merge: true })
            .then(() => {
                toast({ title: 'Cliente Salvo!' });
                setIsDialog(false);
            });
    } finally {
        setIsSaving(false);
    }
  };

  const columns = React.useMemo(() => getColumns({ onEdit: handleEditCustomer, onDelete: handleAnonymizeCustomer }), []);

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <PageHeader title="Clientes" />
        <div className="flex items-center gap-2">
             <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="h-10 px-4 font-bold border-primary/20 hover:bg-primary/5">
                        <FileDown className="mr-2 h-4 w-4" /> Exportar
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuItem onSelect={handleExportToExcel}>Excel (.xlsx)</DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
            <Dialog open={isAiModalOpen} onOpenChange={setIsAiModalOpen}>
                <DialogTrigger asChild>
                    <Button variant="outline" className="h-10 px-4 font-bold bg-orange-50/50 text-orange-600 border-orange-200/50 hover:bg-orange-100/50">
                        <Sparkles className="h-4 w-4 mr-2" /> Cadastrar via IA / Foto
                    </Button>
                </DialogTrigger>
                <DialogContent className="max-w-xl">
                    <DialogHeader><DialogTitle>Assistente Visual de Cadastro</DialogTitle></DialogHeader>
                    <CustomerAiForm onSubmit={handleAiFormSubmit} />
                </DialogContent>
            </Dialog>
            <Button onClick={handleNewCustomer} className="h-10 px-6 font-bold bg-primary/10 text-primary border-primary/20 hover:bg-primary/20 border-2 shadow-none transition-all">
                <PlusCircle className="mr-2 h-4 w-4" /> Novo Cliente
            </Button>
        </div>
      </div>

      <Tabs value={filter} onValueChange={setFilter} className="mb-6">
        <TabsList className="bg-muted/30 p-1 rounded-full border border-border/50 h-12">
          <TabsTrigger 
            value="active" 
            className="gap-2 rounded-full font-bold px-8 h-full transition-all border-2 border-transparent data-[state=active]:bg-green-50 data-[state=active]:text-green-600 data-[state=active]:border-green-500/20"
          >
            <UserCheck className="h-4 w-4" />
            Ativos 
            <Badge variant="secondary" className="bg-green-100 text-green-700 ml-1 border-none">{activeCustomers.length}</Badge>
          </TabsTrigger>
          <TabsTrigger 
            value="inactive" 
            className="gap-2 rounded-full font-bold px-8 h-full transition-all border-2 border-transparent data-[state=active]:bg-zinc-100 data-[state=active]:text-zinc-600 data-[state=active]:border-zinc-500/20"
          >
            <UserX className="h-4 w-4" />
            Inativos 
            <Badge variant="secondary" className="bg-zinc-200 text-zinc-700 ml-1 border-none">{inactiveCustomers.length}</Badge>
          </TabsTrigger>
        </TabsList>
      </Tabs>

      <Dialog open={isDialog} onOpenChange={setIsDialog}>
        <DialogContent className="max-w-4xl">
          <DialogHeader><DialogTitle>{sheetMode === 'edit' ? 'Editar' : 'Novo'} Cliente</DialogTitle></DialogHeader>
          <CustomerForm
            onSubmit={handleFormSubmit}
            customer={selectedCustomer}
            allCustomers={customers || []}
            defaultValues={defaultValues}
            isSaving={isSaving}
          />
        </DialogContent>
      </Dialog>

      <CustomerDataTable 
        columns={columns} 
        data={displayedCustomers} 
        isLoading={isCustomersLoading}
        rowSelection={rowSelection}
        setRowSelection={setRowSelection}
       />
    </>
  );
}

export default function CustomersPage() {
  return (
    <AppLayout>
      <Suspense fallback={<Skeleton className="h-64 w-full" />}><CustomersPageContent /></Suspense>
    </AppLayout>
  );
}
