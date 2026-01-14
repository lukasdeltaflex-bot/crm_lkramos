'use client';

import { ColumnDef } from '@tanstack/react-table';
import type { Proposal, ProposalStatus } from '@/lib/types';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
  } from "@/components/ui/alert-dialog"
import { MoreHorizontal, ArrowUpDown } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { formatCurrency } from '@/lib/utils';
import React from 'react';
import { StatusCell } from './status-cell';
import { type ProposalWithCustomer } from './page';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

type ActionsCellProps = {
    row: {
      original: ProposalWithCustomer;
    };
    onEdit: (proposal: ProposalWithCustomer) => void;
    onView: (proposal: ProposalWithCustomer) => void;
    onDelete: (proposalId: string) => void;
};

const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    try {
        const date = new Date(dateString);
        // Check if date is valid
        if (isNaN(date.getTime())) return '-';
        return format(date, "dd/MM/yyyy", { locale: ptBR });
    } catch (e) {
        return '-';
    }
}


const ActionsCell: React.FC<ActionsCellProps> = ({ row, onEdit, onView, onDelete }) => {
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
            <AlertDialog>
                <AlertDialogTrigger asChild>
                    <DropdownMenuItem 
                        onSelect={(e) => e.preventDefault()}
                        className="text-destructive focus:text-destructive focus:bg-destructive/10"
                        >
                        Cancelar
                    </DropdownMenuItem>
                </AlertDialogTrigger>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Essa ação não pode ser desfeita. A proposta nº {proposal.proposalNumber} será cancelada permanentemente.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Voltar</AlertDialogCancel>
                        <AlertDialogAction onClick={() => onDelete(proposal.id)}>Cancelar Proposta</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    );
};

export const getColumns = (
    onEdit: (proposal: ProposalWithCustomer) => void,
    onView: (proposal: ProposalWithCustomer) => void,
    onDelete: (proposalId: string) => void,
    onStatusChange: (proposalId: string, newStatus: ProposalStatus) => void
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
    id: 'customerName',
    accessorFn: (row) => row.customer?.name,
    header: 'Cliente',
    cell: ({ row }) => {
        return row.original.customer?.name || <span className="text-muted-foreground">Cliente não encontrado</span>
    }
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
      const proposal = row.original;
      return (
        <StatusCell
          proposalId={proposal.id}
          currentStatus={proposal.status}
          onStatusChange={onStatusChange}
        />
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
    cell: ({ row }) => formatDate(row.getValue('dateDigitized'))
  },
  {
    accessorKey: 'dateApproved',
    header: 'Data Averbação',
    cell: ({ row }) => formatDate(row.getValue('dateApproved'))
  },
  {
    accessorKey: 'datePaidToClient',
    header: 'Data Pgto. Cliente',
    cell: ({ row }) => formatDate(row.getValue('datePaidToClient'))
  },
  {
    accessorKey: 'debtBalanceArrivalDate',
    header: 'Chegada Saldo',
    cell: ({ row }) => formatDate(row.getValue('debtBalanceArrivalDate'))
  },
  {
    id: 'actions',
    cell: (props) => <ActionsCell {...props} onEdit={onEdit} onView={onView} onDelete={onDelete} />,
  },
];
