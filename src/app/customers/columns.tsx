
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
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import Link from 'next/link';
import { isWhatsApp, getWhatsAppUrl, cn } from '@/lib/utils';
import { WhatsAppIcon } from '@/components/icons/whatsapp-icon';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { TableHead } from '@/components/ui/table';
import { toast } from '@/hooks/use-toast';

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
        <Button variant="ghost" size="icon" className="h-7 w-7 opacity-20 hover:opacity-100 transition-opacity" onClick={handleCopy}>
            <Copy className="h-3 w-3" />
            <span className="sr-only">Copiar {label}</span>
        </Button>
    );
};

export const DraggableHeader = ({ header }: { header: Header<Customer, unknown> }) => {
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
                'relative p-0 h-12 border-r last:border-r-0 bg-transparent group transition-colors hover:bg-muted/10',
                isSelect && 'w-[50px] min-w-[50px]'
            )}
        >
            <div className="flex flex-col h-full justify-center">
                <div
                    className={cn(
                        'flex items-center gap-1.5 h-full px-3',
                        isDraggable && 'cursor-pointer select-none',
                        isActions && 'justify-end'
                    )}
                    onClick={header.column.getToggleSortingHandler()}
                >
                    {isDraggable && !isActions && !isSelect && (
                        <div
                            {...attributes}
                            {...listeners}
                            className="p-1 hover:bg-primary/5 rounded cursor-grab active:cursor-grabbing text-muted-foreground/30 hover:text-primary transition-colors"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <GripVertical className="h-3.5 w-3.5" />
                        </div>
                    )}

                    <div className={cn(
                        "overflow-hidden font-black text-[10px] uppercase tracking-[0.1em] text-muted-foreground/60 leading-tight flex items-center gap-1",
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
                        "absolute right-0 top-0 h-full w-1.5 cursor-col-resize select-none touch-none hover:bg-primary/20 z-20 transition-colors",
                        header.column.getIsResizing() ? "bg-primary w-0.5" : "opacity-0"
                    )}
                />
            )}
        </TableHead>
    )
}

const ActionsCell = ({ row, onEdit, onDelete }: any) => {
  const customer = row.original;
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
          <DropdownMenuLabel>Ações Disponíveis</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={() => onEdit(customer)}>
            Editar Cadastro
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <AlertDialog>
            <AlertDialogTrigger asChild>
                <DropdownMenuItem
                    onSelect={(e) => e.preventDefault()}
                    className="text-destructive focus:text-destructive focus:bg-destructive/10"
                >
                    Remover Registro
                </DropdownMenuItem>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                    <AlertDialogDescription>
                        Esta ação irá inativar o cliente. Você poderá reativá-lo mais tarde.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Voltar</AlertDialogCancel>
                    <AlertDialogAction onClick={() => onDelete(customer.id)}>Confirmar</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </DropdownMenuContent>
      </DropdownMenu>
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
        className="rounded-full h-5 w-5 border-border/50"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Selecionar linha"
        className="rounded-full h-5 w-5 border-border/50"
      />
    ),
    enableSorting: false,
    enableHiding: false,
    size: 50,
  },
  {
    id: 'ID',
    accessorKey: 'numericId',
    header: 'ID',
    cell: ({ row }) => <span className="text-xs font-medium text-muted-foreground/60">{row.original.numericId}</span>,
    size: 80,
  },
  {
    id: 'Nome',
    accessorKey: 'name',
    header: 'Nome',
    cell: ({ row }) => {
        const customer = row.original;
        return (
            <Link href={`/customers/${customer.id}`} className="font-bold text-primary hover:underline uppercase text-xs tracking-tight truncate block max-w-[220px]">
                {customer.name}
            </Link>
        )
    },
    size: 250,
  },
  {
    id: 'CPF',
    accessorKey: 'cpf',
    header: 'CPF',
    cell: ({ row }) => {
        const cpf = row.original.cpf;
        return (
          <div className="flex items-center gap-1 font-medium text-muted-foreground/80 text-[11px]">
            <span>{cpf}</span>
            <CopyButton text={cpf} label="CPF" />
          </div>
        );
      },
    size: 150,
  },
  {
    id: 'Telefone',
    accessorKey: 'phone',
    header: 'Telefone',
    cell: ({ row }) => {
        const phone = row.original.phone;
        const isWhatsAppNumber = isWhatsApp(phone);
        return (
          <div className="flex items-center gap-2 font-medium text-xs">
            <span>{phone}</span>
            {isWhatsAppNumber && (
              <a href={getWhatsAppUrl(phone)} target="_blank" rel="noopener noreferrer" className="text-green-500 hover:text-green-600">
                <WhatsAppIcon className="h-3.5 w-3.5" />
              </a>
            )}
          </div>
        );
      },
    size: 150,
  },
  {
    id: 'Telefone 2',
    accessorKey: 'phone2',
    header: 'Telefone 2',
    cell: ({ row }) => {
        const phone = row.original.phone2;
        if (!phone) return <span className="text-muted-foreground/30 italic text-[10px]">---</span>;
        const isWhatsAppNumber = isWhatsApp(phone);
        return (
          <div className="flex items-center gap-2 font-medium text-xs">
            <span>{phone}</span>
            {isWhatsAppNumber && (
              <a href={getWhatsAppUrl(phone)} target="_blank" rel="noopener noreferrer" className="text-green-500 hover:text-green-600">
                <WhatsAppIcon className="h-3.5 w-3.5" />
              </a>
            )}
          </div>
        );
      },
    size: 150,
  },
  {
    id: 'Cidade',
    accessorKey: 'city',
    header: 'Cidade',
    cell: ({ row }) => <span className="text-xs text-muted-foreground truncate block">{row.original.city || '-'}</span>,
    size: 150,
  },
  {
    id: 'Estado',
    accessorKey: 'state',
    header: 'Estado',
    cell: ({ row }) => <span className="text-xs text-muted-foreground font-bold">{row.original.state || '-'}</span>,
    size: 80,
  },
  {
    id: 'Observações',
    accessorKey: 'observations',
    header: 'Observações',
    cell: ({ row }) => <div className="truncate max-w-[200px] text-zinc-400 italic text-[10px]">{row.original.observations}</div>,
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
