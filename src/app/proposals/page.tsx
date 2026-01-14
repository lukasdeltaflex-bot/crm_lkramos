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
import { collection, doc, query, where, deleteDoc } from 'firebase/firestore';
import {
  setDocumentNonBlocking,
} from '@/firebase/non-blocking-updates';
import { Skeleton } from '@/components/ui/skeleton';

export type ProposalWithCustomer = Proposal & { customer: Customer | undefined };

export default function ProposalsPage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();

  const [isSheetOpen, setIsSheetOpen] = React.useState(false);
  const [selectedProposal, setSelectedProposal] = React.useState<ProposalWithCustomer | undefined>(undefined);
  const [sheetMode, setSheetMode] = React.useState<'new' | 'edit' | 'view'>('new');
  
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

  const handleNewProposal = () => {
    setSelectedProposal(undefined);
    setSheetMode('new');
    setIsSheetOpen(true);
  };

  const handleEditProposal = (proposal: ProposalWithCustomer) => {
    setSelectedProposal(proposal);
    setSheetMode('edit');
    setIsSheetOpen(true);
  };

  const handleViewProposal = (proposal: ProposalWithCustomer) => {
    setSelectedProposal(proposal);
    setSheetMode('view');
    setIsSheetOpen(true);
  };

  const handleDeleteProposal = async (proposalId: string) => {
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
  }

  const handleStatusChange = (proposalId: string, newStatus: ProposalStatus) => {
    if (!firestore) return;
    setDocumentNonBlocking(doc(firestore, 'loanProposals', proposalId), { status: newStatus }, { merge: true });
    toast({
        title: 'Status Atualizado!',
        description: `O status da proposta foi alterado para "${newStatus}".`,
    });
  };

  const handleFormSubmit = (data: Omit<Proposal, 'id' | 'userId' | 'proposalNumber'> & { proposalNumber?: string }) => {
    if (!firestore || !user) return;
  
    // Helper to convert date to ISO string if it exists
    const toISO = (date: any) => (date ? new Date(date).toISOString() : undefined);
  
    if (sheetMode === 'edit' && selectedProposal) {
      const proposalToUpdate: Partial<Proposal> = {
        ...data,
        dateDigitized: toISO(data.dateDigitized) || selectedProposal.dateDigitized,
        dateApproved: toISO(data.dateApproved),
        datePaidToClient: toISO(data.datePaidToClient),
        debtBalanceArrivalDate: toISO(data.debtBalanceArrivalDate),
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
        proposalNumber: `PRO${Date.now()}`,
        dateDigitized: toISO(data.dateDigitized)!,
        dateApproved: toISO(data.dateApproved),
        datePaidToClient: toISO(data.datePaidToClient),
        debtBalanceArrivalDate: toISO(data.debtBalanceArrivalDate),
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

  const columns = React.useMemo(() => getColumns(handleEditProposal, handleViewProposal, handleDeleteProposal, handleStatusChange), [customers]);


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
        <ProposalsDataTable columns={columns} data={proposalsWithCustomerData} />
      )}
    </AppLayout>
  );
}
