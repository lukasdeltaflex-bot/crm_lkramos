'use client';

import * as React from 'react';
import type { Row } from '@tanstack/react-table';
import type { Proposal, Customer, ProposalStatus } from '@/lib/types';
import { StatsCard } from '@/components/dashboard/stats-card';
import { formatCurrency } from '@/lib/utils';
import { FileText, CircleDollarSign, CheckCircle, Hourglass, Info } from 'lucide-react';
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
    totalCommissionValue,
    totalAmountPaid,
    pendingAmount,
    allProposalsInPeriod,
    commissionReceivedProposals,
    proposalsForSaldoAReceber,
    expectedCommissionProposals,
    expectedCommissionPercentage,
    amountPaidPercentage,
    pendingAmountPercentage
  } = React.useMemo(() => {
    const allProposalsInPeriod = 'original' in (rows?.[0] || {}) ? (rows as Row<ProposalWithCustomer>[]).map(r => r.original) : (rows as ProposalWithCustomer[]);
    
    if (!allProposalsInPeriod || allProposalsInPeriod.length === 0) {
        return {
            totalDigitadoNoPeriodo: 0,
            totalCommissionValue: 0,
            totalAmountPaid: 0,
            pendingAmount: 0,
            allProposalsInPeriod: [],
            commissionReceivedProposals: [],
            proposalsForSaldoAReceber: [],
            expectedCommissionProposals: [],
            expectedCommissionPercentage: 0,
            amountPaidPercentage: 0,
            pendingAmountPercentage: 0,
        };
    }

    const totalDigitadoNoPeriodo = allProposalsInPeriod.reduce((sum, p) => {
      if (p.commissionBase === 'net') {
          return sum + (p.netAmount || 0);
      }
      return sum + (p.grossAmount || 0);
    }, 0);

    const validProposals = allProposalsInPeriod.filter(p => p.status !== 'Reprovado');

    const totalPotentialCommission = validProposals.reduce((sum, p) => sum + (p.commissionValue || 0), 0);
    
    const totalAmountPaid = validProposals.reduce((sum, p) => sum + (p.amountPaid || 0), 0);
    
    const expectedCommissionProposals = validProposals.filter(p => {
        const hasDateApproved = !!p.dateApproved;
        if (p.status === 'Em Andamento' && !hasDateApproved) {
            return true;
        }
        if (p.status === 'Pendente' && !hasDateApproved) {
            return true;
        }
        if (p.status === 'Aguardando Saldo') {
            return true;
        }
        return false;
    });

    const totalCommissionValue = expectedCommissionProposals.reduce((sum, p) => sum + (p.commissionValue || 0), 0);
    
    const commissionReceivedProposals = validProposals.filter(p => p.amountPaid && p.amountPaid > 0);
    
    const proposalsForSaldoAReceber = validProposals.filter(p => {
        if (p.commissionStatus === 'Paga') {
            return false;
        }
        
        const isPago = p.status === 'Pago';
        const isEmAndamentoAverbado = p.status === 'Em Andamento' && !!p.dateApproved;
        const isPendenteAverbado = p.status === 'Pendente' && !!p.dateApproved;
        const isSaldoPago = p.status === 'Saldo Pago';
        
        return isPago || isEmAndamentoAverbado || isPendenteAverbado || isSaldoPago;
    });

    const pendingAmount = proposalsForSaldoAReceber.reduce((sum, p) => {
      const remaining = (p.commissionValue || 0) - (p.amountPaid || 0);
      return sum + (remaining > 0 ? remaining : 0);
    }, 0);
    
    const expectedCommissionPercentage = totalPotentialCommission > 0 ? (totalCommissionValue / totalPotentialCommission) * 100 : 0;
    const amountPaidPercentage = totalPotentialCommission > 0 ? (totalAmountPaid / totalPotentialCommission) * 100 : 0;
    const pendingAmountPercentage = totalPotentialCommission > 0 ? (pendingAmount / totalPotentialCommission) * 100 : 0;

    return {
      totalDigitadoNoPeriodo,
      totalCommissionValue,
      totalAmountPaid,
      pendingAmount,
      allProposalsInPeriod,
      commissionReceivedProposals,
      proposalsForSaldoAReceber,
      expectedCommissionProposals,
      expectedCommissionPercentage,
      amountPaidPercentage,
      pendingAmountPercentage,
    };
  }, [rows]);
  
  const privacyPlaceholder = '•••••';
  const summaryTitle = "Resumo do Mês Atual";

  const cards = [
    {
      title: "Total Digitado no Período",
      value: formatCurrency(totalDigitadoNoPeriodo),
      icon: FileText,
      valueClassName: "text-purple-500",
      proposals: allProposalsInPeriod,
      description: undefined,
    },
    {
      title: "Comissão Esperada",
      value: formatCurrency(totalCommissionValue),
      icon: CircleDollarSign,
      valueClassName: "text-blue-500",
      proposals: expectedCommissionProposals,
      description: expectedCommissionPercentage > 0 ? `${expectedCommissionPercentage.toFixed(1).replace('.', ',')}% do total` : undefined,
    },
    {
      title: "Comissão Recebida",
      value: formatCurrency(totalAmountPaid),
      icon: CheckCircle,
      valueClassName: "text-green-500",
      proposals: commissionReceivedProposals,
      description: amountPaidPercentage > 0 ? `${amountPaidPercentage.toFixed(1).replace('.', ',')}% do total` : undefined,
    },
    {
      title: "Saldo a Receber",
      value: formatCurrency(pendingAmount),
      icon: Hourglass,
      valueClassName: "text-orange-500",
      proposals: proposalsForSaldoAReceber,
      description: pendingAmountPercentage > 0 ? `${pendingAmountPercentage.toFixed(1).replace('.', ',')}% do total` : undefined,
    },
  ];

   if (!rows || rows.length === 0) {
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
        <Alert variant="default" className="bg-secondary/50">
            <Info className="h-4 w-4" />
            <AlertTitle>{summaryTitle}</AlertTitle>
            <AlertDescription>
                Os valores nos cards abaixo representam os totais para o mês vigente.
                {isFiltered && (
                    <span className="block mt-1">A tabela abaixo está exibindo resultados filtrados.</span>
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
                        description={!isPrivacyMode ? card.description : undefined}
                        className="print:shadow-none print:border-gray-300 print:p-2"
                        valueClassName={card.valueClassName}
                    />
                </div>
            ))}
        </div>
    </div>
  );
}
