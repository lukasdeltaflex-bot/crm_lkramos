
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
import { ChevronDown, ChevronLeft, ChevronRight, Search } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { DraggableHeader } from './columns';
import type { Customer } from '@/lib/types';
import { normalizeString, cn } from '@/lib/utils';

const STORAGE_KEY_VISIBILITY = 'lk-ramos-customer-columns-visibility-v12';
const STORAGE_KEY_ORDER = 'lk-ramos-customer-columns-order-v12';
const STORAGE_KEY_SIZING = 'lk-ramos-customer-columns-sizing-v12';
const STORAGE_KEY_PAGESIZE = 'lk-ramos-customer-page-size-v12';

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
  const [sorting, setSorting] = React.useState<SortingState>([{ id: 'ID', desc: true }]);
  const [columnSizing, setColumnSizing] = React.useState<ColumnSizingState>({});
  const [globalFilter, setGlobalFilter] = React.useState('');
  const [isClient, setIsClient] = React.useState(false);

  const [pagination, setPagination] = React.useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });

  const defaultVisibility: VisibilityState = {
    'Telefone 2': false,
    'Cidade': false,
    'Estado': false,
    'Observações': false,
  };
  const initialColumns = React.useMemo(() => columns.map(c => c.id!).filter(Boolean), [columns]);

  const [columnOrder, setColumnOrder] = React.useState<ColumnOrderState>([...initialColumns]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>(defaultVisibility);
    
  React.useEffect(() => {
    setIsClient(true);
    try {
        const savedVisibility = localStorage.getItem(STORAGE_KEY_VISIBILITY);
        if (savedVisibility) setColumnVisibility(JSON.parse(savedVisibility));
        
        const savedOrder = localStorage.getItem(STORAGE_KEY_ORDER);
        if (savedOrder) setColumnOrder(JSON.parse(savedOrder));
        else setColumnOrder(initialColumns);
        
        const savedSizing = localStorage.getItem(STORAGE_KEY_SIZING);
        if (savedSizing) setColumnSizing(JSON.parse(savedSizing));
        
        const savedPageSize = localStorage.getItem(STORAGE_KEY_PAGESIZE);
        if (savedPageSize) setPagination(prev => ({ ...prev, pageSize: Number(savedPageSize) }));
    } catch (e) {
        setColumnOrder(initialColumns);
    }
  }, [initialColumns]);

  React.useEffect(() => {
    if (isClient) {
        localStorage.setItem(STORAGE_KEY_VISIBILITY, JSON.stringify(columnVisibility));
        localStorage.setItem(STORAGE_KEY_ORDER, JSON.stringify(columnOrder));
        localStorage.setItem(STORAGE_KEY_SIZING, JSON.stringify(columnSizing));
        localStorage.setItem(STORAGE_KEY_PAGESIZE, String(pagination.pageSize));
    }
  }, [columnVisibility, columnOrder, columnSizing, pagination.pageSize, isClient]);

  const sensors = useSensors(
    useSensor(PointerSensor),
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
    onPaginationChange: setPagination,
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
        const searchTerm = normalizeString(String(filterValue ?? ''));
        if (!searchTerm) return true;
        const customer = row.original;
        const fieldsToSearch = [
            customer.name,
            customer.cpf,
            customer.phone,
            customer.phone2,
            customer.city,
            customer.state,
            customer.email,
            customer.observations,
            ...(customer.benefits?.map(b => b.number) || [])
        ];
        return fieldsToSearch.some(field => field && normalizeString(field).includes(searchTerm));
      },
  });

  React.useImperativeHandle(ref, () => ({ table }));

  return (
    <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd} sensors={sensors}>
      <Card className="rounded-[1.5rem] border-2 border-zinc-200 dark:border-primary/30 bg-card shadow-xl overflow-hidden p-1">
        <div className="py-2">
          <div className="flex items-center justify-between px-4 py-2 gap-4">
            <div className='relative w-full max-w-sm group'>
                <Search className='absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-primary opacity-80 group-focus-within:opacity-100 transition-opacity' />
                <Input
                    placeholder="Busca Inteligente (Nome, CPF, ID...)"
                    value={globalFilter ?? ''}
                    onChange={(event) => setGlobalFilter(event.target.value)}
                    className="pl-11 w-full bg-background border-2 border-zinc-300 dark:border-primary/40 h-11 rounded-full focus-visible:ring-primary/20 shadow-md transition-all font-bold text-sm placeholder:text-muted-foreground/80"
                />
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="ml-auto rounded-full font-black h-11 border-2 border-zinc-300 dark:border-primary/30 bg-background px-6 shadow-md hover:bg-muted/50 transition-all text-[10px] uppercase tracking-widest">
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
            <div className="overflow-x-auto">
                <Table style={{ width: table.getTotalSize(), tableLayout: 'fixed' }}>
                    <TableHeader>
                        {table.getHeaderGroups().map(headerGroup => (
                        <TableRow key={headerGroup.id} className="hover:bg-transparent border-b-2 bg-muted/40 dark:bg-zinc-900/60">
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
                            className="hover:bg-primary/[0.03] dark:hover:bg-primary/5 transition-colors border-b h-12"
                            >
                            {row.getVisibleCells().map((cell) => (
                                <TableCell 
                                    key={cell.id} 
                                    style={{ width: cell.column.getSize() }}
                                    className={cn(
                                        "p-2 text-sm border-zinc-100 dark:border-zinc-800/50",
                                        cell.column.id === 'Selecionar' && 'px-0 text-center'
                                    )}
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

          <div className="flex items-center justify-between px-6 py-3 border-t-2 bg-muted/10">
            <div className="flex-1 text-[10px] font-black uppercase text-foreground/40 tracking-widest">
              {table.getFilteredSelectedRowModel().rows.length} de{' '}
              {table.getFilteredRowModel().rows.length} selecionados
            </div>
            <div className="flex items-center space-x-6 lg:space-x-8">
                <div className="flex items-center space-x-2">
                    <p className="text-[10px] font-black uppercase text-foreground/40">Linhas</p>
                    <Select
                        value={`${table.getState().pagination.pageSize}`}
                        onValueChange={(value) => table.setPageSize(Number(value))}
                    >
                        <SelectTrigger className="h-8 w-[70px] bg-background border-2 border-zinc-200 rounded-md text-xs font-bold">
                            <SelectValue placeholder={table.getState().pagination.pageSize} />
                        </SelectTrigger>
                        <SelectContent side="top">
                            {[10, 20, 50].map((pageSize) => (
                                <SelectItem key={pageSize} value={`${pageSize}`}>{pageSize}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="flex items-center space-x-2">
                    <Button variant="outline" className="h-8 w-8 p-0 border-2" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}><ChevronLeft className="h-4 w-4" /></Button>
                    <div className="flex w-[80px] items-center justify-center text-[10px] font-black uppercase text-foreground/60 tracking-tighter">Pág {table.getState().pagination.pageIndex + 1} / {table.getPageCount()}</div>
                    <Button variant="outline" className="h-8 w-8 p-0 border-2" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}><ChevronRight className="h-4 w-4" /></Button>
                </div>
            </div>
          </div>
        </div>
      </Card>
    </DndContext>
  );
});

CustomerDataTable.displayName = 'CustomerDataTable';
