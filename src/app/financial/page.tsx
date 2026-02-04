
'use client';
import React from 'react';
import { AppLayout } from '@/components/app-layout';
import { PageHeader } from '@/components/page-header';
import { FinancialDataTable, type FinancialDataTableHandle } from './data-table';
import { getColumns } from './columns';
import { useUser, useFirestore, useCollection, useMemoFirebase, useDoc } from '@/firebase';
import { collection, query, where, doc, setDoc, deleteField } from 'firebase/firestore';
import type { Proposal, Customer, CommissionStatus } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Eye, EyeOff, Printer, FileCheck2, FileDown, FileBadge, BarChart3, Calendar } from 'lucide-react';
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
    DialogFooter,
    DialogDescription,
    DialogTrigger,
  } from '@/components/ui/dialog';
import { CommissionForm, type CommissionFormValues } from './commission-form';
import { toast } from '@/hooks/use-toast';
import { format, startOfMonth, endOfMonth, parse, subMonths, getYear, getMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CommissionReconciliation } from '@/components/financial/commission-reconciliation';
import { formatCurrency } from '@/lib/utils';
import { ProposalsStatusTable } from '@/components/dashboard/proposals-status-table';
import { PromoterEfficiencyReport } from '@/components/financial/promoter-efficiency-report';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';


export type ProposalWithCustomer = Proposal & { customer: Customer | undefined };

const MONTHS = [
    { value: "0", label: "Janeiro" },
    { value: "1", label: "Fevereiro" },
    { value: "2", label: "Março" },
    { value: "3", label: "Abril" },
    { value: "4", label: "Maio" },
    { value: "5", label: "Junho" },
    { value: "6", label: "Julho" },
    { value: "7", label: "Agosto" },
    { value: "8", label: "Setembro" },
    { value: "9", label: "Outubro" },
    { value: "10", label: "Novembro" },
    { value: "11", label: "Dezembro" },
];

export default function FinancialPage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const [isPrivacyMode, setIsPrivacyMode] = React.useState(false);
  const [isSheetOpen, setIsSheetOpen] = React.useState(false);
  const [isReconciliationOpen, setIsReconciliationOpen] = React.useState(false);
  const [isEfficiencyOpen, setIsEfficiencyOpen] = React.useState(false);
  const [isReportDialogOpen, setIsReportDialogOpen] = React.useState(false);
  
  const [reportMonth, setReportMonth] = React.useState(getMonth(new Date()).toString());
  const [reportYear, setReportYear] = React.useState(getYear(new Date()).toString());

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

    const filteredProposals = proposals.filter(p => p.status !== 'Reprovado');

    const tableData = filteredProposals
      .map(p => ({
        ...p,
        customer: customersMap.get(p.customerId),
      }))
      .filter(p => p.customer);

    return { 
      proposalsWithCustomerData: tableData as ProposalWithCustomer[], 
      summaryProposals: tableData as ProposalWithCustomer[],
      currentMonthRange: { from: startOfCurrent, to: endOfCurrent }
    };
  }, [proposals, customers, isClient]);

  const handleGenerateMonthlyReport = async () => {
    const targetMonth = parseInt(reportMonth);
    const targetYear = parseInt(reportYear);

    const reportProposals = summaryProposals.filter(p => {
        const d = new Date(p.dateDigitized);
        return d.getMonth() === targetMonth && d.getFullYear() === targetYear;
    });

    if (reportProposals.length === 0) {
        toast({
            variant: "destructive",
            title: "Sem dados para o período",
            description: "Nenhuma proposta encontrada para o mês selecionado."
        });
        return;
    }

    const { default: jsPDF } = await import('jspdf');
    const { default: autoTable } = await import('jspdf-autotable');

    const doc = new jsPDF();
    const targetDate = new Date(targetYear, targetMonth, 1);
    const monthYear = format(targetDate, "MMMM 'de' yyyy", { locale: ptBR });

    doc.setFontSize(20);
    doc.setTextColor(40, 74, 127);
    doc.text("Relatório de Fechamento Mensal", 14, 20);
    doc.setFontSize(12);
    doc.setTextColor(100);
    doc.text(`Período de Competência: ${monthYear}`, 14, 28);
    doc.text(`Gerado em: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, 14, 34);

    const totalComissao = reportProposals.reduce((sum, p) => sum + (p.commissionValue || 0), 0);
    const recebido = reportProposals.filter(p => p.commissionStatus === 'Paga').reduce((sum, p) => sum + (p.amountPaid || 0), 0);
    const pendente = reportProposals.filter(p => p.commissionStatus !== 'Paga').reduce((sum, p) => sum + (p.commissionValue || 0), 0);

    doc.setDrawColor(200);
    doc.line(14, 40, 196, 40);

    doc.setFontSize(14);
    doc.setTextColor(0);
    doc.text("Resumo Financeiro do Período", 14, 50);
    
    autoTable(doc, {
        startY: 55,
        head: [['Métrica', 'Valor']],
        body: [
            ['Comissões Digitadas no Mês', formatCurrency(totalComissao)],
            ['Comissões Já Recebidas', formatCurrency(recebido)],
            ['Saldo Pendente/Esperado', formatCurrency(pendente)],
        ],
        theme: 'striped',
        headStyles: { fillColor: [40, 74, 127] },
    });

    // Ranking de Operadores
    const operatorRanking: Record<string, { count: number; volume: number }> = {};
    reportProposals.forEach(p => {
        const op = p.operator || 'Sem Operador';
        if (!operatorRanking[op]) operatorRanking[op] = { count: 0, volume: 0 };
        operatorRanking[op].count++;
        operatorRanking[op].volume += p.grossAmount || 0;
    });

    const rankingRows = Object.entries(operatorRanking)
        .sort((a, b) => b[1].volume - a[1].volume)
        .map(([name, stats]) => [name, stats.count, formatCurrency(stats.volume)]);

    doc.text("Ranking de Performance (Mês)", 14, (doc as any).lastAutoTable.finalY + 15);
    autoTable(doc, {
        startY: (doc as any).lastAutoTable.finalY + 20,
        head: [['Operador', 'Qtd. Contratos', 'Volume Bruto']],
        body: rankingRows,
        theme: 'grid',
        headStyles: { fillColor: [70, 70, 70] }, // Zinc
        styles: { fontSize: 9 }
    });

    doc.text("Detalhamento das Propostas Digitadas", 14, (doc as any).lastAutoTable.finalY + 15);

    const tableRows = reportProposals.map(p => [
        p.customer?.name || '-',
        p.proposalNumber,
        p.product,
        formatCurrency(p.grossAmount),
        formatCurrency(p.commissionValue),
        p.status
    ]);

    autoTable(doc, {
        startY: (doc as any).lastAutoTable.finalY + 20,
        head: [['Cliente', 'Nº Proposta', 'Produto', 'Vlr. Bruto', 'Comissão', 'Status Prop.']],
        body: tableRows,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [40, 74, 127] },
    });

    doc.save(`Fechamento_${monthYear.replace(/\s+/g, '_')}.pdf`);
    
    toast({
        title: "Relatório Gerado!",
        description: `O fechamento de ${monthYear} foi baixado com sucesso.`
    });
    setIsReportDialogOpen(false);
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
    if (!firestore || !proposal.customer || !user) return;
  
    const proposalToUpdate: Partial<Proposal> = {
      commissionStatus: newStatus,
      ownerId: user.uid
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
  }, [firestore, user])

  const handleFormSubmit = async (data: CommissionFormValues) => {
    if (!firestore || !selectedProposal || !user) return;
  
    const proposalToUpdate: Partial<Proposal> = {
      commissionStatus: data.commissionStatus as CommissionStatus,
      amountPaid: data.amountPaid,
      commissionPaymentDate: data.commissionPaymentDate
        ? parse(data.commissionPaymentDate, 'dd/MM/yyyy', new Date()).toISOString()
        : undefined,
      ownerId: user.uid
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

  const handlePrint = React.useCallback(() => {
    const hasSelection = Object.keys(rowSelection).length > 0;
    if (hasSelection) {
        document.body.classList.add('print-selection');
    }
    
    const handleAfterPrint = () => {
        if (hasSelection) {
            document.body.classList.remove('print-selection');
        }
        window.removeEventListener('afterprint', handleAfterPrint);
    };

    window.addEventListener('afterprint', handleAfterPrint);
    window.print();
  }, [rowSelection]);

  const columns = React.useMemo(() => getColumns({ onEdit: handleEditCommission, onStatusUpdate: handleCommissionStatusUpdate }), [handleEditCommission, handleCommissionStatusUpdate]);

  const reportYears = React.useMemo(() => {
      const current = getYear(new Date());
      return [current - 1, current, current + 1].map(String);
  }, []);

  return (
    <AppLayout>
      <div className="flex items-center justify-between print:hidden">
        <PageHeader title="Controle Financeiro" />
        <div className="flex items-center gap-2">
            <Dialog open={isEfficiencyOpen} onOpenChange={setIsEfficiencyOpen}>
                <DialogTrigger asChild>
                    <Button variant="outline">
                        <BarChart3 className="mr-2 h-4 w-4" />
                        Relatório de Eficiência
                    </Button>
                </DialogTrigger>
                <DialogContent className="max-w-5xl h-[90vh] flex flex-col">
                    <DialogHeader>
                        <DialogTitle>Análise de Eficiência por Parceiro</DialogTitle>
                    </DialogHeader>
                    <div className="flex-1 overflow-y-auto">
                        <PromoterEfficiencyReport proposals={summaryProposals} />
                    </div>
                </DialogContent>
            </Dialog>

            <Dialog open={isReportDialogOpen} onOpenChange={setIsReportDialogOpen}>
                <DialogTrigger asChild>
                    <Button variant="outline">
                        <FileBadge className="mr-2 h-4 w-4" />
                        Fechamento Mensal (PDF)
                    </Button>
                </DialogTrigger>
                <DialogContent className="max-w-sm">
                    <DialogHeader>
                        <DialogTitle>Configurar Fechamento</DialogTitle>
                        <DialogDescription>Escolha o período do relatório de competência.</DialogDescription>
                    </DialogHeader>
                    <div className="grid grid-cols-2 gap-4 py-4">
                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase text-muted-foreground">Mês</label>
                            <Select value={reportMonth} onValueChange={setReportMonth}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Mês" />
                                </SelectTrigger>
                                <SelectContent>
                                    {MONTHS.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase text-muted-foreground">Ano</label>
                            <Select value={reportYear} onValueChange={setReportYear}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Ano" />
                                </SelectTrigger>
                                <SelectContent>
                                    {reportYears.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsReportDialogOpen(false)}>Cancelar</Button>
                        <Button onClick={handleGenerateMonthlyReport}>
                            <FileDown className="mr-2 h-4 w-4" />
                            Gerar Relatório
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

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
                        proposals={summaryProposals} 
                        onFinished={() => setIsReconciliationOpen(false)}
                    />
                </DialogContent>
            </Dialog>
            <Button variant="ghost" size="icon" onClick={() => setIsPrivacyMode(!isPrivacyMode)}>
                {isPrivacyMode ? <EyeOff /> : <Eye />}
            </Button>
            <Button onClick={handlePrint}><Printer /> Imprimir</Button>
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
