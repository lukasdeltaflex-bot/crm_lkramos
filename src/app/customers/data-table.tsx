'use client';

import * as React from 'react';
import {
  ColumnDef,
  ColumnOrderState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  RowSelectionState,
  Header,
  ColumnSizingState,
  Table as ReactTable,
  PaginationState,
  getFilteredRowModel,
} from '@tanstack/react-table';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
  } from '@dnd-kit/core';
  import { SortableContext, horizontalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';

import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { ChevronDown, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Search, Snowflake } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { DraggableHeader } from './columns';
import type { Customer } from '@/lib/types';
import { normalizeString, cn } from '@/lib/utils';
import { useUser } from '@/firebase';
import { safeStorage } from '@/lib/storage-utils';

const COLUMN_LABELS: Record<string, string> = {
    col_select: "Seleção",
    col_id: "ID",
    col_name: "Nome",
    col_cpf: "CPF",
    col_phone: "Telefone",
    col_phone2: "Telefone 2",
    col_tags: "Etiquetas",
    col_city: "Cidade",
    col_state: "Estado",
    col_obs: "Observações",
    col_actions: "Ações"
};

interface DataTableProps {
  columns: ColumnDef<Customer, unknown>[];
  data: Customer[];
  isLoading: boolean;
  rowSelection: RowSelectionState;
  setRowSelection: React.Dispatch<React.SetStateAction<RowSelectionState>>;
}

export interface CustomerDataTableHandle {
  table: ReactTable<Customer>;
}

export const CustomerDataTable = React.forwardRef<CustomerDataTableHandle, DataTableProps>(({
  columns,
  data,
  isLoading,
  rowSelection,
  setRowSelection,
}, ref) => {
  const { user } = useUser();
  const [sorting, setSorting] = React.useState<SortingState>([{ id: 'col_id', desc: true }]);
  const [columnSizing, setColumnSizing] = React.useState<ColumnSizingState>({});
  const [globalFilter, setGlobalFilter] = React.useState('');
  const [localGlobalFilter, setLocalGlobalFilter] = React.useState('');
  const [frozenCount, setFrozenCount] = React.useState(2);
  const [isClient, setIsClient] = React.useState(false);
  const [isLoaded, setIsLoaded] = React.useState(false);

  React.useEffect(() => {
      const timeoutId = setTimeout(() => {
          setGlobalFilter(localGlobalFilter);
      }, 300);
      return () => clearTimeout(timeoutId);
  }, [localGlobalFilter]);

  const [pagination, setPagination] = React.useState<PaginationState>({ pageIndex: 0, pageSize: 10 });
  
  const initialIds = React.useMemo(() => columns.map(c => c.id!).filter(Boolean), [columns]);
  const [columnOrder, setColumnOrder] = React.useState<ColumnOrderState>(initialIds);

  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({
    'col_phone2': true,
    'col_city': true,
    'col_state': true,
    'col_obs': false,
  });

  const handlePaginationChange = (updater: any) => {
    setPagination((old) => {
      const next = typeof updater === 'function' ? updater(old) : updater;
      return next;
    });
  };

  // 🛡️ CARREGAMENTO BLINDADO DE PREFERÊNCIAS
  React.useEffect(() => {
    if (!user?.uid) return; // 🛡️ Evita crash no usuário externo
    setIsClient(true);
    const prefix = user.uid;
    
    setFrozenCount(safeStorage.get(`${prefix}-cust-frozen`, 2));
    setColumnVisibility(safeStorage.get(`${prefix}-cust-visibility`, columnVisibility));
    setColumnSizing(safeStorage.get(`${prefix}-cust-sizing`, {}));
    
    const savedPageSize = safeStorage.get(`${prefix}-cust-pageSize`, 10);
    setPagination(p => ({ ...p, pageSize: savedPageSize }));

    const savedOrder = safeStorage.get<string[]>(`${prefix}-cust-order`, []);
    if (savedOrder.length > 0) {
        const validOrder = savedOrder.filter(id => initialIds.includes(id));
        const missingIds = initialIds.filter(id => !validOrder.includes(id));
        setColumnOrder([...validOrder, ...missingIds]);
    }

    setIsLoaded(true);
  }, [initialIds, user?.uid]);

  // 🛡️ SALVAMENTO DE PREFERÊNCIAS
  React.useEffect(() => {
    if (isClient && isLoaded && user?.uid) {
      const prefix = user.uid;
      safeStorage.set(`${prefix}-cust-frozen`, frozenCount);
      safeStorage.set(`${prefix}-cust-visibility`, columnVisibility);
      safeStorage.set(`${prefix}-cust-order`, columnOrder);
      safeStorage.set(`${prefix}-cust-sizing`, columnSizing);
      safeStorage.set(`${prefix}-cust-pageSize`, pagination.pageSize);
    }
  }, [columnVisibility, columnOrder, columnSizing, frozenCount, isClient, pagination.pageSize, isLoaded, user?.uid]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor)
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (active.id !== over?.id) {
      setColumnOrder((items) => {
        const oldIndex = items.indexOf(active.id as string);
        const newIndex = items.indexOf(over!.id as string);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const table = useReactTable({
    data,
    columns,
    getRowId: (row) => row.id,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    onGlobalFilterChange: setGlobalFilter,
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    onColumnOrderChange: setColumnOrder,
    onColumnSizingChange: setColumnSizing,
    onPaginationChange: handlePaginationChange,
    enableColumnResizing: true,
    columnResizeMode: 'onChange',
    state: { sorting, globalFilter, rowSelection, columnOrder, columnSizing, pagination, columnVisibility },
    globalFilterFn: (row, columnId, filterValue) => {
        const searchTerm = String(filterValue ?? '').trim();
        if (!searchTerm) return true;
        const customer = row.original;
        const normalizedSearch = normalizeString(searchTerm);
        const isPureNumber = /^\d+$/.test(searchTerm);
        if (isPureNumber) {
            if (String(customer.numericId) === searchTerm) return true;
            const cpfNumeric = (customer.cpf || '').replace(/\D/g, '');
            if (cpfNumeric.startsWith(searchTerm)) return true;
            return false;
        }
        const searchableFields = [customer.name, customer.city, customer.email, customer.observations, ...(customer.tags || []), ...((customer as any).smartTags || [])];
        return searchableFields.some(field => field && normalizeString(String(field)).includes(normalizedSearch));
    },
  });

  React.useImperativeHandle(ref, () => ({ table }));

  const totalTableWidth = table.getTotalSize();

  const columnOffsets = React.useMemo(() => {
    const visibleColumns = table.getVisibleLeafColumns();
    const offsets: Record<string, number> = {};
    let currentOffset = 0;
    visibleColumns.forEach(col => {
        offsets[col.id] = currentOffset;
        currentOffset += col.getSize();
    });
    return offsets;
  }, [table.getVisibleLeafColumns(), columnSizing]);

  if (!isClient) return <div className="h-96 w-full bg-muted/10 animate-pulse rounded-xl" />;

  return (
    <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd} sensors={sensors}>
      <Card className="rounded-[1.5rem] border-2 border-zinc-200 bg-card shadow-xl overflow-hidden p-1">
        <div className="py-2">
          <div className="flex items-center justify-between px-4 py-2 gap-4">
            <div className='relative w-full max-md group'>
                <Search className='absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-primary opacity-80' />
                <Input placeholder="Busca por ID exato, Nome, CPF..." value={localGlobalFilter ?? ''} onChange={(e) => setLocalGlobalFilter(e.target.value)} className="pl-11 w-full bg-background border-2 border-zinc-300 h-11 rounded-full shadow-md font-bold text-sm" />
            </div>
            <div className="flex items-center gap-3">
                <Select value={String(frozenCount)} onValueChange={(val) => setFrozenCount(Number(val))}>
                    <SelectTrigger className="h-10 min-w-[140px] rounded-full text-[10px] font-black uppercase border-2 border-zinc-300 bg-background shadow-sm">
                        <div className="flex items-center gap-2"><Snowflake className="h-3.5 w-3.5 text-blue-500" /><SelectValue placeholder="Congelar" /></div>
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="0" className="text-[10px] font-bold uppercase">Nenhuma fixa</SelectItem>
                        <SelectItem value="1" className="text-[10px] font-bold uppercase">Fixar 1° Coluna</SelectItem>
                        <SelectItem value="2" className="text-[10px] font-bold uppercase">Fixar 2° Colunas</SelectItem>
                        <SelectItem value="3" className="text-[10px] font-bold uppercase">Fixar 3° Colunas</SelectItem>
                    </SelectContent>
                </Select>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="rounded-full font-black h-11 border-2 border-zinc-300 bg-background px-6 shadow-md text-xs uppercase tracking-widest">
                        Colunas <ChevronDown className="ml-2 h-4 w-4 opacity-50" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56 shadow-2xl border-2">
                        <DropdownMenuLabel>Personalizar Visão</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        {table.getAllColumns().filter(c => c.getCanHide()).map(column => (
                            <DropdownMenuCheckboxItem key={column.id} checked={column.getIsVisible()} onCheckedChange={v => column.toggleVisibility(!!v)} className="capitalize text-xs font-bold">
                                {COLUMN_LABELS[column.id] || column.id}
                            </DropdownMenuCheckboxItem>
                        ))}
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
          </div>
          
          <ScrollArea className="h-[calc(100vh-280px)] w-full relative scroll-area-priority">
            <Table style={{ width: totalTableWidth, tableLayout: 'fixed' }}>
                <TableHeader className="bg-background border-b-2 sticky top-0 z-50 shadow-sm">
                    {table.getHeaderGroups().map(headerGroup => (
                    <TableRow key={headerGroup.id} className="hover:bg-transparent border-b-2">
                        <SortableContext items={columnOrder} strategy={horizontalListSortingStrategy}>
                        {headerGroup.headers.map((header, i) => (
                            <DraggableHeader 
                                key={header.id} 
                                header={header as Header<Customer, unknown>} 
                                className={cn(
                                    i < frozenCount && "sticky z-40 bg-background shadow-[4px_0_10px_rgba(0,0,0,0.12)] border-r-2"
                                )}
                                style={i < frozenCount ? { left: `${columnOffsets[header.id]}px` } : {}}
                            />
                        ))}
                        </SortableContext>
                    </TableRow>
                    ))}
                </TableHeader>
                <TableBody>
                    {isLoading ? (
                    Array.from({ length: 15 }).map((_, i) => (
                        <TableRow key={i}>
                        {columns.map((column, j) => (
                            <TableCell key={j} className="p-3"><Skeleton className="h-5 w-full" /></TableCell>
                        ))}
                        </TableRow>
                    ))
                    ) : table.getRowModel().rows?.length ? (
                    table.getRowModel().rows.map((row) => (
                        <TableRow key={row.id} data-state={row.getIsSelected() && 'selected'} className="hover:bg-primary/[0.03] transition-colors border-b h-12">
                        {row.getVisibleCells().map((cell, i) => (
                            <TableCell 
                                key={cell.id} 
                                style={i < frozenCount ? { width: cell.column.getSize(), left: `${columnOffsets[cell.column.id]}px` } : { width: cell.column.getSize() }}
                                className={cn(
                                    "p-2 text-sm border-none bg-background",
                                    i < frozenCount && "sticky z-30 shadow-[4px_0_10px_rgba(0,0,0,0.08)] border-r-2"
                                )}
                            >
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                            </TableCell>
                        ))}
                        </TableRow>
                    ))
                    ) : (
                    <TableRow><TableCell colSpan={columns.length} className="h-32 text-center text-muted-foreground font-black uppercase text-[10px] tracking-widest opacity-40">Nenhum cliente na base.</TableCell></TableRow>
                    )}
                </TableBody>
            </Table>
            <ScrollBar orientation="horizontal" />
            <ScrollBar orientation="vertical" />
          </ScrollArea>

          <div className="flex items-center justify-between px-6 py-4 border-t-2 bg-muted/10 font-black text-[11px] uppercase tracking-[0.1em] text-foreground/60 min-h-[64px]">
            <div className="flex items-center gap-4">
                <div>{table.getFilteredSelectedRowModel().rows.length} SELECIONADOS.</div>
            </div>
            <div className="flex items-center gap-6 lg:gap-8">
                <div className="flex items-center gap-2">
                    <span>LINHAS:</span>
                    <Select value={String(table.getState().pagination.pageSize)} onValueChange={(val) => table.setPageSize(Number(val))}>
                        <SelectTrigger className="h-8 w-16 border-2 font-black text-[10px]"><SelectValue /></SelectTrigger>
                        <SelectContent>
                            {[10, 20, 30, 50, 100].map(size => (
                                <SelectItem key={size} value={String(size)} className="text-[10px] font-bold">{size}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="text-primary font-black uppercase text-[11px] tracking-widest">
                    PÁG {table.getState().pagination.pageIndex + 1} DE {table.getPageCount()}
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="icon" className="h-9 w-9 rounded-full border-2 bg-background shadow-sm transition-all hover:bg-primary/5 active:scale-95" onClick={() => table.setPageIndex(0)} disabled={!table.getCanPreviousPage()}><ChevronsLeft className="h-4 w-4" /></Button>
                    <Button variant="outline" size="icon" className="h-9 w-9 rounded-full border-2 bg-background shadow-sm transition-all hover:bg-primary/5 active:scale-95" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}><ChevronLeft className="h-4 w-4" /></Button>
                    <Button variant="outline" size="icon" className="h-9 w-9 rounded-full border-2 bg-background shadow-sm transition-all hover:bg-primary/5 active:scale-95" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}><ChevronRight className="h-4 w-4" /></Button>
                    <Button variant="outline" size="icon" className="h-9 w-9 rounded-full border-2 bg-background shadow-sm transition-all hover:bg-primary/5 active:scale-95" onClick={() => table.setPageIndex(table.getPageCount() - 1)} disabled={!table.getCanNextPage()}><ChevronsRight className="h-4 w-4" /></Button>
                </div>
            </div>
          </div>
        </div>
      </Card>
    </DndContext>
  );
});

CustomerDataTable.displayName = 'CustomerDataTable';
