
'use client';

import * as React from 'react';
import type { Row } from '@tanstack/react-table';
import type { Proposal, Customer } from '@/lib/types';
import { StatsCard } from '@/components/dashboard/stats-card';
import { formatCurrency, cn } from '@/lib/utils';
import { CheckCircle, Hourglass, Info, Coins, CircleDollarSign } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';

type ProposalWithCustomer = Proposal & { customer: Customer };

interface FinancialSummaryProps {
  rows: Row<ProposalWithCustomer>[] | ProposalWithCustomer[];
  isPrivacyMode: boolean;
  isFiltered: boolean;
  onShowDetails: (title: string, proposals: ProposalWithCustomer[]) => void;
}

export function FinancialSummary({ rows, isPrivacyMode, isFiltered, onShowDetails }: FinancialSummaryProps) {
  const {
    totalDigitadoNoPeriodo,
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
    const allProposalsInPeriod = 'original' in (rows?.[0] || {}) ? (rows as Row<ProposalWithCustomer>[]).map(r => r.original) : (rows as ProposalWithCustomer[]);
    
    if (!allProposalsInPeriod || allProposalsInPeriod.length === 0) {
        return {
            totalDigitadoNoPeriodo: 0,
            totalPotentialCommission: 0,
            totalAmountPaid: 0,
            pendingAmount: 0,
            expectedAmount: 0,
            allProposalsInPeriod: [],
            commissionReceivedProposals: [],
            proposalsForSaldoAReceber: [],
            expectedCommissionProposals: [],
            paidPercentage: 0,
            pendingPercentage: 0,
            expectedPercentage: 0,
        };
    }

    // 1. Volume Total Digitado (Para o descritivo)
    const totalDigitadoNoPeriodo = allProposalsInPeriod.reduce((sum, p) => {
      if (p.commissionBase === 'net') return sum + (p.netAmount || 0);
      return sum + (p.grossAmount || 0);
    }, 0);

    // 1.1 Total de Comissões (Base 100%) - Independente de status
    const totalPotentialCommission = allProposalsInPeriod.reduce((sum, p) => sum + (p.commissionValue || 0), 0);

    // 2. Comissão Recebida - Baseado no status financeiro "Paga"
    const commissionReceivedProposals = allProposalsInPeriod.filter(p => p.commissionStatus === 'Paga');
    const totalAmountPaid = commissionReceivedProposals.reduce((sum, p) => sum + (p.amountPaid || 0), 0);
    
    // 3. Saldo a Receber (Já "garantido" por averbação ou pagamento ao cliente, mas financeiro não baixado)
    const proposalsForSaldoAReceber = allProposalsInPeriod.filter(p => {
        if (p.commissionStatus === 'Paga') return false;
        
        const hasAverbacao = !!p.dateApproved;
        const status = p.status;

        // Regra: Pago OU (Qualquer status com averbação preenchida)
        return status === 'Pago' || (hasAverbacao && (status === 'Em Andamento' || status === 'Saldo Pago' || status === 'Pendente'));
    });
    const pendingAmount = proposalsForSaldoAReceber.reduce((sum, p) => sum + (p.commissionValue || 0), 0);

    // 4. Comissão Esperada (Funil de entrada - propostas sem averbação e não reprovadas)
    const expectedCommissionProposals = allProposalsInPeriod.filter(p => {
        if (p.commissionStatus === 'Paga') return false;
        
        const isReprovado = p.status === 'Reprovado';
        const hasAverbacao = !!p.dateApproved;
        const isPagoStatus = p.status === 'Pago'; // Se é Pago, já está no card de Saldo a Receber

        return !isReprovado && !hasAverbacao && !isPagoStatus;
    });
    const expectedAmount = expectedCommissionProposals.reduce((sum, p) => sum + (p.commissionValue || 0), 0);
    
    const getPercentage = (value: number) => {
        if (totalPotentialCommission === 0) return 0;
        return (value / totalPotentialCommission) * 100;
    };

    return {
      totalDigitadoNoPeriodo,
      totalPotentialCommission,
      totalAmountPaid,
      pendingAmount,
      expectedAmount,
      allProposalsInPeriod,
      commissionReceivedProposals,
      proposalsForSaldoAReceber,
      expectedCommissionProposals,
      paidPercentage: getPercentage(totalAmountPaid),
      pendingPercentage: getPercentage(pendingAmount),
      expectedPercentage: getPercentage(expectedAmount),
    };
  }, [rows]);
  
  const privacyPlaceholder = '•••••';

  const cards = [
    {
      title: "Total de Comissões",
      value: formatCurrency(totalPotentialCommission),
      icon: Coins,
      description: `Volume Digitado: ${isPrivacyMode ? privacyPlaceholder : formatCurrency(totalDigitadoNoPeriodo)}`,
      className: "border-muted bg-muted/10",
      valueClassName: "text-foreground",
      proposals: allProposalsInPeriod,
      percentage: 100,
    },
    {
      title: "Comissão Recebida",
      value: formatCurrency(totalAmountPaid),
      icon: CheckCircle,
      description: "Status 'Paga'",
      className: "border-green-500/30 bg-green-500/5 dark:bg-green-500/10",
      valueClassName: "text-green-500",
      proposals: commissionReceivedProposals,
      percentage: paidPercentage,
    },
    {
      title: "Saldo a Receber",
      value: formatCurrency(pendingAmount),
      icon: Hourglass,
      description: "Averbados / Pagos ao Cliente",
      className: "border-orange-500/30 bg-orange-500/5 dark:bg-orange-500/10",
      valueClassName: "text-orange-500",
      proposals: proposalsForSaldoAReceber,
      percentage: pendingPercentage,
    },
    {
      title: "Comissão Esperada",
      value: formatCurrency(expectedAmount),
      icon: CircleDollarSign,
      description: "Contratos s/ Averbação",
      className: "border-blue-500/30 bg-blue-500/5 dark:bg-blue-500/10",
      valueClassName: "text-blue-500",
      proposals: expectedCommissionProposals,
      percentage: expectedPercentage,
    },
  ];

   if (!rows || (Array.isArray(rows) && rows.length === 0)) {
      return (
        <Alert variant="default" className="bg-secondary/50">
            <Info className="h-4 w-4" />
            <AlertTitle>Nenhum dado no período</AlertTitle>
            <AlertDescription>
                Não há propostas para exibir no período selecionado.
            </AlertDescription>
        </Alert>
      )
  }

  return (
    <div className='space-y-4'>
        <Alert variant="default" className="bg-secondary/50 print:hidden">
            <Info className="h-4 w-4" />
            <AlertTitle>Resumo Financeiro do Período</AlertTitle>
            <AlertDescription>
                Os cálculos abaixo seguem as novas regras de Averbação e Status.
                {isFiltered && (
                    <span className="block mt-1 font-semibold text-primary">Aviso: A tabela abaixo está exibindo resultados filtrados.</span>
                )}
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
