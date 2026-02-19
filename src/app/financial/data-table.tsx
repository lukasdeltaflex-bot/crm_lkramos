
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
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { X, Filter, Search, Calendar as CalendarIcon, ChevronDown } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { cn, cleanBankName } from '@/lib/utils';
import type { CommissionStatus, Proposal, Customer, UserSettings } from '@/lib/types';
import { FinancialSummary } from '@/components/financial/financial-summary';
import { DraggableHeader } from './columns';
import { Separator } from '@/components/ui/separator';
import { BankIcon } from '@/components/bank-icon';
import { useTheme } from '@/components/theme-provider';

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
  
  const [startDateInput, setStartDateInput] = React.useState('');
  const [endDateInput, setEndDateInput] = React.useState('');
  const [appliedDateRange, setAppliedDateRange] = React.useState<DateRange | undefined>(undefined);

  // FILTRAGEM REATIVA INTEGRADA
  const filteredData = React.useMemo(() => {
    let list = data;

    // 1. Filtro de Aba
    if (statusFilter !== 'Todos') {
        list = list.filter(p => p.commissionStatus === statusFilter);
    }

    // 2. Filtro de Bancos
    if (bankFilter !== 'all') {
        list = list.filter(p => p.bank === bankFilter);
    }

    // 3. Filtro de Promotoras
    if (promoterFilter !== 'all') {
        list = list.filter(p => p.promoter === promoterFilter);
    }

    // 4. Filtro de Data
    if (appliedDateRange && appliedDateRange.from) {
        const fromDate = appliedDateRange.from;
        const toDate = appliedDateRange.to ? endOfDay(appliedDateRange.to) : endOfDay(appliedDateRange.from);
        list = list.filter(p => {
            const d = p.commissionPaymentDate ? new Date(p.commissionPaymentDate) : null;
            return d && d >= fromDate && d <= toDate;
        });
    }

    // 5. Busca Inteligente
    if (globalFilter) {
        const lower = globalFilter.toLowerCase();
        list = list.filter(p => 
            p.customer.name.toLowerCase().includes(lower) ||
            p.customer.cpf.includes(lower) ||
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
    onColumnVisibilityChange: setColumnVisibility,
    getFilteredRowModel: getFilteredRowModel(),
    onRowSelectionChange: setRowSelection,
    state: { sorting, globalFilter, rowSelection, columnVisibility },
    meta: { isPrivacyMode, userSettings },
  });

  React.useImperativeHandle(ref, () => ({ table }));

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

        {/* NÍVEL 1: STATUS E PARCEIROS */}
        <div className="flex flex-wrap items-center justify-between gap-4 bg-muted/10 p-2 rounded-xl border border-border/50 shadow-sm">
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
                                className="status-tab font-black uppercase text-[10px] tracking-widest px-4 h-9"
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
                    <SelectTrigger className="h-9 w-auto min-w-[180px] bg-card border-primary/10 shadow-sm rounded-full text-xs font-bold uppercase px-4">
                        <SelectValue placeholder="TODOS OS BANCOS" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">TODOS OS BANCOS</SelectItem>
                        {banksList.map(b => (
                            <SelectItem key={b} value={b}>
                                <div className="flex items-center gap-2">
                                    <BankIcon bankName={b} domain={userSettings?.bankDomains?.[b]} showLogo={true} className="h-4 w-4" />
                                    <span>{cleanBankName(b).toUpperCase()}</span>
                                </div>
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                <Select value={promoterFilter} onValueChange={setPromoterFilter}>
                    <SelectTrigger className="h-9 w-auto min-w-[180px] bg-card border-primary/10 shadow-sm rounded-full text-xs font-bold uppercase px-4">
                        <SelectValue placeholder="TODAS PROMOTORAS" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">TODAS PROMOTORAS</SelectItem>
                        {promotersList.map(p => (
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

        {/* NÍVEL 2: PERÍODO E DATAS */}
        <div className="flex flex-wrap items-center gap-3 bg-muted/5 p-2 rounded-xl">
            <div className="flex items-center gap-2 bg-card border rounded-full px-3 py-1 shadow-sm">
                <Select onValueChange={(val) => {
                    const now = new Date();
                    let from: Date;
                    switch(val) {
                        case 'today': from = startOfDay(now); break;
                        case 'yesterday': from = startOfDay(subDays(now, 1)); break;
                        case 'month': from = startOfMonth(now); break;
                        default: from = startOfMonth(now);
                    }
                    setStartDateInput(format(from, 'dd/MM/yyyy'));
                    setEndDateInput(format(now, 'dd/MM/yyyy'));
                    setAppliedDateRange({ from, to: now });
                }}>
                    <SelectTrigger className="h-7 w-[110px] border-none bg-transparent focus:ring-0 text-xs font-bold uppercase p-0">
                        <CalendarIcon className="mr-2 h-3.5 w-3.5 text-primary" />
                        <SelectValue placeholder="PERÍODO" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="today">Hoje</SelectItem>
                        <SelectItem value="yesterday">Ontem</SelectItem>
                        <SelectItem value="month">Mês Atual</SelectItem>
                    </SelectContent>
                </Select>
                <Separator orientation="vertical" className="h-4 mx-1" />
                <div className="flex items-center gap-1">
                    <Input 
                        placeholder="De" 
                        value={startDateInput}
                        onChange={(e) => handleDateInputChange(e.target.value, 'start')}
                        className="h-7 w-20 border-none bg-muted/30 text-[10px] text-center font-bold"
                    />
                    <span className="text-muted-foreground opacity-40">-</span>
                    <Input 
                        placeholder="Até" 
                        value={endDateInput}
                        onChange={(e) => handleDateInputChange(e.target.value, 'end')}
                        className="h-7 w-20 border-none bg-muted/30 text-[10px] text-center font-bold"
                    />
                </div>
            </div>
            <Button size="sm" onClick={handleApplyFilter} className="h-9 bg-primary hover:bg-primary/90 rounded-full px-6 text-xs font-bold uppercase shadow-md gap-2">
                <Filter className="h-3.5 w-3.5" /> Aplicar
            </Button>
            {appliedDateRange && (
                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => { setStartDateInput(''); setEndDateInput(''); setAppliedDateRange(undefined); }}>
                    <X className="h-4 w-4" />
                </Button>
            )}
        </div>

        {/* NÍVEL 3: BUSCA E COLUNAS */}
        <div className="flex items-center justify-between gap-4 py-2">
            <div className='relative w-full max-w-md'>
                <Search className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground opacity-60' />
                <Input
                    placeholder="Busca Inteligente (Nome, CPF, ID, Proposta...)"
                    value={globalFilter ?? ''}
                    onChange={(e) => setGlobalFilter(e.target.value)}
                    className="pl-9 h-11 bg-card border-primary/10 rounded-full text-sm font-medium shadow-sm focus-visible:ring-primary/20"
                />
            </div>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="h-11 rounded-full px-6 font-bold border-primary/10 bg-card shadow-sm gap-2">
                        Colunas <ChevronDown className="h-4 w-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>Exibir/Ocultar</DropdownMenuLabel>
                    <Separator />
                    {table.getAllColumns().filter(c => c.getCanHide()).map(column => (
                        <DropdownMenuCheckboxItem
                            key={column.id}
                            className="capitalize text-xs font-medium"
                            checked={column.getIsVisible()}
                            onCheckedChange={v => column.toggleVisibility(!!v)}
                        >
                            {column.id}
                        </DropdownMenuCheckboxItem>
                    ))}
                </DropdownMenuContent>
            </DropdownMenu>
        </div>

        <Card className="financial-table border-border/50 shadow-xl rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
                <Table>
                    <TableHeader className="bg-muted/20">
                        {table.getHeaderGroups().map(hg => (
                            <TableRow key={hg.id} className="hover:bg-transparent border-b-2">
                                {hg.headers.map(h => <DraggableHeader key={h.id} header={h} />)}
                            </TableRow>
                        ))}
                    </TableHeader>
                    <TableBody>
                        {table.getRowModel().rows.length > 0 ? (
                            table.getRowModel().rows.map(row => {
                                const status = row.original.commissionStatus;
                                const colorValue = statusColors[status?.toUpperCase() || ''] || statusColors[status || ''];
                                return (
                                    <TableRow 
                                        key={row.id} 
                                        className={cn(
                                            "transition-colors border-b",
                                            colorValue && "status-row-custom"
                                        )}
                                        style={colorValue ? { '--status-color': colorValue } as any : {}}
                                    >
                                        {row.getVisibleCells().map(cell => (
                                            <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                                        ))}
                                    </TableRow>
                                )
                            })
                        ) : (
                            <TableRow>
                                <TableCell colSpan={columns.length} className="h-32 text-center text-muted-foreground font-bold uppercase text-[10px] tracking-[0.2em] opacity-40">
                                    Nenhum registro encontrado para este filtro.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </Card>
    </div>
  );
});

FinancialDataTable.displayName = 'FinancialDataTable';
