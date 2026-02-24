'use client';
import React, { Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { AppLayout } from '@/components/app-layout';
import { PageHeader } from '@/components/page-header';
import { CustomerDataTable, type CustomerDataTableHandle } from './data-table';
import { getColumns } from './columns';
import { Button } from '@/components/ui/button';
import { PlusCircle, FileDown, UserCheck, UserX, Trash2, Sparkles, Landmark, X } from 'lucide-react';
import { CustomerForm } from './customer-form';
import type { Customer, UserSettings } from '@/lib/types';
import { useUser, useFirestore, useCollection, useMemoFirebase, useDoc } from '@/firebase';
import { collection, doc, updateDoc, setDoc, query, where, writeBatch } from 'firebase/firestore';
import { toast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { CustomerAiForm } from '@/components/customers/customer-ai-form';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getAge, cn, cleanBankName } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { BankIcon } from '@/components/bank-icon';
import * as configData from '@/lib/config-data';

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
  const [rowSelection, setRowSelection] = React.useState<Record<string, boolean>>({});
  const [isSaving, setIsSaving] = React.useState(false);
  const tableRef = React.useRef<CustomerDataTableHandle>(null);
  const [filter, setFilter] = React.useState('active');
  
  // Filtros de Cartão
  const [rmcFilter, setRmcFilter] = React.useState('all');
  const [rccFilter, setRccFilter] = React.useState('all');

  const customersQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, 'customers'), where('ownerId', '==', user.uid));
  }, [firestore, user]);

  const settingsDocRef = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return doc(firestore, 'userSettings', user.uid);
  }, [firestore, user]);

  const { data: customers, isLoading: isCustomersLoading } = useCollection<Customer>(customersQuery);
  const { data: userSettings } = useDoc<UserSettings>(settingsDocRef);

  const banks = userSettings?.banks || configData.banks;
  const showLogos = userSettings?.showBankLogos ?? true;

  const filteredCustomers = React.useMemo(() => {
    if (!customers) return [];
    
    return customers.filter(c => {
        // Filtro de Anonimização
        if (c.name === 'Cliente Removido') return false;

        // Filtro de Aba (Ativo/Inativo)
        const age = getAge(c.birthDate);
        const isStatusMatch = filter === 'active' 
            ? (c.status !== 'inactive' && age < 75)
            : (c.status === 'inactive' || age >= 75);
        
        if (!isStatusMatch) return false;

        // Filtro de Banco RMC
        if (rmcFilter !== 'all') {
            const hasRmc = c.benefits?.some(b => b.rmcBank === rmcFilter);
            if (!hasRmc) return false;
        }

        // Filtro de Banco RCC
        if (rccFilter !== 'all') {
            const hasRcc = c.benefits?.some(b => b.rccBank === rccFilter);
            if (!hasRcc) return false;
        }

        return true;
    });
  }, [customers, filter, rmcFilter, rccFilter]);

  const activeCount = React.useMemo(() => 
    (customers || []).filter(c => c.name !== 'Cliente Removido' && (c.status !== 'inactive' && getAge(c.birthDate) < 75)).length,
  [customers]);

  const inactiveCount = React.useMemo(() => 
    (customers || []).filter(c => c.name !== 'Cliente Removido' && (c.status === 'inactive' || getAge(c.birthDate) >= 75)).length,
  [customers]);

  const handleNewCustomer = React.useCallback(() => {
    setSelectedCustomer(undefined);
    setDefaultValues(undefined);
    setSheetMode('new');
    setIsDialog(true);
  }, []);

  const selectedCount = React.useMemo(() => Object.keys(rowSelection).filter(id => rowSelection[id]).length, [rowSelection]);

  const handleBulkAnonymize = async () => {
    if (!firestore || !user || selectedCount === 0) return;
    setIsSaving(true);
    try {
        const batch = writeBatch(firestore);
        const selectedIds = Object.keys(rowSelection).filter(id => rowSelection[id]);
        
        selectedIds.forEach(id => {
            const docRef = doc(firestore, 'customers', id);
            batch.update(docRef, { 
                name: 'Cliente Removido', 
                cpf: '000.000.000-00', 
                status: 'inactive' 
            });
        });

        await batch.commit();
        toast({ title: 'Ação Concluída', description: `${selectedIds.length} registros foram anonimizados.` });
        setRowSelection({});
    } catch (e: any) {
        if (e.code === 'permission-denied') {
            errorEmitter.emit('permission-error', new FirestorePermissionError({
                path: 'customers',
                operation: 'update',
                requestResourceData: { status: 'inactive' }
            }));
        }
        toast({ variant: 'destructive', title: 'Erro na operação em massa' });
    } finally {
        setIsSaving(false);
    }
  };

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
    const newId = doc(collection(firestore!, 'customers')).id;
    setSelectedCustomer(undefined);
    setDefaultValues({ ...aiData, id: newId });
    setSheetMode('new');
    setIsAiModalOpen(false);
    setIsDialog(true);
  }

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
    const dataToUpdate = { name: 'Cliente Removido', cpf: '000.000.000-00', status: 'inactive' };
    
    updateDoc(docRef, dataToUpdate)
        .then(() => toast({ title: 'Cliente Anonimizado' }))
        .catch(async (error) => {
            if (error.code === 'permission-denied') {
                errorEmitter.emit('permission-error', new FirestorePermissionError({
                    path: docRef.path,
                    operation: 'update',
                    requestResourceData: dataToUpdate
                }));
            }
        });
  };

  const handleFormSubmit = async (formData: any) => {
    if (!firestore || !user) return;
    setIsSaving(true);
    try {
        const docId = (sheetMode === 'edit' && selectedCustomer) ? selectedCustomer.id : (defaultValues?.id || doc(collection(firestore, 'customers')).id);
        const docRef = doc(firestore, 'customers', docId);
        
        const finalData = {
            ...formData,
            id: docId,
            ownerId: user.uid,
            numericId: (sheetMode === 'edit' && selectedCustomer) ? selectedCustomer.numericId : (customers?.length ? Math.max(...customers.map(c => c.numericId || 0)) + 1 : 1)
        };

        setDoc(docRef, finalData, { merge: true })
            .then(() => {
                toast({ title: 'Cliente Salvo!' });
                setIsDialog(false);
            })
            .catch(async (error) => {
                if (error.code === 'permission-denied') {
                    errorEmitter.emit('permission-error', new FirestorePermissionError({
                        path: docRef.path,
                        operation: 'write',
                        requestResourceData: finalData
                    }));
                }
            });
    } finally {
        setIsSaving(false);
    }
  };

  const columns = React.useMemo(() => getColumns({ onEdit: handleEditCustomer, onDelete: handleAnonymizeCustomer }), []);

  return (
    <>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
        <PageHeader title="Clientes" />
        <div className="flex items-center gap-3 flex-wrap">
             <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="h-10 px-6 rounded-full font-bold border-border/50 hover:bg-muted/50 transition-all text-xs">
                        <FileDown className="mr-2 h-4 w-4" /> Exportar
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuItem onSelect={handleExportToExcel}>Excel (.xlsx)</DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
            
            {selectedCount > 0 && (
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button 
                            variant="destructive" 
                            className="h-10 px-6 rounded-full font-bold shadow-lg animate-in zoom-in slide-in-from-right-2"
                        >
                            <Trash2 className="mr-2 h-4 w-4" /> Remover ({selectedCount})
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Inativar {selectedCount} Clientes?</AlertDialogTitle>
                            <AlertDialogDescription>
                                Esta ação irá anonimizar os dados dos registros selecionados. Os nomes serão substituídos por "Cliente Removido" e o CPF zerado por segurança.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Voltar</AlertDialogCancel>
                            <AlertDialogAction onClick={handleBulkAnonymize} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Confirmar Remoção</AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            )}

            <Dialog open={isAiModalOpen} onOpenChange={setIsAiModalOpen}>
                <Button 
                    variant="outline" 
                    className="h-10 px-6 rounded-full font-bold bg-background text-foreground border-border/50 hover:bg-muted/50 transition-all text-xs"
                    onClick={() => setIsAiModalOpen(true)}
                >
                    <Sparkles className="h-4 w-4 mr-2" /> Novo Cliente com IA
                </Button>
                <DialogContent className="max-w-xl">
                    <DialogHeader><DialogTitle>Assistente Visual de Cadastro</DialogTitle></DialogHeader>
                    <CustomerAiForm onSubmit={handleAiFormSubmit} />
                </DialogContent>
            </Dialog>
            <Button 
                onClick={handleNewCustomer} 
                className="h-10 px-8 rounded-full font-bold bg-[#00AEEF] hover:bg-[#0096D1] text-white shadow-lg shadow-[#00AEEF]/20 transition-all border-none text-xs"
            >
                <PlusCircle className="mr-2 h-4 w-4" /> Novo Cliente
            </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4 mb-6 bg-muted/10 p-3 rounded-2xl border border-border/50 shadow-sm">
        <Tabs value={filter} onValueChange={setFilter} className="shrink-0">
            <TabsList className="bg-background/50 p-1 flex w-fit gap-2 border shadow-inner rounded-full h-11">
            <TabsTrigger 
                value="active" 
                className={cn(
                    "gap-2 rounded-full font-bold px-6 h-9 transition-all text-xs",
                    "data-[state=active]:bg-green-500 data-[state=active]:text-white shadow-none"
                )}
            >
                <UserCheck className="h-3.5 w-3.5" />
                Ativos
                <Badge variant="secondary" className="bg-white/20 text-white border-none ml-1.5 h-5 min-w-[20px] p-0 flex items-center justify-center rounded-full text-[10px] font-black">{activeCount}</Badge>
            </TabsTrigger>
            <TabsTrigger 
                value="inactive" 
                className={cn(
                    "gap-2 rounded-full font-bold px-6 h-9 transition-all text-xs",
                    "data-[state=active]:bg-zinc-600 data-[state=active]:text-white shadow-none"
                )}
            >
                <UserX className="h-3.5 w-3.5" />
                Inativos
                <Badge variant="secondary" className="bg-white/20 text-white border-none ml-1.5 h-5 min-w-[20px] p-0 flex items-center justify-center rounded-full text-[10px] font-black">{inactiveCount}</Badge>
            </TabsTrigger>
            </TabsList>
        </Tabs>

        <div className="flex items-center gap-3 flex-1 justify-end flex-wrap">
            <div className="flex items-center gap-2">
                <Select value={rmcFilter} onValueChange={setRmcFilter}>
                    <SelectTrigger className="h-10 min-w-[180px] bg-background rounded-full text-[10px] font-black uppercase px-5 border-orange-200 text-orange-600 shadow-sm hover:bg-orange-50 transition-colors">
                        <div className="flex items-center gap-2">
                            <Landmark className="h-3.5 w-3.5 opacity-50" />
                            <SelectValue placeholder="BANCO RMC" />
                        </div>
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-2">
                        <SelectItem value="all" className="font-black text-[10px] uppercase">Todos os Bancos RMC</SelectItem>
                        {banks.map(b => (
                            <SelectItem key={b} value={b} className="font-bold text-[11px] uppercase">
                                <div className="flex items-center gap-3">
                                    <BankIcon bankName={b} domain={userSettings?.bankDomains?.[b]} showLogo={showLogos} className="h-4 w-4" />
                                    <span>{cleanBankName(b)}</span>
                                </div>
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                {rmcFilter !== 'all' && <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-orange-600" onClick={() => setRmcFilter('all')}><X className="h-4 w-4" /></Button>}
            </div>

            <div className="flex items-center gap-2">
                <Select value={rccFilter} onValueChange={setRccFilter}>
                    <SelectTrigger className="h-10 min-w-[180px] bg-background rounded-full text-[10px] font-black uppercase px-5 border-blue-200 text-blue-600 shadow-sm hover:bg-blue-50 transition-colors">
                        <div className="flex items-center gap-2">
                            <Landmark className="h-3.5 w-3.5 opacity-50" />
                            <SelectValue placeholder="BANCO RCC" />
                        </div>
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-2">
                        <SelectItem value="all" className="font-black text-[10px] uppercase">Todos os Bancos RCC</SelectItem>
                        {banks.map(b => (
                            <SelectItem key={b} value={b} className="font-bold text-[11px] uppercase">
                                <div className="flex items-center gap-3">
                                    <BankIcon bankName={b} domain={userSettings?.bankDomains?.[b]} showLogo={showLogos} className="h-4 w-4" />
                                    <span>{cleanBankName(b)}</span>
                                </div>
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                {rccFilter !== 'all' && <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-blue-600" onClick={() => setRccFilter('all')}><X className="h-4 w-4" /></Button>}
            </div>
        </div>
      </div>

      <Dialog open={isDialog} onOpenChange={setIsDialog}>
        <DialogContent 
            className="max-w-4xl"
            onPointerDownOutside={(e) => e.preventDefault()}
            onInteractOutside={(e) => e.preventDefault()}
        >
          <DialogHeader><DialogTitle>{sheetMode === 'edit' ? 'Editar' : 'Novo'} Cliente</DialogTitle></DialogHeader>
          <CustomerForm
            key={selectedCustomer?.id || (defaultValues?.id ? `ai-${defaultValues.id}` : 'new')}
            onSubmit={handleFormSubmit}
            customer={selectedCustomer}
            allCustomers={customers || []}
            userSettings={userSettings}
            defaultValues={defaultValues}
            isSaving={isSaving}
          />
        </DialogContent>
      </Dialog>

      <CustomerDataTable 
        columns={columns} 
        data={filteredCustomers} 
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
