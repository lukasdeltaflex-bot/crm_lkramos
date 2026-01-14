import { AppLayout } from '@/components/app-layout';
import { PageHeader } from '@/components/page-header';
import { customers } from '@/lib/data';
import { CustomerDataTable } from './data-table';
import { columns } from './columns';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';

export default function CustomersPage() {
  return (
    <AppLayout>
      <div className="flex items-center justify-between">
        <PageHeader title="Clientes" />
        <Button>
          <PlusCircle />
          Novo Cliente
        </Button>
      </div>
      <CustomerDataTable columns={columns} data={customers} />
    </AppLayout>
  );
}
