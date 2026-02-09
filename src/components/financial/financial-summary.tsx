
'use client';

import * as React from 'react';
import type { Row } from '@tanstack/react-table';
import type { Proposal, Customer } from '@/lib/types';
import { StatsCard } from '@/components/dashboard/stats-card';
import { formatCurrency, cn } from '@/lib/utils';
import { CheckCircle, Hourglass, Coins, CircleDollarSign } from 'lucide-react';
import type { DateRange } from 'react-day-picker';
import { subMonths, startOfMonth, endOfMonth, differenceInDays, subDays, isSameDay } from 'date-fns';

type ProposalWithCustomer = Proposal & { customer: Customer };

interface FinancialSummaryProps {
  rows: Row<ProposalWithCustomer>[] | ProposalWithCustomer[];
  currentMonthRange: DateRange;
  isPrivacyMode: boolean;
  isFiltered: boolean;
  onShowDetails: (title: string, proposals: ProposalWithCustomer[]) => void;
}

/**
 * Resumo Financeiro Simplificado
 * Focado exclusivamente em métricas de produção e fluxo de caixa de comissões.
 */
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
    metrics,
  } = React.useMemo(() => {
    const allProposals = Array.isArray(rows) && rows.length > 0 
        ? ('original' in rows[0] ? (rows as Row<ProposalWithCustomer>[]).map(r => r.original) : (rows as ProposalWithCustomer[]))
        : [];
    
    const today = new Date();
    const fromDate = currentMonthRange?.from || startOfMonth(today);
    const toDate = currentMonthRange?.to || endOfMonth(today);
    
    const effectiveToDate = new Date(toDate);
    effectiveToDate.setHours(23, 59, 59, 999);

    // 1. PRODUÇÃO MENSAL: Baseado na Data de Digitação
    const currentMonthProposals = allProposals.filter(p => {
        if (!p.dateDigitized) return false;
        const d = new Date(p.dateDigitized);
        return d >= fromDate && d <= effectiveToDate;
    });

    const totalPotentialCommission = currentMonthProposals.reduce((sum, p) => sum + (p.commissionValue || 0), 0);

    // 2. FLUXO DE CAIXA: Baseado na Data de Pagamento da Comissão
    const commissionReceivedProposals = allProposals.filter(p => {
        if (p.commissionStatus !== 'Paga' || !p.commissionPaymentDate) return false;
        const d = new Date(p.commissionPaymentDate);
        return d >= fromDate && d <= effectiveToDate;
    });
    const totalAmountPaid = commissionReceivedProposals.reduce((sum, p) => sum + (p.amountPaid || 0), 0);

    // 3. ACUMULADOS: Pipeline de Pendências
    const proposalsForSaldoAReceber = allProposals.filter(p => {
        if (p.commissionStatus === 'Paga') return false;
        const status = p.status;
        const hasAverbacao = !!p.dateApproved;
        return status === 'Pago' || (hasAverbacao && ['Em Andamento', 'Saldo Pago', 'Pendente'].includes(status));
    });
    const pendingAmount = proposalsForSaldoAReceber.reduce((sum, p) => sum + (p.commissionValue || 0), 0);

    const isCriticalSaldo = proposalsForSaldoAReceber.some(p => {
        if (!p.dateApproved) return false;
        return differenceInDays(today, new Date(p.dateApproved)) > 15;
    });

    // Comissão Esperada
    const expectedCommissionProposals = allProposals.filter(p => {
        if (p.commissionStatus === 'Paga') return false;
        const isReprovado = p.status === 'Reprovado';
        const hasAverbacao = !!p.dateApproved;
        const isPagoStatus = p.status === 'Pago' || p.status === 'Saldo Pago';
        return !isReprovado && !hasAverbacao && !isPagoStatus;
    });
    const expectedAmount = expectedCommissionProposals.reduce((sum, p) => sum + (p.commissionValue || 0), 0);

    // Sparklines
    const getSparkline = (list: Proposal[], dateField: keyof Proposal) => {
        const days = Array.from({length: 15}, (_, i) => subDays(today, 14 - i));
        return days.map(day => {
            return list.filter(p => {
                const d = p[dateField];
                return d && isSameDay(new Date(d as string), day);
            }).reduce((sum, p) => sum + (p.commissionValue || 0), 0);
        });
    };

    const getAvg = (val: number, list: any[]) => list.length > 0 ? val / list.length : 0;
    
    return {
      totalPotentialCommission,
      totalAmountPaid,
      pendingAmount,
      expectedAmount,
      allProposalsInPeriod: currentMonthProposals,
      commissionReceivedProposals,
      proposalsForSaldoAReceber,
      expectedCommissionProposals,
      metrics: {
          isCriticalSaldo,
          avgTotal: getAvg(totalPotentialCommission, currentMonthProposals),
          avgPaid: getAvg(totalAmountPaid, commissionReceivedProposals),
          sparkTotal: getSparkline(currentMonthProposals, 'dateDigitized'),
          sparkPaid: getSparkline(commissionReceivedProposals, 'commissionPaymentDate'),
      }
    };
  }, [rows, currentMonthRange]);
  
  const privacyPlaceholder = '•••••';

  return (
    <div className='space-y-6 mb-8'>
        <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4 print:grid-cols-4'>
            <div className="cursor-pointer" onClick={() => onShowDetails("Total de Comissões Digitadas", allProposalsInPeriod)}>
                <StatsCard
                    title="Produção Digitada"
                    value={isPrivacyMode ? privacyPlaceholder : formatCurrency(totalPotentialCommission)}
                    icon={Coins}
                    description="COMISSÃO POTENCIAL"
                    subValue={`Ticket Médio: ${formatCurrency(metrics.avgTotal)}`}
                    sparklineData={metrics.sparkTotal}
                />
            </div>
            <div className="cursor-pointer" onClick={() => onShowDetails("Comissão Efetivamente Recebida", commissionReceivedProposals)}>
                <StatsCard
                    title="Comissão Recebida"
                    value={isPrivacyMode ? privacyPlaceholder : formatCurrency(totalAmountPaid)}
                    icon={CheckCircle}
                    description="DINHEIRO NO CAIXA"
                    subValue={`Eficiência: ${((totalAmountPaid / (totalPotentialCommission || 1)) * 100).toFixed(1)}%`}
                    sparklineData={metrics.sparkPaid}
                />
            </div>
            <div className="cursor-pointer" onClick={() => onShowDetails("Saldo a Receber (Averbados)", proposalsForSaldoAReceber)}>
                <StatsCard
                    title="Saldo a Receber"
                    value={isPrivacyMode ? privacyPlaceholder : formatCurrency(pendingAmount)}
                    icon={Hourglass}
                    description="FATURAMENTO PENDENTE"
                    isCritical={metrics.isCriticalSaldo}
                />
            </div>
            <div className="cursor-pointer" onClick={() => onShowDetails("Comissão Esperada (Pipeline)", expectedCommissionProposals)}>
                <StatsCard
                    title="Comissão Esperada"
                    value={isPrivacyMode ? privacyPlaceholder : formatCurrency(expectedAmount)}
                    icon={CircleDollarSign}
                    description="PIPELINE EM ESTEIRA"
                />
            </div>
        </div>
    </div>
  );
}
