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

type ProposalWithCustomer = Proposal & { customer: Customer };

export const columns: ColumnDef<ProposalWithCustomer>[] = [
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
    accessorKey: 'grossAmount',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Valor Bruto
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue('grossAmount'));
      return <div className="text-left font-medium">{formatCurrency(amount)}</div>;
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
          className={cn({
            'border-green-500 text-green-500': status === 'Pago' || status === 'Aprovado',
            'border-yellow-500 text-yellow-500': status === 'Em Andamento' || status === 'Aguardando Saldo',
            'border-red-500 text-red-500': status === 'Rejeitado',
          })}
        >
          {status}
        </Badge>
      );
    },
  },
  {
    accessorKey: 'commissionValue',
    header: 'Comissão',
    cell: ({ row }) => {
        const amount = parseFloat(row.getValue('commissionValue'));
        return formatCurrency(amount);
      },
  },
  {
    accessorKey: 'dateDigitized',
    header: 'Data Digitação',
    cell: ({ row }) => {
        const date = new Date(row.getValue('dateDigitized'))
        return new Intl.DateTimeFormat('pt-BR').format(date);
    }
  },
  {
    id: 'actions',
    cell: ({ row }) => {
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
              <DropdownMenuItem>Ver detalhes</DropdownMenuItem>
              <DropdownMenuItem>Editar</DropdownMenuItem>
              <DropdownMenuItem className="text-destructive focus:text-destructive focus:bg-destructive/10">
                Cancelar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      );
    },
  },
];
