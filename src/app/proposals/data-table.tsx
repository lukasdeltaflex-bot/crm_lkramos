
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
} from '@tanstack/react-table';

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
import { ChevronDown } from 'lucide-react';
import { Card } from '@/components/ui/card';
import type { ProposalStatus } from '@/lib/types';

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
}

export function ProposalsDataTable<TData, TValue>({
  columns,
  data,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  );
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({
      dateApproved: false,
      datePaidToClient: false,
      debtBalanceArrivalDate: false,
    });
  const [rowSelection, setRowSelection] = React.useState({});
  const [statusFilter, setStatusFilter] = React.useState<ProposalStatus | 'Todos'>('Todos');

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
  });
  
  React.useEffect(() => {
    const statusColumn = table.getColumn('status');
    if (statusFilter === 'Todos') {
        statusColumn?.setFilterValue(undefined);
    } else {
        statusColumn?.setFilterValue([statusFilter]);
    }
  }, [statusFilter, table]);

  return (
    <Card>
      <div className="p-4">
        <Tabs value={statusFilter} onValueChange={(value) => setStatusFilter(value as ProposalStatus | 'Todos')}>
            <TabsList className="h-auto flex-wrap justify-start">
                <TabsTrigger value="Todos">Todos</TabsTrigger>
                <TabsTrigger value="Em Andamento">Em Andamento</TabsTrigger>
                <TabsTrigger value="Aguardando Saldo">Aguardando Saldo</TabsTrigger>
                <TabsTrigger value="Pago">Pago</TabsTrigger>
                <TabsTrigger value="Saldo Pago">Saldo Pago</TabsTrigger>
                <TabsTrigger value="Pendente">Pendente</TabsTrigger>
                <TabsTrigger value="Rejeitado">Reprovado</TabsTrigger>
            </TabsList>
        </Tabs>
        <div className="flex items-center justify-between py-4">
          <Input
            placeholder="Filtrar por cliente..."
            value={(table.getColumn('customer.name')?.getFilterValue() as string) ?? ''}
            onChange={(event) =>
              table.getColumn('customer.name')?.setFilterValue(event.target.value)
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
                  const idMap: {[key: string]: string} = {
                    proposalNumber: 'Proposta nº',
                    'customer.name': 'Cliente',
                    grossAmount: 'Valor Bruto',
                    commissionValue: 'Comissão',
                    dateDigitized: 'Data Digitação',
                    dateApproved: 'Data Averbação',
                    datePaidToClient: 'Data Pgto. Cliente',
                    debtBalanceArrivalDate: 'Chegada Saldo',
                  }
                  return (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      className="capitalize"
                      checked={column.getIsVisible()}
                      onCheckedChange={(value) =>
                        column.toggleVisibility(!!value)
                      }
                    >
                      {idMap[column.id] || column.id}
                    </DropdownMenuCheckboxItem>
                  );
                })}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => {
                    return (
                      <TableHead key={header.id}>
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
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
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
        <div className="flex items-center justify-end space-x-2 py-4">
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
