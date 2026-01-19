'use client';

import * as React from 'react';
import type { Row } from '@tanstack/react-table';
import type { Proposal, Customer } from '@/lib/types';
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
    totalContracted,
    totalCommissionValue,
    totalAmountPaid,
    pendingAmount,
    totalProposals,
    commissionReceivedProposals,
    commissionPendingProposals,
  } = React.useMemo(() => {
    if (!rows || rows.length === 0) {
        return {
            totalContracted: 0,
            totalCommissionValue: 0,
            totalAmountPaid: 0,
            pendingAmount: 0,
            totalProposals: [],
            commissionReceivedProposals: [],
            commissionPendingProposals: [],
        };
    }
    
    const items = 'original' in rows[0] ? (rows as Row<ProposalWithCustomer>[]).map(r => r.original) : rows as ProposalWithCustomer[];

    let totalContracted = 0;
    let totalCommissionValue = 0;
    let totalAmountPaid = 0;

    items.forEach((proposal) => {
      totalCommissionValue += proposal.commissionValue || 0;
      totalAmountPaid += proposal.amountPaid || 0;

      if (proposal.commissionBase === 'net') {
        totalContracted += proposal.netAmount;
      } else {
        totalContracted += proposal.grossAmount;
      }
    });
    
    const commissionReceivedProposals = items.filter(p => p.amountPaid && p.amountPaid > 0);
    
    const commissionPendingProposals = items.filter(proposal => {
        const hasUnpaidCommission = (proposal.commissionValue || 0) > (proposal.amountPaid || 0);
        if (!hasUnpaidCommission) {
            return false;
        }

        const status = proposal.status;
        const hasDateApproved = !!proposal.dateApproved;

        if (status === 'Pago' || status === 'Saldo Pago') {
            return true;
        }

        if ((status === 'Pendente' || status === 'Em Andamento') && hasDateApproved) {
            return true;
        }

        return false;
    });

    const pendingAmount = commissionPendingProposals.reduce((sum, p) => {
        return sum + ((p.commissionValue || 0) - (p.amountPaid || 0));
    }, 0);

    return {
      totalContracted,
      totalCommissionValue,
      totalAmountPaid,
      pendingAmount,
      totalProposals: items,
      commissionReceivedProposals,
      commissionPendingProposals,
    };
  }, [rows]);
  
  const privacyPlaceholder = '•••••';
  const summaryTitle = isFiltered ? "Resumo do Filtro" : "Resumo do Mês Atual";

  const cards = [
    {
      title: "Total Contratado",
      value: formatCurrency(totalContracted),
      icon: FileText,
      valueClassName: "text-purple-500",
      proposals: totalProposals,
    },
    {
      title: "Comissão Esperada",
      value: formatCurrency(totalCommissionValue),
      icon: CircleDollarSign,
      valueClassName: "text-blue-500",
      proposals: totalProposals,
    },
    {
      title: "Comissão Recebida",
      value: formatCurrency(totalAmountPaid),
      icon: CheckCircle,
      valueClassName: "text-green-500",
      proposals: commissionReceivedProposals,
    },
    {
      title: "Saldo a Receber",
      value: formatCurrency(pendingAmount),
      icon: Hourglass,
      valueClassName: "text-orange-500",
      proposals: commissionPendingProposals,
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
                {isFiltered 
                    ? "Os valores abaixo representam os totais para os filtros aplicados. Clique em um card para ver os detalhes."
                    : "Os valores abaixo representam os totais para o mês vigente. Clique em um card para ver os detalhes."
                }
            </AlertDescription>
        </Alert>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 print:grid-cols-4 print:gap-2">
           {cards.map(card => (
                <div key={card.title} className="cursor-pointer" onClick={() => onShowDetails(card.title, card.proposals)}>
                    <StatsCard
                        title={card.title}
                        value={isPrivacyMode ? privacyPlaceholder : card.value}
                        icon={card.icon}
                        className="print:shadow-none print:border-gray-300 print:p-2"
                        valueClassName={card.valueClassName}
                    />
                </div>
            ))}
        </div>
    </div>
  );
}
