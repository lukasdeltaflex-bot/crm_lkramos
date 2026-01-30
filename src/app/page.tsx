'use client';
import React from 'react';
import { AppLayout } from '@/components/app-layout';
import { PageHeader } from '@/components/page-header';
import { CommissionChart } from '@/components/dashboard/commission-chart';
import { RecentProposals } from '@/components/dashboard/recent-proposals';
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
import { format, parse, startOfMonth, endOfMonth, isValid, startOfDay, subDays, endOfDay, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { formatCurrency, cn } from '@/lib/utils';
import type { Proposal, ProposalStatus, Customer, UserProfile } from '@/lib/types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ProposalsStatusTable } from '@/components/dashboard/proposals-status-table';
import { Skeleton } from '@/components/ui/skeleton';
import { Card } from '@/components/ui/card';
import { DateRange } from 'react-day-picker';
import { Input } from '@/components/ui/input';
import { DailySummary } from '@/components/summary/daily-summary';
import { GoalCard } from '@/components/dashboard/goal-card';
import { ProductBreakdownChart } from '@/components/dashboard/product-breakdown-chart';
import { PartnerPerformanceCharts } from '@/components/dashboard/partner-performance-charts';
import { Separator } from '@/components/ui/separator';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

export default function DashboardPage() {
  const [startDateInput, setStartDateInput] = React.useState('');
  const [endDateInput, setEndDateInput] = React.useState('');
  const [appliedDateRange, setAppliedDateRange] = React.useState<DateRange | undefined>(undefined);
  const [isPrivacyMode, setIsPrivacyMode] = React.useState(false);
  const [isClient, setIsClient] = React.useState(false);
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();

  const [dialogData, setDialogData] = React.useState<{ title: string; proposals: Proposal[] } | null>(null);

  React.useEffect(() => {
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
  const { data: userProfile, isLoading: profileLoading } = useDoc<UserProfile>(userProfileDocRef);

  const isLoading = proposalsLoading || customersLoading || isUserLoading || profileLoading;

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
        case 'today':
            from = startOfDay(now);
            break;
        case 'yesterday':
            from = startOfDay(subDays(now, 1));
            to = endOfDay(subDays(now, 1));
            break;
        case 'week':
            from = startOfDay(subDays(now, 7));
            break;
        case 'month':
            from = startOfMonth(now);
            break;
        case 'lastMonth':
            from = startOfMonth(subMonths(now, 1));
            to = endOfMonth(subMonths(now, 1));
            break;
        default:
            return;
    }

    setStartDateInput(parse(from.toISOString(), "yyyy-MM-dd", new Date()).toLocaleDateString('pt-BR'));
    setEndDateInput(parse(to.toISOString(), "yyyy-MM-dd", new Date()).toLocaleDateString('pt-BR'));
    setAppliedDateRange({ from, to });
  };

  const handleApplyFilter = () => {
    const startDate = parse(startDateInput, 'dd/MM/yyyy', new Date());
    const endDate = parse(endDateInput, 'dd/MM/yyyy', new Date());

    const isValidStart = isValid(startDate) && startDateInput.length === 10;
    const isValidEnd = isValid(endDate) && endDateInput.length === 10;

    if (isValidStart && isValidEnd) {
        setAppliedDateRange({ from: startDate, to: endDate });
    } else if (isValidStart) {
        setAppliedDateRange({ from: startDate, to: startDate });
    } else {
        setAppliedDateRange(undefined);
    }
  };

  const clearDates = () => {
    setStartDateInput('');
    setEndDateInput('');
    setAppliedDateRange(undefined);
  }

  const filteredProposals = React.useMemo(() => {
    if (!proposals || !isClient) return [];
    const today = new Date();
    const fromDate = appliedDateRange?.from || startOfMonth(today);
    const toDate = appliedDateRange?.to || endOfMonth(today);
    toDate.setHours(23, 59, 59, 999);
  
    return proposals.filter(p => {
      if (!p.dateDigitized) return false;
      const proposalDate = new Date(p.dateDigitized);
      return proposalDate >= fromDate && proposalDate <= toDate;
    });
  }, [proposals, appliedDateRange, isClient]);

  const getProposalsSum = (proposalsList: Proposal[]): number => {
    return proposalsList.reduce((sum, p) => {
        if (p.commissionBase === 'net') return sum + (p.netAmount || 0);
        return sum + (p.grossAmount || 0);
    }, 0);
  };

  const getFilterDescription = () => {
    if (!isClient) return "Carregando...";
    if (appliedDateRange?.from) {
        const from = format(appliedDateRange.from, 'dd/MM/yyyy', { locale: ptBR });
        const to = appliedDateRange.to ? format(appliedDateRange.to, 'dd/MM/yyyy', { locale: ptBR }) : from;
        return from === to ? `Exibindo: ${from}` : `De ${from} a ${to}`;
    }
    const monthName = format(new Date(), 'MMMM', { locale: ptBR });
    return `Exibindo dados para o mês de ${monthName.charAt(0).toUpperCase() + monthName.slice(1)}`;
  }
  
  const currentTotalDigitado = getProposalsSum(filteredProposals);

  const getProposalsByStatus = (list: Proposal[], statuses: ProposalStatus[]) => 
    list.filter((p) => statuses.includes(p.status));

  const pagoProposals = getProposalsByStatus(filteredProposals, ['Pago', 'Saldo Pago']);
  const currentTotalPago = getProposalsSum(pagoProposals);

  const pendenteProposals = getProposalsByStatus(filteredProposals, ['Pendente']);
  const emAndamentoProposals = getProposalsByStatus(filteredProposals, ['Em Andamento']);
  const aguardandoSaldoProposals = getProposalsByStatus(filteredProposals, ['Aguardando Saldo']);
  const saldoPagoProposals = getProposalsByStatus(filteredProposals, ['Saldo Pago']);
  const reprovadoProposals = getProposalsByStatus(filteredProposals, ['Reprovado']);

  const getPercentage = (value: number) => {
    if (currentTotalDigitado === 0) return 0;
    return (value / currentTotalDigitado) * 100;
  };

  const cardData = [
    {
      title: 'Total Digitado',
      value: currentTotalDigitado,
      icon: FileText,
      className: 'border-muted bg-muted/10',
      valueClassName: 'text-foreground',
      proposals: filteredProposals,
      percentage: 100,
    },
    {
      title: 'Pendente',
      value: getProposalsSum(pendenteProposals),
      icon: BadgePercent,
      className: 'border-purple-500/30 bg-purple-500/5 dark:bg-purple-500/10',
      valueClassName: 'text-purple-500',
      proposals: pendenteProposals,
      percentage: getPercentage(getProposalsSum(pendenteProposals)),
    },
    {
      title: 'Em Andamento',
      value: getProposalsSum(emAndamentoProposals),
      icon: Hourglass,
      className: 'border-yellow-500/30 bg-yellow-500/5 dark:bg-yellow-500/10',
      valueClassName: 'text-yellow-500',
      proposals: emAndamentoProposals,
      percentage: getPercentage(getProposalsSum(emAndamentoProposals)),
    },
    {
      title: 'Aguardando Saldo',
      value: getProposalsSum(aguardandoSaldoProposals),
      icon: Clock,
      className: 'border-blue-500/30 bg-blue-500/5 dark:bg-blue-500/10',
      valueClassName: 'text-blue-500',
      proposals: aguardandoSaldoProposals,
      percentage: getPercentage(getProposalsSum(aguardandoSaldoProposals)),
    },
    {
      title: 'Saldo Pago',
      value: getProposalsSum(saldoPagoProposals),
      icon: CheckCircle2,
      className: 'border-orange-500/30 bg-orange-500/5 dark:bg-orange-500/10',
      valueClassName: 'text-orange-500',
      proposals: saldoPagoProposals,
      percentage: getPercentage(getProposalsSum(saldoPagoProposals)),
    },
    {
      title: 'Reprovado',
      value: getProposalsSum(reprovadoProposals),
      icon: XCircle,
      className: 'border-red-500/30 bg-red-500/5 dark:bg-red-500/10',
      valueClassName: 'text-red-500',
      proposals: reprovadoProposals,
      percentage: getPercentage(getProposalsSum(reprovadoProposals)),
    },
  ];

  return (
    <AppLayout>
       <div className="space-y-4 mb-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex-1 min-w-fit">
                <h1 className="text-3xl font-bold tracking-tight text-foreground">Dashboard</h1>
                <p className='text-base text-muted-foreground'>{getFilterDescription()}</p>
            </div>
            <div className="flex items-center gap-2 flex-wrap bg-card p-2 rounded-lg border shadow-sm">
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
                    <Input 
                        placeholder="De" 
                        value={startDateInput}
                        onChange={(e) => handleDateInputChange(e.target.value, 'start')}
                        maxLength={10}
                        className="h-9 w-28 border-none shadow-none focus-visible:ring-1"
                    />
                    <span className='text-muted-foreground'>-</span>
                    <Input 
                        placeholder="Até" 
                        value={endDateInput}
                        onChange={(e) => handleDateInputChange(e.target.value, 'end')}
                        maxLength={10}
                        className="h-9 w-28 border-none shadow-none focus-visible:ring-1"
                    />
                </div>
                <Button size="sm" onClick={handleApplyFilter} className='h-8'><Filter className="h-3.5 w-3.5 mr-1" /> Filtrar</Button>
                {(startDateInput || endDateInput || appliedDateRange) && (
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={clearDates}>
                        <X className="h-4 w-4" />
                    </Button>
                )}
                <Separator orientation="vertical" className="h-6 mx-1 hidden sm:block" />
                <Button variant="ghost" size="icon" className='h-8 w-8' onClick={() => setIsPrivacyMode(!isPrivacyMode)}>
                    {isPrivacyMode ? <EyeOff className='h-4 w-4' /> : <Eye className='h-4 w-4' />}
                </Button>
            </div>
        </div>
      </div>
      <div className="space-y-8">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <div className="md:col-span-2 lg:col-span-3">
            {isLoading ? (
              <Card className="p-6">
                <Skeleton className="h-5 w-48 mb-4" />
                <Skeleton className="h-12 w-full" />
              </Card>
            ) : (
              <GoalCard 
                currentProduction={currentTotalPago} 
                totalDigitized={currentTotalDigitado}
                isPrivacyMode={isPrivacyMode}
                onValueClick={() => setDialogData({ title: 'Contratos Pagos no Período', proposals: pagoProposals })}
              />
            )}
          </div>
          
          {isLoading ? Array.from({length: 6}).map((_, i) => (
             <Card key={i} className="p-6">
                <Skeleton className="h-5 w-24 mb-4" />
                <Skeleton className="h-8 w-32" />
             </Card>
          )) : cardData.map((card) => {
                return (
                  <div 
                      key={card.title} 
                      className="cursor-pointer" 
                      onClick={() => setDialogData({ title: `Propostas: ${card.title}`, proposals: card.proposals})}
                  >
                      <StatsCard
                        title={card.title}
                        value={isPrivacyMode ? '•••••' : formatCurrency(card.value)}
                        icon={card.icon}
                        percentage={card.percentage}
                        className={cn("h-full", card.className)}
                        valueClassName={card.valueClassName}
                      />
                  </div>
                )
          })}
        </div>

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

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <CommissionChart proposals={proposals || []} />
          </div>
          <div className="lg:col-span-1">
            <ProductBreakdownChart proposals={filteredProposals} />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            <div className="lg:col-span-2">
                <PartnerPerformanceCharts proposals={filteredProposals} />
            </div>
            <div className="lg:col-span-1">
                {isLoading ? (
                    <div className="space-y-4">
                        <Skeleton className="h-4 w-1/4" />
                        <Skeleton className="h-20 w-full" />
                        <Skeleton className="h-20 w-full" />
                    </div>
                ) : (
                    <DailySummary 
                        proposals={proposals || []}
                        customers={customers || []}
                        userProfile={userProfile}
                    />
                )}
            </div>
        </div>

        <div className="grid grid-cols-1 gap-8">
            <RecentProposals proposals={proposals || []} customers={customers || []} isLoading={isLoading}/>
        </div>
      </div>
    </AppLayout>
  );
}
