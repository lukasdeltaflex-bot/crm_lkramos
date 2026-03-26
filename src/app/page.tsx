'use client';
import React, { useState, useEffect, useMemo } from 'react';
import { AppLayout } from '@/components/app-layout';
import { StatsCard } from '@/components/dashboard/stats-card';
import { useUser, useFirestore, useCollection, useMemoFirebase, useDoc } from '@/firebase';
import { collection, query, where, doc, setDoc, orderBy, limit } from 'firebase/firestore';
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
  Target,
  Trophy
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
import { GamificationPanel } from '@/components/dashboard/gamification-panel';
import { SystemHealthPanel } from '@/components/dashboard/system-health-panel';
import { toast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

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

  const timeWindowStr = useMemo(() => {
      const d = new Date();
      d.setFullYear(d.getFullYear() - 2); // 2 anos de janela para cobrir a maturidade do RadarWidget com folga
      return d.toISOString().substring(0, 10);
  }, []);

  const proposalsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(
        collection(firestore, 'loanProposals'), 
        where('ownerId', '==', user.uid), 
        where('dateDigitized', '>=', timeWindowStr) // ⚡ Requer índice: ownerId + dateDigitized
    );
  }, [firestore, user, timeWindowStr]);

  const { data: rawProposals, isLoading: proposalsLoading } = useCollection<Proposal>(proposalsQuery);
  
  const proposals = useMemo(() => {
    if (!rawProposals) return [];
    return rawProposals.filter(p => p.deleted !== true);
  }, [rawProposals]);

  const customersQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, 'customers'), where('ownerId', '==', user.uid)); // Limite removido para não afetar base de clientes do Dashboard
  }, [firestore, user]);
  const { data: rawCustomers } = useCollection<Customer>(customersQuery);
  
  const customers = useMemo(() => {
    if (!rawCustomers) return [];
    return rawCustomers.filter(c => c.deleted !== true);
  }, [rawCustomers]);

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

  const handleGoalsChange = async (monthly: number, daily: number) => {
    if (!user || !firestore) return;
    try {
        await setDoc(doc(firestore, 'userSettings', user.uid), { monthlyGoal: monthly, dailyGoal: daily }, { merge: true });
        toast({ title: 'Metas Atualizadas' });
    } catch (e) {
        toast({ variant: 'destructive', title: 'Erro ao salvar metas' });
    }
  };

  const handleApplyFilter = () => {
    const startDate = parse(startDateInput, 'dd/MM/yyyy', new Date());
    const endDate = parse(endDateInput, 'dd/MM/yyyy', new Date());
    if (isValid(startDate) && isValid(endDate)) {
        setAppliedDateRange({ from: startOfDay(startDate), to: endOfDay(endDate) });
    } else if (isValid(startDate)) {
        setAppliedDateRange({ from: startOfDay(startDate), to: endOfDay(startDate) });
    } else {
        setAppliedDateRange(undefined);
    }
  };

  const handleDateMask = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, "");
    if (value.length > 8) value = value.substring(0, 8);
    value = value.replace(/(\d{2})(\d)/, '$1/$2');
    value = value.replace(/(\d{2})(\d)/, '$1/$2');
    e.target.value = value;
    return value;
  };

  const applyRangeShortcut = (range: string) => {
    const now = new Date();
    let from = startOfMonth(now);
    let to = now;
    if (range === 'today') from = startOfDay(now);
    if (range === 'yesterday') { from = startOfDay(subDays(now, 1)); to = endOfDay(subDays(now, 1)); }
    if (range === 'week') from = startOfDay(subDays(now, 7));
    
    setStartDateInput(format(from, 'dd/MM/yyyy'));
    setEndDateInput(format(to, 'dd/MM/yyyy'));
    setAppliedDateRange({ from, to });
  };

  const copyLeadLink = () => {
    if (!user) return;
    const link = `${window.location.protocol}//${window.location.host}/enviar/${user.uid}`;
    navigator.clipboard.writeText(link);
    toast({ title: 'Link Copiado!' });
  };

  const stats = useMemo(() => {
    if (!isClient || !proposals) return null;

    const today = new Date();
    const fromDate = appliedDateRange?.from || startOfMonth(today);
    const toDate = appliedDateRange?.to || endOfMonth(today);
    const effectiveToDate = endOfDay(toDate);

    const prevMonthStart = startOfMonth(subMonths(fromDate, 1));
    const prevMonthEnd = endOfMonth(subMonths(fromDate, 1));

    const safeVal = (v: any) => (v === null || v === undefined || isNaN(v)) ? 0 : Number(v);

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

        if (p.status !== 'Reprovado' && statusLists[p.status]) {
            statusLists[p.status].push(p);
        }

        if (p.status === 'Reprovado') {
            const rejectionDate = p.statusUpdatedAt ? new Date(p.statusUpdatedAt) : (p.dateDigitized ? new Date(p.dateDigitized) : null);
            if (rejectionDate && isValid(rejectionDate) && rejectionDate >= fromDate && rejectionDate <= effectiveToDate) {
                statusLists['Reprovado'].push(p);
            }
        }

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
  }, [isClient, proposals, appliedDateRange]);

  if (!isClient || !stats) {
    return <AppLayout><div className="space-y-8 animate-pulse"><Skeleton className="h-32 w-full rounded-2xl" /><div className="grid grid-cols-1 md:grid-cols-3 gap-4"><Skeleton className="h-40 w-full rounded-2xl" /><Skeleton className="h-40 w-full rounded-2xl" /><Skeleton className="h-40 w-full rounded-2xl" /></div></div></AppLayout>;
  }

  const currentMonthlyProduction = stats.proposals.pagoNoMes.reduce((sum, p) => sum + (p.grossAmount || 0), 0);
  
  const currentDailyProduction = (() => {
      const today = startOfDay(new Date());
      const endToday = endOfDay(new Date());
      return stats.proposals.digitadoNoMes.reduce((sum, p) => {
          if (!p.dateDigitized) return sum;
          const pd = new Date(p.dateDigitized);
          return (isValid(pd) && pd >= today && pd <= endToday) ? sum + (p.commissionValue || 0) : sum;
      }, 0);
  })();

  const isGoalReached = currentMonthlyProduction >= (userSettings?.monthlyGoal || 150000);

  return (
    <AppLayout>
       <div className="space-y-8 animate-in fade-in duration-500 w-full max-w-full pb-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-foreground">Dashboard</h1>
                <p className="text-sm text-muted-foreground">Monitoramento inteligente de propostas e esteira operacional</p>
            </div>
            
            <div className="flex items-center gap-3 flex-wrap">
                <div className="flex items-center gap-3 bg-background border-2 border-zinc-200 dark:border-primary/20 rounded-full px-3 py-1 shadow-sm transition-all hover:border-primary/40">
                    <Select onValueChange={applyRangeShortcut}>
                        <SelectTrigger className="h-7 w-[120px] border-none bg-transparent focus:ring-0 text-xs font-black uppercase p-0">
                            <CalendarIcon className="mr-2 h-3.5 w-3.5 text-primary" />
                            <SelectValue placeholder="PERÍODO" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="today">Hoje</SelectItem>
                            <SelectItem value="yesterday">Ontem</SelectItem>
                            <SelectItem value="week">Últimos 7 dias</SelectItem>
                            <SelectItem value="month">Mês Atual</SelectItem>
                        </SelectContent>
                    </Select>
                    <Separator orientation="vertical" className="h-4 mx-1 bg-zinc-300 dark:bg-zinc-700" />
                    <div className="flex items-center gap-1">
                        <Input 
                            placeholder="De" 
                            value={startDateInput} 
                            onChange={(e) => setStartDateInput(handleDateMask(e))} 
                            className="h-7 w-28 border-none bg-muted/40 text-[11px] text-center font-black rounded-full focus-visible:ring-primary/20" 
                        />
                        <span className="text-muted-foreground font-black opacity-40">-</span>
                        <Input 
                            placeholder="Até" 
                            value={endDateInput} 
                            onChange={(e) => setEndDateInput(handleDateMask(e))} 
                            className="h-7 w-28 border-none bg-muted/40 text-[11px] text-center font-black rounded-full focus-visible:ring-primary/20" 
                        />
                    </div>
                    <Button 
                        size="sm" 
                        onClick={handleApplyFilter} 
                        className="h-7 bg-primary text-white hover:bg-primary/90 rounded-full px-4 text-[10px] font-black uppercase shadow-sm gap-1.5 transition-all active:scale-95"
                    >
                        <Filter className="h-3 w-3" /> APLICAR
                    </Button>
                    {appliedDateRange && (
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-7 w-7 text-destructive hover:bg-red-50 rounded-full" 
                            onClick={() => { setStartDateInput(''); setEndDateInput(''); setAppliedDateRange(undefined); }}
                        >
                            <X className="h-3.5 w-3.5" />
                        </Button>
                    )}
                </div>
                
                <Button 
                    variant="ghost" 
                    size="icon" 
                    className='h-10 w-10 bg-card border border-border/50 rounded-full shadow-sm hover:bg-muted transition-colors' 
                    onClick={() => setIsPrivacyMode(!isPrivacyMode)}
                >
                    {isPrivacyMode ? <EyeOff className='h-5 w-5' /> : <Eye className='h-5 w-5' />}
                </Button>
            </div>
        </div>

        <div className="w-full">
            {isGoalReached && (
                <Alert className="bg-emerald-500/10 border-emerald-500/50 rounded-2xl mb-6 animate-in slide-in-from-top duration-700">
                    <Trophy className="h-5 w-5 text-emerald-600" />
                    <AlertTitle className="text-emerald-800 dark:text-emerald-400 font-black uppercase text-xs tracking-widest">Meta de Produção Atingida! 🏆</AlertTitle>
                    <AlertDescription className="text-emerald-700 dark:text-emerald-300 text-sm font-medium">
                        Parabéns pela performance extraordinária! Você alcançou 100% da sua meta mensal.
                    </AlertDescription>
                </Alert>
            )}
            <GoalCard 
                currentProduction={currentMonthlyProduction} 
                totalDigitized={stats.totalDigitado}
                monthlyGoal={userSettings?.monthlyGoal || 150000}
                onGoalChange={handleGoalChange}
                isPrivacyMode={isPrivacyMode}
                onValueClick={() => setDialogData({ title: 'Contratos Pagos no Período', proposals: stats.proposals.pagoNoMes })}
                topContributor={stats.topTotal}
                sparklineData={stats.productionTrend}
                isHot={isGoalReached}
            />
        </div>

        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            <div className="cursor-pointer" onClick={() => setDialogData({ title: 'Total Digitado (Mês Vigente)', proposals: stats.proposals.digitadoNoMes })}>
                <StatsCard title="TOTAL DIGITADO" value={isPrivacyMode ? '•••••' : formatCurrency(stats.totalDigitado)} icon={FileText} description="PRODUÇÃO MENSAL" topContributor={stats.topTotal} percentage={stats.digitizedTrendPercentage} sparklineData={stats.productionTrend}/>
            </div>
            {['Pendente', 'Em Andamento', 'Aguardando Saldo', 'Saldo Pago', 'Reprovado'].map(s => (
                <div key={s} className="cursor-pointer" onClick={() => setDialogData({ title: `${s} (${s === 'Reprovado' ? 'Mês Vigente' : 'Esteira'})`, proposals: stats.statusAnalysis[s].proposals })}>
                    <StatsCard 
                        title={s} 
                        value={isPrivacyMode ? '•••••' : formatCurrency(stats.statusAnalysis[s].total)} 
                        icon={s === 'Pendente' ? BadgePercent : s === 'Em Andamento' ? Hourglass : s === 'Aguardando Saldo' ? Clock : s === 'Saldo Pago' ? CheckCircle2 : XCircle} 
                        description={s === 'Reprovado' ? "TOTAL REPROVADO NO MÊS" : "ESTEIRA ATUAL"} 
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

        {/* ⚡ NOVAS FUNCIONALIDADES ISOLADAS */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <GamificationPanel 
                currentProduction={currentMonthlyProduction} 
                monthlyGoal={userSettings?.monthlyGoal || 150000} 
                currentDailyProduction={currentDailyProduction}
                dailyGoal={userSettings?.dailyGoal || 5000}
                onGoalsChange={handleGoalsChange}
                dailyHistory={(() => {
                    if (!stats) return [];
                    const today = new Date();
                    const days = eachDayOfInterval({ start: startOfMonth(today), end: endOfMonth(today) });
                    return days.map(day => {
                        const ds = startOfDay(day);
                        const de = endOfDay(day);
                        let commission = 0;
                        let contract = 0;
                        stats.proposals.digitadoNoMes.forEach(p => {
                            if (!p.dateDigitized) return;
                            const pd = new Date(p.dateDigitized);
                            if (isValid(pd) && pd >= ds && pd <= de) {
                                commission += (p.commissionValue || 0);
                                contract += (p.grossAmount || 0);
                            }
                        });
                        return { date: day, commission, contract };
                    });
                })()}
            />
            <SystemHealthPanel totalCustomers={customers.length} totalProposals={proposals.length} />
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
