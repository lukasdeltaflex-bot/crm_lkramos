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
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({
      operator: false,
      commissionValue: false,
      dateApproved: false,
      datePaidToClient: false,
      debtBalanceArrivalDate: false
  });

  // FILTRO REATIVO INSTANTÂNEO
  const filteredData = React.useMemo(() => {
    let list = data;
    if (statusFilter !== 'Todos') {
        list = list.filter(p => p.status === statusFilter);
    }
    if (globalFilter) {
        const lower = normalizeString(globalFilter);
        list = list.filter(p => 
            normalizeString(p.proposalNumber).includes(lower) ||
            normalizeString(p.customer?.name || '').includes(lower) ||
            normalizeString(p.customer?.cpf || '').includes(lower) ||
            normalizeString(p.bank).includes(lower) ||
            normalizeString(p.product).includes(lower)
        );
    }
    return list;
  }, [data, statusFilter, globalFilter]);

  const table = useReactTable({
    data: filteredData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: { globalFilter, rowSelection, columnVisibility },
    meta: { userSettings },
  });

  React.useImperativeHandle(ref, () => ({ table }));

  return (
    <div className="space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-4 bg-muted/10 p-2 rounded-xl border border-border/50 shadow-sm">
            <Tabs value={statusFilter} onValueChange={setStatusFilter}>
                <TabsList className="h-auto flex-wrap justify-start bg-transparent p-0">
                    <TabsTrigger value="Todos">Todos</TabsTrigger>
                    {['Em Andamento', 'Aguardando Saldo', 'Pago', 'Saldo Pago', 'Pendente', 'Reprovado'].map(s => {
                        const colorValue = statusColors[s.toUpperCase()] || statusColors[s];
                        return (
                            <TabsTrigger 
                                key={s} 
                                value={s} 
                                className="status-tab font-black uppercase text-[10px] tracking-widest px-4 h-9"
                                style={colorValue ? { '--status-color': colorValue } as any : {}}
                            >
                                {s}
                            </TabsTrigger>
                        );
                    })}
                </TabsList>
            </Tabs>

            <div className="flex items-center gap-2 flex-1 max-w-sm ml-auto">
                <div className='relative w-full'>
                    <Search className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground opacity-60' />
                    <Input
                        placeholder="Buscar na aba atual..."
                        value={globalFilter ?? ''}
                        onChange={(e) => setGlobalFilter(e.target.value)}
                        className="pl-9 h-9 bg-background border-primary/10 text-xs font-medium"
                    />
                </div>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm" className="h-9 gap-2">
                            Colunas <ChevronDown className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                        {table.getAllColumns().filter(c => c.getCanHide()).map(column => (
                            <DropdownMenuCheckboxItem
                                key={column.id}
                                className="capitalize"
                                checked={column.getIsVisible()}
                                onCheckedChange={v => column.toggleVisibility(!!v)}
                            >
                                {column.id}
                            </DropdownMenuCheckboxItem>
                        ))}
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </div>

        <Card className="proposals-table border-border/50 shadow-md rounded-xl overflow-hidden">
            <div className="p-4">
                <div className="rounded-xl border shadow-sm overflow-hidden">
                    <Table>
                        <TableHeader className="bg-muted/20">
                            {table.getHeaderGroups().map(hg => (
                                <TableRow key={hg.id}>{hg.headers.map(h => <DraggableHeader key={h.id} header={h} />)}</TableRow>
                            ))}
                        </TableHeader>
                        <TableBody>
                            {table.getRowModel().rows.length > 0 ? (
                                table.getRowModel().rows.map(row => (
                                    <TableRow key={row.id} className="status-row-custom">
                                        {row.getVisibleCells().map(cell => (
                                            <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                                        ))}
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={columns.length} className="h-24 text-center text-muted-foreground font-medium uppercase text-[10px] tracking-widest">
                                        Nenhuma proposta encontrada.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>
        </Card>
    </div>
  );
});

ProposalsDataTable.displayName = 'ProposalsDataTable';