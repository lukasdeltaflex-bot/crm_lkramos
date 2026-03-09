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
        e.preventDefault(); e.stopPropagation();
        navigator.clipboard.writeText(text);
        toast({ title: `${label} copiado!` });
    };
    return (
        <Button variant="ghost" size="icon" className="h-7 w-7 opacity-40 hover:opacity-100" onClick={handleCopy}>
            <Copy className="h-3.5 w-3.5" />
        </Button>
    );
};

export const DraggableHeader = ({ header, className }: { header: Header<any, unknown>; className?: string }) => {
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
            className={cn("relative p-0 h-14 transition-colors hover:bg-muted/50 border-b-2", className)}
        >
            <div className="flex flex-col h-full justify-center">
                <div
                    className={cn(
                        'flex items-center gap-1 h-full px-2',
                        isDraggable && 'cursor-pointer select-none',
                        header.column.id === 'Ações' && 'justify-end'
                    )}
                    onClick={header.column.getToggleSortingHandler()}
                >
                    {isDraggable && header.column.id !== 'Selecionar' && header.column.id !== 'Ações' && (
                        <div {...attributes} {...listeners} className="p-1 hover:bg-primary/10 rounded cursor-grab text-muted-foreground/40" onClick={(e) => e.stopPropagation()}>
                            <GripVertical className="h-3.5 w-3.5" />
                        </div>
                    )}
                    <div className={cn("overflow-hidden font-black text-[12px] uppercase tracking-wider text-foreground leading-tight flex items-center gap-1", header.column.id === 'Ações' && "text-right pr-2", header.column.id === 'Selecionar' && "justify-center w-full pr-0")}>
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

export const getColumns = ({ onEdit, onStatusUpdate }: any): ColumnDef<ProposalWithCustomer>[] => [
  { id: 'Selecionar', header: ({ table }) => (<Checkbox checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && 'indeterminate')} onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)} className="rounded-full h-5 w-5" onClick={(e) => e.stopPropagation()} />), cell: ({ row }) => (<Checkbox checked={row.getIsSelected()} onCheckedChange={(value) => row.toggleSelected(!!value)} className="rounded-full h-5 w-5" onClick={(e) => e.stopPropagation()} />), enableSorting: false, size: 50 },
  { id: 'Promotora', accessorKey: 'promoter', header: 'Promotora', cell: ({ row, table }) => {
        const prom = row.original.promoter;
        const sett = (table.options.meta as any)?.userSettings;
        return (<div className="flex items-center gap-2"><BankIcon bankName={prom} domain={sett?.promoterDomains?.[prom]} showLogo={sett?.showPromoterLogos ?? true} className="h-4 w-4" /><span className="text-sm font-bold truncate">{prom}</span></div>)
    }, size: 150 },
  { id: 'Cliente', accessorFn: (row) => row.customer?.name, header: 'Cliente', cell: ({ row }) => <span className="font-black text-primary uppercase text-sm truncate">{row.original.customer?.name}</span>, size: 200 },
  { id: 'CPF', accessorFn: (row) => row.customer?.cpf, header: 'CPF', cell: ({ row }) => (<div className="flex items-center gap-1 text-sm font-black text-foreground/80"><span>{row.original.customer?.cpf || '-'}</span><CopyButton text={row.original.customer?.cpf} label="CPF" /></div>), size: 150 },
  { id: 'Nº Proposta', accessorKey: 'proposalNumber', header: 'Nº Proposta', cell: ({ row }) => (<div className="flex items-center gap-1 text-sm font-black"><Link href={`/proposals?open=${row.original.id}`} className="text-primary hover:underline font-black" onClick={(e) => e.stopPropagation()}>{row.original.proposalNumber}</Link><CopyButton text={row.original.proposalNumber} label="Proposta" /></div>), size: 150 },
  { id: 'Produto', accessorKey: 'product', header: 'Produto', cell: ({ row }) => <span className="text-sm font-bold text-foreground/80">{row.original.product}</span>, size: 120 },
  { id: 'Valor Bruto', accessorKey: 'grossAmount', header: () => <div className="text-right">Valor Bruto</div>, cell: ({ row, table }) => { const isPriv = (table.options.meta as any)?.isPrivacyMode; return (<div className="text-right font-black text-sm">{isPriv ? '•••••' : formatCurrency(row.original.grossAmount)}</div>) }, size: 120 },
  { id: 'Valor Comissão', accessorKey: 'commissionValue', header: 'Comissão', cell: ({ row, table }) => { const isPriv = (table.options.meta as any)?.isPrivacyMode; return (<div className="text-right font-black text-sm">{isPriv ? '•••••' : formatCurrency(row.original.commissionValue)}</div>) }, size: 120 },
  { id: 'Status Comissão', accessorKey: 'commissionStatus', header: 'Status Comissão', cell: ({ row }) => <CommissionStatusCell proposal={row.original} onStatusUpdate={onStatusUpdate} onEdit={onEdit} />, size: 140 },
  { id: 'Ações', header: '', cell: ({ row }) => (<div className="text-right" onClick={(e) => e.stopPropagation()}><Button variant="ghost" size="icon" className="rounded-full h-8 w-8" onClick={() => onEdit(row.original)}><MoreHorizontal className="h-4 w-4" /></Button></div>), enableHiding: false, size: 80 },
];
