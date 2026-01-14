'use client';
import React from 'react';
import { AppLayout } from '@/components/app-layout';
import { BirthdayAlerts } from '@/components/dashboard/birthday-alerts';
import { CommissionChart } from '@/components/dashboard/commission-chart';
import { RecentProposals } from '@/components/dashboard/recent-proposals';
import { StatsCard } from '@/components/dashboard/stats-card';
import { PageHeader } from '@/components/page-header';
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
  Calendar as CalendarIcon,
  Eye,
  EyeOff,
} from 'lucide-react';
import { format, startOfMonth } from 'date-fns';
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
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { FollowUpReminders } from '@/components/dashboard/follow-up-reminders';
import { ProposalsStatusTable } from '@/components/dashboard/proposals-status-table';
import { Skeleton } from '@/components/ui/skeleton';
import { Card } from '@/components/ui/card';

export default function DashboardPage() {
  const [date, setDate] = React.useState<Date>(startOfMonth(new Date()));
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

  const currentYear = date.getFullYear();
  const currentMonth = date.getMonth();

  const previousMonthDate = new Date(date);
  previousMonthDate.setMonth(previousMonthDate.getMonth() - 1);
  const previousMonth = previousMonthDate.getMonth();
  const previousMonthYear = previousMonthDate.getFullYear();

  const getProposalsByStatus = (
    statuses: ProposalStatus[],
    includePreviousMonth: boolean = false
  ): Proposal[] => {
    if (!proposals) return [];
    return proposals.filter((p) => {
      if (!statuses.includes(p.status)) {
        return false;
      }
      const proposalDate = new Date(p.dateDigitized);
      const proposalYear = proposalDate.getFullYear();
      const proposalMonth = proposalDate.getMonth();

      const isCurrentMonth =
        proposalYear === currentYear && proposalMonth === currentMonth;

      if (includePreviousMonth) {
        const isPreviousMonth =
          proposalYear === previousMonthYear && proposalMonth === previousMonth;
        return isCurrentMonth || isPreviousMonth;
      }

      return isCurrentMonth;
    });
  };

  const getProposalsSum = (proposalsList: Proposal[]): number => {
    return proposalsList.reduce((sum, p) => sum + p.grossAmount, 0);
  };

  const emAndamentoProposals = getProposalsByStatus(['Em Andamento'], true);
  const aguardandoSaldoProposals = getProposalsByStatus(
    ['Aguardando Saldo'],
    true
  );
  const saldoPagoProposals = getProposalsByStatus(['Saldo Pago'], true);
  const pendenteProposals = getProposalsByStatus(['Pendente'], true);

  const pagoProposals = getProposalsByStatus(['Pago']);
  const rejeitadoProposals = getProposalsByStatus(['Reprovado']);

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
      <div className="flex flex-wrap items-center justify-between gap-4">
        <PageHeader title="Dashboard" />
        <div className="flex items-center gap-2">
            <Popover>
            <PopoverTrigger asChild>
                <Button
                variant={'outline'}
                className={cn(
                    'w-[280px] justify-start text-left font-normal',
                    !date && 'text-muted-foreground'
                )}
                >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {date ? (
                    <span className="capitalize">
                    {format(date, 'MMMM yyyy', { locale: ptBR })}
                    </span>
                ) : (
                    <span>Escolha um mês</span>
                )}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
                <Calendar
                mode="single"
                selected={date}
                onSelect={(newDate) => setDate(newDate || new Date())}
                defaultMonth={date || new Date()}
                locale={ptBR}
                initialFocus
                captionLayout="dropdown-buttons"
                fromYear={2020}
                toYear={new Date().getFullYear() + 5}
                />
            </PopoverContent>
            </Popover>
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
