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
import { 
    MoreHorizontal, 
    GripVertical, 
    ArrowUp, 
    ArrowDown, 
    Copy, 
    Timer, 
    Send, 
    FileCheck, 
    PenTool, 
    ShieldCheck,
    CopyPlus,
    Calendar as CalendarIcon
} from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { formatCurrency, cleanBankName, cn, formatDateSafe, isWhatsApp, getWhatsAppUrl, calculateBusinessDays } from '@/lib/utils';
import React, { useState, useEffect } from 'react';
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
        toast({ title: `${label} copiado!` });
    };
    return (
        <Button variant="ghost" size="icon" className="h-6 w-6 opacity-40 hover:opacity-100 transition-opacity" onClick={handleCopy}>
            <Copy className="h-3.5 w-3.5" />
        </Button>
    );
}

const ActionsCell = ({ row, onEdit, onView, onDelete, onDuplicate }: any) => {
    const proposal = row.original;
    const [isAlertOpen, setIsAlertOpen] = useState(false);

    return (
      <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-blue-600 hover:bg-blue-50" onClick={() => onDuplicate && onDuplicate(proposal)}>
            <CopyPlus className="h-4 w-4" />
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0 hover:bg-muted transition-colors rounded-full">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 shadow-xl border-2">
            <DropdownMenuLabel>Opções da Proposta</DropdownMenuLabel>
            <DropdownMenuItem onSelect={() => onView && onView(proposal)} className="font-bold">Ver detalhes</DropdownMenuItem>
            <DropdownMenuItem onSelect={() => onEdit && onEdit(proposal)} className="font-bold">Editar Registro</DropdownMenuItem>
            <DropdownMenuItem onSelect={() => onDuplicate && onDuplicate(proposal)} className="font-bold text-blue-600">Duplicar Proposta</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => setIsAlertOpen(true)} className="text-destructive font-bold">Remover Registro</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
            <AlertDialogContent>
                <AlertDialogHeader><AlertDialogTitle>Você tem certeza?</AlertDialogTitle><AlertDialogDescription>Esta ação irá excluir permanentemente a proposta.</AlertDialogDescription></AlertDialogHeader>
                <AlertDialogFooter><AlertDialogCancel>Voltar</AlertDialogCancel><AlertDialogAction onClick={() => { onDelete(proposal.id); setIsAlertOpen(false); }}>Confirmar</AlertDialogAction></AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
      </div>
    );
};

export const DraggableHeader = ({ header, className }: { header: Header<any, unknown>; className?: string }) => {
    const { attributes, listeners, setNodeRef, transform, isDragging } = useSortable({ 
        id: header.column.id,
    });
    
    const style = {
        width: header.getSize(),
        transform: CSS.Transform.toString(transform),
        opacity: isDragging ? 0.5 : 1,
    };

    const isSortable = header.column.getCanSort();
    const isSelect = header.column.id === 'Selecionar';

    return (
        <TableHead
            ref={setNodeRef}
            colSpan={header.colSpan}
            style={style}
            className={cn("relative p-0 h-14 transition-colors hover:bg-muted/50 border-b-2 bg-background z-10", className)}
        >
            <div className="flex flex-col h-full justify-center">
                <div
                    className={cn(
                        'flex items-center gap-1 h-full px-2',
                        'select-none',
                        header.column.id === 'Actions' && 'justify-end',
                        isSelect && 'justify-center'
                    )}
                >
                    {!isSelect && (
                        <div {...attributes} {...listeners} className="p-1 hover:bg-primary/10 rounded cursor-grab text-muted-foreground/40" onClick={(e) => e.stopPropagation()}>
                            <GripVertical className="h-3.5 w-3.5" />
                        </div>
                    )}
                    <div 
                        className={cn(
                            "overflow-hidden font-black text-[12px] uppercase tracking-wider text-foreground leading-tight flex items-center gap-1", 
                            isSortable && "cursor-pointer",
                            header.column.id === 'Actions' && "text-right pr-2", 
                            isSelect && "justify-center w-full pr-0"
                        )}
                        onClick={isSortable ? header.column.getToggleSortingHandler() : undefined}
                    >
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
                <div onMouseDown={header.getResizeHandler()} onTouchStart={header.getResizeHandler()} className={cn("absolute right-0 top-0 h-full w-1.5 cursor-col-resize select-none touch-none hover:bg-primary/40 z-20 transition-colors", header.column.getIsResizing() ? "bg-primary" : "opacity-0")} />
            )}
        </TableHead>
    )
}

const ProposalStatusCell = ({ p, onStatusChange }: { p: Proposal; onStatusChange: any }) => {
    const referenceDate = p.statusAwaitingBalanceAt || p.statusUpdatedAt || p.dateDigitized;
    const bizDays = referenceDate ? calculateBusinessDays(referenceDate) : 0;
    const isCritical = (p.status === 'Pendente' && bizDays >= 2) || (p.status === 'Aguardando Saldo' && p.product === 'Portabilidade' && bizDays >= 5) || (p.status === 'Em Andamento' && bizDays >= 5);

    return (
        <div className="flex items-center gap-2 w-full">
            <div className="flex-1"><StatusCell proposalId={p.id} currentStatus={p.status} product={p.product} onStatusChange={onStatusChange} /></div>
            {isCritical && (
                <div className="shrink-0 h-7 w-7 rounded-full bg-red-500/15 border-2 border-red-500/40 flex items-center justify-center text-red-600 animate-alert-pulse"><Timer className="h-4 w-4 fill-current" /></div>
            )}
        </div>
    );
};

export const getColumns = (
    onEdit: any, onView: any, onDelete: any, onStatusChange: any, onDuplicate: any, onToggleChecklist: (pId: string, sId: string, val: boolean) => void
    ): ColumnDef<Proposal & { customer: any }>[] => [
  { 
    id: 'Selecionar', 
    header: ({ table }) => (
        <div className="flex justify-center w-full">
            <Checkbox checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && 'indeterminate')} onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)} className="rounded-full h-5 w-5" onClick={(e) => e.stopPropagation()} />
        </div>
    ), 
    cell: ({ row }) => (
        <div className="flex justify-center w-full">
            <Checkbox checked={row.getIsSelected()} onCheckedChange={(value) => row.toggleSelected(!!value)} className="rounded-full h-5 w-5" onClick={(e) => e.stopPropagation()} />
        </div>
    ), 
    enableSorting: false, 
    size: 50 
  },
  { id: 'Data Digitação', accessorKey: 'dateDigitized', header: 'Data Digitação', cell: ({ row }) => <span className="text-sm font-bold text-muted-foreground">{formatDateSafe(row.original.dateDigitized)}</span>, size: 130 },
  { id: 'Etapas', header: 'Etapas', cell: ({ row }) => {
        const p = row.original;
        const steps = [{ id: 'formalization', icon: Send, color: 'text-blue-500' }, { id: 'documentation', icon: FileCheck, color: 'text-orange-500' }, { id: 'signature', icon: PenTool, color: 'text-purple-500' }, { id: 'approval', icon: ShieldCheck, color: 'text-green-500' }];
        return (<div className="flex items-center gap-1.5">{steps.map(s => { const act = p.checklist?.[s.id]; return (<button key={s.id} onClick={(e) => { e.stopPropagation(); onToggleChecklist(p.id, s.id, !!act); }} className="hover:scale-125 transition-transform"><s.icon className={cn("h-3.5 w-3.5", act ? s.color : "text-muted-foreground/30")} /></button>) })}</div>)
    }, size: 100 },
  { id: 'Promotora', accessorKey: 'promoter', header: 'Promotora', cell: ({ row, table }) => {
        const prom = row.original.promoter;
        const sett = (table.options.meta as any)?.userSettings;
        return (<div className="flex items-center gap-2"><BankIcon bankName={prom} domain={sett?.promoterDomains?.[prom]} showLogo={sett?.showPromoterLogos ?? true} className="h-4 w-4" /><span className="truncate text-sm font-bold">{prom}</span></div>)
    }, size: 150 },
  { id: 'Nº Proposta', accessorKey: 'proposalNumber', header: 'Nº Proposta', cell: ({ row }) => (<div className="flex items-center gap-1 text-sm font-black"><span>{row.original.proposalNumber}</span><CopyButton text={row.original.proposalNumber} label="Proposta" /></div>), size: 150 },
  { id: 'Cliente', accessorFn: (row) => row.customer?.name, header: 'Cliente', cell: ({ row }) => {
        const customer = row.original.customer;
        const phone = customer?.phone;
        return (
            <div className="flex items-center gap-2 font-black text-primary uppercase text-sm truncate">
                {phone && isWhatsApp(phone) && (
                    <a href={getWhatsAppUrl(phone)} target="_blank" rel="noopener noreferrer" className="text-green-500 hover:scale-125 transition-transform shrink-0">
                        <WhatsAppIcon className="h-4 w-4" />
                    </a>
                )}
                <span className="truncate">{customer?.name || '---'}</span>
            </div>
        );
    }, size: 220 },
  { id: 'CPF', accessorFn: (row) => row.customer?.cpf, header: 'CPF', cell: ({ row }) => (<div className="flex items-center gap-1 text-sm font-black text-foreground/80"><span>{row.original.customer?.cpf || '-'}</span><CopyButton text={row.original.customer?.cpf} label="CPF" /></div>), size: 160 },
  { id: 'Produto', accessorKey: 'product', header: 'Produto', cell: ({ row }) => <span className="text-sm font-bold text-foreground/80">{row.original.product}</span>, size: 120 },
  { id: 'Valor Bruto', accessorKey: 'grossAmount', header: () => <div className="text-right">Valor Bruto</div>, cell: ({ row }) => <div className="text-right font-black text-sm">{formatCurrency(row.original.grossAmount)}</div>, size: 120 },
  { id: 'Comissão', accessorKey: 'commissionValue', header: () => <div className="text-right">Comissão</div>, cell: ({ row }) => <div className="text-right font-bold text-emerald-600">{formatCurrency(row.original.commissionValue)}</div>, size: 120 },
  { id: 'Banco Digitado', accessorKey: 'bank', header: 'Banco Digitado', cell: ({ row, table }) => {
        const bank = row.original.bank;
        const sett = (table.options.meta as any)?.userSettings;
        return (<div className="flex items-center gap-2"><BankIcon bankName={bank} domain={sett?.bankDomains?.[bank]} showLogo={sett?.showBankLogos ?? true} /><span className="truncate text-sm font-bold">{cleanBankName(bank)}</span></div>)
    }, size: 150 },
  { id: 'Status', accessorKey: 'status', header: 'Status', cell: ({ row }) => <ProposalStatusCell p={row.original} onStatusChange={onStatusChange} />, size: 160 },
  { id: 'Data Averbação', accessorKey: 'dateApproved', header: 'Data Averbação', cell: ({ row }) => <span className="text-sm font-medium">{formatDateSafe(row.original.dateApproved)}</span>, size: 130 },
  { id: 'Data Pgto. Cliente', accessorKey: 'datePaidToClient', header: 'Data Pgto. Cliente', cell: ({ row }) => <span className="text-sm font-medium">{formatDateSafe(row.original.datePaidToClient)}</span>, size: 130 },
  { id: 'Chegada Saldo', accessorKey: 'debtBalanceArrivalDate', header: 'Chegada Saldo', cell: ({ row }) => <span className="text-sm font-medium">{formatDateSafe(row.original.debtBalanceArrivalDate)}</span>, size: 130 },
  { id: 'Operador', accessorKey: 'operator', header: 'Operador', cell: ({ row }) => <span className="text-xs font-bold">{row.original.operator || '-'}</span>, size: 120 },
  { id: 'Actions', header: '', cell: (cp) => (<ActionsCell row={cp.row} onEdit={onEdit} onView={onView} onDelete={onDelete} onDuplicate={onDuplicate} />), enableHiding: false, size: 80 },
];