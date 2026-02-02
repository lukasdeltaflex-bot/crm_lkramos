'use client';

import { ColumnDef, flexRender, Header } from '@tanstack/react-table';
import type { Proposal, Customer, CommissionStatus } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { ArrowUpDown, MoreHorizontal, GripVertical, ArrowUp, ArrowDown } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { formatCurrency } from '@/lib/utils';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { format, isValid, isSameMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { TableHead } from '@/components/ui/table';
import { CommissionStatusCell } from './commission-status-cell';
import Link from 'next/link';
import type { DateRange } from 'react-day-picker';


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
          <DropdownMenuItem onSelect={() => onEdit(proposal)}>
            Editar Comissão
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export const DraggableHeader = ({ header }: { header: Header<any, unknown>}) => {
    const isDraggable = header.column.columnDef.enableColumnOrdering !== false;

    const { attributes, listeners, setNodeRef, transform, isDragging } = useSortable({ 
        id: header.column.id,
        disabled: !isDraggable,
    });
    
    const style = {
        width: header.getSize(),
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
                <button
                    {...attributes}
                    {...listeners}
                    className="p-1 -ml-2 cursor-grab disabled:cursor-default"
                    onClick={(e) => e.stopPropagation()}
                    disabled={!isDraggable}
                >
                    <GripVertical className={cn("h-4 w-4", !isDraggable && "opacity-30")} />
                </button>
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
                        'absolute right-0 top-0 z-10 h-full w-2.5 cursor-col-resize select-none touch-none bg-transparent transition-colors hover:bg-primary/50',
                        header.column.getIsResizing() && 'bg-primary'
                    )}
                />
            )}
        </TableHead>
    )
}

export const getColumns = (
  { onEdit, onStatusUpdate }: { 
    onEdit: (proposal: ProposalWithCustomer) => void;
    onStatusUpdate: (proposal: ProposalWithCustomer, newStatus: CommissionStatus) => void;
  }
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
    enableColumnOrdering: false,
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
    accessorKey: 'customer.cpf',
    header: 'CPF',
    id: 'customerCpf',
    cell: ({row}) => row.original.customer.cpf,
  },
  {
    accessorKey: 'proposalNumber',
    header: 'Nº Proposta',
    id: 'proposalNumber',
    cell: ({ row }) => {
        const proposal = row.original;
        return (
            <Link href={`/proposals?open=${proposal.id}`} className="text-primary hover:underline font-medium">
                {proposal.proposalNumber}
            </Link>
        )
    }
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
    header: () => <div className="text-right print:p-0 print:font-bold print:text-black">Valor Bruto</div>,
    cell: ({ row, table }) => {
      const isPrivacyMode = (table.options.meta as {isPrivacyMode?: boolean})?.isPrivacyMode;
      if (isPrivacyMode) return <div className="text-left font-medium">•••••</div>;
      const amount = parseFloat(row.getValue('grossAmount'));
      return <div className="text-right font-medium">{formatCurrency(amount)}</div>;
    },
    id: 'grossAmount',
  },
  {
    accessorKey: 'commissionPercentage',
    header: 'Comissão (%)',
    cell: ({ row, table }) => {
      const isPrivacyMode = (table.options.meta as {isPrivacyMode?: boolean})?.isPrivacyMode;
      if (isPrivacyMode) return '•••••';
      const percentage = parseFloat(row.getValue('commissionPercentage'));
      return `${percentage.toFixed(2)}%`;
    },
    id: 'commissionPercentage'
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
    id: 'commissionValue',
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
    id: 'amountPaid',
  },
  {
    accessorKey: 'commissionStatus',
    header: 'Status Comissão',
    cell: ({ row }) => {
      const proposal = row.original;
      return (
        <CommissionStatusCell 
            proposal={proposal} 
            onStatusUpdate={onStatusUpdate} 
            onEdit={onEdit} 
        />
      );
    },
    filterFn: (row, id, filterValue) => {
        const status = row.getValue(id) as string;
        const mainStatus = row.original.status;
        
        // Regra Ouro: Reprovadas e Canceladas nunca aparecem no financeiro
        if (mainStatus === 'Reprovado') return false;

        if (filterValue === '__CUSTOM_FILTER_TODOS__') {
            // Sempre mostra: Vazio, Pendente ou Parcial (qualquer período)
            if (!status || status === 'Pendente' || status === 'Parcial') return true;
            
            // Pagas: Somente do mês vigente
            if (status === 'Paga') {
                const paymentDateStr = row.original.commissionPaymentDate;
                if (!paymentDateStr) return false;
                const pDate = new Date(paymentDateStr);
                const now = new Date();
                return isSameMonth(pDate, now) && pDate.getFullYear() === now.getFullYear();
            }
            return false;
        }
        
        if (Array.isArray(filterValue)) {
            return filterValue.includes(status);
        }
        
        return status === filterValue;
    },
    id: 'commissionStatus',
  },
  {
    accessorKey: 'commissionPaymentDate',
    header: 'Data Pagamento',
    cell: ({ row }) => {
        const date = row.getValue('commissionPaymentDate') as string | undefined;
        if (!date) return '-';
        return format(new Date(date), "dd/MM/yyyy", { locale: ptBR });
    },
    filterFn: (row, id, filterValue: DateRange) => {
      if (!filterValue || !filterValue.from) {
        return true;
      }
      
      const cellValue = row.getValue(id) as string;
      if (!cellValue) {
        return false;
      }

      const cellDate = new Date(cellValue);
      if (!isValid(cellDate)) {
        return false;
      }

      const fromDate = filterValue.from;
      const toDate = filterValue.to ? new Date(filterValue.to) : new Date(filterValue.from);
      toDate.setHours(23, 59, 59, 999);

      return cellDate >= fromDate && cellDate <= toDate;
    },
    id: 'commissionPaymentDate',
  },
  {
    accessorKey: 'status',
    header: 'Status Proposta',
    id: 'status',
    enableHiding: true,
  },
  {
    id: 'actions',
    cell: (props) => <ActionsCell {...props} onEdit={onEdit} />,
    enableHiding: false,
    enableColumnOrdering: false,
    enableSorting: false,
  },
].map(column => ({ ...column, id: column.id || column.accessorKey as string}));
