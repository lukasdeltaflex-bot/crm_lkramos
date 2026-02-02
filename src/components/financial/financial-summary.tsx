'use client';

import * as React from 'react';
import type { Row } from '@tanstack/react-table';
import type { Proposal, Customer } from '@/lib/types';
import { StatsCard } from '@/components/dashboard/stats-card';
import { formatCurrency, cn } from '@/lib/utils';
import { CheckCircle, Hourglass, Info, Coins, CircleDollarSign } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import type { DateRange } from 'react-day-picker';
import { subMonths, startOfMonth } from 'date-fns';

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
    
    const fromDate = currentMonthRange.from || new Date();
    const toDate = currentMonthRange.to || new Date();
    // 🔥 Lógica de Pipeline: Considera desde o início do mês anterior até o fim do período atual
    const startOfPrevMonth = startOfMonth(subMonths(fromDate, 1));
    const effectiveToDate = new Date(toDate);
    effectiveToDate.setHours(23, 59, 59, 999);

    // Métrica Mensal: Apenas período selecionado (Para Produção)
    const currentMonthProposals = allProposals.filter(p => {
        if (!p.dateDigitized) return false;
        const d = new Date(p.dateDigitized);
        return d >= fromDate && d <= effectiveToDate;
    });

    // Métrica Acumulada: Mês anterior + Selecionado (Para Pipeline)
    const accumulatedProposals = allProposals.filter(p => {
        if (!p.dateDigitized) return false;
        const d = new Date(p.dateDigitized);
        return d >= startOfPrevMonth && d <= effectiveToDate;
    });

    // 1. Total do Mês (Puramente mensal)
    const totalPotentialCommission = currentMonthProposals.reduce((sum, p) => sum + (p.commissionValue || 0), 0);

    // 2. Recebido no Mês (Puramente mensal)
    const commissionReceivedProposals = currentMonthProposals.filter(p => p.commissionStatus === 'Paga');
    const totalAmountPaid = commissionReceivedProposals.reduce((sum, p) => sum + (p.amountPaid || 0), 0);
    
    // 3. Saldo a Receber (Acumulado: Mês Anterior + Vigente)
    const proposalsForSaldoAReceber = accumulatedProposals.filter(p => {
        if (p.commissionStatus === 'Paga') return false;
        const hasAverbacao = !!p.dateApproved;
        const status = p.status;
        return status === 'Pago' || (hasAverbacao && ['Em Andamento', 'Saldo Pago', 'Pendente'].includes(status));
    });
    const pendingAmount = proposalsForSaldoAReceber.reduce((sum, p) => sum + (p.commissionValue || 0), 0);

    // 4. Comissão Esperada (Acumulado: Mês Anterior + Vigente)
    const expectedCommissionProposals = accumulatedProposals.filter(p => {
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
      className: "border-border/50 bg-muted/10 shadow-sm",
      valueClassName: "text-foreground font-normal",
      proposals: allProposalsInPeriod,
      percentage: 100,
    },
    {
      title: "Comissão Recebida",
      value: formatCurrency(totalAmountPaid),
      icon: CheckCircle,
      description: "Pago no Mês",
      className: "border-border/50 bg-green-100/10 dark:bg-green-900/20 shadow-sm",
      valueClassName: "text-green-500 font-normal",
      proposals: commissionReceivedProposals,
      percentage: paidPercentage,
    },
    {
      title: "Saldo a Receber",
      value: formatCurrency(pendingAmount),
      icon: Hourglass,
      description: "Mês Anterior + Atual",
      className: "border-border/50 bg-orange-100/10 dark:bg-orange-900/20 shadow-sm",
      valueClassName: "text-orange-500 font-normal",
      proposals: proposalsForSaldoAReceber,
      percentage: pendingPercentage,
    },
    {
      title: "Comissão Esperada",
      value: formatCurrency(expectedAmount),
      icon: CircleDollarSign,
      description: "Mês Anterior + Atual",
      className: "border-border/50 bg-blue-100/10 dark:bg-blue-900/20 shadow-sm",
      valueClassName: "text-blue-500 font-normal",
      proposals: expectedCommissionProposals,
      percentage: expectedPercentage,
    },
  ];

  return (
    <div className='space-y-4'>
        <Alert variant="default" className="bg-secondary/50 print:hidden border-l-primary border border-border/50">
            <Info className="h-4 w-4" />
            <AlertTitle>Visão de Pipeline</AlertTitle>
            <AlertDescription>
                Os cartões **Total** e **Recebido** focam na produção do mês selecionado. **Saldo a Receber** e **Comissão Esperada** trazem o saldo acumulado desde o mês anterior.
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