'use client';
import React, { useState, useEffect, useMemo } from 'react';
import { AppLayout } from '@/components/app-layout';
import { StatsCard } from '@/components/dashboard/stats-card';
import { useUser, useFirestore, useCollection, useMemoFirebase, useDoc } from '@/firebase';
import { collection, query, where, doc } from 'firebase/firestore';
import {
  FileText,
  Clock,
  Hourglass,
  BadgePercent,
  Eye,
  EyeOff,
  X,
  Filter,
  XCircle,
  CheckCircle2,
  Calendar as CalendarIcon
} from 'lucide-react';
import { format, startOfMonth, endOfMonth, isValid, startOfDay, subDays, endOfDay, subMonths, parse } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { formatCurrency, cn } from '@/lib/utils';
import type { Proposal, Customer, UserProfile } from '@/lib/types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ProposalsStatusTable } from '@/components/dashboard/proposals-status-table';
import { DateRange } from 'react-day-picker';
import { Input } from '@/components/ui/input';
import { GoalCard } from '@/components/dashboard/goal-card';
import { PartnerPerformanceCharts } from '@/components/dashboard/partner-performance-charts';
import { DailySummary } from '@/components/summary/daily-summary';
import { RecentProposals } from '@/components/dashboard/recent-proposals';
import { Separator } from '@/components/ui/separator';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { CommissionChart } from '@/components/dashboard/commission-chart';
import { ProductBreakdownChart } from '@/components/dashboard/product-breakdown-chart';

export default function DashboardPage() {
  const [startDateInput, setStartDateInput] = useState('');
  const [endDateInput, setEndDateInput] = useState('');
  const [appliedDateRange, setAppliedDateRange] = useState<DateRange | undefined>(undefined);
  const [isPrivacyMode, setIsPrivacyMode] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const { user } = useUser();
  const firestore = useFirestore();

  const [dialogData, setDialogData] = useState<{ title: string; proposals: Proposal[] } | null>(null);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const proposalsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, 'loanProposals'), where('ownerId', '==', user.uid));
  }, [firestore, user]);

  const { data: proposals, isLoading: proposalsLoading } = useCollection<Proposal>(proposalsQuery);
  
  const customersQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, 'customers'), where('ownerId', '==', user.uid));
  }, [firestore, user]);
  const { data: customers, isLoading: customersLoading } = useCollection<Customer>(customersQuery);

  const userProfileDocRef = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user]);
  const { data: userProfile } = useDoc<UserProfile>(userProfileDocRef);

  const handleDateInputChange = (value: string, type: 'start' | 'end') => {
    let formattedValue = value.replace(/\D/g, '');
    if (formattedValue.length > 8) formattedValue = formattedValue.substring(0, 8);
    formattedValue = formattedValue.replace(/(\d{2})(\d)/, '$1/$2');
    formattedValue = formattedValue.replace(/(\d{2})(\d)/, '$1/$2');
    
    if (type === 'start') {
      setStartDateInput(formattedValue);
    } else {
      setEndDateInput(formattedValue);
    }
  };

  const applyRange = (range: 'today' | 'yesterday' | 'week' | 'month' | 'lastMonth') => {
    const now = new Date();
    let from: Date;
    let to: Date = now;

    switch (range) {
        case 'today': from = startOfDay(now); break;
        case 'yesterday': from = startOfDay(subDays(now, 1)); to = endOfDay(subDays(now, 1)); break;
        case 'week': from = startOfDay(subDays(now, 7)); break;
        case 'month': from = startOfMonth(now); break;
        case 'lastMonth': from = startOfMonth(subMonths(now, 1)); to = endOfMonth(subMonths(now, 1)); break;
        default: return;
    }

    setStartDateInput(from.toLocaleDateString('pt-BR'));
    setEndDateInput(to.toLocaleDateString('pt-BR'));
    setAppliedDateRange({ from, to });
  };

  const handleApplyFilter = () => {
    const startDate = parse(startDateInput, 'dd/MM/yyyy', new Date());
    const endDate = parse(endDateInput, 'dd/MM/yyyy', new Date());
    if (isValid(startDate) && isValid(endDate)) {
        setAppliedDateRange({ from: startDate, to: endDate });
    }
  };

  const clearDates = () => {
    setStartDateInput('');
    setEndDateInput('');
    setAppliedDateRange(undefined);
  }

  const stats = useMemo(() => {
    if (!proposals || !isClient) return null;

    const today = new Date();
    const fromDate = appliedDateRange?.from || startOfMonth(today);
    const toDate = appliedDateRange?.to || endOfMonth(today);
    const effectiveToDate = new Date(toDate);
    effectiveToDate.setHours(23, 59, 59, 999);

    const startOfPipeline = startOfMonth(subMonths(fromDate, 1));

    const getSum = (list: Proposal[]) => list.reduce((sum, p) => sum + (p.grossAmount || 0), 0);

    // 1. Propostas DIGITADAS no período (BASE para %)
    const digitizedInPeriod = proposals.filter(p => {
        if (!p.dateDigitized) return false;
        const d = new Date(p.dateDigitized);
        return d >= fromDate && d <= effectiveToDate;
    });

    // 2. Contratos PAGOS: Considera data de pagamento (pode vir de meses passados)
    const paidInPeriod = proposals.filter(p => {
        if (p.status !== 'Pago' && p.status !== 'Saldo Pago') return false;
        if (!p.datePaidToClient) return false;
        const d = new Date(p.datePaidToClient);
        return d >= fromDate && d <= effectiveToDate;
    });

    // 3. Propostas acumuladas para esteira ativa (Pipeline completa)
    const accumulatedProposals = proposals.filter(p => {
        if (!p.dateDigitized) return false;
        const d = new Date(p.dateDigitized);
        return d >= startOfPipeline && d <= effectiveToDate;
    });

    const totalDigitadoMonth = getSum(digitizedInPeriod);
    
    // Funçao para calcular % baseada no Total Digitado do Mês
    const getPerc = (val: number) => totalDigitadoMonth > 0 ? (val / totalDigitadoMonth) * 100 : 0;

    return {
        totalDigitado: totalDigitadoMonth,
        pendente: getSum(accumulatedProposals.filter(p => p.status === 'Pendente')),
        emAndamento: getSum(accumulatedProposals.filter(p => p.status === 'Em Andamento')),
        aguardandoSaldo: getSum(accumulatedProposals.filter(p => p.status === 'Aguardando Saldo')),
        saldoPago: getSum(accumulatedProposals.filter(p => p.status === 'Saldo Pago')),
        reprovado: getSum(digitizedInPeriod.filter(p => p.status === 'Reprovado')),
        pago: getSum(paidInPeriod),
        totalPagoMeta: getSum(paidInPeriod), 
        percPendente: getPerc(getSum(accumulatedProposals.filter(p => p.status === 'Pendente'))),
        percEmAndamento: getPerc(getSum(accumulatedProposals.filter(p => p.status === 'Em Andamento'))),
        percAguardandoSaldo: getPerc(getSum(accumulatedProposals.filter(p => p.status === 'Aguardando Saldo'))),
        percSaldoPago: getPerc(getSum(accumulatedProposals.filter(p => p.status === 'Saldo Pago'))),
        percReprovado: getPerc(getSum(digitizedInPeriod.filter(p => p.status === 'Reprovado'))),
        proposals: {
            pendente: accumulatedProposals.filter(p => p.status === 'Pendente'),
            emAndamento: accumulatedProposals.filter(p => p.status === 'Em Andamento'),
            aguardandoSaldo: accumulatedProposals.filter(p => p.status === 'Aguardando Saldo'),
            saldoPago: accumulatedProposals.filter(p => p.status === 'Saldo Pago'),
            reprovado: digitizedInPeriod.filter(p => p.status === 'Reprovado'),
            pago: paidInPeriod,
            todos: digitizedInPeriod
        }
    };
  }, [proposals, appliedDateRange, isClient]);

  const handleShowDetails = (title: string, props: Proposal[]) => {
    setDialogData({ title, proposals: props });
  }

  const rawMonthName = isClient ? format(appliedDateRange?.from || new Date(), 'MMMM', { locale: ptBR }) : 'Mês';
  const currentMonthName = rawMonthName.charAt(0).toUpperCase() + rawMonthName.slice(1);

  if (!stats) return null;

  return (
    <AppLayout>
       <div className="space-y-6 animate-in fade-in duration-500 w-full max-w-full">
        <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-foreground">Dashboard</h1>
                <p className="text-sm text-muted-foreground">Exibindo dados para {currentMonthName}</p>
            </div>
            <div className="flex items-center gap-2 flex-wrap bg-card p-2 rounded-xl border border-border/50 shadow-sm">
                <Select onValueChange={(val) => applyRange(val as any)}>
                    <SelectTrigger className='w-[140px] h-9 border-none shadow-none focus:ring-0'>
                        <CalendarIcon className='mr-2 h-4 w-4 text-primary' />
                        <SelectValue placeholder="Período" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="today">Hoje</SelectItem>
                        <SelectItem value="yesterday">Ontem</SelectItem>
                        <SelectItem value="week">Últimos 7 dias</SelectItem>
                        <SelectItem value="month">Mês Atual</SelectItem>
                        <SelectItem value="lastMonth">Mês Passado</SelectItem>
                    </SelectContent>
                </Select>
                <Separator orientation="vertical" className="h-6 mx-1 hidden sm:block" />
                <div className="flex items-center gap-1">
                    <span className='text-xs text-muted-foreground px-1'>De</span>
                    <Input 
                        placeholder="--" 
                        value={startDateInput}
                        onChange={(e) => handleDateInputChange(e.target.value, 'start')}
                        maxLength={10}
                        className="h-9 w-24 border-none shadow-none text-center"
                    />
                    <span className='text-muted-foreground'>-</span>
                    <span className='text-xs text-muted-foreground px-1'>Até</span>
                    <Input 
                        placeholder="--" 
                        value={endDateInput}
                        onChange={(e) => handleDateInputChange(e.target.value, 'end')}
                        maxLength={10}
                        className="h-9 w-24 border-none shadow-none text-center"
                    />
                </div>
                <Button size="sm" onClick={handleApplyFilter} className='h-8 bg-primary hover:bg-primary/90'><Filter className="h-3 w-3 mr-1" /> Filtrar</Button>
                {(startDateInput || appliedDateRange) && (
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={clearDates}><X className="h-4 w-4" /></Button>
                )}
                <Separator orientation="vertical" className="h-6 mx-1 hidden sm:block" />
                <Button variant="ghost" size="icon" className='h-8 w-8' onClick={() => setIsPrivacyMode(!isPrivacyMode)}>
                    {isPrivacyMode ? <EyeOff className='h-4 w-4' /> : <Eye className='h-4 w-4' />}
                </Button>
            </div>
        </div>

        <div className="w-full">
            <GoalCard 
                currentProduction={stats.totalPagoMeta} 
                totalDigitized={stats.totalDigitado}
                isPrivacyMode={isPrivacyMode}
                onValueClick={() => handleShowDetails('Contratos Pagos no Período', stats.proposals.pago)}
            />
        </div>

        <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
            <div className="cursor-pointer" onClick={() => handleShowDetails('Total Digitado (Mês)', stats.proposals.todos)}>
                <StatsCard 
                    title="Total Digitado" 
                    value={isPrivacyMode ? '•••••' : formatCurrency(stats.totalDigitado)} 
                    icon={FileText} 
                    percentage={100}
                    description="PRODUÇÃO MENSAL"
                />
            </div>
            <div className="cursor-pointer" onClick={() => handleShowDetails('Pendentes (Acumulado)', stats.proposals.pendente)}>
                <StatsCard 
                    title="Pendente" 
                    value={isPrivacyMode ? '•••••' : formatCurrency(stats.pendente)} 
                    icon={BadgePercent} 
                    percentage={stats.percPendente}
                    description="VS PRODUÇÃO ATUAL"
                />
            </div>
            <div className="cursor-pointer" onClick={() => handleShowDetails('Em Andamento (Acumulado)', stats.proposals.emAndamento)}>
                <StatsCard 
                    title="Em Andamento" 
                    value={isPrivacyMode ? '•••••' : formatCurrency(stats.emAndamento)} 
                    icon={Hourglass} 
                    percentage={stats.percEmAndamento}
                    description="VS PRODUÇÃO ATUAL"
                />
            </div>
        </div>

        <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
            <div className="cursor-pointer" onClick={() => handleShowDetails('Aguardando Saldo (Acumulado)', stats.proposals.aguardandoSaldo)}>
                <StatsCard 
                    title="Aguardando Saldo" 
                    value={isPrivacyMode ? '•••••' : formatCurrency(stats.aguardandoSaldo)} 
                    icon={Clock} 
                    percentage={stats.percAguardandoSaldo}
                    description="VS PRODUÇÃO ATUAL"
                />
            </div>
            <div className="cursor-pointer" onClick={() => handleShowDetails('Saldo Pago (Acumulado)', stats.proposals.saldoPago)}>
                <StatsCard 
                    title="Saldo Pago" 
                    value={isPrivacyMode ? '•••••' : formatCurrency(stats.saldoPago)} 
                    icon={CheckCircle2} 
                    percentage={stats.percSaldoPago}
                    description="VS PRODUÇÃO ATUAL"
                />
            </div>
            <div className="cursor-pointer" onClick={() => handleShowDetails('Reprovado (Mês)', stats.proposals.reprovado)}>
                <StatsCard 
                    title="Reprovado" 
                    value={isPrivacyMode ? '•••••' : formatCurrency(stats.reprovado)} 
                    icon={XCircle} 
                    percentage={stats.percReprovado}
                    description="DO TOTAL DIGITADO"
                />
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
                <CommissionChart proposals={proposals || []} />
            </div>
            <div className="lg:col-span-1">
                <ProductBreakdownChart proposals={stats.proposals.todos} />
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
                <PartnerPerformanceCharts proposals={stats.proposals.todos} />
            </div>
            <div className="lg:col-span-1">
                <DailySummary 
                    proposals={proposals || []}
                    customers={customers || []}
                    userProfile={userProfile || null}
                />
            </div>
        </div>

        <div className="grid grid-cols-1 gap-8">
            <RecentProposals 
                proposals={proposals || []}
                customers={customers || []}
                isLoading={proposalsLoading || customersLoading}
            />
        </div>
      </div>

      <Dialog open={!!dialogData} onOpenChange={(isOpen) => !isOpen && setDialogData(null)}>
            <DialogContent className="max-w-4xl h-[90vh] flex flex-col">
                <DialogHeader><DialogTitle>{dialogData?.title}</DialogTitle></DialogHeader>
                <div className="flex-1 overflow-y-auto">
                    <ProposalsStatusTable proposals={dialogData?.proposals || []} customers={customers || []} />
                </div>
            </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
