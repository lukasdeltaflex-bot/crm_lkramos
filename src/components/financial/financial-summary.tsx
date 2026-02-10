
'use client';

import * as React from 'react';
import type { Row } from '@tanstack/react-table';
import type { Proposal, Customer, UserSettings } from '@/lib/types';
import { StatsCard } from '@/components/dashboard/stats-card';
import { formatCurrency } from '@/lib/utils';
import { Hourglass, CircleDollarSign, TrendingUp, Activity } from 'lucide-react';
import type { DateRange } from 'react-day-picker';
import { startOfMonth, endOfMonth } from 'date-fns';

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
    totalMonthlyComissaoDigitada,
    totalAmountPaid,
    totalSaldoAReceber,
    totalComissaoEsperada,
    allProposalsInPeriod,
    commissionReceivedProposals,
    proposalsWithBalance,
    proposalsEsperadas,
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

    // 1. PRODUÇÃO DIGITADA: Todos os contratos digitados no mês (MESMO REPROVADOS)
    const currentMonthDigitized = allProposals.filter(p => {
        if (!p.dateDigitized) return false;
        const d = new Date(p.dateDigitized);
        return d >= fromDate && d <= effectiveToDate;
    });
    const totalMonthlyComissaoDigitada = currentMonthDigitized.reduce((sum, p) => sum + (p.commissionValue || 0), 0);

    // 2. COMISSÃO RECEBIDA: Dinheiro que entrou no mês vigente (independente de quando a proposta foi feita)
    const commissionReceivedProposals = allProposals.filter(p => {
        if (p.commissionStatus !== 'Paga' || !p.commissionPaymentDate) return false;
        const d = new Date(p.commissionPaymentDate);
        return d >= fromDate && d <= effectiveToDate;
    });
    const totalAmountPaid = commissionReceivedProposals.reduce((sum, p) => sum + (p.amountPaid || 0), 0);

    // 3. SALDO A RECEBER: Apenas contratos AVERBADOS ou PAGOS (com saldo pendente), independente do mês. Ignora Reprovados.
    const proposalsWithBalance = allProposals.filter(p => {
        const isNotReprovado = p.status !== 'Reprovado';
        const isNotFullyPaid = p.commissionStatus !== 'Paga';
        const hasAverbacaoOrPaid = !!p.dateApproved || p.status === 'Pago' || p.status === 'Saldo Pago';
        return isNotReprovado && isNotFullyPaid && hasAverbacaoOrPaid;
    });
    const totalSaldoAReceber = proposalsWithBalance.reduce((sum, p) => sum + (p.commissionValue - (p.amountPaid || 0)), 0);

    // 4. COMISSÃO ESPERADA: Todos os contratos da base, EXCETO Reprovados, Pagos (status) ou já Recebidos. Independente do mês.
    // Foca na esteira que ainda não finalizou.
    const proposalsEsperadas = allProposals.filter(p => {
        const isNotReprovado = p.status !== 'Reprovado';
        const isNotFinalized = p.status !== 'Pago' && p.status !== 'Saldo Pago';
        const isNotFullyPaid = p.commissionStatus !== 'Paga';
        return isNotReprovado && isNotFinalized && isNotFullyPaid;
    });
    const totalComissaoEsperada = proposalsEsperadas.reduce((sum, p) => sum + (p.commissionValue - (p.amountPaid || 0)), 0);

    const ticketMedio = currentMonthDigitized.length > 0 ? totalMonthlyComissaoDigitada / currentMonthDigitized.length : 0;
    const eficiencia = (totalAmountPaid + totalSaldoAReceber) > 0 ? (totalAmountPaid / (totalAmountPaid + totalSaldoAReceber)) * 100 : 0;
    
    const financeKpis = [
        { name: "PRODUÇÃO DIGITADA", value: totalMonthlyComissaoDigitada },
        { name: "COMISSÃO RECEBIDA", value: totalAmountPaid },
        { name: "SALDO A RECEBER", value: totalSaldoAReceber },
        { name: "COMISSÃO ESPERADA", value: totalComissaoEsperada }
    ];
    const hotKpi = financeKpis.sort((a,b) => b.value - a.value)[0]?.name;

    return {
      totalMonthlyComissaoDigitada,
      totalAmountPaid,
      totalSaldoAReceber,
      totalComissaoEsperada,
      allProposalsInPeriod: currentMonthDigitized,
      commissionReceivedProposals,
      proposalsWithBalance,
      proposalsEsperadas,
      metrics: {
          ticketMedio,
          eficiencia,
          hotKpi
      }
    };
  }, [rows, currentMonthRange]);
  
  const privacyPlaceholder = '•••••';

  return (
    <div className='space-y-6 mb-8'>
        <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4 print:grid-cols-4'>
            <div className="cursor-pointer" onClick={() => onShowDetails("Produção Digitada (Total Bruto Mês)", allProposalsInPeriod)}>
                <StatsCard
                    title="PRODUÇÃO DIGITADA"
                    value={isPrivacyMode ? privacyPlaceholder : formatCurrency(totalMonthlyComissaoDigitada)}
                    icon={Activity}
                    description="TOTAL DIGITADO NO MÊS"
                    subValue={`TICKET MÉDIO: ${formatCurrency(metrics.ticketMedio)}`}
                    isHot={metrics.hotKpi === "PRODUÇÃO DIGITADA"}
                />
            </div>

            <div className="cursor-pointer" onClick={() => onShowDetails("Comissões Recebidas no Período", commissionReceivedProposals)}>
                <StatsCard
                    title="COMISSÃO RECEBIDA"
                    value={isPrivacyMode ? privacyPlaceholder : formatCurrency(totalAmountPaid)}
                    icon={TrendingUp}
                    description="DINHEIRO NO CAIXA"
                    subValue={`EFICIÊNCIA: ${metrics.eficiencia.toFixed(1)}%`}
                    isHot={metrics.hotKpi === "COMISSÃO RECEBIDA"}
                />
            </div>

            <div className="cursor-pointer" onClick={() => onShowDetails("Saldo a Receber (Averbados/Pagos)", proposalsWithBalance)}>
                <StatsCard
                    title="SALDO A RECEBER"
                    value={isPrivacyMode ? privacyPlaceholder : formatCurrency(totalSaldoAReceber)}
                    icon={Hourglass}
                    description="CONTRATOS AVERBADOS"
                    isHot={metrics.hotKpi === "SALDO A RECEBER"}
                />
            </div>

            <div className="cursor-pointer" onClick={() => onShowDetails("Comissão Esperada (Carteira Ativa)", proposalsEsperadas)}>
                <StatsCard
                    title="COMISSÃO ESPERADA"
                    value={isPrivacyMode ? privacyPlaceholder : formatCurrency(totalComissaoEsperada)}
                    icon={CircleDollarSign}
                    description="PIPELINE EM TRÂMITE"
                    isHot={metrics.hotKpi === "COMISSÃO ESPERADA"}
                />
            </div>
        </div>
    </div>
  );
}
