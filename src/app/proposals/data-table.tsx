'use client';

import * as React from 'react';
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  useReactTable,
  RowSelectionState,
  Table as ReactTable,
  VisibilityState,
  SortingState,
  ColumnSizingState,
  ColumnOrderState,
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
import { parse, isValid, startOfDay, endOfDay, subDays, startOfMonth, format } from 'date-fns';
import type { DateRange } from 'react-day-picker';

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
import {
  Tabs,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
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
import { Card } from '@/components/ui/card';
import { Filter, X, Search, Calendar as CalendarIcon, ChevronDown, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import type { ProposalStatus, UserSettings } from '@/lib/types';
import { DraggableHeader } from './columns';
import type { ProposalWithCustomer } from './page';
import { Separator } from '@/components/ui/separator';
import { normalizeString, cn, formatCurrency } from '@/lib/utils';
import { useTheme } from '@/components/theme-provider';

interface DataTableProps {
  columns: ColumnDef<ProposalWithCustomer, unknown>[];
  data: ProposalWithCustomer[];
  rowSelection: RowSelectionState;
  setRowSelection: React.Dispatch<React.SetStateAction<RowSelectionState>>;
  onBulkStatusChange: (newStatus: ProposalStatus) => void;
  userSettings: UserSettings | null;
}

export interface ProposalsDataTableHandle {
  table: ReactTable<ProposalWithCustomer>;
}

export const ProposalsDataTable = React.forwardRef<ProposalsDataTableHandle, DataTableProps>(({
  columns,
  data,
  rowSelection,
  setRowSelection,
  onBulkStatusChange,
  userSettings,
}, ref) => {
  const { statusColors } = useTheme();
  const [statusFilter, setStatusFilter] = React.useState('Todos');
  const [globalFilter, setGlobalFilter] = React.useState('');
  const [startDateInput, setStartDateInput] = React.useState('');
  const [endDateInput, setEndDateInput] = React.useState('');
  const [appliedDateRange, setAppliedDateRange] = React.useState<DateRange | undefined>(undefined);
  const [columnSizing, setColumnSizing] = React.useState<ColumnSizingState>({});
  const [sorting, setSorting] = React.useState<SortingState>([]);
  
  const initialColumns = React.useMemo(() => columns.map(c => c.id!).filter(Boolean), [columns]);
  const [columnOrder, setColumnOrder] = React.useState<ColumnOrderState>(initialColumns);

  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({
      'Promotora': true,
      'No Proposta': true,
      'Cliente': true,
      'CPF': true,
      'Produto': true,
      'Valor Bruto': true,
      'Banco Digitado': true,
      'Status': true,
      'Operador': false,
      'Comissão': true,
      'Data Digitação': true,
      'Data Averbação': false,
      'Data Pgto. Cliente': false,
      'Chegada Saldo': false,
      'Actions': true
  });

  const sensors = useSensors(useSensor(PointerSensor), useSensor(KeyboardSensor));

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

  const filteredData = React.useMemo(() => {
    let list = data;
    
    if (statusFilter !== 'Todos') {
        list = list.filter(p => p.status === statusFilter);
    }

    if (appliedDateRange && appliedDateRange.from) {
        const fromDate = appliedDateRange.from;
        const toDate = appliedDateRange.to ? endOfDay(appliedDateRange.to) : endOfDay(appliedDateRange.from);
        
        list = list.filter(p => {
            const d = new Date(p.dateDigitized);
            return d >= fromDate && d <= toDate;
        });
    }

    if (globalFilter) {
        const lower = normalizeString(globalFilter);
        list = list.filter(p => 
            normalizeString(p.proposalNumber).includes(lower) ||
            normalizeString(p.customer?.name || '').includes(lower) ||
            normalizeString(p.customer?.cpf || '').includes(lower) ||
            normalizeString(p.bank).includes(lower) ||
            normalizeString(p.product).includes(lower) ||
            normalizeString(p.operator || '').includes(lower)
        );
    }
    
    return list;
  }, [data, statusFilter, globalFilter, appliedDateRange]);

  const table = useReactTable({
    data: filteredData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    onColumnSizingChange: setColumnSizing,
    onColumnOrderChange: setColumnOrder,
    onSortingChange: setSorting,
    enableColumnResizing: true,
    columnResizeMode: 'onChange',
    state: { sorting, globalFilter, rowSelection, columnVisibility, columnSizing, columnOrder },
    meta: { userSettings },
  });

  React.useImperativeHandle(ref, () => ({ table }));

  const selectedRows = table.getFilteredSelectedRowModel().rows;
  const allFilteredRows = table.getFilteredRowModel().rows;
  
  // Totais Inteligentes: Se houver seleção, mostra o total da seleção. Se não, mostra o total da lista filtrada.
  const displayRows = selectedRows.length > 0 ? selectedRows : allFilteredRows;

  const totalGross = React.useMemo(() => 
    displayRows.reduce((acc, row) => acc + (row.original.grossAmount || 0), 0),
  [displayRows]);

  const totalCommission = React.useMemo(() => 
    displayRows.reduce((acc, row) => acc + (row.original.commissionValue || 0), 0),
  [displayRows]);

  const handleDateInputChange = (value: string, type: 'start' | 'end') => {
    let v = value.replace(/\D/g, '').slice(0, 8);
    if (v.length >= 5) v = `${v.slice(0, 2)}/${v.slice(2, 4)}/${v.slice(4)}`;
    else if (v.length >= 3) v = `${v.slice(0, 2)}/${v.slice(2)}`;
    if (type === 'start') setStartDateInput(v);
    else setEndDateInput(v);
  };

  const handleApplyFilter = () => {
    const startDate = parse(startDateInput, 'dd/MM/yyyy', new Date());
    const endDate = parse(endDateInput, 'dd/MM/yyyy', new Date());
    if (isValid(startDate) && isValid(endDate)) {
        setAppliedDateRange({ from: startOfDay(startDate), to: endOfDay(endDate) });
    } else if (isValid(startDate)) {
        setAppliedDateRange({ from: startOfDay(startDate), to: endOfDay(startDate) });
    } else {
        setAppliedDateRange(undefined);
    }
  };

  return (
    <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd} sensors={sensors}>
        <div className="space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-4 bg-muted/10 dark:bg-zinc-900/30 p-2 rounded-xl border-2 border-zinc-200 dark:border-primary/20 shadow-sm">
                <Tabs value={statusFilter} onValueChange={setStatusFilter}>
                    <TabsList className="h-auto flex-wrap justify-start bg-transparent p-0 gap-1">
                        <TabsTrigger value="Todos" className="font-bold px-4 h-9">Todos</TabsTrigger>
                        {['Em Andamento', 'Aguardando Saldo', 'Pago', 'Saldo Pago', 'Pendente', 'Reprovado'].map(s => {
                            const colorValue = statusColors[s.toUpperCase()] || statusColors[s];
                            return (
                                <TabsTrigger 
                                    key={s} 
                                    value={s} 
                                    className="status-tab font-black uppercase text-[10px] tracking-widest px-4 h-9 border-2 border-transparent data-[state=active]:bg-background"
                                    style={colorValue ? { '--status-color': colorValue } as any : {}}
                                >
                                    {s}
                                </TabsTrigger>
                            );
                        })}
                    </TabsList>
                </Tabs>

                <div className="flex items-center gap-3 bg-background border-2 border-zinc-300 dark:border-primary/20 rounded-full px-3 py-1 shadow-sm ml-auto">
                    <Select onValueChange={(val) => {
                        const now = new Date();
                        let from: Date;
                        switch(val) {
                            case 'today': from = startOfDay(now); break;
                            case 'yesterday': from = startOfDay(subDays(now, 1)); break;
                            case 'week': from = startOfDay(subDays(now, 7)); break;
                            default: from = startOfMonth(now);
                        }
                        setStartDateInput(format(from, 'dd/MM/yyyy'));
                        setEndDateInput(format(now, 'dd/MM/yyyy'));
                        setAppliedDateRange({ from, to: now });
                    }}>
                        <SelectTrigger className="h-7 w-[120px] border-none bg-transparent focus:ring-0 text-xs font-black uppercase p-0">
                            <CalendarIcon className="mr-2 h-3 w-3 text-primary" />
                            <SelectValue placeholder="PERÍODO" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="today">Hoje</SelectItem>
                            <SelectItem value="yesterday">Ontem</SelectItem>
                            <SelectItem value="week">Últimos 7 dias</SelectItem>
                            <SelectItem value="month">Mês Atual</SelectItem>
                        </SelectContent>
                    </Select>
                    <Separator orientation="vertical" className="h-4 bg-zinc-300" />
                    <div className="flex items-center gap-1">
                        <Input 
                            placeholder="De" 
                            value={startDateInput}
                            onChange={(e) => handleDateInputChange(e.target.value, 'start')}
                            className="h-7 w-28 border-none bg-muted/40 text-[11px] text-center font-black rounded-full"
                        />
                        <span className="text-muted-foreground font-black">-</span>
                        <Input 
                            placeholder="Até" 
                            value={endDateInput}
                            onChange={(e) => handleDateInputChange(e.target.value, 'end')}
                            className="h-7 w-28 border-none bg-muted/40 text-[11px] text-center font-black rounded-full"
                        />
                    </div>
                    <Button size="sm" onClick={handleApplyFilter} className="h-7 bg-primary text-white rounded-full px-4 text-[10px] font-black uppercase transition-all shadow-md">
                        <Filter className="h-3 w-3 mr-1" /> Aplicar
                    </Button>
                </div>
            </div>

            <div className="flex items-center justify-between gap-4">
                <div className='relative w-full max-w-md group'>
                    <Search className='absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-primary opacity-80 group-focus-within:opacity-100 transition-opacity' />
                    <Input
                        placeholder="Busca Inteligente (Nome, CPF, Proposta...)"
                        value={globalFilter ?? ''}
                        onChange={(e) => setGlobalFilter(e.target.value)}
                        className="pl-10 h-11 bg-background border-2 border-zinc-300 dark:border-primary/40 rounded-full text-base font-bold shadow-md focus-visible:ring-primary/20 transition-all placeholder:text-muted-foreground/80"
                    />
                </div>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="h-11 rounded-full px-6 font-black border-2 border-zinc-300 dark:border-primary/20 bg-background shadow-md gap-2 text-xs uppercase tracking-widest">
                            Colunas <ChevronDown className="h-4 w-4 opacity-50" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56 shadow-2xl border-2">
                        <DropdownMenuLabel>Exibir/Ocultar</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        {table.getAllColumns().filter(c => c.getCanHide()).map(column => (
                            <DropdownMenuCheckboxItem
                                key={column.id}
                                className="capitalize text-xs font-bold"
                                checked={column.getIsVisible()}
                                onCheckedChange={v => column.toggleVisibility(!!v)}
                            >
                                {column.id}
                            </DropdownMenuCheckboxItem>
                        ))}
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            <Card className="proposals-table border-2 border-zinc-300 dark:border-primary/30 shadow-xl rounded-xl overflow-hidden bg-card p-1">
                <div className="p-0">
                    <div className="overflow-x-auto">
                        <Table style={{ width: table.getTotalSize(), tableLayout: 'fixed' }}>
                            <TableHeader className="bg-muted/40 dark:bg-zinc-900/60 border-b-2">
                                {table.getHeaderGroups().map(hg => (
                                    <TableRow key={hg.id} className="hover:bg-transparent">
                                        <SortableContext items={columnOrder} strategy={horizontalListSortingStrategy}>
                                            {hg.headers.map(h => <DraggableHeader key={h.id} header={h as any} />)}
                                        </SortableContext>
                                    </TableRow>
                                ))}
                            </TableHeader>
                            <TableBody>
                                {table.getRowModel().rows.length > 0 ? (
                                    table.getRowModel().rows.map(row => {
                                        const status = row.original.status;
                                        const colorValue = statusColors[status.toUpperCase()] || statusColors[status];
                                        return (
                                            <TableRow 
                                                key={row.id} 
                                                className={cn(
                                                    "transition-colors border-b h-14 hover:bg-primary/[0.03] dark:hover:bg-primary/5",
                                                    colorValue && "status-row-custom"
                                                )}
                                                style={colorValue ? { '--status-color': colorValue } as any : {}}
                                            >
                                                {row.getVisibleCells().map(cell => (
                                                    <TableCell 
                                                        key={cell.id} 
                                                        style={{ width: cell.column.getSize() }} 
                                                        className="p-3 text-sm border-none"
                                                    >
                                                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                                    </TableCell>
                                                ))}
                                            </TableRow>
                                        )
                                    })
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={columns.length} className="h-32 text-center text-muted-foreground font-black uppercase text-[10px] tracking-widest opacity-40">
                                            Nenhuma proposta encontrada.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </div>

                <div className="flex items-center justify-between px-6 py-4 border-t-2 bg-muted/10 font-black text-[11px] uppercase tracking-[0.1em] text-foreground/60">
                    <div className="flex items-center gap-4">
                        <div>
                            {table.getFilteredSelectedRowModel().rows.length} DE{' '}
                            {table.getFilteredRowModel().rows.length} SELECIONADOS.
                        </div>
                        <Separator orientation="vertical" className="h-4 bg-zinc-300 dark:bg-zinc-700" />
                        <div className="text-[#00AEEF] font-black">
                            VALOR BRUTO: <span className="text-foreground">{formatCurrency(totalGross)}</span>
                        </div>
                        <Separator orientation="vertical" className="h-4 bg-zinc-300 dark:bg-zinc-700" />
                        <div className="text-[#00AEEF] font-black">
                            COMISSÃO: <span className="text-foreground">{formatCurrency(totalCommission)}</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-2">
                            <span>LINHAS</span>
                            <Select
                                value={`${table.getState().pagination.pageSize}`}
                                onValueChange={(value) => table.setPageSize(Number(value))}
                            >
                                <SelectTrigger className="h-8 w-[70px] bg-background border-2 border-zinc-200 dark:border-zinc-800 rounded-full text-[10px] font-black shadow-sm">
                                    <SelectValue placeholder={table.getState().pagination.pageSize} />
                                </SelectTrigger>
                                <SelectContent side="top">
                                    {[10, 20, 50, 100].map((pageSize) => (
                                        <SelectItem key={pageSize} value={`${pageSize}`} className="text-[10px] font-black uppercase">{pageSize}</SelectItem>
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
            </Card>
        </div>
    </DndContext>
  );
});

ProposalsDataTable.displayName = 'ProposalsDataTable';
