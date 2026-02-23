'use client';
import React, { Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { AppLayout } from '@/components/app-layout';
import { PageHeader } from '@/components/page-header';
import { ProposalsDataTable, type ProposalsDataTableHandle } from './data-table';
import { getColumns } from './columns';
import { Button } from '@/components/ui/button';
import { PlusCircle, FileDown, Trash2, Printer, CheckCircle2, ChevronDown } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ProposalForm } from './proposal-form';
import type { Proposal, Customer, ProposalStatus, UserSettings, ProposalHistoryEntry } from '@/lib/types';
import { toast } from '@/hooks/use-toast';
import { useUser, useFirestore, useCollection, useMemoFirebase, useDoc } from '@/firebase';
import { collection, doc, updateDoc, setDoc, query, where, writeBatch, arrayUnion, deleteDoc } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { CustomerSearchDialog } from '@/components/proposals/customer-search-dialog';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cleanFirestoreData } from '@/lib/utils';

export type ProposalWithCustomer = Proposal & { customer: Customer | undefined };
type ProposalFormData = Partial<Omit<Proposal, 'id' | 'ownerId'>>;

function ProposalsPageSkeleton() {
    return (
        <AppLayout>
            <div className="flex items-center justify-between">
                <PageHeader title="Propostas" />
                <div className="flex items-center gap-2">
                    <Skeleton className="h-10 w-32 rounded-full" />
                    <Skeleton className="h-10 w-32 rounded-full" />
                </div>
            </div>
            <div className="rounded-xl border-2 border-zinc-200 p-4">
                <div className="space-y-2">
                    <Skeleton className="h-10 w-full" />
                    {Array.from({ length: 10 }).map((_, i) => (
                        <Skeleton key={i} className="h-12 w-full" />
                    ))}
                </div>
            </div>
        </AppLayout>
    )
}

function ProposalsPageContent() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const searchParams = useSearchParams();
  const router = useRouter();

  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [isCustomerSearchOpen, setIsCustomerSearchOpen] = React.useState(false);
  const [newlySelectedCustomer, setNewlySelectedCustomer] = React.useState<Customer | null>(null);

  const [selectedProposal, setSelectedProposal] = React.useState<ProposalWithCustomer | undefined>(undefined);
  const [sheetMode, setSheetMode] = React.useState<'new' | 'edit' | 'view'>('new');
  const [rowSelection, setRowSelection] = React.useState<Record<string, boolean>>({});
  const [defaultValues, setDefaultValues] = React.useState<ProposalFormData | undefined>(undefined);
  const [isSaving, setIsSaving] = React.useState(false);
  const tableRef = React.useRef<ProposalsDataTableHandle>(null);
  const [hasOpenedFromParam, setHasOpenedFromParam] = React.useState(false);
  
  const proposalsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, 'loanProposals'), where('ownerId', '==', user.uid));
  }, [firestore, user]);

  const customersQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, 'customers'), where('ownerId', '==', user.uid));
  }, [firestore, user]);

  const settingsDocRef = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return doc(firestore, 'userSettings', user.uid);
  }, [firestore, user]);
  
  const { data: proposals, isLoading: proposalsLoading } = useCollection<Proposal>(proposalsQuery);
  const { data: customers, isLoading: customersLoading } = useCollection<Customer>(customersQuery);
  const { data: userSettings, isLoading: settingsLoading } = useDoc<UserSettings>(settingsDocRef);

  const isLoading = proposalsLoading || customersLoading || isUserLoading || settingsLoading;

  const selectedCount = React.useMemo(() => Object.keys(rowSelection).length, [rowSelection]);

  const proposalsWithCustomerData: ProposalWithCustomer[] = React.useMemo(() => {
    if (!proposals || !customers) return [];
    const customersMap = new Map(customers.map(c => [c.id, c]));
    return proposals.map(p => ({
      ...p,
      customer: customersMap.get(p.customerId),
    }));
  }, [proposals, customers]);

  const handleNewProposal = React.useCallback(() => {
    setSelectedProposal(undefined);
    setDefaultValues(undefined);
    setSheetMode('new');
    setIsDialogOpen(true);
  }, []);

  const handleEditProposal = React.useCallback((proposal: ProposalWithCustomer) => {
    setSelectedProposal(proposal);
    setDefaultValues(undefined);
    setSheetMode('edit');
    setIsDialogOpen(true);
  }, []);

  const handleViewProposal = React.useCallback((proposal: ProposalWithCustomer) => {
    setSelectedProposal(proposal);
    setDefaultValues(undefined);
    setSheetMode('view');
    setIsDialogOpen(true);
  }, []);

  const handleCustomerSelect = (customer: Customer) => {
    setNewlySelectedCustomer(customer);
    setIsCustomerSearchOpen(false);
  };
  
  const handleDuplicateProposal = React.useCallback((proposal: ProposalWithCustomer) => {
    const { id, proposalNumber, status, ...rest } = proposal;
    const duplicatedData: ProposalFormData = {
        ...rest,
        proposalNumber: '',
        status: 'Em Andamento',
        dateDigitized: new Date().toISOString(),
        dateApproved: undefined,
        datePaidToClient: undefined,
        debtBalanceArrivalDate: undefined,
        attachments: [],
    };
    setSelectedProposal(undefined);
    setDefaultValues(duplicatedData);
    setSheetMode('new');
    setIsDialogOpen(true);
  }, []);

  const handleBulkStatusChange = async (newStatus: ProposalStatus) => {
    if (!firestore || !user || selectedCount === 0) return;
    setIsSaving(true);
    try {
        const batch = writeBatch(firestore);
        const selectedIds = Object.keys(rowSelection);
        const now = new Date().toISOString();
        
        selectedIds.forEach(id => {
            const proposal = proposals?.find(p => p.id === id);
            if (!proposal) return;

            const docRef = doc(firestore, 'loanProposals', id);
            const dataToUpdate: any = { 
                status: newStatus, 
                statusUpdatedAt: now 
            };

            if (newStatus === 'Pago') {
                dataToUpdate.dateApproved = now;
                dataToUpdate.datePaidToClient = now;
                if (!proposal.commissionStatus) dataToUpdate.commissionStatus = 'Pendente';
            } else if (newStatus === 'Saldo Pago' && proposal.product === 'Portabilidade') {
                dataToUpdate.debtBalanceArrivalDate = now;
            }

            const historyEntry: ProposalHistoryEntry = {
                id: crypto.randomUUID(),
                date: now,
                message: `Status alterado em massa para "${newStatus}"`,
                userName: user.displayName || user.email || 'Sistema'
            };
            dataToUpdate.history = arrayUnion(historyEntry);

            batch.update(docRef, cleanFirestoreData(dataToUpdate));
        });

        await batch.commit();
        toast({ title: 'Status Atualizado em Massa', description: `${selectedCount} propostas alteradas para "${newStatus}".` });
        setRowSelection({});
    } catch (e) {
        toast({ variant: 'destructive', title: 'Erro na operação em massa' });
    } finally {
        setIsSaving(false);
    }
  };

  const handlePrintSelection = () => {
    document.body.classList.add('print-selection');
    window.print();
    window.addEventListener('afterprint', () => {
        document.body.classList.remove('print-selection');
    }, { once: true });
  };

  React.useEffect(() => {
    const action = searchParams.get('action');
    const openId = searchParams.get('open');

    if (!isLoading && !hasOpenedFromParam) {
        if (action === 'new') {
            handleNewProposal();
            setHasOpenedFromParam(true);
            router.replace('/proposals', { scroll: false });
        } else if (openId && proposalsWithCustomerData.length > 0) {
            const proposalToOpen = proposalsWithCustomerData.find(p => p.id === openId);
            if (proposalToOpen) {
                handleEditProposal(proposalToOpen);
                setHasOpenedFromParam(true);
                setTimeout(() => {
                    router.replace('/proposals', { scroll: false });
                }, 100);
            }
        }
    }
  }, [searchParams, isLoading, proposalsWithCustomerData, hasOpenedFromParam, handleNewProposal, handleEditProposal, router]);

  const handleExportToExcel = async () => {
    const table = tableRef.current?.table;
    if (!table) return;
    const { utils, writeFile } = await import('xlsx');
    const rows = table.getFilteredRowModel().rows;
    const worksheet = utils.json_to_sheet(rows.map(r => r.original));
    const workbook = utils.book_new();
    utils.book_append_sheet(workbook, worksheet, 'Propostas');
    writeFile(workbook, 'propostas.xlsx');
  };

  const handleStatusChange = async (proposalId: string, newStatus: ProposalStatus, productType?: string) => {
    if (!firestore || !user) return;
    const proposal = proposals?.find(p => p.id === proposalId);
    if (!proposal || proposal.status === newStatus) return;

    const now = new Date().toISOString();
    const dataToUpdate: any = { 
        status: newStatus,
        statusUpdatedAt: now
    };

    if (newStatus === 'Pago') {
        dataToUpdate.dateApproved = now;
        dataToUpdate.datePaidToClient = now;
        if (!proposal.commissionStatus) dataToUpdate.commissionStatus = 'Pendente';
    } else if (newStatus === 'Saldo Pago' && (productType === 'Portabilidade' || proposal.product === 'Portabilidade')) {
        dataToUpdate.debtBalanceArrivalDate = now;
    }

    const historyEntry: ProposalHistoryEntry = {
        id: crypto.randomUUID(),
        date: now,
        message: `Status alterado de "${proposal.status}" para "${newStatus}"`,
        userName: user.displayName || user.email || 'Sistema'
    };
    dataToUpdate.history = arrayUnion(historyEntry);
    
    const docRef = doc(firestore, 'loanProposals', proposalId);
    updateDoc(docRef, cleanFirestoreData(dataToUpdate))
        .then(() => toast({ title: 'Status Atualizado!' }))
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

  const handleFormSubmit = async (data: any) => {
    if (!firestore || !user) return;
    setIsSaving(true);
    const docRef = sheetMode === 'edit' && selectedProposal ? doc(firestore, 'loanProposals', selectedProposal.id) : doc(collection(firestore, 'loanProposals'));
    
    // 🛡️ BLINDAGEM DE DADOS V8: Limpa undefineds antes de setDoc
    const finalData = cleanFirestoreData({ ...data, id: docRef.id, ownerId: user.uid });
    
    setDoc(docRef, finalData, { merge: true })
        .then(() => {
            toast({ title: 'Proposta Salva!' });
            setIsDialogOpen(false);
        })
        .catch(async (error) => {
            if (error.code === 'permission-denied') {
                errorEmitter.emit('permission-error', new FirestorePermissionError({
                    path: docRef.path,
                    operation: 'write',
                    requestResourceData: finalData
                }));
            }
            toast({ variant: 'destructive', title: 'Erro ao salvar proposta' });
        })
        .finally(() => setIsSaving(false));
  };

  const columns = React.useMemo(() => getColumns(
    handleEditProposal, 
    handleViewProposal, 
    (id: string) => deleteDoc(doc(firestore!, 'loanProposals', id)), 
    handleStatusChange, 
    handleDuplicateProposal
  ), [firestore, handleEditProposal, handleViewProposal, handleStatusChange, handleDuplicateProposal]);

  return (
    <>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
        <PageHeader title="Propostas" />
        <div className="flex items-center gap-3 flex-wrap">
            {selectedCount > 0 && (
                <div className="flex items-center gap-2 animate-in slide-in-from-right-2 duration-300">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" className="h-10 px-6 rounded-full font-bold border-primary/30 bg-primary/5 text-primary text-xs">
                                <CheckCircle2 className="mr-2 h-4 w-4" /> Alterar Status ({selectedCount}) <ChevronDown className="ml-2 h-3 w-3" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            {['Pendente', 'Em Andamento', 'Aguardando Saldo', 'Pago', 'Saldo Pago'].map(s => (
                                <DropdownMenuItem key={s} onSelect={() => handleBulkStatusChange(s as ProposalStatus)}>{s}</DropdownMenuItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>
                    <Button variant="destructive" className="h-10 px-6 rounded-full font-bold text-xs" onClick={() => handleBulkStatusChange('Reprovado')}>
                        <Trash2 className="mr-2 h-4 w-4" /> Cancelar
                    </Button>
                    <Button variant="outline" className="h-10 px-6 rounded-full font-bold text-xs" onClick={handlePrintSelection}>
                        <Printer className="mr-2 h-4 w-4" /> Imprimir
                    </Button>
                </div>
            )}
            <Button variant="outline" className="h-10 px-6 rounded-full font-bold border-border/50 hover:bg-muted/50 transition-all text-xs" onClick={handleExportToExcel}>
                <FileDown className="mr-2 h-4 w-4" /> Exportar
            </Button>
            <Button onClick={handleNewProposal} className="h-10 px-8 rounded-full font-bold bg-[#00AEEF] hover:bg-[#0096D1] text-white shadow-lg shadow-[#00AEEF]/20 transition-all border-none text-xs">
                <PlusCircle className="mr-2 h-4 w-4" /> Nova Proposta
            </Button>
        </div>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader><DialogTitle>{sheetMode === 'edit' ? 'Editar' : 'Nova'} Proposta</DialogTitle></DialogHeader>
          <ProposalForm 
            proposal={selectedProposal} 
            allProposals={proposals || []}
            customers={customers || []}
            userSettings={userSettings || null}
            isReadOnly={sheetMode === 'view'}
            onSubmit={handleFormSubmit}
            onDuplicate={handleDuplicateProposal}
            defaultValues={defaultValues}
            sheetMode={sheetMode}
            onOpenCustomerSearch={() => setIsCustomerSearchOpen(true)}
            selectedCustomerFromSearch={newlySelectedCustomer}
            onCustomerSearchSelectionHandled={() => setNewlySelectedCustomer(null)}
            isSaving={isSaving}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={isCustomerSearchOpen} onOpenChange={setIsCustomerSearchOpen}>
        <CustomerSearchDialog
            open={isCustomerSearchOpen}
            onOpenChange={setIsCustomerSearchOpen}
            customers={customers?.filter(c => c.name !== 'Cliente Removido') || []}
            onSelectCustomer={handleCustomerSelect}
        />
      </Dialog>

      {isLoading ? (
        <ProposalsPageSkeleton />
      ) : (
        <ProposalsDataTable 
            ref={tableRef}
            columns={columns} 
            data={proposalsWithCustomerData}
            rowSelection={rowSelection}
            setRowSelection={setRowSelection}
            onBulkStatusChange={handleBulkStatusChange} 
            userSettings={userSettings || null}
        />
      )}
    </>
  );
}

export default function ProposalsPage() {
    return (
        <AppLayout>
            <Suspense fallback={<ProposalsPageSkeleton />}>
                <ProposalsPageContent />
            </Suspense>
        </AppLayout>
    )
}
