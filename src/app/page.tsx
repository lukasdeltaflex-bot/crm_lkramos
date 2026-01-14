import { AppLayout } from '@/components/app-layout';
import { BirthdayAlerts } from '@/components/dashboard/birthday-alerts';
import { CommissionChart } from '@/components/dashboard/commission-chart';
import { RecentProposals } from '@/components/dashboard/recent-proposals';
import { StatsCard } from '@/components/dashboard/stats-card';
import { PageHeader } from '@/components/page-header';
import { proposals, customers } from '@/lib/data';
import {
  CircleDollarSign,
  FileText,
  Users,
  Clock,
} from 'lucide-react';

export default function DashboardPage() {
  const totalProposals = proposals.length;
  const totalCustomers = customers.length;
  
  const totalCommission = proposals
    .filter((p) => p.commissionPaid)
    .reduce((sum, p) => sum + p.commissionValue, 0);

  const pendingCommission = proposals
    .filter((p) => !p.commissionPaid)
    .reduce((sum, p) => sum + p.commissionValue, 0);

  return (
    <AppLayout>
      <PageHeader title="Dashboard" />
      <div className="space-y-8">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatsCard
            title="Total de Clientes"
            value={totalCustomers.toString()}
            icon={Users}
          />
          <StatsCard
            title="Total de Propostas"
            value={totalProposals.toString()}
            icon={FileText}
          />
          <StatsCard
            title="Comissão Recebida"
            value={new Intl.NumberFormat('pt-BR', {
              style: 'currency',
              currency: 'BRL',
            }).format(totalCommission)}
            icon={CircleDollarSign}
          />
          <StatsCard
            title="Comissão Pendente"
            value={new Intl.NumberFormat('pt-BR', {
              style: 'currency',
              currency: 'BRL',
            }).format(pendingCommission)}
            icon={Clock}
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
