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
  const { data: userSettings, isLoading: settingsLoading } = useDoc<UserSettings>(settingsDocRef);

  const isLoading = proposalsLoading || customersLoading || expensesLoading || isUserLoading || settingsLoading;

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
        toast({ variant: "destructive", title: "Sem dados para o período" });
        return;
    }

    const { default: jsPDF } = await import('jspdf');
    const { default: autoTable } = await import('jspdf-autotable');

    const doc = new jsPDF();
    const targetDate = new Date(targetYear, targetMonth, 1);
    const monthYear = format(targetDate, "MMMM 'de' yyyy", { locale: ptBR });

    doc.setFontSize(20); doc.setTextColor(40, 74, 127); doc.text("Balanço Empresarial", 14, 20);
    doc.setFontSize(10); doc.setTextColor(100); doc.text(`Período: ${monthYear}`, 14, 28);

    const recebido = reportProposals.filter(p => p.commissionStatus === 'Paga' || p.commissionStatus === 'Parcial').reduce((sum, p) => sum + (p.amountPaid || 0), 0);
    const totalDespesas = reportExpenses.reduce((sum, e) => sum + e.amount, 0);
    const lucroLiquido = recebido - totalDespesas;

    autoTable(doc, {
        startY: 45,
        body: [
            ['Entradas (Comissões)', formatCurrency(recebido)],
            ['Saídas (Despesas)', formatCurrency(totalDespesas)],
            ['LUCRO LÍQUIDO', { content: formatCurrency(lucroLiquido), styles: { fontStyle: 'bold', textColor: lucroLiquido >= 0 ? [22, 101, 52] : [185, 28, 28] } }],
        ],
        theme: 'striped',
    });

    doc.save(`Balanco_${monthYear.replace(/\s+/g, '_')}.pdf`);
    setIsReportDialogOpen(false);
  };

  const handleExportToExcel = async () => {
    const table = tableRef.current?.table;
    if (!table) return;
    const { utils, writeFile } = await import('xlsx');
    
    const rows = table.getFilteredRowModel().rows.map(r => {
        const p = r.original;
        return {
            'Cliente': p.customer?.name,
            'CPF': p.customer?.cpf,
            'Proposta': p.proposalNumber,
            'Banco': cleanBankName(p.bank),
            'Produto': p.product,
            'Vlr Bruto': p.grossAmount,
            'Comissão R$': p.commissionValue,
            'Vlr Pago': p.amountPaid || 0,
            'Status': p.commissionStatus,
            'Pagamento': p.commissionPaymentDate ? format(new Date(p.commissionPaymentDate), 'dd/MM/yyyy') : '-',
            'Operador': p.operator || '-'
        };
    });

    const ws = utils.json_to_sheet(rows);
    const wb = utils.book_new();
    utils.book_append_sheet(wb, ws, 'Financeiro');
    writeFile(wb, 'financeiro_lk_ramos.xlsx');
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
    setDoc(docRef, proposalToUpdate, { merge: true });
    toast({ title: 'Status Atualizado!' });
  }, [firestore, user]);

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
    setDoc(doc(firestore, 'loanProposals', selectedProposal.id), proposalToUpdate, { merge: true });
    setIsSheetOpen(false);
    toast({ title: 'Salvo!' });
  };

  return (
    <AppLayout>
      <div className="flex items-center justify-between print:hidden">
        <PageHeader title="Controle Financeiro & Fluxo" />
        <div className="flex items-center gap-2">
            <Dialog open={isOperatorsDialogOpen} onOpenChange={setIsOperatorsDialogOpen}>
                <DialogTrigger asChild><Button variant="outline"><Users2 className="mr-2 h-4 w-4" /> Performance Operadores</Button></DialogTrigger>
                <DialogContent className="max-w-3xl">
                    <DialogHeader><DialogTitle>Comissões por Operador</DialogTitle></DialogHeader>
                    <div className="py-4"><ScrollArea className="h-[400px]"><div className="space-y-4">{operatorStats.map((op) => (
                        <Card key={op.name} className="p-4 flex items-center justify-between">
                            <div><p className="font-bold">{op.name}</p><p className="text-[10px] uppercase text-muted-foreground">{op.count} Propostas</p></div>
                            <div className="text-right"><p className="text-xs uppercase font-bold text-muted-foreground">Recebido</p><p className="font-bold text-green-600">{formatCurrency(op.totalPaid)}</p></div>
                        </Card>
                    ))}</div></ScrollArea></div>
                </DialogContent>
            </Dialog>

            <Dialog open={isEfficiencyOpen} onOpenChange={setIsEfficiencyOpen}>
                <DialogTrigger asChild><Button variant="outline"><BarChart3 className="mr-2 h-4 w-4" /> Eficiência</Button></DialogTrigger>
                <DialogContent className="max-w-5xl h-[90vh] flex flex-col">
                    <DialogHeader><DialogTitle>Análise de Eficiência</DialogTitle></DialogHeader>
                    <div className="flex-1 overflow-y-auto"><PromoterEfficiencyReport proposals={summaryProposals} /></div>
                </DialogContent>
            </Dialog>

            <Button variant="outline" onClick={handleExportToExcel}><FileDown className="mr-2 h-4 w-4" /> Excel</Button>
            
            <Dialog open={isReconciliationOpen} onOpenChange={setIsReconciliationOpen}>
                <DialogTrigger asChild><Button variant="outline"><FileCheck2 /> Conciliar IA</Button></DialogTrigger>
                <DialogContent className="max-w-4xl"><DialogHeader><DialogTitle>Conciliação IA</DialogTitle></DialogHeader><CommissionReconciliation proposals={summaryProposals} onFinished={() => setIsReconciliationOpen(false)} /></DialogContent>
            </Dialog>
            <Button variant="ghost" size="icon" onClick={() => setIsPrivacyMode(!isPrivacyMode)}>{isPrivacyMode ? <EyeOff /> : <Eye />}</Button>
            <Button onClick={() => window.print()}><Printer /> Imprimir</Button>
        </div>
      </div>

       <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent className="w-full max-w-md">
          <SheetHeader><SheetTitle>Editar Comissão</SheetTitle></SheetHeader>
          <CommissionForm proposal={selectedProposal} onSubmit={handleFormSubmit} />
        </SheetContent>
      </Sheet>

      {isLoading ? (
        <div className="space-y-4"><Skeleton className="h-32 w-full" /><Skeleton className="h-[400px] w-full" /></div>
      ) : (
        <div className="space-y-8">
            <Tabs defaultValue="commissions" className="w-full">
                <TabsList className="bg-muted/50 mb-4">
                    <TabsTrigger value="commissions" className="gap-2"><CircleDollarSign className="h-4 w-4" /> Comissões</TabsTrigger>
                    <TabsTrigger value="expenses" className="gap-2"><Wallet className="h-4 w-4" /> Despesas</TabsTrigger>
                </TabsList>

                <TabsContent value="commissions">
                    <FinancialDataTable 
                        ref={tableRef}
                        columns={getColumns({ onEdit: handleEditCommission, onStatusUpdate: handleCommissionStatusUpdate })} 
                        data={proposalsWithCustomerData}
                        currentMonthRange={currentMonthRange}
                        isPrivacyMode={isPrivacyMode} 
                        rowSelection={rowSelection}
                        setRowSelection={setRowSelection}
                        onShowDetails={(t, p) => setDialogData({ title: t, proposals: p })}
                        userSettings={userSettings || null}
                    />
                </TabsContent>

                <TabsContent value="expenses" className="space-y-6">
                    <div className="flex justify-between items-center">
                        <StatsCard title="Total Despesas (Mês)" value={isPrivacyMode ? '•••••' : formatCurrency(totalExpensesAmount)} icon={Wallet} className="bg-red-50/10 border-red-200" />
                        <Button onClick={() => { setSelectedExpense(undefined); setIsExpenseFormOpen(true); }}><PlusCircle className="mr-2 h-4 w-4" /> Lançar Despesa</Button>
                    </div>
                    <ExpenseTable expenses={expenses || []} onEdit={(e) => { setSelectedExpense(e); setIsExpenseFormOpen(true); }} onDelete={(id) => deleteDoc(doc(firestore!, 'users', user!.uid, 'expenses', id))} />
                </TabsContent>
            </Tabs>
        </div>
      )}

      <Dialog open={isExpenseFormOpen} onOpenChange={setIsExpenseFormOpen}>
        <DialogContent className="max-w-md">
            <DialogHeader><DialogTitle>Gasto Operacional</DialogTitle></DialogHeader>
            <ExpenseForm expense={selectedExpense} categories={userSettings?.expenseCategories || initialExpenseCategories} onSubmit={(data) => {
                const id = selectedExpense?.id || doc(collection(firestore!, 'users', user!.uid, 'expenses')).id;
                setDoc(doc(firestore!, 'users', user!.uid, 'expenses', id), { ...data, id, ownerId: user!.uid });
                setIsExpenseFormOpen(false);
                toast({ title: 'Gasto Salvo!' });
            }} />
        </DialogContent>
      </Dialog>

      <Dialog open={!!dialogData} onOpenChange={(o) => !o && setDialogData(null)}>
        <DialogContent className="max-w-4xl h-[90vh] flex flex-col">
            <DialogHeader><DialogTitle>{dialogData?.title}</DialogTitle></DialogHeader>
            <div className="flex-1 overflow-y-auto"><ProposalsStatusTable proposals={dialogData?.proposals || []} customers={customers || []} /></div>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
