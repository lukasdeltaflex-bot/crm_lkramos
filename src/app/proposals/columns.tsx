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
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { MoreHorizontal, GripVertical, ArrowUp, ArrowDown, Copy } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { formatCurrency, cleanBankName, cn, formatDateSafe } from '@/lib/utils';
import React from 'react';
import { StatusCell } from './status-cell';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { TableHead } from '@/components/ui/table';
import { toast } from '@/hooks/use-toast';
import { BankIcon } from '@/components/bank-icon';
import Link from 'next/link';

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
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleCopy}>
            <Copy className="h-3.5 w-3.5" />
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
            <Button variant="ghost" className="h-8 w-8 p-0 hover:bg-muted transition-colors rounded-full">
              <span className="sr-only">Abrir menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel>Ações da Proposta</DropdownMenuLabel>
            <DropdownMenuItem onSelect={() => onView(proposal)}>Ver detalhes</DropdownMenuItem>
            <DropdownMenuItem onSelect={() => onEdit(proposal)}>Editar Registro</DropdownMenuItem>
            <DropdownMenuItem onSelect={() => onDuplicate(proposal)}>Duplicar Proposta</DropdownMenuItem>
            <DropdownMenuSeparator />
            <AlertDialog>
                <AlertDialogTrigger asChild>
                    <DropdownMenuItem 
                        onSelect={(e) => e.preventDefault()}
                        className="text-destructive focus:text-destructive focus:bg-destructive/10"
                        >
                        Cancelar Proposta
                    </DropdownMenuItem>
                </AlertDialogTrigger>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Cancelar proposta?</AlertDialogTitle>
                        <AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Voltar</AlertDialogCancel>
                        <AlertDialogAction onClick={() => onDelete(proposal.id)}>Confirmar</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
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

    const isActions = header.column.id === 'Ações';
    const isSelect = header.column.id === 'Selecionar';

    return (
        <TableHead
            ref={setNodeRef}
            colSpan={header.colSpan}
            style={style}
            className={cn('relative p-0 h-14 border-r last:border-r-0 bg-muted/30 group transition-colors hover:bg-muted/50')}
        >
            <div className="flex flex-col h-full justify-center">
                <div
                    className={cn(
                        'flex items-center gap-2 h-full px-3',
                        isDraggable && 'cursor-pointer select-none',
                        isActions && 'justify-end'
                    )}
                    onClick={header.column.getToggleSortingHandler()}
                >
                    {isDraggable && !isActions && !isSelect && (
                        <div
                            {...attributes}
                            {...listeners}
                            className="p-1 hover:bg-primary/10 rounded cursor-grab text-muted-foreground/40"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <GripVertical className="h-4 w-4" />
                        </div>
                    )}
                    <div className={cn(
                        "overflow-hidden font-black text-[11px] uppercase tracking-wider text-muted-foreground leading-tight flex items-center gap-1.5",
                        isActions && "text-right pr-2",
                        isSelect && "justify-center w-full pr-0"
                    )}>
                        {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                        
                        {header.column.getIsSorted() && (
                            <div className="text-primary shrink-0">
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
                        header.column.getIsResizing() ? "bg-primary w-1" : "opacity-0 group-hover:opacity-100"
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
        className="rounded-full h-5 w-5"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Selecionar linha"
        className="rounded-full h-5 w-5"
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
    cell: ({ row, table }) => {
        const promoter = row.original.promoter;
        const settings = (table.options.meta as any)?.userSettings as UserSettings;
        const showLogos = settings?.showPromoterLogos ?? true;
        const domain = settings?.promoterDomains?.[promoter];

        return (
            <div className="flex items-center gap-2">
                <BankIcon bankName={promoter} domain={domain} showLogo={showLogos} className="h-4 w-4" />
                <span className="truncate text-xs font-medium">{promoter}</span>
            </div>
        )
    },
    size: 150,
  },
  {
    id: 'Nº Proposta',
    accessorKey: 'proposalNumber',
    header: 'Nº Proposta',
    cell: ({ row }) => {
        const num = row.original.proposalNumber;
        return (
            <div className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
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
    header: 'Cliente',
    cell: ({ row }) => (
        <div className="flex items-center gap-2 font-bold text-primary uppercase text-xs tracking-tight">
            {row.original.customer?.name || '---'}
        </div>
    ),
    size: 200,
  },
  {
    id: 'Produto',
    accessorKey: 'product',
    header: 'Produto',
    cell: ({ row }) => <span className="text-xs font-medium">{row.original.product}</span>,
    size: 120,
  },
  {
    id: 'Valor Bruto',
    accessorKey: 'grossAmount',
    header: () => <div className="text-right">Valor Bruto</div>,
    cell: ({ row }) => <div className="text-right font-bold text-xs">{formatCurrency(row.original.grossAmount)}</div>,
    size: 120,
  },
  {
    id: 'Banco',
    accessorKey: 'bank',
    header: 'Banco',
    cell: ({ row, table }) => {
        const bankRaw = row.original.bank;
        const settings = (table.options.meta as any)?.userSettings as UserSettings;
        const showLogos = settings?.showBankLogos ?? true;
        const customDomain = settings?.bankDomains?.[bankRaw];
        
        return (
            <div className="flex items-center gap-2">
                <BankIcon bankName={bankRaw} domain={customDomain} showLogo={showLogos} />
                <span className="truncate text-xs font-medium">{cleanBankName(bankRaw)}</span>
            </div>
        )
    },
    size: 150,
  },
  {
    id: 'Status',
    accessorKey: 'status',
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
    header: 'Data Digitação',
    cell: ({ row }) => <span className="text-xs font-medium">{formatDateSafe(row.original.dateDigitized)}</span>,
    size: 120,
  },
  {
    id: 'Ações',
    header: '',
    cell: (props) => <ActionsCell {...props} onEdit={onEdit} onView={onView} onDelete={onDelete} onDuplicate={onDuplicate} />,
    enableHiding: false,
    size: 80,
  },
];
