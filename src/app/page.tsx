'use client';
import React, { useState, useEffect, useMemo } from 'react';
import { AppLayout } from '@/components/app-layout';
import { StatsCard } from '@/components/dashboard/stats-card';
import { useUser, useFirestore, useCollection, useMemoFirebase, useDoc } from '@/firebase';
import { collection, query, where, doc, setDoc, orderBy } from 'firebase/firestore';
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
  Calendar as CalendarIcon,
  Link as LinkIcon,
  Copy,
  Users,
  Check,
  Trash2,
  Download,
  Loader2,
  User as UserIcon,
  CircleDollarSign,
  Target
} from 'lucide-react';
import { format, startOfMonth, endOfMonth, isValid, startOfDay, subDays, endOfDay, subMonths, parse, eachDayOfInterval } from 'date-fns';
import { formatCurrency, cn, calculateBusinessDays, cleanFirestoreData } from '@/lib/utils';
import type { Proposal, Customer, UserProfile, UserSettings, Lead, Expense } from '@/lib/types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
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
import { HallOfFame } from '@/components/dashboard/hall-of-fame';
import { toast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

export default function DashboardPage() {
  const { user } = useUser();
  const firestore = useFirestore();

  const [dialogData, setDialogData] = useState<{ title: string; proposals: Proposal[] } | null>(null);
  const [startDateInput, setStartDateInput] = useState('');
  const [endDateInput, setEndDateInput] = useState('');
  const [appliedDateRange, setAppliedDateRange] = useState<DateRange | undefined>(undefined);
  const [isPrivacyMode, setIsPrivacyMode] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [isLeadsModalOpen, setIsLeadsModalOpen] = useState(false);
  const [isApprovingLead, setIsApprovingLead] = useState(false);
  
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

  const leadsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(
        collection(firestore, 'leads'), 
        where('ownerId', '==', user.uid),
        where('status', '==', 'pending'),
        orderBy('createdAt', 'desc')
    );
  }, [firestore, user]);
  const { data: pendingLeads } = useCollection<Lead>(leadsQuery);

  const expensesQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return collection(firestore, 'users', user.uid, 'expenses');
  }, [firestore, user]);
  const { data: expenses } = useCollection<Expense>(expensesQuery);

  const settingsDocRef = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return doc(firestore, 'userSettings', user.uid);
  }, [firestore, user]);
  const { data: userSettings } = useDoc<UserSettings>(settingsDocRef);

  const userProfileDocRef = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user]);
  const { data: userProfile } = useDoc<UserProfile>(userProfileDocRef);

  const handleGoalChange = async (newGoal: number) => {
    if (!user || !firestore) return;
    try {
        await setDoc(doc(firestore, 'userSettings', user.uid), { monthlyGoal: newGoal }, { merge: true });
        toast({ title: 'Meta Atualizada' });
    } catch (e) {
        toast({ variant: 'destructive', title: 'Erro ao salvar meta' });
    }
  };

  const copyLeadLink = () => {
    if (!user) return;
    const link = `${window.location.protocol}//${window.location.host}/enviar/${user.uid}`;
    navigator.clipboard.writeText(link);
    toast({ title: 'Link Copiado!' });
  };

  const stats = useMemo(() => {
    if (!proposals || !isClient) return null;

    const today = new Date();
    const fromDate = appliedDateRange?.from || startOfMonth(today);
    const toDate = appliedDateRange?.to || endOfMonth(today);
    const effectiveToDate = endOfDay(toDate);

    const prevMonthStart = startOfMonth(subMonths(fromDate, 1));
    const prevMonthEnd = endOfMonth(subMonths(fromDate, 1));

    const safeVal = (v: any) => (v === null || v === undefined || isNaN(v)) ? 0 : Number(v);

    // 🛡️ OTIMIZAÇÃO V14: Filtro de passagem única para reduzir complexidade O(n^2)
    const digitizedInPeriod: Proposal[] = [];
    const digitizedInPrevPeriod: Proposal[] = [];
    const paidInPeriod: Proposal[] = [];
    
    const statusLists: Record<string, Proposal[]> = {
        'Pendente': [], 'Em Andamento': [], 'Aguardando Saldo': [], 'Saldo Pago': [], 'Reprovado': []
    };

    proposals.forEach(p => {
        const d = p.dateDigitized ? new Date(p.dateDigitized) : null;
        if (d && isValid(d)) {
            if (d >= fromDate && d <= effectiveToDate) digitizedInPeriod.push(p);
            if (d >= prevMonthStart && d <= prevMonthEnd) digitizedInPrevPeriod.push(p);
        }

        if (statusLists[p.status]) statusLists[p.status].push(p);

        if (p.status === 'Pago' && p.datePaidToClient) {
            const pd = new Date(p.datePaidToClient);
            if (isValid(pd) && pd >= fromDate && pd <= effectiveToDate) paidInPeriod.push(p);
        }
    });

    const getSum = (list: Proposal[]) => list.reduce((sum, p) => sum + safeVal(p.grossAmount), 0);
    
    const getTopOperator = (list: Proposal[]) => {
        const ops: Record<string, number> = {};
        list.forEach(p => { if (p.operator) ops[p.operator] = (ops[p.operator] || 0) + safeVal(p.grossAmount); });
        return Object.entries(ops).sort((a,b) => b[1] - a[1])[0]?.[0] || '---';
    };

    const last7Days = eachDayOfInterval({ start: subDays(today, 6), end: today });
    const productionTrend = last7Days.map(day => {
        const ds = startOfDay(day);
        const de = endOfDay(day);
        return proposals.reduce((sum, p) => {
            const d = p.dateDigitized ? new Date(p.dateDigitized) : null;
            return (d && d >= ds && d <= de) ? sum + safeVal(p.grossAmount) : sum;
        }, 0);
    });

    const statusAnalysis: any = {};
    Object.keys(statusLists).forEach(s => {
        const list = statusLists[s];
        statusAnalysis[s] = { 
            total: getSum(list), 
            count: list.length, 
            proposals: list, 
            top: getTopOperator(list),
            trend: last7Days.map(day => {
                const ds = startOfDay(day);
                const de = endOfDay(day);
                return list.filter(p => {
                    const d = p.dateDigitized ? new Date(p.dateDigitized) : null;
                    return d && d >= ds && d <= de;
                }).length;
            })
        };
    });

    const totalDigitizedCurrent = getSum(digitizedInPeriod);
    const totalDigitizedPrev = getSum(digitizedInPrevPeriod);
    const digitizedTrendPercentage = totalDigitizedPrev > 0 ? ((totalDigitizedCurrent - totalDigitizedPrev) / totalDigitizedPrev) * 100 : 0;

    const criticalPortabilityCount = proposals.filter(p => p.product === 'Portabilidade' && p.status === 'Aguardando Saldo' && p.dateDigitized && calculateBusinessDays(p.dateDigitized) >= 5).length;

    return { 
        totalDigitado: totalDigitizedCurrent, 
        digitizedTrendPercentage, 
        productionTrend, 
        topTotal: getTopOperator(digitizedInPeriod), 
        statusAnalysis, 
        criticalPortabilityCount, 
        proposals: { digitadoNoMes: digitizedInPeriod, pagoNoMes: paidInPeriod },
        hotStatus: Object.entries(statusAnalysis).filter(([n]) => n !== 'Reprovado').sort((a: any, b: any) => b[1].total - a[1].total)[0]?.[0]
    };
  }, [proposals, appliedDateRange, isClient]);

  const applyRange = (range: string) => {
    const now = new Date();
    let from = startOfMonth(now);
    let to = now;
    if (range === 'today') from = startOfDay(now);
    if (range === 'yesterday') { from = startOfDay(subDays(now, 1)); to = endOfDay(subDays(now, 1)); }
    if (range === 'week') from = startOfDay(subDays(now, 7));
    setStartDateInput(from.toLocaleDateString('pt-BR'));
    setEndDateInput(to.toLocaleDateString('pt-BR'));
    setAppliedDateRange({ from, to });
  };

  if (!stats) return null;

  return (
    <AppLayout>
       <div className="space-y-8 animate-in fade-in duration-500 w-full max-w-full pb-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-foreground">Dashboard</h1>
                <p className="text-sm text-muted-foreground">Monitoramento inteligente LK RAMOS (UTC-3)</p>
            </div>
            <div className="flex items-center gap-2 flex-wrap bg-card p-2 rounded-xl border border-border/50 shadow-sm">
                <Select onValueChange={applyRange}>
                    <SelectTrigger className='w-[140px] h-9 border-none shadow-none focus:ring-0 font-medium'><CalendarIcon className='mr-2 h-4 w-4 text-primary' /><SelectValue placeholder="Período" /></SelectTrigger>
                    <SelectContent><SelectItem value="today">Hoje</SelectItem><SelectItem value="yesterday">Ontem</SelectItem><SelectItem value="week">Últimos 7 dias</SelectItem><SelectItem value="month">Mês Atual</SelectItem></SelectContent>
                </Select>
                <Separator orientation="vertical" className="h-6 mx-1 hidden sm:block" />
                <Button variant="ghost" size="icon" className='h-8 w-8' onClick={() => setIsPrivacyMode(!isPrivacyMode)}>{isPrivacyMode ? <EyeOff className='h-4 w-4' /> : <Eye className='h-4 w-4' />}</Button>
            </div>
        </div>

        <div className="w-full">
            <GoalCard 
                currentProduction={stats.proposals.pagoNoMes.reduce((sum, p) => sum + (p.grossAmount || 0), 0)} 
                totalDigitized={stats.totalDigitado}
                monthlyGoal={userSettings?.monthlyGoal || 150000}
                onGoalChange={handleGoalChange}
                isPrivacyMode={isPrivacyMode}
                onValueClick={() => setDialogData({ title: 'Contratos Pagos no Período', proposals: stats.proposals.pagoNoMes })}
                topContributor={stats.topTotal}
                sparklineData={stats.productionTrend}
            />
        </div>

        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            <div className="cursor-pointer" onClick={() => setDialogData({ title: 'Total Digitado (Mês Vigente)', proposals: stats.proposals.digitadoNoMes })}>
                <StatsCard title="TOTAL DIGITADO" value={isPrivacyMode ? '•••••' : formatCurrency(stats.totalDigitado)} icon={FileText} description="PRODUÇÃO MENSAL" topContributor={stats.topTotal} percentage={stats.digitizedTrendPercentage} sparklineData={stats.productionTrend}/>
            </div>
            {['Pendente', 'Em Andamento', 'Aguardando Saldo', 'Saldo Pago', 'Reprovado'].map(s => (
                <div key={s} className="cursor-pointer" onClick={() => setDialogData({ title: `${s} (Esteira)`, proposals: stats.statusAnalysis[s].proposals })}>
                    <StatsCard 
                        title={s} 
                        value={isPrivacyMode ? '•••••' : formatCurrency(stats.statusAnalysis[s].total)} 
                        icon={s === 'Pendente' ? BadgePercent : s === 'Em Andamento' ? Hourglass : s === 'Aguardando Saldo' ? Clock : s === 'Saldo Pago' ? CheckCircle2 : XCircle} 
                        description={s === 'Reprovado' ? "PRODUÇÃO MENSAL" : "ESTEIRA"} 
                        topContributor={stats.statusAnalysis[s].top} 
                        isHot={stats.hotStatus === s} 
                        isCritical={s === 'Aguardando Saldo' && stats.criticalPortabilityCount > 0}
                        subValue={s === 'Aguardando Saldo' && stats.criticalPortabilityCount > 0 ? `${stats.criticalPortabilityCount} CRÍTICAS` : undefined}
                        sparklineData={stats.statusAnalysis[s].trend}
                    />
                </div>
            ))}
        </div>

        <div className="w-full"><HallOfFame proposals={proposals || []} customers={customers || []} isLoading={proposalsLoading || !customers} /></div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2"><CommissionChart proposals={proposals || []} /></div>
            <div className="lg:col-span-1"><ProductBreakdownChart proposals={stats.proposals.digitadoNoMes} /></div>
        </div>

        <div className="w-full"><PartnerPerformanceCharts proposals={stats.proposals.digitadoNoMes} /></div>

        <Card className="border-2 border-primary/20 bg-primary/[0.02] shadow-lg overflow-hidden rounded-2xl">
            <CardContent className="p-0">
                <div className="flex flex-col md:flex-row items-center justify-between p-6 gap-6">
                    <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary"><LinkIcon className="h-6 w-6" /></div>
                        <div>
                            <h3 className="text-lg font-black uppercase tracking-tight text-primary">Portal de Captura de Leads</h3>
                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Link exclusivo para auto-cadastro do cliente</p>
                        </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                        <Button onClick={copyLeadLink} className="h-11 rounded-full px-8 font-black text-[10px] uppercase tracking-widest bg-primary shadow-xl shadow-primary/20"><Copy className="mr-2 h-4 w-4" /> Copiar Link de Envio</Button>
                    </div>
                </div>
            </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <RadarWidget proposals={proposals || []} customers={customers || []} isLoading={proposalsLoading} />
            <DailySummary proposals={proposals || []} customers={customers || []} userProfile={userProfile || null} expenses={expenses || []} />
        </div>

        <div className="w-full"><RecentProposals proposals={proposals || []} customers={customers || []} isLoading={proposalsLoading} /></div>
      </div>

      <Dialog open={!!dialogData} onOpenChange={(isOpen) => !isOpen && setDialogData(null)}>
            <DialogContent className="max-w-4xl h-[90vh] flex flex-col">
                <DialogHeader><DialogTitle>{dialogData?.title}</DialogTitle></DialogHeader>
                <div className="flex-1 overflow-y-auto"><ProposalsStatusTable proposals={dialogData?.proposals || []} customers={customers || []} /></div>
            </DialogContent>
      </Dialog>
    </AppLayout>
  );
}