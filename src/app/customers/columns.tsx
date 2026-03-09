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

export const DraggableHeader = ({ header, className }: { header: Header<Customer, unknown>, className?: string }) => {
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
            className={cn(
                'relative p-0 h-14 transition-colors hover:bg-muted/50 border-b-2 border-zinc-200 dark:border-zinc-800',
                isSelect && 'w-[50px] min-w-[50px]',
                className
            )}
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
                            className="p-1 hover:bg-primary/10 rounded cursor-grab active:cursor-grabbing text-primary opacity-40 group-hover:opacity-100 transition-all"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <GripVertical className="h-3.5 w-3.5" />
                        </div>
                    )}

                    <div className={cn(
                        "overflow-hidden font-black text-[12px] uppercase tracking-widest text-foreground leading-tight flex items-center gap-1",
                        isActions && "text-right pr-2",
                        isSelect && "justify-center w-full pr-0"
                    )}>
                        {header.isPlaceholder
                            ? null
                            : flexRender(
                                header.column.columnDef.header,
                                header.getContext()
                            )}
                        
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

const ActionsCell = ({ row, onEdit, onDelete }: any) => {
  const customer = row.original;
  const [isAlertOpen, setIsAlertOpen] = useState(false);

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
          <DropdownMenuLabel>Opções do Registro</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={() => onEdit(customer)} className="font-bold">
            Editar Cadastro
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onSelect={() => setIsAlertOpen(true)}
            className="text-destructive focus:text-destructive focus:bg-destructive/10 font-bold"
          >
            Remover Registro
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                <AlertDialogDescription>
                    Esta ação irá inativar o cliente. Você poderá reativá-lo mais tarde.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel>Voltar</AlertDialogCancel>
                <AlertDialogAction onClick={() => {
                    onDelete(customer.id);
                    setIsAlertOpen(false);
                }}>Confirmar</AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

const CustomerNameCell = ({ row }: { row: any }) => {
    const [hasMounted, setHasMounted] = useState(false);
    useEffect(() => setHasMounted(true), []);
    
    const customer = row.original;
    const age = hasMounted ? getAge(customer.birthDate) : 0;
    
    return (
        <div className="flex flex-col gap-0.5">
            <Link href={`/customers/${customer.id}`} className="font-bold text-primary hover:underline uppercase text-sm tracking-tight truncate inline-block" onClick={(e) => e.stopPropagation()}>
                {customer.name}
            </Link>
            <div className="flex items-center gap-1">
                {hasMounted && age >= 74 && (
                    <Badge variant="destructive" className="w-fit h-4 text-[8px] font-black px-1.5 py-0 animate-pulse">ALERTA 75 ANOS</Badge>
                )}
                {hasMounted && (customer as any).smartTags?.slice(0, 2).map((tag: string) => (
                    <Badge key={tag} className={cn("h-4 text-[7px] font-black px-1.5 py-0 border-none text-white shadow-sm", tag.includes('ELITE') ? 'bg-amber-500' : tag.includes('ATIVO') ? 'bg-orange-600' : 'bg-blue-400')}>{tag}</Badge>
                ))}
            </div>
        </div>
    );
};


export const getColumns = (
  { onEdit, onDelete }: { onEdit: (customer: Customer) => void; onDelete: (customerId: string) => void; }
): ColumnDef<Customer>[] => [
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
    id: 'ID',
    accessorFn: (row) => row.numericId,
    header: 'ID',
    cell: ({ row }) => <span className="text-sm font-black text-foreground/80">{row.original.numericId}</span>,
    size: 80,
  },
  {
    id: 'Nome',
    accessorFn: (row) => row.name,
    header: 'Nome',
    cell: (props) => <CustomerNameCell {...props} />,
    size: 250,
  },
  {
    id: 'Tags',
    accessorFn: (row) => row.tags?.join(', '),
    header: 'Tags',
    cell: ({ row }) => (
        <div className="flex flex-wrap gap-1">
            {row.original.tags?.map(tag => (
                <Badge key={tag} variant="outline" className="h-5 text-[8px] font-black px-2 py-0 bg-primary/5 text-primary border-primary/20">{tag}</Badge>
            )) || <span className="text-[10px] text-muted-foreground/30 italic">---</span>}
        </div>
    ),
    size: 180,
  },
  {
    id: 'CPF',
    accessorFn: (row) => row.cpf,
    header: 'CPF',
    cell: ({ row }) => {
        const cpf = row.original.cpf;
        return (
          <div className="flex items-center gap-1 font-bold text-foreground/90 text-sm">
            <span>{cpf}</span>
            <CopyButton text={cpf} label="CPF" />
          </div>
        );
      },
    size: 150,
  },
  {
    id: 'Telefone',
    accessorFn: (row) => row.phone,
    header: 'Telefone',
    cell: ({ row }) => {
        const phone = row.original.phone;
        const isWhatsAppNumber = isWhatsApp(phone);
        return (
          <div className="flex items-center gap-2 font-bold text-sm">
            <span>{phone}</span>
            {isWhatsAppNumber && (
              <a href={getWhatsAppUrl(phone)} target="_blank" rel="noopener noreferrer" className="text-green-600 hover:text-green-700 transition-transform hover:scale-110" onClick={(e) => e.stopPropagation()}>
                <WhatsAppIcon className="h-4 w-4" />
              </a>
            )}
          </div>
        );
      },
    size: 150,
  },
  {
    id: 'Telefone 2',
    accessorFn: (row) => row.phone2,
    header: 'Telefone 2',
    cell: ({ row }) => {
        const phone = row.original.phone2;
        if (!phone) return <span className="text-muted-foreground/30 italic text-xs">---</span>;
        const isWhatsAppNumber = isWhatsApp(phone);
        return (
          <div className="flex items-center gap-2 font-bold text-sm text-foreground/80">
            <span>{phone}</span>
            {isWhatsAppNumber && (
              <a href={getWhatsAppUrl(phone)} target="_blank" rel="noopener noreferrer" className="text-green-600 hover:text-green-700 transition-transform hover:scale-110" onClick={(e) => e.stopPropagation()}>
                <WhatsAppIcon className="h-4 w-4" />
              </a>
            )}
          </div>
        );
      },
    size: 150,
  },
  {
    id: 'Cidade',
    accessorFn: (row) => row.city,
    header: 'Cidade',
    cell: ({ row }) => <span className="text-sm text-foreground font-medium truncate block w-full">{row.original.city || '-'}</span>,
    size: 150,
  },
  {
    id: 'Estado',
    accessorFn: (row) => row.state,
    header: 'Estado',
    cell: ({ row }) => <span className="text-sm text-foreground font-black uppercase">{row.original.state || '-'}</span>,
    size: 80,
  },
  {
    id: 'Observações',
    accessorFn: (row) => row.observations,
    header: 'Observações',
    cell: ({ row }) => <div className="truncate w-full text-muted-foreground italic text-xs block">{row.original.observations}</div>,
    size: 200,
  },
  {
    id: 'Ações',
    header: '',
    cell: (props) => <ActionsCell {...props} onEdit={onEdit} onDelete={onDelete} />,
    enableHiding: false,
    size: 80,
  },
];
