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
import { ChevronDown, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Search, Snowflake } from 'lucide-react';
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
  const topScrollRef = React.useRef<HTMLDivElement>(null);
  const isScrolling = React.useRef(false);

  const [sorting, setSorting] = React.useState<SortingState>([{ id: 'ID', desc: true }]);
  const [columnSizing, setColumnSizing] = React.useState<ColumnSizingState>({});
  const [globalFilter, setGlobalFilter] = React.useState('');
  const [frozenCount, setFrozenCount] = React.useState(2);
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
        const savedFrozen = localStorage.getItem('lk-customers-frozen-count');
        if (savedFrozen) setFrozenCount(Number(savedFrozen));

        const savedPageSize = localStorage.getItem('lk-customers-pageSize');
        if (savedPageSize) setPagination(p => ({ ...p, pageSize: Number(savedPageSize) }));

        const savedSearch = localStorage.getItem('lk-customers-filter-search');
        if (savedSearch) setGlobalFilter(savedSearch);

        const savedVisibility = localStorage.getItem('lk-customers-visibility');
        if (savedVisibility) setColumnVisibility(JSON.parse(savedVisibility));

        const savedOrder = localStorage.getItem('lk-customers-order');
        if (savedOrder) setColumnOrder(JSON.parse(savedOrder));
    } catch (e) {}
  }, []);

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
    if (isClient) {
      try {
        localStorage.setItem('lk-customers-frozen-count', String(frozenCount));
        localStorage.setItem('lk-customers-filter-search', globalFilter);
        localStorage.setItem('lk-customers-visibility', JSON.stringify(columnVisibility));
        localStorage.setItem('lk-customers-order', JSON.stringify(columnOrder));
      } catch(e) {}
    }
  }, [globalFilter, columnVisibility, columnOrder, frozenCount, isClient]);

  // 🛡️ MOTOR DE SINCRONIZAÇÃO V4 (BLOQUEIO DE RECURSIVIDADE VIA REFS)
  const syncScroll = (source: HTMLDivElement, target: HTMLDivElement) => {
    if (isScrolling.current) return;
    isScrolling.current = true;
    target.scrollLeft = source.scrollLeft;
    // Liberar após o frame de renderização
    requestAnimationFrame(() => {
        isScrolling.current = false;
    });
  };

  const handleTopScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (tableContainerRef.current) {
      syncScroll(e.currentTarget, tableContainerRef.current);
    }
  };

  const handleTableScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (topScrollRef.current) {
      syncScroll(e.currentTarget, topScrollRef.current);
    }
  };

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
    state: { sorting, globalFilter, columnVisibility, rowSelection, columnOrder, columnSizing, pagination },
    globalFilterFn: (row, columnId, filterValue) => {
        const searchTerm = String(filterValue ?? '').trim();
        if (!searchTerm) return true;
        
        const customer = row.original;
        const normalizedSearch = normalizeString(searchTerm);
        const isPureNumber = /^\d+$/.test(searchTerm);
        
        const numericIdStr = String(customer.numericId || '');
        const cpfNumeric = (customer.cpf || '').replace(/\D/g, '');

        if (isPureNumber) {
            if (numericIdStr === searchTerm) return true;
            if (cpfNumeric.startsWith(searchTerm)) return true;
            return false;
        }

        const searchableFields = [
            customer.name, 
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
      <Card className="rounded-[1.5rem] border-2 border-zinc-200 bg-card shadow-xl overflow-hidden p-1">
        <div className="py-2">
          <div className="flex items-center justify-between px-4 py-2 gap-4">
            <div className='relative w-full max-w-md group'>
                <Search className='absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-primary opacity-80' />
                <Input placeholder="Busca por ID exato, Nome, CPF..." value={globalFilter ?? ''} onChange={(e) => setGlobalFilter(e.target.value)} className="pl-11 w-full bg-background border-2 border-zinc-300 h-11 rounded-full shadow-md font-bold text-sm" />
            </div>
            
            <div className="flex items-center gap-3">
                <Select value={String(frozenCount)} onValueChange={(val) => setFrozenCount(Number(val))}>
                    <SelectTrigger className="h-10 min-w-[140px] rounded-full text-[10px] font-black uppercase border-2 border-zinc-300 bg-background shadow-sm">
                        <div className="flex items-center gap-2"><Snowflake className="h-3.5 w-3.5 text-blue-500" /><SelectValue placeholder="Congelar" /></div>
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="0" className="text-[10px] font-bold uppercase">Nenhuma fixa</SelectItem>
                        <SelectItem value="1" className="text-[10px] font-bold uppercase">Fixar 1ª Coluna</SelectItem>
                        <SelectItem value="2" className="text-[10px] font-bold uppercase">Fixar 2 Colunas</SelectItem>
                        <SelectItem value="3" className="text-[10px] font-bold uppercase">Fixar 3 Colunas</SelectItem>
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
                            <DropdownMenuCheckboxItem key={column.id} checked={column.getIsVisible()} onCheckedChange={v => column.toggleVisibility(!!v)} className="capitalize text-xs font-bold">{column.id}</DropdownMenuCheckboxItem>
                        ))}
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
          </div>
          
          <div 
            ref={topScrollRef}
            className="overflow-x-auto h-3 bg-muted/30 border-b cursor-pointer relative z-50"
            onScroll={handleTopScroll}
          >
            <div style={{ width: table.getTotalSize(), height: '1px' }} />
          </div>

          <div 
            ref={tableContainerRef}
            className="overflow-x-auto relative"
            onScroll={handleTableScroll}
          >
            <Table style={{ width: table.getTotalSize(), tableLayout: 'fixed' }}>
                <TableHeader className="bg-background border-b-2">
                    {table.getHeaderGroups().map(headerGroup => (
                    <TableRow key={headerGroup.id} className="hover:bg-transparent border-b-2">
                        <SortableContext items={columnOrder} strategy={horizontalListSortingStrategy}>
                        {headerGroup.headers.map((header, i) => (
                            <DraggableHeader 
                                key={header.id} 
                                header={header as Header<Customer, unknown>} 
                                className={cn(
                                    i === 0 && frozenCount >= 1 && "sticky left-0 z-40 bg-background shadow-[2px_0_5px_rgba(0,0,0,0.1)]",
                                    i === 1 && frozenCount >= 2 && "sticky left-[50px] z-40 bg-background shadow-[2px_0_5px_rgba(0,0,0,0.1)]",
                                    i === 2 && frozenCount >= 3 && "sticky left-[200px] z-40 bg-background shadow-[2px_0_5px_rgba(0,0,0,0.1)]"
                                )}
                            />
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
                        <TableRow key={row.id} data-state={row.getIsSelected() && 'selected'} className="hover:bg-primary/[0.03] transition-colors border-b h-12">
                        {row.getVisibleCells().map((cell, i) => (
                            <TableCell 
                                key={cell.id} 
                                style={{ width: cell.column.getSize() }}
                                className={cn(
                                    "p-2 text-sm border-none bg-background",
                                    i === 0 && frozenCount >= 1 && "sticky left-0 z-30 shadow-[2px_0_5px_rgba(0,0,0,0.05)]",
                                    i === 1 && frozenCount >= 2 && "sticky left-[50px] z-30 shadow-[2px_0_5px_rgba(0,0,0,0.05)]",
                                    i === 2 && frozenCount >= 3 && "sticky left-[200px] z-30 shadow-[2px_0_5px_rgba(0,0,0,0.05)]"
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
          </div>

          <div className="flex items-center justify-between px-6 py-4 border-t-2 bg-muted/10 font-black text-[11px] uppercase tracking-[0.1em] text-foreground/60 min-h-[64px]">
            <div className="flex items-center gap-4">
                <div>{table.getFilteredSelectedRowModel().rows.length} SELECIONADOS.</div>
            </div>
            <div className="flex items-center gap-6 lg:gap-8">
                <div className="flex items-center gap-2">
                    <span>LINHAS:</span>
                    <Select
                        value={String(table.getState().pagination.pageSize)}
                        onValueChange={(val) => table.setPageSize(Number(val))}
                    >
                        <SelectTrigger className="h-8 w-16 border-2 font-black text-[10px]">
                            <SelectValue />
                        </SelectTrigger>
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
                    <Button 
                        variant="outline" 
                        size="icon" 
                        className="h-9 w-9 rounded-full border-2 bg-background shadow-sm transition-all hover:bg-primary/5 active:scale-95" 
                        onClick={() => table.setPageIndex(0)} 
                        disabled={!table.getCanPreviousPage()}
                    >
                        <ChevronsLeft className="h-4 w-4" />
                    </Button>
                    <Button 
                        variant="outline" 
                        size="icon" 
                        className="h-9 w-9 rounded-full border-2 bg-background shadow-sm transition-all hover:bg-primary/5 active:scale-95" 
                        onClick={() => table.previousPage()} 
                        disabled={!table.getCanPreviousPage()}
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button 
                        variant="outline" 
                        size="icon" 
                        className="h-9 w-9 rounded-full border-2 bg-background shadow-sm transition-all hover:bg-primary/5 active:scale-95" 
                        onClick={() => table.nextPage()} 
                        disabled={!table.getCanNextPage()}
                    >
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                    <Button 
                        variant="outline" 
                        size="icon" 
                        className="h-9 w-9 rounded-full border-2 bg-background shadow-sm transition-all hover:bg-primary/5 active:scale-95" 
                        onClick={() => table.setPageIndex(table.getPageCount() - 1)} 
                        disabled={!table.getCanNextPage()}
                    >
                        <ChevronsRight className="h-4 w-4" />
                    </Button>
                </div>
            </div>
          </div>
        </div>
      </Card>
    </DndContext>
  );
});

CustomerDataTable.displayName = 'CustomerDataTable';