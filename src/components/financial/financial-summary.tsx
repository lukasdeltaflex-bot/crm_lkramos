'use client';

import * as React from 'react';
import type { Proposal, Customer, UserSettings } from '@/lib/types';
import { StatsCard } from '@/components/dashboard/stats-card';
import { formatCurrency, parseDateSafe } from '@/lib/utils';
import { Hourglass, CircleDollarSign, Activity, Wallet } from 'lucide-react';
import { startOfMonth, endOfMonth, subMonths, eachDayOfInterval, subDays, startOfDay, endOfDay, isSameMonth } from 'date-fns';

interface FinancialSummaryProps {
  rows: Proposal[]; 
  currentMonthRange: { from: Date; to: Date };
  isPrivacyMode: boolean;
  userSettings: UserSettings | null;
  onShowDetails: (title: string, proposals: Proposal[]) => void;
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
    const today = new Date();
    const fromDate = currentMonthRange?.from || startOfMonth(today);
    const toDate = currentMonthRange?.to || endOfMonth(today);
    
    const prevMonthStart = startOfMonth(subMonths(fromDate, 1));
    const prevMonthEnd = endOfMonth(subMonths(fromDate, 1));

    const safeValue = (val: any) => {
        const n = Number(val);
        return isNaN(n) ? 0 : n;
    };

    const digitizedInPeriod: Proposal[] = [];
    const receivedInPeriod: Proposal[] = [];
    const averbados: Proposal[] = [];
    const esperados: Proposal[] = [];
    
    let digitizedPrevSum = 0;
    let receivedPrevSum = 0;

    rows.forEach(p => {
        const isReprovado = p.status === 'Reprovado';
        
        const dDigit = parseDateSafe(p.dateDigitized);
        const dPay = parseDateSafe(p.commissionPaymentDate);
        const dAppr = parseDateSafe(p.dateApproved);

        if (dDigit && !isReprovado) {
            if (dDigit >= fromDate && dDigit <= toDate) {
                digitizedInPeriod.push(p);
            }
            if (dDigit >= prevMonthStart && dDigit <= prevMonthEnd) {
                digitizedPrevSum += safeValue(p.commissionValue);
            }
        }

        if (dPay && (p.commissionStatus === 'Paga' || p.commissionStatus === 'Parcial')) {
            if (dPay >= fromDate && dPay <= toDate) {
                receivedInPeriod.push(p);
            }
            if (dPay >= prevMonthStart && dPay <= prevMonthEnd) {
                receivedPrevSum += safeValue(p.amountPaid);
            }
        }

        if (dAppr && !isReprovado && p.commissionStatus !== 'Paga') {
            averbados.push(p);
        }

        if (!isReprovado && !['Pago', 'Saldo Pago'].includes(p.status)) {
            esperados.push(p);
        }
    });

    const totalComissaoProducaoDigitada = digitizedInPeriod.reduce((sum, p) => sum + safeValue(p.commissionValue), 0);
    const totalComissaoRecebida = receivedInPeriod.reduce((sum, p) => sum + safeValue(p.amountPaid), 0);
    
    const digitizedTrend = digitizedPrevSum > 0 ? ((totalComissaoProducaoDigitada - digitizedPrevSum) / digitizedPrevSum) * 100 : 0;
    const receivedTrend = receivedPrevSum > 0 ? ((totalComissaoRecebida - receivedPrevSum) / receivedPrevSum) * 100 : 0;

    const totalSaldoAReceber = averbados.reduce((sum, p) => sum + (safeValue(p.commissionValue) - safeValue(p.amountPaid)), 0);
    const totalComissaoEsperada = esperados.reduce((sum, p) => sum + (safeValue(p.commissionValue) - safeValue(p.amountPaid)), 0);

    const last7Days = eachDayOfInterval({ start: subDays(today, 6), end: today });
    
    const productionTrend = last7Days.map(day => {
        const ds = startOfDay(day);
        const de = endOfDay(day);
        return rows.reduce((sum, p) => {
            const d = parseDateSafe(p.dateDigitized);
            return (d && d >= ds && d <= de && p.status !== 'Reprovado') ? sum + safeValue(p.commissionValue) : sum;
        }, 0);
    });

    const receivedTrendData = last7Days.map(day => {
        const ds = startOfDay(day);
        const de = endOfDay(day);
        return rows.reduce((sum, p) => {
            const d = parseDateSafe(p.commissionPaymentDate);
            return (d && d >= ds && d <= de && (p.commissionStatus === 'Paga' || p.commissionStatus === 'Parcial')) 
                ? sum + safeValue(p.amountPaid) 
                : sum;
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
                    description="COMISSÕES VIVAS (MÊS)"
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
