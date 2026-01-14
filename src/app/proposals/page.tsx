import { AppLayout } from '@/components/app-layout';
import { PageHeader } from '@/components/page-header';
import { getProposalsWithCustomerData } from '@/lib/data';
import { ProposalsDataTable } from './data-table';
import { columns } from './columns';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';

export default function ProposalsPage() {
  const proposals = getProposalsWithCustomerData();

  return (
    <AppLayout>
      <div className="flex items-center justify-between">
        <PageHeader title="Propostas" />
        <Button>
          <PlusCircle />
          Nova Proposta
        </Button>
      </div>
      <ProposalsDataTable columns={columns} data={proposals} />
    </AppLayout>
  );
}
