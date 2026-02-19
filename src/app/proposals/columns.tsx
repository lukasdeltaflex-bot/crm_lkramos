
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
import { MoreHorizontal, ArrowUpDown, GripVertical, ArrowUp, ArrowDown, Copy, AlertCircle, Info, Building2, Timer } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { formatCurrency, cleanBankName, calculateBusinessDays, cn, isWhatsApp, getWhatsAppUrl } from '@/lib/utils';
import React, { useState, useEffect } from 'react';
import { StatusCell } from './status-cell';
import { format, isValid, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { TableHead } from '@/components/ui/table';
import { toast } from '@/hooks/use-toast';
import type { DateRange } from 'react-day-picker';
import { BankIcon } from '@/components/bank-icon';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider
} from "@/components/ui/tooltip"
import { WhatsAppIcon } from '@/components/icons/whatsapp-icon';

type ProposalWithCustomer = Proposal & { customer: any };

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

const StatusCellWithMonitor = ({ 
    proposal, 
    onStatusChange 
}: { 
    proposal: ProposalWithCustomer; 
    onStatusChange: (proposalId: string, newStatus: ProposalStatus, product?: string) => void;
}) => {
    const [hasMounted, setHasMounted] = useState(false);
    useEffect(() => setHasMounted(true), []);

    // Lógica do Monitor de Prazo Crítico
    const status = proposal.status;
    const refDate = proposal.statusUpdatedAt || proposal.statusAwaitingBalanceAt || proposal.dateDigitized;
    const daysSince = hasMounted && refDate ? calculateBusinessDays(refDate) : 0;

    let isCritical = false;
    let threshold = 0;

    if (status === 'Em Andamento' && daysSince >= 3) { isCritical = true; threshold = 3; }
    else if (status === 'Aguardando Saldo' && daysSince >= 5) { isCritical = true; threshold = 5; }
    else if (status === 'Pendente' && daysSince >= 2) { isCritical = true; threshold = 2; }
    else if (status === 'Saldo Pago' && daysSince >= 3) { isCritical = true; threshold = 3; }

    return (
        <div className="flex items-center gap-2">
            <div className="w-28">
                <StatusCell
                    proposalId={proposal.id}
                    currentStatus={proposal.status}
                    product={proposal.product}
                    onStatusChange={onStatusChange}
                />
            </div>
            {isCritical && hasMounted && (
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <div className="flex items-center justify-center h-5 w-5 rounded-full border border-red-200 bg-red-50 text-red-600 animate-alert-pulse cursor-help shadow-sm">
                                <Timer className="h-3 w-3" />
                            </div>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="bg-white text-zinc-950 border shadow-2xl p-4 rounded-[2rem] min-w-[220px]">
                            <div className="space-y-1 text-center">
                                <p className="font-bold text-sm text-red-600">Alerta de Prazo Crítico</p>
                                <p className="text-xs font-medium text-muted-foreground">
                                    Este contrato está em <span className="font-bold text-zinc-900">{status}</span> há <span className="font-bold text-red-600">{daysSince} dia(s)</span>.
                                </p>
                                <p className="text-[10px] text-muted-foreground italic mt-1">Limite sugerido: {threshold} dias.</p>
                            </div>
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            )}
        </div>
    );
}

export const getColumns = (
    onEdit: any,
    onView: any,
    onDelete: any,
    onStatusChange: any,
    onDuplicate: any
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
    enableColumnOrdering: false,
  },
  {
    accessorKey: 'promoter',
    id: 'promoter',
    header: 'Promotora',
    cell: ({ row, table }) => {
        const promoter = row.original.promoter;
        const settings = (table.options.meta as any)?.userSettings as UserSettings;
        const showLogos = settings?.showPromoterLogos ?? true;
        const domain = settings?.promoterDomains?.[promoter];

        return (
            <div className="flex items-center gap-2">
                <BankIcon bankName={promoter} domain={domain} showLogo={showLogos} className="h-4 w-4" />
                <span className="truncate max-w-[100px]">{promoter}</span>
            </div>
        )
    }
  },
  {
    accessorKey: 'proposalNumber',
    id: 'proposalNumber',
    header: 'Nº Proposta',
    cell: ({ row }) => {
        const proposalNumber = row.getValue('proposalNumber') as string;
        return (
            <div className="flex items-center gap-1">
                <span>{proposalNumber}</span>
                <CopyButton text={proposalNumber} label="Número da Proposta" />
            </div>
        )
    }
  },
  {
    id: 'customerName',
    accessorFn: (row) => row.customer?.name,
    header: 'Cliente',
    cell: ({ row }) => {
        const customer = row.original.customer;
        const name = customer?.name;
        const phone = customer?.phone;
        const isWh = phone ? isWhatsApp(phone) : false;

        return (
            <div className="flex items-center gap-2">
                <span className="font-medium">{name || 'Cliente não encontrado'}</span>
                {isWh && (
                    <a 
                        href={getWhatsAppUrl(phone!)} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="text-green-500 hover:text-green-600 transition-colors"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <WhatsAppIcon className="h-3.5 w-3.5" />
                    </a>
                )}
            </div>
        )
    }
  },
  {
    id: 'customerCpf',
    accessorFn: (row) => row.customer?.cpf,
    header: 'CPF',
    cell: ({ row }) => {
        const cpf = row.original.customer?.cpf;
        return (
             <div className="flex items-center gap-1">
                <span>{cpf || '-'}</span>
                {cpf && <CopyButton text={cpf} label="CPF" />}
            </div>
        )
    }
  },
  {
    accessorKey: 'product',
    id: 'product',
    header: 'Produto',
  },
  {
    accessorKey: 'grossAmount',
    id: 'grossAmount',
    header: () => <div className="text-right">Valor Bruto</div>,
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue('grossAmount'));
      return (
        <div className="text-right font-medium">{formatCurrency(amount)}</div>
      );
    },
  },
  {
    accessorKey: 'bank',
    header: 'Banco Digitado',
    id: 'banco_digitado_v6',
    cell: ({ row, table }) => {
        const bankRaw = row.original.bank;
        const bank = cleanBankName(bankRaw);
        const settings = (table.options.meta as any)?.userSettings as UserSettings;
        const showLogos = settings?.showBankLogos ?? true;
        const customDomain = settings?.bankDomains?.[bankRaw];
        
        return (
            <div className="flex items-center gap-2">
                <BankIcon bankName={bankRaw} domain={customDomain} showLogo={showLogos} />
                <span className="truncate">{bank}</span>
            </div>
        )
    }
  },
  {
    accessorKey: 'status',
    id: 'status',
    header: 'Status',
    cell: ({ row }) => (
        <StatusCellWithMonitor 
            proposal={row.original} 
            onStatusChange={onStatusChange} 
        />
    ),
    filterFn: (row, id, value) => {
        if (!value || (Array.isArray(value) && value.length === 0)) return true;
        const status = row.getValue(id);
        // Garantimos que a comparação funcione mesmo com arrays ou valores únicos vindos das abas
        return Array.isArray(value) ? value.includes(status) : status === value;
    }
  },
  {
    accessorKey: 'operator',
    id: 'operator',
    header: 'Operador',
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
    cell: ({ row }) => formatDate(row.getValue('dateDigitized')),
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
    cell: (props) => <ActionsCell {...props} onEdit={onEdit} onView={onView} onDelete={onDelete} onDuplicate={onDuplicate} />,
    enableColumnOrdering: false,
    enableSorting: false,
  },
].map(column => ({ ...column, id: column.id || column.accessorKey as string}));
