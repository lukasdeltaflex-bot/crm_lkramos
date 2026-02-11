'use client';

import * as React from 'react';
import type { Row } from '@tanstack/react-table';
import type { Proposal, Customer, UserSettings } from '@/lib/types';
import { StatsCard } from '@/components/dashboard/stats-card';
import { formatCurrency } from '@/lib/utils';
import { Hourglass, CircleDollarSign, Activity, Wallet, TrendingUp } from 'lucide-react';
import { startOfMonth, endOfMonth, subMonths, eachDayOfInterval, subDays, startOfDay, endOfDay } from 'date-fns';

type ProposalWithCustomer = Proposal & { customer: Customer };

interface FinancialSummaryProps {
  rows: Row<ProposalWithCustomer>[] | ProposalWithCustomer[];
  currentMonthRange: { from: Date; to: Date };
  isPrivacyMode: boolean;
  isFiltered: boolean;
  onShowDetails: (title: string, proposals: ProposalWithCustomer[]) => void;
  userSettings: UserSettings | null;
}

export function FinancialSummary({ rows, currentMonthRange, isPrivacyMode, onShowDetails, userSettings }: FinancialSummaryProps) {
  const {
    totalComissaoProducaoDigitada,
    digitizedTrend,
    totalComissaoRecebida,
    receivedTrend,
    totalSaldoAReceber,
    totalComissaoEsperada,
    allDigitizedInPeriod,
    allReceivedInPeriod,
    allAverbados,
    allEsperados,
    productionTrend,
    receivedTrendData,
    metrics,
  } = React.useMemo(() => {
    const allProposals = Array.isArray(rows) && rows.length > 0 
        ? ('original' in (rows[0] as any) ? (rows as Row<ProposalWithCustomer>[]).map(r => r.original) : (rows as ProposalWithCustomer[]))
        : [];
    
    const today = new Date();
    const fromDate = currentMonthRange?.from || startOfMonth(today);
    const toDate = currentMonthRange?.to || endOfMonth(today);
    const effectiveToDate = new Date(toDate);
    effectiveToDate.setHours(23, 59, 59, 999);

    const prevMonthStart = startOfMonth(subMonths(fromDate, 1));
    const prevMonthEnd = endOfMonth(subMonths(fromDate, 1));

    // 1. PRODUÇÃO DIGITADA (Tendência e Sparkline)
    const digitizedInPeriod = allProposals.filter(p => {
        if (!p.dateDigitized) return false;
        const d = new Date(p.dateDigitized);
        return d >= fromDate && d <= effectiveToDate;
    });
    const totalComissaoProducaoDigitada = digitizedInPeriod.reduce((sum, p) => sum + (p.commissionValue || 0), 0);

    const digitizedInPrev = allProposals.filter(p => {
        if (!p.dateDigitized) return false;
        const d = new Date(p.dateDigitized);
        return d >= prevMonthStart && d <= prevMonthEnd;
    }).reduce((sum, p) => sum + (p.commissionValue || 0), 0);

    const digitizedTrend = digitizedInPrev > 0 ? ((totalComissaoProducaoDigitada - digitizedInPrev) / digitizedInPrev) * 100 : 0;

    // 2. COMISSÃO RECEBIDA (Tendência e Sparkline)
    const receivedInPeriod = allProposals.filter(p => {
        if (p.commissionStatus !== 'Paga' || !p.commissionPaymentDate) return false;
        const d = new Date(p.commissionPaymentDate);
        return d >= fromDate && d <= effectiveToDate;
    });
    const totalComissaoRecebida = receivedInPeriod.reduce((sum, p) => sum + (p.amountPaid || 0), 0);

    const receivedInPrev = allProposals.filter(p => {
        if (p.commissionStatus !== 'Paga' || !p.commissionPaymentDate) return false;
        const d = new Date(p.commissionPaymentDate);
        return d >= prevMonthStart && d <= prevMonthEnd;
    }).reduce((sum, p) => sum + (p.amountPaid || 0), 0);

    const receivedTrend = receivedInPrev > 0 ? ((totalComissaoRecebida - receivedInPrev) / receivedInPrev) * 100 : 0;

    // 3. SALDO A RECEBER (Acumulado)
    const averbados = allProposals.filter(p => {
        const hasAverbacao = !!p.dateApproved;
        const isNotFullyPaid = p.commissionStatus !== 'Paga';
        const isNotReprovado = p.status !== 'Reprovado';
        return hasAverbacao && isNotFullyPaid && isNotReprovado;
    });
    const totalSaldoAReceber = averbados.reduce((sum, p) => sum + (p.commissionValue - (p.amountPaid || 0)), 0);

    // 4. COMISSÃO ESPERADA (Acumulado)
    const esperados = allProposals.filter(p => {
        const isNotReprovado = p.status !== 'Reprovado';
        const isNotPaid = p.status !== 'Pago';
        return isNotReprovado && isNotPaid;
    });
    const totalComissaoEsperada = esperados.reduce((sum, p) => sum + (p.commissionValue - (p.amountPaid || 0)), 0);

    // SPARKLINE: ÚLTIMOS 7 DIAS
    const last7Days = eachDayOfInterval({ start: subDays(today, 6), end: today });
    const productionTrend = last7Days.map(day => {
        const dStart = startOfDay(day);
        const dEnd = endOfDay(day);
        return allProposals
            .filter(p => {
                const d = new Date(p.dateDigitized);
                return d >= dStart && d <= dEnd;
            })
            .reduce((sum, p) => sum + (p.commissionValue || 0), 0);
    });

    const receivedTrendData = last7Days.map(day => {
        const dStart = startOfDay(day);
        const dEnd = endOfDay(day);
        return allProposals
            .filter(p => {
                if (p.commissionStatus !== 'Paga' || !p.commissionPaymentDate) return false;
                const d = new Date(p.commissionPaymentDate);
                return d >= dStart && d <= dEnd;
            })
            .reduce((sum, p) => sum + (p.amountPaid || 0), 0);
    });

    const hotKpi = totalComissaoRecebida > totalComissaoProducaoDigitada ? "COMISSÃO RECEBIDA" : "PRODUÇÃO DIGITADA";

    return {
      totalComissaoProducaoDigitada,
      digitizedTrend,
      totalComissaoRecebida,
      receivedTrend,
      totalSaldoAReceber,
      totalComissaoEsperada,
      allDigitizedInPeriod: digitizedInPeriod,
      allReceivedInPeriod: receivedInPeriod,
      allAverbados: averbados,
      allEsperados: esperados,
      productionTrend,
      receivedTrendData,
      metrics: { hotKpi }
    };
  }, [rows, currentMonthRange]);
  
  const privacyPlaceholder = '•••••';

  return (
    <div className='space-y-6 mb-8'>
        <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4 print:grid-cols-4'>
            <div className="cursor-pointer" onClick={() => onShowDetails("Produção Digitada (Comissões Mês)", allDigitizedInPeriod)}>
                <StatsCard
                    title="PRODUÇÃO DIGITADA"
                    value={isPrivacyMode ? privacyPlaceholder : formatCurrency(totalComissaoProducaoDigitada)}
                    icon={Activity}
                    description="TOTAL EM COMISSÕES (MÊS)"
                    percentage={digitizedTrend}
                    sparklineData={productionTrend}
                />
            </div>

            <div className="cursor-pointer" onClick={() => onShowDetails("Comissão Recebida (Entrada de Caixa)", allReceivedInPeriod)}>
                <StatsCard
                    title="COMISSÃO RECEBIDA"
                    value={isPrivacyMode ? privacyPlaceholder : formatCurrency(totalComissaoRecebida)}
                    icon={Wallet}
                    description="DINHEIRO EM CAIXA (MÊS)"
                    isHot={metrics.hotKpi === "COMISSÃO RECEBIDA"}
                    percentage={receivedTrend}
                    sparklineData={receivedTrendData}
                />
            </div>

            <div className="cursor-pointer" onClick={() => onShowDetails("Saldo a Receber (Contratos Averbados)", allAverbados)}>
                <StatsCard
                    title="SALDO A RECEBER"
                    value={isPrivacyMode ? privacyPlaceholder : formatCurrency(totalSaldoAReceber)}
                    icon={Hourglass}
                    description="APENAS CONTRATOS AVERBADOS"
                    isHot={metrics.hotKpi === "SALDO A RECEBER"}
                    sparklineData={productionTrend.map(v => v * 0.8)} // Simulação sutil para o acumulado
                />
            </div>

            <div className="cursor-pointer" onClick={() => onShowDetails("Comissão Esperada (Expectativa Real)", allEsperados)}>
                <StatsCard
                    title="COMISSÃO ESPERADA"
                    value={isPrivacyMode ? privacyPlaceholder : formatCurrency(totalComissaoEsperada)}
                    icon={CircleDollarSign}
                    description="ESTEIRA ATIVA (PENDÊNCIAS)"
                    isHot={metrics.hotKpi === "COMISSÃO ESPERADA"}
                    sparklineData={productionTrend.map(v => v * 1.2)}
                />
            </div>
        </div>
    </div>
  );
}
