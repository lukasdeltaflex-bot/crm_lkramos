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
  ColumnOrderState,
  PaginationState,
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
import { format, startOfDay, endOfDay, subDays, startOfMonth, endOfMonth, isValid, parse } from 'date-fns';
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
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { X, Filter, Search, Calendar as CalendarIcon, ChevronDown, ChevronsLeft, ChevronsRight, Snowflake, User, Landmark, Building2, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn, cleanBankName, normalizeString, formatCurrency, isProposalCritical, parseDateSafe } from '@/lib/utils';
import type { ProposalWithCustomer, UserSettings, CommissionStatus } from '@/lib/types';
import { DraggableHeader } from './columns';
import { Separator } from '@/components/ui/separator';
import { useTheme } from '@/components/theme-provider';
import { BankIcon } from '@/components/bank-icon';
import { useUser } from '@/firebase';
import { safeStorage } from '@/lib/storage-utils';

function normalizeDate(value: any): Date | null {
  if (!value) return null;
  if (value?.seconds) return new Date(value.seconds * 1000);
  if (typeof value.toDate === 'function') return value.toDate();
  if (value instanceof Date) return new Date(value);
  if (typeof value === 'string') {
    let parsed = new Date(value);
    if (!isNaN(parsed.getTime())) return parsed;
    const parts = value.split('/');
    if (parts.length === 3) {
      const d = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
      if (!isNaN(d.getTime())) return d;
    }
  }
  return null;
}

function isWithinRange(dateValue: any, start: Date, end: Date) {
  const d = normalizeDate(dateValue);
  if (!d) return false;
  const startDate = new Date(start);
  const endDate = new Date(end);
  startDate.setHours(0, 0, 0, 0);
  endDate.setHours(23, 59, 59, 999);
  return d >= startDate && d <= endDate;
}

const COLUMN_LABELS: Record<string, string> = {
    col_select: "Seleção",
    col_date: "Data Digitação",
    col_bank: "Banco",
    col_customer: "Cliente",
    col_cpf: "CPF",
    col_pnum: "N° Proposta",
    col_product: "Produto",
    col_gross: "Valor Bruto",
    col_comm: "Comissão (%)",
    col_comm_val: "Valor Comissão",
    col_proposal_status: "Status Proposta",
    col_comm_status: "Status Comissão",
    col_payment_date: "Data Pagamento",
    col_promoter: "Promotora",
    col_operator: "Operador",
    col_actions: "Ações"
};

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
  const { user } = useUser();
  const { statusColors } = useTheme();
  const [sorting, setSorting] = React.useState<SortingState>([{ id: 'col_date', desc: true }]);
  const [statusFilter, setStatusFilter] = React.useState('Todos');
  const [globalFilter, setGlobalFilter] = React.useState('');
  const [frozenCount, setFrozenCount] = React.useState(2);
  
  const [bankFilters, setBankFilters] = React.useState<string[]>([]);
  const [promoterFilters, setPromoterFilters] = React.useState<string[]>([]);
  const [operatorFilters, setOperatorFilters] = React.useState<string[]>([]);

  const [columnSizing, setColumnSizing] = React.useState<ColumnSizingState>({});
  const [isClient, setIsClient] = React.useState(false);
  const [isLoaded, setIsLoaded] = React.useState(false);

  const [pagination, setPagination] = React.useState<PaginationState>({ pageIndex: 0, pageSize: 10 });
  
  const initialIds = React.useMemo(() => columns.map(c => c.id!).filter(Boolean), [columns]);
  const [columnOrder, setColumnOrder] = React.useState<ColumnOrderState>(initialIds);

  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({
    'col_promoter': false,
    'col_operator': true,
    'col_payment_date': true,
    'col_bank': true,
    'col_product': true
  });
  
  const [startDateInput, setStartDateInput] = React.useState('');
  const [endDateInput, setEndDateInput] = React.useState('');
  const [appliedDateRange, setAppliedDateRange] = React.useState<DateRange | undefined>(undefined);

  const handlePaginationChange = (updater: any) => {
    setPagination((old) => {
      const next = typeof updater === 'function' ? updater(old) : updater;
      return next;
    });
  };

  const handleDateMask = (e: React.ChangeEvent<HTMLInputElement>) => {
    let v = e.target.value.replace(/\D/g, "").substring(0, 8);
    if (v.length > 4) v = v.replace(/(\d{2})(\d{2})(\d)/, "$1/$2/$3");
    else if (v.length > 2) v = v.replace(/(\d{2})(\d)/, "$1/$2");
    return v;
  };

  const handleApplyFilter = () => {
    const s = parse(startDateInput, 'dd/MM/yyyy', new Date());
    const e = parse(endDateInput, 'dd/MM/yyyy', new Date());
    if (isValid(s)) {
        setAppliedDateRange({ from: s, to: isValid(e) ? e : s });
    } else {
        setAppliedDateRange(undefined);
    }
  };

  const handleClearAllFilters = () => {
      setStatusFilter('Todos');
      setGlobalFilter('');
      setBankFilters([]);
      setPromoterFilters([]);
      setOperatorFilters([]);
      setStartDateInput('');
      setEndDateInput('');
      setAppliedDateRange(undefined);
  };

  const applyRangeShortcut = (range: string) => {
    const now = new Date();
    let from = startOfMonth(now);
    let to = now;
    if (range === 'today') from = startOfDay(now);
    if (range === 'yesterday') { from = startOfDay(subDays(now, 1)); to = subDays(now, 1); }
    if (range === 'week') from = subDays(now, 7);
    if (range === 'month') { from = startOfMonth(now); to = endOfMonth(now); }
    
    setStartDateInput(format(from, 'dd/MM/yyyy'));
    setEndDateInput(format(to, 'dd/MM/yyyy'));
    setAppliedDateRange({ from, to });
  };

  const hasActiveFilters = statusFilter !== 'Todos' || bankFilters.length > 0 || promoterFilters.length > 0 || operatorFilters.length > 0 || !!globalFilter || !!appliedDateRange;

  React.useEffect(() => {
    if (!user?.uid) return;
    setIsClient(true);
    const prefix = user.uid;
    setFrozenCount(safeStorage.get(`${prefix}-fin-frozen`, 2));
    setColumnVisibility(safeStorage.get(`${prefix}-fin-visibility`, columnVisibility));
    setColumnSizing(safeStorage.get(`${prefix}-fin-sizing`, {}));
    const savedPageSize = safeStorage.get(`${prefix}-fin-pageSize`, 10);
    setPagination(p => ({ ...p, pageSize: savedPageSize }));
    const savedOrder = safeStorage.get<string[]>(`${prefix}-fin-order`, []);
    if (savedOrder.length === initialIds.length) setColumnOrder(savedOrder);
    setIsLoaded(true);
  }, [initialIds, user?.uid]);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }), useSensor(KeyboardSensor));

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

  const filteredData = React.useMemo(() => {
    let list = data;

    if (statusFilter !== 'Todos') {
        const target = statusFilter.toUpperCase();
        list = list.filter(p => (p.commissionStatus || '').toUpperCase() === target);
    }

    if (appliedDateRange && appliedDateRange.from) {
        const start = startOfDay(appliedDateRange.from);
        const end = endOfDay(appliedDateRange.to || appliedDateRange.from);
        list = list.filter(p => {
            const pDate = normalizeDate(p.commissionPaymentDate);
            return pDate && pDate >= start && pDate <= end;
        });
    }

    if (bankFilters.length > 0) list = list.filter(p => bankFilters.includes(p.bank));
    if (promoterFilters.length > 0) list = list.filter(p => promoterFilters.includes(p.promoter));
    if (operatorFilters.length > 0) list = list.filter(p => operatorFilters.includes(p.operator || 'Sem Operador'));
    
    return list;
  }, [data, statusFilter, bankFilters, promoterFilters, operatorFilters, appliedDateRange]);

  const table = useReactTable({
    data: filteredData,
    columns,
    getRowId: (row) => row.id,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    onGlobalFilterChange: setGlobalFilter,
    onColumnSizingChange: setColumnSizing,
    onColumnOrderChange: setColumnOrder,
    onPaginationChange: handlePaginationChange,
    enableColumnResizing: true,
    columnResizeMode: 'onChange',
    state: { sorting, globalFilter, rowSelection, columnVisibility, columnSizing, columnOrder, pagination },
    globalFilterFn: (row, columnId, filterValue) => {
        const searchTerm = String(filterValue ?? '').trim();
        if (!searchTerm) return true;
        const customer = row.original.customer;
        const p = row.original;
        const normalizedSearch = normalizeString(searchTerm);
        
        const searchableFields = [customer?.name, customer?.cpf, p.proposalNumber, p.operator, p.bank, p.promoter, p.product];
        const matchesText = searchableFields.some(field => field && normalizeString(String(field)).includes(normalizedSearch));
        
        const isPureNumber = /^\d+$/.test(searchTerm);
        const matchesId = isPureNumber && (
            String(customer?.numericId) === searchTerm || 
            (customer?.cpf || '').replace(/\D/g, '').startsWith(searchTerm) ||
            (p.proposalNumber || '').replace(/\D/g, '').startsWith(searchTerm)
        );

        return matchesText || matchesId;
    },
    meta: { isPrivacyMode, userSettings, statusColors }
  });

  React.useImperativeHandle(ref, () => ({ table }));

  const totalTableWidth = table.getTotalSize();
  const numSelected = table.getFilteredSelectedRowModel().rows.length;
  const totalGross = table.getFilteredSelectedRowModel().rows.reduce((acc, r) => acc + (r.original.grossAmount || 0), 0);
  const totalCommission = table.getFilteredSelectedRowModel().rows.reduce((acc, r) => acc + (r.original.commissionValue || 0), 0);

  const columnOffsets = React.useMemo(() => {
    const visibleColumns = table.getVisibleLeafColumns();
    const offsets: Record<string, number> = {};
    let currentOffset = 0;
    visibleColumns.forEach(col => {
        offsets[col.id] = currentOffset;
        currentOffset += col.getSize();
    });
    return offsets;
  }, [table.getVisibleLeafColumns(), columnSizing]);

  const toggleBankFilter = (bank: string) => { setBankFilters(prev => prev.includes(bank) ? prev.filter(b => b !== bank) : [...prev, bank]); };
  const togglePromoterFilter = (promoter: string) => { setPromoterFilters(prev => prev.includes(promoter) ? prev.filter(p => p !== promoter) : [...prev, promoter]); };
  const toggleOperatorFilter = (op: string) => { setOperatorFilters(prev => prev.includes(op) ? prev.filter(o => o !== op) : [...prev, op]); };

  const uniqueOperators = React.useMemo(() => Array.from(new Set(data.map(p => p.operator || 'Sem Operador'))).sort(), [data]);
  const uniqueBanks = React.useMemo(() => Array.from(new Set(data.map(p => p.bank))).sort(), [data]);
  const uniquePromoters = React.useMemo(() => Array.from(new Set(data.map(p => p.promoter))).sort(), [data]);

  if (!isClient) return <div className="h-96 w-full bg-muted/10 animate-pulse rounded-xl" />;

  return (
    <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd} sensors={sensors}>
        <div className="space-y-4 w-full">
            <div className="flex flex-wrap items-center justify-between gap-4 bg-muted/10 p-3 rounded-2xl border-2 border-zinc-200 shadow-sm">
                <Tabs value={statusFilter} onValueChange={setStatusFilter}>
                    <TabsList className="bg-transparent p-0 gap-1 h-auto flex-wrap">
                        <TabsTrigger value="Todos" className="font-bold px-4 h-9">Todos</TabsTrigger>
                        {['Paga', 'Pendente', 'Parcial'].map(s => (
                            <TabsTrigger key={s} value={s} className="status-tab font-black uppercase text-[10px] tracking-widest px-4 h-9 border-2 border-transparent data-[state=active]:bg-background" style={{ '--status-color': statusColors[s.toUpperCase()] || statusColors[s] } as any}>
                                {s === 'Paga' ? 'PAGAS' : s === 'Pendente' ? 'PENDENTES' : 'PARCIAIS'}
                            </TabsTrigger>
                        ))}
                    </TabsList>
                </Tabs>
                <div className="flex items-center gap-3 ml-auto">
                    <Select value={String(frozenCount)} onValueChange={(val) => setFrozenCount(Number(val))}>
                        <SelectTrigger className="h-10 min-w-[140px] rounded-full text-[10px] font-black uppercase border-2 border-zinc-300 bg-background shadow-sm">
                            <div className="flex items-center gap-2"><Snowflake className="h-3.5 w-3.5 text-blue-500" /><SelectValue placeholder="Congelar" /></div>
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="0" className="text-[10px] font-bold uppercase">Nenhuma fixa</SelectItem>
                            <SelectItem value="1" className="text-[10px] font-bold uppercase">Fixar 1° Coluna</SelectItem>
                            <SelectItem value="2" className="text-[10px] font-bold uppercase">Fixar 2° Colunas</SelectItem>
                            <SelectItem value="3" className="text-[10px] font-bold uppercase">Fixar 3° Colunas</SelectItem>
                        </SelectContent>
                    </Select>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" className="h-11 rounded-full px-6 font-black border-2 border-zinc-300 bg-background shadow-md gap-2 text-xs uppercase tracking-widest">Colunas <ChevronDown className="ml-2 h-4 w-4 opacity-50" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56 shadow-2xl border-2">
                            <DropdownMenuLabel>Personalizar Visão</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            {table.getAllColumns().filter(c => c.getCanHide()).map(column => (
                                <DropdownMenuCheckboxItem key={column.id} checked={column.getIsVisible()} onCheckedChange={v => column.toggleVisibility(!!v)} className="capitalize text-xs font-bold">
                                    {COLUMN_LABELS[column.id] || column.id}
                                </DropdownMenuCheckboxItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>
            <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-3 bg-background border-2 border-zinc-300 rounded-full px-3 py-1 shadow-sm">
                    <Select onValueChange={applyRangeShortcut}>
                        <SelectTrigger className="h-7 w-[120px] border-none bg-transparent focus:ring-0 text-xs font-black uppercase p-0"><CalendarIcon className="mr-2 h-3.5 w-3.5 text-primary" /><SelectValue placeholder="PERÍODO" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="today">Hoje</SelectItem>
                            <SelectItem value="yesterday">Ontem</SelectItem>
                            <SelectItem value="week">Últimos 7 dias</SelectItem>
                            <SelectItem value="month">Mês Atual</SelectItem>
                        </SelectContent>
                    </Select>
                    <Separator orientation="vertical" className="h-4 mx-1 bg-zinc-300" />
                    <div className="flex items-center gap-1">
                        <Input placeholder="De" value={startDateInput} onChange={(e) => setStartDateInput(handleDateMask(e))} className="h-7 w-28 border-none bg-muted/40 text-[11px] text-center font-black rounded-full focus-visible:ring-primary/20" />
                        <span className="text-muted-foreground font-black opacity-40">-</span>
                        <Input placeholder="Até" value={endDateInput} onChange={(e) => setEndDateInput(handleDateMask(e))} className="h-7 w-28 border-none bg-muted/40 text-[11px] text-center font-black rounded-full focus-visible:ring-primary/20" />
                    </div>
                    <Button size="sm" onClick={handleApplyFilter} className="h-7 bg-primary text-white hover:bg-primary/90 rounded-full px-4 text-[10px] font-black uppercase shadow-sm gap-1.5 transition-all"><Filter className="h-3 w-3" /> APLICAR</Button>
                    {appliedDateRange && ( <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => { setStartDateInput(''); setEndDateInput(''); setAppliedDateRange(undefined); }}><X className="h-3.5 w-3.5" /></Button> )}
                </div>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild><Button variant="outline" className="h-10 rounded-full font-bold px-6 border-2 border-zinc-300 bg-background shadow-sm text-xs gap-2"><User className="h-4 w-4" /> Operadores <ChevronDown className="h-3 w-3 opacity-50" /></Button></DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56 max-h-80 overflow-y-auto border-2">
                        {uniqueOperators.map(op => ( <DropdownMenuCheckboxItem key={op} checked={operatorFilters.includes(op)} onCheckedChange={() => toggleOperatorFilter(op)} className="font-bold text-xs uppercase">{op}</DropdownMenuCheckboxItem> ))}
                    </DropdownMenuContent>
                </DropdownMenu>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild><Button variant="outline" className="h-10 rounded-full font-bold px-6 border-2 border-zinc-300 bg-background shadow-sm text-xs gap-2"><Landmark className="h-4 w-4" /> Bancos <ChevronDown className="h-3 w-3 opacity-50" /></Button></DropdownMenuTrigger>
                    <DropdownMenuContent className="w-64 max-h-80 overflow-y-auto border-2">
                        {uniqueBanks.map(bank => (
                            <DropdownMenuCheckboxItem key={bank} checked={bankFilters.includes(bank)} onCheckedChange={() => toggleBankFilter(bank)} className="font-bold text-[10px] uppercase">
                                <div className="flex items-center gap-2"><BankIcon bankName={bank} domain={userSettings?.bankDomains?.[bank]} showLogo={userSettings?.showBankLogos ?? true} className="h-3 w-3" /><span className="truncate">{cleanBankName(bank)}</span></div>
                            </DropdownMenuCheckboxItem>
                        ))}
                    </DropdownMenuContent>
                </DropdownMenu>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild><Button variant="outline" className="h-10 rounded-full font-bold px-6 border-2 border-zinc-300 bg-background shadow-sm text-xs gap-2"><Building2 className="h-4 w-4" /> Promotoras <ChevronDown className="h-3 w-3 opacity-50" /></Button></DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56 max-h-80 overflow-y-auto border-2">
                        {uniquePromoters.map(prom => ( <DropdownMenuCheckboxItem key={prom} checked={promoterFilters.includes(prom)} onCheckedChange={() => togglePromoterFilter(prom)} className="font-bold text-xs uppercase"><div className="flex items-center gap-2"><BankIcon bankName={prom} domain={userSettings?.promoterDomains?.[prom]} showLogo={userSettings?.showPromoterLogos ?? true} className="h-3 w-3" /><span className="truncate">{prom}</span></div></DropdownMenuCheckboxItem> ))}
                    </DropdownMenuContent>
                </DropdownMenu>
                {hasActiveFilters && ( <Button variant="ghost" size="sm" onClick={handleClearAllFilters} className="text-red-600 hover:text-red-700 hover:bg-red-50 font-black text-[10px] uppercase gap-1.5 rounded-full"><X className="h-3 w-3" /> Limpar Filtros</Button> )}
            </div>
            <div className='relative w-full group'>
                <Search className='absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-primary opacity-80' /><Input placeholder="Busca por ID exato, CPF, Nome ou Proposta..." value={globalFilter ?? ''} onChange={(e) => setGlobalFilter(e.target.value)} className="pl-10 h-11 bg-background border-2 border-zinc-300 rounded-full text-base font-bold shadow-md" />
            </div>
            <Card className="border-2 border-zinc-300 shadow-xl rounded-xl overflow-hidden bg-card p-1">
                <ScrollArea className="h-[calc(100vh-280px)] w-full scroll-area-priority">
                    <Table style={{ width: totalTableWidth, tableLayout: 'fixed' }}>
                        <TableHeader className="bg-background border-b-2 sticky top-0 z-50 shadow-sm">
                            {table.getHeaderGroups().map(hg => (
                                <TableRow key={hg.id} className="border-b hover:bg-transparent">
                                    <SortableContext items={columnOrder} strategy={horizontalListSortingStrategy}>
                                        {hg.headers.map((h, i) => (
                                            <DraggableHeader 
                                                key={h.id} 
                                                header={h as any} 
                                                className={cn(
                                                    i < frozenCount && "sticky z-40 bg-background shadow-[4px_0_10px_rgba(0,0,0,0.12)] border-r-2"
                                                )}
                                                style={i < frozenCount ? { left: `${columnOffsets[h.id]}px` } : {}}
                                            />
                                        ))}
                                    </SortableContext>
                                </TableRow>
                            ))}
                        </TableHeader>
                        <TableBody>
                            {table.getRowModel().rows.length > 0 ? (
                                table.getRowModel().rows.map(row => {
                                    const p = row.original;
                                    const isCritical = isProposalCritical(p);
                                    const commStatus = p.commissionStatus;
                                    const effectiveStatus = (commStatus === 'Paga' || commStatus === 'Parcial' || commStatus === 'Pendente') ? commStatus : (p.dateApproved ? 'Pendente' : null);
                                    const colorValue = effectiveStatus ? (statusColors[effectiveStatus.toUpperCase()] || statusColors[effectiveStatus]) : undefined;
                                    
                                    return (
                                        <TableRow 
                                            key={row.id} 
                                            data-state={row.getIsSelected() && 'selected'} 
                                            className={cn(
                                                "transition-colors border-b h-14 hover:bg-primary/[0.03]", 
                                                colorValue && "status-row-custom",
                                                isCritical && "status-row-critical"
                                            )} 
                                            style={colorValue ? { '--status-color': colorValue } as any : {}}
                                        >
                                            {row.getVisibleCells().map((cell, i) => (
                                                <TableCell key={cell.id} style={i < frozenCount ? { width: cell.column.getSize(), left: `${columnOffsets[cell.column.id]}px` } : { width: cell.column.getSize() }} className={cn("p-3 text-sm border-none bg-background", i < frozenCount && "sticky z-30 shadow-[4px_0_10px_rgba(0,0,0,0.08)] border-r-2")}> {flexRender(cell.column.columnDef.cell, cell.getContext())} </TableCell>
                                            ))}
                                        </TableRow>
                                    )
                                })
                            ) : ( <TableRow><TableCell colSpan={columns.length} className="h-32 text-center text-muted-foreground font-black uppercase text-[10px] tracking-widest opacity-40">Nenhum registro encontrado.</TableCell></TableRow> )}
                        </TableBody>
                    </Table>
                    <ScrollBar orientation="horizontal" />
                    <ScrollBar orientation="vertical" />
                </ScrollArea>
                <div className="flex items-center justify-between px-6 py-4 border-t-2 bg-muted/10 font-black text-[11px] uppercase tracking-[0.1em] text-foreground/60 min-h-[64px]">
                    <div className="flex items-center gap-4">
                        <div>{numSelected} SELECIONADOS.</div>
                        {numSelected > 0 && (
                            <>
                                <Separator orientation="vertical" className="h-4 bg-zinc-300" />
                                <div className="text-primary font-black">BRUTO: <span className="text-foreground">{isPrivacyMode ? '•••••' : formatCurrency(totalGross)}</span></div>
                                <Separator orientation="vertical" className="h-4 bg-zinc-300" />
                                <div className="text-primary font-black">SALDO COMISSÃO: <span className="text-foreground">{isPrivacyMode ? '•••••' : formatCurrency(totalCommission)}</span></div>
                            </>
                        )}
                    </div>
                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-2">
                            <span>LINHAS:</span>
                            <Select value={String(table.getState().pagination.pageSize)} onValueChange={(val) => table.setPageSize(Number(val))}>
                                <SelectTrigger className="h-8 w-16 border-2 font-black text-[10px]"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    {[10, 20, 30, 50, 100].map(size => ( <SelectItem key={size} value={String(size)} className="text-[10px] font-bold">{size}</SelectItem> ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="text-primary font-black uppercase text-[11px] tracking-widest">PÁG {table.getState().pagination.pageIndex + 1} DE {table.getPageCount()}</div>
                        <div className="flex items-center gap-2">
                            <Button variant="outline" size="icon" className="h-9 w-9 rounded-full border-2 bg-background shadow-sm transition-all hover:bg-primary/5 active:scale-95" onClick={() => table.setPageIndex(0)} disabled={!table.getCanPreviousPage()}><ChevronsLeft className="h-4 w-4" /></Button>
                            <Button variant="outline" size="icon" className="h-9 w-9 rounded-full border-2 bg-background shadow-sm transition-all hover:bg-primary/5 active:scale-95" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}><ChevronLeft className="h-4 w-4" /></Button>
                            <Button variant="outline" size="icon" className="h-9 w-9 rounded-full border-2 bg-background shadow-sm transition-all hover:bg-primary/5 active:scale-95" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}><ChevronRight className="h-4 w-4" /></Button>
                            <Button variant="outline" size="icon" className="h-9 w-9 rounded-full border-2 bg-background shadow-sm transition-all hover:bg-primary/5 active:scale-95" onClick={() => table.setPageIndex(table.getPageCount() - 1)} disabled={!table.getCanNextPage()}><ChevronsRight className="h-4 w-4" /></Button>
                        </div>
                    </div>
                </div>
            </Card>
        </div>
    </DndContext>
  );
});

FinancialDataTable.displayName = 'FinancialDataTable';
