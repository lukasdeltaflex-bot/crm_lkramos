
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
import { Separator } from '@/components/ui/separator';

const STORAGE_KEY_VISIBILITY = 'lk-ramos-customer-columns-visibility-v9';
const STORAGE_KEY_ORDER = 'lk-ramos-customer-columns-order-v9';
const STORAGE_KEY_SIZING = 'lk-ramos-customer-columns-sizing-v9';
const STORAGE_KEY_PAGESIZE = 'lk-ramos-customer-page-size-v5';


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
        if (savedVisibility) {
            setColumnVisibility(JSON.parse(savedVisibility));
        }
        const savedOrder = localStorage.getItem(STORAGE_KEY_ORDER);
        if (savedOrder) {
            setColumnOrder(JSON.parse(savedOrder));
        } else {
            setColumnOrder(initialColumns);
        }
        const savedSizing = localStorage.getItem(STORAGE_KEY_SIZING);
        if (savedSizing) {
            setColumnSizing(JSON.parse(savedSizing));
        }
        const savedPageSize = localStorage.getItem(STORAGE_KEY_PAGESIZE);
        if (savedPageSize) {
            setPagination(prev => ({ ...prev, pageSize: Number(savedPageSize) }));
        }
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
      <Card className="rounded-[2rem] border border-border/50 bg-card shadow-sm overflow-hidden p-2">
        <div className="py-2">
          <div className="flex items-center justify-between px-4 py-2 gap-4">
            <div className='relative w-full max-w-sm'>
                <Search className='absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground opacity-40' />
                <Input
                    placeholder="Busca (ID exato, nome, CPF...)"
                    value={globalFilter ?? ''}
                    onChange={(event) => setGlobalFilter(event.target.value)}
                    className="pl-10 w-full bg-muted/20 border-transparent h-10 rounded-full focus-visible:ring-primary/20 transition-all font-medium text-xs placeholder:text-muted-foreground/50"
                />
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="ml-auto rounded-full font-bold h-10 border-border/50 bg-card px-6 shadow-sm hover:bg-muted/50 transition-all text-xs text-muted-foreground">
                  Colunas <ChevronDown className="ml-2 h-4 w-4 opacity-50" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Personalizar Visão</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {table
                  .getAllColumns()
                  .filter((column) => column.getCanHide())
                  .map((column) => {
                    return (
                      <DropdownMenuCheckboxItem
                        key={column.id}
                        className="capitalize text-xs font-medium"
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
          
          <div className="rounded-2xl border-none overflow-hidden customers-table">
            <div className="overflow-x-auto">
                <Table style={{ width: table.getTotalSize(), tableLayout: 'fixed' }}>
                    <TableHeader>
                        {table.getHeaderGroups().map(headerGroup => (
                        <TableRow key={headerGroup.id} className="hover:bg-transparent border-b bg-muted/10">
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
                        Array.from({ length: 10 }).map((_, i) => (
                            <TableRow key={i}>
                            {columns.map((column, j) => (
                                <TableCell key={j}><Skeleton className="h-6 w-full" /></TableCell>
                            ))}
                            </TableRow>
                        ))
                        ) : table.getRowModel().rows?.length ? (
                        table.getRowModel().rows.map((row) => (
                            <TableRow
                            key={row.id}
                            data-state={row.getIsSelected() && 'selected'}
                            className="hover:bg-muted/5 transition-colors border-b last:border-0 h-12"
                            >
                            {row.getVisibleCells().map((cell) => (
                                <TableCell 
                                    key={cell.id} 
                                    style={{ width: cell.column.getSize() }}
                                    className={cn(cell.column.id === 'Selecionar' && 'px-0 text-center')}
                                >
                                {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                </TableCell>
                            ))}
                            </TableRow>
                        ))
                        ) : (
                        <TableRow>
                            <TableCell colSpan={columns.length} className="h-24 text-center text-muted-foreground font-medium italic">Nenhum cliente na base de dados.</TableCell>
                        </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
          </div>

          <div className="flex items-center justify-between px-6 py-4">
            <div className="flex-1 text-[10px] font-black uppercase text-muted-foreground/40 tracking-widest">
              {table.getFilteredSelectedRowModel().rows.length} de{' '}
              {table.getFilteredRowModel().rows.length} cliente(s) selecionados.
            </div>
            <div className="flex items-center space-x-6 lg:space-x-8">
                <div className="flex items-center space-x-2">
                    <p className="text-[10px] font-black uppercase text-muted-foreground/40">Linhas</p>
                    <Select
                        value={`${table.getState().pagination.pageSize}`}
                        onValueChange={(value) => table.setPageSize(Number(value))}
                    >
                        <SelectTrigger className="h-8 w-[70px] bg-card border-border/50 rounded-md text-xs">
                            <SelectValue placeholder={table.getState().pagination.pageSize} />
                        </SelectTrigger>
                        <SelectContent side="top">
                            {[10, 20, 50, 100].map((pageSize) => (
                                <SelectItem key={pageSize} value={`${pageSize}`}>{pageSize}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="flex items-center space-x-2">
                    <Button variant="outline" className="h-8 w-8 p-0 border-border/50" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}><ChevronLeft className="h-4 w-4" /></Button>
                    <div className="flex w-[80px] items-center justify-center text-[10px] font-black uppercase text-muted-foreground/40 tracking-tighter">Pág {table.getState().pagination.pageIndex + 1} de {table.getPageCount()}</div>
                    <Button variant="outline" className="h-8 w-8 p-0 border-border/50" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}><ChevronRight className="h-4 w-4" /></Button>
                </div>
            </div>
          </div>
        </div>
      </Card>
    </DndContext>
  );
});

CustomerDataTable.displayName = 'CustomerDataTable';
