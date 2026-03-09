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
import { format, parse, isValid, startOfDay, endOfDay, subDays, startOfMonth, endOfMonth } from 'date-fns';
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
import { X, Filter, Search, Calendar as CalendarIcon, ChevronDown, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Landmark, Building2, User, Check } from 'lucide-react';
import { cn, cleanBankName, normalizeString, formatCurrency } from '@/lib/utils';
import type { Proposal, Customer, UserSettings } from '@/lib/types';
import { FinancialSummary } from '@/components/financial/financial-summary';
import { DraggableHeader } from './columns';
import { Separator } from '@/components/ui/separator';
import { useTheme } from '@/components/theme-provider';
import { BankIcon } from '@/components/bank-icon';

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
  const tableContainerRef = React.useRef<HTMLDivElement>(null);
  const { statusColors } = useTheme();
  const [sorting, setSorting] = React.useState<SortingState>([{ id: 'Data Pagamento', desc: true }]);
  const [statusFilter, setStatusFilter] = React.useState('Todos');
  const [globalFilter, setGlobalFilter] = React.useState('');
  
  const [bankFilters, setBankFilters] = React.useState<string[]>([]);
  const [promoterFilters, setPromoterFilters] = React.useState<string[]>([]);
  const [operatorFilters, setOperatorFilters] = React.useState<string[]>([]);

  const [columnSizing, setColumnSizing] = React.useState<ColumnSizingState>({});
  const [isClient, setIsClient] = React.useState(false);

  const [pagination, setPagination] = React.useState<PaginationState>({ pageIndex: 0, pageSize: 10 });
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({
    'Promotora': false,
    'CPF': false,
    'Comissão (%)': false,
    'Status Proposta': false,
    'Operador': true
  });
  
  const initialColumns = React.useMemo(() => columns.map(c => c.id!).filter(Boolean), [columns]);
  const [columnOrder, setColumnOrder] = React.useState<ColumnOrderState>([...initialColumns]);

  const [startDateInput, setStartDateInput] = React.useState('');
  const [endDateInput, setEndDateInput] = React.useState('');
  const [appliedDateRange, setAppliedDateRange] = React.useState<DateRange | undefined>(undefined);

  React.useEffect(() => {
    setIsClient(true);
    try {
        const savedPageSize = localStorage.getItem('lk-financial-pageSize');
        if (savedPageSize) setPagination(p => ({ ...p, pageSize: Number(savedPageSize) }));
        
        const savedStatus = localStorage.getItem('lk-financial-filter-status');
        if (savedStatus) setStatusFilter(savedStatus);

        const savedBanks = localStorage.getItem('lk-financial-filter-banks');
        if (savedBanks) setBankFilters(JSON.parse(savedBanks));

        const savedPromoters = localStorage.getItem('lk-financial-filter-promoters');
        if (savedPromoters) setPromoterFilters(JSON.parse(savedPromoters));

        const savedOperators = localStorage.getItem('lk-financial-filter-operators');
        if (savedOperators) setOperatorFilters(JSON.parse(savedOperators));

        const savedSearch = localStorage.getItem('lk-financial-filter-search');
        if (savedSearch) setGlobalFilter(savedSearch);

        const savedDates = localStorage.getItem('lk-financial-filter-dates');
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

        const savedVisibility = localStorage.getItem('lk-financial-visibility');
        if (savedVisibility) setColumnVisibility(JSON.parse(savedVisibility));

        const savedSizing = localStorage.getItem('lk-financial-sizing');
        if (savedSizing) setColumnSizing(JSON.parse(savedSizing));

        const savedOrder = localStorage.getItem('lk-financial-order');
        if (savedOrder) {
            const parsedOrder = JSON.parse(savedOrder) as string[];
            const missingColumns = initialColumns.filter(id => !parsedOrder.includes(id));
            if (missingColumns.length > 0) {
                const newOrder = [...parsedOrder];
                const actionsIdx = newOrder.indexOf('Ações');
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
            localStorage.setItem('lk-financial-filter-status', statusFilter);
            localStorage.setItem('lk-financial-filter-banks', JSON.stringify(bankFilters));
            localStorage.setItem('lk-financial-filter-promoters', JSON.stringify(promoterFilters));
            localStorage.setItem('lk-financial-filter-operators', JSON.stringify(operatorFilters));
            localStorage.setItem('lk-financial-filter-search', globalFilter);
            localStorage.setItem('lk-financial-filter-dates', JSON.stringify({
                startStr: startDateInput,
                endStr: endDateInput,
                from: appliedDateRange?.from?.toISOString(),
                to: appliedDateRange?.to?.toISOString()
            }));
            localStorage.setItem('lk-financial-visibility', JSON.stringify(columnVisibility));
            localStorage.setItem('lk-financial-order', JSON.stringify(columnOrder));
            localStorage.setItem('lk-financial-sizing', JSON.stringify(columnSizing));
        } catch(e) {}
    }
  }, [statusFilter, bankFilters, promoterFilters, operatorFilters, globalFilter, appliedDateRange, startDateInput, endDateInput, columnVisibility, columnOrder, columnSizing, isClient]);

  const handlePaginationChange = (updater: any) => {
    setPagination((old) => {
      const next = typeof updater === 'function' ? updater(old) : updater;
      if (typeof window !== 'undefined') {
        try { localStorage.setItem('lk-financial-pageSize', String(next.pageSize)); } catch(e) {}
      }
      return next;
    });
  };

  const applyDateMask = (value: string) => {
    let v = value.replace(/\D/g, "").substring(0, 8);
    if (v.length > 4) v = v.replace(/(\d{2})(\d{2})(\d)/, "$1/$2/$3");
    else if (v.length > 2) v = v.replace(/(\d{2})(\d)/, "$1/$2");
    return v;
  };

  const filteredData = React.useMemo(() => {
    const today = new Date();
    const startOfThisMonth = startOfMonth(today);
    const endOfThisMonth = endOfMonth(today);
    
    const isSearching = globalFilter.trim().length > 0;
    const isSpecificSearch = !!appliedDateRange || isSearching;

    let list = data.filter(p => p.status !== 'Reprovado');

    if (statusFilter === 'Todos') {
        if (!isSpecificSearch) {
            list = list.filter(p => {
                const d = p.dateDigitized ? new Date(p.dateDigitized) : null;
                return d && isValid(d) && d >= startOfThisMonth && d <= endOfThisMonth;
            });
        }
    } else if (statusFilter === 'Paga') {
        list = list.filter(p => p.commissionStatus === 'Paga');
        if (!isSpecificSearch) {
            list = list.filter(p => {
                const d = p.commissionPaymentDate ? new Date(p.commissionPaymentDate) : null;
                return d && isValid(d) && d >= startOfThisMonth && d <= endOfThisMonth;
            });
        }
    } else if (statusFilter === 'Pendente') {
        list = list.filter(p => p.commissionStatus === 'Pendente' && !!p.dateApproved);
    } else if (statusFilter === 'Parcial') {
        list = list.filter(p => p.commissionStatus === 'Parcial');
    }

    if (bankFilters.length > 0) list = list.filter(p => bankFilters.includes(p.bank));
    if (promoterFilters.length > 0) list = list.filter(p => promoterFilters.includes(p.promoter));
    if (operatorFilters.length > 0) list = list.filter(p => operatorFilters.includes(p.operator || 'Sem Operador'));

    if (appliedDateRange && appliedDateRange.from) {
        const fromDate = appliedDateRange.from;
        const toDate = appliedDateRange.to ? endOfDay(appliedDateRange.to) : endOfDay(appliedDateRange.from);
        list = list.filter(p => {
            const d = p.commissionPaymentDate ? new Date(p.commissionPaymentDate) : (p.dateDigitized ? new Date(p.dateDigitized) : null);
            return d && isValid(d) && d >= fromDate && d <= toDate;
        });
    }

    return list;
  }, [data, statusFilter, bankFilters, promoterFilters, operatorFilters, appliedDateRange, globalFilter]);

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
    state: { sorting, rowSelection, columnVisibility, columnSizing, columnOrder, pagination, globalFilter },
    globalFilterFn: (row, columnId, filterValue) => {
        const searchTerm = String(filterValue ?? '').trim();
        if (!searchTerm) return true;
        const customer = row.original.customer;
        const p = row.original;
        
        const searchDigits = searchTerm.replace(/\D/g, '');
        const cpfDigits = customer?.cpf?.replace(/\D/g, '') || '';

        if (/^\d+$/.test(searchTerm)) {
            if (customer?.numericId?.toString() === searchTerm) return true;
            if (p.proposalNumber === searchTerm) return true;
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
    meta: { isPrivacyMode, userSettings }
  });

  const selectedRows = table.getFilteredSelectedRowModel().rows;
  const numSelected = selectedRows.length;

  const totalGross = React.useMemo(() => 
    selectedRows.reduce((acc, row) => acc + (row.original.grossAmount || 0), 0),
  [selectedRows]);

  const totalCommission = React.useMemo(() => 
    selectedRows.reduce((acc, row) => acc + ((row.original.commissionValue || 0) - (row.original.amountPaid || 0)), 0),
  [selectedRows]);

  const sensors = useSensors(useSensor(PointerSensor), useSensor(KeyboardSensor));

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

  const getStickyClass = (columnId: string) => {
    if (columnId === 'Selecionar') return 'sticky left-0 z-30 bg-background shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]';
    if (columnId === 'Promotora') return 'sticky left-[50px] z-30 bg-background shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]';
    if (columnId === 'Cliente') return 'sticky left-[200px] z-30 bg-background shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]';
    if (columnId === 'Ações') return 'sticky right-0 z-30 bg-background shadow-[-2px_0_5px_-2px_rgba(0,0,0,0.1)]';
    return '';
  };

  const operatorsList = React.useMemo(() => {
    const ops = new Set<string>();
    data.forEach(p => ops.add(p.operator || 'Sem Operador'));
    return Array.from(ops).sort();
  }, [data]);

  const banksList = React.useMemo(() => Array.from(new Set(data.map(p => p.bank))).sort(), [data]);
  const promotersList = React.useMemo(() => Array.from(new Set(data.map(p => p.promoter))).sort(), [data]);

  const toggleFilter = (current: string[], val: string, setter: (v: string[]) => void) => {
      if (current.includes(val)) setter(current.filter(v => v !== val));
      else setter([...current, val]);
  };

  React.useImperativeHandle(ref, () => ({ table }));

  return (
    <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd} sensors={sensors}>
        <div className="space-y-4 w-full">
            <FinancialSummary rows={data} currentMonthRange={startOfDay(currentMonthRange.from) as any} isPrivacyMode={isPrivacyMode} isFiltered={!!globalFilter} onShowDetails={onShowDetails} userSettings={userSettings} />

            <div className="flex flex-wrap items-center justify-between gap-4 bg-muted/10 dark:bg-zinc-900/30 p-3 rounded-2xl border-2 border-zinc-200 dark:border-primary/20 shadow-sm">
                <Tabs value={statusFilter} onValueChange={setStatusFilter}>
                    <TabsList className="bg-transparent p-0 gap-1 h-auto flex-wrap">
                        <TabsTrigger value="Todos" className="font-bold px-4 h-9">Todos</TabsTrigger>
                        {['Paga', 'Pendente', 'Parcial'].map(s => (
                            <TabsTrigger key={s} value={s} className="status-tab font-black uppercase text-[10px] tracking-widest px-4 h-9 border-2 border-transparent data-[state=active]:bg-background" style={{ '--status-color': statusColors[s.toUpperCase()] || statusColors[s] } as any}>{s === 'Paga' ? 'PAGAS' : s === 'Pendente' ? 'PENDENTES' : 'PARCIAIS'}</TabsTrigger>
                        ))}
                    </TabsList>
                </Tabs>

                <div className="flex items-center gap-3 ml-auto flex-nowrap overflow-x-auto pb-1 md:pb-0">
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

            <div className="flex flex-wrap items-center gap-3 bg-muted/5 p-2 rounded-xl border-2 border-zinc-200">
                <div className="flex items-center gap-2 bg-background border-2 border-zinc-300 rounded-full px-3 py-1">
                    <Select onValueChange={(val) => {
                        const now = new Date();
                        let from = startOfMonth(now);
                        if(val === 'today') from = startOfDay(now);
                        if(val === 'yesterday') from = startOfDay(subDays(now, 1));
                        setStartDateInput(format(from, 'dd/MM/yyyy')); setEndDateInput(format(now, 'dd/MM/yyyy'));
                        setAppliedDateRange({ from, to: now });
                    }}>
                        <SelectTrigger className="h-7 w-[110px] border-none bg-transparent focus:ring-0 text-xs font-black uppercase p-0"><CalendarIcon className="mr-2 h-3.5 w-3.5 text-primary" /><SelectValue placeholder="PERÍODO" /></SelectTrigger>
                        <SelectContent><SelectItem value="today">Hoje</SelectItem><SelectItem value="yesterday">Ontem</SelectItem><SelectItem value="month">Mês Atual</SelectItem></SelectContent>
                    </Select>
                    <Separator orientation="vertical" className="h-4 mx-1 bg-zinc-300" />
                    <Input 
                        placeholder="De" 
                        value={startDateInput} 
                        onChange={(e) => setStartDateInput(applyDateMask(e.target.value))} 
                        className="h-7 w-28 border-none bg-muted/40 text-[11px] text-center font-black rounded-full" 
                        maxLength={10}
                    />
                    <Input 
                        placeholder="Até" 
                        value={endDateInput} 
                        onChange={(e) => setEndDateInput(applyDateMask(e.target.value))} 
                        className="h-7 w-28 border-none bg-muted/40 text-[11px] text-center font-black rounded-full" 
                        maxLength={10}
                    />
                </div>
                <Button size="sm" onClick={() => { const s = parse(startDateInput, 'dd/MM/yyyy', new Date()); const e = parse(endDateInput, 'dd/MM/yyyy', new Date()); setAppliedDateRange(isValid(s) ? { from: startOfDay(s), to: isValid(e) ? endOfDay(e) : endOfDay(s) } : undefined); }} className="h-9 bg-primary text-white rounded-full px-6 text-xs font-black uppercase shadow-lg gap-2"><Filter className="h-3.5 w-3.5" /> Aplicar</Button>
                {appliedDateRange && <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => { setStartDateInput(''); setEndDateInput(''); setAppliedDateRange(undefined); }}><X className="h-4 w-4" /></Button>}
                
                {hasActiveFilters && (
                    <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={handleClearAllFilters}
                        className="h-9 px-4 text-red-600 hover:text-red-700 hover:bg-red-50 font-black text-[10px] uppercase gap-1.5 rounded-full ml-auto animate-in fade-in zoom-in-95"
                    >
                        <X className="h-3.5 w-3.5" /> Limpar Filtros
                    </Button>
                )}
            </div>

            <Card ref={tableContainerRef} className="proposals-table rounded-[1.5rem] border-2 border-zinc-200 bg-card shadow-xl overflow-hidden p-1">
                <div className="flex items-center justify-between px-4 py-2 gap-4">
                    <div className='relative w-full max-md group'>
                        <Search className='absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-primary opacity-80 group-focus-within:opacity-100 transition-opacity' />
                        <Input placeholder="Busca por ID, CPF, Nome ou Proposta..." value={globalFilter} onChange={(e) => setGlobalFilter(e.target.value)} className="pl-10 h-11 bg-background border-2 border-zinc-300 rounded-full text-base font-bold shadow-md" />
                    </div>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild><Button variant="outline" className="h-11 rounded-full px-6 font-black border-2 border-zinc-300 bg-background shadow-md gap-2 text-[10px] uppercase tracking-widest">Colunas <ChevronDown className="h-4 w-4 opacity-50" /></Button></DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56 shadow-2xl border-2">
                            <DropdownMenuLabel>Exibir/Ocultar</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            {table.getAllColumns().filter(c => c.getCanHide()).map(column => (
                                <DropdownMenuCheckboxItem key={column.id} className="capitalize text-xs font-bold" checked={column.getIsVisible()} onCheckedChange={v => column.toggleVisibility(!!v)}>{column.id}</DropdownMenuCheckboxItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>

                <div className="overflow-x-auto relative">
                    <Table style={{ width: table.getTotalSize(), tableLayout: 'fixed' }}>
                        <TableHeader className="bg-background dark:bg-zinc-900 border-b-2">
                            {table.getHeaderGroups().map(hg => (
                                <TableRow key={hg.id} className="border-b hover:bg-transparent">
                                    <SortableContext items={columnOrder} strategy={horizontalListSortingStrategy}>
                                        {hg.headers.map(h => (
                                            <DraggableHeader 
                                                key={h.id} 
                                                header={h as any} 
                                                className={getStickyClass(h.column.id)}
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
                                    const commStatus = p.commissionStatus;
                                    
                                    const effectiveStatus = (commStatus === 'Paga' || commStatus === 'Parcial')
                                        ? commStatus
                                        : (p.dateApproved ? 'Pendente' : null);

                                    const colorValue = effectiveStatus ? (statusColors[effectiveStatus.toUpperCase()] || statusColors[effectiveStatus]) : undefined;
                                    
                                    return (
                                        <TableRow 
                                            key={row.id} 
                                            data-state={row.getIsSelected() && 'selected'} 
                                            className={cn(
                                                "transition-colors border-b h-14 hover:bg-primary/[0.03]",
                                                colorValue && "status-row-custom"
                                            )}
                                            style={{ '--status-color': colorValue } as any} 
                                        >
                                            {row.getVisibleCells().map(cell => (
                                                <TableCell 
                                                    key={cell.id} 
                                                    style={{ width: cell.column.getSize() }} 
                                                    className={cn(
                                                        "p-3 text-sm border-none",
                                                        getStickyClass(cell.column.id)
                                                    )}
                                                >
                                                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                                </TableCell>
                                            ))}
                                        </TableRow>
                                    )
                                })
                            ) : (
                                <TableRow><TableCell colSpan={columns.length} className="h-32 text-center text-muted-foreground font-black uppercase text-[10px] tracking-widest opacity-40">Nenhum registro encontrado para os filtros atuais.</TableCell></TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>

                <div className="flex items-center justify-between px-6 py-4 border-t-2 bg-muted/10 font-black text-[11px] uppercase tracking-[0.1em] text-foreground/60 min-h-[64px]">
                    <div className="flex items-center gap-4">
                        <div>{numSelected} DE {table.getFilteredRowModel().rows.length} SELECIONADOS.</div>
                        
                        {numSelected > 0 && (
                            <>
                                <Separator orientation="vertical" className="h-4 bg-zinc-300 dark:bg-zinc-700" />
                                <div className="text-primary font-black animate-in fade-in slide-in-from-left-2">
                                    VALOR BRUTO: <span className="text-foreground">{isPrivacyMode ? '•••••' : formatCurrency(totalGross)}</span>
                                </div>
                                <Separator orientation="vertical" className="h-4 bg-zinc-300 dark:bg-zinc-700" />
                                <div className="text-primary font-black animate-in fade-in slide-in-from-left-2">
                                    COMISSÃO: <span className="text-foreground">{isPrivacyMode ? '•••••' : formatCurrency(totalCommission)}</span>
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
                        <div className="text-primary font-black">PÁG {table.getState().pagination.pageIndex + 1} DE {table.getPageCount()}</div>
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

FinancialDataTable.displayName = 'FinancialDataTable';
