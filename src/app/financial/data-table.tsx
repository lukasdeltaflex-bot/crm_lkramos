
'use client';

import * as React from 'react';
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  ColumnOrderState,
  Header,
  ColumnSizingState,
  RowSelectionState,
  Table as ReactTable,
  PaginationState,
} from '@tanstack/react-table';
import { format, parse, isValid, startOfDay, endOfDay, subDays, startOfMonth, subMonths, endOfMonth, isSameMonth } from 'date-fns';
import { DateRange } from 'react-day-picker';
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
  TableHead,
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
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ChevronDown, X, Filter, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Search, Calendar as CalendarIcon } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { cn, formatCurrency, normalizeString } from '@/lib/utils';
import type { CommissionStatus, Proposal, Customer, UserSettings } from '@/lib/types';
import { FinancialSummary } from '@/components/financial/financial-summary';
import { DraggableHeader } from './columns';
import { Separator } from '@/components/ui/separator';
import { proposalStatuses } from '@/lib/config-data';

const STORAGE_KEY_VISIBILITY = 'lk-ramos-financial-columns-visibility-v2';
const STORAGE_KEY_ORDER = 'lk-ramos-financial-columns-order-v2';
const STORAGE_KEY_SIZING = 'lk-ramos-financial-columns-sizing-v2';
const STORAGE_KEY_PAGESIZE = 'lk-ramos-financial-page-size-v1';


type ProposalWithCustomer = Proposal & { customer: Customer };
interface DataTableProps {
  columns: ColumnDef<ProposalWithCustomer, unknown>[];
  data: ProposalWithCustomer[];
  currentMonthData: ProposalWithCustomer[];
  currentMonthRange: { from: Date; to: Date };
  isPrivacyMode: boolean;
  rowSelection: RowSelectionState;
  setRowSelection: React.Dispatch<React.SetStateAction<RowSelectionState>>;
  onShowDetails: (title: string, proposals: ProposalWithCustomer[]) => void;
  userSettings: UserSettings | null;
}

export interface FinancialDataTableHandle {
  table: ReactTable<ProposalWithCustomer>;
}

export const FinancialDataTable = React.forwardRef<FinancialDataTableHandle, DataTableProps>(({
  columns,
  data,
  currentMonthData,
  currentMonthRange,
  isPrivacyMode,
  rowSelection,
  setRowSelection,
  onShowDetails,
  userSettings,
}, ref) => {
  const [sorting, setSorting] = React.useState<SortingState>([{ id: 'commissionPaymentDate', desc: true }]);
  const [columnSizing, setColumnSizing] = React.useState<ColumnSizingState>({});
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [pagination, setPagination] = React.useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });
  const [statusFilter, setStatusFilter] = React.useState<CommissionStatus | 'Todos'>('Todos');
  const [globalFilter, setGlobalFilter] = React.useState('');

  const [startDateInput, setStartDateInput] = React.useState('');
  const [endDateInput, setEndDateInput] = React.useState('');
  const [appliedDateRange, setAppliedDateRange] = React.useState<DateRange | undefined>(undefined);
  const [isClient, setIsClient] = React.useState(false);

  const defaultVisibility: VisibilityState = {
    status: false,
  };
  const defaultOrder = React.useMemo(() => columns.map(c => c.id!), [columns]);

  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>(defaultVisibility);
  const [columnOrder, setColumnOrder] = React.useState<ColumnOrderState>(defaultOrder);

  React.useEffect(() => {
    setIsClient(true);
    const savedVisibility = localStorage.getItem(STORAGE_KEY_VISIBILITY);
    if (savedVisibility) {
        try {
            setColumnVisibility(JSON.parse(savedVisibility));
        } catch (e) {}
    }
    const savedOrder = localStorage.getItem(STORAGE_KEY_ORDER);
    if (savedOrder) {
        try {
            setColumnOrder(JSON.parse(savedOrder));
        } catch (e) {}
    }
    const savedSizing = localStorage.getItem(STORAGE_KEY_SIZING);
    if (savedSizing) {
        try {
            setColumnSizing(JSON.parse(savedSizing));
        } catch (e) {}
    }
    const savedPageSize = localStorage.getItem(STORAGE_KEY_PAGESIZE);
    if (savedPageSize) {
      setPagination(prev => ({ ...prev, pageSize: Number(savedPageSize) }));
    }
  }, [columns]);

  React.useEffect(() => {
    if (isClient) {
        localStorage.setItem(STORAGE_KEY_VISIBILITY, JSON.stringify(columnVisibility));
    }
  }, [columnVisibility, isClient]);

  React.useEffect(() => {
    if (isClient) {
        localStorage.setItem(STORAGE_KEY_ORDER, JSON.stringify(columnOrder));
    }
  }, [columnOrder, isClient]);

  React.useEffect(() => {
    if (isClient) {
        localStorage.setItem(STORAGE_KEY_SIZING, JSON.stringify(columnSizing));
    }
  }, [columnSizing, isClient]);
  
  React.useEffect(() => {
    if (isClient) {
        localStorage.setItem(STORAGE_KEY_PAGESIZE, String(pagination.pageSize));
    }
  }, [pagination.pageSize, isClient]);


  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor)
  );

  const handleDateInputChange = (value: string, type: 'start' | 'end') => {
    let formattedValue = value.replace(/\D/g, '');
    if (formattedValue.length > 8) formattedValue = formattedValue.substring(0, 8);
    formattedValue = formattedValue.replace(/(\d{2})(\d)/, '$1/$2');
    formattedValue = formattedValue.replace(/(\d{2})(\d)/, '$1/$2');
    
    if (type === 'start') {
      setStartDateInput(formattedValue);
    } else {
      setEndDateInput(formattedValue);
    }
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
        setAppliedDateRange({ from: startDate, to: endDate });
    } else if (isValidStart) {
        setAppliedDateRange({ from: startDate, to: startDate });
    } else {
        setAppliedDateRange(undefined);
    }
  };

  const clearDates = () => {
    setStartDateInput('');
    setEndDateInput('');
    setAppliedDateRange(undefined);
  }

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

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    onColumnFiltersChange: setColumnFilters,
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
      columnFilters,
      columnVisibility,
      rowSelection,
      globalFilter,
      columnOrder,
      columnSizing,
      pagination,
    },
    meta: {
      isPrivacyMode,
      userSettings,
    },
    globalFilterFn: (row, columnId, filterValue) => {
        const searchTerm = normalizeString(String(filterValue ?? ''));
        if (!searchTerm) return true;
        const proposal = row.original;
        const customer = proposal.customer;
        
        // Busca exata por ID
        if (/^\d+$/.test(searchTerm)) {
            const isExactId = customer && String(customer.numericId) === searchTerm;
            if (isExactId) return true;
            if (searchTerm.length < 7) return false;
        }

        const fieldsToSearch = [
            proposal.proposalNumber,
            proposal.promoter,
            proposal.product,
            proposal.bank,
            customer?.name,
            customer?.cpf,
            customer?.city,
            customer?.state
        ];
        return fieldsToSearch.some(field => {
            if (!field) return false;
            return normalizeString(field).includes(searchTerm);
        });
      },
  });

  const isAnyFilterActive = !!globalFilter || statusFilter !== 'Todos' || !!appliedDateRange;
  const selectedRows = table.getFilteredSelectedRowModel().rows;
  const totalSelectedCommission = React.useMemo(() => {
    return selectedRows.reduce((total, row) => total + (row.original.commissionValue || 0), 0);
  }, [selectedRows]);

  React.useImperativeHandle(ref, () => ({
    table,
  }));

  React.useEffect(() => {
    const statusColumn = table.getColumn('commissionStatus');
    const dateColumn = table.getColumn('commissionPaymentDate');
    
    // Objeto de contexto do filtro para passar metadados ao filterFn das colunas
    const filterContext = {
        hasDateFilter: !!appliedDateRange,
        hasGlobalFilter: !!globalFilter
    };

    if (statusFilter === 'Todos') {
        statusColumn?.setFilterValue({ id: '__CUSTOM_FILTER_TODOS__', ...filterContext });
        dateColumn?.setFilterValue(appliedDateRange);
    } else if (statusFilter === 'Paga') {
        statusColumn?.setFilterValue({ id: 'Paga', ...filterContext });
        if (!appliedDateRange) {
            const now = new Date();
            dateColumn?.setFilterValue({ from: startOfMonth(now), to: endOfMonth(now) });
        } else {
            dateColumn?.setFilterValue(appliedDateRange);
        }
    } else {
        statusColumn?.setFilterValue({ id: statusFilter, ...filterContext });
        dateColumn?.setFilterValue(appliedDateRange);
    }
  }, [statusFilter, appliedDateRange, globalFilter, table]);

  const idToLabelMap: { [key: string]: string } = {
    customerName: 'Cliente',
    customerCpf: 'CPF',
    promotora: 'Promotora',
    produto: 'Produto',
    banco: 'Banco',
    grossAmount: 'Valor Bruto',
    commissionPercentage: 'Comissão (%)',
    commissionValue: 'Valor Comissão',
    amountPaid: 'Valor Pago',
    commissionStatus: 'Status Comissão',
    commissionPaymentDate: 'Data Pagamento',
    proposalNumber: 'Nº Proposta',
    status: 'Status Proposta'
  };


  return (
    <DndContext
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
      sensors={sensors}
    >
        <div className="space-y-4 max-w-[1600px] mx-auto">
            <FinancialSummary 
                rows={currentMonthData}
                currentMonthRange={appliedDateRange || currentMonthRange}
                isPrivacyMode={isPrivacyMode}
                isFiltered={isAnyFilterActive}
                onShowDetails={onShowDetails}
            />

            <Card className="print:shadow-none print:border-none financial-table border-border/50 shadow-md rounded-xl overflow-hidden">
                <div className="p-4 space-y-4 print:p-0">
                    <div className="flex items-center justify-between py-4 print:hidden">
                        <div className="flex flex-wrap gap-2 items-center">
                            <Tabs value={statusFilter} onValueChange={(value) => setStatusFilter(value as CommissionStatus | 'Todos')}>
                                <TabsList className="bg-muted/50">
                                    <TabsTrigger value="Todos" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Todos</TabsTrigger>
                                    <TabsTrigger value="Paga" className="data-[state=active]:bg-green-600 data-[state=active]:text-white">Pagas</TabsTrigger>
                                    <TabsTrigger value="Pendente" className="data-[state=active]:bg-yellow-500 data-[state=active]:text-black">Pendentes</TabsTrigger>
                                    <TabsTrigger value="Parcial" className="data-[state=active]:bg-orange-500 data-[state=active]:text-white">Parciais</TabsTrigger>
                                </TabsList>
                            </Tabs>
                            <div className="flex items-center gap-2 flex-wrap">
                                <Select onValueChange={(val) => applyRange(val as any)}>
                                    <SelectTrigger className='w-[140px] h-9 bg-card'>
                                        <CalendarIcon className='mr-2 h-4 w-4 text-primary' />
                                        <SelectValue placeholder="Período" />
                                    </SelectTrigger>
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
                                        className="h-9 w-28 bg-card"
                                    />
                                    <span className='text-muted-foreground'>-</span>
                                    <Input 
                                        placeholder="Até" 
                                        value={endDateInput}
                                        onChange={(e) => handleDateInputChange(e.target.value, 'end')}
                                        maxLength={10}
                                        className="h-9 w-28 bg-card"
                                    />
                                </div>
                                <Button size="sm" onClick={handleApplyFilter}><Filter className="h-4 w-4" /> Aplicar</Button>
                                {(startDateInput || endDateInput || appliedDateRange) && <Button variant="ghost" size="icon" className="h-9 w-9" onClick={clearDates}><X className="h-4 w-4" /></Button>}
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center justify-between py-4 print:hidden">
                    <div className='relative w-full max-sm:max-w-full max-w-sm'>
                        <Search className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground' />
                        <Input
                        placeholder="Busca inteligente (cliente, CPF, proposta...)"
                        value={globalFilter ?? ''}
                        onChange={(event) =>
                            setGlobalFilter(event.target.value)
                        }
                        className="pl-9 w-full bg-card"
                        />
                    </div>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="ml-auto bg-card">
                            Colunas <ChevronDown className="ml-2 h-4 w-4" />
                        </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                        {table
                            .getAllColumns()
                            .filter((column) => column.getCanHide())
                            .map((column) => {
                            return (
                                <DropdownMenuCheckboxItem
                                key={column.id}
                                className="capitalize"
                                checked={column.getIsVisible()}
                                onCheckedChange={(value) =>
                                    column.toggleVisibility(!!value)
                                }
                                >
                                {idToLabelMap[column.id] || column.id}
                                </DropdownMenuCheckboxItem>
                            );
                            })}
                        </DropdownMenuContent>
                    </DropdownMenu>
                    </div>
                    <div className="rounded-xl border print:border print:border-gray-300 overflow-hidden shadow-sm">
                    <Table>
                        <TableHeader className="bg-muted/20">
                        {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow key={headerGroup.id}>
                                <SortableContext
                                    items={columnOrder}
                                    strategy={horizontalListSortingStrategy}
                                >
                                    {headerGroup.headers.map((header) => (
                                        <DraggableHeader key={header.id} header={header as Header<ProposalWithCustomer, unknown>} />
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
                                data-state={row.getIsSelected() && 'selected'}
                                className="print:even:bg-gray-50 hover:bg-primary/[0.02] transition-colors"
                            >
                                {row.getVisibleCells().map((cell) => (
                                <TableCell key={cell.id} className="print:text-xs print:p-2 py-4">
                                    {flexRender(
                                    cell.column.columnDef.cell,
                                    cell.getContext()
                                    )}
                                </TableCell>
                                ))}
                            </TableRow>
                            ))
                        ) : (
                            <TableRow>
                            <TableCell
                                colSpan={columns.length}
                                className="h-24 text-center"
                            >
                                Nenhum resultado para os filtros aplicados.
                            </TableCell>
                            </TableRow>
                        )}
                        </TableBody>
                    </Table>
                    </div>
                    <div className="flex items-center justify-between py-4 print:hidden">
                        <div className="flex items-center gap-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                            <div>
                                {table.getFilteredRowModel().rows.length} total
                            </div>
                            {selectedRows.length > 0 && !isPrivacyMode && (
                                <>
                                    <Separator orientation="vertical" className="h-4" />
                                    <div className="text-primary">
                                        Seleção: <span className="text-foreground">{formatCurrency(totalSelectedCommission)}</span>
                                    </div>
                                </>
                            )}
                        </div>
                        <div className="flex items-center space-x-6 lg:space-x-8">
                            <div className="flex items-center space-x-2">
                                <p className="text-sm font-medium">Linhas por página</p>
                                <Select
                                    value={`${table.getState().pagination.pageSize}`}
                                    onValueChange={(value) => {
                                        table.setPageSize(Number(value))
                                    }}
                                >
                                    <SelectTrigger className="h-8 w-[70px] bg-card">
                                        <SelectValue placeholder={table.getState().pagination.pageSize} />
                                    </SelectTrigger>
                                    <SelectContent side="top">
                                        {[10, 20, 50, 100].map((pageSize) => (
                                            <SelectItem key={pageSize} value={`${pageSize}`}>
                                                {pageSize}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="flex w-[100px] items-center justify-center text-xs font-bold text-primary uppercase">
                                Pág {table.getState().pagination.pageIndex + 1} de{" "}
                                {table.getPageCount()}
                            </div>
                            <div className="flex items-center space-x-2">
                                <Button
                                    variant="outline"
                                    className="hidden h-8 w-8 p-0 lg:flex bg-card"
                                    onClick={() => table.setPageIndex(0)}
                                    disabled={!table.getCanPreviousPage()}
                                >
                                    <span className="sr-only">Primeira página</span>
                                    <ChevronsLeft className="h-4 w-4" />
                                </Button>
                                <Button
                                    variant="outline"
                                    className="h-8 w-8 p-0 bg-card"
                                    onClick={() => table.previousPage()}
                                    disabled={!table.getCanPreviousPage()}
                                >
                                    <span className="sr-only">Página anterior</span>
                                    <ChevronLeft className="h-4 w-4" />
                                </Button>
                                <Button
                                    variant="outline"
                                    className="h-8 w-8 p-0 bg-card"
                                    onClick={() => table.nextPage()}
                                    disabled={!table.getCanNextPage()}
                                >
                                    <span className="sr-only">Próxima página</span>
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                                <Button
                                    variant="outline"
                                    className="hidden h-8 w-8 p-0 lg:flex bg-card"
                                    onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                                    disabled={!table.getCanNextPage()}
                                >
                                    <span className="sr-only">Última página</span>
                                    <ChevronsRight className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </Card>
        </div>
    </DndContext>
  );
});

FinancialDataTable.displayName = 'FinancialDataTable';
