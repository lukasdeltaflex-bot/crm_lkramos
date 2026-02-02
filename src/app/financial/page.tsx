'use client';
import React from 'react';
import { AppLayout } from '@/components/app-layout';
import { PageHeader } from '@/components/page-header';
import { FinancialDataTable, type FinancialDataTableHandle } from './data-table';
import { getColumns } from './columns';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, doc, setDoc, deleteField } from 'firebase/firestore';
import type { Proposal, Customer, CommissionStatus } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Eye, EyeOff, Printer, FileCheck2, FileDown, FileBadge } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { CommissionForm, type CommissionFormValues } from './commission-form';
import { toast } from '@/hooks/use-toast';
import { format, startOfMonth, endOfMonth, parse, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CommissionReconciliation } from '@/components/financial/commission-reconciliation';
import { formatCurrency } from '@/lib/utils';
import { ProposalsStatusTable } from '@/components/dashboard/proposals-status-table';


export type ProposalWithCustomer = Proposal & { customer: Customer | undefined };

export default function FinancialPage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const [isPrivacyMode, setIsPrivacyMode] = React.useState(false);
  const [isSheetOpen, setIsSheetOpen] = React.useState(false);
  const [isReconciliationOpen, setIsReconciliationOpen] = React.useState(false);
  const [selectedProposal, setSelectedProposal] = React.useState<ProposalWithCustomer | undefined>(undefined);
  const [isClient, setIsClient] = React.useState(false);
  const [rowSelection, setRowSelection] = React.useState({});
  const tableRef = React.useRef<FinancialDataTableHandle>(null);
  const [dialogData, setDialogData] = React.useState<{ title: string; proposals: ProposalWithCustomer[] } | null>(null);

  React.useEffect(() => {
    setIsClient(true);
  }, []);

  const proposalsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, 'loanProposals'), where('ownerId', '==', user.uid));
  }, [firestore, user]);

  const customersQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, 'customers'), where('ownerId', '==', user.uid));
  }, [firestore, user]);

  const { data: proposals, isLoading: proposalsLoading } = useCollection<Proposal>(proposalsQuery);
  const { data: customers, isLoading: customersLoading } = useCollection<Customer>(customersQuery);

  const { proposalsWithCustomerData, summaryProposals, currentMonthRange } = React.useMemo(() => {
    if (!proposals || !customers || !isClient) return { proposalsWithCustomerData: [], summaryProposals: [], currentMonthRange: { from: new Date(), to: new Date() } };
    
    const customersMap = new Map(customers.map(c => [c.id, c]));
    
    const today = new Date();
    const startOfCurrent = startOfMonth(today);
    const endOfCurrent = endOfMonth(today);
    const startOfPrev = startOfMonth(subMonths(today, 1));

    const tableData = proposals
      .filter(p => {
        if (p.commissionStatus === 'Paga') return true;
        const hasAverbacao = !!p.dateApproved;
        const status = p.status;
        const isSaldoAReceber = status === 'Pago' || 
                               (hasAverbacao && ['Em Andamento', 'Saldo Pago', 'Pendente'].includes(status));
        return isSaldoAReceber;
      })
      .map(p => ({
        ...p,
        customer: customersMap.get(p.customerId),
      }))
      .filter(p => p.customer);

    const summaryData = proposals
      .filter(p => {
        if (!p.dateDigitized) return false;
        const proposalDate = new Date(p.dateDigitized);
        return proposalDate >= startOfPrev && proposalDate <= endOfCurrent;
      })
      .map(p => ({
        ...p,
        customer: customersMap.get(p.customerId),
      }))
      .filter(p => p.customer);

    return { 
      proposalsWithCustomerData: tableData as ProposalWithCustomer[], 
      summaryProposals: summaryData as ProposalWithCustomer[],
      currentMonthRange: { from: startOfCurrent, to: endOfCurrent }
    };
  }, [proposals, customers, isClient]);

  const handleGenerateMonthlyReport = async () => {
    const { default: jsPDF } = await import('jspdf');
    const { default: autoTable } = await import('jspdf-autotable');

    const doc = new jsPDF();
    const monthYear = format(new Date(), "MMMM 'de' yyyy", { locale: ptBR });

    doc.setFontSize(20);
    doc.setTextColor(40, 74, 127);
    doc.text("Relatório de Fechamento Mensal", 14, 20);
    doc.setFontSize(12);
    doc.setTextColor(100);
    doc.text(`Período: ${monthYear}`, 14, 28);
    doc.text(`Gerado em: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, 14, 34);

    const totalComissao = summaryProposals.reduce((sum, p) => sum + (p.commissionValue || 0), 0);
    const recebido = summaryProposals.filter(p => p.commissionStatus === 'Paga').reduce((sum, p) => sum + (p.amountPaid || 0), 0);
    const pendente = summaryProposals.filter(p => {
        if (p.commissionStatus === 'Paga') return false;
        const hasAverbacao = !!p.dateApproved;
        return p.status === 'Pago' || (hasAverbacao && ['Em Andamento', 'Saldo Pago', 'Pendente'].includes(p.status));
    }).reduce((sum, p) => sum + (p.commissionValue || 0), 0);

    doc.setDrawColor(200);
    doc.line(14, 40, 196, 40);

    doc.setFontSize(14);
    doc.setTextColor(0);
    doc.text("Resumo Executivo (Acumulado)", 14, 50);
    
    autoTable(doc, {
        startY: 55,
        head: [['Métrica', 'Valor']],
        body: [
            ['Total de Comissões (Digitado)', formatCurrency(totalComissao)],
            ['Comissão Recebida', formatCurrency(recebido)],
            ['Saldo a Receber (Averbados)', formatCurrency(pendente)],
        ],
        theme: 'striped',
        headStyles: { fillColor: [40, 74, 127] },
    });

    doc.text("Detalhamento das Propostas", 14, (doc as any).lastAutoTable.finalY + 15);

    const tableRows = summaryProposals.map(p => [
        p.customer?.name || '-',
        p.proposalNumber,
        p.product,
        formatCurrency(p.grossAmount),
        formatCurrency(p.commissionValue),
        p.commissionStatus
    ]);

    autoTable(doc, {
        startY: (doc as any).lastAutoTable.finalY + 20,
        head: [['Cliente', 'Nº Proposta', 'Produto', 'Vlr. Bruto', 'Comissão', 'Status']],
        body: tableRows,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [40, 74, 127] },
    });

    doc.save(`Fechamento_Mensal_${format(new Date(), 'MM_yyyy')}.pdf`);
    
    toast({
        title: "Relatório Gerado!",
        description: "O PDF do fechamento mensal foi baixado com sucesso."
    });
  };

  const isLoading = proposalsLoading || customersLoading || isUserLoading;

  const handleShowDetails = (title: string, props: ProposalWithCustomer[]) => {
    if (!props || props.length === 0) {
        toast({
            title: 'Nenhum dado para exibir',
            description: `Não há propostas correspondentes para "${title}".`
        });
        return;
    }
    setDialogData({ title, proposals: props });
  };

  const handleEditCommission = React.useCallback((proposal: ProposalWithCustomer) => {
    setSelectedProposal(proposal);
    setIsSheetOpen(true);
  }, []);
  
  const handleCommissionStatusUpdate = React.useCallback(async (proposal: ProposalWithCustomer, newStatus: CommissionStatus) => {
    if (!firestore || !proposal.customer) return;
  
    const proposalToUpdate: Partial<Proposal> = {
      commissionStatus: newStatus,
    };

    if (newStatus === 'Paga') {
        proposalToUpdate.amountPaid = proposal.commissionValue;
        proposalToUpdate.commissionPaymentDate = new Date().toISOString();
    } else if (newStatus === 'Pendente') {
        proposalToUpdate.amountPaid = 0;
        proposalToUpdate.commissionPaymentDate = deleteField() as any;
    }
  
    try {
      await setDoc(doc(firestore, 'loanProposals', proposal.id), proposalToUpdate, { merge: true });
      toast({
        title: 'Status Atualizado!',
        description: `O status da comissão foi alterado para "${newStatus}".`,
      });
    } catch (error) {
      console.error('Error updating commission status:', error);
      toast({ variant: 'destructive', title: 'Erro ao Atualizar', description: 'Não foi possível atualizar o status da comissão.' });
    }
  }, [firestore])

  const handleFormSubmit = async (data: CommissionFormValues) => {
    if (!firestore || !selectedProposal) return;
  
    const proposalToUpdate: Partial<Proposal> = {
      commissionStatus: data.commissionStatus as CommissionStatus,
      amountPaid: data.amountPaid,
      commissionPaymentDate: data.commissionPaymentDate
        ? parse(data.commissionPaymentDate, 'dd/MM/yyyy', new Date()).toISOString()
        : undefined,
    };
  
    try {
      await setDoc(doc(firestore, 'loanProposals', selectedProposal.id), proposalToUpdate, { merge: true });
      toast({ title: 'Comissão Atualizada!', description: `Os dados financeiros foram salvos.` });
    } catch (error) {
      console.error('Error updating commission:', error);
      toast({ variant: 'destructive', title: 'Erro ao Atualizar', description: 'Falha ao salvar os dados.' });
    }
  
    setIsSheetOpen(false);
  };

  const columns = React.useMemo(() => getColumns({ onEdit: handleEditCommission, onStatusUpdate: handleCommissionStatusUpdate }), [handleEditCommission, handleCommissionStatusUpdate]);

  return (
    <AppLayout>
      <div className="flex items-center justify-between print:hidden">
        <PageHeader title="Controle Financeiro" />
        <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleGenerateMonthlyReport}>
                <FileBadge className="mr-2 h-4 w-4" />
                Fechamento Mensal (PDF)
            </Button>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="outline">
                        <FileDown />
                        Exportar
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuItem onSelect={() => tableRef.current?.table && import('xlsx').then(xlsx => {
                        const ws = xlsx.utils.json_to_sheet(proposalsWithCustomerData.map(p => ({
                            Cliente: p.customer?.name,
                            CPF: p.customer?.cpf,
                            Proposta: p.proposalNumber,
                            Valor: p.grossAmount,
                            Comissao: p.commissionValue,
                            Status: p.commissionStatus
                        })));
                        const wb = xlsx.utils.book_new();
                        xlsx.utils.book_append_sheet(wb, ws, 'Financeiro');
                        xlsx.writeFile(wb, 'financeiro.xlsx');
                    })}>
                        Exportar para Excel (.xlsx)
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
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
                        onFinished={() => setIsReconciliationOpen(false)}
                    />
                </DialogContent>
            </Dialog>
            <Button variant="ghost" size="icon" onClick={() => setIsPrivacyMode(!isPrivacyMode)}>
                {isPrivacyMode ? <EyeOff /> : <Eye />}
            </Button>
            <Button onClick={() => window.print()}><Printer /> Imprimir</Button>
        </div>
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

      <Dialog open={!!dialogData} onOpenChange={(isOpen) => !isOpen && setDialogData(null)}>
        <DialogContent className="max-w-4xl h-[90vh] flex flex-col">
            <DialogHeader>
                <DialogTitle>{dialogData?.title}</DialogTitle>
            </DialogHeader>
            <div className="flex-1 overflow-y-auto">
                <ProposalsStatusTable proposals={dialogData?.proposals || []} customers={customers || []} />
            </div>
        </DialogContent>
      </Dialog>

      {isLoading ? (
        <div className="space-y-4">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-[400px] w-full" />
        </div>
      ) : (
        <FinancialDataTable 
            ref={tableRef}
            columns={columns} 
            data={proposalsWithCustomerData}
            currentMonthData={summaryProposals}
            currentMonthRange={currentMonthRange}
            isPrivacyMode={isPrivacyMode} 
            rowSelection={rowSelection}
            setRowSelection={setRowSelection}
            onShowDetails={handleShowDetails}
        />
      )}
    </AppLayout>
  );
}