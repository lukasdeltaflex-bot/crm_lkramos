'use client';

import { ColumnDef, Header, flexRender } from '@tanstack/react-table';
import type { Customer } from '@/lib/types';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, GripVertical, ArrowUp, ArrowDown, Copy } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import Link from 'next/link';
import { isWhatsApp, getWhatsAppUrl, cn, getAge } from '@/lib/utils';
import { WhatsAppIcon } from '@/components/icons/whatsapp-icon';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { TableHead } from '@/components/ui/table';
import { toast } from '@/hooks/use-toast';
import React, { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';

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

export const DraggableHeader = ({ header, className }: { header: Header<Customer, unknown>; className?: string }) => {
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
                        header.column.id === 'Ações' && 'justify-end',
                        isSelect && 'justify-center'
                    )}
                >
                    {!isSelect && (
                        <div {...attributes} {...listeners} className="p-1 hover:bg-primary/10 rounded cursor-grab text-primary opacity-40" onClick={(e) => e.stopPropagation()}>
                            <GripVertical className="h-3.5 w-3.5" />
                        </div>
                    )}
                    <div className={cn("overflow-hidden font-black text-[12px] uppercase tracking-widest text-foreground leading-tight flex items-center gap-1", isSortable && "cursor-pointer", header.column.id === 'Ações' && "text-right pr-2", isSelect && "justify-center w-full pr-0")} onClick={isSortable ? header.column.getToggleSortingHandler() : undefined}>
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

const ActionsCell = ({ row, onEdit, onDelete }: any) => {
  const customer = row.original;
  const [isAlertOpen, setIsAlertOpen] = useState(false);

  return (
    <div className="text-right" onClick={(e) => e.stopPropagation()}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0 hover:bg-muted rounded-full">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48 shadow-xl border-2">
          <DropdownMenuLabel>Opções</DropdownMenuLabel>
          <DropdownMenuItem onSelect={() => onEdit(customer)} className="font-bold">Editar Cadastro</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={() => setIsAlertOpen(true)} className="text-destructive font-bold">Remover Registro</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <AlertDialogContent>
            <AlertDialogHeader><AlertDialogTitle>Você tem certeza?</AlertDialogTitle><AlertDialogDescription>Esta ação irá inativar o cliente.</AlertDialogDescription></AlertDialogHeader>
            <AlertDialogFooter><AlertDialogCancel>Voltar</AlertDialogCancel><AlertDialogAction onClick={() => { onDelete(customer.id); setIsAlertOpen(false); }}>Confirmar</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export const getColumns = ({ onEdit, onDelete }: any): ColumnDef<Customer>[] => [
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
  { id: 'ID', accessorFn: (row) => row.numericId, header: 'ID', cell: ({ row }) => <span className="text-sm font-black text-foreground/80">{row.original.numericId}</span>, size: 80 },
  { id: 'Nome', accessorFn: (row) => row.name, header: 'Nome', cell: ({ row }) => {
      const customer = row.original;
      const smartTags = (customer as any).smartTagsFull || [];
      return (
          <div className="flex flex-col gap-1 py-1">
              <Link href={`/customers/${customer.id}`} className="font-bold text-primary hover:underline uppercase text-sm truncate block" onClick={(e) => { e.stopPropagation(); }}>
                  {customer.name}
              </Link>
              <div className="flex flex-wrap gap-1">
                  {smartTags.map((tag: any) => (
                      <Badge key={tag.label} className={cn("text-[7.5px] font-black uppercase px-1.5 py-0 rounded-full border-none text-white shadow-sm flex items-center gap-0.5", tag.color)}>
                          {tag.label === 'ATIVO' && <span className="text-[8px]">🔥</span>}
                          {tag.label}
                      </Badge>
                  ))}
              </div>
          </div>
      );
  }, size: 250 },
  { id: 'CPF', accessorFn: (row) => row.cpf, header: 'CPF', cell: ({ row }) => (<div className="flex items-center gap-1 font-bold text-sm"><span>{row.original.cpf}</span><CopyButton text={row.original.cpf} label="CPF" /></div>), size: 150 },
  { id: 'Telefone', accessorFn: (row) => row.phone, header: 'Telefone', cell: ({ row }) => { const phone = row.original.phone; return (<div className="flex items-center gap-2 font-bold text-sm"><span>{phone}</span>{isWhatsApp(phone) && <a href={getWhatsAppUrl(phone)} target="_blank" rel="noopener noreferrer" className="text-green-600"><WhatsAppIcon className="h-4 w-4" /></a>}</div>) }, size: 150 },
  { id: 'Telefone 2', accessorFn: (row) => row.phone2, header: 'Telefone 2', cell: ({ row }) => { const phone = row.original.phone2; if (!phone) return '-'; return (<div className="flex items-center gap-2 font-bold text-sm"><span>{phone}</span>{isWhatsApp(phone) && <a href={getWhatsAppUrl(phone)} target="_blank" rel="noopener noreferrer" className="text-green-600"><WhatsAppIcon className="h-4 w-4" /></a>}</div>) }, size: 150 },
  { id: 'Tags', header: 'Tags', cell: ({ row }) => {
      const customer = row.original;
      const manualTags = customer.tags || [];
      if (manualTags.length === 0) return '-';
      return (
          <div className="flex flex-wrap gap-1 max-w-[200px]">
              {manualTags.map((tag: string) => (
                  <Badge key={tag} variant="outline" className="text-[8px] font-black uppercase px-1.5 py-0 border-primary/20">{tag}</Badge>
              ))}
          </div>
      )
  }, size: 200 },
  { id: 'Cidade', accessorFn: (row) => row.city, header: 'Cidade', cell: ({ row }) => <span className="text-sm font-medium truncate block">{row.original.city || '-'}</span>, size: 150 },
  { id: 'Estado', accessorFn: (row) => row.state, header: 'Estado', cell: ({ row }) => <span className="text-sm font-black uppercase">{row.original.state || '-'}</span>, size: 80 },
  { id: 'Observações', accessorKey: 'observations', header: 'Observações', cell: ({ row }) => <span className="text-xs text-muted-foreground truncate block max-w-[200px] italic">{row.original.observations || '-'}</span>, size: 200 },
  { id: 'Ações', header: '', cell: (props) => <ActionsCell {...props} onEdit={onEdit} onDelete={onDelete} />, enableHiding: false, size: 80 },
];