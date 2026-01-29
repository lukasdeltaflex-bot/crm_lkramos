'use client';
import React from 'react';
import { AppLayout } from '@/components/app-layout';
import { CommissionChart } from '@/components/dashboard/commission-chart';
import { RecentProposals } from '@/components/dashboard/recent-proposals';
import { StatsCard } from '@/components/dashboard/stats-card';
import { useUser, useFirestore, useCollection, useMemoFirebase, useDoc } from '@/firebase';
import { collection, query, where, doc } from 'firebase/firestore';
import {
  FileText,
  Clock,
  CircleDollarSign,
  CheckCircle,
  XCircle,
  Hourglass,
  BadgePercent,
  Eye,
  EyeOff,
  X,
  Filter,
  Banknote,
  Percent,
} from 'lucide-react';
import { format, parse, startOfMonth, endOfMonth, isValid } from 'date-fns';
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

export default function DashboardPage() {
  const [startDateInput, setStartDateInput] = React.useState('');
  const [endDateInput, setEndDateInput] = React.useState('');
  const [appliedDateRange, setAppliedDateRange] = React.useState<DateRange | undefined>(undefined);
  const [isPrivacyMode, setIsPrivacyMode] = React.useState(false);
  const [isClient, setIsClient] = React.useState(false);
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();

  // State to manage the dialog content
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

  const handleApplyFilter = () => {
    const startDate = parse(startDateInput, 'dd/MM/yyyy', new Date());
    const endDate = parse(endDateInput, 'dd/MM/yyyy', new Date());

    const isValidStart = isValid(startDate) && startDateInput.length === 10;
    const isValidEnd = isValid(endDate) && endDateInput.length === 10;

    if (isValidStart && isValidEnd) {
        setAppliedDateRange({ from: startDate, to: endDate });
    } else if (isValidStart) {
        setAppliedDateRange({ from: startDate, to: startDate }); // Filtra por um único dia
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
    // Default to current month if no range is applied
    const fromDate = appliedDateRange?.from || startOfMonth(today);
    const toDate = appliedDateRange?.to || endOfMonth(today);
    toDate.setHours(23, 59, 59, 999); // Ensure end of day is included
  
    return proposals.filter(p => {
      if (!p.dateDigitized) return false;
      const proposalDate = new Date(p.dateDigitized);
      return proposalDate >= fromDate && proposalDate <= toDate;
    });
  }, [proposals, appliedDateRange, isClient]);

  const getFilterDescription = () => {
    if (!isClient) return "Carregando...";
    if (appliedDateRange?.from) {
        const from = format(appliedDateRange.from, 'dd/MM/yyyy', { locale: ptBR });
        const to = appliedDateRange.to ? format(appliedDateRange.to, 'dd/MM/yyyy', { locale: ptBR }) : from;
        if (from === to) {
            return `Exibindo dados para: ${from}`;
        }
        return `Exibindo dados de ${from} a ${to}`;
    }
    const monthName = format(new Date(), 'MMMM', { locale: ptBR });
    const capitalizedMonth = monthName.charAt(0).toUpperCase() + monthName.slice(1);
    return `Exibindo dados para o mês de ${capitalizedMonth}`;
  }
  
  const totalDigitado = React.useMemo(() => {
    if (!filteredProposals || filteredProposals.length === 0) {
      return 0;
    }
    return filteredProposals.reduce((sum, p) => {
        if (p.commissionBase === 'net') {
            return sum + (p.netAmount || 0);
        }
        // Default to gross amount if not 'net' or if commissionBase is undefined
        return sum + (p.grossAmount || 0);
    }, 0);
  }, [filteredProposals]);


  const getProposalsByStatus = (
    proposalsList: Proposal[],
    statuses: ProposalStatus[]
  ): Proposal[] => {
    if (!proposalsList) return [];
    return proposalsList.filter((p) => statuses.includes(p.status));
  };
  
  const getProposalsSum = (proposalsList: Proposal[]): number => {
    return proposalsList.reduce((sum, p) => {
        if (p.commissionBase === 'net') {
            return sum + p.netAmount;
        }
        // Default to gross if 'gross' or undefined
        return sum + p.grossAmount;
    }, 0);
  };

  const emAndamentoProposals = getProposalsByStatus(filteredProposals, ['Em Andamento']);
  const aguardandoSaldoProposals = getProposalsByStatus(filteredProposals, ['Aguardando Saldo']);
  const saldoPagoProposals = getProposalsByStatus(filteredProposals, ['Saldo Pago']);
  const pendenteProposals = getProposalsByStatus(filteredProposals, ['Pendente']);
  const pagoProposals = getProposalsByStatus(filteredProposals, ['Pago']);
  const rejeitadoProposals = getProposalsByStatus(filteredProposals, ['Reprovado']);


  const cardData = [
    {
      title: 'Pendente',
      value: getProposalsSum(pendenteProposals),
      icon: BadgePercent,
      className: 'border-purple-500/50',
      valueClassName: 'text-purple-500',
      proposals: pendenteProposals,
    },
    {
      title: 'Em Andamento',
      value: getProposalsSum(emAndamentoProposals),
      icon: Hourglass,
      className: 'border-yellow-500/50',
      valueClassName: 'text-yellow-500',
      proposals: emAndamentoProposals,
    },
    {
      title: 'Aguardando Saldo',
      value: getProposalsSum(aguardandoSaldoProposals),
      icon: Clock,
      className: 'border-blue-500/50',
      valueClassName: 'text-blue-500',
      proposals: aguardandoSaldoProposals,
    },
     {
      title: 'Saldo Pago',
      value: getProposalsSum(saldoPagoProposals),
      icon: CircleDollarSign,
      className: 'border-orange-500/50',
      valueClassName: 'text-orange-500',
      proposals: saldoPagoProposals,
    },
    {
      title: 'Pago',
      value: getProposalsSum(pagoProposals),
      icon: CheckCircle,
      className: 'border-green-500/50',
      valueClassName: 'text-green-500',
      proposals: pagoProposals,
    },
    {
      title: 'Reprovado',
      value: getProposalsSum(rejeitadoProposals),
      icon: XCircle,
      className: 'border-red-500/50',
      valueClassName: 'text-red-500',
      proposals: rejeitadoProposals,
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
            <div className="flex items-center gap-2 flex-wrap">
                <Input 
                    placeholder="Data Início" 
                    value={startDateInput}
                    onChange={(e) => handleDateInputChange(e.target.value, 'start')}
                    maxLength={10}
                    className="h-9 w-32"
                />
                <Input 
                    placeholder="Data Fim" 
                    value={endDateInput}
                    onChange={(e) => handleDateInputChange(e.target.value, 'end')}
                    maxLength={10}
                    className="h-9 w-32"
                />
                <Button size="sm" onClick={handleApplyFilter}><Filter className="h-4 w-4" /> Aplicar</Button>
                {(startDateInput || endDateInput || appliedDateRange) && <Button variant="ghost" size="icon" className="h-9 w-9" onClick={clearDates}><X className="h-4 w-4" /></Button>}
                <Button variant="ghost" size="icon" onClick={() => setIsPrivacyMode(!isPrivacyMode)}>
                {isPrivacyMode ? <EyeOff /> : <Eye />}
                <span className="sr-only">{isPrivacyMode ? 'Mostrar valores' : 'Ocultar valores'}</span>
                </Button>
            </div>
        </div>
      </div>
      <div className="space-y-8">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          <div className="md:col-span-2 lg:col-span-2 xl:col-span-4 cursor-pointer" onClick={() => setDialogData({ title: 'Total Digitado no Mês', proposals: filteredProposals })}>
             <StatsCard
                title="Total Digitado no Mês"
                value={isPrivacyMode ? '•••••' : formatCurrency(totalDigitado)}
                icon={Banknote}
                className="border-primary/50"
                valueClassName="text-primary"
            />
          </div>
          <div className="md:col-span-2 lg:col-span-1 xl:col-span-2">
            <GoalCard 
              currentProduction={totalDigitado} 
              className={isPrivacyMode ? 'blur-sm select-none' : ''}
            />
          </div>
          {isLoading ? Array.from({length: 6}).map((_, i) => (
             <Card key={i} className="p-6">
                <Skeleton className="h-5 w-24 mb-4" />
                <Skeleton className="h-8 w-32" />
             </Card>
          )) : cardData.map((card) => {
                const percentage = totalDigitado > 0 ? (card.value / totalDigitado) * 100 : 0;
                const description = !isPrivacyMode
                  ? `${percentage.toFixed(1).replace('.', ',')}% do total`
                  : undefined;

                return (
                  <div 
                      key={card.title} 
                      className="cursor-pointer" 
                      onClick={() => setDialogData({ title: `Propostas com Status: ${card.title}`, proposals: card.proposals})}
                  >
                      <StatsCard
                      title={card.title}
                      value={isPrivacyMode ? '•••••' : formatCurrency(card.value)}
                      description={description}
                      icon={card.icon}
                      className={card.className}
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
            <CommissionChart 
              proposals={proposals || []} 
            />
          </div>
          <div className="lg:col-span-1">
            {isLoading ? (
                <div className="space-y-4">
                    <Skeleton className="h-4 w-1/4" />
                    <Skeleton className="h-20 w-full" />
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
        <div>
          <RecentProposals proposals={proposals || []} customers={customers || []} isLoading={isLoading}/>
        </div>
      </div>
    </AppLayout>
  );
}
