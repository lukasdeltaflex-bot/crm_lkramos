'use client';
import React, { useState, useMemo, useEffect } from 'react';
import { AppLayout } from '@/components/app-layout';
import { PageHeader } from '@/components/page-header';
import { FinancialDataTable, type FinancialDataTableHandle } from './data-table';
import { getColumns } from './columns';
import { useUser, useFirestore, useCollection, useMemoFirebase, useDoc, errorEmitter, FirestorePermissionError } from '@/firebase';
import { collection, query, where, doc, setDoc, deleteField, deleteDoc, writeBatch, limit } from 'firebase/firestore';
import type { Proposal, Customer, CommissionStatus, UserSettings, Expense } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { 
    Eye, 
    EyeOff, 
    FileCheck2, 
    FileDown, 
    CircleDollarSign, 
    PlusCircle, 
    Users, 
    CheckCircle2,
    ChevronDown,
    FileSpreadsheet,
    FileText as FilePdf,
    BarChart3,
    Printer,
    Wallet,
    Calendar as CalendarIcon,
    Filter,
    X,
    TrendingUp,
    CalendarDays
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
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
import { format, startOfMonth, endOfMonth, parse, isValid, addMonths, startOfDay, endOfDay, isSameMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CommissionReconciliation } from '@/components/financial/commission-reconciliation';
import { formatCurrency, cleanBankName, cleanFirestoreData } from '@/lib/utils';
import { ProposalsStatusTable } from '@/components/dashboard/proposals-status-table';
import { PromoterEfficiencyReport } from '@/components/financial/promoter-efficiency-report';
import { StatsCard } from '@/components/dashboard/stats-card';
import { ExpenseForm } from '@/components/financial/expense-form';
import { ExpenseTable } from '@/components/financial/expense-table';
import { expenseCategories as initialExpenseCategories } from '@/lib/config-data';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { FinancialSummary } from '@/components/financial/financial-summary';

export type ProposalWithCustomer = Proposal & { customer: Customer | undefined };

export default function FinancialPage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const [isPrivacyMode, setIsPrivacyMode] = useState(false);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isReconciliationOpen, setIsReconciliationOpen] = useState(false);
  const [isEfficiencyOpen, setIsEfficiencyOpen] = useState(false);
  const [isOperatorsDialogOpen, setIsOperatorsDialogOpen] = useState(false);
  const [isExpenseFormOpen, setIsExpenseFormOpen] = useState(false);
  
  const [selectedProposal, setSelectedProposal] = useState<ProposalWithCustomer | undefined>(undefined);
  const [selectedExpense, setSelectedExpense] = useState<Expense | undefined>(undefined);
  const [isClient, setIsClient] = useState(false);
  const [rowSelection, setRowSelection] = useState<Record<string, boolean>>({});
  const [isSaving, setIsSaving] = useState(false);
  const tableRef = React.useRef<FinancialDataTableHandle>(null);
  const [dialogData, setDialogData] = useState<{ title: string; proposals: Proposal[] } | null>(null);

  // Stats Period Filtering
  const [statsStartDate, setStatsStartDate] = useState(format(startOfMonth(new Date()), 'dd/MM/yyyy'));
  const [statsEndDate, setStatsEndDate] = useState(format(new Date(), 'dd/MM/yyyy'));
  const [appliedStatsRange, setAppliedStatsRange] = useState<{ from: Date; to: Date } | null>(null);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const proposalsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, 'loanProposals'), where('ownerId', '==', user.uid), limit(1000));
  }, [firestore, user]);

  const customersQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, 'customers'), where('ownerId', '==', user.uid), limit(1000));
  }, [firestore, user]);

  const expensesQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, 'users', user.uid, 'expenses'), limit(100));
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

  const handleApplyStatsFilter = () => {
    const s = parse(statsStartDate, 'dd/MM/yyyy', new Date());
    const e = parse(statsEndDate, 'dd/MM/yyyy', new Date());
    if (isValid(s) && isValid(e)) {
        setAppliedStatsRange({ from: startOfDay(s), to: endOfDay(e) });
    } else {
        setAppliedStatsRange(null);
    }
  };

  const handleStatsMonthSelect = (monthVal: string) => {
      const now = new Date();
      const year = now.getFullYear();
      const monthIndex = parseInt(monthVal);
      const start = startOfMonth(new Date(year, monthIndex, 1));
      const end = endOfMonth(start);
      
      setStatsStartDate(format(start, 'dd/MM/yyyy'));
      setStatsEndDate(format(end, 'dd/MM/yyyy'));
      setAppliedStatsRange({ from: startOfDay(start), to: endOfDay(end) });
  };

  const { proposalsWithCustomerData, summaryProposals, currentMonthRange, operatorStats } = useMemo(() => {
    if (!proposals || !customers || !isClient) return { proposalsWithCustomerData: [], summaryProposals: [], currentMonthRange: { from: new Date(), to: new Date() }, operatorStats: [] };
    
    const customersMap = new Map(customers.map(c => [c.id, c]));
    const today = new Date();
    const startOfCurrent = startOfMonth(today);
    const endOfCurrent = endOfMonth(today);

    // Mapeia clientes para todas as propostas
    const tableData = proposals
      .map(p => ({
        ...p,
        customer: customersMap.get(p.customerId),
      }))
      .filter(p => p.customer && p.status !== 'Reprovado');

    const opMap: Record<string, { name: string; totalPaid: number; count: number; potential: number }> = {};
    
    const statsData = appliedStatsRange 
        ? tableData.filter(p => {
            const d = p.dateDigitized ? new Date(p.dateDigitized) : null;
            return d && d >= appliedStatsRange.from && d <= appliedStatsRange.to;
        })
        : tableData;

    statsData.forEach(p => {
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
      summaryProposals: proposals, 
      currentMonthRange: { from: startOfCurrent, to: endOfCurrent },
      operatorStats: stats
    };
  }, [proposals, customers, isClient, appliedStatsRange]);

  const selectedIds = useMemo(() => 
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

  const handlePrint = (onlySelected = false) => {
    if (onlySelected) {
        document.body.classList.add('print-selection');
    }
    window.print();
    if (onlySelected) {
        window.addEventListener('afterprint', () => {
            document.body.classList.remove('print-selection');
        }, { once: true });
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
            'Promotora': p.promoter,
            'Produto': p.product,
            'Operador': p.operator || '-',
            'Vlr Bruto': p.grossAmount,
            'Comissão (%)': p.commissionPercentage,
            'Comissão R$': p.commissionValue,
            'Vlr Pago': p.amountPaid || 0,
            'Status': p.commissionStatus,
            'Pagamento': p.commissionPaymentDate ? format(new Date(p.commissionPaymentDate), 'dd/MM/yyyy') : '-',
        };
    });

    const ws = utils.json_to_sheet(dataToExport);
    const wb = utils.book_new();
    utils.book_append_sheet(wb, ws, 'Financeiro');
    writeFile(wb, onlySelected ? 'financeiro_selecionado.xlsx' : 'financeiro_completo.xlsx');
  };

  const handleExportToPdf = async (onlySelected = false) => {
    const table = tableRef.current?.table;
    if (!table || !user) return;

    const { default: jsPDF } = await import('jspdf');
    const { default: autoTable } = await import('jspdf-autotable');
    
    const rowsSource = onlySelected ? table.getFilteredSelectedRowModel().rows : table.getFilteredRowModel().rows;
    const doc = new jsPDF('landscape');
    
    if (userSettings?.customLogoURL) {
        try {
            doc.addImage(userSettings.customLogoURL, 'PNG', 14, 8, 35, 15, undefined, 'FAST');
        } catch (e) { console.warn("Failed to add logo to Financial PDF"); }
    }

    const title = onlySelected ? "RELATÓRIO FINANCEIRO (SELEÇÃO)" : "RELATÓRIO FINANCEIRO COMPLETO";
    const date = format(new Date(), 'dd/MM/yyyy HH:mm');

    doc.setFontSize(18);
    doc.setTextColor(40, 74, 127);
    doc.text(title, 55, 15);
    
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Gerado por: ${user.displayName || user.email} | Data: ${date}`, 55, 22);

    const tableData = rowsSource.map(r => {
        const p = r.original;
        return [
            p.customer?.name || '-',
            p.customer?.cpf || '-',
            p.proposalNumber,
            p.promoter,
            cleanBankName(p.bank),
            p.product,
            p.operator || '-',
            isPrivacyMode ? '•••••' : formatCurrency(p.grossAmount),
            isPrivacyMode ? '•••••' : `${p.commissionPercentage.toFixed(2)}%`,
            isPrivacyMode ? '•••••' : formatCurrency(p.commissionValue),
            p.commissionStatus,
            p.commissionPaymentDate ? format(new Date(p.commissionPaymentDate), 'dd/MM/yyyy') : '-'
        ];
    });

    if (rowsSource.length > 0) {
        const totalGross = rowsSource.reduce((acc, r) => acc + (r.original.grossAmount || 0), 0);
        const totalComm = rowsSource.reduce((acc, r) => acc + (r.original.commissionValue || 0), 0);
        tableData.push([
            'TOTAIS', '', '', '', '', '', '',
            isPrivacyMode ? '•••••' : formatCurrency(totalGross),
            '',
            isPrivacyMode ? '•••••' : formatCurrency(totalComm),
            '', ''
        ]);
    }

    autoTable(doc, {
        startY: 35,
        head: [['Cliente', 'CPF', 'Proposta', 'Promotora', 'Banco', 'Produto', 'Operador', 'Vlr Bruto', '%', 'Comissão', 'Status', 'Pagamento']],
        body: tableData,
        styles: { fontSize: 7 },
        headStyles: { fillColor: [40, 74, 127] },
        footStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: 'bold' }
    });

    doc.save(`financeiro_${onlySelected ? 'selecao' : 'completo'}.pdf`);
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
    setIsSaving(true);
    try {
        await setDoc(docRef, cleanFirestoreData(proposalToUpdate), { merge: true });
        toast({ title: 'Status Atualizado!' });
    } catch (e: any) {
        if (e.code === 'permission-denied') {
            errorEmitter.emit('permission-error', new FirestorePermissionError({
                path: docRef.path,
                operation: 'update',
                requestResourceData: proposalToUpdate
            }));
        }
        toast({ variant: 'destructive', title: 'Erro ao atualizar status' });
    } finally {
        setIsSaving(false);
    }
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
    
    setIsSaving(true);
    try {
        const docRef = doc(firestore, 'loanProposals', selectedProposal.id);
        await setDoc(docRef, cleanFirestoreData(proposalToUpdate), { merge: true });
        setIsSheetOpen(false);
        toast({ title: 'Salvo!' });
    } catch (e: any) {
        if (e.code === 'permission-denied') {
            errorEmitter.emit('permission-error', new FirestorePermissionError({
                path: `loanProposals/${selectedProposal.id}`,
                operation: 'update',
                requestResourceData: proposalToUpdate
            }));
        }
        toast({ variant: 'destructive', title: 'Erro ao salvar comissão' });
    } finally {
        setIsSaving(false);
    }
  };

  const handleExpenseSubmit = async (data: any) => {
    if (!firestore || !user) return;
    setIsSaving(true);

    try {
        const batch = writeBatch(firestore);
        const parsedDate = parse(data.date, 'dd/MM/yyyy', new Date());
        const groupId = data.groupId || (data.recurrence !== 'none' ? crypto.randomUUID() : undefined);
        
        const count = data.recurrence === 'none' ? 1 : (data.installmentsCount || 1);

        for (let i = 0; i < count; i++) {
            let nextDate: Date;
            if (data.recurrence === 'monthly' || data.recurrence === 'installments') {
                nextDate = addMonths(parsedDate, i);
            } else if (data.recurrence === 'semi-annually') {
                nextDate = addMonths(parsedDate, i * 6);
            } else if (data.recurrence === 'annually') {
                nextDate = addMonths(parsedDate, i * 12);
            } else {
                nextDate = parsedDate;
            }

            const expenseId = (i === 0 && selectedExpense?.id) ? selectedExpense.id : doc(collection(firestore, 'users', user.uid, 'expenses')).id;
            const expenseData: any = {
                ...data,
                id: expenseId,
                ownerId: user.uid,
                date: format(nextDate, 'yyyy-MM-dd'),
                groupId: groupId,
                paid: i === 0 ? data.paid : false,
                installmentNumber: i + 1,
                installmentsCount: count,
                description: count > 1 
                    ? `${data.description} (${i + 1}/${count})` 
                    : data.description
            };

            const docRef = doc(firestore, 'users', user.uid, 'expenses', expenseId);
            batch.set(docRef, cleanFirestoreData(expenseData), { merge: true });
        }

        await batch.commit();
        setIsExpenseFormOpen(false);
        toast({ title: 'Despesas Lançadas!', description: count > 1 ? `${count} parcelas/recorrências geradas.` : 'Gasto registrado com sucesso.' });
    } catch (e: any) {
        console.error("Expense Batch Error:", e);
        toast({ variant: 'destructive', title: 'Erro ao processar lançamentos' });
    } finally {
        setIsSaving(false);
    }
  };

  const totalExpensesAmount = useMemo(() => {
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
                            <Button variant="outline" className="h-10 px-6 rounded-full font-bold border-green-500/30 bg-green-500/5 text-green-600 text-xs" disabled={isSaving}>
                                <CheckCircle2 className="mr-2 h-4 w-4" /> Baixa Coletiva ({selectedCount}) <ChevronDown className="ml-2 h-3 w-3" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onSelect={() => handleBulkCommissionUpdate('Paga')} className="font-bold text-green-600">Marcar como PAGAS</DropdownMenuItem>
                            <DropdownMenuItem onSelect={() => handleBulkCommissionUpdate('Pendente')} className="text-destructive">Estornar para PENDENTE</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            )}

            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="h-10 px-6 rounded-full font-bold text-xs gap-2">
                        <Printer className="h-4 w-4" /> Imprimir <ChevronDown className="h-3 w-3 opacity-50" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuItem onSelect={() => handlePrint(false)}>Imprimir Tudo</DropdownMenuItem>
                    {selectedCount > 0 && (
                        <DropdownMenuItem onSelect={() => handlePrint(true)} className="font-bold text-primary">
                            Imprimir Seleção ({selectedCount})
                        </DropdownMenuItem>
                    )}
                </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="h-10 px-6 rounded-full font-bold border-border/50 hover:bg-muted/50 transition-all text-xs gap-2">
                        <FileDown className="h-4 w-4" /> Exportar <ChevronDown className="h-3 w-3 opacity-50" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Formato Excel</DropdownMenuLabel>
                    <DropdownMenuItem onSelect={() => handleExportToExcel(false)} className="gap-2">
                        <FileSpreadsheet className="h-4 w-4 text-green-600" /> Exportar Tudo
                    </DropdownMenuItem>
                    {selectedCount > 0 && (
                        <DropdownMenuItem onSelect={() => handleExportToExcel(true)} className="gap-2 font-bold">
                            <FileSpreadsheet className="h-4 w-4 text-green-600" /> Exportar Seleção ({selectedCount})
                        </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuLabel>Formato PDF</DropdownMenuLabel>
                    <DropdownMenuItem onSelect={() => handleExportToPdf(false)} className="gap-2">
                        <FilePdf className="h-4 w-4 text-red-600" /> Exportar Tudo
                    </DropdownMenuItem>
                    {selectedCount > 0 && (
                        <DropdownMenuItem onSelect={() => handleExportToPdf(true)} className="gap-2 font-bold">
                            <FilePdf className="h-4 w-4 text-red-600" /> Exportar Seleção ({selectedCount})
                        </DropdownMenuItem>
                    )}
                </DropdownMenuContent>
            </DropdownMenu>

            <Dialog open={isOperatorsDialogOpen} onOpenChange={setIsOperatorsDialogOpen}>
                <Button variant="outline" className="h-10 px-6 rounded-full font-bold text-xs" onClick={() => setIsOperatorsDialogOpen(true)}>
                    <Users className="mr-2 h-4 w-4" /> Performance
                </Button>
                <DialogContent 
                    className="max-w-3xl"
                    onPointerDownOutside={(e) => e.preventDefault()}
                    onInteractOutside={(e) => e.preventDefault()}
                >
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <TrendingUp className="h-5 w-5 text-primary" />
                            Performance por Período
                        </DialogTitle>
                    </DialogHeader>
                    
                    <div className="space-y-6 py-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-muted/30 p-4 rounded-2xl border-2 border-dashed">
                            <div className="space-y-3">
                                <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                    <CalendarDays className="h-3 w-3" /> Mês Referência
                                </Label>
                                <Select onValueChange={handleStatsMonthSelect}>
                                    <SelectTrigger className="rounded-xl border-2 bg-background font-bold text-xs">
                                        <SelectValue placeholder="Escolher mês..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {[0,1,2,3,4,5,6,7,8,9,10,11].map(m => (
                                            <SelectItem key={m} value={String(m)} className="text-xs font-bold uppercase">
                                                {format(new Date(2024, m, 1), 'MMMM', { locale: ptBR })}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-3">
                                <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                    <CalendarIcon className="h-3 w-3" /> Período Manual
                                </Label>
                                <div className="flex items-center gap-2 bg-background p-1 px-2 border-2 rounded-xl">
                                    <Input 
                                        placeholder="De" 
                                        value={statsStartDate} 
                                        onChange={(e) => {
                                            let v = e.target.value.replace(/\D/g, "").substring(0, 8);
                                            if (v.length > 4) v = v.replace(/(\d{2})(\d{2})(\d)/, "$1/$2/$3");
                                            else if (v.length > 2) v = v.replace(/(\d{2})(\d)/, "$1/$2");
                                            setStatsStartDate(v);
                                        }}
                                        className="h-8 border-none bg-transparent text-center text-xs font-bold focus-visible:ring-0"
                                    />
                                    <span className="text-muted-foreground font-black opacity-40">-</span>
                                    <Input 
                                        placeholder="Até" 
                                        value={statsEndDate} 
                                        onChange={(e) => {
                                            let v = e.target.value.replace(/\D/g, "").substring(0, 8);
                                            if (v.length > 4) v = v.replace(/(\d{2})(\d{2})(\d)/, "$1/$2/$3");
                                            else if (v.length > 2) v = v.replace(/(\d{2})(\d)/, "$1/$2");
                                            setStatsEndDate(v);
                                        }}
                                        className="h-8 border-none bg-transparent text-center text-xs font-bold focus-visible:ring-0"
                                    />
                                    <Button size="sm" onClick={handleApplyStatsFilter} className="h-7 w-7 p-0 rounded-full shadow-md active:scale-95">
                                        <CheckCircle2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center justify-between px-2">
                            <p className="text-[10px] font-bold uppercase text-primary/60 tracking-widest">Resultados filtrados</p>
                            {appliedStatsRange && (
                                <Button variant="ghost" size="sm" className="h-6 text-[9px] font-bold uppercase text-red-500" onClick={() => { setStatsStartDate(''); setStatsEndDate(''); setAppliedStatsRange(null); }}>
                                    <X className="h-3 w-3 mr-1" /> Limpar Filtro
                                </Button>
                            )}
                        </div>

                        <ScrollArea className="h-[400px]">
                            <div className="space-y-4 pr-4">
                                {operatorStats.map((op) => (
                                    <Card key={op.name} className="p-5 flex items-center justify-between border-2 hover:border-primary/20 transition-all">
                                        <div className="flex items-center gap-4">
                                            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary uppercase">
                                                {op.name.charAt(0)}
                                            </div>
                                            <div>
                                                <p className="font-bold uppercase text-sm tracking-tight">{op.name}</p>
                                                <p className="text-[10px] uppercase font-bold text-muted-foreground">{op.count} Propostas no período</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[10px] uppercase font-bold text-muted-foreground/60 tracking-widest">Recebido Líquido</p>
                                            <p className="font-bold text-lg text-green-600">{formatCurrency(op.totalPaid)}</p>
                                            <p className="text-[9px] font-bold text-muted-foreground">Potencial: {formatCurrency(op.potential)}</p>
                                        </div>
                                    </Card>
                                ))}
                                {operatorStats.length === 0 && (
                                    <div className="py-20 text-center border-2 border-dashed rounded-3xl opacity-30">
                                        <Users className="h-10 w-10 mx-auto mb-4" />
                                        <p className="text-[10px] font-bold uppercase tracking-widest">Nenhuma produção localizada para este período.</p>
                                    </div>
                                )}
                            </div>
                        </ScrollArea>
                    </div>
                </DialogContent>
            </Dialog>

            <Dialog open={isEfficiencyOpen} onOpenChange={setIsEfficiencyOpen}>
                <Button variant="outline" className="h-10 px-6 rounded-full font-bold text-xs" onClick={() => setIsEfficiencyOpen(true)}>
                    <BarChart3 className="mr-2 h-4 w-4" /> Eficiência
                </Button>
                <DialogContent 
                    className="max-w-5xl h-[90vh] flex flex-col"
                    onPointerDownOutside={(e) => e.preventDefault()}
                    onInteractOutside={(e) => e.preventDefault()}
                >
                    <DialogHeader><DialogTitle>Análise de Eficiência dos Parceiros</DialogTitle></DialogHeader>
                    <div className="flex-1 overflow-y-auto"><PromoterEfficiencyReport proposals={summaryProposals} /></div>
                </DialogContent>
            </Dialog>
            
            <Dialog open={isReconciliationOpen} onOpenChange={setIsReconciliationOpen}>
                <Button variant="outline" className="h-10 px-6 rounded-full font-bold text-xs" onClick={() => setIsReconciliationOpen(true)}>
                    <FileCheck2 className="mr-2 h-4 w-4" /> Conciliar IA
                </Button>
                <DialogContent 
                    className="max-w-4xl" 
                    onPointerDownOutside={(e) => e.preventDefault()} 
                    onInteractOutside={(e) => e.preventDefault()}
                >
                    <DialogHeader><DialogTitle>Conciliação Financeira IA</DialogTitle></DialogHeader>
                    <CommissionReconciliation proposals={summaryProposals} onFinished={() => setIsReconciliationOpen(false)} />
                </DialogContent>
            </Dialog>
            <Button variant="ghost" size="icon" className="rounded-full" onClick={() => setIsPrivacyMode(!isPrivacyMode)}>{isPrivacyMode ? <EyeOff /> : <Eye />}</Button>
        </div>
      </div>

       <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent className="w-full max-w-md" onPointerDownOutside={(e) => e.preventDefault()} onInteractOutside={(e) => e.preventDefault()}>
          <SheetHeader><SheetTitle>Editar Lançamento de Comissão</SheetTitle></SheetHeader>
          <CommissionForm proposal={selectedProposal} onSubmit={handleFormSubmit} />
        </SheetContent>
      </Sheet>

      {isLoading ? (
        <div className="space-y-4"><Skeleton className="h-32 w-full" /><Skeleton className="h-[400px] w-full" /></div>
      ) : (
        <div className="space-y-8">
            <FinancialSummary 
                rows={summaryProposals} 
                currentMonthRange={currentMonthRange} 
                isPrivacyMode={isPrivacyMode} 
                onShowDetails={(t, p) => setDialogData({ title: t, proposals: p })} 
                userSettings={userSettings || null} 
            />

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
                        <Button className="rounded-full font-bold bg-primary hover:bg-primary/90" onClick={() => { setSelectedExpense(undefined); setIsExpenseFormOpen(true); }} disabled={isSaving}><PlusCircle className="mr-2 h-4 w-4" /> Lançar Despesa</Button>
                    </div>
                    <ExpenseTable 
                        expenses={expenses || []} 
                        onEdit={(e) => { setSelectedExpense(e); setIsExpenseFormOpen(true); }} 
                        onDelete={async (id) => {
                            if (!firestore || !user) return;
                            const docRef = doc(firestore, 'users', user.uid, 'expenses', id);
                            try {
                                await deleteDoc(docRef);
                                toast({ title: 'Despesa Removida' });
                            } catch (error: any) {
                                if (error.code === 'permission-denied') {
                                    errorEmitter.emit('permission-error', new FirestorePermissionError({
                                        path: docRef.path,
                                        operation: 'delete'
                                    }));
                                }
                                toast({ variant: 'destructive', title: 'Erro ao remover despesa' });
                            }
                        }} 
                    />
                </TabsContent>
            </Tabs>
        </div>
      )}

      <Dialog open={isExpenseFormOpen} onOpenChange={setIsExpenseFormOpen}>
        <DialogContent 
            className="max-md" 
            onPointerDownOutside={(e) => e.preventDefault()} 
            onInteractOutside={(e) => e.preventDefault()}
        >
            <DialogHeader><DialogTitle>{selectedExpense ? 'Editar Pagamento' : 'Novo Gasto Operacional'}</DialogTitle></DialogHeader>
            <ExpenseForm expense={selectedExpense} categories={userSettings?.expenseCategories || initialExpenseCategories} onSubmit={handleExpenseSubmit} isSaving={isSaving} />
        </DialogContent>
      </Dialog>

      <Dialog open={!!dialogData} onOpenChange={(o) => !o && setDialogData(null)}>
        <DialogContent 
            className="max-w-4xl h-[90vh] flex flex-col"
            onPointerDownOutside={(e) => e.preventDefault()} 
            onInteractOutside={(e) => e.preventDefault()}
        >
            <DialogHeader><DialogTitle>{dialogData?.title}</DialogTitle></DialogHeader>
            <div className="flex-1 overflow-y-auto"><ProposalsStatusTable proposals={dialogData?.proposals || []} customers={customers || []} /></div>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
