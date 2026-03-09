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
import { parse, isValid, startOfDay, endOfDay, subDays, startOfMonth, format } from 'date-fns';
import type { DateRange } from 'react-day-picker';

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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Card } from '@/components/ui/card';
import { Filter, X, Search, Calendar as CalendarIcon, ChevronDown, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Landmark, Building2, User } from 'lucide-react';
import type { ProposalStatus, UserSettings } from '@/lib/types';
import { DraggableHeader } from './columns';
import type { ProposalWithCustomer } from './page';
import { Separator } from '@/components/ui/separator';
import { normalizeString, cn, formatCurrency, cleanBankName } from '@/lib/utils';
import { useTheme } from '@/components/theme-provider';
import { BankIcon } from '@/components/bank-icon';

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
  const tableContainerRef = React.useRef<HTMLDivElement>(null);
  const { statusColors } = useTheme();
  const [statusFilter, setStatusFilter] = React.useState('Todos');
  const [globalFilter, setGlobalFilter] = React.useState('');
  
  // 🚀 FILTROS MULTI-SELEÇÃO
  const [bankFilters, setBankFilters] = React.useState<string[]>([]);
  const [promoterFilters, setPromoterFilters] = React.useState<string[]>([]);
  const [operatorFilters, setOperatorFilters] = React.useState<string[]>([]);

  const [startDateInput, setStartDateInput] = React.useState('');
  const [endDateInput, setEndDateInput] = React.useState('');
  const [appliedDateRange, setAppliedDateRange] = React.useState<DateRange | undefined>(undefined);
  const [columnSizing, setColumnSizing] = React.useState<ColumnSizingState>({});
  const [sorting, setSorting] = React.useState<SortingState>([{ id: 'Data Digitação', desc: true }]);
  const [isClient, setIsClient] = React.useState(false);

  const [pagination, setPagination] = React.useState<PaginationState>({ pageIndex: 0, pageSize: 10 });
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({
    'Operador': false,
    'Data Averbação': false,
    'Data Pgto. Cliente': false,
    'Chegada Saldo': false,
  });

  const initialColumns = React.useMemo(() => columns.map(c => c.id!).filter(Boolean), [columns]);
  const [columnOrder, setColumnOrder] = React.useState<ColumnOrderState>([...initialColumns]);

  React.useEffect(() => {
    setIsClient(true);
    try {
        const savedPageSize = localStorage.getItem('lk-proposals-pageSize');
        if (savedPageSize) setPagination(p => ({ ...p, pageSize: Number(savedPageSize) }));

        const savedStatus = localStorage.getItem('lk-proposals-filter-status');
        if (savedStatus) setStatusFilter(savedStatus);

        const savedBanks = localStorage.getItem('lk-proposals-filter-banks');
        if (savedBanks) setBankFilters(JSON.parse(savedBanks));

        const savedPromoters = localStorage.getItem('lk-proposals-filter-promoters');
        if (savedPromoters) setPromoterFilters(JSON.parse(savedPromoters));

        const savedOperators = localStorage.getItem('lk-proposals-filter-operators');
        if (savedOperators) setOperatorFilters(JSON.parse(savedOperators));

        const savedSearch = localStorage.getItem('lk-proposals-filter-search');
        if (savedSearch) setGlobalFilter(savedSearch);

        const savedDates = localStorage.getItem('lk-proposals-filter-dates');
        if (savedDates) {
            const parsed = JSON.parse(savedDates);
            setStartDateInput(parsed.startStr || '');
            setEndDateInput(parsed.endStr || '');
            if (parsed.from) {
                setAppliedDateRange({
                    from: new Date(parsed.from),
                    to: parsed.to ? new Date(parsed.to) : undefined
                });
            }
        }

        const savedVisibility = localStorage.getItem('lk-proposals-visibility');
        if (savedVisibility) setColumnVisibility(JSON.parse(savedVisibility));

        const savedSizing = localStorage.getItem('lk-proposals-sizing');
        if (savedSizing) setColumnSizing(JSON.parse(savedSizing));

        const savedOrder = localStorage.getItem('lk-proposals-order');
        if (savedOrder) {
            const parsedOrder = JSON.parse(savedOrder) as string[];
            const missingColumns = initialColumns.filter(id => !parsedOrder.includes(id));
            if (missingColumns.length > 0) {
                const newOrder = [...parsedOrder];
                const actionsIdx = newOrder.indexOf('Actions');
                if (actionsIdx !== -1) {
                    newOrder.splice(actionsIdx, 0, ...missingColumns);
                } else {
                    newOrder.push(...missingColumns);
                }
                setColumnOrder(newOrder);
            } else {
                setColumnOrder(parsedOrder);
            }
        } else {
            setColumnOrder([...initialColumns]);
        }
    } catch (e) {}
  }, [initialColumns]);

  const hasActiveFilters = statusFilter !== 'Todos' || bankFilters.length > 0 || promoterFilters.length > 0 || operatorFilters.length > 0 || !!globalFilter || !!appliedDateRange;

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

  React.useEffect(() => {
    if (isClient) {
        try {
            localStorage.setItem('lk-proposals-filter-status', statusFilter);
            localStorage.setItem('lk-proposals-filter-banks', JSON.stringify(bankFilters));
            localStorage.setItem('lk-proposals-filter-promoters', JSON.stringify(promoterFilters));
            localStorage.setItem('lk-proposals-filter-operators', JSON.stringify(operatorFilters));
            localStorage.setItem('lk-proposals-filter-search', globalFilter);
            localStorage.setItem('lk-proposals-filter-dates', JSON.stringify({
                startStr: startDateInput,
                endStr: endDateInput,
                from: appliedDateRange?.from?.toISOString(),
                to: appliedDateRange?.to?.toISOString()
            }));
            localStorage.setItem('lk-proposals-visibility', JSON.stringify(columnVisibility));
            localStorage.setItem('lk-proposals-order', JSON.stringify(columnOrder));
            localStorage.setItem('lk-proposals-sizing', JSON.stringify(columnSizing));
        } catch(e) {}
    }
  }, [statusFilter, bankFilters, promoterFilters, operatorFilters, globalFilter, appliedDateRange, startDateInput, endDateInput, columnVisibility, columnOrder, columnSizing, isClient]);

  const handlePaginationChange = (updater: any) => {
    setPagination((old) => {
      const next = typeof updater === 'function' ? updater(old) : updater;
      if (typeof window !== 'undefined') {
        try { localStorage.setItem('lk-proposals-pageSize', String(next.pageSize)); } catch(e) {}
      }
      return next;
    });
  };

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
        list = list.filter(p => p.status === statusFilter);
    }

    if (bankFilters.length > 0) {
        list = list.filter(p => bankFilters.includes(p.bank));
    }

    if (promoterFilters.length > 0) {
        list = list.filter(p => promoterFilters.includes(p.promoter));
    }

    if (operatorFilters.length > 0) {
        list = list.filter(p => operatorFilters.includes(p.operator || 'Sem Operador'));
    }

    if (appliedDateRange && appliedDateRange.from) {
        const fromDate = appliedDateRange.from;
        const toDate = appliedDateRange.to ? endOfDay(appliedDateRange.to) : endOfDay(appliedDateRange.from);
        list = list.filter(p => {
            if (!p.dateDigitized) return false;
            const d = new Date(p.dateDigitized);
            return isValid(d) && d >= fromDate && d <= toDate;
        });
    }
    
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
    onColumnSizingChange: setColumnSizing,
    onColumnOrderChange: setColumnOrder,
    onPaginationChange: handlePaginationChange,
    onGlobalFilterChange: setGlobalFilter,
    enableColumnResizing: true,
    columnResizeMode: 'onChange',
    state: { sorting, globalFilter, rowSelection, columnVisibility, columnSizing, columnOrder, pagination },
    globalFilterFn: (row, columnId, filterValue) => {
        const searchTerm = String(filterValue ?? '').trim();
        if (!searchTerm) return true;
        const customer = row.original.customer;
        const p = row.original;
        
        const searchDigits = searchTerm.replace(/\D/g, '');
        const cpfDigits = customer?.cpf?.replace(/\D/g, '') || '';

        if (/^\d+$/.test(searchTerm)) {
            if (p.proposalNumber === searchTerm) return true;
            if (customer?.numericId?.toString() === searchTerm) return true;
            if (searchTerm.length > 3) {
                if (cpfDigits.includes(searchTerm)) return true;
            }
            return false;
        }

        if (searchDigits.length > 3 && cpfDigits.includes(searchDigits)) return true;

        const normalizedSearch = normalizeString(searchTerm);
        
        const searchableFields = [
            customer?.name,
            customer?.cpf,
            p.proposalNumber,
            p.operator,
            p.bank,
            cleanBankName(p.bank),
            p.promoter
        ];

        return searchableFields.some(field => {
            if (!field) return false;
            return normalizeString(String(field)).includes(normalizedSearch);
        });
    },
    meta: { userSettings }
  });

  React.useImperativeHandle(ref, () => ({ table }));

  const selectedRows = table.getFilteredSelectedRowModel().rows;
  const numSelected = selectedRows.length;

  const totalGross = React.useMemo(() => 
    selectedRows.reduce((acc, row) => acc + (row.original.grossAmount || 0), 0),
  [selectedRows]);

  const totalCommission = React.useMemo(() => 
    selectedRows.reduce((acc, row) => acc + (row.original.commissionValue || 0), 0),
  [selectedRows]);

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

  const handleDateMask = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, "");
    if (value.length > 8) value = value.substring(0, 8);
    value = value.replace(/(\d{2})(\d)/, '$1/$2');
    value = value.replace(/(\d{2})(\d)/, '$1/$2');
    e.target.value = value;
    return value;
  };

  const banksList = React.useMemo(() => Array.from(new Set(data.map(p => p.bank))).sort(), [data]);
  const promotersList = React.useMemo(() => Array.from(new Set(data.map(p => p.promoter))).sort(), [data]);
  const operatorsList = React.useMemo(() => Array.from(new Set(data.map(p => p.operator || 'Sem Operador'))).sort(), [data]);

  const toggleFilter = (current: string[], val: string, setter: (v: string[]) => void) => {
      if (current.includes(val)) setter(current.filter(v => v !== val));
      else setter([...current, val]);
  };

  return (
    <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd} sensors={sensors}>
        <div className="space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-4 bg-muted/10 dark:bg-zinc-900/30 p-3 rounded-2xl border-2 border-zinc-200 dark:border-primary/20 shadow-sm">
                <Tabs value={statusFilter} onValueChange={setStatusFilter}>
                    <TabsList className="h-auto flex-wrap justify-start bg-transparent p-0 gap-1">
                        <TabsTrigger value="Todos" className="font-bold px-4 h-9">Todos</TabsTrigger>
                        {['Em Andamento', 'Aguardando Saldo', 'Pago', 'Saldo Pago', 'Pendente', 'Reprovado'].map(s => {
                            const colorValue = statusColors[s.toUpperCase()] || statusColors[s];
                            return (
                                <TabsTrigger 
                                    key={s} 
                                    value={s} 
                                    className="status-tab font-black uppercase text-[10px] tracking-widest px-4 h-9 border-2 border-transparent data-[state=active]:bg-background"
                                    style={colorValue ? { '--status-color': colorValue } as any : {}}
                                >
                                    {s}
                                </TabsTrigger>
                            );
                        })}
                    </TabsList>
                </Tabs>

                <div className="flex items-center gap-3 ml-auto flex-nowrap overflow-x-auto pb-1 md:pb-0">
                    {/* FILTRO MULTI OPERADOR */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" className={cn("h-10 min-w-[180px] bg-background border rounded-full text-[10px] font-black uppercase px-5 shadow-sm hover:bg-primary/5 transition-colors justify-between", operatorFilters.length > 0 && "border-primary text-primary bg-primary/5")}>
                                <div className="flex items-center gap-2 truncate">
                                    <User className="h-3.5 w-3.5" />
                                    <span>{operatorFilters.length === 0 ? "OPERADORES" : `${operatorFilters.length} SELECIONADOS`}</span>
                                </div>
                                <ChevronDown className="h-3.5 w-3.5 opacity-50" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56 max-h-80 overflow-y-auto">
                            <DropdownMenuLabel>Selecionar Operadores</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            {operatorsList.map(op => (
                                <DropdownMenuCheckboxItem
                                    key={op}
                                    checked={operatorFilters.includes(op)}
                                    onCheckedChange={() => toggleFilter(operatorFilters, op, setOperatorFilters)}
                                    onSelect={(e) => e.preventDefault()}
                                    className="font-bold text-[11px] uppercase py-2"
                                >
                                    <div className="flex items-center gap-2">
                                        <User className="h-3 w-3 opacity-40" />
                                        {op}
                                    </div>
                                </DropdownMenuCheckboxItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>

                    {/* FILTRO MULTI BANCO */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" className={cn("h-10 min-w-[180px] bg-background border rounded-full text-[10px] font-black uppercase px-5 shadow-sm hover:bg-primary/5 transition-colors justify-between", bankFilters.length > 0 && "border-primary text-primary bg-primary/5")}>
                                <div className="flex items-center gap-2 truncate">
                                    <Landmark className="h-3.5 w-3.5" />
                                    <span>{bankFilters.length === 0 ? "BANCOS" : `${bankFilters.length} SELECIONADOS`}</span>
                                </div>
                                <ChevronDown className="h-3.5 w-3.5 opacity-50" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-64 max-h-80 overflow-y-auto">
                            <DropdownMenuLabel>Selecionar Instituições</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            {banksList.map(b => (
                                <DropdownMenuCheckboxItem
                                    key={b}
                                    checked={bankFilters.includes(b)}
                                    onCheckedChange={() => toggleFilter(bankFilters, b, setBankFilters)}
                                    onSelect={(e) => e.preventDefault()}
                                    className="font-bold text-[11px] uppercase py-2"
                                >
                                    <div className="flex items-center gap-2">
                                        <BankIcon bankName={b} domain={userSettings?.bankDomains?.[b]} className="h-3.5 w-3.5" />
                                        <span className="truncate">{cleanBankName(b)}</span>
                                    </div>
                                </DropdownMenuCheckboxItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>

                    {/* FILTRO MULTI PROMOTORA */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" className={cn("h-10 min-w-[180px] bg-background border rounded-full text-[10px] font-black uppercase px-5 shadow-sm hover:bg-primary/5 transition-colors justify-between", promoterFilters.length > 0 && "border-primary text-primary bg-primary/5")}>
                                <div className="flex items-center gap-2 truncate">
                                    <Building2 className="h-3.5 w-3.5" />
                                    <span>{promoterFilters.length === 0 ? "PROMOTORAS" : `${promoterFilters.length} SELECIONADAS`}</span>
                                </div>
                                <ChevronDown className="h-3.5 w-3.5 opacity-50" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-64 max-h-80 overflow-y-auto">
                            <DropdownMenuLabel>Selecionar Promotoras</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            {promotersList.map(p => (
                                <DropdownMenuCheckboxItem
                                    key={p}
                                    checked={promoterFilters.includes(p)}
                                    onCheckedChange={() => toggleFilter(promoterFilters, p, setPromoterFilters)}
                                    onSelect={(e) => e.preventDefault()}
                                    className="font-bold text-[11px] uppercase py-2"
                                >
                                    <div className="flex items-center gap-2">
                                        <BankIcon 
                                            bankName={p} 
                                            domain={userSettings?.promoterDomains?.[p]} 
                                            showLogo={userSettings?.showPromoterLogos ?? true} 
                                            className="h-3.5 w-3.5" 
                                        />
                                        <span className="truncate">{p}</span>
                                    </div>
                                </DropdownMenuCheckboxItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            <div className="flex items-center justify-between flex-wrap gap-4">
                <div className='relative w-full max-md group'>
                    <Search className='absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-primary opacity-80 group-focus-within:opacity-100 transition-opacity' />
                    <Input
                        placeholder="Busca por ID, CPF, Nome ou Proposta..."
                        value={globalFilter ?? ''}
                        onChange={(e) => setGlobalFilter(e.target.value)}
                        className="pl-10 h-11 bg-background border-2 border-zinc-300 dark:border-primary/40 rounded-full text-base font-bold shadow-md"
                    />
                </div>

                <div className="flex items-center gap-2">
                    <div className="flex items-center gap-3 bg-background border-2 border-zinc-300 dark:border-primary/20 rounded-full px-3 py-1 shadow-sm">
                        <Select onValueChange={(val) => {
                            const now = new Date();
                            let from: Date;
                            switch(val) {
                                case 'today': from = startOfDay(now); break;
                                case 'yesterday': from = startOfDay(subDays(now, 1)); break;
                                case 'week': from = startOfDay(subDays(now, 7)); break;
                                default: from = startOfMonth(now);
                            }
                            setStartDateInput(format(from, 'dd/MM/yyyy'));
                            setEndDateInput(format(now, 'dd/MM/yyyy'));
                            setAppliedDateRange({ from, to: now });
                        }}>
                            <SelectTrigger className="h-7 w-[120px] border-none bg-transparent focus:ring-0 text-xs font-black uppercase p-0">
                                <CalendarIcon className="mr-2 h-3.5 w-3.5 text-primary" />
                                <SelectValue placeholder="PERÍODO" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="today">Hoje</SelectItem>
                                <SelectItem value="yesterday">Ontem</SelectItem>
                                <SelectItem value="week">Últimos 7 dias</SelectItem>
                                <SelectItem value="month">Mês Atual</SelectItem>
                            </SelectContent>
                        </Select>
                        <Separator orientation="vertical" className="h-4 mx-1 bg-zinc-300" />
                        <div className="flex items-center gap-1">
                            <Input placeholder="De" value={startDateInput} onChange={(e) => setStartDateInput(handleDateMask(e))} className="h-7 w-28 border-none bg-muted/40 text-[11px] text-center font-black rounded-full" />
                            <span className="text-muted-foreground font-black">-</span>
                            <Input placeholder="Até" value={endDateInput} onChange={(e) => setEndDateInput(handleDateMask(e))} className="h-7 w-28 border-none bg-muted/40 text-[11px] text-center font-black rounded-full" />
                        </div>
                        <Button size="sm" onClick={handleApplyFilter} className="h-7 bg-primary text-white hover:bg-primary/90 rounded-full px-4 text-[10px] font-black uppercase shadow-sm gap-1.5">
                            <Filter className="h-3 w-3" /> Aplicar
                        </Button>
                        {appliedDateRange && (
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => { setStartDateInput(''); setEndDateInput(''); setAppliedDateRange(undefined); }}>
                                <X className="h-3.5 w-3.5" />
                            </Button>
                        )}
                    </div>

                    {hasActiveFilters && (
                        <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={handleClearAllFilters}
                            className="h-9 px-4 text-red-600 hover:text-red-700 hover:bg-red-50 font-black text-[10px] uppercase gap-1.5 rounded-full animate-in fade-in zoom-in-95"
                        >
                            <X className="h-3.5 w-3.5" /> Limpar Tudo
                        </Button>
                    )}
                </div>

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="h-11 rounded-full px-6 font-black border-2 border-zinc-300 dark:border-primary/20 bg-background shadow-md gap-2 text-xs uppercase tracking-widest">
                            Colunas <ChevronDown className="h-4 w-4 opacity-50" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56 shadow-2xl border-2">
                        <DropdownMenuLabel>Exibir/Ocultar</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        {table.getAllColumns().filter(c => c.getCanHide()).map(column => (
                            <DropdownMenuCheckboxItem
                                key={column.id}
                                className="capitalize text-xs font-bold"
                                checked={column.getIsVisible()}
                                onCheckedChange={v => column.toggleVisibility(!!v)}
                            >
                                {column.id}
                            </DropdownMenuCheckboxItem>
                        ))}
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            <Card ref={tableContainerRef} className="proposals-table border-2 border-zinc-300 dark:border-primary/30 shadow-xl rounded-xl overflow-hidden bg-card p-1">
                <div className="p-0">
                    <div className="overflow-auto relative">
                        <Table style={{ width: table.getTotalSize(), tableLayout: 'fixed' }}>
                            <TableHeader className="bg-background dark:bg-zinc-900 border-b-2">
                                {table.getHeaderGroups().map(hg => (
                                    <TableRow key={hg.id} className="hover:bg-transparent">
                                        <SortableContext items={columnOrder} strategy={horizontalListSortingStrategy}>
                                            {hg.headers.map(h => <DraggableHeader key={h.id} header={h as any} />)}
                                        </SortableContext>
                                    </TableRow>
                                    ))}
                            </TableHeader>
                            <TableBody>
                                {table.getRowModel().rows.length > 0 ? (
                                    table.getRowModel().rows.map(row => {
                                        const status = row.original.status;
                                        const statusKey = status.toUpperCase();
                                        const colorValue = statusColors[statusKey] || statusColors[status];
                                        return (
                                            <TableRow 
                                                key={row.id} 
                                                className={cn(
                                                    "transition-colors border-b h-14 hover:bg-primary/[0.03]",
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
                                    <TableRow>
                                        <TableCell colSpan={columns.length} className="h-32 text-center text-muted-foreground font-black uppercase text-[10px] tracking-widest opacity-40">
                                            Nenhuma proposta encontrada com os filtros atuais.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </div>

                <div className="flex items-center justify-between px-6 py-4 border-t-2 bg-muted/10 font-black text-[11px] uppercase tracking-[0.1em] text-foreground/60 min-h-[64px]">
                    <div className="flex items-center gap-4">
                        <div>
                            {numSelected} DE{' '}
                            {table.getFilteredRowModel().rows.length} SELECIONADOS.
                        </div>
                        
                        {numSelected > 0 && (
                            <>
                                <Separator orientation="vertical" className="h-4 bg-zinc-300 dark:bg-zinc-700" />
                                <div className="text-primary font-black animate-in fade-in slide-in-from-left-2">
                                    VALOR BRUTO: <span className="text-foreground">{formatCurrency(totalGross)}</span>
                                </div>
                                <Separator orientation="vertical" className="h-4 bg-zinc-300 dark:bg-zinc-700" />
                                <div className="text-primary font-black animate-in fade-in slide-in-from-left-2">
                                    COMISSÃO: <span className="text-foreground">{formatCurrency(totalCommission)}</span>
                                </div>
                            </>
                        )}
                    </div>

                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-2">
                            <span>LINHAS</span>
                            <Select
                                value={String(table.getState().pagination.pageSize)}
                                onValueChange={(value) => {
                                    table.setPageSize(Number(value));
                                }}
                            >
                                <SelectTrigger className="h-8 w-[70px] border-none bg-transparent font-black p-0 focus:ring-0 shadow-none text-foreground">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="rounded-xl border-2">
                                    {[10, 20, 30, 40, 50, 100].map((pageSize) => (
                                        <SelectItem key={pageSize} value={String(pageSize)} className="font-bold text-xs">
                                            {pageSize}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="text-primary font-black">
                            PÁG {table.getState().pagination.pageIndex + 1} DE {table.getPageCount()}
                        </div>
                        <div className="flex items-center gap-1">
                            <Button variant="outline" size="icon" className="h-8 w-8 rounded-full border-2" onClick={() => table.setPageIndex(0)} disabled={!table.getCanPreviousPage()}><ChevronsLeft className="h-4 w-4" /></Button>
                            <Button variant="outline" size="icon" className="h-8 w-8 rounded-full border-2" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}><ChevronLeft className="h-4 w-4" /></Button>
                            <Button variant="outline" size="icon" className="h-8 w-8 rounded-full border-2" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}><ChevronRight className="h-4 w-4" /></Button>
                            <Button variant="outline" size="icon" className="h-8 w-8 rounded-full border-2" onClick={() => table.setPageIndex(table.getPageCount() - 1)} disabled={!table.getCanNextPage()}><ChevronsRight className="h-4 w-4" /></Button>
                        </div>
                    </div>
                </div>
            </Card>
        </div>
    </DndContext>
  );
});

ProposalsDataTable.displayName = 'ProposalsDataTable';
