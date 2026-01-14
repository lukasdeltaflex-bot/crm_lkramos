'use client';

import { ColumnDef } from '@tanstack/react-table';
import type { Proposal, Customer } from '@/lib/types';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, ArrowUpDown } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/utils';
import { cn } from '@/lib/utils';
import React from 'react';

type ProposalWithCustomer = Proposal & { customer: Customer };

type ActionsCellProps = {
    row: {
      original: ProposalWithCustomer;
    };
    onEdit: (proposal: ProposalWithCustomer) => void;
    onView: (proposal: ProposalWithCustomer) => void;
};

const ActionsCell: React.FC<ActionsCellProps> = ({ row, onEdit, onView }) => {
    const proposal = row.original;
    return (
      <div className="text-right">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Abrir menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Ações</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => onView(proposal)}>Ver detalhes</DropdownMenuItem>
            <DropdownMenuItem onClick={() => onEdit(proposal)}>Editar</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive focus:text-destructive focus:bg-destructive/10">
              Cancelar
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    );
};

export const getColumns = (
    onEdit: (proposal: ProposalWithCustomer) => void,
    onView: (proposal: ProposalWithCustomer) => void
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
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Selecionar linha"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: 'proposalNumber',
    header: 'Proposta nº',
  },
  {
    accessorKey: 'customer.name',
    header: 'Cliente',
  },
  {
    accessorKey: 'product',
    header: 'Produto',
  },
  {
    accessorKey: 'operator',
    header: 'Operador',
  },
  {
    accessorKey: 'grossAmount',
    header: ({ column }) => {
      return (
        <div className="text-right">
            <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            >
            Valor Bruto
            <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
        </div>
      );
    },
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue('grossAmount'));
      return <div className="text-right font-medium">{formatCurrency(amount)}</div>;
    },
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => {
      const status = row.getValue('status') as string;
      return (
        <Badge
          variant="outline"
          className={cn('w-24 justify-center', {
            'border-green-500 text-green-500': status === 'Pago' || status === 'Saldo Pago',
            'border-yellow-500 text-yellow-500': status === 'Em Andamento',
            'border-blue-500 text-blue-500': status === 'Aguardando Saldo',
            'border-red-500 text-red-500': status === 'Rejeitado',
            'border-purple-500 text-purple-500': status === 'Pendente',
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
    accessorKey: 'commissionValue',
    header: () => <div className="text-right">Comissão</div>,
    cell: ({ row }) => {
        const amount = parseFloat(row.getValue('commissionValue'));
        return <div className="text-right">{formatCurrency(amount)}</div>;
      },
  },
  {
    accessorKey: 'dateDigitized',
    header: 'Data Digitação',
    cell: ({ row }) => {
        const date = new Date(row.getValue('dateDigitized'))
        // Adjust for timezone to show the correct date
        const adjustedDate = new Date(date.valueOf() + date.getTimezoneOffset() * 60 * 1000);
        return new Intl.DateTimeFormat('pt-BR').format(adjustedDate);
    }
  },
  {
    id: 'actions',
    cell: (props) => <ActionsCell {...props} onEdit={onEdit} onView={onView} />,
  },
];
