
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
        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleCopy}>
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
                    className={cn(
                        "p-1 -ml-2",
                        isDraggable ? "cursor-grab" : "cursor-default",
                    )}
                    onClick={(e) => e.stopPropagation()}
                    disabled={!isDraggable}
                >
                    <GripVertical className={cn("h-4 w-4", !isDraggable && "opacity-30")} />
                </button>

                <div className="flex-1 overflow-hidden font-bold text-[11px] uppercase tracking-wider text-muted-foreground">
                    {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                        )}
                </div>
                 {header.column.getIsSorted() && (
                    <div className="ml-1">
                        {header.column.getIsSorted() === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />}
                    </div>
                )}
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

const ActionsCell = ({ row, onEdit, onDelete }: any) => {
  const customer = row.original;
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
          <DropdownMenuItem onSelect={() => onEdit(customer)}>
            Editar
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <AlertDialog>
            <DropdownMenuItem
                onSelect={(e) => e.preventDefault()}
                className="text-destructive focus:text-destructive focus:bg-destructive/10"
            >
                Remover
            </DropdownMenuItem>
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
    accessorKey: 'numericId',
    id: 'ID',
    header: 'ID',
    size: 80,
  },
  {
    accessorKey: 'name',
    id: 'Nome',
    header: 'Nome',
    cell: ({ row }) => {
        const customer = row.original;
        return (
            <Link href={`/customers/${customer.id}`} className="font-bold text-sky-600 hover:underline">
                {customer.name}
            </Link>
        )
    },
    size: 250,
  },
  {
    accessorKey: 'cpf',
    id: 'CPF',
    header: 'CPF',
    cell: ({ row }) => {
        const cpf = row.original.cpf;
        return (
          <div className="flex items-center gap-1 font-medium text-zinc-600">
            <span>{cpf}</span>
            <CopyButton text={cpf} label="CPF" />
          </div>
        );
      },
    size: 150,
  },
  {
    accessorKey: 'phone',
    id: 'Telefone',
    header: 'Telefone',
    cell: ({ row }) => {
        const phone = row.original.phone;
        const isWhatsAppNumber = isWhatsApp(phone);
        return (
          <div className="flex items-center gap-2 font-medium text-zinc-600">
            <span>{phone}</span>
            {isWhatsAppNumber && (
              <a href={getWhatsAppUrl(phone)} target="_blank" rel="noopener noreferrer" className="text-green-500 hover:text-green-600">
                <WhatsAppIcon className="h-4 w-4" />
              </a>
            )}
          </div>
        );
      },
    size: 150,
  },
  {
    accessorKey: 'city',
    id: 'Cidade',
    header: 'Cidade',
    size: 150,
  },
  {
    accessorKey: 'state',
    id: 'Estado',
    header: 'Estado',
    size: 80,
  },
  {
    accessorKey: 'observations',
    id: 'Observações',
    header: 'Observações',
    cell: ({ row }) => <div className="truncate max-w-[200px] text-zinc-500 italic text-xs">{row.original.observations}</div>,
    size: 200,
  },
  {
    id: 'Ações',
    cell: (props) => <ActionsCell {...props} onEdit={onEdit} onDelete={onDelete} />,
    enableHiding: false,
    size: 80,
  },
].map(column => ({ ...column, id: column.id || column.accessorKey as string}));
