
'use client';
import React, { useState, useEffect, useMemo } from 'react';
import { AppLayout } from '@/components/app-layout';
import { StatsCard } from '@/components/dashboard/stats-card';
import { useUser, useFirestore, useCollection, useMemoFirebase, useDoc } from '@/firebase';
import { collection, query, where, doc, setDoc } from 'firebase/firestore';
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
import { format, startOfMonth, endOfMonth, isValid, startOfDay, subDays, endOfDay, subMonths, parse, eachDayOfInterval } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { formatCurrency, cn } from '@/lib/utils';
import type { Proposal, Customer, UserProfile, UserSettings } from '@/lib/types';
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
import { RadarWidget } from '@/components/dashboard/radar-widget';
import { toast } from '@/hooks/use-toast';

export default function DashboardPage() {
  const { user } = useUser();
  const firestore = useFirestore();

  const [dialogData, setDialogData] = useState<{ title: string; proposals: Proposal[] } | null>(null);
  const [startDateInput, setStartDateInput] = useState('');
  const [endDateInput, setEndDateInput] = useState('');
  const [appliedDateRange, setAppliedDateRange] = useState<DateRange | undefined>(undefined);
  const [isPrivacyMode, setIsPrivacyMode] = useState(false);
  const [isClient, setIsClient] = useState(false);
  
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
  const { data: customers } = useCollection<Customer>(customersQuery);

  const userProfileDocRef = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user]);
  const { data: userProfile } = useDoc<UserProfile>(userProfileDocRef);

  const settingsDocRef = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return doc(firestore, 'userSettings', user.uid);
  }, [firestore, user]);
  const { data: userSettings } = useDoc<UserSettings>(settingsDocRef);

  const handleGoalChange = async (newGoal: number) => {
    if (!user || !firestore) return;
    try {
        await setDoc(doc(firestore, 'userSettings', user.uid), {
            monthlyGoal: newGoal
        }, { merge: true });
        toast({ title: 'Meta Atualizada na Nuvem' });
    } catch (e) {
        toast({ variant: 'destructive', title: 'Erro ao salvar meta' });
    }
  };

  const handleDateInputChange = (value: string, type: 'start' | 'end') => {
    let formattedValue = value.replace(/\D/g, '');
    if (formattedValue.length > 8) formattedValue = formattedValue.substring(0, 8);
    formattedValue = formattedValue.replace(/(\d{2})(\d)/, '$1/$2');
    formattedValue = formattedValue.replace(/(\d{2})(\d)/, '$1/$2');
    if (type === 'start') setStartDateInput(formattedValue);
    else setEndDateInput(formattedValue);
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

    const prevMonthStart = startOfMonth(subMonths(fromDate, 1));
    const prevMonthEnd = endOfMonth(subMonths(fromDate, 1));

    // UNIVERSO MÊS VIGENTE (Performance e Reprovas)
    const digitizedInPeriod = proposals.filter(p => {
        if (!p.dateDigitized) return false;
        const d = new Date(p.dateDigitized);
        return d >= fromDate && d <= effectiveToDate;
    });

    const digitizedInPrevPeriod = proposals.filter(p => {
        if (!p.dateDigitized) return false;
        const d = new Date(p.dateDigitized);
        return d >= prevMonthStart && d <= prevMonthEnd;
    });

    // UNIVERSO ESTEIRA (Mês Vigente + Anterior)
    const digitizedInExtendedPeriod = proposals.filter(p => {
        if (!p.dateDigitized) return false;
        const d = new Date(p.dateDigitized);
        return d >= prevMonthStart && d <= effectiveToDate;
    });

    const getSum = (list: Proposal[]) => list.reduce((sum, p) => sum + (p.grossAmount || 0), 0);
    const getTopOperator = (list: Proposal[]) => {
        const ops: Record<string, number> = {};
        list.forEach(p => {
            if (p.operator) ops[p.operator] = (ops[p.operator] || 0) + p.grossAmount;
        });
        return Object.entries(ops).sort((a,b) => b[1] - a[1])[0]?.[0] || '---';
    };

    // CALCULO DE TENDÊNCIA (ÚLTIMOS 7 DIAS) PARA O SPARKLINE
    const last7Days = eachDayOfInterval({ start: subDays(today, 6), end: today });
    const productionTrend = last7Days.map(day => {
        const dayStart = startOfDay(day);
        const dayEnd = endOfDay(day);
        return proposals
            .filter(p => {
                const d = new Date(p.dateDigitized);
                return d >= dayStart && d <= dayEnd;
            })
            .reduce((sum, p) => sum + (p.grossAmount || 0), 0);
    });

    const statusAnalysis: Record<string, { total: number; count: number; proposals: Proposal[]; top: string; trend: number[] }> = {};
    const orderedFlow = ['Pendente', 'Em Andamento', 'Aguardando Saldo', 'Saldo Pago', 'Reprovado'];

    orderedFlow.forEach(status => {
        const sourceList = (status === 'Reprovado') ? digitizedInPeriod : digitizedInExtendedPeriod;
        const list = sourceList.filter(p => p.status === status);
        
        // Simula uma tendência simples para o sparkline baseada no status
        const trend = last7Days.map(day => {
            const dayStart = startOfDay(day);
            const dayEnd = endOfDay(day);
            return sourceList
                .filter(p => p.status === status && new Date(p.dateDigitized) >= dayStart && new Date(p.dateDigitized) <= dayEnd)
                .length;
        });

        statusAnalysis[status] = {
            total: getSum(list),
            count: list.length,
            proposals: list,
            top: getTopOperator(list),
            trend
        };
    });

    const paidInPeriod = proposals.filter(p => {
        if (p.status !== 'Pago') return false;
        if (!p.datePaidToClient) return false;
        const d = new Date(p.datePaidToClient);
        return d >= fromDate && d <= effectiveToDate;
    });

    const paidInPrevPeriod = proposals.filter(p => {
        if (p.status !== 'Pago') return false;
        if (!p.datePaidToClient) return false;
        const d = new Date(p.datePaidToClient);
        return d >= prevMonthStart && d <= prevMonthEnd;
    });

    const totalPaidCurrent = getSum(paidInPeriod);
    const totalPaidPrev = getSum(paidInPrevPeriod);
    const paidTrendPercentage = totalPaidPrev > 0 ? ((totalPaidCurrent - totalPaidPrev) / totalPaidPrev) * 100 : 0;

    const totalDigitizedCurrent = getSum(digitizedInPeriod);
    const totalDigitizedPrev = getSum(digitizedInPrevPeriod);
    const digitizedTrendPercentage = totalDigitizedPrev > 0 ? ((totalDigitizedCurrent - totalDigitizedPrev) / totalDigitizedPrev) * 100 : 0;

    // IDENTIFICA QUAL STATUS ESTÁ "EM ALTA" (Maior volume na esteira ativa)
    const hotStatus = Object.entries(statusAnalysis)
        .filter(([name]) => name !== 'Reprovado')
        .sort((a, b) => b[1].total - a[1].total)[0]?.[0];

    return {
        totalDigitado: totalDigitizedCurrent,
        digitizedTrendPercentage,
        productionTrend,
        paidTrendPercentage,
        topTotal: getTopOperator(digitizedInPeriod),
        statusAnalysis,
        hotStatus,
        proposals: {
            digitadoNoMes: digitizedInPeriod,
            pagoNoMes: paidInPeriod
        }
    };
  }, [proposals, appliedDateRange, isClient]);

  const handleShowDetails = (title: string, props: Proposal[]) => {
    setDialogData({ title, proposals: props });
  }

  if (!stats) return null;

  const rawMonthName = isClient ? format(appliedDateRange?.from || new Date(), 'MMMM', { locale: ptBR }) : 'Mês';
  const currentMonthName = rawMonthName.charAt(0).toUpperCase() + rawMonthName.slice(1);

  return (
    <AppLayout>
       <div className="space-y-8 animate-in fade-in duration-500 w-full max-w-full pb-10">
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
                currentProduction={stats.proposals.pagoNoMes.reduce((sum, p) => sum + (p.grossAmount || 0), 0)} 
                totalDigitized={stats.totalDigitado}
                monthlyGoal={userSettings?.monthlyGoal || 150000}
                onGoalChange={handleGoalChange}
                isPrivacyMode={isPrivacyMode}
                onValueClick={() => handleShowDetails('Contratos Pagos no Período', stats.proposals.pagoNoMes)}
                topContributor={stats.topTotal}
                sparklineData={stats.productionTrend}
            />
        </div>

        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            <div className="cursor-pointer" onClick={() => handleShowDetails('Total Digitado (Mês Vigente)', stats.proposals.digitadoNoMes)}>
                <StatsCard 
                    title="TOTAL DIGITADO" 
                    value={isPrivacyMode ? '•••••' : formatCurrency(stats.totalDigitado)} 
                    icon={FileText} 
                    description="PRODUÇÃO MENSAL"
                    topContributor={stats.topTotal}
                    percentage={stats.digitizedTrendPercentage}
                    sparklineData={stats.productionTrend}
                />
            </div>

            <div className="cursor-pointer" onClick={() => handleShowDetails('Pendente (Mês Atual + Anterior)', stats.statusAnalysis['Pendente'].proposals)}>
                <StatsCard 
                    title="Pendente" 
                    value={isPrivacyMode ? '•••••' : formatCurrency(stats.statusAnalysis['Pendente'].total)} 
                    icon={BadgePercent} 
                    description="ESTEIRA (MÊS ATUAL + ANT)"
                    topContributor={stats.statusAnalysis['Pendente'].top}
                    isHot={stats.hotStatus === 'Pendente'}
                    sparklineData={stats.statusAnalysis['Pendente'].trend}
                />
            </div>

            <div className="cursor-pointer" onClick={() => handleShowDetails('Em Andamento (Mês Atual + Anterior)', stats.statusAnalysis['Em Andamento'].proposals)}>
                <StatsCard 
                    title="Em Andamento" 
                    value={isPrivacyMode ? '•••••' : formatCurrency(stats.statusAnalysis['Em Andamento'].total)} 
                    icon={Hourglass} 
                    description="ESTEIRA (MÊS ATUAL + ANT)"
                    topContributor={stats.statusAnalysis['Em Andamento'].top}
                    isHot={stats.hotStatus === 'Em Andamento'}
                    sparklineData={stats.statusAnalysis['Em Andamento'].trend}
                />
            </div>

            <div className="cursor-pointer" onClick={() => handleShowDetails('Aguardando Saldo (Mês Atual + Anterior)', stats.statusAnalysis['Aguardando Saldo'].proposals)}>
                <StatsCard 
                    title="Aguardando Saldo" 
                    value={isPrivacyMode ? '•••••' : formatCurrency(stats.statusAnalysis['Aguardando Saldo'].total)} 
                    icon={Clock} 
                    description="ESTEIRA (MÊS ATUAL + ANT)"
                    topContributor={stats.statusAnalysis['Aguardando Saldo'].top}
                    isHot={stats.hotStatus === 'Aguardando Saldo'}
                    sparklineData={stats.statusAnalysis['Aguardando Saldo'].trend}
                />
            </div>

            <div className="cursor-pointer" onClick={() => handleShowDetails('Saldo Pago (Mês Atual + Anterior)', stats.statusAnalysis['Saldo Pago'].proposals)}>
                <StatsCard 
                    title="Saldo Pago" 
                    value={isPrivacyMode ? '•••••' : formatCurrency(stats.statusAnalysis['Saldo Pago'].total)} 
                    icon={CheckCircle2} 
                    description="ESTEIRA (MÊS ATUAL + ANT)"
                    topContributor={stats.statusAnalysis['Saldo Pago'].top}
                    isHot={stats.hotStatus === 'Saldo Pago'}
                    sparklineData={stats.statusAnalysis['Saldo Pago'].trend}
                />
            </div>

            <div className="cursor-pointer" onClick={() => handleShowDetails('Reprovado (Digitados no Mês)', stats.statusAnalysis['Reprovado'].proposals)}>
                <StatsCard 
                    title="Reprovado" 
                    value={isPrivacyMode ? '•••••' : formatCurrency(stats.statusAnalysis['Reprovado'].total)} 
                    icon={XCircle} 
                    description="DO TOTAL DIGITADO NO MÊS"
                    topContributor={stats.statusAnalysis['Reprovado'].top}
                    sparklineData={stats.statusAnalysis['Reprovado'].trend}
                />
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
                <CommissionChart proposals={proposals || []} />
            </div>
            <div className="lg:col-span-1">
                <ProductBreakdownChart proposals={stats.proposals.digitadoNoMes} />
            </div>
        </div>

        <div className="w-full">
            <PartnerPerformanceCharts proposals={stats.proposals.digitadoNoMes} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <RadarWidget proposals={proposals || []} customers={customers || []} isLoading={proposalsLoading} />
            <DailySummary proposals={proposals || []} customers={customers || []} userProfile={userProfile || null} />
        </div>

        <div className="w-full">
            <RecentProposals proposals={proposals || []} customers={customers || []} isLoading={proposalsLoading} />
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
