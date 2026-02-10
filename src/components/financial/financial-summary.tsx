'use client';

import * as React from 'react';
import type { Row } from '@tanstack/react-table';
import type { Proposal, Customer, UserSettings } from '@/lib/types';
import { StatsCard } from '@/components/dashboard/stats-card';
import { formatCurrency, cn } from '@/lib/utils';
import { CheckCircle, Hourglass, Coins, CircleDollarSign, Activity } from 'lucide-react';
import type { DateRange } from 'react-day-picker';
import { subMonths, startOfMonth, endOfMonth, differenceInDays, subDays, isSameDay } from 'date-fns';
import * as configData from '@/lib/config-data';

type ProposalWithCustomer = Proposal & { customer: Customer };

interface FinancialSummaryProps {
  rows: Row<ProposalWithCustomer>[] | ProposalWithCustomer[];
  currentMonthRange: DateRange;
  isPrivacyMode: boolean;
  isFiltered: boolean;
  onShowDetails: (title: string, proposals: ProposalWithCustomer[]) => void;
  userSettings: UserSettings | null;
}

/**
 * Resumo Financeiro Inteligente
 * Agora gera cards dinamicamente baseados nos status de comissão configurados.
 */
export function FinancialSummary({ rows, currentMonthRange, isPrivacyMode, isFiltered, onShowDetails, userSettings }: FinancialSummaryProps) {
  const {
    totalPotentialCommission,
    totalAmountPaid,
    allProposalsInPeriod,
    commissionReceivedProposals,
    statusSpecificData,
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

    const activeCommissionStatuses = userSettings?.commissionStatuses || configData.commissionStatuses;

    // 1. PRODUÇÃO MENSAL
    const currentMonthProposals = allProposals.filter(p => {
        if (!p.dateDigitized) return false;
        const d = new Date(p.dateDigitized);
        return d >= fromDate && d <= effectiveToDate;
    });

    const totalPotentialCommission = currentMonthProposals.reduce((sum, p) => sum + (p.commissionValue || 0), 0);

    // 2. COMISSÕES PAGAS NO PERÍODO
    const commissionReceivedProposals = allProposals.filter(p => {
        if (p.commissionStatus !== 'Paga' || !p.commissionPaymentDate) return false;
        const d = new Date(p.commissionPaymentDate);
        return d >= fromDate && d <= effectiveToDate;
    });
    const totalAmountPaid = commissionReceivedProposals.reduce((sum, p) => sum + (p.amountPaid || 0), 0);

    // 3. ANÁLISE DINÂMICA POR STATUS DE COMISSÃO
    const statusSpecificData: Record<string, { total: number; proposals: ProposalWithCustomer[] }> = {};
    activeCommissionStatuses.forEach(status => {
        const list = allProposals.filter(p => p.commissionStatus === status);
        statusSpecificData[status] = {
            total: list.reduce((sum, p) => sum + (p.commissionValue || 0), 0),
            proposals: list
        };
    });

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
      allProposalsInPeriod: currentMonthProposals,
      commissionReceivedProposals,
      statusSpecificData,
      metrics: {
          avgTotal: getAvg(totalPotentialCommission, currentMonthProposals),
          avgPaid: getAvg(totalAmountPaid, commissionReceivedProposals),
          sparkTotal: getSparkline(currentMonthProposals, 'dateDigitized'),
          sparkPaid: getSparkline(commissionReceivedProposals, 'commissionPaymentDate'),
      }
    };
  }, [rows, currentMonthRange, userSettings]);
  
  const privacyPlaceholder = '•••••';
  const activeCommissionStatuses = userSettings?.commissionStatuses || configData.commissionStatuses;

  const getCommissionIcon = (status: string) => {
      if (status === 'Paga') return CheckCircle;
      if (status === 'Pendente') return Hourglass;
      if (status === 'Parcial') return Coins;
      return Activity;
  };

  return (
    <div className='space-y-6 mb-8'>
        <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4 print:grid-cols-4'>
            {/* KPIs Fixos de Movimentação */}
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

            {/* CARDS DINÂMICOS - SEGUINDO A LÓGICA DE STATUS CUSTOMIZADOS */}
            {activeCommissionStatuses.filter(s => s !== 'Paga').map(status => (
                <div key={status} className="cursor-pointer" onClick={() => onShowDetails(`Volume em ${status}`, statusSpecificData[status]?.proposals || [])}>
                    <StatsCard
                        title={status}
                        value={isPrivacyMode ? privacyPlaceholder : formatCurrency(statusSpecificData[status]?.total || 0)}
                        icon={getCommissionIcon(status)}
                        description="FLUXO DE COMISSÕES"
                    />
                </div>
            ))}
        </div>
    </div>
  );
}
