'use client';

import * as React from 'react';
import type { Row } from '@tanstack/react-table';
import type { Proposal, Customer, UserSettings } from '@/lib/types';
import { StatsCard } from '@/components/dashboard/stats-card';
import { formatCurrency } from '@/lib/utils';
import { Hourglass, CircleDollarSign, Activity, Wallet } from 'lucide-react';
import { startOfMonth, endOfMonth, subMonths, eachDayOfInterval, subDays, startOfDay, endOfDay, isValid } from 'date-fns';

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
    const effectiveToDate = endOfDay(toDate);

    const prevMonthStart = startOfMonth(subMonths(fromDate, 1));
    const prevMonthEnd = endOfMonth(subMonths(fromDate, 1));

    const safeValue = (val: any) => (val === null || val === undefined || isNaN(val)) ? 0 : Number(val);

    // 🛡️ OTIMIZAÇÃO V14: Filtro de passagem única (Single Pass)
    const digitizedInPeriod: ProposalWithCustomer[] = [];
    const receivedInPeriod: ProposalWithCustomer[] = [];
    const averbados: ProposalWithCustomer[] = [];
    const esperados: ProposalWithCustomer[] = [];
    
    let digitizedPrevSum = 0;
    let receivedPrevSum = 0;

    allProposals.forEach(p => {
        const d = p.dateDigitized ? new Date(p.dateDigitized) : null;
        const pd = p.commissionPaymentDate ? new Date(p.commissionPaymentDate) : null;

        // Produção Digitada
        if (d && isValid(d)) {
            if (d >= fromDate && d <= effectiveToDate) digitizedInPeriod.push(p);
            if (d >= prevMonthStart && d <= prevMonthEnd) digitizedPrevSum += safeValue(p.commissionValue);
        }

        // Comissão Recebida
        if (pd && isValid(pd) && (p.commissionStatus === 'Paga' || p.commissionStatus === 'Parcial')) {
            if (pd >= fromDate && pd <= effectiveToDate) receivedInPeriod.push(p);
            if (pd >= prevMonthStart && pd <= prevMonthEnd) receivedPrevSum += safeValue(p.amountPaid);
        }

        // Saldo a Receber (Averbados)
        if (p.dateApproved && p.commissionStatus !== 'Paga' && p.status !== 'Reprovado') {
            averbados.push(p);
        }

        // Comissão Esperada (Esteira)
        if (p.status !== 'Reprovado' && p.status !== 'Pago') {
            esperados.push(p);
        }
    });

    const totalComissaoProducaoDigitada = digitizedInPeriod.reduce((sum, p) => sum + safeValue(p.commissionValue), 0);
    const totalComissaoRecebida = receivedInPeriod.reduce((sum, p) => sum + safeValue(p.amountPaid), 0);
    
    const digitizedTrend = digitizedPrevSum > 0 ? ((totalComissaoProducaoDigitada - digitizedPrevSum) / digitizedPrevSum) * 100 : 0;
    const receivedTrend = receivedPrevSum > 0 ? ((totalComissaoRecebida - receivedPrevSum) / receivedPrevSum) * 100 : 0;

    const totalSaldoAReceber = averbados.reduce((sum, p) => sum + (safeValue(p.commissionValue) - safeValue(p.amountPaid)), 0);
    const totalComissaoEsperada = esperados.reduce((sum, p) => sum + (safeValue(p.commissionValue) - safeValue(p.amountPaid)), 0);

    // Sparklines (Últimos 7 dias)
    const last7Days = eachDayOfInterval({ start: subDays(today, 6), end: today });
    const productionTrend = last7Days.map(day => {
        const ds = startOfDay(day);
        const de = endOfDay(day);
        return allProposals.reduce((sum, p) => {
            const d = p.dateDigitized ? new Date(p.dateDigitized) : null;
            return (d && d >= ds && d <= de) ? sum + safeValue(p.commissionValue) : sum;
        }, 0);
    });

    const receivedTrendData = last7Days.map(day => {
        const ds = startOfDay(day);
        const de = endOfDay(day);
        return allProposals.reduce((sum, p) => {
            if ((p.commissionStatus !== 'Paga' && p.commissionStatus !== 'Parcial') || !p.commissionPaymentDate) return sum;
            const d = new Date(p.commissionPaymentDate);
            return (d && d >= ds && d <= de) ? sum + safeValue(p.amountPaid) : sum;
        }, 0);
    });

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
      metrics: { hotKpi: totalComissaoRecebida > totalComissaoProducaoDigitada ? "COMISSÃO RECEBIDA" : "PRODUÇÃO DIGITADA" }
    };
  }, [rows, currentMonthRange]);
  
  const privacyPlaceholder = '•••••';

  return (
    <div className='space-y-6 mb-8'>
        <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4 print:grid-cols-4'>
            <div className="cursor-pointer" onClick={() => onShowDetails("Produção Digitada (Mês)", allDigitizedInPeriod)}>
                <StatsCard
                    title="PRODUÇÃO DIGITADA"
                    value={isPrivacyMode ? privacyPlaceholder : formatCurrency(totalComissaoProducaoDigitada)}
                    icon={Activity}
                    description="COMISSÕES DO PERÍODO"
                    percentage={digitizedTrend}
                    sparklineData={productionTrend}
                />
            </div>

            <div className="cursor-pointer" onClick={() => onShowDetails("Comissão Recebida (Mês)", allReceivedInPeriod)}>
                <StatsCard
                    title="COMISSÃO RECEBIDA"
                    value={isPrivacyMode ? privacyPlaceholder : formatCurrency(totalComissaoRecebida)}
                    icon={Wallet}
                    description="DINHEIRO EM CAIXA"
                    isHot={metrics.hotKpi === "COMISSÃO RECEBIDA"}
                    percentage={receivedTrend}
                    sparklineData={receivedTrendData}
                />
            </div>

            <div className="cursor-pointer" onClick={() => onShowDetails("Saldo a Receber (Averbados)", allAverbados)}>
                <StatsCard
                    title="SALDO A RECEBER"
                    value={isPrivacyMode ? privacyPlaceholder : formatCurrency(totalSaldoAReceber)}
                    icon={Hourglass}
                    description="COMISSÕES AVERBADAS"
                    sparklineData={productionTrend.map(v => v * 0.8)}
                />
            </div>

            <div className="cursor-pointer" onClick={() => onShowDetails("Esteira Ativa (Pendências)", allEsperados)}>
                <StatsCard
                    title="COMISSÃO ESPERADA"
                    value={isPrivacyMode ? privacyPlaceholder : formatCurrency(totalComissaoEsperada)}
                    icon={CircleDollarSign}
                    description="EXPECTATIVA DE RECEBIMENTO"
                    sparklineData={productionTrend.map(v => v * 1.2)}
                />
            </div>
        </div>
    </div>
  );
}

// Icon definition fix
function Activity(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
    </svg>
  )
}