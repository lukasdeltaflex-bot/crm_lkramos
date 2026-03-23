'use client';

import * as React from 'react';
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
  ColumnOrderState,
  ColumnSizingState,
  Header,
} from '@tanstack/react-table';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import type { Proposal, ProposalStatus, UserSettings } from '@/lib/types';
import { formatCurrency, cleanBankName, cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { ArrowUp, ArrowDown, Copy, GripVertical } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from '@/hooks/use-toast';
import { BankIcon } from '@/components/bank-icon';
import { 
  DndContext, 
  closestCenter, 
  KeyboardSensor, 
  PointerSensor, 
  useSensor, 
  useSensors, 
  DragEndEvent 
} from '@dnd-kit/core';
import { 
  SortableContext, 
  horizontalListSortingStrategy, 
  arrayMove, 
  useSortable 
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    try {
        const date = parseISO(dateString);
        if (isNaN(date.getTime())) return '-';
        return format(date, "dd/MM/yyyy", { locale: ptBR });
    } catch (e) {
        return '-';
    }
}

const DraggableHeader = ({ header }: { header: Header<Proposal, unknown> }) => {
    const { attributes, listeners, setNodeRef, transform, isDragging } = useSortable({
        id: header.column.id,
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
            className="relative p-0 h-12 transition-colors hover:bg-muted/50 border-b-2"
        >
            <div className="flex items-center gap-1 h-full px-3">
                <div
                    {...attributes}
                    {...listeners}
                    className="p-1 hover:bg-primary/10 rounded cursor-grab active:cursor-grabbing text-primary opacity-20 hover:opacity-100 transition-all"
                >
                    <GripVertical className="h-3 w-3" />
                </div>
                <div 
                    className="flex-1 flex items-center gap-1 cursor-pointer select-none font-black text-[10px] uppercase tracking-widest text-muted-foreground"
                    onClick={header.column.getToggleSortingHandler()}
                >
                    {flexRender(header.column.columnDef.header, header.getContext())}
                    {header.column.getIsSorted() === 'asc' && <ArrowUp className="h-3 w-3 text-primary" />}
                    {header.column.getIsSorted() === 'desc' && <ArrowDown className="h-3 w-3 text-primary" />}
                </div>
            </div>
            {header.column.getCanResize() && (
                <div
                    onMouseDown={header.getResizeHandler()}
                    onTouchStart={header.getResizeHandler()}
                    className={cn(
                        "absolute right-0 top-0 h-full w-1 cursor-col-resize select-none touch-none hover:bg-primary z-20",
                        header.column.getIsResizing() ? "bg-primary" : "bg-transparent"
                    )}
                />
            )}
        </TableHead>
    );
};

export function SimpleProposalsTable({ proposals, userSettings }: { proposals: Proposal[], userSettings: UserSettings | null }) {
  const [sorting, setSorting] = React.useState<SortingState>([
    { id: 'Data Digitação', desc: true }
  ]);
  const [columnOrder, setColumnOrder] = React.useState<ColumnOrderState>(['Data Digitação', 'Proposta nº', 'Produto', 'Banco', 'Valor Bruto', 'Status']);
  const [columnSizing, setColumnSizing] = React.useState<ColumnSizingState>({});
  const [isClient, setIsClient] = React.useState(false);

  // Carrega configurações salvas
  React.useEffect(() => {
    setIsClient(true);
    try {
        const savedOrder = localStorage.getItem('lk-customer-history-order');
        if (savedOrder) setColumnOrder(JSON.parse(savedOrder));
        
        const savedSizing = localStorage.getItem('lk-customer-history-sizing');
        if (savedSizing) setColumnSizing(JSON.parse(savedSizing));
    } catch (e) { console.warn("Error loading table settings", e); }
  }, []);

  // Salva configurações ao mudar
  React.useEffect(() => {
    if (isClient) {
        try {
            localStorage.setItem('lk-customer-history-order', JSON.stringify(columnOrder));
            localStorage.setItem('lk-customer-history-sizing', JSON.stringify(columnSizing));
        } catch (e) { console.warn("Error saving table settings", e); }
    }
  }, [columnOrder, columnSizing, isClient]);

  const columns = React.useMemo<ColumnDef<Proposal>[]>(() => [
    {
      id: 'Proposta nº',
      accessorKey: 'proposalNumber',
      header: 'Proposta nº',
      size: 150,
      cell: ({ row }) => {
          const val = row.original.proposalNumber;
          return (
              <div className="flex items-center gap-1 font-black text-sm">
                  <span>{val}</span>
                  <Button variant="ghost" size="icon" className="h-6 w-6 opacity-30 hover:opacity-100" onClick={(e) => {
                      e.stopPropagation();
                      navigator.clipboard.writeText(val);
                      toast({ title: 'Copiado!' });
                  }}>
                      <Copy className="h-3 w-3" />
                  </Button>
              </div>
          )
      }
    },
    {
      id: 'Produto',
      accessorKey: 'product',
      header: 'Produto',
      size: 120,
      cell: ({ row }) => <span className="text-xs font-bold text-muted-foreground/80">{row.original.product}</span>
    },
    {
      id: 'Banco',
      accessorKey: 'bank',
      header: 'Banco',
      size: 180,
      cell: ({ row }) => {
        const bank = row.original.bank;
        return (
          <div className="flex items-center gap-2">
            <BankIcon 
                bankName={bank} 
                domain={userSettings?.bankDomains?.[bank]} 
                showLogo={userSettings?.showBankLogos ?? true} 
                className="h-4 w-4" 
            />
            <span className="truncate text-[10px] font-black uppercase tracking-tight text-foreground">
              {cleanBankName(bank)}
            </span>
          </div>
        );
      }
    },
    {
      id: 'Valor Bruto',
      accessorKey: 'grossAmount',
      header: 'Valor Bruto',
      size: 130,
      cell: ({ row }) => (
        <div className="font-black text-sm text-primary">
            {formatCurrency(row.original.grossAmount)}
        </div>
      ),
    },
    {
      id: 'Status',
      accessorKey: 'status',
      header: 'Status',
      size: 140,
      cell: ({ row }) => {
          const status = row.original.status as ProposalStatus;
          return (
              <Badge variant="outline" className={cn("text-[9px] font-black uppercase px-3 py-1 rounded-full border-2", {
                  'border-green-500/30 text-green-600 bg-green-50': status === 'Pago',
                  'border-orange-500/30 text-orange-600 bg-orange-50': status === 'Saldo Pago',
                  'border-yellow-500/30 text-yellow-600 bg-yellow-50': status === 'Em Andamento',
                  'border-blue-500/30 text-blue-600 bg-blue-50': status === 'Aguardando Saldo',
                  'border-red-500/30 text-red-600 bg-red-50': status === 'Reprovado',
                  'border-purple-500/30 text-purple-600 bg-purple-50': status === 'Pendente',
                })}>
                  {status}
              </Badge>
          )
      }
    },
    {
      id: 'Data Digitação',
      accessorKey: 'dateDigitized',
      header: 'Data Digitação',
      size: 130,
      cell: ({ row }) => <span className="text-xs font-bold text-muted-foreground">{formatDate(row.original.dateDigitized)}</span>
    },
  ], [userSettings]);

  const table = useReactTable({
    data: proposals,
    columns,
    state: {
      sorting,
      columnOrder,
      columnSizing,
    },
    columnResizeMode: 'onChange',
    onSortingChange: setSorting,
    onColumnOrderChange: setColumnOrder,
    onColumnSizingChange: setColumnSizing,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor)
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (active && over && active.id !== over.id) {
      setColumnOrder((items) => {
        const oldIndex = items.indexOf(active.id as string);
        const newIndex = items.indexOf(over.id as string);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  return (
    <DndContext 
        sensors={sensors} 
        collisionDetection={closestCenter} 
        onDragEnd={handleDragEnd}
    >
      <div className="overflow-x-auto">
        <Table style={{ width: table.getTotalSize(), tableLayout: 'fixed' }}>
          <TableHeader className="bg-muted/30">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="hover:bg-transparent">
                <SortableContext items={columnOrder} strategy={horizontalListSortingStrategy}>
                    {headerGroup.headers.map((header) => (
                        <DraggableHeader key={header.id} header={header} />
                    ))}
                </SortableContext>
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  className="hover:bg-primary/[0.02] border-b transition-colors"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} style={{ width: cell.column.getSize() }} className="py-4">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-32 text-center text-[10px] font-black uppercase text-muted-foreground/40 tracking-[0.3em]"
                >
                  Nenhuma proposta registrada.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      
      <div className="flex items-center justify-between px-6 py-4 bg-muted/5 border-t">
        <p className="text-[10px] font-black uppercase text-muted-foreground/60 tracking-widest">
            {table.getRowModel().rows.length} REGISTROS NO HISTÓRICO
        </p>
        <div className="flex gap-2">
            <Button
                variant="outline"
                size="sm"
                className="h-8 rounded-full text-[10px] font-bold uppercase px-4 border-2"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
            >
                Anterior
            </Button>
            <Button
                variant="outline"
                size="sm"
                className="h-8 rounded-full text-[10px] font-bold uppercase px-4 border-2"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
            >
                Próximo
            </Button>
        </div>
      </div>
    </DndContext>
  );
}
