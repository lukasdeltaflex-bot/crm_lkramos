'use client';

import * as React from 'react';
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  useReactTable,
  RowSelectionState,
  Table as ReactTable,
  VisibilityState,
  SortingState,
  ColumnSizingState,
} from '@tanstack/react-table';
import { format, parse, isValid, startOfDay, endOfDay, subDays, startOfMonth } from 'date-fns';
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
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { X, Filter, Search, Calendar as CalendarIcon, ChevronDown } from 'lucide-react';
import { cn, cleanBankName } from '@/lib/utils';
import type { Proposal, Customer, UserSettings } from '@/lib/types';
import { FinancialSummary } from '@/components/financial/financial-summary';
import { DraggableHeader } from './columns';
import { Separator } from '@/components/ui/separator';
import { useTheme } from '@/components/theme-provider';

type ProposalWithCustomer = Proposal & { customer: Customer };

interface DataTableProps {
  columns: ColumnDef<ProposalWithCustomer, unknown>[];
  data: ProposalWithCustomer[];
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
  const [sorting, setSorting] = React.useState<SortingState>([{ id: 'Data Pagamento', desc: true }]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({
      'Promotora': false,
      'CPF': false,
      'Comissão (%)': false,
      'Status Proposta': false
  });
  const [statusFilter, setStatusFilter] = React.useState('Todos');
  const [globalFilter, setGlobalFilter] = React.useState('');
  const [bankFilter, setBankFilter] = React.useState('all');
  const [promoterFilter, setPromoterFilter] = React.useState('all');
  const [columnSizing, setColumnSizing] = React.useState<ColumnSizingState>({});
  
  const [startDateInput, setStartDateInput] = React.useState('');
  const [endDateInput, setEndDateInput] = React.useState('');
  const [appliedDateRange, setAppliedDateRange] = React.useState<DateRange | undefined>(undefined);

  const filteredData = React.useMemo(() => {
    let list = data;

    if (statusFilter !== 'Todos') {
        list = list.filter(p => p.commissionStatus === statusFilter);
    }

    if (bankFilter !== 'all') {
        list = list.filter(p => p.bank === bankFilter);
    }

    if (promoterFilter !== 'all') {
        list = list.filter(p => p.promoter === promoterFilter);
    }

    if (appliedDateRange && appliedDateRange.from) {
        const fromDate = appliedDateRange.from;
        const toDate = appliedDateRange.to ? endOfDay(appliedDateRange.to) : endOfDay(appliedDateRange.from);
        list = list.filter(p => {
            const d = p.commissionPaymentDate ? new Date(p.commissionPaymentDate) : null;
            return d && d >= fromDate && d <= toDate;
        });
    }

    if (globalFilter) {
        const lower = globalFilter.toLowerCase();
        list = list.filter(p => 
            p.customer?.name?.toLowerCase().includes(lower) ||
            p.customer?.cpf?.includes(lower) ||
            p.proposalNumber.includes(lower) ||
            p.bank.toLowerCase().includes(lower) ||
            p.promoter.toLowerCase().includes(lower)
        );
    }

    return list;
  }, [data, statusFilter, bankFilter, promoterFilter, appliedDateRange, globalFilter]);

  const table = useReactTable({
    data: filteredData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    onColumnSizingChange: setColumnSizing,
    enableColumnResizing: true,
    columnResizeMode: 'onChange',
    state: { sorting, globalFilter, rowSelection, columnVisibility, columnSizing },
    meta: { isPrivacyMode, userSettings },
  });

  React.useImperativeHandle(ref, () => ({ table }));

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

  const banksList = Array.from(new Set(data.map(p => p.bank))).sort();
  const promotersList = Array.from(new Set(data.map(p => p.promoter))).sort();

  return (
    <div className="space-y-4 w-full">
        <FinancialSummary 
            rows={data} 
            currentMonthRange={appliedDateRange || currentMonthRange}
            isPrivacyMode={isPrivacyMode}
            isFiltered={!!globalFilter || statusFilter !== 'Todos'}
            onShowDetails={onShowDetails}
            userSettings={userSettings}
        />

        <div className="flex flex-wrap items-center justify-between gap-4 bg-muted/10 dark:bg-zinc-900/30 p-2 rounded-xl border-2 border-zinc-200 dark:border-primary/20 shadow-sm">
            <Tabs value={statusFilter} onValueChange={setStatusFilter}>
                <TabsList className="bg-transparent p-0 gap-1 h-auto flex-wrap">
                    <TabsTrigger value="Todos" className="font-bold px-4 h-9">Todos</TabsTrigger>
                    {['Paga', 'Pendente', 'Parcial'].map(s => {
                        const label = s === 'Paga' ? 'PAGAS' : s === 'Pendente' ? 'PENDENTES' : 'PARCIAIS';
                        const colorValue = statusColors[s.toUpperCase()] || statusColors[s];
                        return (
                            <TabsTrigger 
                                key={s} 
                                value={s} 
                                className="status-tab font-black uppercase text-[10px] tracking-widest px-4 h-9 border-2 border-transparent data-[state=active]:bg-background"
                                style={colorValue ? { '--status-color': colorValue } as any : {}}
                            >
                                {label}
                            </TabsTrigger>
                        );
                    })}
                </TabsList>
            </Tabs>

            <div className="flex items-center gap-2 ml-auto">
                <Select value={bankFilter} onValueChange={setBankFilter}>
                    <SelectTrigger className="h-9 min-w-[180px] bg-background border-2 border-zinc-300 dark:border-primary/20 rounded-full text-xs font-black uppercase px-4">
                        <SelectValue placeholder="TODOS OS BANCOS" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">TODOS OS BANCOS</SelectItem>
                        {banksList.map(b => (
                            <SelectItem key={b} value={b}>{cleanBankName(b).toUpperCase()}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                <Select value={promoterFilter} onValueChange={setPromoterFilter}>
                    <SelectTrigger className="h-9 min-w-[180px] bg-background border-2 border-zinc-300 dark:border-primary/20 rounded-full text-xs font-black uppercase px-4">
                        <SelectValue placeholder="TODAS PROMOTORAS" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">TODAS PROMOTORAS</SelectItem>
                        {promotersList.map(p => (
                            <SelectItem key={p} value={p}>{p.toUpperCase()}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 bg-muted/5 p-2 rounded-xl border-2 border-zinc-200 dark:border-border/50">
            <div className="flex items-center gap-2 bg-background border-2 border-zinc-300 dark:border-primary/20 rounded-full px-3 py-1 shadow-sm">
                <Select onValueChange={(val) => {
                    const now = new Date();
                    let from = startOfMonth(now);
                    if(val === 'today') from = startOfDay(now);
                    if(val === 'yesterday') from = startOfDay(subDays(now, 1));
                    setStartDateInput(format(from, 'dd/MM/yyyy'));
                    setEndDateInput(format(now, 'dd/MM/yyyy'));
                    setAppliedDateRange({ from, to: now });
                }}>
                    <SelectTrigger className="h-7 w-[110px] border-none bg-transparent focus:ring-0 text-xs font-black uppercase p-0">
                        <CalendarIcon className="mr-2 h-3.5 w-3.5 text-primary" />
                        <SelectValue placeholder="PERÍODO" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="today">Hoje</SelectItem>
                        <SelectItem value="yesterday">Ontem</SelectItem>
                        <SelectItem value="month">Mês Atual</SelectItem>
                    </SelectContent>
                </Select>
                <Separator orientation="vertical" className="h-4 mx-1 bg-zinc-300" />
                <div className="flex items-center gap-1">
                    <Input placeholder="De" value={startDateInput} onChange={(e) => setStartDateInput(handleDateMask(e))} className="h-7 w-28 border-none bg-muted/40 text-[11px] text-center font-black rounded-full" />
                    <span className="text-muted-foreground font-black">-</span>
                    <Input placeholder="Até" value={endDateInput} onChange={(e) => setEndDateInput(handleDateMask(e))} className="h-7 w-28 border-none bg-muted/40 text-[11px] text-center font-black rounded-full" />
                </div>
            </div>
            <Button size="sm" onClick={handleApplyFilter} className="h-9 bg-primary text-white hover:bg-primary/90 rounded-full px-6 text-xs font-black uppercase shadow-lg gap-2">
                <Filter className="h-3.5 w-3.5" /> Aplicar
            </Button>
            {appliedDateRange && <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => { setStartDateInput(''); setEndDateInput(''); setAppliedDateRange(undefined); }}><X className="h-4 w-4" /></Button>}
        </div>

        <Card className="rounded-[1.5rem] border-2 border-zinc-200 dark:border-primary/30 bg-card shadow-xl overflow-hidden p-1">
            <div className="flex items-center justify-between px-4 py-2 gap-4">
                <div className='relative w-full max-w-md group'>
                    <Search className='absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-primary opacity-80 group-focus-within:opacity-100 transition-opacity' />
                    <Input 
                        placeholder="Busca Inteligente (Nome, CPF, Banco...)" 
                        value={globalFilter} 
                        onChange={(e) => setGlobalFilter(e.target.value)} 
                        className="pl-10 h-11 bg-background border-2 border-zinc-300 dark:border-primary/40 rounded-full text-base font-bold shadow-md focus-visible:ring-primary/20 transition-all placeholder:text-muted-foreground/80" 
                    />
                </div>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="h-11 rounded-full px-6 font-black border-2 border-zinc-300 dark:border-primary/20 bg-background shadow-md gap-2 text-[10px] uppercase tracking-widest">
                            Colunas <ChevronDown className="h-4 w-4 opacity-50" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56 shadow-2xl border-2">
                        <DropdownMenuLabel>Exibir/Ocultar</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        {table.getAllColumns().filter(c => c.getCanHide()).map(column => (
                            <DropdownMenuCheckboxItem key={column.id} className="capitalize text-xs font-bold" checked={column.getIsVisible()} onCheckedChange={v => column.toggleVisibility(!!v)}>
                                {column.id}
                            </DropdownMenuCheckboxItem>
                        ))}
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            <div className="financial-table">
                <div className="overflow-x-auto">
                    <Table style={{ width: table.getTotalSize() }}>
                        <TableHeader className="bg-muted/40 dark:bg-zinc-900/60 border-b-2">
                            {table.getHeaderGroups().map(hg => (
                                <TableRow key={hg.id} className="border-b">
                                    {hg.headers.map(h => <DraggableHeader key={h.id} header={h as any} />)}
                                </TableRow>
                            ))}
                        </TableHeader>
                        <TableBody>
                            {table.getRowModel().rows.length > 0 ? (
                                table.getRowModel().rows.map(row => {
                                    const status = row.original.commissionStatus;
                                    const colorValue = statusColors[status?.toUpperCase()] || statusColors[status || ''];
                                    return (
                                        <TableRow 
                                            key={row.id} 
                                            className={cn(
                                                "transition-colors border-b h-14 hover:bg-primary/[0.03] dark:hover:bg-primary/5", 
                                                colorValue && "status-row-custom"
                                            )} 
                                            style={colorValue ? { '--status-color': colorValue } as any : {}}
                                        >
                                            {row.getVisibleCells().map(cell => (
                                                <TableCell 
                                                    key={cell.id} 
                                                    style={{ width: cell.column.getSize() }} 
                                                    className="p-3 text-sm border-none"
                                                >
                                                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                                </TableCell>
                                            ))}
                                        </TableRow>
                                    )
                                })
                            ) : (
                                <TableRow><TableCell colSpan={columns.length} className="h-32 text-center text-muted-foreground font-black uppercase text-[10px] tracking-widest opacity-40">Sem registros para este período.</TableCell></TableRow>
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

const handleDateMask = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, "");
    if (value.length > 8) value = value.substring(0, 8);
    value = value.replace(/(\d{2})(\d)/, '$1/$2');
    value = value.replace(/(\d{2})(\d)/, '$1/$2');
    e.target.value = value;
    return value;
};
