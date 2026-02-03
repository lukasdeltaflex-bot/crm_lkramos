'use client';

import * as React from 'react';
import type { Row } from '@tanstack/react-table';
import type { Proposal, Customer } from '@/lib/types';
import { StatsCard } from '@/components/dashboard/stats-card';
import { formatCurrency } from '@/lib/utils';
import { CheckCircle, Hourglass, Coins, CircleDollarSign } from 'lucide-react';
import type { DateRange } from 'react-day-picker';
import { subMonths, startOfMonth, endOfMonth } from 'date-fns';

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
    percRecebida,
    percSaldo,
    percEsperada
  } = React.useMemo(() => {
    const allProposals = Array.isArray(rows) && rows.length > 0 
        ? ('original' in rows[0] ? (rows as Row<ProposalWithCustomer>[]).map(r => r.original) : (rows as ProposalWithCustomer[]))
        : [];
    
    const today = new Date();
    const fromDate = currentMonthRange?.from || startOfMonth(today);
    const toDate = currentMonthRange?.to || endOfMonth(today);
    
    const startOfPipeline = startOfMonth(subMonths(fromDate, 1));
    const effectiveToDate = new Date(toDate);
    effectiveToDate.setHours(23, 59, 59, 999);

    // 1. BASE DE CÁLCULO: Produção Mensal (Digitado no período selecionado)
    const currentMonthProposals = allProposals.filter(p => {
        if (!p.dateDigitized) return false;
        const d = new Date(p.dateDigitized);
        return d >= fromDate && d <= effectiveToDate;
    });

    const totalPotentialCommission = currentMonthProposals.reduce((sum, p) => sum + (p.commissionValue || 0), 0);

    // 2. Comissões Recebidas (O que foi digitado no mês e já pagou)
    const commissionReceivedProposals = currentMonthProposals.filter(p => p.commissionStatus === 'Paga');
    const totalAmountPaid = commissionReceivedProposals.reduce((sum, p) => sum + (p.amountPaid || 0), 0);

    // 3. ACUMULADOS: Buscamos dados de 1 mês atrás até hoje para Pipeline
    const accumulatedProposals = allProposals.filter(p => {
        if (!p.dateDigitized) return false;
        const d = new Date(p.dateDigitized);
        return d >= startOfPipeline && d <= effectiveToDate;
    });

    // Saldo a Receber (ACUMULADO - Averbados ou Pagos sem comissão)
    const proposalsForSaldoAReceber = accumulatedProposals.filter(p => {
        if (p.commissionStatus === 'Paga') return false;
        const hasAverbacao = !!p.dateApproved;
        const status = p.status;
        return status === 'Pago' || (hasAverbacao && ['Em Andamento', 'Saldo Pago', 'Pendente'].includes(status));
    });
    const pendingAmount = proposalsForSaldoAReceber.reduce((sum, p) => sum + (p.commissionValue || 0), 0);

    // Comissão Esperada (ACUMULADO - Digitados sem averbação ainda)
    const expectedCommissionProposals = accumulatedProposals.filter(p => {
        if (p.commissionStatus === 'Paga') return false;
        const isReprovado = p.status === 'Reprovado';
        const hasAverbacao = !!p.dateApproved;
        const isPagoStatus = p.status === 'Pago' || p.status === 'Saldo Pago';
        return !isReprovado && !hasAverbacao && !isPagoStatus;
    });
    const expectedAmount = expectedCommissionProposals.reduce((sum, p) => sum + (p.commissionValue || 0), 0);
    
    // REGRA DE OURO: Todas as porcentagens baseadas no Total de Comissões do Mês Vigente
    const getPercentage = (value: number) => {
        if (totalPotentialCommission <= 0) return 0;
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
      percRecebida: getPercentage(totalAmountPaid),
      percSaldo: getPercentage(pendingAmount),
      percEsperada: getPercentage(expectedAmount),
    };
  }, [rows, currentMonthRange]);
  
  const privacyPlaceholder = '•••••';

  const cards = [
    {
      title: "Total de Comissões",
      value: formatCurrency(totalPotentialCommission),
      icon: Coins,
      description: "PRODUÇÃO MENSAL",
      proposals: allProposalsInPeriod,
      percentage: 100,
    },
    {
      title: "Comissão Recebida",
      value: formatCurrency(totalAmountPaid),
      icon: CheckCircle,
      description: "DA PRODUÇÃO ATUAL",
      proposals: commissionReceivedProposals,
      percentage: percRecebida,
    },
    {
      title: "Saldo a Receber",
      value: formatCurrency(pendingAmount),
      icon: Hourglass,
      description: "VS PRODUÇÃO ATUAL",
      proposals: proposalsForSaldoAReceber,
      percentage: percSaldo,
    },
    {
      title: "Comissão Esperada",
      value: formatCurrency(expectedAmount),
      icon: CircleDollarSign,
      description: "VS PRODUÇÃO ATUAL",
      proposals: expectedCommissionProposals,
      percentage: percEsperada,
    },
  ];

  return (
    <div className='grid gap-3 md:grid-cols-2 lg:grid-cols-4 print:grid-cols-4'>
        {cards.map(card => (
            <div key={card.title} className="cursor-pointer" onClick={() => onShowDetails(card.title, card.proposals)}>
                <StatsCard
                    title={card.title}
                    value={isPrivacyMode ? privacyPlaceholder : card.value}
                    icon={card.icon}
                    description={card.description}
                    percentage={card.percentage}
                />
            </div>
        ))}
    </div>
  );
}
