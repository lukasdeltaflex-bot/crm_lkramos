'use client';

import { ColumnDef, Header, Table } from '@tanstack/react-table';
import type { Proposal, ProposalStatus } from '@/lib/types';
import { Button, buttonVariants } from '@/components/ui/button';
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
import { MoreHorizontal, ArrowUpDown, GripVertical, ArrowUp, ArrowDown } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { formatCurrency } from '@/lib/utils';
import React from 'react';
import { StatusCell } from './status-cell';
import { type ProposalWithCustomer } from './page';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { TableHead, TableCell } from '@/components/ui/table';
import { flexRender } from '@tanstack/react-table';

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
            <DropdownMenuItem onSelect={() => onView(proposal)}>Ver detalhes</DropdownMenuItem>
            <DropdownMenuItem onSelect={() => onEdit(proposal)}>Editar</DropdownMenuItem>
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

const DraggableHeader = ({ header }: { header: Header<any, unknown>}) => {
    const { attributes, listeners, setNodeRef, transform, isDragging } = useSortable({
        id: header.column.id,
        disabled: header.column.columnDef.enableColumnOrdering === false,
    });
    
    const style = {
        ...header.column.getCanResize() && {
            width: header.getSize(),
        },
        transform: CSS.Transform.toString(transform),
        opacity: isDragging ? 0.5 : 1,
    };

    return (
        <TableHead
            ref={setNodeRef}
            colSpan={header.colSpan}
            style={style}
            className={cn('relative p-0 h-12')}
        >
            <div
                className={cn(
                    'flex items-center gap-1 h-full px-4',
                    header.column.getCanSort() && 'cursor-pointer select-none'
                )}
                onClick={header.column.getToggleSortingHandler()}
            >
                {header.column.columnDef.enableColumnOrdering !== false ? (
                    <button
                        {...attributes}
                        {...listeners}
                        className="cursor-grab p-1 -ml-2"
                        onClick={e => e.stopPropagation()}
                    >
                        <GripVertical className="h-4 w-4" />
                    </button>
                ) : (
                    <div className='w-6 p-1 -ml-2' /> // Placeholder to maintain alignment
                )}
                <div className="flex-1">
                    {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                        )}
                </div>
                 {header.column.getCanSort() && (
                    <div className="ml-1">
                        {header.column.getIsSorted() === 'asc' ? <ArrowUp className="h-4 w-4" /> : header.column.getIsSorted() === 'desc' ? <ArrowDown className="h-4 w-4" /> : <ArrowUpDown className="h-4 w-4 text-muted-foreground/50" />}
                    </div>
                )}
            </div>
            {header.column.getCanResize() && (
                <div
                    onMouseDown={header.getResizeHandler()}
                    onTouchStart={header.getResizeHandler()}
                    className={cn(
                        'absolute right-0 top-0 h-full w-px cursor-col-resize select-none touch-none bg-border/50 hover:bg-border',
                        header.column.getIsResizing() && 'bg-primary w-0.5'
                    )}
                />
            )}
        </TableHead>
    )
}

export const getColumns = (
    onEdit: (proposal: ProposalWithCustomer) => void,
    onView: (proposal: ProposalWithCustomer) => void,
    onDelete: (proposalId: string) => void,
    onStatusChange: (proposalId: string, newStatus: ProposalStatus) => void
    ): ColumnDef<ProposalWithCustomer>[] => [
  {
    accessorKey: 'bank',
    id: 'bank_digitado',
    header: 'Banco Digitado',
  },
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
    enableColumnOrdering: false,
  },
  {
    accessorKey: 'promoter',
    id: 'promoter',
    header: 'Promotora',
  },
  {
    accessorKey: 'proposalNumber',
    id: 'proposalNumber',
    header: 'Nº Proposta',
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
    id: 'customerCpf',
    accessorFn: (row) => row.customer?.cpf,
    header: 'CPF',
    cell: ({ row }) => {
        return row.original.customer?.cpf || <span className="text-muted-foreground">-</span>
    }
  },
  {
    accessorKey: 'product',
    id: 'product',
    header: 'Produto',
  },
  {
    accessorKey: 'operator',
    id: 'operator',
    header: 'Operador',
  },
  {
    accessorKey: 'grossAmount',
    id: 'grossAmount',
    header: () => <div className="text-right">Valor Bruto</div>,
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue('grossAmount'));
      return <div className="text-right font-medium">{formatCurrency(amount)}</div>;
    },
  },
  {
    accessorKey: 'status',
    id: 'status',
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
    id: 'commissionValue',
    header: () => <div className="text-right">Comissão</div>,
    cell: ({ row }) => {
        const amount = parseFloat(row.getValue('commissionValue'));
        return <div className="text-right">{formatCurrency(amount)}</div>;
      },
  },
  {
    accessorKey: 'dateDigitized',
    id: 'dateDigitized',
    header: 'Data Digitação',
    cell: ({ row }) => formatDate(row.getValue('dateDigitized'))
  },
  {
    accessorKey: 'dateApproved',
    id: 'dateApproved',
    header: 'Data Averbação',
    cell: ({ row }) => formatDate(row.getValue('dateApproved'))
  },
  {
    accessorKey: 'datePaidToClient',
    id: 'datePaidToClient',
    header: 'Data Pgto. Cliente',
    cell: ({ row }) => formatDate(row.getValue('datePaidToClient'))
  },
  {
    accessorKey: 'debtBalanceArrivalDate',
    id: 'debtBalanceArrivalDate',
    header: 'Chegada Saldo',
    cell: ({ row }) => formatDate(row.getValue('debtBalanceArrivalDate'))
  },
  {
    id: 'actions',
    cell: (props) => <ActionsCell {...props} onEdit={onEdit} onView={onView} onDelete={onDelete} />,
    enableColumnOrdering: false,
    enableSorting: false,
  },
].map(column => ({ ...column, id: column.id || column.accessorKey as string}));

export { DraggableHeader };
