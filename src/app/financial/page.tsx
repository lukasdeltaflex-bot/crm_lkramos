'use client';
import React from 'react';
import { AppLayout } from '@/components/app-layout';
import { PageHeader } from '@/components/page-header';
import { FinancialDataTable, type FinancialDataTableHandle } from './data-table';
import { getColumns } from './columns';
import { useUser, useFirestore, useCollection, useMemoFirebase, useDoc } from '@/firebase';
import { collection, query, where, doc, setDoc, deleteField, deleteDoc, writeBatch } from 'firebase/firestore';
import type { Proposal, Customer, CommissionStatus, UserSettings, Expense } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { 
    Eye, 
    EyeOff, 
    FileCheck2, 
    FileDown, 
    Users2, 
    CircleDollarSign, 
    PlusCircle, 
    Wallet, 
    CheckCircle2,
    ChevronDown,
    FileSpreadsheet,
    FileText as FilePdf
} from 'lucide-react';
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
  } from '@/components/ui/dialog';
import { CommissionForm, type CommissionFormValues } from './commission-form';
import { toast } from '@/hooks/use-toast';
import { format, startOfMonth, endOfMonth, parse, getYear, getMonth, isSameMonth, isValid } from 'date-fns';
import { CommissionReconciliation } from '@/components/financial/commission-reconciliation';
import { formatCurrency, cleanBankName, cleanFirestoreData } from '@/lib/utils';
import { ProposalsStatusTable } from '@/components/dashboard/proposals-status-table';
import { PromoterEfficiencyReport } from '@/components/financial/promoter-efficiency-report';
import { StatsCard } from '@/components/dashboard/stats-card';
import { ExpenseForm } from '@/components/financial/expense-form';
import { ExpenseTable } from '@/components/financial/expense-table';
import { expenseCategories as initialExpenseCategories } from '@/lib/config-data';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';

export type ProposalWithCustomer = Proposal & { customer: Customer | undefined };

export default function FinancialPage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const [isPrivacyMode, setIsPrivacyMode] = React.useState(false);
  const [isSheetOpen, setIsSheetOpen] = React.useState(false);
  const [isReconciliationOpen, setIsReconciliationOpen] = React.useState(false);
  const [isEfficiencyOpen, setIsEfficiencyOpen] = React.useState(false);
  const [isOperatorsDialogOpen, setIsOperatorsDialogOpen] = React.useState(false);
  const [isExpenseFormOpen, setIsExpenseFormOpen] = React.useState(false);
  
  const [selectedProposal, setSelectedProposal] = React.useState<ProposalWithCustomer | undefined>(undefined);
  const [selectedExpense, setSelectedExpense] = React.useState<Expense | undefined>(undefined);
  const [isClient, setIsClient] = React.useState(false);
  const [rowSelection, setRowSelection] = React.useState<Record<string, boolean>>({});
  const [isSaving, setIsSaving] = React.useState(false);
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

  const selectedIds = React.useMemo(() => 
    Object.keys(rowSelection).filter(id => rowSelection[id]),
  [rowSelection]);

  const selectedCount = selectedIds.length;

  const handleBulkCommissionUpdate = async (newStatus: CommissionStatus) => {
    if (!firestore || !user || selectedCount === 0) return;
    setIsSaving(true);
    try {
        const batch = writeBatch(firestore);
        const now = new Date().toISOString();
        
        selectedIds.forEach(id => {
            const proposal = proposals?.find(p => p.id === id);
            if (!proposal) return;

            const docRef = doc(firestore, 'loanProposals', id);
            const dataToUpdate: any = { 
                commissionStatus: newStatus,
                ownerId: user.uid
            };

            if (newStatus === 'Paga') {
                dataToUpdate.amountPaid = proposal.commissionValue || 0;
                dataToUpdate.commissionPaymentDate = now;
            } else if (newStatus === 'Pendente') {
                dataToUpdate.amountPaid = 0;
                dataToUpdate.commissionPaymentDate = deleteField();
            }

            batch.set(docRef, cleanFirestoreData(dataToUpdate), { merge: true });
        });

        await batch.commit();
        toast({ title: 'Comissões Atualizadas', description: `${selectedCount} registros alterados para "${newStatus}".` });
        setRowSelection({});
    } catch (e: any) {
        if (e.code === 'permission-denied') {
            errorEmitter.emit('permission-error', new FirestorePermissionError({
                path: 'loanProposals',
                operation: 'update',
                requestResourceData: { commissionStatus: newStatus }
            }));
        }
        toast({ variant: 'destructive', title: 'Erro na operação em massa' });
    } finally {
        setIsSaving(false);
    }
  };

  const handleExportToExcel = async (onlySelected = false) => {
    const table = tableRef.current?.table;
    if (!table) return;
    const { utils, writeFile } = await import('xlsx');
    
    const rowsSource = onlySelected ? table.getFilteredSelectedRowModel().rows : table.getFilteredRowModel().rows;
    
    const dataToExport = rowsSource.map(r => {
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

    const ws = utils.json_to_sheet(dataToExport);
    const wb = utils.book_new();
    utils.book_append_sheet(wb, ws, 'Financeiro');
    writeFile(wb, onlySelected ? 'financeiro_selecionado.xlsx' : 'financeiro_lk_ramos.xlsx');
  };

  const handleExportToPdf = async (onlySelected = false) => {
    const table = tableRef.current?.table;
    if (!table || !user) return;

    const { default: jsPDF } = await import('jspdf');
    const { default: autoTable } = await import('jspdf-autotable');
    
    const rowsSource = onlySelected ? table.getFilteredSelectedRowModel().rows : table.getFilteredRowModel().rows;
    const doc = new jsPDF('landscape');
    
    const title = onlySelected ? "RELATÓRIO FINANCEIRO (SELEÇÃO)" : "RELATÓRIO FINANCEIRO COMPLETO";
    const date = format(new Date(), 'dd/MM/yyyy HH:mm');

    doc.setFontSize(18);
    doc.setTextColor(40, 74, 127);
    doc.text(title, 14, 15);
    
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Gerado por: ${user.displayName || user.email}`, 14, 22);
    doc.text(`Data: ${date}`, 14, 27);

    const tableData = rowsSource.map(r => {
        const p = r.original;
        return [
            p.customer?.name || '-',
            p.customer?.cpf || '-',
            p.proposalNumber,
            cleanBankName(p.bank),
            p.product,
            isPrivacyMode ? '•••••' : formatCurrency(p.grossAmount),
            isPrivacyMode ? '•••••' : formatCurrency(p.commissionValue),
            p.commissionStatus,
            p.commissionPaymentDate ? format(new Date(p.commissionPaymentDate), 'dd/MM/yyyy') : '-'
        ];
    });

    autoTable(doc, {
        startY: 35,
        head: [['Cliente', 'CPF', 'Proposta', 'Banco', 'Produto', 'Vlr Bruto', 'Comissão', 'Status', 'Pagamento']],
        body: tableData,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [40, 74, 127] }
    });

    doc.save(`financeiro_${onlySelected ? 'selecao' : 'completo'}_${format(new Date(), 'dd_MM_yyyy')}.pdf`);
    toast({ title: 'PDF Gerado!' });
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
    setDoc(docRef, cleanFirestoreData(proposalToUpdate), { merge: true });
    toast({ title: 'Status Atualizado!' });
  }, [firestore, user]);

  const handleFormSubmit = async (data: CommissionFormValues) => {
    if (!firestore || !selectedProposal || !user) return;
    
    let paymentDateIso = null;
    if (data.commissionPaymentDate) {
        const parsed = parse(data.commissionPaymentDate, 'dd/MM/yyyy', new Date());
        if (isValid(parsed)) {
            paymentDateIso = parsed.toISOString();
        }
    }

    const proposalToUpdate: Partial<Proposal> = {
      commissionStatus: data.commissionStatus as CommissionStatus,
      amountPaid: data.amountPaid,
      commissionPaymentDate: paymentDateIso as any,
      ownerId: user.uid
    };
    
    setDoc(doc(firestore, 'loanProposals', selectedProposal.id), cleanFirestoreData(proposalToUpdate), { merge: true });
    setIsSheetOpen(false);
    toast({ title: 'Salvo!' });
  };

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

  return (
    <AppLayout>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4 print:hidden">
        <PageHeader title="Controle Financeiro & Fluxo" />
        <div className="flex items-center gap-2 flex-wrap">
            {selectedCount > 0 && (
                <div className="flex items-center gap-2 animate-in slide-in-from-right-2 duration-300">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" className="h-10 px-6 rounded-full font-bold border-green-500/30 bg-green-500/5 text-green-600 text-xs">
                                <CheckCircle2 className="mr-2 h-4 w-4" /> Baixa Coletiva ({selectedCount}) <ChevronDown className="ml-2 h-3 w-3" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onSelect={() => handleBulkCommissionUpdate('Paga')} className="font-bold text-green-600">Marcar como PAGAS</DropdownMenuItem>
                            <DropdownMenuItem onSelect={() => handleBulkCommissionUpdate('Pendente')} className="text-destructive">Estornar para PENDENTE</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" className="h-10 px-6 rounded-full font-bold text-xs">
                                <FileDown className="mr-2 h-4 w-4" /> Exportar Seleção <ChevronDown className="ml-2 h-3 w-3" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onSelect={() => handleExportToExcel(true)} className="gap-2">
                                <FileSpreadsheet className="h-4 w-4 text-green-600" /> Excel (.xlsx)
                            </DropdownMenuItem>
                            <DropdownMenuItem onSelect={() => handleExportToPdf(true)} className="gap-2">
                                <FilePdf className="h-4 w-4 text-red-600" /> PDF (.pdf)
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            )}

            <Dialog open={isOperatorsDialogOpen} onOpenChange={setIsOperatorsDialogOpen}>
                <Button variant="outline" className="h-10 px-6 rounded-full font-bold text-xs" onClick={() => setIsOperatorsDialogOpen(true)}>
                    <Users2 className="mr-2 h-4 w-4" /> Performance
                </Button>
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
                <Button variant="outline" className="h-10 px-6 rounded-full font-bold text-xs" onClick={() => setIsEfficiencyOpen(true)}>
                    <BarChart3 className="mr-2 h-4 w-4" /> Eficiência
                </Button>
                <DialogContent className="max-w-5xl h-[90vh] flex flex-col">
                    <DialogHeader><DialogTitle>Análise de Eficiência dos Parceiros</DialogTitle></DialogHeader>
                    <div className="flex-1 overflow-y-auto"><PromoterEfficiencyReport proposals={summaryProposals} /></div>
                </DialogContent>
            </Dialog>

            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="h-10 px-6 rounded-full font-bold text-xs">
                        <FileDown className="mr-2 h-4 w-4" /> Exportar Tudo <ChevronDown className="ml-2 h-3 w-3" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuItem onSelect={() => handleExportToExcel(false)} className="gap-2">
                        <FileSpreadsheet className="h-4 w-4 text-green-600" /> Excel (.xlsx)
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => handleExportToPdf(false)} className="gap-2">
                        <FilePdf className="h-4 w-4 text-red-600" /> PDF (.pdf)
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
            
            <Dialog open={isReconciliationOpen} onOpenChange={setIsReconciliationOpen}>
                <Button variant="outline" className="h-10 px-6 rounded-full font-bold text-xs" onClick={() => setIsReconciliationOpen(true)}>
                    <FileCheck2 className="mr-2 h-4 w-4" /> Conciliar IA
                </Button>
                <DialogContent className="max-w-4xl"><DialogHeader><DialogTitle>Conciliação Financeira IA</DialogTitle></DialogHeader><CommissionReconciliation proposals={summaryProposals} onFinished={() => setIsReconciliationOpen(false)} /></DialogContent>
            </Dialog>
            <Button variant="ghost" size="icon" className="rounded-full" onClick={() => setIsPrivacyMode(!isPrivacyMode)}>{isPrivacyMode ? <EyeOff /> : <Eye />}</Button>
        </div>
      </div>

       <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent className="w-full max-w-md">
          <SheetHeader><SheetTitle>Editar Lançamento de Comissão</SheetTitle></SheetHeader>
          <CommissionForm proposal={selectedProposal} onSubmit={handleFormSubmit} />
        </SheetContent>
      </Sheet>

      {isLoading ? (
        <div className="space-y-4"><Skeleton className="h-32 w-full" /><Skeleton className="h-[400px] w-full" /></div>
      ) : (
        <div className="space-y-8">
            <Tabs defaultValue="commissions" className="w-full">
                <TabsList className="bg-muted/30 p-1 rounded-full mb-6 border w-fit">
                    <TabsTrigger value="commissions" className="gap-2 rounded-full px-6 data-[state=active]:bg-primary data-[state=active]:text-white font-bold transition-all"><CircleDollarSign className="h-4 w-4" /> Comissões</TabsTrigger>
                    <TabsTrigger value="expenses" className="gap-2 rounded-full px-6 data-[state=active]:bg-red-600 data-[state=active]:text-white font-bold transition-all"><Wallet className="h-4 w-4" /> Despesas</TabsTrigger>
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
                    <div className="flex justify-between items-center bg-muted/10 p-4 rounded-2xl border">
                        <StatsCard title="Total Despesas (Mês)" value={isPrivacyMode ? '•••••' : formatCurrency(totalExpensesAmount)} icon={Wallet} className="bg-red-50/10 border-red-200" />
                        <Button className="rounded-full font-bold bg-red-600 hover:bg-red-700" onClick={() => { setSelectedExpense(undefined); setIsExpenseFormOpen(true); }}><PlusCircle className="mr-2 h-4 w-4" /> Lançar Despesa</Button>
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
                const finalData = cleanFirestoreData({ ...data, id, ownerId: user!.uid });
                setDoc(doc(firestore!, 'users', user!.uid, 'expenses', id), finalData);
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
