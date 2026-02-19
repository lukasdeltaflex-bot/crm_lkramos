
'use client';

import { ColumnDef, Header, flexRender } from '@tanstack/react-table';
import type { Proposal, ProposalStatus, UserSettings } from '@/lib/types';
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
} from "@/components/ui/alert-dialog"
import { MoreHorizontal, GripVertical, ArrowUp, ArrowDown, Copy } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { formatCurrency, cleanBankName, cn } from '@/lib/utils';
import React from 'react';
import { StatusCell } from './status-cell';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { TableHead } from '@/components/ui/table';
import { toast } from '@/hooks/use-toast';
import { BankIcon } from '@/components/bank-icon';

const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return '-';
        return format(date, "dd/MM/yyyy", { locale: ptBR });
    } catch (e) {
        return '-';
    }
}

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
}

const ActionsCell = ({ row, onEdit, onView, onDelete, onDuplicate }: any) => {
    const proposal = row.original;
    return (
      <div className="text-right" onClick={(e) => e.stopPropagation()}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0 hover:bg-muted transition-colors">
              <span className="sr-only">Abrir menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Ações</DropdownMenuLabel>
            <DropdownMenuItem onSelect={() => onView(proposal)}>Ver detalhes</DropdownMenuItem>
            <DropdownMenuItem onSelect={() => onEdit(proposal)}>Editar</DropdownMenuItem>
            <DropdownMenuItem onSelect={() => onDuplicate(proposal)}>Duplicar</DropdownMenuItem>
            <DropdownMenuSeparator />
            <AlertDialog>
                <DropdownMenuItem 
                    onSelect={(e) => e.preventDefault()}
                    className="text-destructive focus:text-destructive focus:bg-destructive/10"
                    >
                    Cancelar
                </DropdownMenuItem>
            </AlertDialog>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
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
            className={cn('relative p-0 h-12 border-r last:border-r-0 bg-muted/20')}
        >
            <div
                className={cn(
                    'flex items-center gap-1 h-full px-4',
                    isDraggable && 'cursor-pointer select-none'
                )}
                onClick={header.column.getToggleSortingHandler()}
            >
                 <button
                    {...attributes}
                    {...listeners}
                    className="p-1 -ml-2 cursor-grab"
                    onClick={(e) => e.stopPropagation()}
                >
                    <GripVertical className="h-4 w-4 opacity-30" />
                </button>
                <div className="flex-1 overflow-hidden font-bold text-[11px] uppercase tracking-wider text-muted-foreground">
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
    onEdit: any,
    onView: any,
    onDelete: any,
    onStatusChange: any,
    onDuplicate: any
    ): ColumnDef<Proposal & { customer: any }>[] => [
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
        className="rounded-full"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Selecionar linha"
        className="rounded-full"
      />
    ),
    enableSorting: false,
    enableHiding: false,
    size: 50,
  },
  {
    id: 'Promotora',
    accessorKey: 'promoter',
    cell: ({ row, table }) => {
        const promoter = row.original.promoter;
        const settings = (table.options.meta as any)?.userSettings as UserSettings;
        const showLogos = settings?.showPromoterLogos ?? true;
        const domain = settings?.promoterDomains?.[promoter];

        return (
            <div className="flex items-center gap-2">
                <BankIcon bankName={promoter} domain={domain} showLogo={showLogos} className="h-4 w-4" />
                <span className="truncate">{promoter}</span>
            </div>
        )
    },
    size: 150,
  },
  {
    id: 'Nº Proposta',
    accessorKey: 'proposalNumber',
    cell: ({ row }) => {
        const num = row.original.proposalNumber;
        return (
            <div className="flex items-center gap-1">
                <span>{num}</span>
                <CopyButton text={num} label="Proposta" />
            </div>
        )
    },
    size: 150,
  },
  {
    id: 'Cliente',
    accessorFn: (row) => row.customer?.name,
    cell: ({ row }) => (
        <div className="flex items-center gap-2 font-medium">
            {row.original.customer?.name || '---'}
        </div>
    ),
    size: 200,
  },
  {
    id: 'Produto',
    accessorKey: 'product',
    size: 120,
  },
  {
    id: 'Valor Bruto',
    header: () => <div className="text-right">Valor Bruto</div>,
    cell: ({ row }) => <div className="text-right font-medium">{formatCurrency(row.original.grossAmount)}</div>,
    size: 120,
  },
  {
    id: 'Banco',
    accessorKey: 'bank',
    cell: ({ row, table }) => {
        const bankRaw = row.original.bank;
        const settings = (table.options.meta as any)?.userSettings as UserSettings;
        const showLogos = settings?.showBankLogos ?? true;
        const customDomain = settings?.bankDomains?.[bankRaw];
        
        return (
            <div className="flex items-center gap-2">
                <BankIcon bankName={bankRaw} domain={customDomain} showLogo={showLogos} />
                <span className="truncate">{cleanBankName(bankRaw)}</span>
            </div>
        )
    },
    size: 150,
  },
  {
    id: 'Status',
    header: 'Status',
    cell: ({ row }) => (
        <div className="w-full">
            <StatusCell
                proposalId={row.original.id}
                currentStatus={row.original.status}
                product={row.original.product}
                onStatusChange={onStatusChange}
            />
        </div>
    ),
    size: 140,
  },
  {
    id: 'Data Digitação',
    accessorKey: 'dateDigitized',
    cell: ({ row }) => formatDate(row.original.dateDigitized),
    size: 120,
  },
  {
    id: 'Ações',
    cell: (props) => <ActionsCell {...props} onEdit={onEdit} onView={onView} onDelete={onDelete} onDuplicate={onDuplicate} />,
    enableHiding: false,
    size: 80,
  },
].map(column => ({ ...column, id: column.id || column.accessorKey as string}));
