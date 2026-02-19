
'use client';

import { ColumnDef, flexRender, Header } from '@tanstack/react-table';
import type { Proposal, Customer, CommissionStatus, UserSettings } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, GripVertical, Copy } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { formatCurrency, cleanBankName, formatDateSafe } from '@/lib/utils';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
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
        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleCopy}>
            <Copy className="h-3 w-3" />
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

    return (
        <TableHead
            ref={setNodeRef}
            colSpan={header.colSpan}
            style={style}
            className={cn('relative p-0 h-12 border-r last:border-r-0')}
        >
            <div className="flex items-center gap-1 h-full px-4">
                <button
                    {...attributes}
                    {...listeners}
                    className="p-1 -ml-2 cursor-grab"
                    onClick={(e) => e.stopPropagation()}
                >
                    <GripVertical className="h-4 w-4 opacity-30" />
                </button>
                <div className="flex-1 overflow-hidden">
                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                </div>
            </div>

            {/* RESIZER HANDLE */}
            {header.column.getCanResize() && (
                <div
                    onMouseDown={header.getResizeHandler()}
                    onTouchStart={header.getResizeHandler()}
                    className={cn(
                        "absolute right-0 top-0 h-full w-1 cursor-col-resize select-none touch-none hover:bg-primary/30 z-10",
                        header.column.getIsResizing() ? "bg-primary opacity-100" : "opacity-0"
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
    id: 'selecionar',
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
    size: 40,
  },
  {
    id: 'Promotora',
    accessorFn: (row) => row.promoter,
    header: 'Promotora',
    size: 150,
  },
  {
    id: 'Cliente',
    accessorFn: (row) => row.customer?.name,
    header: 'Cliente',
    size: 200,
  },
  {
    id: 'CPF',
    accessorFn: (row) => row.customer?.cpf,
    header: 'CPF',
    cell: ({ row }) => {
        const cpf = row.original.customer?.cpf;
        return (
            <div className="flex items-center gap-1">
                <span>{cpf || '-'}</span>
                {cpf && <CopyButton text={cpf} label="CPF" />}
            </div>
        );
    },
    size: 150,
  },
  {
    id: 'Nº Proposta',
    accessorFn: (row) => row.proposalNumber,
    header: 'Nº Proposta',
    cell: ({ row }) => (
        <div className="flex items-center gap-1">
            <Link href={`/proposals?open=${row.original.id}`} className="text-primary hover:underline font-medium">
                {row.original.proposalNumber}
            </Link>
            <CopyButton text={row.original.proposalNumber} label="Proposta" />
        </div>
    ),
    size: 150,
  },
  {
    id: 'Produto',
    accessorFn: (row) => row.product,
    header: 'Produto',
    size: 120,
  },
  {
    id: 'Banco',
    accessorFn: (row) => row.bank,
    header: 'Banco',
    cell: ({ row, table }) => {
        const bankRaw = row.original.bank;
        const settings = (table.options.meta as any)?.userSettings as UserSettings;
        return (
            <div className="flex items-center gap-2">
                <BankIcon bankName={bankRaw} domain={settings?.bankDomains?.[bankRaw]} showLogo={settings?.showBankLogos ?? true} />
                <span className="truncate">{cleanBankName(bankRaw)}</span>
            </div>
        )
    },
    size: 150,
  },
  {
    id: 'Valor Bruto',
    accessorFn: (row) => row.grossAmount,
    header: () => <div className="text-right">Valor Bruto</div>,
    cell: ({ row, table }) => {
      const isPrivacyMode = (table.options.meta as {isPrivacyMode?: boolean})?.isPrivacyMode;
      if (isPrivacyMode) return <div className="text-left font-medium">•••••</div>;
      return <div className="text-right font-medium">{formatCurrency(row.original.grossAmount)}</div>;
    },
    size: 120,
  },
  {
    id: 'Comissão (%)',
    accessorFn: (row) => row.commissionPercentage,
    header: 'Comissão (%)',
    cell: ({ row }) => `${row.original.commissionPercentage.toFixed(2)}%`,
    size: 100,
  },
  {
    id: 'Valor Comissão',
    accessorFn: (row) => row.commissionValue,
    header: 'Valor Comissão',
    cell: ({ row, table }) => {
        const isPrivacyMode = (table.options.meta as {isPrivacyMode?: boolean})?.isPrivacyMode;
        return isPrivacyMode ? '•••••' : formatCurrency(row.original.commissionValue);
    },
    size: 120,
  },
  {
    id: 'Status Comissão',
    accessorFn: (row) => row.commissionStatus,
    header: 'Status Comissão',
    cell: ({ row }) => <CommissionStatusCell proposal={row.original} onStatusUpdate={onStatusUpdate} onEdit={onEdit} />,
    size: 140,
  },
  {
    id: 'Data Pagamento',
    accessorFn: (row) => row.commissionPaymentDate,
    header: 'Data Pagamento',
    cell: ({ row }) => formatDateSafe(row.original.commissionPaymentDate),
    size: 120,
  },
  {
    id: 'Status Proposta',
    header: 'Status Proposta',
    cell: ({ row }) => <div className="w-full"><StatusCell proposalId={row.original.id} currentStatus={row.original.status} /></div>,
    size: 140,
  },
  {
    id: 'Ações',
    cell: ({ row }) => (
        <div className="text-right print:hidden">
            <DropdownMenu>
                <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuItem onSelect={() => onEdit(row.original)}>Editar Comissão</DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    ),
    enableHiding: false,
    size: 80,
  },
].map(column => ({ ...column, id: column.id || (column as any).accessorKey }));
