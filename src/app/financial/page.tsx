'use client';
import React from 'react';
import { AppLayout } from '@/components/app-layout';
import { PageHeader } from '@/components/page-header';
import { FinancialDataTable, type FinancialDataTableHandle } from './data-table';
import { getColumns } from './columns';
import { useUser, useFirestore, useCollection, useMemoFirebase, useDoc } from '@/firebase';
import { collection, query, where, doc, setDoc, deleteField, deleteDoc } from 'firebase/firestore';
import type { Proposal, Customer, CommissionStatus, UserSettings, Expense } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Eye, EyeOff, Printer, FileCheck2, FileDown, FileBadge, BarChart3, Users2, CircleDollarSign, PlusCircle, Wallet, ReceiptText } from 'lucide-react';
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
import { format, startOfMonth, endOfMonth, parse, getYear, getMonth, isSameMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CommissionReconciliation } from '@/components/financial/commission-reconciliation';
import { formatCurrency } from '@/lib/utils';
import { ProposalsStatusTable } from '@/components/dashboard/proposals-status-table';
import { PromoterEfficiencyReport } from '@/components/financial/promoter-efficiency-report';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ExpenseForm } from '@/components/financial/expense-form';
import { ExpenseTable } from '@/components/financial/expense-table';
import { expenseCategories as initialExpenseCategories } from '@/lib/config-data';
import { StatsCard } from '@/components/dashboard/stats-card';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';


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
  const [isOperatorsDialogOpen, setIsOperatorsDialogOpen] = React.useState(false);
  const [isExpenseFormOpen, setIsExpenseFormOpen] = React.useState(false);
  
  const [reportMonth, setReportMonth] = React.useState(getMonth(new Date()).toString());
  const [reportYear, setReportYear] = React.useState(getYear(new Date()).toString());

  const [selectedProposal, setSelectedProposal] = React.useState<ProposalWithCustomer | undefined>(undefined);
  const [selectedExpense, setSelectedExpense] = React.useState<Expense | undefined>(undefined);
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

  const expensesQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, 'users', user.uid, 'expenses'));
  }, [firestore, user]);

  const settingsDocRef = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return doc(firestore, 'userSettings', user.uid);
  }, [firestore, user]);

  const { data: proposals, isLoading: proposalsLoading } = useCollection<Proposal>(proposalsQuery);
  const { data: customers, isLoading: customersLoading } = useCollection<Customer>(customersQuery);
  const { data: expenses, isLoading: expensesLoading } = useCollection<Expense>(expensesQuery);
  const { data: userSettings } = useDoc<UserSettings>(settingsDocRef);

  const { proposalsWithCustomerData, summaryProposals, currentMonthRange, operatorStats } = React.useMemo(() => {
    if (!proposals || !customers || !isClient) return { proposalsWithCustomerData: [], summaryProposals: [], currentMonthRange: { from: new Date(), to: new Date() }, operatorStats: [] };
    
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

    // Estatísticas de Operadores
    const opMap: Record<string, { name: string; totalPaid: number; count: number; potential: number }> = {};
    tableData.forEach(p => {
        const op = p.operator || 'Sem Operador';
        if (!opMap[op]) opMap[op] = { name: op, totalPaid: 0, count: 0, potential: 0 };
        opMap[op].count++;
        opMap[op].potential += (p.commissionValue || 0);
        if (p.commissionStatus === 'Paga' || p.commissionStatus === 'Parcial') {
            opMap[op].totalPaid += (p.amountPaid || 0);
        }
    });

    const stats = Object.values(opMap).sort((a,b) => b.potential - a.potential);

    return { 
      proposalsWithCustomerData: tableData as ProposalWithCustomer[], 
      summaryProposals: tableData as ProposalWithCustomer[],
      currentMonthRange: { from: startOfCurrent, to: endOfCurrent },
      operatorStats: stats
    };
  }, [proposals, customers, isClient]);

  const totalExpensesAmount = React.useMemo(() => {
    if (!expenses) return 0;
    const now = new Date();
    return expenses
      .filter(e => {
          const d = new Date(e.date);
          return isSameMonth(d, now) && d.getFullYear() === now.getFullYear();
      })
      .reduce((sum, e) => sum + e.amount, 0);
  }, [expenses]);

  const handleGenerateMonthlyReport = async () => {
    const targetMonth = parseInt(reportMonth);
    const targetYear = parseInt(reportYear);

    const reportProposals = summaryProposals.filter(p => {
        const d = new Date(p.dateDigitized);
        return d.getMonth() === targetMonth && d.getFullYear() === targetYear;
    });

    const reportExpenses = (expenses || []).filter(e => {
        const d = new Date(e.date);
        return d.getMonth() === targetMonth && d.getFullYear() === targetYear;
    });

    if (reportProposals.length === 0 && reportExpenses.length === 0) {
        toast({
            variant: "destructive",
            title: "Sem dados para o período",
            description: "Nenhuma proposta ou despesa encontrada para o mês selecionado."
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
    doc.text("Fechamento Mensal & Balanço Empresarial", 14, 20);
    doc.setFontSize(12);
    doc.setTextColor(100);
    doc.text(`Período de Competência: ${monthYear}`, 14, 28);
    doc.text(`Gerado em: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, 14, 34);

    const totalComissaoDigitada = reportProposals.reduce((sum, p) => sum + (p.commissionValue || 0), 0);
    const recebido = reportProposals.filter(p => p.commissionStatus === 'Paga' || p.commissionStatus === 'Parcial').reduce((sum, p) => sum + (p.amountPaid || 0), 0);
    const pendente = reportProposals.reduce((sum, p) => sum + ((p.commissionValue || 0) - (p.amountPaid || 0)), 0);
    const totalDespesas = reportExpenses.reduce((sum, e) => sum + e.amount, 0);
    const lucroLiquido = recebido - totalDespesas;

    doc.setDrawColor(200);
    doc.line(14, 40, 196, 40);

    doc.setFontSize(14);
    doc.setTextColor(0);
    doc.text("Resumo Financeiro Executivo", 14, 50);
    
    autoTable(doc, {
        startY: 55,
        body: [
            ['Comissões Digitadas no Mês', formatCurrency(totalComissaoDigitada)],
            ['Comissões Efetivamente Recebidas (Entrada)', formatCurrency(recebido)],
            ['Despesas Totais do Período (Saída)', formatCurrency(totalDespesas)],
            ['LUCRO LÍQUIDO REAL (Entradas - Saídas)', { content: formatCurrency(lucroLiquido), styles: { fontStyle: 'bold', textColor: lucroLiquido >= 0 ? [22, 101, 52] : [185, 28, 28] } }],
            ['Saldo Pendente de Recebimento', formatCurrency(pendente)],
        ],
        theme: 'striped',
        headStyles: { fillColor: [40, 74, 127] },
    });

    const getSafeY = () => (doc as any).lastAutoTable ? (doc as any).lastAutoTable.finalY : 100;

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

    if (rankingRows.length > 0) {
        doc.text("Ranking de Performance (Mês)", 14, getSafeY() + 15);
        autoTable(doc, {
            startY: getSafeY() + 20,
            head: [['Operador', 'Qtd. Contratos', 'Volume Bruto']],
            body: rankingRows,
            theme: 'grid',
            headStyles: { fillColor: [70, 70, 70] },
            styles: { fontSize: 9 }
        });
    }

    if (reportProposals.length > 0) {
        doc.addPage();
        doc.text("Detalhamento das Propostas Digitadas", 14, 20);

        const tableRows = reportProposals.map(p => [
            p.customer?.name || '-',
            p.proposalNumber,
            p.product,
            formatCurrency(p.grossAmount),
            formatCurrency(p.commissionValue),
            p.status
        ]);

        autoTable(doc, {
            startY: 25,
            head: [['Cliente', 'Nº Proposta', 'Produto', 'Vlr. Bruto', 'Comissão', 'Status Prop.']],
            body: tableRows,
            styles: { fontSize: 8 },
            headStyles: { fillColor: [40, 74, 127] },
        });
    }

    if (reportExpenses.length > 0) {
        const lastY = getSafeY();
        const pageHeight = doc.internal.pageSize.height;
        
        if (lastY > pageHeight - 60) {
            doc.addPage();
            doc.text("Detalhamento de Despesas", 14, 20);
            autoTable(doc, {
                startY: 25,
                head: [['Data', 'Descrição', 'Categoria', 'Valor']],
                body: reportExpenses.map(e => [
                    format(new Date(e.date), 'dd/MM/yyyy'),
                    e.description,
                    e.category,
                    formatCurrency(e.amount)
                ]),
                styles: { fontSize: 8 },
                headStyles: { fillColor: [185, 28, 28] }, 
            });
        } else {
            doc.text("Detalhamento de Despesas", 14, lastY + 15);
            autoTable(doc, {
                startY: lastY + 20,
                head: [['Data', 'Descrição', 'Categoria', 'Valor']],
                body: reportExpenses.map(e => [
                    format(new Date(e.date), 'dd/MM/yyyy'),
                    e.description,
                    e.category,
                    formatCurrency(e.amount)
                ]),
                styles: { fontSize: 8 },
                headStyles: { fillColor: [185, 28, 28] }, 
            });
        }
    }

    doc.save(`Balanco_${monthYear.replace(/\s+/g, '_')}.pdf`);
    toast({ title: "Relatório Gerado!" });
    setIsReportDialogOpen(false);
  };

  const isLoading = proposalsLoading || customersLoading || isUserLoading || expensesLoading;

  const handleShowDetails = (title: string, props: ProposalWithCustomer[]) => {
    if (!props || props.length === 0) return;
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
  
    const docRef = doc(firestore, 'loanProposals', proposal.id);
    
    setDoc(docRef, proposalToUpdate, { merge: true })
        .catch(async (error) => {
            if (error.code === 'permission-denied') {
                errorEmitter.emit('permission-error', new FirestorePermissionError({
                    path: docRef.path,
                    operation: 'update',
                    requestResourceData: proposalToUpdate
                }));
            }
        });

    toast({ title: 'Status Atualizado!' });
  }, [firestore, user])

  const handleFormSubmit = async (data: CommissionFormValues) => {
    if (!firestore || !selectedProposal || !user) return;
  
    const proposalToUpdate: Partial<Proposal> = {
      commissionStatus: data.commissionStatus as CommissionStatus,
      amountPaid: data.amountPaid,
      commissionPaymentDate: data.commissionPaymentDate
        ? parse(data.commissionPaymentDate, 'dd/MM/yyyy', new Date()).toISOString()
        : (data.commissionStatus === 'Pendente' ? (deleteField() as any) : undefined),
      ownerId: user.uid
    };
  
    const docRef = doc(firestore, 'loanProposals', selectedProposal.id);
    setDoc(docRef, proposalToUpdate, { merge: true });
    toast({ title: 'Comissão Atualizada!' });
    setIsSheetOpen(false);
  };

  const handleExpenseSubmit = async (data: any) => {
    if (!firestore || !user) return;
    const expenseId = selectedExpense?.id || doc(collection(firestore, 'users', user.uid, 'expenses')).id;
    const expenseRef = doc(firestore, 'users', user.uid, 'expenses', expenseId);
    const expenseData = { ...data, id: expenseId, ownerId: user.uid };
    setDoc(expenseRef, expenseData, { merge: true });
    toast({ title: "Despesa Salva" });
    setIsExpenseFormOpen(false);
  };

  const handleExpenseDelete = async (id: string) => {
    if (!firestore || !user) return;
    deleteDoc(doc(firestore, 'users', user.uid, 'expenses', id));
    toast({ title: "Despesa Removida" });
  };

  const handlePrint = React.useCallback(() => {
    const hasSelection = Object.keys(rowSelection).length > 0;
    if (hasSelection) document.body.classList.add('print-selection');
    window.print();
    if (hasSelection) document.body.classList.remove('print-selection');
  }, [rowSelection]);

  const columns = React.useMemo(() => getColumns({ onEdit: handleEditCommission, onStatusUpdate: handleCommissionStatusUpdate }), [handleEditCommission, handleCommissionStatusUpdate]);

  return (
    <AppLayout>
      <div className="flex items-center justify-between print:hidden">
        <PageHeader title="Controle Financeiro & Fluxo" />
        <div className="flex items-center gap-2">
            <Dialog open={isOperatorsDialogOpen} onOpenChange={setIsOperatorsDialogOpen}>
                <DialogTrigger asChild>
                    <Button variant="outline" className="bg-primary/5 border-primary/20 text-primary">
                        <Users2 className="mr-2 h-4 w-4" />
                        Performance Operadores
                    </Button>
                </DialogTrigger>
                <DialogContent className="max-w-3xl">
                    <DialogHeader>
                        <DialogTitle>Extrato de Comissões por Operador</DialogTitle>
                    </DialogHeader>
                    <div className="py-4">
                        <ScrollArea className="h-[400px]">
                            <div className="space-y-4 pr-4">
                                {operatorStats.map((op) => (
                                    <Card key={op.name} className="overflow-hidden border-border/50">
                                        <div className="p-4 flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">{op.name.charAt(0).toUpperCase()}</div>
                                                <div>
                                                    <p className="font-bold text-sm">{op.name}</p>
                                                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest">{op.count} Propostas</p>
                                                </div>
                                            </div>
                                            <div className="flex gap-6">
                                                <div className="text-right">
                                                    <p className="text-[10px] font-bold text-muted-foreground uppercase">Potencial</p>
                                                    <p className="text-sm font-medium">{formatCurrency(op.potential)}</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-[10px] font-bold text-green-600 uppercase">Recebido</p>
                                                    <p className="text-sm font-bold text-green-600">{formatCurrency(op.totalPaid)}</p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="h-1.5 w-full bg-muted">
                                            <div className="h-full bg-primary transition-all" style={{ width: `${Math.min((op.totalPaid / (op.potential || 1)) * 100, 100)}%` }} />
                                        </div>
                                    </Card>
                                ))}
                            </div>
                        </ScrollArea>
                    </div>
                </DialogContent>
            </Dialog>

            <Dialog open={isEfficiencyOpen} onOpenChange={setIsEfficiencyOpen}>
                <DialogTrigger asChild><Button variant="outline"><BarChart3 className="mr-2 h-4 w-4" /> Eficiência Parceiros</Button></DialogTrigger>
                <DialogContent className="max-w-5xl h-[90vh] flex flex-col">
                    <DialogHeader><DialogTitle>Análise de Eficiência por Parceiro</DialogTitle></DialogHeader>
                    <div className="flex-1 overflow-y-auto"><PromoterEfficiencyReport proposals={summaryProposals} /></div>
                </DialogContent>
            </Dialog>

            <Dialog open={isReportDialogOpen} onOpenChange={setIsReportDialogOpen}>
                <DialogTrigger asChild><Button variant="outline"><FileBadge className="mr-2 h-4 w-4" /> Fechamento (PDF)</Button></DialogTrigger>
                <DialogContent className="max-w-sm">
                    <DialogHeader>
                        <DialogTitle>Configurar Balanço Mensal</DialogTitle>
                        <DialogDescription>Unifica Comissões e Despesas no mesmo PDF.</DialogDescription>
                    </DialogHeader>
                    <div className="grid grid-cols-2 gap-4 py-4">
                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase text-muted-foreground">Mês</label>
                            <Select value={reportMonth} onValueChange={setReportMonth}>
                                <SelectTrigger><SelectValue placeholder="Mês" /></SelectTrigger>
                                <SelectContent>{MONTHS.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}</SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase text-muted-foreground">Ano</label>
                            <Select value={reportYear} onValueChange={setReportYear}>
                                <SelectTrigger><SelectValue placeholder="Ano" /></SelectTrigger>
                                <SelectContent>{[getYear(new Date()) - 1, getYear(new Date()), getYear(new Date()) + 1].map(y => <SelectItem key={y} value={y.toString()}>{y}</SelectItem>)}</SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsReportDialogOpen(false)}>Cancelar</Button>
                        <Button onClick={handleGenerateMonthlyReport}><FileDown className="mr-2 h-4 w-4" /> Gerar PDF</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <DropdownMenu>
                <DropdownMenuTrigger asChild><Button variant="outline"><FileDown /> Exportar</Button></DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuItem onSelect={() => tableRef.current?.table && import('xlsx').then(xlsx => {
                        const ws = xlsx.utils.json_to_sheet(proposalsWithCustomerData.map(p => ({ Cliente: p.customer?.name, Proposta: p.proposalNumber, Valor: p.grossAmount, Status: p.commissionStatus, Operador: p.operator })));
                        const wb = xlsx.utils.book_new();
                        xlsx.utils.book_append_sheet(wb, ws, 'Financeiro');
                        xlsx.writeFile(wb, 'financeiro.xlsx');
                    })}>Exportar para Excel (.xlsx)</DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
            <Dialog open={isReconciliationOpen} onOpenChange={setIsReconciliationOpen}>
                <DialogTrigger asChild><Button variant="outline"><FileCheck2 /> Conciliar IA</Button></DialogTrigger>
                <DialogContent className="max-w-4xl">
                    <DialogHeader><DialogTitle>Conciliação de Comissões com IA</DialogTitle></DialogHeader>
                    <CommissionReconciliation proposals={summaryProposals} onFinished={() => setIsReconciliationOpen(false)} />
                </DialogContent>
            </Dialog>
            <Button variant="ghost" size="icon" onClick={() => setIsPrivacyMode(!isPrivacyMode)}>{isPrivacyMode ? <EyeOff /> : <Eye />}</Button>
            <Button onClick={handlePrint}><Printer /> Imprimir</Button>
        </div>
      </div>

       <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent className="w-full max-w-md">
          <SheetHeader><SheetTitle>Editar Comissão</SheetTitle></SheetHeader>
          <CommissionForm proposal={selectedProposal} onSubmit={handleFormSubmit} />
        </SheetContent>
      </Sheet>

      <Dialog open={!!dialogData} onOpenChange={(isOpen) => !isOpen && setDialogData(null)}>
        <DialogContent className="max-w-4xl h-[90vh] flex flex-col">
            <DialogHeader><DialogTitle>{dialogData?.title}</DialogTitle></DialogHeader>
            <div className="flex-1 overflow-y-auto"><ProposalsStatusTable proposals={dialogData?.proposals || []} customers={customers || []} /></div>
        </DialogContent>
      </Dialog>

      {isLoading ? (
        <div className="space-y-4"><Skeleton className="h-32 w-full" /><Skeleton className="h-[400px] w-full" /></div>
      ) : (
        <div className="space-y-8">
            <Tabs defaultValue="commissions" className="w-full">
                <TabsList className="bg-muted/50 mb-4">
                    <TabsTrigger value="commissions" className="gap-2"><CircleDollarSign className="h-4 w-4" /> Comissões & Fluxo</TabsTrigger>
                    <TabsTrigger value="expenses" className="gap-2"><Wallet className="h-4 w-4" /> Despesas & DRE</TabsTrigger>
                </TabsList>

                <TabsContent value="commissions" className="space-y-4">
                    <FinancialDataTable 
                        ref={tableRef}
                        columns={columns} 
                        data={proposalsWithCustomerData}
                        currentMonthRange={currentMonthRange}
                        isPrivacyMode={isPrivacyMode} 
                        rowSelection={rowSelection}
                        setRowSelection={setRowSelection}
                        onShowDetails={handleShowDetails}
                        userSettings={userSettings || null}
                    />
                </TabsContent>

                <TabsContent value="expenses" className="space-y-6">
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                        <div className="space-y-1">
                            <h2 className="text-xl font-bold flex items-center gap-2"><ReceiptText className="text-primary" /> Livro de Despesas</h2>
                            <p className="text-sm text-muted-foreground">Registre seus custos fixos e variáveis para controle financeiro.</p>
                        </div>
                        <div className="flex items-center gap-4">
                            <StatsCard title="Total de Despesas" value={isPrivacyMode ? '•••••' : formatCurrency(totalExpensesAmount)} icon={Wallet} description="GASTOS TOTAIS DO MÊS ATUAL" className="border-red-200 bg-red-50/10 min-w-[250px]" valueClassName="text-red-600" />
                            <Button onClick={() => { setSelectedExpense(undefined); setIsExpenseFormOpen(true); }}><PlusCircle className="mr-2 h-4 w-4" /> Lançar Despesa</Button>
                        </div>
                    </div>
                    <ExpenseTable expenses={expenses || []} onEdit={(e) => { setSelectedExpense(e); setIsExpenseFormOpen(true); }} onDelete={handleExpenseDelete} />
                </TabsContent>
            </Tabs>
        </div>
      )}

      <Dialog open={isExpenseFormOpen} onOpenChange={setIsExpenseFormOpen}>
        <DialogContent className="max-w-md">
            <DialogHeader><DialogTitle>{selectedExpense ? 'Editar Gasto' : 'Novo Gasto Operacional'}</DialogTitle></DialogHeader>
            <ExpenseForm expense={selectedExpense} categories={userSettings?.expenseCategories || initialExpenseCategories} onSubmit={handleExpenseSubmit} />
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
