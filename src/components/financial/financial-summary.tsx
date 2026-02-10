'use client';

import * as React from 'react';
import type { Row } from '@tanstack/react-table';
import type { Proposal, Customer, UserSettings } from '@/lib/types';
import { StatsCard } from '@/components/dashboard/stats-card';
import { formatCurrency } from '@/lib/utils';
import { CheckCircle, Hourglass, CircleDollarSign, TrendingUp, Activity } from 'lucide-react';
import type { DateRange } from 'react-day-picker';
import { startOfMonth, endOfMonth, subDays, isSameDay } from 'date-fns';

type ProposalWithCustomer = Proposal & { customer: Customer };

interface FinancialSummaryProps {
  rows: Row<ProposalWithCustomer>[] | ProposalWithCustomer[];
  currentMonthRange: DateRange;
  isPrivacyMode: boolean;
  isFiltered: boolean;
  onShowDetails: (title: string, proposals: ProposalWithCustomer[]) => void;
  userSettings: UserSettings | null;
}

export function FinancialSummary({ rows, currentMonthRange, isPrivacyMode, onShowDetails }: FinancialSummaryProps) {
  const {
    totalMonthlyGross,
    totalPotentialCommission,
    totalAmountPaid,
    totalSaldoAReceber,
    allProposalsInPeriod,
    commissionReceivedProposals,
    proposalsWithBalance,
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

    // 1. PRODUÇÃO MENSAL (VOLUME BRUTO)
    const currentMonthProposals = allProposals.filter(p => {
        if (!p.dateDigitized) return false;
        const d = new Date(p.dateDigitized);
        return d >= fromDate && d <= effectiveToDate;
    });

    const totalMonthlyGross = currentMonthProposals.reduce((sum, p) => sum + (p.grossAmount || 0), 0);
    const totalPotentialCommission = currentMonthProposals.reduce((sum, p) => sum + (p.commissionValue || 0), 0);

    // 2. COMISSÃO RECEBIDA (CASH IN)
    const commissionReceivedProposals = allProposals.filter(p => {
        if (p.commissionStatus !== 'Paga' || !p.commissionPaymentDate) return false;
        const d = new Date(p.commissionPaymentDate);
        return d >= fromDate && d <= effectiveToDate;
    });
    const totalAmountPaid = commissionReceivedProposals.reduce((sum, p) => sum + (p.amountPaid || 0), 0);

    // 3. SALDO A RECEBER (PENDENTE GERAL)
    const proposalsWithBalance = allProposals.filter(p => 
        p.status !== 'Reprovado' && 
        p.commissionStatus !== 'Paga' &&
        (p.commissionValue - (p.amountPaid || 0)) > 0
    );
    const totalSaldoAReceber = proposalsWithBalance.reduce((sum, p) => sum + (p.commissionValue - (p.amountPaid || 0)), 0);

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

    const ticketMedio = currentMonthProposals.length > 0 ? totalPotentialCommission / currentMonthProposals.length : 0;
    const eficiencia = (totalAmountPaid + totalSaldoAReceber) > 0 ? (totalAmountPaid / (totalAmountPaid + totalSaldoAReceber)) * 100 : 0;
    
    return {
      totalMonthlyGross,
      totalPotentialCommission,
      totalAmountPaid,
      totalSaldoAReceber,
      allProposalsInPeriod: currentMonthProposals,
      commissionReceivedProposals,
      proposalsWithBalance,
      metrics: {
          ticketMedio,
          eficiencia,
          sparkTotal: getSparkline(currentMonthProposals, 'dateDigitized'),
          sparkPaid: getSparkline(commissionReceivedProposals, 'commissionPaymentDate'),
      }
    };
  }, [rows, currentMonthRange]);
  
  const privacyPlaceholder = '•••••';

  return (
    <div className='space-y-6 mb-8'>
        <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4 print:grid-cols-4'>
            {/* CARD 1: PRODUÇÃO DIGITADA */}
            <div className="cursor-pointer" onClick={() => onShowDetails("Produção Digitada (Bruta)", allProposalsInPeriod)}>
                <StatsCard
                    title="PRODUÇÃO DIGITADA"
                    value={isPrivacyMode ? privacyPlaceholder : formatCurrency(totalMonthlyGross)}
                    icon={Activity}
                    description="COMISSÃO POTENCIAL"
                    subValue={`TICKET MÉDIO: ${formatCurrency(metrics.ticketMedio)}`}
                    sparklineData={metrics.sparkTotal}
                />
            </div>

            {/* CARD 2: COMISSÃO RECEBIDA */}
            <div className="cursor-pointer" onClick={() => onShowDetails("Comissões Recebidas no Mês", commissionReceivedProposals)}>
                <StatsCard
                    title="COMISSÃO RECEBIDA"
                    value={isPrivacyMode ? privacyPlaceholder : formatCurrency(totalAmountPaid)}
                    icon={TrendingUp}
                    description="DINHEIRO NO CAIXA"
                    subValue={`EFICIÊNCIA: ${metrics.eficiencia.toFixed(1)}%`}
                    sparklineData={metrics.sparkPaid}
                />
            </div>

            {/* CARD 3: SALDO A RECEBER */}
            <div className="cursor-pointer" onClick={() => onShowDetails("Saldo a Receber (Pendente Geral)", proposalsWithBalance)}>
                <StatsCard
                    title="SALDO A RECEBER"
                    value={isPrivacyMode ? privacyPlaceholder : formatCurrency(totalSaldoAReceber)}
                    icon={Hourglass}
                    description="FATURAMENTO PENDENTE"
                />
            </div>

            {/* CARD 4: COMISSÃO ESPERADA */}
            <div className="cursor-pointer" onClick={() => onShowDetails("Comissão Esperada (Produção Mês)", allProposalsInPeriod)}>
                <StatsCard
                    title="COMISSÃO ESPERADA"
                    value={isPrivacyMode ? privacyPlaceholder : formatCurrency(totalPotentialCommission)}
                    icon={CircleDollarSign}
                    description="PIPELINE EM ESTEIRA"
                />
            </div>
        </div>
    </div>
  );
}
