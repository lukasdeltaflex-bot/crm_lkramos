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
} from '@tanstack/react-table';
import { format, parse, isValid } from 'date-fns';
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
import { ChevronDown, X, Filter } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { CommissionStatus, Proposal, Customer } from '@/lib/types';
import { FinancialSummary } from '@/components/financial/financial-summary';
import { DraggableHeader } from './columns';

const STORAGE_KEY_VISIBILITY = 'lk-ramos-financial-columns-visibility';
const STORAGE_KEY_ORDER = 'lk-ramos-financial-columns-order';


type ProposalWithCustomer = Proposal & { customer: Customer };
interface DataTableProps {
  columns: ColumnDef<ProposalWithCustomer, unknown>[];
  data: ProposalWithCustomer[];
  currentMonthData: ProposalWithCustomer[];
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
  isPrivacyMode,
  rowSelection,
  setRowSelection,
  onShowDetails,
}, ref) => {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnSizing, setColumnSizing] = React.useState<ColumnSizingState>({});
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  );
  const [statusFilter, setStatusFilter] = React.useState<CommissionStatus | 'Todos'>('Todos');
  const [globalFilter, setGlobalFilter] = React.useState('');

  const [startDateInput, setStartDateInput] = React.useState('');
  const [endDateInput, setEndDateInput] = React.useState('');
  const [appliedDateRange, setAppliedDateRange] = React.useState<DateRange | undefined>(undefined);
  const [isClient, setIsClient] = React.useState(false);

  const defaultVisibility: VisibilityState = {};
  const defaultOrder = React.useMemo(() => columns.map(c => c.id!).filter(id => id !== 'select' && id !== 'actions'), [columns]);

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
    },
    meta: {
      isPrivacyMode,
    }
  });

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
    if (appliedDateRange?.from) {
        const fromDate = appliedDateRange.from;
        const toDate = appliedDateRange.to ? new Date(appliedDateRange.to) : new Date(appliedDateRange.from);
        toDate.setHours(23, 59, 59, 999);
        dateColumn?.setFilterValue((cellValue: unknown) => {
            if (typeof cellValue !== 'string') return false;
            const cellDate = new Date(cellValue);
            return cellDate >= fromDate && cellDate <= toDate;
        });
    } else {
        dateColumn?.setFilterValue(undefined);
    }
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
                rows={isAnyFilterActive ? (table.getFilteredRowModel().rows as Row<ProposalWithCustomer>[]) : (currentMonthData as ProposalWithCustomer[])}
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
                        <Input 
                            placeholder="Data Início" 
                            value={startDateInput}
                            onChange={(e) => handleDateInputChange(e.target.value, 'start')}
                            maxLength={10}
                            className="h-9 w-32"
                        />
                        <Input 
                            placeholder="Data Fim" 
                            value={endDateInput}
                            onChange={(e) => handleDateInputChange(e.target.value, 'end')}
                            maxLength={10}
                            className="h-9 w-32"
                        />
                        <Button size="sm" onClick={handleApplyFilter}><Filter className="h-4 w-4" /> Aplicar</Button>
                        {(startDateInput || endDateInput || appliedDateRange) && <Button variant="ghost" size="icon" className="h-9 w-9" onClick={clearDates}><X className="h-4 w-4" /></Button>}
                    </div>
                </div>
            </div>

            <div className="flex items-center justify-between py-4 print:hidden">
            <Input
                placeholder="Filtrar por cliente, CPF, nº proposta..."
                value={globalFilter ?? ''}
                onChange={(event) =>
                    setGlobalFilter(event.target.value)
                }
                className="max-w-sm"
            />
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
                        Nenhum resultado.
                    </TableCell>
                    </TableRow>
                )}
                </TableBody>
            </Table>
            </div>
            <div className="flex items-center justify-end space-x-2 py-4 print:hidden">
            <div className="flex-1 text-sm text-muted-foreground">
                {table.getFilteredSelectedRowModel().rows.length} de{' '}
                {table.getFilteredRowModel().rows.length} linha(s) selecionadas.
            </div>
            <Button
                variant="outline"
                size="sm"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
            >
                Anterior
            </Button>
            <Button
                variant="outline"
                size="sm"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
            >
                Próximo
            </Button>
            </div>
        </div>
        </Card>
    </DndContext>
  );
});

FinancialDataTable.displayName = 'FinancialDataTable';
