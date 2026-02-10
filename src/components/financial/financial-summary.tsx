'use client';

import * as React from 'react';
import type { Row } from '@tanstack/react-table';
import type { Proposal, Customer, UserSettings } from '@/lib/types';
import { StatsCard } from '@/components/dashboard/stats-card';
import { formatCurrency } from '@/lib/utils';
import { Hourglass, CircleDollarSign, Activity, Wallet } from 'lucide-react';
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
    totalComissaoProducaoDigitada,
    totalComissaoRecebida,
    totalSaldoAReceber,
    totalComissaoEsperada,
    allDigitizedInPeriod,
    allReceivedInPeriod,
    allAverbados,
    allEsperados,
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

    /**
     * 1. PRODUÇÃO DIGITADA (Mês Vigente)
     * Regra: Soma TODOS os contratos digitados no mês, incluindo reprovados.
     */
    const digitizedInPeriod = allProposals.filter(p => {
        if (!p.dateDigitized) return false;
        const d = new Date(p.dateDigitized);
        return d >= fromDate && d <= effectiveToDate;
    });
    const totalComissaoProducaoDigitada = digitizedInPeriod.reduce((sum, p) => sum + (p.commissionValue || 0), 0);

    /**
     * 2. COMISSÃO RECEBIDA (Período)
     * Dinheiro que efetivamente entrou no caixa.
     */
    const receivedInPeriod = allProposals.filter(p => {
        if (p.commissionStatus !== 'Paga' || !p.commissionPaymentDate) return false;
        const d = new Date(p.commissionPaymentDate);
        return d >= fromDate && d <= effectiveToDate;
    });
    const totalComissaoRecebida = receivedInPeriod.reduce((sum, p) => sum + (p.amountPaid || 0), 0);

    /**
     * 3. SALDO A RECEBER (Independente de Mês)
     * Regra: Contratos com Data de Averbação preenchida que ainda não foram pagos.
     */
    const averbados = allProposals.filter(p => {
        const isNotFullyPaid = p.commissionStatus !== 'Paga';
        const hasAverbacao = !!p.dateApproved;
        return isNotFullyPaid && hasAverbacao && p.status !== 'Reprovado';
    });
    const totalSaldoAReceber = averbados.reduce((sum, p) => sum + (p.commissionValue - (p.amountPaid || 0)), 0);

    /**
     * 4. COMISSÃO ESPERADA (Independente de Mês)
     * Regra: Todos os contratos menos os reprovados e os já pagos.
     */
    const esperados = allProposals.filter(p => {
        const isNotReprovado = p.status !== 'Reprovado';
        const isNotFullyPaid = p.commissionStatus !== 'Paga';
        return isNotReprovado && isNotFullyPaid;
    });
    const totalComissaoEsperada = esperados.reduce((sum, p) => sum + (p.commissionValue - (p.amountPaid || 0)), 0);

    const financeKpis = [
        { name: "PRODUÇÃO DIGITADA", value: totalComissaoProducaoDigitada },
        { name: "COMISSÃO RECEBIDA", value: totalComissaoRecebida },
        { name: "SALDO A RECEBER", value: totalSaldoAReceber },
        { name: "COMISSÃO ESPERADA", value: totalComissaoEsperada }
    ];
    const hotKpi = [...financeKpis].sort((a,b) => b.value - a.value)[0]?.name;

    return {
      totalComissaoProducaoDigitada,
      totalComissaoRecebida,
      totalSaldoAReceber,
      totalComissaoEsperada,
      allDigitizedInPeriod: digitizedInPeriod,
      allReceivedInPeriod: receivedInPeriod,
      allAverbados: averbados,
      allEsperados: esperados,
      metrics: { hotKpi }
    };
  }, [rows, currentMonthRange]);
  
  const privacyPlaceholder = '•••••';

  return (
    <div className='space-y-6 mb-8'>
        <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4 print:grid-cols-4'>
            <div className="cursor-pointer" onClick={() => onShowDetails("Produção Digitada (Esforço Bruto Mês)", allDigitizedInPeriod)}>
                <StatsCard
                    title="PRODUÇÃO DIGITADA"
                    value={isPrivacyMode ? privacyPlaceholder : formatCurrency(totalComissaoProducaoDigitada)}
                    icon={Activity}
                    description="COMISSÃO TOTAL DIGITADA NO MÊS"
                    subValue={`INCLUI REPROVADOS`}
                    isHot={metrics.hotKpi === "PRODUÇÃO DIGITADA"}
                />
            </div>

            <div className="cursor-pointer" onClick={() => onShowDetails("Comissão Recebida (Entrada de Caixa)", allReceivedInPeriod)}>
                <StatsCard
                    title="COMISSÃO RECEBIDA"
                    value={isPrivacyMode ? privacyPlaceholder : formatCurrency(totalComissaoRecebida)}
                    icon={Wallet}
                    description="DINHEIRO QUE ENTROU NO MÊS"
                    isHot={metrics.hotKpi === "COMISSÃO RECEBIDA"}
                />
            </div>

            <div className="cursor-pointer" onClick={() => onShowDetails("Saldo a Receber (Contratos Averbados)", allAverbados)}>
                <StatsCard
                    title="SALDO A RECEBER"
                    value={isPrivacyMode ? privacyPlaceholder : formatCurrency(totalSaldoAReceber)}
                    icon={Hourglass}
                    description="APENAS CONTRATOS AVERBADOS"
                    isHot={metrics.hotKpi === "SALDO A RECEBER"}
                />
            </div>

            <div className="cursor-pointer" onClick={() => onShowDetails("Comissão Esperada (Esteira Ativa)", allEsperados)}>
                <StatsCard
                    title="COMISSÃO ESPERADA"
                    value={isPrivacyMode ? privacyPlaceholder : formatCurrency(totalComissaoEsperada)}
                    icon={CircleDollarSign}
                    description="FUTURO PROJETADO (TODA A BASE)"
                    isHot={metrics.hotKpi === "COMISSÃO ESPERADA"}
                />
            </div>
        </div>
    </div>
  );
}