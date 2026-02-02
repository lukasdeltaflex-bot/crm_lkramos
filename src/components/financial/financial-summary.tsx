
'use client';

import * as React from 'react';
import type { Row } from '@tanstack/react-table';
import type { Proposal, Customer } from '@/lib/types';
import { StatsCard } from '@/components/dashboard/stats-card';
import { formatCurrency, cn } from '@/lib/utils';
import { CheckCircle, Hourglass, Info, Coins, CircleDollarSign } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import type { DateRange } from 'react-day-picker';

type ProposalWithCustomer = Proposal & { customer: Customer };

interface FinancialSummaryProps {
  rows: Row<ProposalWithCustomer>[] | ProposalWithCustomer[];
  currentMonthRange: DateRange;
  isPrivacyMode: boolean;
  isFiltered: boolean;
  onShowDetails: (title: string, proposals: ProposalWithCustomer[]) => void;
}

export function FinancialSummary({ rows, currentMonthRange, isPrivacyMode, isFiltered, onShowDetails }: FinancialSummaryProps) {
  const {
    totalPotentialCommission,
    totalAmountPaid,
    pendingAmount,
    expectedAmount,
    allProposalsInPeriod,
    commissionReceivedProposals,
    proposalsForSaldoAReceber,
    expectedCommissionProposals,
    paidPercentage,
    pendingPercentage,
    expectedPercentage
  } = React.useMemo(() => {
    const allProposals = Array.isArray(rows) && rows.length > 0 
        ? ('original' in rows[0] ? (rows as Row<ProposalWithCustomer>[]).map(r => r.original) : (rows as ProposalWithCustomer[]))
        : [];
    
    if (allProposals.length === 0) {
        return {
            totalPotentialCommission: 0,
            totalAmountPaid: 0,
            pendingAmount: 0,
            expectedAmount: 0,
            allProposalsInPeriod: [],
            commissionReceivedProposals: [],
            proposalsForSaldoAReceber: [],
            expectedCommissionProposals: [],
            paidPercentage: 0,
            pendingPercentage: 0,
            expectedPercentage: 0,
        };
    }

    const fromDate = currentMonthRange.from || new Date();
    const toDate = currentMonthRange.to || new Date();
    toDate.setHours(23, 59, 59, 999);

    // 1. Filtragem por Período Vigente (Para produção mensal)
    const currentMonthProposals = allProposals.filter(p => {
        if (!p.dateDigitized) return false;
        const d = new Date(p.dateDigitized);
        return d >= fromDate && d <= toDate;
    });

    // 2. Total de Comissões Digitadas (Somente Mês Vigente)
    const totalPotentialCommission = currentMonthProposals.reduce((sum, p) => sum + (p.commissionValue || 0), 0);

    // 3. Comissão Recebida (Somente Mês Vigente)
    const commissionReceivedProposals = currentMonthProposals.filter(p => p.commissionStatus === 'Paga');
    const totalAmountPaid = commissionReceivedProposals.reduce((sum, p) => sum + (p.amountPaid || 0), 0);
    
    // 4. Saldo a Receber (Acumulado: Mês Anterior + Vigente)
    const proposalsForSaldoAReceber = allProposals.filter(p => {
        if (p.commissionStatus === 'Paga') return false;
        const hasAverbacao = !!p.dateApproved;
        const status = p.status;
        return status === 'Pago' || (hasAverbacao && ['Em Andamento', 'Saldo Pago', 'Pendente'].includes(status));
    });
    const pendingAmount = proposalsForSaldoAReceber.reduce((sum, p) => sum + (p.commissionValue || 0), 0);

    // 5. Comissão Esperada (Acumulado: Mês Anterior + Vigente)
    const expectedCommissionProposals = allProposals.filter(p => {
        if (p.commissionStatus === 'Paga') return false;
        const isReprovado = p.status === 'Reprovado';
        const hasAverbacao = !!p.dateApproved;
        const isPagoStatus = p.status === 'Pago';
        return !isReprovado && !hasAverbacao && !isPagoStatus;
    });
    const expectedAmount = expectedCommissionProposals.reduce((sum, p) => sum + (p.commissionValue || 0), 0);
    
    const getPercentage = (value: number) => {
        if (totalPotentialCommission === 0) return 0;
        return (value / totalPotentialCommission) * 100;
    };

    return {
      totalPotentialCommission,
      totalAmountPaid,
      pendingAmount,
      expectedAmount,
      allProposalsInPeriod: currentMonthProposals,
      commissionReceivedProposals,
      proposalsForSaldoAReceber,
      expectedCommissionProposals,
      paidPercentage: getPercentage(totalAmountPaid),
      pendingPercentage: totalPotentialCommission > 0 ? (pendingAmount / totalPotentialCommission) * 100 : 0,
      expectedPercentage: totalPotentialCommission > 0 ? (expectedAmount / totalPotentialCommission) * 100 : 0,
    };
  }, [rows, currentMonthRange]);
  
  const privacyPlaceholder = '•••••';

  const cards = [
    {
      title: "Total de Comissões",
      value: formatCurrency(totalPotentialCommission),
      icon: Coins,
      description: "Produção do Mês",
      className: "border-border/50 bg-muted/10",
      valueClassName: "text-foreground",
      proposals: allProposalsInPeriod,
      percentage: 100,
    },
    {
      title: "Comissão Recebida",
      value: formatCurrency(totalAmountPaid),
      icon: CheckCircle,
      description: "Pago no Mês",
      className: "border-green-500/20 bg-green-100/50 dark:bg-green-900/20",
      valueClassName: "text-green-500",
      proposals: commissionReceivedProposals,
      percentage: paidPercentage,
    },
    {
      title: "Saldo a Receber",
      value: formatCurrency(pendingAmount),
      icon: Hourglass,
      description: "Acumulado (Desde mês anterior)",
      className: "border-orange-500/20 bg-orange-100/50 dark:bg-orange-900/20",
      valueClassName: "text-orange-500",
      proposals: proposalsForSaldoAReceber,
      percentage: pendingPercentage,
    },
    {
      title: "Comissão Esperada",
      value: formatCurrency(expectedAmount),
      icon: CircleDollarSign,
      description: "Acumulado (Desde mês anterior)",
      className: "border-blue-500/20 bg-blue-100/50 dark:bg-blue-900/20",
      valueClassName: "text-blue-500",
      proposals: expectedCommissionProposals,
      percentage: expectedPercentage,
    },
  ];

  return (
    <div className='space-y-4'>
        <Alert variant="default" className="bg-secondary/50 print:hidden border-l-primary">
            <Info className="h-4 w-4" />
            <AlertTitle>Resumo Financeiro Inteligente</AlertTitle>
            <AlertDescription>
                Os cards de **Saldo a Receber** e **Comissão Esperada** incluem dados acumulados desde o mês passado para garantir que nada fique para trás.
            </AlertDescription>
        </Alert>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 print:grid-cols-4 print:gap-2">
           {cards.map(card => (
                <div key={card.title} className="cursor-pointer" onClick={() => onShowDetails(card.title, card.proposals)}>
                    <StatsCard
                        title={card.title}
                        value={isPrivacyMode ? privacyPlaceholder : card.value}
                        icon={card.icon}
                        description={card.description}
                        percentage={card.percentage}
                        className={cn("h-full", card.className)}
                        valueClassName={card.valueClassName}
                    />
                </div>
            ))}
        </div>
    </div>
  );
}
