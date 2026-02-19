'use client';
import React, { Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { AppLayout } from '@/components/app-layout';
import { PageHeader } from '@/components/page-header';
import { CustomerDataTable, type CustomerDataTableHandle } from './data-table';
import { getColumns } from './columns';
import { Button } from '@/components/ui/button';
import { PlusCircle, Sparkles, Trash2, FileDown, UserCheck, UserX, Camera } from 'lucide-react';
import { CustomerForm } from './customer-form';
import type { Customer } from '@/lib/types';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, doc, writeBatch, updateDoc, setDoc, query, where } from 'firebase/firestore';
import { toast } from '@/hooks/use-toast';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
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

type CustomerFormData = Partial<Omit<Customer, 'id' | 'ownerId'>>;

/**
 * 🛡️ MOTOR DE LIMPEZA RECURSIVA (Fix Erro de Servidor)
 */
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
  const [defaultValues, setDefaultValues] = React.useState<CustomerFormData | undefined>(undefined);
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
    const prefilledData: CustomerFormData = {
        ...aiData,
        birthDate: aiData.birthDate,
    };
    setSelectedCustomer(undefined);
    setDefaultValues(prefilledData);
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
    const rowsToExport = table.getFilteredSelectedRowModel().rows.length > 0 ? table.getFilteredSelectedRowModel().rows : table.getFilteredRowModel().rows;
    const worksheet = utils.json_to_sheet(rowsToExport.map(r => r.original));
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
      <div className="flex items-center justify-between">
        <PageHeader title="Clientes" />
        <div className="flex items-center gap-2">
             <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="outline"><FileDown /> Exportar</Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuItem onSelect={handleExportToExcel}>Excel (.xlsx)</DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
            <Dialog open={isAiModalOpen} onOpenChange={setIsAiModalOpen}>
                <DialogTrigger asChild>
                    <Button variant="outline" className="bg-primary/5 text-primary border-primary/20">
                        <Sparkles className="h-4 w-4" /> Cadastrar via IA / Foto
                    </Button>
                </DialogTrigger>
                <DialogContent className="max-w-xl">
                    <DialogHeader><DialogTitle>Assistente Visual de Cadastro</DialogTitle></DialogHeader>
                    <CustomerAiForm onSubmit={handleAiFormSubmit} />
                </DialogContent>
            </Dialog>
            <Button onClick={handleNewCustomer}><PlusCircle /> Novo Cliente</Button>
        </div>
      </div>
      <Tabs value={filter} onValueChange={setFilter} className="mb-4">
        <TabsList className="bg-muted/50">
          <TabsTrigger value="active" className="gap-2">Ativos <Badge variant="secondary">{activeCustomers.length}</Badge></TabsTrigger>
          <TabsTrigger value="inactive" className="gap-2">Inativos <Badge variant="secondary">{inactiveCustomers.length}</Badge></TabsTrigger>
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
