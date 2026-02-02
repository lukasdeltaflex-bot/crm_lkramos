
'use client';

import * as React from 'react';
import {
  ColumnDef,
  ColumnFiltersState,
  Row,
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
import { format, parse, isValid, startOfDay, endOfDay, subDays, startOfMonth, subMonths, endOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { DateRange } from 'react-day-picker';
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
import type { CommissionStatus, Proposal, Customer } from '@/lib/types';
import { FinancialSummary } from '@/components/financial/financial-summary';
import { DraggableHeader } from './columns';
import { Separator } from '@/components/ui/separator';

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
}, ref) => {
  const [sorting, setSorting] = React.useState<SortingState>([{ id: 'commissionPaymentDate', desc: true }]);
  const [columnSizing, setColumnSizing] = React.useState<ColumnSizingState>({});
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  );
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

  const defaultVisibility: VisibilityState = {};
  const defaultOrder = React.useMemo(() => columns.map(c => c.id!), [columns]);

  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>(defaultVisibility);
  const [columnOrder, setColumnOrder] = React.useState<ColumnOrderState>(defaultOrder);

  React.useEffect(() => {
    setIsClient(true);
    const savedVisibility = localStorage.getItem(STORAGE_KEY_VISIBILITY);
    if (savedVisibility) {
        try {
            setColumnVisibility(JSON.parse(savedVisibility));
        } catch (e) {
            // Use default
        }
    }
    const savedOrder = localStorage.getItem(STORAGE_KEY_ORDER);
    if (savedOrder) {
        try {
            setColumnOrder(JSON.parse(savedOrder));
        } catch (e) {
            // Use default
        }
    }
    const savedSizing = localStorage.getItem(STORAGE_KEY_SIZING);
    if (savedSizing) {
        try {
            setColumnSizing(JSON.parse(savedSizing));
        } catch (e) {
            // Use default
        }
    }
    const savedPageSize = localStorage.getItem(STORAGE_KEY_PAGESIZE);
    if (savedPageSize) {
      setPagination(prev => ({ ...prev, pageSize: Number(savedPageSize) }));
    }
  }, []);

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

  const isAnyFilterActive = !!globalFilter || statusFilter !== 'Todos' || !!appliedDateRange;

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
        case 'today':
            from = startOfDay(now);
            break;
        case 'yesterday':
            from = startOfDay(subDays(now, 1));
            to = endOfDay(subDays(now, 1));
            break;
        case 'week':
            from = startOfDay(subDays(now, 7));
            break;
        case 'month':
            from = startOfMonth(now);
            break;
        case 'lastMonth':
            from = startOfMonth(subMonths(now, 1));
            to = endOfMonth(subMonths(now, 1));
            break;
        default:
            return;
    }

    setStartDateInput(parse(from.toISOString(), "yyyy-MM-dd", new Date()).toLocaleDateString('pt-BR'));
    setEndDateInput(parse(to.toISOString(), "yyyy-MM-dd", new Date()).toLocaleDateString('pt-BR'));
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
        setAppliedDateRange({ from: startDate, to: startDate }); // Filtra por um único dia
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
    },
    globalFilterFn: (row, columnId, filterValue) => {
        const searchTerm = normalizeString(String(filterValue ?? ''));
    
        if (!searchTerm) {
          return true;
        }
    
        const proposal = row.original;
        const customer = proposal.customer;
        
        // Exact match for customer Numeric ID
        if (/^\d+$/.test(searchTerm)) {
            if (customer && String(customer.numericId) === searchTerm) return true;
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

  const selectedRows = table.getFilteredSelectedRowModel().rows;
  const totalSelectedCommission = React.useMemo(() => {
    return selectedRows.reduce((total, row) => total + (row.original.commissionValue || 0), 0);
  }, [selectedRows]);

  React.useImperativeHandle(ref, () => ({
    table,
  }));

  React.useEffect(() => {
    const statusColumn = table.getColumn('commissionStatus');
    if (statusFilter === 'Todos') {
        statusColumn?.setFilterValue(undefined);
    } else {
        statusColumn?.setFilterValue(statusFilter);
    }
  }, [statusFilter, table]);

  React.useEffect(() => {
    const dateColumn = table.getColumn('commissionPaymentDate');
    dateColumn?.setFilterValue(appliedDateRange);
  }, [appliedDateRange, table]);

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
  };


  return (
    <DndContext
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
      sensors={sensors}
    >
        <Card className="print:shadow-none print:border-none financial-table">
        <div className="p-4 space-y-4 print:p-0">
            <FinancialSummary 
                rows={currentMonthData}
                currentMonthRange={appliedDateRange || currentMonthRange}
                isPrivacyMode={isPrivacyMode}
                isFiltered={isAnyFilterActive}
                onShowDetails={onShowDetails}
            />

            <div className="flex items-center justify-between py-4 print:hidden">
                <div className="flex flex-wrap gap-2 items-center">
                    <Tabs value={statusFilter} onValueChange={(value) => setStatusFilter(value as CommissionStatus | 'Todos')}>
                        <TabsList>
                            <TabsTrigger value="Todos">Todos</TabsTrigger>
                            <TabsTrigger value="Paga">Pagas</TabsTrigger>
                            <TabsTrigger value="Pendente">Pendentes</TabsTrigger>
                            <TabsTrigger value="Parcial">Parciais</TabsTrigger>
                        </TabsList>
                    </Tabs>
                    <div className="flex items-center gap-2 flex-wrap">
                        <Select onValueChange={(val) => applyRange(val as any)}>
                            <SelectTrigger className='w-[140px] h-9'>
                                <CalendarIcon className='mr-2 h-4 w-4' />
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
                                className="h-9 w-28"
                            />
                            <span className='text-muted-foreground'>-</span>
                            <Input 
                                placeholder="Até" 
                                value={endDateInput}
                                onChange={(e) => handleDateInputChange(e.target.value, 'end')}
                                maxLength={10}
                                className="h-9 w-28"
                            />
                        </div>
                        <Button size="sm" onClick={handleApplyFilter}><Filter className="h-4 w-4" /> Aplicar</Button>
                        {(startDateInput || endDateInput || appliedDateRange) && <Button variant="ghost" size="icon" className="h-9 w-9" onClick={clearDates}><X className="h-4 w-4" /></Button>}
                    </div>
                </div>
            </div>

            <div className="flex items-center justify-between py-4 print:hidden">
            <div className='relative w-full max-w-sm'>
                <Search className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground' />
                <Input
                placeholder="Busca inteligente (cliente, CPF, proposta...)"
                value={globalFilter ?? ''}
                onChange={(event) =>
                    setGlobalFilter(event.target.value)
                }
                className="pl-9 w-full"
                />
            </div>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                <Button variant="outline" className="ml-auto">
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
            <div className="rounded-md border print:border print:border-gray-300">
            <Table>
                <TableHeader>
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
                        className="print:even:bg-gray-50"
                    >
                        {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id} className="print:text-xs print:p-2">
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
                <div className="flex items-center gap-4 text-sm">
                    <div className="text-muted-foreground">
                        {table.getFilteredSelectedRowModel().rows.length} de{' '}
                        {table.getFilteredRowModel().rows.length} linha(s) selecionadas.
                    </div>
                    {selectedRows.length > 0 && !isPrivacyMode && (
                        <>
                            <Separator orientation="vertical" className="h-4" />
                            <div className="font-medium text-muted-foreground">
                                Comissão Selecionada:{" "}
                                <span className="font-bold text-foreground">{formatCurrency(totalSelectedCommission)}</span>
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
                            <SelectTrigger className="h-8 w-[70px]">
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
                    <div className="flex w-[100px] items-center justify-center text-sm font-medium">
                        Página {table.getState().pagination.pageIndex + 1} de{" "}
                        {table.getPageCount()}
                    </div>
                    <div className="flex items-center space-x-2">
                        <Button
                            variant="outline"
                            className="hidden h-8 w-8 p-0 lg:flex"
                            onClick={() => table.setPageIndex(0)}
                            disabled={!table.getCanPreviousPage()}
                        >
                            <span className="sr-only">Primeira página</span>
                            <ChevronsLeft className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="outline"
                            className="h-8 w-8 p-0"
                            onClick={() => table.previousPage()}
                            disabled={!table.getCanPreviousPage()}
                        >
                            <span className="sr-only">Página anterior</span>
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="outline"
                            className="h-8 w-8 p-0"
                            onClick={() => table.nextPage()}
                            disabled={!table.getCanNextPage()}
                        >
                            <span className="sr-only">Próxima página</span>
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="outline"
                            className="hidden h-8 w-8 p-0 lg:flex"
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
    </DndContext>
  );
});

FinancialDataTable.displayName = 'FinancialDataTable';
