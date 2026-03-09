'use client';

import * as React from 'react';
import {
  ColumnDef,
  ColumnOrderState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  RowSelectionState,
  Header,
  ColumnSizingState,
  Table as ReactTable,
  PaginationState,
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
import { ChevronDown, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Search } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { DraggableHeader } from './columns';
import type { Customer } from '@/lib/types';
import { normalizeString, cn } from '@/lib/utils';

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
  const tableContainerRef = React.useRef<HTMLDivElement>(null);
  const [sorting, setSorting] = React.useState<SortingState>([{ id: 'ID', desc: true }]);
  const [columnSizing, setColumnSizing] = React.useState<ColumnSizingState>({});
  const [globalFilter, setGlobalFilter] = React.useState('');
  const [isClient, setIsClient] = React.useState(false);

  const [pagination, setPagination] = React.useState<PaginationState>({ pageIndex: 0, pageSize: 10 });
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({
    'Telefone 2': true,
    'Cidade': true,
    'Estado': true,
    'Observações': false,
  });

  const initialColumns = React.useMemo(() => columns.map(c => c.id!).filter(Boolean), [columns]);
  const [columnOrder, setColumnOrder] = React.useState<ColumnOrderState>([...initialColumns]);

  React.useEffect(() => {
    setIsClient(true);
    try {
        const savedPageSize = localStorage.getItem('lk-customers-pageSize');
        if (savedPageSize) setPagination(p => ({ ...p, pageSize: Number(savedPageSize) }));

        const savedSearch = localStorage.getItem('lk-customers-filter-search');
        if (savedSearch) setGlobalFilter(savedSearch);

        const savedVisibility = localStorage.getItem('lk-customers-visibility');
        if (savedVisibility) setColumnVisibility(JSON.parse(savedVisibility));

        const savedSizing = localStorage.getItem('lk-customers-sizing');
        if (savedSizing) setColumnSizing(JSON.parse(savedSizing));

        const savedOrder = localStorage.getItem('lk-customers-order');
        if (savedOrder) {
            const parsedOrder = JSON.parse(savedOrder) as string[];
            const missingColumns = initialColumns.filter(id => !parsedOrder.includes(id));
            if (missingColumns.length > 0) {
                const newOrder = [...parsedOrder];
                const actionsIdx = newOrder.indexOf('Ações');
                if (actionsIdx !== -1) {
                    newOrder.splice(actionsIdx, 0, ...missingColumns);
                } else {
                    newOrder.push(...missingColumns);
                }
                setColumnOrder(newOrder);
            } else {
                setColumnOrder(parsedOrder);
            }
        } else {
            setColumnOrder([...initialColumns]);
        }
    } catch (e) {}
  }, [initialColumns]);

  const handlePaginationChange = (updater: any) => {
    setPagination((old) => {
      const next = typeof updater === 'function' ? updater(old) : updater;
      if (typeof window !== 'undefined') {
        try { localStorage.setItem('lk-customers-pageSize', String(next.pageSize)); } catch(e) {}
      }
      return next;
    });
  };

  React.useEffect(() => {
    if (isClient && columnOrder.length > 0) {
      try {
        localStorage.setItem('lk-customers-filter-search', globalFilter);
        localStorage.setItem('lk-customers-visibility', JSON.stringify(columnVisibility));
        localStorage.setItem('lk-customers-order', JSON.stringify(columnOrder));
        localStorage.setItem('lk-customers-sizing', JSON.stringify(columnSizing));
      } catch(e) {}
    }
  }, [globalFilter, columnVisibility, columnOrder, columnSizing, isClient]);

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
    autoResetPageIndex: false,
    enableColumnResizing: true,
    columnResizeMode: 'onChange',
    state: {
      sorting,
      globalFilter,
      columnVisibility,
      rowSelection,
      columnOrder,
      columnSizing,
      pagination,
    },
    globalFilterFn: (row, columnId, filterValue) => {
        const searchTerm = String(filterValue ?? '').trim();
        if (!searchTerm) return true;
        const customer = row.original;
        
        const searchDigits = searchTerm.replace(/\D/g, '');
        const cpfDigits = customer.cpf?.replace(/\D/g, '') || '';
        const phoneDigits = customer.phone?.replace(/\D/g, '') || '';

        // 🛡️ BUSCA NUCLEAR V13: Indexação de Smart Tags e IDs
        if (/^\d+$/.test(searchTerm)) {
            if (customer.numericId?.toString() === searchTerm) return true;
            if (searchTerm.length > 3) {
                if (cpfDigits.includes(searchTerm) || phoneDigits.includes(searchTerm)) return true;
            }
            return false;
        }

        if (searchDigits.length > 3) {
            if (cpfDigits.includes(searchDigits) || phoneDigits.includes(searchDigits)) return true;
        }

        const normalizedSearch = normalizeString(searchTerm);
        
        // 💎 INCLUI SMART TAGS NO ÍNDICE DE BUSCA DA TABELA
        const searchableFields = [
            customer.name,
            customer.cpf,
            customer.city,
            customer.email,
            customer.observations,
            ...(customer.tags || []),
            ...((customer as any).smartTags || []) 
        ];

        return searchableFields.some(field => {
            if (!field) return false;
            return normalizeString(String(field)).includes(normalizedSearch);
        });
      },
  });

  React.useImperativeHandle(ref, () => ({ table }));

  return (
    <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd} sensors={sensors}>
      <Card ref={tableContainerRef} className="rounded-[1.5rem] border-2 border-zinc-200 dark:border-primary/30 bg-card shadow-xl overflow-hidden p-1">
        <div className="py-2">
          <div className="flex items-center justify-between px-4 py-2 gap-4">
            <div className='relative w-full max-w-md group'>
                <Search className='absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-primary opacity-80 group-focus-within:opacity-100 transition-opacity' />
                <Input
                    placeholder="Busca por ID, Nome, CPF ou Smart Tag (ELITE, ATIVO...)"
                    value={globalFilter ?? ''}
                    onChange={(event) => setGlobalFilter(event.target.value)}
                    className="pl-11 w-full bg-background border-2 border-zinc-300 dark:border-primary/40 h-11 rounded-full shadow-md focus-visible:ring-primary/20 transition-all font-bold text-sm"
                />
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="ml-auto rounded-full font-black h-11 border-2 border-zinc-300 dark:border-primary/30 bg-background px-6 shadow-md text-xs uppercase tracking-widest">
                  Colunas <ChevronDown className="ml-2 h-4 w-4 opacity-50" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 shadow-2xl border-2">
                <DropdownMenuLabel>Personalizar Visão</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {table
                  .getAllColumns()
                  .filter((column) => column.getCanHide())
                  .map((column) => {
                    return (
                      <DropdownMenuCheckboxItem
                        key={column.id}
                        className="capitalize text-xs font-bold"
                        checked={column.getIsVisible()}
                        onCheckedChange={(value) => column.toggleVisibility(!!value)}
                      >
                        {column.id}
                      </DropdownMenuCheckboxItem>
                    );
                  })}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          
          <div className="customers-table">
            <div className="overflow-auto relative">
                <Table style={{ width: table.getTotalSize(), tableLayout: 'fixed' }}>
                    <TableHeader className="bg-background dark:bg-zinc-900 border-b-2">
                        {table.getHeaderGroups().map(headerGroup => (
                        <TableRow key={headerGroup.id} className="hover:bg-transparent border-b-2 border-zinc-200 dark:border-zinc-800">
                            <SortableContext items={columnOrder} strategy={horizontalListSortingStrategy}>
                            {headerGroup.headers.map(header => (
                                <DraggableHeader key={header.id} header={header as Header<Customer, unknown>} />
                            ))}
                            </SortableContext>
                        </TableRow>
                        ))}
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                        Array.from({ length: 8 }).map((_, i) => (
                            <TableRow key={i}>
                            {columns.map((column, j) => (
                                <TableCell key={j} className="p-3"><Skeleton className="h-5 w-full" /></TableCell>
                            ))}
                            </TableRow>
                        ))
                        ) : table.getRowModel().rows?.length ? (
                        table.getRowModel().rows.map((row) => (
                            <TableRow
                            key={row.id}
                            data-state={row.getIsSelected() && 'selected'}
                            className="hover:bg-primary/[0.03] transition-colors border-b h-12 cursor-default"
                            >
                            {row.getVisibleCells().map((cell) => (
                                <TableCell 
                                    key={cell.id} 
                                    style={{ width: cell.column.getSize() }}
                                    className="p-2 text-sm border-none"
                                >
                                {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                </TableCell>
                            ))}
                            </TableRow>
                        ))
                        ) : (
                        <TableRow>
                            <TableCell colSpan={columns.length} className="h-32 text-center text-muted-foreground font-black uppercase text-[10px] tracking-widest opacity-40">Nenhum cliente na base.</TableCell>
                        </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
          </div>

          <div className="flex items-center justify-between px-6 py-4 border-t-2 bg-muted/10 font-black text-[11px] uppercase tracking-[0.1em] text-foreground/60 min-h-[64px]">
            <div className="flex-1">
              {table.getFilteredSelectedRowModel().rows.length} DE{' '}
              {table.getFilteredRowModel().rows.length} SELECIONADOS.
            </div>
            <div className="flex items-center gap-6 lg:gap-8">
                <div className="flex items-center gap-2">
                    <p>LINHAS</p>
                    <Select
                        value={String(table.getState().pagination.pageSize)}
                        onValueChange={(value) => {
                            table.setPageSize(Number(value));
                        }}
                    >
                        <SelectTrigger className="h-8 w-[70px] border-none bg-transparent font-black p-0 focus:ring-0 shadow-none text-foreground">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border-2">
                            {[10, 20, 30, 40, 50, 100].map((pageSize) => (
                                <SelectItem key={pageSize} value={String(pageSize)} className="font-bold text-xs">
                                    {pageSize}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="text-primary font-black">
                    PÁG {table.getState().pagination.pageIndex + 1} DE {table.getPageCount()}
                </div>
                <div className="flex items-center gap-1">
                    <Button variant="outline" size="icon" className="h-8 w-8 rounded-full border-2" onClick={() => table.setPageIndex(0)} disabled={!table.getCanPreviousPage()}><ChevronsLeft className="h-4 w-4" /></Button>
                    <Button variant="outline" size="icon" className="h-8 w-8 rounded-full border-2" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}><ChevronLeft className="h-4 w-4" /></Button>
                    <Button variant="outline" size="icon" className="h-8 w-8 rounded-full border-2" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}><ChevronRight className="h-4 w-4" /></Button>
                    <Button variant="outline" size="icon" className="h-8 w-8 rounded-full border-2" onClick={() => table.setPageIndex(table.getPageCount() - 1)} disabled={!table.getCanNextPage()}><ChevronsRight className="h-4 w-4" /></Button>
                </div>
            </div>
          </div>
        </div>
      </Card>
    </DndContext>
  );
});

CustomerDataTable.displayName = 'CustomerDataTable';
