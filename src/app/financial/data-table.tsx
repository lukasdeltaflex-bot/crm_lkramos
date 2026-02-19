'use client';

import * as React from 'react';
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  RowSelectionState,
  Table as ReactTable,
} from '@tanstack/react-table';
import { format, parse, isValid, startOfDay, endOfDay, subDays, startOfMonth, subMonths, endOfMonth } from 'date-fns';
import { DateRange } from 'react-day-picker';

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
import { X, Filter, Search, Calendar as CalendarIcon } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { cn, cleanBankName } from '@/lib/utils';
import type { CommissionStatus, Proposal, Customer, UserSettings } from '@/lib/types';
import { FinancialSummary } from '@/components/financial/financial-summary';
import { DraggableHeader } from './columns';
import { Separator } from '@/components/ui/separator';
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
  const [sorting, setSorting] = React.useState<SortingState>([{ id: 'commissionPaymentDate', desc: true }]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [statusFilter, setStatusFilter] = React.useState<CommissionStatus | 'Todos'>('Todos');
  const [globalFilter, setGlobalFilter] = React.useState('');
  const [bankFilter, setBankFilter] = React.useState('all');
  const [promoterFilter, setPromoterFilter] = React.useState('all');
  
  const [startDateInput, setStartDateInput] = React.useState('');
  const [endDateInput, setEndDateInput] = React.useState('');
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

  // 🚀 SINCRONIZAÇÃO DE FILTROS REATIVOS
  React.useEffect(() => {
    table.getColumn('commissionStatus')?.setFilterValue({
        id: statusFilter === 'Todos' ? '__CUSTOM_FILTER_TODOS__' : statusFilter,
        hasDateFilter: !!appliedDateRange,
        hasGlobalFilter: !!globalFilter
    });
  }, [statusFilter, appliedDateRange, globalFilter, table]);

  React.useEffect(() => {
    table.getColumn('banco')?.setFilterValue(bankFilter === 'all' ? undefined : bankFilter);
  }, [bankFilter, table]);

  React.useEffect(() => {
    table.getColumn('promotora')?.setFilterValue(promoterFilter === 'all' ? undefined : promoterFilter);
  }, [promoterFilter, table]);

  React.useEffect(() => {
    table.getColumn('commissionPaymentDate')?.setFilterValue(appliedDateRange);
  }, [appliedDateRange, table]);

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

  const applyRange = (range: string) => {
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
    setStartDateInput(format(from, 'dd/MM/yyyy'));
    setEndDateInput(format(to, 'dd/MM/yyyy'));
    setAppliedDateRange({ from, to });
  };

  return (
    <div className="space-y-4 max-w-full mx-auto">
        <FinancialSummary 
            rows={data} 
            currentMonthRange={appliedDateRange || currentMonthRange}
            isPrivacyMode={isPrivacyMode}
            isFiltered={!!globalFilter || statusFilter !== 'Todos'}
            onShowDetails={onShowDetails}
            userSettings={userSettings}
        />

        <div className="flex flex-col gap-4 py-4 print:hidden">
            <div className="flex flex-wrap items-center gap-3">
                <Tabs value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}>
                    <TabsList className="bg-muted/50 p-1">
                        <TabsTrigger value="Todos">Todos</TabsTrigger>
                        {['Paga', 'Pendente', 'Parcial'].map(s => (
                            <TabsTrigger key={s} value={s} className="status-tab font-black uppercase text-[10px] tracking-widest px-4 h-9">
                                {s === 'Paga' ? 'PAGAS' : s === 'Pendente' ? 'PENDENTES' : 'PARCIAIS'}
                            </TabsTrigger>
                        ))}
                    </TabsList>
                </Tabs>

                <div className="flex items-center gap-2 bg-card border rounded-lg px-2 py-1 shadow-sm">
                    <Select value={bankFilter} onValueChange={setBankFilter}>
                        <SelectTrigger className="h-7 w-auto min-w-[180px] border-none bg-transparent focus:ring-0 text-xs font-bold uppercase">
                            <SelectValue placeholder="TODOS OS BANCOS" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">TODOS OS BANCOS</SelectItem>
                            {Array.from(new Set(data.map(p => p.bank))).sort().map(b => (
                                <SelectItem key={b} value={b}>
                                    <div className="flex items-center gap-2">
                                        <BankIcon bankName={b} domain={userSettings?.bankDomains?.[b]} showLogo={true} className="h-4 w-4" />
                                        <span>{cleanBankName(b).toUpperCase()}</span>
                                    </div>
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="flex items-center gap-2 bg-card border rounded-lg px-2 py-1 shadow-sm">
                    <Select value={promoterFilter} onValueChange={setPromoterFilter}>
                        <SelectTrigger className="h-7 w-auto min-w-[180px] border-none bg-transparent focus:ring-0 text-xs font-bold uppercase">
                            <SelectValue placeholder="TODAS PROMOTORAS" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">TODAS PROMOTORAS</SelectItem>
                            {Array.from(new Set(data.map(p => p.promoter))).sort().map(p => (
                                <SelectItem key={p} value={p}>
                                    <div className="flex items-center gap-2">
                                        <BankIcon bankName={p} domain={userSettings?.promoterDomains?.[p]} showLogo={true} className="h-4 w-4" />
                                        <span>{p.toUpperCase()}</span>
                                    </div>
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 bg-muted/20 p-3 rounded-xl border border-border/50">
                <Select onValueChange={(val) => applyRange(val)}>
                    <SelectTrigger className='w-[140px] h-9 border-none shadow-none focus:ring-0 font-bold text-xs uppercase'>
                        <CalendarIcon className='mr-2 h-4 w-4 text-primary' />
                        <SelectValue placeholder="PERÍODO" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="today">Hoje</SelectItem>
                        <SelectItem value="yesterday">Ontem</SelectItem>
                        <SelectItem value="week">Últimos 7 dias</SelectItem>
                        <SelectItem value="month">Mês Atual</SelectItem>
                        <SelectItem value="lastMonth">Mês Passado</SelectItem>
                    </SelectContent>
                </Select>
                <Separator orientation="vertical" className="h-6 mx-1" />
                <div className="flex items-center gap-2">
                    <Input 
                        placeholder="De" 
                        value={startDateInput}
                        onChange={(e) => handleDateInputChange(e.target.value, 'start')}
                        maxLength={10}
                        className="h-9 w-28 text-center bg-background focus-visible:ring-primary/20 font-bold"
                    />
                    <span className='text-muted-foreground'>-</span>
                    <Input 
                        placeholder="Até" 
                        value={endDateInput}
                        onChange={(e) => handleDateInputChange(e.target.value, 'end')}
                        maxLength={10}
                        className="h-9 w-28 text-center bg-background focus-visible:ring-primary/20 font-bold"
                    />
                </div>
                <Button size="sm" onClick={handleApplyFilter} className='h-9 bg-primary hover:bg-primary/90 rounded-full px-6 font-bold uppercase text-[10px] tracking-widest shadow-md'>
                    <Filter className="h-3.5 w-3.5 mr-2" /> Aplicar Filtro
                </Button>
                {appliedDateRange && (
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => { setStartDateInput(''); setEndDateInput(''); setAppliedDateRange(undefined); }}>
                        <X className="h-4 w-4" />
                    </Button>
                )}
                <div className="flex-1" />
                <div className='relative w-full max-w-xs'>
                    <Search className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground opacity-60' />
                    <Input
                        placeholder="Buscar nesta aba..."
                        value={globalFilter ?? ''}
                        onChange={(e) => setGlobalFilter(e.target.value)}
                        className="pl-9 h-9 bg-background border-primary/10 text-xs font-medium"
                    />
                </div>
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
                                        Nenhum registro encontrado para estes filtros.
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

FinancialDataTable.displayName = 'FinancialDataTable';