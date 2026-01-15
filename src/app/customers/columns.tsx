
'use client';

import { ColumnDef, Header } from '@tanstack/react-table';
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
import { MoreHorizontal, ArrowUpDown, GripVertical } from 'lucide-react';
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

interface ActionsCellProps {
  row: { original: Customer };
  onEdit: (customer: Customer) => void;
  onDelete: (customerId: string) => void;
}

const DraggableHeader = ({ header, children }: { header: Header<Customer, unknown>, children: React.ReactNode}) => {
    return (
      <div className="flex items-center gap-2">
        <div className={cn("h-6 w-6 cursor-grab p-1 rounded-md hover:bg-accent")}>
          <GripVertical />
        </div>
        {children}
      </div>
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
          <DropdownMenuItem onClick={() => onEdit(customer)}>
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
    accessorKey: 'name',
    id: 'name',
    header: ({ column, header }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            <DraggableHeader header={header}>
                Nome
            </DraggableHeader>
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
    cell: ({ row }) => {
        const customer = row.original;
        return (
            <Link href={`/customers/${customer.id}`} className="font-medium text-primary hover:underline">
                {customer.name}
            </Link>
        )
    }
  },
  {
    accessorKey: 'cpf',
    id: 'cpf',
    header: ({ header }) => <DraggableHeader header={header}>CPF</DraggableHeader>,
  },
  {
    accessorKey: 'phone',
    id: 'phone',
    header: ({ header }) => <DraggableHeader header={header}>Telefone</DraggableHeader>,
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
    header: ({ header }) => <DraggableHeader header={header}>Telefone 2</DraggableHeader>,
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
    header: ({ header }) => <DraggableHeader header={header}>Benefício</DraggableHeader>,
  },
  {
    accessorKey: 'city',
    id: 'city',
    header: ({ header }) => <DraggableHeader header={header}>Cidade</DraggableHeader>,
  },
  {
    accessorKey: 'state',
    id: 'state',
    header: ({ header }) => <DraggableHeader header={header}>Estado</DraggableHeader>,
  },
  {
    accessorKey: 'observations',
    id: 'observations',
    header: ({ header }) => <DraggableHeader header={header}>Observações</DraggableHeader>,
    cell: ({ row }) => {
        const obs = row.getValue('observations') as string;
        return <div className="truncate max-w-[200px]">{obs}</div>
    }
  },
  {
    id: 'actions',
    cell: (props) => <ActionsCell {...props} onEdit={onEdit} onDelete={onDelete} />,
    enableColumnOrdering: false,
  },
];
