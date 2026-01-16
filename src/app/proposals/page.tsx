'use client';
import React from 'react';
import { AppLayout } from '@/components/app-layout';
import { PageHeader } from '@/components/page-header';
import { ProposalsDataTable } from './data-table';
import { getColumns } from './columns';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { ProposalForm } from './proposal-form';
import type { Proposal, Customer, ProposalStatus } from '@/lib/types';
import { toast } from '@/hooks/use-toast';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, doc, query, where, deleteDoc, writeBatch } from 'firebase/firestore';
import {
  setDocumentNonBlocking,
} from '@/firebase/non-blocking-updates';
import { Skeleton } from '@/components/ui/skeleton';
import { parse } from 'date-fns';

export type ProposalWithCustomer = Proposal & { customer: Customer | undefined };
type ProposalFormData = Partial<Omit<Proposal, 'id' | 'userId'>>;

export default function ProposalsPage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();

  const [isSheetOpen, setIsSheetOpen] = React.useState(false);
  const [selectedProposal, setSelectedProposal] = React.useState<ProposalWithCustomer | undefined>(undefined);
  const [sheetMode, setSheetMode] = React.useState<'new' | 'edit' | 'view'>('new');
  const [rowSelection, setRowSelection] = React.useState({});
  const [defaultValues, setDefaultValues] = React.useState<ProposalFormData | undefined>(undefined);
  
  const proposalsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, 'loanProposals'), where('userId', '==', user.uid));
  }, [firestore, user]);

  const customersQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, 'customers'), where('userId', '==', user.uid), where('name', '!=', 'Cliente Removido'));
  }, [firestore, user]);
  
  const { data: proposals, isLoading: proposalsLoading } = useCollection<Proposal>(proposalsQuery);
  const { data: customers, isLoading: customersLoading } = useCollection<Customer>(customersQuery);

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
    setIsSheetOpen(true);
  }, []);

  const handleEditProposal = React.useCallback((proposal: ProposalWithCustomer) => {
    setSelectedProposal(proposal);
    setDefaultValues(undefined);
    setSheetMode('edit');
    setIsSheetOpen(true);
  }, []);

  const handleViewProposal = React.useCallback((proposal: ProposalWithCustomer) => {
    setSelectedProposal(proposal);
    setDefaultValues(undefined);
    setSheetMode('view');
    setIsSheetOpen(true);
  }, []);
  
  const handleDuplicateProposal = React.useCallback((proposal: ProposalWithCustomer) => {
    const { id, proposalNumber, status, ...rest } = proposal;
    const duplicatedData: ProposalFormData = {
        ...rest,
        // Limpe campos que devem ser únicos ou redefinidos
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
    setIsSheetOpen(true);
}, []);

  const handleDeleteProposal = React.useCallback(async (proposalId: string) => {
    if (!firestore) return;
    try {
      await deleteDoc(doc(firestore, 'loanProposals', proposalId));
      toast({
        title: 'Proposta Cancelada!',
        description: 'A proposta foi cancelada e removida com sucesso.',
      });
    } catch (error) {
        toast({
            variant: 'destructive',
            title: 'Erro ao cancelar',
            description: 'Não foi possível remover a proposta. Tente novamente.',
        });
        console.error('Error deleting proposal: ', error);
    }
  }, [firestore]);

  const handleStatusChange = React.useCallback((proposalId: string, newStatus: ProposalStatus) => {
    if (!firestore) return;
    setDocumentNonBlocking(doc(firestore, 'loanProposals', proposalId), { status: newStatus }, { merge: true });
    toast({
        title: 'Status Atualizado!',
        description: `O status da proposta foi alterado para "${newStatus}".`,
    });
  }, [firestore]);

  const handleBulkStatusChange = React.useCallback(async (newStatus: ProposalStatus) => {
    if (!firestore) return;
    const selectedIds = Object.keys(rowSelection);
    if (selectedIds.length === 0) return;

    const batch = writeBatch(firestore);
    selectedIds.forEach((id) => {
      const docRef = doc(firestore, 'loanProposals', id);
      batch.update(docRef, { status: newStatus });
    });

    try {
      await batch.commit();
      toast({
        title: 'Status Atualizado em Massa!',
        description: `${selectedIds.length} proposta(s) foram atualizadas para "${newStatus}".`,
      });
      setRowSelection({}); // Limpa a seleção após a atualização
    } catch (error) {
      console.error('Error updating statuses in bulk:', error);
      toast({
        variant: 'destructive',
        title: 'Erro ao atualizar',
        description: 'Ocorreu um erro ao atualizar o status das propostas.',
      });
    }
  }, [firestore, rowSelection]);


  const handleFormSubmit = (data: Omit<Proposal, 'id' | 'userId'>) => {
    if (!firestore || !user) return;
  
    const toISOString = (dateString?: string) => {
        if (!dateString) return undefined;
        try {
            const parsed = parse(dateString, 'dd/MM/yyyy', new Date());
            return !isNaN(parsed.getTime()) ? parsed.toISOString() : undefined;
        } catch {
            return undefined;
        }
    };
    
    if (sheetMode === 'edit' && selectedProposal) {
      const proposalToUpdate: Partial<Proposal> = {
        ...data,
        dateDigitized: toISOString(data.dateDigitized),
        dateApproved: toISOString(data.dateApproved),
        datePaidToClient: toISOString(data.datePaidToClient),
        debtBalanceArrivalDate: toISOString(data.debtBalanceArrivalDate),
      };
      setDocumentNonBlocking(doc(firestore, 'loanProposals', selectedProposal.id), proposalToUpdate, { merge: true });
      toast({
        title: 'Proposta Atualizada!',
        description: `A proposta foi atualizada com sucesso.`,
      });
    } else {
      const newDocRef = doc(collection(firestore, 'loanProposals'));
      const newProposal: Omit<Proposal, 'id'> = {
        ...data,
        userId: user.uid,
        dateDigitized: toISOString(data.dateDigitized) || new Date().toISOString(),
        dateApproved: toISOString(data.dateApproved),
        datePaidToClient: toISOString(data.datePaidToClient),
        debtBalanceArrivalDate: toISOString(data.debtBalanceArrivalDate),
      };
      const newProposalWithId = { ...newProposal, id: newDocRef.id };
  
      setDocumentNonBlocking(newDocRef, newProposalWithId, {});
      toast({
        title: 'Proposta Salva!',
        description: `A nova proposta foi criada com sucesso.`,
      });
    }
    setIsSheetOpen(false);
  };

  const getSheetTitle = () => {
    if (sheetMode === 'new') return 'Nova Proposta';
    if (sheetMode === 'edit') return 'Editar Proposta';
    return 'Detalhes da Proposta';
  };

  const isLoading = proposalsLoading || customersLoading || isUserLoading;

  const columns = React.useMemo(() => getColumns(handleEditProposal, handleViewProposal, handleDeleteProposal, handleStatusChange), [handleEditProposal, handleViewProposal, handleDeleteProposal, handleStatusChange]);


  return (
    <AppLayout>
      <div className="flex items-center justify-between">
        <PageHeader title="Propostas" />
        <Button onClick={handleNewProposal}>
          <PlusCircle />
          Nova Proposta
        </Button>
      </div>
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent className="w-full max-w-3xl sm:max-w-3xl">
          <SheetHeader>
            <SheetTitle>{getSheetTitle()}</SheetTitle>
          </SheetHeader>
          <ProposalForm 
            proposal={selectedProposal} 
            customers={customers || []}
            isReadOnly={sheetMode === 'view'}
            onSubmit={handleFormSubmit}
            onDuplicate={handleDuplicateProposal}
            defaultValues={defaultValues}
            sheetMode={sheetMode}
          />
        </SheetContent>
      </Sheet>
      {isLoading ? (
        <div className="rounded-md border p-4">
            <div className="space-y-2">
              <Skeleton className="h-10 w-full" />
              {Array.from({ length: 10 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
        </div>
      ) : (
        <ProposalsDataTable 
            columns={columns} 
            data={proposalsWithCustomerData}
            rowSelection={rowSelection}
            setRowSelection={setRowSelection}
            onBulkStatusChange={handleBulkStatusChange}
        />
      )}
    </AppLayout>
  );
}
