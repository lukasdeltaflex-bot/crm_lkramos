'use client';

import { ColumnDef, Header, flexRender } from '@tanstack/react-table';
import type { Proposal, UserSettings } from '@/lib/types';
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
import { MoreHorizontal, GripVertical, ArrowUp, ArrowDown, Copy, AlertTriangle, AlertCircle } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { formatCurrency, cleanBankName, cn, formatDateSafe, isWhatsApp, getWhatsAppUrl, calculateBusinessDays } from '@/lib/utils';
import React from 'react';
import { StatusCell } from './status-cell';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { TableHead } from '@/components/ui/table';
import { toast } from '@/hooks/use-toast';
import { BankIcon } from '@/components/bank-icon';
import { WhatsAppIcon } from '@/components/icons/whatsapp-icon';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

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
}

const ActionsCell = ({ row, onEdit, onView, onDelete, onDuplicate }: any) => {
    const proposal = row.original;
    return (
      <div className="text-right" onClick={(e) => e.stopPropagation()}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0 hover:bg-muted transition-colors rounded-full border border-transparent hover:border-border">
              <span className="sr-only">Abrir menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 shadow-xl border-2">
            <DropdownMenuLabel>Opções da Proposta</DropdownMenuLabel>
            <DropdownMenuItem onSelect={() => onView(proposal)} className="font-bold">Ver detalhes</DropdownMenuItem>
            <DropdownMenuItem onSelect={() => onEdit(proposal)} className="font-bold">Editar Registro</DropdownMenuItem>
            <DropdownMenuItem onSelect={() => onDuplicate(proposal)} className="font-bold">Duplicar Proposta</DropdownMenuItem>
            <DropdownMenuSeparator />
            <AlertDialog>
                <DropdownMenuItem 
                    onSelect={(e) => e.preventDefault()}
                    className="text-destructive focus:text-destructive focus:bg-destructive/10 font-bold"
                    >
                    Remover Registro
                </DropdownMenuItem>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                        <AlertDialogDescription>Esta ação irá excluir permanentemente a proposta do sistema.</AlertDialogDescription>
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

    const isActions = header.column.id === 'Actions';
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
        className="rounded-full h-5 w-5 border-2 border-zinc-300"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Selecionar linha"
        className="rounded-full h-5 w-5 border-2 border-zinc-300"
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
            <div className="flex items-center gap-2 w-full">
                <BankIcon bankName={promoter} domain={domain} showLogo={showLogos} className="h-4 w-4" />
                <span className="truncate text-sm font-bold text-foreground/90 flex-1">{promoter}</span>
            </div>
        )
    },
    size: 150,
  },
  {
    id: 'N° PROPOSTA',
    accessorKey: 'proposalNumber',
    header: 'N° PROPOSTA',
    cell: ({ row }) => {
        const num = row.original.proposalNumber;
        return (
            <div className="flex items-center gap-1 text-sm font-black text-foreground/80">
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
    cell: ({ row }) => {
        const customer = row.original.customer;
        const hasWhatsApp = customer?.phone && isWhatsApp(customer.phone);
        return (
            <div className="flex items-center gap-2 font-black text-primary uppercase text-sm tracking-tight w-full">
                <span className="truncate flex-1 block w-full">{customer?.name || '---'}</span>
                {hasWhatsApp && (
                    <a 
                        href={getWhatsAppUrl(customer.phone)} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-green-600 hover:text-green-700 transition-colors shrink-0"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <WhatsAppIcon className="h-3.5 w-3.5" />
                    </a>
                )}
            </div>
        )
    },
    size: 220,
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
    size: 160,
  },
  {
    id: 'Produto',
    accessorKey: 'product',
    header: 'Produto',
    cell: ({ row }) => <span className="text-sm font-bold text-foreground/80">{row.original.product}</span>,
    size: 120,
  },
  {
    id: 'Valor Bruto',
    accessorKey: 'grossAmount',
    header: () => <div className="text-right">Valor Bruto</div>,
    cell: ({ row }) => <div className="text-right font-black text-sm text-foreground">{formatCurrency(row.original.grossAmount)}</div>,
    size: 120,
  },
  {
    id: 'Banco Digitado',
    accessorKey: 'bank',
    header: 'Banco Digitado',
    cell: ({ row, table }) => {
        const bankRaw = row.original.bank;
        const settings = (table.options.meta as any)?.userSettings as UserSettings;
        const showLogos = settings?.showBankLogos ?? true;
        const customDomain = settings?.bankDomains?.[bankRaw];
        
        return (
            <div className="flex items-center gap-2 w-full">
                <BankIcon bankName={bankRaw} domain={customDomain} showLogo={showLogos} />
                <span className="truncate text-sm font-bold text-foreground/90 flex-1 block w-full">{cleanBankName(bankRaw)}</span>
            </div>
        )
    },
    size: 150,
  },
  {
    id: 'Status',
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => {
        const p = row.original;
        
        // Lógica de Alerta Crítico Visual
        const referenceDate = p.statusAwaitingBalanceAt || p.statusUpdatedAt || p.dateDigitized;
        const bizDays = referenceDate ? calculateBusinessDays(referenceDate) : 0;
        
        let isCritical = false;
        let limit = 0;

        if (p.status === 'Pendente') {
            limit = 2;
            isCritical = bizDays >= limit;
        } else if (p.status === 'Aguardando Saldo' && p.product === 'Portabilidade') {
            limit = 5;
            isCritical = bizDays >= limit;
        } else if (p.status === 'Em Andamento') {
            limit = 5;
            isCritical = bizDays >= limit;
        }

        return (
            <div className="flex items-center gap-2 w-full">
                <div className="flex-1">
                    <StatusCell
                        proposalId={p.id}
                        currentStatus={p.status}
                        product={p.product}
                        onStatusChange={onStatusChange}
                    />
                </div>
                {isCritical && (
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <div className="shrink-0 h-6 w-6 rounded-full bg-red-500/15 border border-red-500/40 flex items-center justify-center text-red-600 shadow-[0_0_12px_rgba(239,68,68,0.4)] animate-alert-pulse cursor-help">
                                    <AlertTriangle className="h-3.5 w-3.5 fill-current" />
                                </div>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="bg-white text-zinc-950 border-2 border-red-500 shadow-2xl p-4 rounded-2xl min-w-[240px] animate-in zoom-in-95 duration-200">
                                <div className="space-y-1">
                                    <p className="font-black text-red-600 text-sm uppercase tracking-tight">Prazo Crítico Atingido</p>
                                    <p className="text-xs text-muted-foreground font-medium leading-snug">
                                        Contrato em <span className="font-bold text-zinc-900">{p.status}</span> há <span className="text-red-600 font-black">{bizDays} dia(s) úteis.</span>
                                    </p>
                                    <p className="text-[10px] italic text-muted-foreground mt-2 border-t pt-1.5 opacity-70">
                                        Limite operacional: {limit} dias
                                    </p>
                                </div>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                )}
            </div>
        );
    },
    size: 160,
  },
  {
    id: 'Operador',
    accessorKey: 'operator',
    header: 'Operador',
    cell: ({ row }) => <span className="text-sm font-bold text-foreground/70 w-full truncate block">{row.original.operator || '-'}</span>,
    size: 150,
  },
  {
    id: 'Comissão',
    accessorKey: 'commissionValue',
    header: 'Comissão',
    cell: ({ row }) => <div className="text-right font-black text-sm text-foreground">{formatCurrency(row.original.commissionValue)}</div>,
    size: 120,
  },
  {
    id: 'Data Digitação',
    accessorKey: 'dateDigitized',
    header: 'Data Digitação',
    cell: ({ row }) => <span className="text-sm font-bold text-foreground/70">{formatDateSafe(row.original.dateDigitized)}</span>,
    size: 120,
  },
  {
    id: 'Data Averbação',
    accessorKey: 'dateApproved',
    header: 'Data Averbação',
    cell: ({ row }) => <span className="text-sm font-bold text-foreground/70">{formatDateSafe(row.original.dateApproved)}</span>,
    size: 120,
  },
  {
    id: 'Data Pgto. Cliente',
    accessorKey: 'datePaidToClient',
    header: 'Data Pgto. Cliente',
    cell: ({ row }) => <span className="text-sm font-bold text-foreground/70">{formatDateSafe(row.original.datePaidToClient)}</span>,
    size: 120,
  },
  {
    id: 'Chegada Saldo',
    accessorKey: 'debtBalanceArrivalDate',
    header: 'Chegada Saldo',
    cell: ({ row }) => <span className="text-sm font-bold text-foreground/70">{formatDateSafe(row.original.debtBalanceArrivalDate)}</span>,
    size: 120,
  },
  {
    id: 'Actions',
    header: '',
    cell: (props) => <ActionsCell {...props} onEdit={onEdit} onDelete={onDelete} />,
    enableHiding: false,
    size: 80,
  },
];