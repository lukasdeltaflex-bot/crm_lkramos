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
import { ChevronDown, X, Filter, Search, Calendar as CalendarIcon } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { cn, formatCurrency, normalizeString, cleanBankName } from '@/lib/utils';
import type { CommissionStatus, Proposal, Customer, UserSettings } from '@/lib/types';
import { FinancialSummary } from '@/components/financial/financial-summary';
import { DraggableHeader } from './columns';
import { Separator } from '@/components/ui/separator';
import { useTheme } from '@/components/theme-provider';
import { BankIcon } from '@/components/bank-icon';

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
  currentMonthRange,
  isPrivacyMode,
  rowSelection,
  setRowSelection,
  onShowDetails,
  userSettings,
}, ref) => {
  const { statusColors } = useTheme();
  const [sorting, setSorting] = React.useState<SortingState>([{ id: 'commissionPaymentDate', desc: true }]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [statusFilter, setStatusFilter] = React.useState<CommissionStatus | 'Todos'>('Todos');
  const [globalFilter, setGlobalFilter] = React.useState('');
  const [bankFilter, setBankFilter] = React.useState('all');
  const [promoterFilter, setPromoterFilter] = React.useState('all');
  const [appliedDateRange, setAppliedDateRange] = React.useState<DateRange | undefined>(undefined);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    onGlobalFilterChange: setGlobalFilter,
    onRowSelectionChange: setRowSelection,
    state: { sorting, columnFilters, globalFilter, rowSelection },
    meta: { isPrivacyMode, userSettings },
  });

  React.useImperativeHandle(ref, () => ({ table }));

  return (
    <div className="space-y-4 max-w-[1600px] mx-auto">
        <FinancialSummary 
            rows={data} 
            currentMonthRange={appliedDateRange || currentMonthRange}
            isPrivacyMode={isPrivacyMode}
            isFiltered={!!globalFilter || statusFilter !== 'Todos'}
            onShowDetails={onShowDetails}
            userSettings={userSettings}
        />

        <div className="flex flex-wrap gap-3 items-center py-4 print:hidden">
            <Tabs value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}>
                <TabsList className="bg-muted/50 p-1">
                    <TabsTrigger value="Todos">Todos</TabsTrigger>
                    {['Paga', 'Pendente', 'Parcial'].map(s => (
                        <TabsTrigger key={s} value={s} className="status-tab font-black uppercase text-[10px] tracking-widest px-4 h-9">
                            {s}
                        </TabsTrigger>
                    ))}
                </TabsList>
            </Tabs>

            <div className="flex items-center gap-2 bg-card border rounded-lg px-2 py-1 shadow-sm">
                <Select value={bankFilter} onValueChange={setBankFilter}>
                    <SelectTrigger className="h-7 w-auto min-w-[160px] border-none bg-transparent focus:ring-0 text-xs font-bold uppercase">
                        <SelectValue placeholder="Todos os Bancos" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Todos os Bancos</SelectItem>
                        {Array.from(new Set(data.map(p => p.bank))).sort().map(b => (
                            <SelectItem key={b} value={b}>
                                <div className="flex items-center gap-2">
                                    <BankIcon bankName={b} domain={userSettings?.bankDomains?.[b]} showLogo={true} className="h-4 w-4" />
                                    <span>{cleanBankName(b)}</span>
                                </div>
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
        </div>

        <Card className="financial-table border-border/50 shadow-md rounded-xl overflow-hidden">
            <div className="p-4">
                <div className="rounded-xl border shadow-sm overflow-hidden">
                    <Table>
                        <TableHeader className="bg-muted/20">
                            {table.getHeaderGroups().map(hg => (
                                <TableRow key={hg.id}>{hg.headers.map(h => <DraggableHeader key={h.id} header={h} />)}</TableRow>
                            ))}
                        </TableHeader>
                        <TableBody>
                            {table.getRowModel().rows.map(row => (
                                <TableRow key={row.id} className="status-row-custom">
                                    {row.getVisibleCells().map(cell => (
                                        <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                                    ))}
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </div>
        </Card>
    </div>
  );
});

FinancialDataTable.displayName = 'FinancialDataTable';
