
'use client';
import React from 'react';
import { AppLayout } from '@/components/app-layout';
import { PageHeader } from '@/components/page-header';
import { getProposalsWithCustomerData } from '@/lib/data';
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
import type { Proposal, Customer } from '@/lib/types';

type ProposalWithCustomer = Proposal & { customer: Customer };

export default function ProposalsPage() {
  const proposals = getProposalsWithCustomerData();
  const [isSheetOpen, setIsSheetOpen] = React.useState(false);
  const [selectedProposal, setSelectedProposal] = React.useState<ProposalWithCustomer | undefined>(undefined);
  const [sheetMode, setSheetMode] = React.useState<'new' | 'edit' | 'view'>('new');

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

  const handleCloseSheet = () => {
    setIsSheetOpen(false);
    setSelectedProposal(undefined);
  };

  const getSheetTitle = () => {
    if (sheetMode === 'new') return 'Nova Proposta';
    if (sheetMode === 'edit') return 'Editar Proposta';
    return 'Detalhes da Proposta';
  };

  const columns = getColumns(handleEditProposal, handleViewProposal);

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
        <SheetContent className="w-full max-w-2xl sm:w-3/4">
          <SheetHeader>
            <SheetTitle>{getSheetTitle()}</SheetTitle>
          </SheetHeader>
          <ProposalForm 
            proposal={selectedProposal} 
            isReadOnly={sheetMode === 'view'}
            onSubmit={handleCloseSheet} 
          />
        </SheetContent>
      </Sheet>
      <ProposalsDataTable columns={columns} data={proposals} />
    </AppLayout>
  );
}
