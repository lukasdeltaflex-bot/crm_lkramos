
'use client';
import React from 'react';
import { AppLayout } from '@/components/app-layout';
import { BirthdayAlerts } from '@/components/dashboard/birthday-alerts';
import { CommissionChart } from '@/components/dashboard/commission-chart';
import { RecentProposals } from '@/components/dashboard/recent-proposals';
import { StatsCard } from '@/components/dashboard/stats-card';
import { PageHeader } from '@/components/page-header';
import { proposals } from '@/lib/data';
import {
  FileText,
  Clock,
  CircleDollarSign,
  CheckCircle,
  XCircle,
  Hourglass,
  BadgePercent,
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import type { Proposal, ProposalStatus } from '@/lib/types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { StatusBreakdownChart } from '@/components/dashboard/status-breakdown-chart';

export default function DashboardPage() {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();
  
  // Previous month logic
  const previousMonthDate = new Date(now);
  previousMonthDate.setMonth(previousMonthDate.getMonth() - 1);
  const previousMonth = previousMonthDate.getMonth();
  const previousMonthYear = previousMonthDate.getFullYear();

  const getProposalsByStatus = (
    statuses: ProposalStatus[],
    includePreviousMonth: boolean = false
  ): Proposal[] => {
    return proposals.filter((p) => {
      if (!statuses.includes(p.status)) {
        return false;
      }
      const proposalDate = new Date(p.dateDigitized);
      const proposalYear = proposalDate.getFullYear();
      const proposalMonth = proposalDate.getMonth();

      const isCurrentMonth = proposalYear === currentYear && proposalMonth === currentMonth;
      
      if (includePreviousMonth) {
        const isPreviousMonth = proposalYear === previousMonthYear && proposalMonth === previousMonth;
        return isCurrentMonth || isPreviousMonth;
      }
      
      return isCurrentMonth;
    });
  };

  const getProposalsSum = (proposalsList: Proposal[]): number => {
    return proposalsList.reduce((sum, p) => sum + p.grossAmount, 0);
  };
  
  const emAndamentoProposals = getProposalsByStatus(['Em Andamento'], true);
  const aguardandoSaldoProposals = getProposalsByStatus(['Aguardando Saldo'], true);
  const saldoPagoProposals = getProposalsByStatus(['Saldo Pago'], true);
  const pendenteProposals = getProposalsByStatus(['Pendente'], true);
  
  const pagoProposals = getProposalsByStatus(['Pago']);
  const rejeitadoProposals = getProposalsByStatus(['Rejeitado']);


  const cardData = [
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
    {
      title: 'Saldo Pago',
      value: getProposalsSum(saldoPagoProposals),
      icon: CircleDollarSign,
      className: 'border-orange-500/50',
      valueClassName: 'text-orange-500',
      proposals: saldoPagoProposals,
    },
    {
      title: 'Pendente',
      value: getProposalsSum(pendenteProposals),
      icon: BadgePercent,
      className: 'border-purple-500/50',
      valueClassName: 'text-purple-500',
      proposals: pendenteProposals,
    },
  ];

  return (
    <AppLayout>
      <PageHeader title="Dashboard" />
      <div className="space-y-8">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {cardData.map((card) => (
            <Dialog key={card.title}>
              <DialogTrigger asChild>
                <div className="cursor-pointer">
                  <StatsCard
                    title={card.title}
                    value={formatCurrency(card.value)}
                    icon={card.icon}
                    className={card.className}
                    valueClassName={card.valueClassName}
                  />
                </div>
              </DialogTrigger>
              <DialogContent className="max-w-3xl">
                <DialogHeader>
                  <DialogTitle>Detalhes de: {card.title}</DialogTitle>
                </DialogHeader>
                <StatusBreakdownChart proposals={card.proposals} />
              </DialogContent>
            </Dialog>
          ))}
        </div>
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <CommissionChart />
          </div>
          <div className="space-y-8">
            <BirthdayAlerts />
          </div>
        </div>
        <div>
          <RecentProposals />
        </div>
      </div>
    </AppLayout>
  );
}
