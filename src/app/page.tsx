'use client';
import React, { useState, useEffect, useMemo } from 'react';
import { AppLayout } from '@/components/app-layout';
import { StatsCard } from '@/components/dashboard/stats-card';
import { useUser, useFirestore, useCollection, useMemoFirebase, useDoc } from '@/firebase';
import { collection, query, where, doc, setDoc, deleteDoc, getDocs, limit, orderBy } from 'firebase/firestore';
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
  ExternalLink,
  Loader2
} from 'lucide-react';
import { format, startOfMonth, endOfMonth, isValid, startOfDay, subDays, endOfDay, subMonths, parse, eachDayOfInterval } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { formatCurrency, cn, calculateBusinessDays, cleanFirestoreData } from '@/lib/utils';
import type { Proposal, Customer, UserProfile, UserSettings, Lead } from '@/lib/types';
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
  const { data: pendingLeads, isLoading: leadsLoading } = useCollection<Lead>(leadsQuery);

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
        await setDoc(doc(firestore, 'userSettings', user.uid), {
            monthlyGoal: newGoal
        }, { merge: true });
        toast({ title: 'Meta Atualizada na Nuvem' });
    } catch (e) {
        toast({ variant: 'destructive', title: 'Erro ao salvar meta' });
    }
  };

  const copyLeadLink = () => {
    if (!user) return;
    const protocol = window.location.protocol;
    const host = window.location.host;
    const link = `${protocol}//${host}/enviar/${user.uid}`;
    navigator.clipboard.writeText(link);
    toast({ title: 'Link Copiado!', description: 'Envie para o cliente preencher os dados.' });
  };

  const handleApproveLead = async (lead: Lead) => {
    if (!firestore || !user || !customers) return;
    setIsApprovingLead(true);
    try {
        const nextNumericId = customers.length ? Math.max(...customers.map(c => c.numericId || 0)) + 1 : 1;
        const customerId = doc(collection(firestore, 'customers')).id;
        
        const customerData: Partial<Customer> = {
            id: customerId,
            numericId: nextNumericId,
            ownerId: user.uid,
            name: lead.name,
            cpf: lead.cpf,
            phone: lead.phone,
            email: lead.email || '',
            birthDate: lead.birthDate,
            status: 'active',
            documents: lead.documents || [],
            observations: `Cadastro recebido via Portal de Leads em ${format(new Date(lead.createdAt), 'dd/MM/yyyy HH:mm')}.`
        };

        await setDoc(doc(firestore, 'customers', customerId), cleanFirestoreData(customerData));
        await setDoc(doc(firestore, 'leads', lead.id), { status: 'approved' }, { merge: true });
        
        toast({ title: 'Cliente Aprovado!', description: `${lead.name} agora está na sua base oficial.` });
    } catch (e) {
        toast({ variant: 'destructive', title: 'Erro ao aprovar ficha' });
    } finally {
        setIsApprovingLead(false);
    }
  };

  const handleDiscardLead = async (leadId: string) => {
    if (!firestore) return;
    try {
        await setDoc(doc(firestore, 'leads', leadId), { status: 'discarded' }, { merge: true });
        toast({ title: 'Ficha Descartada' });
    } catch (e) {
        toast({ variant: 'destructive', title: 'Erro ao descartar' });
    }
  };

  const stats = useMemo(() => {
    if (!proposals || !isClient) return null;

    const today = new Date();
    const fromDate = appliedDateRange?.from || startOfMonth(today);
    const toDate = appliedDateRange?.to || endOfMonth(today);
    const effectiveToDate = new Date(toDate);
    effectiveToDate.setHours(23, 59, 59, 999);

    const prevMonthStart = startOfMonth(subMonths(fromDate, 1));
    const prevMonthEnd = endOfMonth(subMonths(fromDate, 1));

    const safeVal = (v: any) => (v === null || v === undefined || isNaN(v)) ? 0 : Number(v);

    const digitizedInPeriod = proposals.filter(p => {
        if (!p.dateDigitized) return false;
        const d = new Date(p.dateDigitized);
        return isValid(d) && d >= fromDate && d <= effectiveToDate;
    });

    const digitizedInPrevPeriod = proposals.filter(p => {
        if (!p.dateDigitized) return false;
        const d = new Date(p.dateDigitized);
        return isValid(d) && d >= prevMonthStart && d <= prevMonthEnd;
    });

    const digitizedInExtendedPeriod = proposals.filter(p => {
        if (!p.dateDigitized) return false;
        const d = new Date(p.dateDigitized);
        return isValid(d) && d >= prevMonthStart && d <= effectiveToDate;
    });

    const getSum = (list: Proposal[]) => list.reduce((sum, p) => sum + safeVal(p.grossAmount), 0);
    const getTopOperator = (list: Proposal[]) => {
        const ops: Record<string, number> = {};
        list.forEach(p => {
            if (p.operator) ops[p.operator] = (ops[p.operator] || 0) + safeVal(p.grossAmount);
        });
        return Object.entries(ops).sort((a,b) => b[1] - a[1])[0]?.[0] || '---';
    };

    const last7Days = eachDayOfInterval({ start: subDays(today, 6), end: today });
    const productionTrend = last7Days.map(day => {
        const dayStart = startOfDay(day);
        const dayEnd = endOfDay(day);
        return proposals
            .filter(p => {
                if (!p.dateDigitized) return false;
                const d = new Date(p.dateDigitized);
                return isValid(d) && d >= dayStart && d <= dayEnd;
            })
            .reduce((sum, p) => sum + safeVal(p.grossAmount), 0);
    });

    const statusAnalysis: Record<string, { total: number; count: number; proposals: Proposal[]; top: string; trend: number[] }> = {};
    const orderedFlow = ['Pendente', 'Em Andamento', 'Aguardando Saldo', 'Saldo Pago', 'Reprovado'];

    orderedFlow.forEach(status => {
        const sourceList = (status === 'Reprovado') ? digitizedInPeriod : digitizedInExtendedPeriod;
        const list = sourceList.filter(p => p.status === status);
        
        const trend = last7Days.map(day => {
            const dayStart = startOfDay(day);
            const dayEnd = endOfDay(day);
            return sourceList
                .filter(p => {
                    if (!p.dateDigitized) return false;
                    const d = new Date(p.dateDigitized);
                    return p.status === status && isValid(d) && d >= dayStart && d <= dayEnd;
                })
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
        return isValid(d) && d >= fromDate && d <= effectiveToDate;
    });

    const paidInPrevPeriod = proposals.filter(p => {
        if (p.status !== 'Pago') return false;
        if (!p.datePaidToClient) return false;
        const d = new Date(p.datePaidToClient);
        return isValid(d) && d >= prevMonthStart && d <= prevMonthEnd;
    });

    const totalPaidCurrent = getSum(paidInPeriod);
    const totalPaidPrev = getSum(paidInPrevPeriod);
    const paidTrendPercentage = totalPaidPrev > 0 ? ((totalPaidCurrent - totalPaidPrev) / totalPaidPrev) * 100 : 0;

    const totalDigitizedCurrent = getSum(digitizedInPeriod);
    const totalDigitizedPrev = getSum(digitizedInPrevPeriod);
    const digitizedTrendPercentage = totalDigitizedPrev > 0 ? ((totalDigitizedCurrent - totalDigitizedPrev) / totalDigitizedPrev) * 100 : 0;

    const hotStatus = Object.entries(statusAnalysis)
        .filter(([name]) => name !== 'Reprovado')
        .sort((a, b) => b[1].total - a[1].total)[0]?.[0];

    const criticalPortabilityCount = proposals.filter(p => 
        p.product === 'Portabilidade' && 
        p.status === 'Aguardando Saldo' && 
        p.dateDigitized && 
        calculateBusinessDays(p.dateDigitized) >= 5
    ).length;

    return {
        totalDigitado: totalDigitizedCurrent,
        digitizedTrendPercentage,
        productionTrend,
        paidTrendPercentage,
        topTotal: getTopOperator(digitizedInPeriod),
        statusAnalysis,
        hotStatus,
        criticalPortabilityCount,
        proposals: {
            digitadoNoMes: digitizedInPeriod,
            pagoNoMes: paidInPeriod
        }
    };
  }, [proposals, appliedDateRange, isClient]);

  const handleDateInputChange = (value: string, type: 'start' | 'end') => {
    let v = value.replace(/\D/g, '').slice(0, 8);
    if (v.length >= 5) {
      v = `${v.slice(0, 2)}/${v.slice(2, 4)}/${v.slice(4)}`;
    } else if (v.length >= 3) {
      v = `${v.slice(0, 2)}/${v.slice(2)}`;
    }
    
    if (type === 'start') setStartDateInput(v);
    else setEndDateInput(v);
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
    if (isValid(startDate)) {
        setAppliedDateRange({ from: startOfDay(startDate), to: isValid(endDate) ? endOfDay(endDate) : endOfDay(startDate) });
    }
  };

  if (!stats) return null;

  return (
    <AppLayout>
       <div className="space-y-8 animate-in fade-in duration-500 w-full max-w-full pb-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-foreground">Dashboard</h1>
                <p className="text-sm text-muted-foreground">Exibindo dados operacionais da LK RAMOS</p>
            </div>
            <div className="flex items-center gap-2 flex-wrap bg-card p-2 rounded-xl border border-border/50 shadow-sm">
                <Select onValueChange={(val) => applyRange(val as any)}>
                    <SelectTrigger className='w-[140px] h-9 border-none shadow-none focus:ring-0 font-medium'>
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
                    <Input 
                        placeholder="De" 
                        value={startDateInput}
                        onChange={(e) => handleDateInputChange(e.target.value, 'start')}
                        maxLength={10}
                        className="h-9 w-24 border-none shadow-none text-center bg-muted/30 focus-visible:bg-muted/50 transition-colors"
                    />
                    <span className='text-muted-foreground'>-</span>
                    <Input 
                        placeholder="Até" 
                        value={endDateInput}
                        onChange={(e) => handleDateInputChange(e.target.value, 'end')}
                        maxLength={10}
                        className="h-9 w-24 border-none shadow-none text-center bg-muted/30 focus-visible:bg-muted/50 transition-colors"
                    />
                </div>
                <Button size="sm" onClick={handleApplyFilter} className='h-8 bg-primary hover:bg-primary/90 rounded-full px-4'><Filter className="h-3.5 w-3.5 mr-1.5" /> Aplicar</Button>
                {(startDateInput || appliedDateRange) && (
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setStartDateInput(''); setEndDateInput(''); setAppliedDateRange(undefined); }}><X className="h-4 w-4" /></Button>
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
                onValueClick={() => setDialogData({ title: 'Contratos Pagos no Período', proposals: stats.proposals.pagoNoMes })}
                topContributor={stats.topTotal}
                sparklineData={stats.productionTrend}
            />
        </div>

        {/* 🔗 PORTAL DE CAPTURA DE LEADS */}
        <Card className="border-2 border-primary/20 bg-primary/[0.02] shadow-lg overflow-hidden rounded-2xl">
            <CardContent className="p-0">
                <div className="flex flex-col md:flex-row items-center justify-between p-6 gap-6">
                    <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                            <LinkIcon className="h-6 w-6" />
                        </div>
                        <div>
                            <h3 className="text-lg font-black uppercase tracking-tight text-primary">Portal de Captura de Leads</h3>
                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Link exclusivo para auto-cadastro do cliente</p>
                        </div>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-3">
                        {pendingLeads && pendingLeads.length > 0 && (
                            <Button 
                                variant="outline" 
                                className="h-11 rounded-full px-6 border-orange-500 bg-orange-50 text-orange-600 font-black text-[10px] uppercase tracking-widest animate-pulse"
                                onClick={() => setIsLeadsModalOpen(true)}
                            >
                                <Users className="mr-2 h-4 w-4" /> {pendingLeads.length} Fichas Recebidas
                            </Button>
                        )}
                        <Button 
                            onClick={copyLeadLink}
                            className="h-11 rounded-full px-8 font-black text-[10px] uppercase tracking-widest bg-primary hover:bg-primary/90 shadow-xl shadow-primary/20"
                        >
                            <Copy className="mr-2 h-4 w-4" /> Copiar Link de Envio
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>

        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            <div className="cursor-pointer" onClick={() => setDialogData({ title: 'Total Digitado (Mês Vigente)', proposals: stats.proposals.digitadoNoMes })}>
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

            <div className="cursor-pointer" onClick={() => setDialogData({ title: 'Pendente (Esteira)', proposals: stats.statusAnalysis['Pendente'].proposals })}>
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

            <div className="cursor-pointer" onClick={() => setDialogData({ title: 'Em Andamento (Esteira)', proposals: stats.statusAnalysis['Em Andamento'].proposals })}>
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

            <div className="cursor-pointer" onClick={() => setDialogData({ title: 'Aguardando Saldo (Esteira)', proposals: stats.statusAnalysis['Aguardando Saldo'].proposals })}>
                <StatsCard 
                    title="Aguardando Saldo" 
                    value={isPrivacyMode ? '•••••' : formatCurrency(stats.statusAnalysis['Aguardando Saldo'].total)} 
                    icon={Clock} 
                    description="ESTEIRA (MÊS ATUAL + ANT)"
                    subValue={stats.criticalPortabilityCount > 0 ? `${stats.criticalPortabilityCount} CRÍTICAS` : undefined}
                    isCritical={stats.criticalPortabilityCount > 0}
                    topContributor={stats.statusAnalysis['Aguardando Saldo'].top}
                    isHot={stats.hotStatus === 'Aguardando Saldo'}
                    sparklineData={stats.statusAnalysis['Aguardando Saldo'].trend}
                />
            </div>

            <div className="cursor-pointer" onClick={() => setDialogData({ title: 'Saldo Pago (Esteira)', proposals: stats.statusAnalysis['Saldo Pago'].proposals })}>
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

            <div className="cursor-pointer" onClick={() => setDialogData({ title: 'Reprovado (Mês)', proposals: stats.statusAnalysis['Reprovado'].proposals })}>
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

        <div className="w-full">
            <HallOfFame proposals={proposals || []} customers={customers || []} isLoading={proposalsLoading || !customers} />
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

      <Dialog open={isLeadsModalOpen} onOpenChange={setIsLeadsModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
            <DialogHeader>
                <DialogTitle className="flex items-center gap-2 font-black uppercase text-xl text-primary">
                    <Users className="h-6 w-6" /> Fichas de Leads Recebidas
                </DialogTitle>
            </DialogHeader>
            <ScrollArea className="flex-1 pr-4">
                <div className="space-y-4 py-4">
                    {pendingLeads?.map((lead) => (
                        <Card key={lead.id} className="p-6 border-2 hover:border-primary/40 transition-all">
                            <div className="flex flex-col md:flex-row justify-between gap-6">
                                <div className="space-y-4 flex-1">
                                    <div className="flex items-center gap-3">
                                        <Badge className="bg-primary text-white font-black text-[10px] uppercase">Pendente</Badge>
                                        <span className="text-[10px] font-bold text-muted-foreground uppercase">{format(new Date(lead.createdAt), 'dd/MM/yyyy HH:mm')}</span>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-[9px] font-black uppercase text-muted-foreground tracking-widest">Nome Completo</p>
                                            <p className="font-black text-lg uppercase tracking-tight">{lead.name}</p>
                                        </div>
                                        <div>
                                            <p className="text-[9px] font-black uppercase text-muted-foreground tracking-widest">Documento (CPF)</p>
                                            <p className="font-bold">{lead.cpf}</p>
                                        </div>
                                        <div>
                                            <p className="text-[9px] font-black uppercase text-muted-foreground tracking-widest">Telefone</p>
                                            <p className="font-bold">{lead.phone}</p>
                                        </div>
                                        <div>
                                            <p className="text-[9px] font-black uppercase text-muted-foreground tracking-widest">Nascimento</p>
                                            <p className="font-bold">{format(new Date(lead.birthDate + 'T00:00:00'), 'dd/MM/yyyy')}</p>
                                        </div>
                                    </div>
                                    
                                    {lead.documents && lead.documents.length > 0 && (
                                        <div className="space-y-2">
                                            <p className="text-[10px] font-black uppercase text-primary tracking-widest">Documentos Anexados</p>
                                            <div className="flex flex-wrap gap-2">
                                                {lead.documents.map((doc, i) => (
                                                    <a key={i} href={doc.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted border hover:bg-muted/80 transition-all">
                                                        <Download className="h-3 w-3" />
                                                        <span className="text-[10px] font-bold uppercase truncate max-w-[150px]">{doc.name}</span>
                                                    </a>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                                <div className="flex flex-row md:flex-col gap-2 justify-end">
                                    <Button 
                                        className="bg-green-600 hover:bg-green-700 text-white font-black uppercase text-[10px] tracking-widest h-12 px-8 rounded-full shadow-lg shadow-green-500/20"
                                        onClick={() => handleApproveLead(lead)}
                                        disabled={isApprovingLead}
                                    >
                                        {isApprovingLead ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
                                        Aprovar Ficha
                                    </Button>
                                    <Button 
                                        variant="outline" 
                                        className="text-destructive hover:bg-red-50 border-destructive/20 h-12 px-8 rounded-full font-bold uppercase text-[10px] tracking-widest"
                                        onClick={() => handleDiscardLead(lead.id)}
                                    >
                                        <Trash2 className="mr-2 h-4 w-4" /> Descartar
                                    </Button>
                                </div>
                            </div>
                        </Card>
                    ))}
                    {(!pendingLeads || pendingLeads.length === 0) && (
                        <div className="py-20 text-center border-2 border-dashed rounded-[2rem] bg-muted/5 opacity-40">
                            <Users className="h-12 w-12 mx-auto mb-4" />
                            <p className="font-black uppercase tracking-widest text-sm">Nenhum lead aguardando revisão.</p>
                        </div>
                    )}
                </div>
            </ScrollArea>
            <DialogFooter className="p-6 border-t">
                <Button variant="ghost" onClick={() => setIsLeadsModalOpen(false)} className="rounded-full font-bold uppercase text-[10px] tracking-widest">Fechar</Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
