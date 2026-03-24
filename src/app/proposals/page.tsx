'use client';
import React, { Suspense, useCallback, useState, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { AppLayout } from '@/components/app-layout';
import { PageHeader } from '@/components/page-header';
import { ProposalsDataTable, type ProposalsDataTableHandle } from './data-table';
import { getColumns } from './columns';
import { Button } from '@/components/ui/button';
import { PlusCircle, FileDown, Trash2, CheckCircle2, ChevronDown, FileSpreadsheet, FileText as FilePdf, FileBadge, Printer, Download, Sparkles, ChevronRight } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ProposalForm } from './proposal-form';
import type { Proposal, Customer, ProposalStatus, UserSettings, ProposalHistoryEntry } from '@/lib/types';
import { toast } from '@/hooks/use-toast';
import { useUser, useFirestore, useCollection, useMemoFirebase, useDoc } from '@/firebase';
import { collection, doc, updateDoc, setDoc, query, where, writeBatch, arrayUnion, limit, orderBy } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { CustomerSearchDialog } from '@/components/proposals/customer-search-dialog';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuLabel,
    DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { cleanFirestoreData, formatCurrency, cleanBankName, formatDateSafe } from '@/lib/utils';
import { format } from 'date-fns';
import { CustomerAiForm } from '@/components/customers/customer-ai-form';

// 🛡️ FIX BUILD: Garante que esta rota seja tratada como dinâmica
export const dynamic = 'force-dynamic';

function ProposalsPageSkeleton() {
    return (
        <div className="space-y-6">
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
        </div>
    )
}

function ProposalsPageContent() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const searchParams = useSearchParams();
  const router = useRouter();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isCustomerSearchOpen, setIsCustomerSearchOpen] = useState(false);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [newlySelectedCustomer, setNewlySelectedCustomer] = useState<Customer | null>(null);

  const [selectedProposal, setSelectedProposal] = useState<ProposalWithCustomer | undefined>(undefined);
  const [sheetMode, setSheetMode] = useState<'new' | 'edit' | 'view'>('new');
  const [rowSelection, setRowSelection] = useState<Record<string, boolean>>({});
  const [defaultValues, setDefaultValues] = useState<any | undefined>(undefined);
  const [isSaving, setIsSaving] = useState(false);
  const [formKey, setFormKey] = React.useState('new');
  const tableRef = React.useRef<ProposalsDataTableHandle>(null);
  const [hasOpenedFromParam, setHasOpenedFromParam] = useState(false);
  
  // ⚡ PERFORMANCE: Limite de carregamento inicial expandido para garantir visibilidade histórica
  const [loadLimit, setLoadLimit] = useState(150);

  const proposalsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(
        collection(firestore, 'loanProposals'), 
        where('ownerId', '==', user.uid),
        orderBy('dateDigitized', 'desc'),
        limit(loadLimit)
    );
  }, [firestore, user, loadLimit]);

  const customersQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(
        collection(firestore, 'customers'), 
        where('ownerId', '==', user.uid),
        orderBy('numericId', 'desc'),
        limit(1500) // Reduzido de 5000 para proteger quotas, com orderBy para garantir os mais recentes
    );
  }, [firestore, user]);

  const settingsDocRef = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return doc(firestore, 'userSettings', user.uid);
  }, [firestore, user]);
  
  const { data: proposals, isLoading: proposalsLoading } = useCollection<Proposal>(proposalsQuery);
  const { data: customers, isLoading: customersLoading } = useCollection<Customer>(customersQuery);
  const { data: userSettings } = useDoc<UserSettings>(settingsDocRef);

  const isLoading = proposalsLoading || customersLoading || isUserLoading;

  const customerMap = useMemo(() => {
    if (!customers) return new Map();
    return new Map(customers.map(c => [c.id, c]));
  }, [customers]);

  const proposalsWithCustomerData: ProposalWithCustomer[] = useMemo(() => {
    if (!proposals || !customers) return [];
    return proposals
        .filter(p => p.deleted !== true)
        .map(p => ({
            ...p,
            customer: customerMap.get(p.customerId),
        }));
  }, [proposals, customerMap, customers]);

  const selectedIds = useMemo(() => 
    Object.keys(rowSelection).filter(id => rowSelection[id]),
  [rowSelection]);

  const selectedCount = selectedIds.length;

  const handleNewProposal = useCallback(() => {
    setSelectedProposal(undefined);
    setDefaultValues(undefined);
    setNewlySelectedCustomer(null);
    setSheetMode('new');
    setFormKey(`new-${Date.now()}`);
    setIsDialogOpen(true);
  }, []);

  const handleEditProposal = useCallback((proposal: ProposalWithCustomer) => {
    setSelectedProposal(proposal);
    setDefaultValues(undefined);
    setNewlySelectedCustomer(null);
    setSheetMode('edit');
    setFormKey(`edit-${proposal.id}`);
    setIsDialogOpen(true);
  }, []);

  const handleViewProposal = useCallback((proposal: ProposalWithCustomer) => {
    setSelectedProposal(proposal);
    setDefaultValues(undefined);
    setNewlySelectedCustomer(null);
    setSheetMode('view');
    setFormKey(`view-${proposal.id}`);
    setIsDialogOpen(true);
  }, []);

  const handleCustomerSelect = useCallback((customer: Customer) => {
    setNewlySelectedCustomer(customer);
    setIsCustomerSearchOpen(false);
  }, []);

  const handleCustomerSearchSelectionHandled = useCallback(() => {
    setNewlySelectedCustomer(null);
  }, []);
  
  const handleDuplicateProposal = useCallback((proposal: Proposal) => {
    const { id, proposalNumber, status, history, checklist, commissionStatus, amountPaid, commissionPaymentDate, ...rest } = proposal;
    const duplicatedData: any = {
        ...rest,
        proposalNumber: '',
        status: 'Em Andamento',
        commissionStatus: '',
        amountPaid: 0,
        commissionPaymentDate: undefined,
        dateDigitized: new Date().toISOString(),
        dateApproved: undefined,
        datePaidToClient: undefined,
        debtBalanceArrivalDate: undefined,
        attachments: [],
        history: [], 
        checklist: {
            formalization: false,
            documentation: false,
            signature: false,
            approval: false
        }
    };
    setSelectedProposal(undefined);
    setDefaultValues(duplicatedData);
    setNewlySelectedCustomer(null);
    setSheetMode('new');
    setFormKey(`dup-${proposal.id}-${Date.now()}`);
    setIsDialogOpen(true);
  }, []);

  const handleBulkStatusChange = useCallback(async (newStatus: ProposalStatus) => {
    if (!firestore || !user || selectedCount === 0) return;
    setIsSaving(true);
    try {
        const batch = writeBatch(firestore);
        const now = new Date().toISOString();
        const userName = user.displayName || user.email || 'Sistema';
        
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
                message: `⚙️ Status alterado em massa para "${newStatus}"`,
                userName: userName
            };
            dataToUpdate.history = arrayUnion(historyEntry);

            batch.set(docRef, cleanFirestoreData(dataToUpdate), { merge: true });
        });

        await batch.commit();
        toast({ title: 'Status Atualizado em Massa', description: `${selectedCount} propostas alteradas para "${newStatus}".` });
        setRowSelection({});
    } catch (e: any) {
        toast({ variant: 'destructive', title: 'Erro na operação' });
    } finally {
        setIsSaving(false);
    }
  }, [firestore, user, selectedCount, selectedIds, proposals]);

  const handleStatusChange = useCallback(async (proposalId: string, payload: { status: ProposalStatus; rejectionReason?: string; quickNote?: string; product?: string }) => {
    if (!firestore || !user) return;
    
    const proposal = proposals?.find(p => p.id === proposalId);
    if (!proposal) return;

    const { status: newStatus, rejectionReason, quickNote, product: productType } = payload;
    const now = new Date().toISOString();
    const userName = user.displayName || user.email || 'Sistema';
    
    const dataToUpdate: any = { 
        status: newStatus,
        statusUpdatedAt: now
    };

    const isPortability = (productType || proposal.product) === 'Portabilidade';

    if (newStatus === 'Pago') {
        dataToUpdate.dateApproved = now;
        dataToUpdate.datePaidToClient = now;
        if (!proposal.commissionStatus) dataToUpdate.commissionStatus = 'Pendente';
    } else if (newStatus === 'Saldo Pago' && isPortability) {
        dataToUpdate.debtBalanceArrivalDate = now;
    } else if (newStatus === 'Aguardando Saldo' && isPortability) {
        dataToUpdate.statusAwaitingBalanceAt = now;
    }

    dataToUpdate.rejectionReason = newStatus === 'Reprovado' ? (rejectionReason || "") : "";

    const historyMessage = newStatus === 'Reprovado'
        ? `⚙️ Status para "${newStatus}". MOTIVO: ${rejectionReason}${quickNote ? ` | NOTA: ${quickNote}` : ''}`
        : quickNote && quickNote.trim() 
            ? `⚙️ Status para "${newStatus}". Nota: ${quickNote.trim()}`
            : `⚙️ Status alterado para "${newStatus}"`;

    const historyEntry: ProposalHistoryEntry = {
        id: crypto.randomUUID(),
        date: now,
        message: historyMessage,
        userName: userName
    };
    dataToUpdate.history = arrayUnion(historyEntry);
    
    const docRef = doc(firestore, 'loanProposals', proposalId);
    setIsSaving(true);
    try {
        await updateDoc(docRef, cleanFirestoreData(dataToUpdate));
        toast({ title: 'Status Atualizado!' });
    } catch (error: any) {
        toast({ variant: 'destructive', title: 'Erro ao atualizar' });
    } finally {
        setIsSaving(false);
    }
  }, [firestore, user, proposals]);

  const handleToggleChecklist = useCallback(async (proposalId: string, stepId: string, currentValue: boolean) => {
    if (!firestore || !user) return;
    const docRef = doc(firestore, 'loanProposals', proposalId);
    const updatePath = `checklist.${stepId}`;
    
    setIsSaving(true);
    try {
        await updateDoc(docRef, { [updatePath]: !currentValue });
        toast({ title: "Etapa atualizada!" });
    } catch (e: any) {
        toast({ variant: 'destructive', title: "Erro na atualização" });
    } finally {
        setIsSaving(false);
    }
  }, [firestore, user]);

  const handleMoveToTrash = useCallback(async (id: string) => {
    if (!firestore || !user) return;
    setIsSaving(true);
    const docRef = doc(firestore, 'loanProposals', id);
    try {
        await updateDoc(docRef, {
            deleted: true,
            deletedAt: new Date().toISOString(),
            deletedBy: user.uid
        });
        toast({ title: 'Proposta movida para a Lixeira' });
    } catch (error: any) {
        toast({ variant: 'destructive', title: 'Erro ao excluir' });
    } finally {
        setIsSaving(false);
    }
  }, [firestore, user]);

  const handleFormSubmit = useCallback(async (formData: any) => {
    if (!firestore || !user) return;
    setIsSaving(true);
    
    try {
        const isEdit = sheetMode === 'edit' && selectedProposal?.id;
        const docId = isEdit ? selectedProposal.id : doc(collection(firestore, 'loanProposals')).id;
        const docRef = doc(firestore, 'loanProposals', docId);
        
        const { customer, ...restOfData } = formData;

        const finalData = cleanFirestoreData({ 
            ...restOfData, 
            id: docId, 
            ownerId: user.uid 
        });
        
        await setDoc(docRef, finalData, { merge: true });
        toast({ title: isEdit ? 'Proposta Atualizada!' : 'Proposta Salva!' });
        
        setIsDialogOpen(false);
        setSelectedProposal(undefined);
        setSheetMode('new');
    } catch (error: any) {
        console.error("Save error:", error);
        toast({ variant: 'destructive', title: 'Erro ao salvar', description: 'Verifique sua conexão ou permissões.' });
    } finally {
        setIsSaving(false);
    }
  }, [firestore, user, sheetMode, selectedProposal]);

  const handleAiFormSubmit = useCallback((aiData: any) => {
    setNewlySelectedCustomer(aiData);
    setIsAiModalOpen(false);
    handleNewProposal();
  }, [handleNewProposal]);

  const columns = useMemo(() => getColumns(
    handleEditProposal, 
    handleViewProposal, 
    handleMoveToTrash, 
    handleStatusChange, 
    handleDuplicateProposal,
    handleToggleChecklist
  ), [handleEditProposal, handleViewProposal, handleMoveToTrash, handleStatusChange, handleDuplicateProposal, handleToggleChecklist]);

  const initialSearchFromUrl = searchParams.get('search') || '';

  React.useEffect(() => {
    if (isLoading || proposalsWithCustomerData.length === 0) return;
    const action = searchParams.get('action');
    const openId = searchParams.get('open');
    if (!hasOpenedFromParam) {
        if (action === 'new') { handleNewProposal(); setHasOpenedFromParam(true); router.replace('/proposals', { scroll: false }); }
        else if (openId) {
            const proposalToOpen = proposalsWithCustomerData.find(p => p.id === openId);
            if (proposalToOpen) { handleEditProposal(proposalToOpen); setHasOpenedFromParam(true); }
        }
    }
  }, [isLoading, proposalsWithCustomerData, hasOpenedFromParam, handleNewProposal, handleEditProposal, router, searchParams]);

  return (
    <>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
        <PageHeader title="Propostas" />
        <div className="flex items-center gap-3 flex-wrap">
            <Button variant="outline" className="h-10 px-6 rounded-full font-bold border-border/50 hover:bg-muted/50 transition-all text-xs" onClick={() => setIsAiModalOpen(true)}>
                <Sparkles className="h-4 w-4 mr-2" /> Novo Cliente com IA
            </Button>

            {selectedCount > 0 && (
                <div className="flex items-center gap-2 animate-in slide-in-from-right-2 duration-300">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" className="h-10 px-6 rounded-full font-bold text-xs gap-2 text-primary border-primary/20 bg-primary/5" disabled={isSaving}>
                                <FileBadge className="h-4 w-4" /> Capas ({selectedCount}) <ChevronDown className="ml-2 h-3 w-3" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onSelect={() => {}}>Imprimir (Visualizar)</DropdownMenuItem>
                            <DropdownMenuItem onSelect={() => {}}>Exportar (Baixar PDF)</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" className="h-10 px-6 rounded-full font-bold border-primary/30 bg-primary/5 text-primary text-xs" disabled={isSaving}>
                                <CheckCircle2 className="mr-2 h-4 w-4" /> Alterar Status ({selectedCount}) <ChevronDown className="ml-2 h-3 w-3" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            {['Pendente', 'Em Andamento', 'Aguardando Saldo', 'Pago', 'Saldo Pago'].map(s => (
                                <DropdownMenuItem key={s} onSelect={() => handleBulkStatusChange(s as ProposalStatus)}>{s}</DropdownMenuItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>
                    <Button variant="destructive" className="h-10 px-6 rounded-full font-bold text-xs" onClick={() => handleBulkStatusChange('Reprovado')} disabled={isSaving}>
                        <Trash2 className="mr-2 h-4 w-4" /> Cancelar
                    </Button>
                </div>
            )}

            <Button onClick={handleNewProposal} className="h-10 px-8 rounded-full font-bold bg-[#00AEEF] hover:bg-[#0096D1] text-white shadow-lg text-xs">
                <PlusCircle className="mr-2 h-4 w-4" /> Nova Proposta
            </Button>
        </div>
      </div>

      <div className="space-y-6">
        <ProposalsDataTable 
            ref={tableRef}
            columns={columns} 
            data={proposalsWithCustomerData}
            rowSelection={rowSelection}
            setRowSelection={setRowSelection}
            onBulkStatusChange={handleBulkStatusChange} 
            userSettings={userSettings || null}
            initialGlobalFilter={initialSearchFromUrl}
        />
        {proposalsWithCustomerData.length >= loadLimit && !proposalsLoading && (
            <div className="flex justify-center pb-10">
                <Button variant="outline" onClick={() => setLoadLimit(prev => prev + 1000)} className="rounded-full h-12 px-10 font-bold uppercase text-[10px] border-2">
                    Carregar Próximas Propostas <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
            </div>
        )}
      </div>

      <Dialog open={isAiModalOpen} onOpenChange={setIsAiModalOpen}>
        <DialogContent className="max-w-xl">
            <DialogHeader>
                <DialogTitle>Extração de Dados com IA</DialogTitle>
                <DialogDescription>A IA processará seu documento ou texto para preencher os dados do cliente automaticamente.</DialogDescription>
            </DialogHeader>
            <CustomerAiForm onSubmit={handleAiFormSubmit} />
        </DialogContent>
      </Dialog>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl w-[95vw] h-[90vh] flex flex-col p-0 overflow-hidden rounded-[2rem] border-none shadow-2xl">
          <DialogHeader className="px-8 pt-8 pb-4 shrink-0 bg-muted/5 border-b">
            <DialogTitle className="text-xl font-black uppercase text-primary">
                {sheetMode === 'edit' ? 'Editar Registro' : sheetMode === 'view' ? 'Detalhes' : 'Cadastrar Proposta'}
            </DialogTitle>
            <DialogDescription className="sr-only">Formulário para gerenciamento de propostas bancárias</DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-hidden">
            <ProposalForm key={formKey} onSubmit={handleFormSubmit} proposal={selectedProposal} allProposals={proposals || []} customers={customers || []} userSettings={userSettings || null} isReadOnly={sheetMode === 'view'} defaultValues={defaultValues} sheetMode={sheetMode} onOpenCustomerSearch={() => setIsCustomerSearchOpen(true)} selectedCustomerFromSearch={newlySelectedCustomer} onCustomerSearchSelectionHandled={handleCustomerSearchSelectionHandled} isSaving={isSaving} />
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isCustomerSearchOpen} onOpenChange={setIsCustomerSearchOpen}>
        <DialogContent className="max-w-2xl overflow-hidden rounded-[2rem] p-0">
            <DialogHeader className="px-8 pt-8 pb-2">
                <DialogTitle className="text-xl font-black uppercase text-primary">Buscar Cliente na Base</DialogTitle>
                <DialogDescription className="text-xs">Localize o cliente pelo nome, ID ou CPF para vincular à nova proposta.</DialogDescription>
            </DialogHeader>
            <div className="px-8 pb-8"><CustomerSearchDialog customers={customers?.filter(c => c.name !== 'Cliente Removido' && c.deleted !== true) || []} onSelectCustomer={handleCustomerSelect} /></div>
        </DialogContent>
      </Dialog>
    </>
  );
}

export type ProposalWithCustomer = Proposal & { customer: Customer | undefined };

export default function ProposalsPage() {
    return (
        <AppLayout>
            <Suspense fallback={<ProposalsPageSkeleton />}>
                <ProposalsPageContent />
            </Suspense>
        </AppLayout>
    )
}
