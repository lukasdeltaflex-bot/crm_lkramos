'use client';
import React from 'react';
import { AppLayout } from '@/components/app-layout';
import { BirthdayAlerts } from '@/components/dashboard/birthday-alerts';
import { CommissionChart } from '@/components/dashboard/commission-chart';
import { RecentProposals } from '@/components/dashboard/recent-proposals';
import { StatsCard } from '@/components/dashboard/stats-card';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
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
} from 'lucide-react';
import { format, parse, startOfMonth, endOfMonth, isValid, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { formatCurrency, cn } from '@/lib/utils';
import type { Proposal, ProposalStatus, Customer } from '@/lib/types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { FollowUpReminders } from '@/components/dashboard/follow-up-reminders';
import { ProposalsStatusTable } from '@/components/dashboard/proposals-status-table';
import { Skeleton } from '@/components/ui/skeleton';
import { Card } from '@/components/ui/card';
import { DateRange } from 'react-day-picker';
import { Input } from '@/components/ui/input';

export default function DashboardPage() {
  const [startDateInput, setStartDateInput] = React.useState('');
  const [endDateInput, setEndDateInput] = React.useState('');
  const [appliedDateRange, setAppliedDateRange] = React.useState<DateRange | undefined>(undefined);
  const [isPrivacyMode, setIsPrivacyMode] = React.useState(false);
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();

  const proposalsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, 'loanProposals'), where('userId', '==', user.uid));
  }, [firestore, user]);

  const { data: proposals, isLoading: proposalsLoading } = useCollection<Proposal>(proposalsQuery);
  const customersQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, 'customers'), where('userId', '==', user.uid));
  }, [firestore, user]);
  const { data: customers, isLoading: customersLoading } = useCollection<Customer>(customersQuery);

  const isLoading = proposalsLoading || customersLoading || isUserLoading;

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
    if (!proposals) return [];
    
    // Se o usuário aplicou um filtro de data, use esse filtro.
    if (appliedDateRange?.from) {
      const fromDate = appliedDateRange.from;
      const toDate = appliedDateRange.to ? new Date(appliedDateRange.to) : new Date(appliedDateRange.from);
      toDate.setHours(23, 59, 59, 999);
  
      return proposals.filter(p => {
          if (!p.dateDigitized) return false;
          const proposalDate = new Date(p.dateDigitized);
          return proposalDate >= fromDate && proposalDate <= toDate;
      })
    }

    // Lógica padrão: mês atual + pendentes do mês anterior.
    const today = new Date();
    const startOfCurrentMonth = startOfMonth(today);
    const endOfCurrentMonth = endOfMonth(today);

    const startOfPreviousMonth = startOfMonth(subMonths(today, 1));
    const endOfPreviousMonth = endOfMonth(subMonths(today, 1));

    const statusesToCarryOver: ProposalStatus[] = ['Pendente', 'Em Andamento', 'Aguardando Saldo', 'Saldo Pago'];

    const proposalsFromCurrentMonth = proposals.filter(p => {
        if (!p.dateDigitized) return false;
        const proposalDate = new Date(p.dateDigitized);
        return proposalDate >= startOfCurrentMonth && proposalDate <= endOfCurrentMonth;
    });

    const proposalsToCarryOver = proposals.filter(p => {
        if (!p.dateDigitized) return false;
        const proposalDate = new Date(p.dateDigitized);
        return proposalDate >= startOfPreviousMonth && proposalDate <= endOfPreviousMonth && statusesToCarryOver.includes(p.status);
    });

    // Combina os dois, evitando duplicatas.
    const combinedProposals = [...proposalsFromCurrentMonth];
    const currentMonthIds = new Set(proposalsFromCurrentMonth.map(p => p.id));
    
    proposalsToCarryOver.forEach(p => {
        if (!currentMonthIds.has(p.id)) {
            combinedProposals.push(p);
        }
    });

    return combinedProposals;

  }, [proposals, appliedDateRange]);

  const getFilterDescription = () => {
    if (appliedDateRange?.from) {
        const from = format(appliedDateRange.from, 'dd/MM/yyyy', { locale: ptBR });
        const to = appliedDateRange.to ? format(appliedDateRange.to, 'dd/MM/yyyy', { locale: ptBR }) : from;
        if (from === to) {
            return `Exibindo dados para: ${from}`;
        }
        return `Exibindo dados de ${from} a ${to}`;
    }
    return `Exibindo dados para o mês de ${format(new Date(), 'MMMM', { locale: ptBR })} (incluindo pendências do mês anterior)`;
  }


  const getProposalsByStatus = (
    proposalsList: Proposal[],
    statuses: ProposalStatus[]
  ): Proposal[] => {
    if (!proposalsList) return [];
    return proposalsList.filter((p) => statuses.includes(p.status));
  };
  
  const getProposalsSum = (proposalsList: Proposal[]): number => {
    return proposalsList.reduce((sum, p) => sum + p.grossAmount, 0);
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
       <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div className="flex-1 min-w-fit">
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Dashboard</h1>
            <p className='text-sm text-muted-foreground'>{getFilterDescription()}</p>
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
      <div className="space-y-8">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {isLoading ? Array.from({length: 6}).map((_, i) => (
             <Card key={i} className="p-6">
                <Skeleton className="h-5 w-24 mb-4" />
                <Skeleton className="h-8 w-32" />
             </Card>
          )) : cardData.map((card) => (
            <Dialog key={card.title}>
              <DialogTrigger asChild>
                <div className="cursor-pointer">
                  <StatsCard
                    title={card.title}
                    value={isPrivacyMode ? '•••••' : formatCurrency(card.value)}
                    icon={card.icon}
                    className={card.className}
                    valueClassName={card.valueClassName}
                  />
                </div>
              </DialogTrigger>
              <DialogContent className="max-w-4xl">
                <DialogHeader>
                  <DialogTitle>Propostas com Status: {card.title}</DialogTitle>
                </DialogHeader>
                <ProposalsStatusTable proposals={card.proposals} customers={customers || []} />
              </DialogContent>
            </Dialog>
          ))}
        </div>
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <CommissionChart proposals={proposals || []} isPrivacyMode={isPrivacyMode}/>
          </div>
          <div className="space-y-8">
            <BirthdayAlerts customers={customers || []} isLoading={isLoading}/>
            <FollowUpReminders proposals={proposals || []} customers={customers || []} isLoading={isLoading}/>
          </div>
        </div>
        <div>
          <RecentProposals proposals={proposals || []} customers={customers || []} isLoading={isLoading}/>
        </div>
      </div>
    </AppLayout>
  );
}
