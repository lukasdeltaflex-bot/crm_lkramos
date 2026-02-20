'use client';

import { ColumnDef, flexRender, Header } from '@tanstack/react-table';
import type { Proposal, Customer, CommissionStatus, UserSettings } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, GripVertical, Copy, ArrowUp, ArrowDown } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { formatCurrency, cleanBankName, formatDateSafe, cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { TableHead } from '@/components/ui/table';
import { CommissionStatusCell } from './commission-status-cell';
import { StatusCell } from '@/app/proposals/status-cell';
import Link from 'next/link';
import { toast } from '@/hooks/use-toast';
import { BankIcon } from '@/components/bank-icon';

type ProposalWithCustomer = Proposal & { customer: Customer };

const CopyButton = ({ text, label }: { text: string | undefined; label: string }) => {
    if (!text) return null;
    const handleCopy = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        navigator.clipboard.writeText(text);
        toast({
            title: `${label} copiado!`,
            description: `O valor "${text}" foi copiado para a área de transferência.`,
        });
    };
    return (
        <Button variant="ghost" size="icon" className="h-7 w-7 opacity-40 hover:opacity-100 transition-opacity" onClick={handleCopy}>
            <Copy className="h-3.5 w-3.5" />
            <span className="sr-only">Copiar {label}</span>
        </Button>
    );
};

export const DraggableHeader = ({ header }: { header: Header<any, unknown>}) => {
    const isDraggable = header.column.getCanSort();
    const { attributes, listeners, setNodeRef, transform, isDragging } = useSortable({ 
        id: header.column.id,
        disabled: !isDraggable,
    });
    
    const style = {
        width: header.getSize(),
        transform: CSS.Transform.toString(transform),
        opacity: isDragging ? 0.5 : 1,
    };

    const isActions = header.column.id === 'Ações';
    const isSelect = header.column.id === 'Selecionar';

    return (
        <TableHead
            ref={setNodeRef}
            colSpan={header.colSpan}
            style={style}
            className={cn('relative p-0 h-14 transition-colors hover:bg-muted/50 border-b-2 border-zinc-200 dark:border-zinc-800')}
        >
            <div className="flex flex-col h-full justify-center">
                <div
                    className={cn(
                        'flex items-center gap-1 h-full px-2',
                        isDraggable && !isSelect && 'cursor-pointer select-none',
                        isActions && 'justify-end'
                    )}
                    onClick={isSelect ? undefined : header.column.getToggleSortingHandler()}
                >
                    {isDraggable && !isActions && !isSelect && (
                        <div
                            {...attributes}
                            {...listeners}
                            className="p-1 hover:bg-primary/10 rounded cursor-grab text-muted-foreground/40"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <GripVertical className="h-3.5 w-3.5" />
                        </div>
                    )}
                    <div className={cn(
                        "overflow-hidden font-black text-[12px] uppercase tracking-wider text-foreground leading-tight flex items-center gap-1",
                        isActions && "text-right pr-2",
                        isSelect && "justify-center w-full pr-0"
                    )}>
                        {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                        
                        {header.column.getIsSorted() && (
                            <div className="text-primary shrink-0 ml-1">
                                {header.column.getIsSorted() === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {header.column.getCanResize() && (
                <div
                    onMouseDown={header.getResizeHandler()}
                    onTouchStart={header.getResizeHandler()}
                    className={cn(
                        "absolute right-0 top-0 h-full w-1.5 cursor-col-resize select-none touch-none hover:bg-primary/40 z-20 transition-colors",
                        header.column.getIsResizing() ? "bg-primary" : "opacity-0 group-hover:opacity-100"
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
    id: 'Selecionar',
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && 'indeterminate')
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Selecionar tudo"
        className="rounded-full h-5 w-5 border-2 border-zinc-300"
        onClick={(e) => e.stopPropagation()}
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Selecionar linha"
        className="rounded-full h-5 w-5 border-2 border-zinc-300"
        onClick={(e) => e.stopPropagation()}
      />
    ),
    enableSorting: false,
    enableHiding: false,
    size: 50,
  },
  {
    id: 'Promotora',
    accessorKey: 'promoter',
    header: 'Promotora',
    cell: ({ row }) => <span className="text-sm font-bold text-foreground/90 w-full truncate block">{row.original.promoter}</span>,
    size: 150,
  },
  {
    id: 'Cliente',
    accessorFn: (row) => row.customer?.name,
    header: 'Cliente',
    cell: ({ row }) => <span className="font-black text-primary uppercase text-sm tracking-tight w-full truncate block">{row.original.customer?.name}</span>,
    size: 200,
  },
  {
    id: 'CPF',
    accessorFn: (row) => row.customer?.cpf,
    header: 'CPF',
    cell: ({ row }) => {
        const cpf = row.original.customer?.cpf;
        return (
            <div className="flex items-center gap-1 text-sm font-black text-foreground/80">
                <span>{cpf || '-'}</span>
                {cpf && <CopyButton text={cpf} label="CPF" />}
            </div>
        );
    },
    size: 150,
  },
  {
    id: 'Nº Proposta',
    accessorKey: 'proposalNumber',
    header: 'Nº Proposta',
    cell: ({ row }) => (
        <div className="flex items-center gap-1 text-sm font-black text-foreground/80">
            <Link href={`/proposals?open=${row.original.id}`} className="text-primary hover:underline font-black" onClick={(e) => e.stopPropagation()}>
                {row.original.proposalNumber}
            </Link>
            <CopyButton text={row.original.proposalNumber} label="Proposta" />
        </div>
    ),
    size: 150,
  },
  {
    id: 'Produto',
    accessorKey: 'product',
    header: 'Produto',
    cell: ({ row }) => <span className="text-sm font-bold text-foreground/80">{row.original.product}</span>,
    size: 120,
  },
  {
    id: 'Banco',
    accessorKey: 'bank',
    header: 'Banco',
    cell: ({ row, table }) => {
        const bankRaw = row.original.bank;
        const settings = (table.options.meta as any)?.userSettings as UserSettings;
        return (
            <div className="flex items-center gap-2">
                <BankIcon bankName={bankRaw} domain={settings?.bankDomains?.[bankRaw]} showLogo={settings?.showBankLogos ?? true} />
                <span className="truncate text-sm font-bold text-foreground/90 w-full block">{cleanBankName(bankRaw)}</span>
            </div>
        )
    },
    size: 150,
  },
  {
    id: 'Operador',
    accessorKey: 'operator',
    header: 'Operador',
    cell: ({ row }) => <span className="text-sm font-bold text-foreground/70 w-full truncate block">{row.original.operator || '-'}</span>,
    size: 150,
  },
  {
    id: 'Valor Bruto',
    accessorKey: 'grossAmount',
    header: () => <div className="text-right">Valor Bruto</div>,
    cell: ({ row, table }) => {
      const isPrivacyMode = (table.options.meta as {isPrivacyMode?: boolean})?.isPrivacyMode;
      if (isPrivacyMode) return <div className="text-left font-medium">•••••</div>;
      return <div className="text-right font-black text-sm text-foreground">{formatCurrency(row.original.grossAmount)}</div>;
    },
    size: 120,
  },
  {
    id: 'Comissão (%)',
    accessorKey: 'commissionPercentage',
    header: 'Comissão (%)',
    cell: ({ row }) => <span className="text-sm font-bold text-foreground/70">{row.original.commissionPercentage.toFixed(2)}%</span>,
    size: 100,
  },
  {
    id: 'Valor Comissão',
    accessorKey: 'commissionValue',
    header: 'Valor Comissão',
    cell: ({ row, table }) => {
        const isPrivacyMode = (table.options.meta as {isPrivacyMode?: boolean})?.isPrivacyMode;
        return isPrivacyMode ? '•••••' : <span className="text-sm font-black text-foreground">{formatCurrency(row.original.commissionValue)}</span>;
    },
    size: 120,
  },
  {
    id: 'Status Comissão',
    accessorKey: 'commissionStatus',
    header: 'Status Comissão',
    cell: ({ row }) => <CommissionStatusCell proposal={row.original} onStatusUpdate={onStatusUpdate} onEdit={onEdit} />,
    size: 140,
  },
  {
    id: 'Data Pagamento',
    accessorKey: 'commissionPaymentDate',
    header: 'Data Pagamento',
    cell: ({ row }) => <span className="text-sm font-bold text-foreground/70">{formatDateSafe(row.original.commissionPaymentDate)}</span>,
    size: 120,
  },
  {
    id: 'Status Proposta',
    accessorKey: 'status',
    header: 'Status Proposta',
    cell: ({ row }) => <div className="w-full"><StatusCell proposalId={row.original.id} currentStatus={row.original.status} /></div>,
    size: 140,
  },
  {
    id: 'Ações',
    header: '',
    cell: ({ row }) => (
        <div className="text-right print:hidden" onClick={(e) => e.stopPropagation()}>
            <Button variant="ghost" size="icon" className="rounded-full h-8 w-8 border border-transparent hover:border-border" onClick={() => onEdit(row.original)}>
                <MoreHorizontal className="h-4 w-4" />
            </Button>
        </div>
    ),
    enableHiding: false,
    size: 80,
  },
];