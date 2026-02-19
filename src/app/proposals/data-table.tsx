'use client';

import * as React from 'react';
import {
  ColumnDef,
  ColumnFiltersState,
  RowSelectionState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  ColumnOrderState,
  ColumnSizingState,
  Table as ReactTable,
  PaginationState,
  Header
} from '@tanstack/react-table';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensors,
    DragEndEvent,
    useSensor,
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
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ChevronDown, ChevronsUpDown, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Filter, X, Search, Calendar as CalendarIcon } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { proposalStatuses } from '@/lib/config-data';
import type { ProposalStatus, Proposal, UserSettings } from '@/lib/types';
import { DraggableHeader } from './columns';
import type { ProposalWithCustomer } from './page';
import { Separator } from '@/components/ui/separator';
import { formatCurrency, normalizeString, cn } from '@/lib/utils';
import { parse, isValid, startOfDay, endOfDay, subDays, startOfMonth, subMonths, endOfMonth } from 'date-fns';
import type { DateRange } from 'react-day-picker';
import { useTheme } from '@/components/theme-provider';
import { useSearchParams } from 'next/navigation';

const STORAGE_KEY_VISIBILITY = 'lk-ramos-proposal-columns-visibility-v5';
const STORAGE_KEY_ORDER = 'lk-ramos-proposal-columns-order-v5';
const STORAGE_KEY_SIZING = 'lk-ramos-proposal-columns-sizing-v5';
const STORAGE_KEY_PAGESIZE = 'lk-ramos-proposal-financial-page-size-v1';

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
  const { statusColors, containerStyle } = useTheme();
  const searchParams = useSearchParams();
  const searchFromUrl = searchParams.get('search');

  const [sorting, setSorting] = React.useState<SortingState>([{ id: 'dateDigitized', desc: true }]);
  const [columnSizing, setColumnSizing] = React.useState<ColumnSizingState>({});
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [pagination, setPagination] = React.useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });
  const [statusFilter, setStatusFilter] = React.useState('Todos');
  const [globalFilter, setGlobalFilter] = React.useState(searchFromUrl || '');
  const [isClient, setIsClient] = React.useState(false);
  const [startDateInput, setStartDateInput] = React.useState('');
  const [endDateInput, setEndDateInput] = React.useState('');
  const [appliedDateRange, setAppliedDateRange] = React.useState<DateRange | undefined>(undefined);
  
  const defaultVisibility: VisibilityState = {
      dateApproved: false,
      datePaidToClient: false,
      debtBalanceArrivalDate: false,
      operator: false,
      commissionValue: false,
      customerCpf: false,
  };
  const initialOrder = React.useMemo(() => columns.map(c => c.id!), [columns]);

  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>(defaultVisibility);
  const [columnOrder, setColumnOrder] = React.useState<ColumnOrderState>(initialOrder);
  
  React.useEffect(() => {
    setIsClient(true);
    if (typeof window !== 'undefined') {
        const savedVisibility = localStorage.getItem(STORAGE_KEY_VISIBILITY);
        if (savedVisibility) {
            try { setColumnVisibility(JSON.parse(savedVisibility)); } catch (e) {}
        }
        const savedOrder = localStorage.getItem(STORAGE_KEY_ORDER);
        if (savedOrder) {
            try { setColumnOrder(JSON.parse(savedOrder)); } catch (e) {}
        }
        const savedSizing = localStorage.getItem(STORAGE_KEY_SIZING);
        if (savedSizing) {
            try { setColumnSizing(JSON.parse(savedSizing)); } catch (e) {}
        }
        const savedPageSize = localStorage.getItem(STORAGE_KEY_PAGESIZE);
        if (savedPageSize) {
          setPagination(prev => ({ ...prev, pageSize: Number(savedPageSize) }));
        }
    }
  }, []);

  React.useEffect(() => {
    if (searchFromUrl) {
      setGlobalFilter(searchFromUrl);
      setStatusFilter('Todos');
    }
  }, [searchFromUrl]);


  React.useEffect(() => {
    if (isClient) localStorage.setItem(STORAGE_KEY_VISIBILITY, JSON.stringify(columnVisibility));
  }, [columnVisibility, isClient]);

  React.useEffect(() => {
    if (isClient) localStorage.setItem(STORAGE_KEY_ORDER, JSON.stringify(columnOrder));
  }, [columnOrder, isClient]);

  React.useEffect(() => {
    if (isClient) localStorage.setItem(STORAGE_KEY_SIZING, JSON.stringify(columnSizing));
  }, [columnSizing, isClient]);

  React.useEffect(() => {
    if (isClient) localStorage.setItem(STORAGE_KEY_PAGESIZE, String(pagination.pageSize));
  }, [pagination.pageSize, isClient]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor)
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over?.id) {
      setColumnOrder((items) => {
        const oldIndex = items.indexOf(active.id as string);
        const newIndex = items.indexOf(over!.id as string);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const handleDateInputChange = (value: string, type: 'start' | 'end') => {
    let v = value.replace(/\D/g, '').slice(0, 8);
    if (v.length >= 5) {
      v = `${v.slice(0, 2)}/${v.slice(2, 4)}/${v.slice(4)}`;
    } else if (v.length >= 3) {
      v = `${v.slice(0, 2)}/${v.slice(2)}`;
    }
    
    if (type === 'start') setStartDateInput(v);
    else setEndDateInput(v);
  };

  const applyRange = (range: 'today' | 'yesterday' | 'week' | 'month' | 'lastMonth') => {
    const now = new Date();
    let from: Date;
    let to: Date = now;
    switch (range) {
        case 'today': from = startOfDay(now); break;
        case 'yesterday': from = startOfDay(subDays(now, 1)); to = endOfDay(subDays(now, 1)); break;
        case 'week': from = startOfDay(subDays(now, 7)); break;
        case 'month': from = startOfMonth(now); break;
        case 'lastMonth': from = startOfMonth(subMonths(now, 1)); to = endOfMonth(subMonths(now, 1)); break;
        default: return;
    }
    setStartDateInput(from.toLocaleDateString('pt-BR'));
    setEndDateInput(to.toLocaleDateString('pt-BR'));
    setAppliedDateRange({ from, to });
  };

  const handleApplyFilter = () => {
    const startDate = parse(startDateInput, 'dd/MM/yyyy', new Date());
    const endDate = parse(endDateInput, 'dd/MM/yyyy', new Date());
    const isValidStart = isValid(startDate) && startDateInput.length === 10;
    const isValidEnd = isValid(endDate) && endDateInput.length === 10;

    if (isValidStart && isValidEnd) {
        setAppliedDateRange({ from: startOfDay(startDate), to: endOfDay(endDate) });
    } else if (isValidStart) {
        setAppliedDateRange({ from: startOfDay(startDate), to: endOfDay(startDate) });
    } else {
        setAppliedDateRange(undefined);
    }
  };

  const clearDates = () => {
    setStartDateInput('');
    setEndDateInput('');
    setAppliedDateRange(undefined);
  }

  const table = useReactTable({
    data,
    columns,
    getRowId: (row) => row.id,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    onGlobalFilterChange: setGlobalFilter,
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
      columnFilters,
      globalFilter,
      columnVisibility,
      rowSelection,
      columnOrder,
      columnSizing,
      pagination,
    },
    meta: { userSettings },
    globalFilterFn: (row, columnId, filterValue) => {
        const searchTerm = normalizeString(String(filterValue ?? ''));
        if (!searchTerm) return true;
        const proposal = row.original;
        const customer = proposal.customer;
        if (/^\d+$/.test(searchTerm)) {
            if (customer && String(customer.numericId) === searchTerm) return true;
            if (proposal.proposalNumber === searchTerm) return true;
            if (searchTerm.length < 7) return false;
        }
        const fieldsToSearch = [proposal.proposalNumber, proposal.product, proposal.promoter, proposal.bank, proposal.operator, customer?.name, customer?.cpf, customer?.city, customer?.state];
        return fieldsToSearch.some(field => field && normalizeString(field).includes(searchTerm));
      },
  });
  
  // 🔥 BLINDAGEM DE REATIVIDADE: Garante que a tabela mude imediatamente ao trocar de aba
  React.useEffect(() => {
    const statusColumn = table.getColumn('status');
    if (statusFilter === 'Todos') {
        statusColumn?.setFilterValue(undefined);
    } else {
        statusColumn?.setFilterValue([statusFilter]);
    }
  }, [statusFilter, table]);

  React.useEffect(() => {
    const dateColumn = table.getColumn('dateDigitized');
    dateColumn?.setFilterValue(appliedDateRange);
  }, [appliedDateRange, table]);


  React.useImperativeHandle(ref, () => ({ table }));
  
  const selectedRowCount = Object.keys(rowSelection).length;
  const totalSelectedGrossAmount = table.getSelectedRowModel().rows.reduce((total, row) => total + (row.original.grossAmount || 0), 0);
  const totalSelectedCommissionValue = table.getSelectedRowModel().rows.reduce((total, row) => total + (row.original.commissionValue || 0), 0);
  const isCommissionColumnVisible = table.getColumn('commissionValue')?.getIsVisible();

  const idMap: {[key: string]: string} = {
    promoter: 'Promotora',
    proposalNumber: 'Nº Proposta',
    customerName: 'Cliente',
    customerCpf: 'CPF',
    product: 'Produto',
    banco_digitado_v6: 'Banco Digitado',
    operator: 'Operador',
    grossAmount: 'Valor Bruto',
    status: 'Status',
    commissionValue: 'Comissão',
    dateDigitized: 'Data Digitação',
    dateApproved: 'Data Averbação',
    datePaidToClient: 'Data Pgto. Cliente',
    debtBalanceArrivalDate: 'Chegada Saldo',
  }

  const orderedTabs = ['Todos', 'Em Andamento', 'Aguardando Saldo', 'Pago', 'Saldo Pago', 'Pendente', 'Reprovado'];

  return (
    <DndContext
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
      sensors={sensors}
    >
        <div className="space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-4">
                <Tabs value={statusFilter} onValueChange={(val) => setStatusFilter(val)}>
                    <TabsList className="h-auto flex-wrap justify-start bg-muted/50 p-1">
                        {orderedTabs.map(status => {
                            const colorValue = statusColors[status.toUpperCase()] || statusColors[status];
                            if (status === 'Todos') return <TabsTrigger key="Todos" value="Todos" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Todos</TabsTrigger>;
                            
                            return (
                                <TabsTrigger 
                                    key={status} 
                                    value={status}
                                    className="status-tab font-black uppercase text-[10px] tracking-widest px-4 h-9 border border-transparent"
                                    style={colorValue ? { '--status-color': colorValue } as any : {}}
                                >
                                    {status}
                                </TabsTrigger>
                            )
                        })}
                    </TabsList>
                </Tabs>
                <div className="flex items-center gap-2 flex-wrap">
                    <Select onValueChange={(val) => applyRange(val as any)}>
                        <SelectTrigger className='w-[140px] h-9 bg-card font-medium'><CalendarIcon className='mr-2 h-4 w-4 text-primary' /><SelectValue placeholder="Período" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="today">Hoje</SelectItem>
                            <SelectItem value="yesterday">Ontem</SelectItem>
                            <SelectItem value="week">Últimos 7 dias</SelectItem>
                            <SelectItem value="month">Mês Atual</SelectItem>
                            <SelectItem value="lastMonth">Mês Passado</SelectItem>
                        </SelectContent>
                    </Select>
                    <div className="flex items-center gap-1">
                        <Input 
                            placeholder="De" 
                            value={startDateInput} 
                            onChange={(e) => handleDateInputChange(e.target.value, 'start')} 
                            maxLength={10} 
                            className="h-9 w-28 bg-card text-center bg-muted/30 focus-visible:bg-muted/50 transition-colors" 
                        />
                        <span className='text-muted-foreground'>-</span>
                        <Input 
                            placeholder="Até" 
                            value={endDateInput} 
                            onChange={(e) => handleDateInputChange(e.target.value, 'end')} 
                            maxLength={10} 
                            className="h-9 w-28 bg-card text-center bg-muted/30 focus-visible:bg-muted/50 transition-colors" 
                        />
                    </div>
                    <Button size="sm" onClick={handleApplyFilter} className="rounded-full px-4"><Filter className="h-3.5 w-3.5 mr-1.5" /> Aplicar</Button>
                    {(startDateInput || endDateInput || appliedDateRange) && <Button variant="ghost" size="icon" className="h-9 w-9" onClick={clearDates}><X className="h-4 w-4" /></Button>}
                </div>
            </div>

            <Card className={cn("proposals-table border-border/50 shadow-md rounded-xl overflow-hidden", containerStyle === 'glow' && 'style-glow')}>
                <div className="p-4">
                    <div className="flex items-center justify-between py-4">
                    <div className="flex items-center gap-2 flex-grow">
                        <div className='relative w-full max-md:max-w-full max-w-md'>
                            <Search className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground opacity-60' />
                            <Input 
                                placeholder="Busca Inteligente (Nome, CPF, ID, Proposta...)" 
                                value={globalFilter ?? ''} 
                                onChange={(event) => setGlobalFilter(event.target.value)} 
                                className="pl-9 w-full bg-muted/20 border-primary/10 h-11 focus-visible:ring-primary/20 transition-all font-medium rounded-full" 
                            />
                        </div>
                        {selectedRowCount > 0 && (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild><Button variant="outline" className="bg-card">Alterar status ({selectedRowCount})<ChevronsUpDown className="ml-2 h-4 w-4" /></Button></DropdownMenuTrigger>
                            <DropdownMenuContent align="start">
                            <DropdownMenuLabel>Escolha o novo status</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            {proposalStatuses.map(status => (
                                <DropdownMenuItem key={status} onSelect={() => onBulkStatusChange(status as ProposalStatus)}>{status}</DropdownMenuItem>
                            ))}
                            </DropdownMenuContent>
                        </DropdownMenu>
                        )}
                    </div>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild><Button variant="outline" className="ml-auto bg-card">Colunas <ChevronDown className="ml-2 h-4 w-4" /></Button></DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                        {table.getAllColumns().filter((column) => column.getCanHide()).map((column) => (
                            <DropdownMenuCheckboxItem key={column.id} className="capitalize" checked={column.getIsVisible()} onCheckedChange={(value) => column.toggleVisibility(!!value)}>{idMap[column.id] || column.id}</DropdownMenuCheckboxItem>
                        ))}
                        </DropdownMenuContent>
                    </DropdownMenu>
                    </div>
                    <div className="rounded-xl border shadow-sm overflow-hidden">
                    <Table>
                        <TableHeader className="bg-muted/20">
                            {table.getHeaderGroups().map(headerGroup => (
                                <TableRow key={headerGroup.id}>
                                    <SortableContext items={columnOrder} strategy={horizontalListSortingStrategy}>
                                        {headerGroup.headers.map(header => (
                                            <DraggableHeader key={header.id} header={header as Header<ProposalWithCustomer, unknown>} />
                                        ))}
                                    </SortableContext>
                                </TableRow>
                            ))}
                        </TableHeader>
                        <TableBody>
                        {table.getRowModel().rows?.length ? (
                            table.getRowModel().rows.map((row) => {
                                const proposal = row.original;
                                const status = proposal.status;
                                const colorValue = statusColors[status.toUpperCase()] || statusColors[status];
                                const isBigWin = proposal.commissionValue >= 3000;

                                return (
                                    <TableRow
                                        key={row.id}
                                        data-state={row.getIsSelected() && 'selected'}
                                        className={cn(
                                            "transition-colors border-b",
                                            colorValue && "status-row-custom",
                                            isBigWin && "big-win-row"
                                        )}
                                        style={colorValue ? { '--status-color': colorValue } as any : {}}
                                    >
                                        {row.getVisibleCells().map((cell) => (
                                        <TableCell key={cell.id} className="py-4">{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                                        ))}
                                    </TableRow>
                                )
                            })
                        ) : (
                            <TableRow><TableCell colSpan={columns.length} className="h-24 text-center">Nenhum resultado para os filtros aplicados.</TableCell></TableRow>
                        )}
                        </TableBody>
                    </Table>
                    </div>
                    <div className="flex items-center justify-between py-4">
                        <div className="flex-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-4">
                            <span>{selectedRowCount} de {table.getFilteredRowModel().rows.length} selecionados.</span>
                            {selectedRowCount > 0 && (
                                <>
                                    <Separator orientation="vertical" className="h-4" />
                                    <div className="text-primary">Valor Bruto: <span className="text-foreground">{formatCurrency(totalSelectedGrossAmount)}</span></div>
                                    {isCommissionColumnVisible && (
                                        <>
                                            <Separator orientation="vertical" className="h-4" />
                                            <div className="text-primary">Comissão: <span className="text-foreground">{formatCurrency(totalSelectedCommissionValue)}</span></div>
                                        </>
                                    )}
                                </>
                            )}
                        </div>
                        <div className="flex items-center space-x-6 lg:space-x-8">
                            <div className="flex items-center space-x-2">
                                <p className="text-xs font-bold text-muted-foreground uppercase tracking-tighter">Linhas</p>
                                <Select value={`${table.getState().pagination.pageSize}`} onValueChange={(value) => table.setPageSize(Number(value))}>
                                    <SelectTrigger className="h-8 w-[70px] bg-card"><SelectValue placeholder={table.getState().pagination.pageSize} /></SelectTrigger>
                                    <SelectContent side="top">
                                        {[10, 20, 50, 100].map((pageSize) => (<SelectItem key={pageSize} value={`${pageSize}`}>{pageSize}</SelectItem>))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="flex w-[100px] items-center justify-center text-xs font-bold text-primary uppercase">Pág {table.getState().pagination.pageIndex + 1} de {table.getPageCount()}</div>
                            <div className="flex items-center space-x-2">
                                <Button variant="outline" className="hidden h-8 w-8 p-0 lg:flex bg-card" onClick={() => table.setPageIndex(0)} disabled={!table.getCanPreviousPage()}><span className="sr-only">Primeira página</span><ChevronsLeft className="h-4 w-4" /></Button>
                                <Button variant="outline" className="h-8 w-8 p-0 bg-card" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}><span className="sr-only">Página anterior</span><ChevronLeft className="h-4 w-4" /></Button>
                                <Button variant="outline" className="h-8 w-8 p-0 bg-card" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}><span className="sr-only">Próxima página</span><ChevronRight className="h-4 w-4" /></Button>
                                <Button variant="outline" className="hidden h-8 w-8 p-0 lg:flex bg-card" onClick={() => table.setPageIndex(table.getPageCount() - 1)} disabled={!table.getCanNextPage()}><span className="sr-only">Última página</span><ChevronsRight className="h-4 w-4" /></Button>
                            </div>
                        </div>
                    </div>
                </div>
            </Card>
        </div>
    </DndContext>
  );
});

ProposalsDataTable.displayName = 'ProposalsDataTable';
