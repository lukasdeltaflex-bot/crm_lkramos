
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
  Header,
  ColumnOrderState,
  ColumnSizingState,
  Table as ReactTable,
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
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ChevronDown, ChevronsUpDown } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { proposalStatuses } from '@/lib/config-data';
import type { ProposalStatus, Proposal } from '@/lib/types';
import { DraggableHeader } from './columns';
import type { ProposalWithCustomer } from './page';

const STORAGE_KEY_VISIBILITY = 'lk-ramos-proposal-columns-visibility';
const STORAGE_KEY_ORDER = 'lk-ramos-proposal-columns-order';

interface DataTableProps {
  columns: ColumnDef<ProposalWithCustomer, unknown>[];
  data: ProposalWithCustomer[];
  rowSelection: RowSelectionState;
  setRowSelection: React.Dispatch<React.SetStateAction<RowSelectionState>>;
  onBulkStatusChange: (newStatus: ProposalStatus) => void;
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
}, ref) => {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnSizing, setColumnSizing] = React.useState<ColumnSizingState>({});
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  );
  const [globalFilter, setGlobalFilter] = React.useState('');
  const [isClient, setIsClient] = React.useState(false);
  
  const defaultVisibility: VisibilityState = {
      dateApproved: false,
      datePaidToClient: false,
      debtBalanceArrivalDate: false,
      operator: false,
      commissionValue: false,
      customerCpf: false,
  };
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
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    onGlobalFilterChange: setGlobalFilter,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    onColumnOrderChange: setColumnOrder,
    onColumnSizingChange: setColumnSizing,
    enableColumnResizing: true,
    columnResizeMode: 'onChange',
    enableColumnOrdering: true,
    state: {
      sorting,
      columnFilters,
      globalFilter,
      columnVisibility,
      rowSelection,
      columnOrder,
      columnSizing,
    },
    globalFilterFn: (row, columnId, filterValue) => {
        const safeValue = (value: any): string =>
          String(value ?? '').toLowerCase();
    
        const customerName = safeValue(row.getValue('customerName'));
        const customerCpf = safeValue(row.getValue('customerCpf'));
        const proposalNumber = safeValue(row.getValue('proposalNumber'));
        const promoter = safeValue(row.getValue('promoter'));
    
        const filter = filterValue.toLowerCase();
    
        return (
          customerName.includes(filter) ||
          customerCpf.includes(filter) ||
          proposalNumber.includes(filter) ||
          promoter.includes(filter)
        );
      },
  });

  React.useImperativeHandle(ref, () => ({
    table,
  }));
  
  const statusFilter = (table.getColumn('status')?.getFilterValue() as string[])?.[0] ?? 'Todos';
  const selectedRowCount = Object.keys(rowSelection).length;

  const setStatusFilter = (value: string) => {
    const newValue = value === 'Todos' ? undefined : [value];
    table.getColumn('status')?.setFilterValue(newValue);
  };
  
  const idMap: {[key: string]: string} = {
    promoter: 'Promotora',
    proposalNumber: 'Nº Proposta',
    customerName: 'Cliente',
    customerCpf: 'CPF',
    product: 'Produto',
    operator: 'Operador',
    grossAmount: 'Valor Bruto',
    status: 'Status',
    commissionValue: 'Comissão',
    dateDigitized: 'Data Digitação',
    dateApproved: 'Data Averbação',
    datePaidToClient: 'Data Pgto. Cliente',
    debtBalanceArrivalDate: 'Chegada Saldo',
  }

  return (
    <DndContext
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
      sensors={sensors}
    >
        <Card>
        <div className="p-4">
            <Tabs 
            value={statusFilter} 
            onValueChange={setStatusFilter}
            >
                <TabsList className="h-auto flex-wrap justify-start">
                    <TabsTrigger value="Todos">Todos</TabsTrigger>
                    {proposalStatuses.map(status => (
                        <TabsTrigger key={status} value={status}>{status}</TabsTrigger>
                    ))}
                </TabsList>
            </Tabs>
            <div className="flex items-center justify-between py-4">
            <div className="flex items-center gap-2">
                <Input
                placeholder="Filtrar por cliente, CPF, proposta ou promotora..."
                value={globalFilter ?? ''}
                onChange={(event) => setGlobalFilter(event.target.value)}
                className="max-w-sm"
                />
                {selectedRowCount > 0 && (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                    <Button variant="outline">
                        Alterar status ({selectedRowCount})
                        <ChevronsUpDown className="ml-2 h-4 w-4" />
                    </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start">
                    <DropdownMenuLabel>Escolha o novo status</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {proposalStatuses.map(status => (
                        <DropdownMenuItem
                        key={status}
                        onSelect={() => onBulkStatusChange(status as ProposalStatus)}
                        >
                        {status}
                        </DropdownMenuItem>
                    ))}
                    </DropdownMenuContent>
                </DropdownMenu>
                )}
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
                    {table.getHeaderGroups().map(headerGroup => (
                        <TableRow key={headerGroup.id}>
                             <SortableContext
                                items={columnOrder}
                                strategy={horizontalListSortingStrategy}
                             >
                                {headerGroup.headers.map(header => (
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
    </DndContext>
  );
});

ProposalsDataTable.displayName = 'ProposalsDataTable';
    
