import { AppLayout } from '@/components/app-layout';
import { BirthdayAlerts } from '@/components/dashboard/birthday-alerts';
import { CommissionChart } from '@/components/dashboard/commission-chart';
import { RecentProposals } from '@/components/dashboard/recent-proposals';
import { StatsCard } from '@/components/dashboard/stats-card';
import { PageHeader } from '@/components/page-header';
import { proposals } from '@/lib/data';
import {
  FileText,
  Clock,
  CircleDollarSign,
  CheckCircle,
  XCircle,
  Hourglass,
  BadgePercent,
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import type { ProposalStatus } from '@/lib/types';

export default function DashboardPage() {
  const getProposalsSumByStatus = (status: ProposalStatus) => {
    return proposals
      .filter((p) => p.status === status)
      .reduce((sum, p) => sum + p.grossAmount, 0);
  };

  const paidAmount = getProposalsSumByStatus('Pago');
  const pendingAmount = proposals
    .filter((p) => p.status !== 'Pago' && p.status !== 'Rejeitado')
    .reduce((sum, p) => sum + p.grossAmount, 0);

  return (
    <AppLayout>
      <PageHeader title="Dashboard" />
      <div className="space-y-8">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          <StatsCard
            title="Em Andamento"
            value={formatCurrency(getProposalsSumByStatus('Em Andamento'))}
            icon={Hourglass}
            className="border-yellow-500/50"
          />
          <StatsCard
            title="Aguardando Saldo"
            value={formatCurrency(getProposalsSumByStatus('Aguardando Saldo'))}
            icon={Clock}
            className="border-yellow-500/50"
          />
          <StatsCard
            title="Pago"
            value={formatCurrency(getProposalsSumByStatus('Pago'))}
            icon={CheckCircle}
            className="border-green-500/50"
          />
           <StatsCard
            title="Reprovado"
            value={formatCurrency(getProposalsSumByStatus('Rejeitado'))}
            icon={XCircle}
            className="border-red-500/50"
          />
          <StatsCard
            title="Saldo Pago"
            value={formatCurrency(paidAmount)}
            icon={CircleDollarSign}
            className="border-green-500/50"
          />
          <StatsCard
            title="Pendente"
            value={formatCurrency(pendingAmount)}
            icon={BadgePercent}
            className="border-yellow-500/50"
          />
        </div>
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <CommissionChart />
          </div>
          <div className="space-y-8">
            <BirthdayAlerts />
          </div>
        </div>
        <div>
          <RecentProposals />
        </div>
      </div>
    </AppLayout>
  );
}
