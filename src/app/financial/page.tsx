'use client';
import React from 'react';
import { AppLayout } from '@/components/app-layout';
import { PageHeader } from '@/components/page-header';
import { FinancialDataTable } from './data-table';
import { getColumns } from './columns';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, doc } from 'firebase/firestore';
import type { Proposal, Customer } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Eye, EyeOff, Printer, FileCheck2 } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
  } from '@/components/ui/dialog';
import { CommissionForm } from './commission-form';
import { toast } from '@/hooks/use-toast';
import { setDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Logo } from '@/components/logo';
import { CommissionReconciliation } from '@/components/financial/commission-reconciliation';

export type ProposalWithCustomer = Proposal & { customer: Customer | undefined };

export default function FinancialPage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const [isPrivacyMode, setIsPrivacyMode] = React.useState(false);
  const [isSheetOpen, setIsSheetOpen] = React.useState(false);
  const [isReconciliationOpen, setIsReconciliationOpen] = React.useState(false);
  const [selectedProposal, setSelectedProposal] = React.useState<ProposalWithCustomer | undefined>(undefined);

  const proposalsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, 'loanProposals'), where('userId', '==', user.uid));
  }, [firestore, user]);

  const customersQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, 'customers'), where('userId', '==', user.uid));
  }, [firestore, user]);

  const { data: proposals, isLoading: proposalsLoading } = useCollection<Proposal>(proposalsQuery);
  const { data: customers, isLoading: customersLoading } = useCollection<Customer>(customersQuery);

  const proposalsWithCustomerData: ProposalWithCustomer[] = React.useMemo(() => {
    if (!proposals || !customers) return [];
    const customersMap = new Map(customers.map(c => [c.id, c]));
    return proposals.map(p => ({
      ...p,
      customer: customersMap.get(p.customerId),
    })).filter(p => p.customer); // Filter out proposals with no customer
  }, [proposals, customers]);

  const isLoading = proposalsLoading || customersLoading || isUserLoading;

  const handleEditCommission = (proposal: ProposalWithCustomer) => {
    setSelectedProposal(proposal);
    setIsSheetOpen(true);
  };
  
  const handleFormSubmit = (data: Partial<Proposal>) => {
    if (!firestore || !selectedProposal) return;
  
    const proposalToUpdate: Partial<Proposal> = {
      commissionStatus: data.commissionStatus,
      amountPaid: data.amountPaid,
      commissionPaymentDate: data.commissionPaymentDate ? new Date(data.commissionPaymentDate).toISOString() : undefined,
    };
  
    setDocumentNonBlocking(doc(firestore, 'loanProposals', selectedProposal.id), proposalToUpdate, { merge: true });
    
    toast({
      title: 'Comissão Atualizada!',
      description: `Os dados financeiros da proposta foram atualizados.`,
    });
  
    setIsSheetOpen(false);
  };

  const handleReconciliationComplete = () => {
    setIsReconciliationOpen(false);
    // Here you could trigger a re-fetch of the data or rely on the real-time updates
    toast({
      title: "Conciliação Finalizada",
      description: "O processo de conciliação foi concluído."
    })
  }

  const handlePrint = () => {
    window.print();
  }

  const columns = React.useMemo(() => getColumns({ onEdit: handleEditCommission }), []);

  return (
    <AppLayout>
      <div className="flex items-center justify-between print:hidden">
        <PageHeader title="Controle Financeiro" />
        <div className="flex items-center gap-2">
            <Dialog open={isReconciliationOpen} onOpenChange={setIsReconciliationOpen}>
                <DialogTrigger asChild>
                    <Button variant="outline">
                        <FileCheck2 />
                        Conciliar Relatórios
                    </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl">
                    <DialogHeader>
                        <DialogTitle>Conciliação de Comissões com IA</DialogTitle>
                    </DialogHeader>
                    <CommissionReconciliation 
                        proposals={proposalsWithCustomerData} 
                        onFinished={handleReconciliationComplete}
                    />
                </DialogContent>
            </Dialog>
            <Button variant="ghost" size="icon" onClick={() => setIsPrivacyMode(!isPrivacyMode)}>
            {isPrivacyMode ? <EyeOff /> : <Eye />}
            <span className="sr-only">{isPrivacyMode ? 'Mostrar valores' : 'Ocultar valores'}</span>
            </Button>
            <Button onClick={handlePrint}><Printer /> Imprimir Relatório</Button>
        </div>
      </div>
      <div className="print:block hidden mb-8">
        <Logo forPrinting={true} />
        <p className="text-sm text-gray-500 mt-2">
            Relatório gerado em: {format(new Date(), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
        </p>
      </div>

       <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent className="w-full max-w-md">
          <SheetHeader>
            <SheetTitle>Editar Comissão</SheetTitle>
          </SheetHeader>
          <CommissionForm
            proposal={selectedProposal}
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
        <FinancialDataTable 
            columns={columns} 
            data={proposalsWithCustomerData}
            isPrivacyMode={isPrivacyMode} 
        />
      )}
    </AppLayout>
  );
}
