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
} from '@tanstack/react-table';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar as CalendarIcon } from 'lucide-react';
import { DateRange } from 'react-day-picker';

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
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { ChevronDown, X } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { CommissionStatus, Proposal, Customer } from '@/lib/types';
import { FinancialSummary } from '@/components/financial/financial-summary';

type ProposalWithCustomer = Proposal & { customer: Customer };
interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  isPrivacyMode: boolean;
}

export function FinancialDataTable<TData extends ProposalWithCustomer, TValue>({
  columns,
  data,
  isPrivacyMode
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  );
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});
  const [statusFilter, setStatusFilter] = React.useState<CommissionStatus | 'Todos'>('Todos');
  const [date, setDate] = React.useState<DateRange | undefined>(undefined);
  const [globalFilter, setGlobalFilter] = React.useState('');

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
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      globalFilter,
    },
    meta: {
      isPrivacyMode,
    }
  });

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
    if (date?.from && date?.to) {
        date.to.setHours(23, 59, 59, 999); // Include the whole end day
        dateColumn?.setFilterValue((cellValue: unknown) => {
            if (typeof cellValue !== 'string') return false;
            const cellDate = new Date(cellValue);
            return cellDate >= date.from! && cellDate <= date.to!;
        });
    } else {
        dateColumn?.setFilterValue(undefined);
    }
  }, [date, table]);

  const idToLabelMap: { [key: string]: string } = {
    customerName: 'Cliente',
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
    <Card className="print:shadow-none print:border-none">
      <div className="p-4 space-y-4 print:p-0">
        <div className="flex flex-wrap gap-2 items-center print:hidden">
            <Tabs value={statusFilter} onValueChange={(value) => setStatusFilter(value as CommissionStatus | 'Todos')}>
                <TabsList>
                    <TabsTrigger value="Todos">Todos</TabsTrigger>
                    <TabsTrigger value="Paga">Pagas</TabsTrigger>
                    <TabsTrigger value="Pendente">Pendentes</TabsTrigger>
                    <TabsTrigger value="Parcial">Parciais</TabsTrigger>
                </TabsList>
            </Tabs>
             <Popover>
                <PopoverTrigger asChild>
                <Button
                    id="date"
                    variant={"outline"}
                    className={cn(
                        "w-[300px] justify-start text-left font-normal",
                        !date && "text-muted-foreground"
                    )}
                >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date?.from ? (
                        date.to ? (
                        <>
                            {format(date.from, "dd/MM/y", {locale: ptBR})} -{" "}
                            {format(date.to, "dd/MM/y", {locale: ptBR})}
                        </>
                        ) : (
                        format(date.from, "dd/MM/y", {locale: ptBR})
                        )
                    ) : (
                        <span>Filtrar por data de pagamento</span>
                    )}
                </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                    initialFocus
                    mode="range"
                    defaultMonth={date?.from}
                    selected={date}
                    onSelect={setDate}
                    numberOfMonths={2}
                    locale={ptBR}
                    captionLayout="dropdown-buttons"
                    fromYear={new Date().getFullYear() - 20}
                    toYear={new Date().getFullYear() + 20}
                />
                </PopoverContent>
            </Popover>
            {date && <Button variant="ghost" size="icon" onClick={() => setDate(undefined)}><X className="h-4 w-4" /></Button>}
            <div className="flex-grow" />
        </div>

        <FinancialSummary rows={table.getFilteredRowModel().rows as Row<ProposalWithCustomer>[]} isPrivacyMode={isPrivacyMode}/>

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
                  {headerGroup.headers.map((header) => {
                    return (
                      <TableHead key={header.id} className="print:text-xs print:p-2 print:text-black">
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                      </TableHead>
                    );
                  })}
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
  );
}
