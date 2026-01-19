'use client';

import { Column, ColumnDef, Header, flexRender } from '@tanstack/react-table';
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
import { MoreHorizontal, ArrowUpDown, GripVertical, ArrowUp, ArrowDown } from 'lucide-react';
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
import { isWhatsApp, getWhatsAppUrl } from '@/lib/utils';
import { WhatsAppIcon } from '@/components/icons/whatsapp-icon';
import { cn } from '@/lib/utils';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { TableHead } from '@/components/ui/table';

interface ActionsCellProps {
  row: { original: Customer };
  onEdit: (customer: Customer) => void;
  onDelete: (customerId: string) => void;
}

export const DraggableHeader = ({ header }: { header: Header<any, unknown>}) => {
    const { attributes, listeners, setNodeRef, transform, isDragging } = useSortable({
        id: header.column.id,
        disabled: header.column.columnDef.enableColumnOrdering === false,
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
                {header.column.columnDef.enableColumnOrdering !== false ? (
                    <button
                        {...attributes}
                        {...listeners}
                        className="cursor-grab p-1 -ml-2"
                        onClick={e => e.stopPropagation()}
                    >
                        <GripVertical className="h-4 w-4" />
                    </button>
                ) : (
                    <div className='w-6 p-1 -ml-2' /> // Placeholder to maintain alignment
                )}
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
                        'absolute right-0 top-0 h-full w-0.5 cursor-col-resize select-none touch-none bg-muted-foreground/20 transition-colors hover:bg-primary/50',
                        header.column.getIsResizing() && 'bg-primary'
                    )}
                />
            )}
        </TableHead>
    )
}

const ActionsCell: React.FC<ActionsCellProps> = ({ row, onEdit, onDelete }) => {
  const customer = row.original;
  return (
    <div className="text-right">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
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
            <AlertDialogTrigger asChild>
              <DropdownMenuItem
                onSelect={(e) => e.preventDefault()}
                className="text-destructive focus:text-destructive focus:bg-destructive/10"
              >
                Remover
              </DropdownMenuItem>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                <AlertDialogDescription>
                  Essa ação não pode ser desfeita. Os dados pessoais do cliente &quot;{customer.name}&quot; serão anonimizados, mas o histórico de propostas será mantido.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={() => onDelete(customer.id)}>
                  Remover
                </AlertDialogAction>
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
    accessorKey: 'numericId',
    id: 'numericId',
    header: 'ID',
    enableHiding: false,
  },
  {
    accessorKey: 'name',
    id: 'name',
    header: 'Nome',
    cell: ({ row }) => {
        const customer = row.original;
        return (
            <Link href={`/customers/${customer.id}`} className="font-medium text-primary hover:underline">
                {customer.name}
            </Link>
        )
    },
    enableHiding: false,
  },
  {
    accessorKey: 'cpf',
    id: 'cpf',
    header: 'CPF',
  },
  {
    accessorKey: 'phone',
    id: 'phone',
    header: 'Telefone',
    cell: ({ row }) => {
        const phone = row.getValue('phone') as string;
        const isWhatsAppNumber = isWhatsApp(phone);
        return (
          <div className="flex items-center gap-2">
            <span>{phone}</span>
            {isWhatsAppNumber && (
              <a href={getWhatsAppUrl(phone)} target="_blank" rel="noopener noreferrer" className="text-green-500 hover:text-green-600">
                <WhatsAppIcon />
              </a>
            )}
          </div>
        );
      },
  },
  {
    accessorKey: 'phone2',
    id: 'phone2',
    header: 'Telefone 2',
    cell: ({ row }) => {
        const phone = row.getValue('phone2') as string;
        if (!phone) return null;
        const isWhatsAppNumber = isWhatsApp(phone);
        return (
          <div className="flex items-center gap-2">
            <span>{phone}</span>
            {isWhatsAppNumber && (
              <a href={getWhatsAppUrl(phone)} target="_blank" rel="noopener noreferrer" className="text-green-500 hover:text-green-600">
                <WhatsAppIcon />
              </a>
            )}
          </div>
        );
      },
  },
  {
    accessorKey: 'benefitNumber',
    id: 'benefitNumber',
    header: 'Benefício',
  },
  {
    accessorKey: 'city',
    id: 'city',
    header: 'Cidade',
  },
  {
    accessorKey: 'state',
    id: 'state',
    header: 'Estado',
  },
  {
    accessorKey: 'observations',
    id: 'observations',
    header: 'Observações',
    cell: ({ row }) => {
        const obs = row.getValue('observations') as string;
        return <div className="truncate max-w-[200px]">{obs}</div>
    }
  },
  {
    id: 'actions',
    cell: (props) => <ActionsCell {...props} onEdit={onEdit} onDelete={onDelete} />,
    enableColumnOrdering: false,
    enableHiding: false,
    enableSorting: false,
  },
].map(column => ({ ...column, id: column.id || column.accessorKey as string}));
