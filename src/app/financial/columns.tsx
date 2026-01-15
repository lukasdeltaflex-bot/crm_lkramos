
'use client';

import { ColumnDef } from '@tanstack/react-table';
import type { Proposal, Customer } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { ArrowUpDown, MoreHorizontal } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/utils';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

type ProposalWithCustomer = Proposal & { customer: Customer };

interface ActionsCellProps {
  row: { original: ProposalWithCustomer };
  onEdit: (proposal: ProposalWithCustomer) => void;
}

const ActionsCell: React.FC<ActionsCellProps> = ({ row, onEdit }) => {
  const proposal = row.original;
  return (
    <div className="text-right print:hidden">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <span className="sr-only">Abrir menu</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Ações</DropdownMenuLabel>
          <DropdownMenuItem onClick={() => onEdit(proposal)}>
            Editar Comissão
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export const getColumns = (
  { onEdit }: { onEdit: (proposal: ProposalWithCustomer) => void; }
): ColumnDef<ProposalWithCustomer>[] => [
  {
    id: 'select',
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && 'indeterminate')
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Selecionar tudo"
        className="print:hidden"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Selecionar linha"
        className="print:hidden"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: 'promoter',
    header: 'Promotora',
    id: 'promotora'
  },
  {
    accessorKey: 'customer.name',
    header: 'Cliente',
    id: 'customerName',
  },
  {
    accessorKey: 'product',
    header: 'Produto',
    id: 'produto'
  },
  {
    accessorKey: 'bank',
    header: 'Banco',
    id: 'banco'
  },
  {
    accessorKey: 'grossAmount',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="print:p-0 print:font-bold print:text-black"
        >
          Valor Bruto
          <ArrowUpDown className="ml-2 h-4 w-4 print:hidden" />
        </Button>
      );
    },
    cell: ({ row, table }) => {
      const isPrivacyMode = (table.options.meta as {isPrivacyMode?: boolean})?.isPrivacyMode;
      if (isPrivacyMode) return <div className="text-left font-medium">•••••</div>;
      const amount = parseFloat(row.getValue('grossAmount'));
      return <div className="text-left font-medium">{formatCurrency(amount)}</div>;
    },
  },
  {
    accessorKey: 'customer.cpf',
    header: 'CPF',
    id: 'customerCpf',
    cell: ({row}) => row.original.customer.cpf,
    enableHiding: false, // This ensures the column data is available for filtering even if hidden
  },
  {
    accessorKey: 'commissionPercentage',
    header: 'Comissão (%)',
    cell: ({ row, table }) => {
      const isPrivacyMode = (table.options.meta as {isPrivacyMode?: boolean})?.isPrivacyMode;
      if (isPrivacyMode) return '•••••';
      const percentage = parseFloat(row.getValue('commissionPercentage'));
      return `${percentage.toFixed(2)}%`;
    }
  },
  {
    accessorKey: 'commissionValue',
    header: 'Valor Comissão',
    cell: ({ row, table }) => {
        const isPrivacyMode = (table.options.meta as {isPrivacyMode?: boolean})?.isPrivacyMode;
        if (isPrivacyMode) return '•••••';
        const amount = parseFloat(row.getValue('commissionValue'));
        return formatCurrency(amount);
      },
  },
  {
    accessorKey: 'amountPaid',
    header: 'Valor Pago',
    cell: ({ row, table }) => {
      const isPrivacyMode = (table.options.meta as {isPrivacyMode?: boolean})?.isPrivacyMode;
      if (isPrivacyMode) return '•••••';
      const amount = parseFloat(row.getValue('amountPaid') || '0');
      return formatCurrency(amount);
    },
  },
  {
    accessorKey: 'commissionStatus',
    header: 'Status Comissão',
    cell: ({ row }) => {
      const status = row.getValue('commissionStatus') as string;
      return (
        <Badge
          variant="outline"
          className={cn('print:border-gray-400 print:text-black', {
            'border-green-500 text-green-500': status === 'Paga',
            'border-yellow-500 text-yellow-500': status === 'Pendente',
            'border-orange-500 text-orange-500': status === 'Parcial',
          })}
        >
          {status}
        </Badge>
      );
    },
    filterFn: (row, id, value) => {
        return value.includes(row.getValue(id))
    }
  },
  {
    accessorKey: 'commissionPaymentDate',
    header: 'Data Pagamento',
    cell: ({ row }) => {
        const date = row.getValue('commissionPaymentDate') as string | undefined;
        if (!date) return '-';
        return format(new Date(date), "dd/MM/yyyy", { locale: ptBR });
    }
  },
  {
    id: 'actions',
    cell: (props) => <ActionsCell {...props} onEdit={onEdit} />,
    enableHiding: false,
  },
];
