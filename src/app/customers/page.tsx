
'use client';
import React, { Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { AppLayout } from '@/components/app-layout';
import { PageHeader } from '@/components/page-header';
import { CustomerDataTable, type CustomerDataTableHandle } from './data-table';
import { getColumns } from './columns';
import { Button } from '@/components/ui/button';
import { PlusCircle, Sparkles, Trash2, FileDown, UserCheck, UserX } from 'lucide-react';
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
import type { ExtractCustomerDataOutput } from '@/ai/flows/extract-customer-data-flow';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getAge, cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

type CustomerFormData = Partial<Omit<Customer, 'id' | 'ownerId'>>;

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

  const handleAiFormSubmit = (aiData: ExtractCustomerDataOutput) => {
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

      if (status === 'inactive' || age >= 75) {
        inactive.push(customer);
      } else {
        active.push(customer);
      }
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
    const selectedRows = table.getFilteredSelectedRowModel().rows;

    let rowsToExport = selectedRows;
    if (rowsToExport.length === 0) {
        rowsToExport = table.getFilteredRowModel().rows;
    }

    if (rowsToExport.length === 0) {
        toast({
            variant: "destructive",
            title: "Nenhum cliente para exportar",
            description: "A tabela está vazia ou os filtros não retornaram resultados.",
        });
        return;
    }
    
    const visibleColumns = table.getVisibleLeafColumns().filter(
        c => c.id !== 'select' && c.id !== 'actions'
    );
    
    const idMap: {[key: string]: string} = {
        numericId: 'ID',
        name: 'Nome',
        cpf: 'CPF',
        phone: 'Telefone',
        phone2: 'Telefone 2',
        benefitNumber: 'Benefício',
        city: 'Cidade',
        state: 'Estado',
        observations: 'Observações'
    };

    const headers = visibleColumns.map(c => idMap[c.id] || c.id);

    const dataForSheet = [headers];
    rowsToExport.forEach(row => {
        const rowData: any[] = [];
        visibleColumns.forEach(col => {
            let value = row.getValue(col.id as any);
            if (['name', 'phone', 'phone2'].includes(col.id)) {
                value = row.original[col.id as keyof Customer];
            }
            rowData.push(value ?? '');
        });
        dataForSheet.push(rowData);
    });

    const worksheet = utils.aoa_to_sheet(dataForSheet);
    const workbook = utils.book_new();
    utils.book_append_sheet(workbook, worksheet, 'Clientes');
    writeFile(workbook, 'clientes.xlsx');
};

const handleExportToPdf = async () => {
    const table = tableRef.current?.table;
    if (!table) return;

    const { default: jsPDF } = await import('jspdf');
    const { default: autoTable } = await import('jspdf-autotable');

    const selectedRows = table.getFilteredSelectedRowModel().rows;
    
    let rowsToExport = selectedRows;
    if (rowsToExport.length === 0) {
        rowsToExport = table.getFilteredRowModel().rows;
    }

    if (rowsToExport.length === 0) {
        toast({
            variant: "destructive",
            title: "Nenhum cliente para exportar",
            description: "A tabela está vazia ou os filtros não retornaram resultados.",
        });
        return;
    }

    const visibleColumns = table.getVisibleLeafColumns().filter(
        c => c.id !== 'select' && c.id !== 'actions'
    );
    
    const idMap: {[key: string]: string} = {
        numericId: 'ID',
        name: 'Nome',
        cpf: 'CPF',
        phone: 'Telefone',
        phone2: 'Telefone 2',
        benefitNumber: 'Benefício',
        city: 'Cidade',
        state: 'Estado',
        observations: 'Observações'
    };

    const head = [visibleColumns.map(c => idMap[c.id] || c.id)];

    const body = rowsToExport.map(row => {
        const rowData: any[] = [];
        visibleColumns.forEach(col => {
            let value = row.getValue(col.id as any);
             if (['name', 'phone', 'phone2'].includes(col.id)) {
                value = row.original[col.id as keyof Customer];
            }
            rowData.push(value ?? '');
        });
        return rowData;
    });

    const doc = new jsPDF();
    doc.text("Relatório de Clientes", 14, 15);
    autoTable(doc, {
        head: head,
        body: body,
        startY: 20,
    });

    doc.save('clientes.pdf');
};


  const handleAnonymizeCustomer = async (customerId: string) => {
    if (!firestore) return;
    const customerRef = doc(firestore, 'customers', customerId);
    const anonymizedData: Partial<Customer> = {
      name: 'Cliente Removido',
      numericId: 0,
      cpf: '000.000.000-00',
      benefits: [],
      phone: '(00) 00000-0000',
      phone2: '',
      email: 'removido@removido.com',
      observations: `Dados do cliente anonimizados em ${new Date().toISOString()}`,
      gender: undefined,
      cep: '',
      street: '',
      number: '',
      complement: '',
      neighborhood: '',
      city: '',
      state: '',
    };
    
    setRowSelection({});

    updateDoc(customerRef, anonymizedData)
        .then(() => {
            toast({
                title: 'Cliente Removido',
                description: 'Os dados do cliente foram anonimizados com sucesso.',
            });
        })
        .catch(async (error: any) => {
            if (error.code === 'permission-denied') {
                errorEmitter.emit('permission-error', new FirestorePermissionError({
                    path: customerRef.path,
                    operation: 'update',
                    requestResourceData: anonymizedData
                }));
            }
            console.error('Error anonymizing customer:', error);
            toast({
                variant: 'destructive',
                title: 'Erro ao remover',
                description: 'Não foi possível anonimizar o cliente.',
            });
        });
  };

  const handleAnonymizeSelected = async () => {
    if (!firestore) return;
    const selectedIds = Object.keys(rowSelection);
    setRowSelection({}); 
    if (selectedIds.length === 0) return;
    
    const batch = writeBatch(firestore);
    const anonymizedData: Partial<Customer> = {
        name: 'Cliente Removido',
        numericId: 0,
        cpf: '000.000.000-00',
        benefits: [],
        phone: '(00) 00000-0000',
        phone2: '',
        email: 'removido@removido.com',
        observations: `Dados do cliente anonimizados em ${new Date().toISOString()}`,
        gender: undefined,
        cep: '',
        street: '',
        number: '',
        complement: '',
        neighborhood: '',
        city: '',
        state: '',
      };

    selectedIds.forEach((id) => {
      const docRef = doc(firestore, 'customers', id);
      batch.update(docRef, anonymizedData);
    });

    try {
      await batch.commit();
      toast({
        title: 'Clientes Removidos',
        description: `${selectedIds.length} cliente(s) foram anonimizados com sucesso.`,
      });
    } catch (error: any) {
      if (error.code === 'permission-denied') {
          errorEmitter.emit('permission-error', new FirestorePermissionError({
              path: 'batch/customers',
              operation: 'update',
              requestResourceData: anonymizedData
          }));
      }
      console.error('Error anonymizing customers:', error);
      toast({
        variant: 'destructive',
        title: 'Erro ao remover',
        description: 'Ocorreu um erro ao remover os clientes selecionados.',
      });
    }
  };

  const handleFormSubmit = async (data: Omit<Customer, 'id' | 'ownerId' | 'numericId'>) => {
    if (!firestore || !user) return;

    const cpfExists = customers?.find(
      (c) => c.cpf === data.cpf && c.id !== selectedCustomer?.id
    );
    if (cpfExists) {
        toast({
            variant: 'destructive',
            title: 'CPF já cadastrado',
            description: `O CPF ${data.cpf} já pertence ao cliente "${cpfExists.name}".`,
        });
        return;
    }

    setIsSaving(true);
    
    if (sheetMode === 'edit' && selectedCustomer) {
        const customerToUpdate: Customer = {
            ...selectedCustomer,
            ...data,
        };
        const docRef = doc(firestore, 'customers', selectedCustomer.id);
        
        // Non-blocking setDoc
        setDoc(docRef, customerToUpdate, { merge: true })
            .catch(async (error) => {
                if (error.code === 'permission-denied') {
                    errorEmitter.emit('permission-error', new FirestorePermissionError({
                        path: docRef.path,
                        operation: 'update',
                        requestResourceData: customerToUpdate
                    }));
                }
            });

        toast({
            title: 'Cliente Atualizado!',
            description: `O cliente ${data.name} foi atualizado com sucesso.`,
        });
        setIsDialog(false);
        setIsSaving(false);
  
    } else {
        const newDocRef = doc(collection(firestore, 'customers'));
        
        let nextNumericId = 1;
        if (customers && customers.length > 0) {
            const maxId = Math.max(...customers.map(c => c.numericId || 0));
            nextNumericId = maxId + 1;
        }

        const newCustomerWithId: Customer = {
          ...data,
          id: newDocRef.id,
          numericId: nextNumericId,
          ownerId: user.uid,
          status: data.status || 'active',
        };

        // Non-blocking setDoc
        setDoc(newDocRef, newCustomerWithId)
            .catch(async (error) => {
                if (error.code === 'permission-denied') {
                    errorEmitter.emit('permission-error', new FirestorePermissionError({
                        path: newDocRef.path,
                        operation: 'create',
                        requestResourceData: newCustomerWithId
                    }));
                }
            });

        toast({
          title: 'Cliente Salvo!',
          description: `O cliente ${data.name} foi salvo com sucesso.`,
        });
        setIsDialog(false);
        setIsSaving(false);
    }
  };

  const columns = React.useMemo(() => getColumns({ onEdit: handleEditCustomer, onDelete: handleAnonymizeCustomer }), []);

  const getSheetTitle = () => {
    if (sheetMode === 'edit') return 'Editar Cliente';
    return 'Novo Cliente';
  };
  
  const selectedCount = Object.keys(rowSelection).length;

  return (
    <>
      <div className="flex items-center justify-between">
        <PageHeader title="Clientes" />
        <div className="flex items-center gap-2">
            {selectedCount > 0 && (
                 <>
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="destructive">
                                <Trash2 />
                                Remover ({selectedCount})
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    Essa ação não pode ser desfeita. Isso irá anonimizar permanentemente {selectedCount} cliente(s). O histórico de propostas será mantido.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction onClick={handleAnonymizeSelected}>Remover</AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </>
            )}
             <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="outline">
                        <FileDown />
                        Exportar
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuItem onSelect={handleExportToExcel}>
                        Exportar para Excel (.xlsx)
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={handleExportToPdf}>
                        Exportar para PDF (.pdf)
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
            <Dialog open={isAiModalOpen} onOpenChange={setIsAiModalOpen}>
                <DialogTrigger asChild>
                    <Button variant="outline">
                        <Sparkles />
                        Novo Cliente com IA
                    </Button>
                </DialogTrigger>
                <DialogContent className="max-w-xl">
                    <DialogHeader>
                        <DialogTitle>Assistente de Cadastro de Cliente</DialogTitle>
                    </DialogHeader>
                    <CustomerAiForm onSubmit={handleAiFormSubmit} />
                </DialogContent>
            </Dialog>
            <Button onClick={handleNewCustomer}>
                <PlusCircle />
                Novo Cliente
            </Button>
        </div>
      </div>
      <Tabs value={filter} onValueChange={setFilter} className="mb-4">
        <TabsList className="bg-muted/50">
          <TabsTrigger 
            value="active" 
            className="gap-2 border border-transparent data-[state=active]:bg-green-100 data-[state=active]:text-green-700 data-[state=active]:border-green-300"
          >
            <UserCheck className="h-4 w-4" />
            Ativos
            <Badge variant="secondary" className="ml-1 bg-green-200/50 text-green-800">{activeCustomers.length}</Badge>
          </TabsTrigger>
          <TabsTrigger 
            value="inactive" 
            className="gap-2 border border-transparent data-[state=active]:bg-zinc-100 data-[state=active]:text-zinc-700 data-[state=active]:border-zinc-300"
          >
            <UserX className="h-4 w-4" />
            Inativos
            <Badge variant="secondary" className="ml-1 bg-zinc-200/50 text-zinc-800">{inactiveCustomers.length}</Badge>
          </TabsTrigger>
        </TabsList>
      </Tabs>
      <Dialog open={isDialog} onOpenChange={setIsDialog}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>{getSheetTitle()}</DialogTitle>
          </DialogHeader>
          <CustomerForm
            onSubmit={handleFormSubmit}
            customer={selectedCustomer}
            defaultValues={defaultValues}
            isSaving={isSaving}
          />
        </DialogContent>
      </Dialog>
      <CustomerDataTable 
        ref={tableRef}
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
      <Suspense fallback={
        <div className="space-y-4">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-64 w-full" />
        </div>
      }>
        <CustomersPageContent />
      </Suspense>
    </AppLayout>
  );
}
