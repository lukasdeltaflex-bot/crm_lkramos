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
import { X, Filter, Search, Calendar as CalendarIcon, ChevronDown, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Snowflake } from 'lucide-react';
import { cn, cleanBankName, normalizeString, formatCurrency } from '@/lib/utils';
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
  const tableContainerRef = React.useRef<HTMLDivElement>(null);
  const { statusColors } = useTheme();
  const [sorting, setSorting] = React.useState<SortingState>([{ id: 'Data Pagamento', desc: true }]);
  const [statusFilter, setStatusFilter] = React.useState('Todos');
  const [globalFilter, setGlobalFilter] = React.useState('');
  const [frozenCount, setFrozenCount] = React.useState(2);
  
  const [bankFilters, setBankFilters] = React.useState<string[]>([]);
  const [promoterFilters, setPromoterFilters] = React.useState<string[]>([]);
  const [operatorFilters, setOperatorFilters] = React.useState<string[]>([]);

  const [columnSizing, setColumnSizing] = React.useState<ColumnSizingState>({});
  const [isClient, setIsClient] = React.useState(false);

  // 🖱️ Lógica de Grab-to-scroll corrigida
  const [isDraggingScroll, setIsDraggingScroll] = React.useState(false);
  const [startX, setStartX] = React.useState(0);
  const [scrollLeft, setScrollLeft] = React.useState(0);

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
        const savedFrozen = localStorage.getItem('lk-financial-frozen-count');
        if (savedFrozen) setFrozenCount(Number(savedFrozen));

        const savedPageSize = localStorage.getItem('lk-financial-pageSize');
        if (savedPageSize) setPagination(p => ({ ...p, pageSize: Number(savedPageSize) }));
        
        const savedSearch = localStorage.getItem('lk-financial-filter-search');
        if (savedSearch) setGlobalFilter(savedSearch);

        const savedVisibility = localStorage.getItem('lk-financial-visibility');
        if (savedVisibility) setColumnVisibility(JSON.parse(savedVisibility));

        const savedOrder = localStorage.getItem('lk-financial-order');
        if (savedOrder) setColumnOrder(JSON.parse(savedOrder));
    } catch (e) {}
  }, []);

  React.useEffect(() => {
    if (isClient) {
        try {
            localStorage.setItem('lk-financial-frozen-count', String(frozenCount));
            localStorage.setItem('lk-financial-filter-search', globalFilter);
            localStorage.setItem('lk-financial-visibility', JSON.stringify(columnVisibility));
            localStorage.setItem('lk-financial-order', JSON.stringify(columnOrder));
        } catch(e) {}
    }
  }, [globalFilter, columnVisibility, columnOrder, frozenCount, isClient]);

  const handlePaginationChange = (updater: any) => {
    setPagination((old) => {
      const next = typeof updater === 'function' ? updater(old) : updater;
      if (typeof window !== 'undefined') {
        try { localStorage.setItem('lk-financial-pageSize', String(next.pageSize)); } catch(e) {}
      }
      return next;
    });
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
    meta: { isPrivacyMode, userSettings }
  });

  // 🖱️ Handlers Grab-to-scroll corrigidos
  const onMouseDown = (e: React.MouseEvent) => {
    if (!tableContainerRef.current) return;
    setIsDraggingScroll(true);
    setStartX(e.pageX - tableContainerRef.current.offsetLeft);
    setScrollLeft(tableContainerRef.current.scrollLeft);
  };

  const onMouseLeave = () => setIsDraggingScroll(false);
  const onMouseUp = () => setIsDraggingScroll(false);

  const onMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingScroll || !tableContainerRef.current) return;
    e.preventDefault();
    const x = e.pageX - tableContainerRef.current.offsetLeft;
    const walk = (x - startX) * 1.5; 
    tableContainerRef.current.scrollLeft = scrollLeft - walk;
  };

  const selectedRows = table.getFilteredSelectedRowModel().rows;
  const numSelected = selectedRows.length;
  const totalGross = React.useMemo(() => selectedRows.reduce((acc, row) => acc + (row.original.grossAmount || 0), 0), [selectedRows]);
  const totalCommission = React.useMemo(() => selectedRows.reduce((acc, row) => acc + ((row.original.commissionValue || 0) - (row.original.amountPaid || 0)), 0), [selectedRows]);

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

  return (
    <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd} sensors={sensors}>
        <div className="space-y-4 w-full">
            <FinancialSummary rows={data} currentMonthRange={startOfDay(currentMonthRange.from) as any} isPrivacyMode={isPrivacyMode} isFiltered={!!globalFilter} onShowDetails={onShowDetails} userSettings={userSettings} />

            <div className="flex flex-wrap items-center justify-between gap-4 bg-muted/10 p-3 rounded-2xl border-2 border-zinc-200 shadow-sm">
                <Tabs value={statusFilter} onValueChange={setStatusFilter}>
                    <TabsList className="bg-transparent p-0 gap-1 h-auto flex-wrap">
                        <TabsTrigger value="Todos" className="font-bold px-4 h-9">Todos</TabsTrigger>
                        {['Paga', 'Pendente', 'Parcial'].map(s => (
                            <TabsTrigger key={s} value={s} className="status-tab font-black uppercase text-[10px] tracking-widest px-4 h-9 border-2 border-transparent data-[state=active]:bg-background" style={{ '--status-color': statusColors[s.toUpperCase()] || statusColors[s] } as any}>{s === 'Paga' ? 'PAGAS' : s === 'Pendente' ? 'PENDENTES' : 'PARCIAIS'}</TabsTrigger>
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
                            <SelectItem value="1" className="text-[10px] font-bold uppercase">Fixar 1ª Coluna</SelectItem>
                            <SelectItem value="2" className="text-[10px] font-bold uppercase">Fixar 2 Colunas</SelectItem>
                            <SelectItem value="3" className="text-[10px] font-bold uppercase">Fixar 3 Colunas</SelectItem>
                        </SelectContent>
                    </Select>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" className="h-11 rounded-full px-6 font-black border-2 border-zinc-300 bg-background shadow-md gap-2 text-xs uppercase tracking-widest">Colunas <ChevronDown className="h-4 w-4 opacity-50" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56 shadow-2xl border-2">
                            <DropdownMenuLabel>Exibir/Ocultar</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            {table.getAllColumns().filter(c => c.getCanHide()).map(column => (
                                <DropdownMenuCheckboxItem key={column.id} checked={column.getIsVisible()} onCheckedChange={v => column.toggleVisibility(!!v)} className="capitalize text-xs font-bold">{column.id}</DropdownMenuCheckboxItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            <div className='relative w-full max-md group'>
                <Search className='absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-primary opacity-80' />
                <Input placeholder="Busca por ID, CPF, Nome ou Proposta..." value={globalFilter} onChange={(e) => setGlobalFilter(e.target.value)} className="pl-10 h-11 bg-background border-2 border-zinc-300 rounded-full text-base font-bold shadow-md" />
            </div>

            <Card className="rounded-[1.5rem] border-2 border-zinc-200 bg-card shadow-xl overflow-hidden p-1">
                <div 
                    ref={tableContainerRef}
                    className={cn(
                        "overflow-x-auto relative cursor-grab active:cursor-grabbing",
                        isDraggingScroll && "cursor-grabbing select-none"
                    )}
                    onMouseDown={onMouseDown}
                    onMouseLeave={onMouseLeave}
                    onMouseUp={onMouseUp}
                    onMouseMove={onMouseMove}
                >
                    <Table style={{ width: table.getTotalSize(), tableLayout: 'fixed' }}>
                        <TableHeader className="bg-background border-b-2">
                            {table.getHeaderGroups().map(hg => (
                                <TableRow key={hg.id} className="border-b hover:bg-transparent">
                                    <SortableContext items={columnOrder} strategy={horizontalListSortingStrategy}>
                                        {hg.headers.map((h, i) => (
                                            <DraggableHeader 
                                                key={h.id} 
                                                header={h as any} 
                                                className={cn(
                                                    i === 0 && frozenCount >= 1 && "sticky left-0 z-40 bg-background shadow-[2px_0_5px_rgba(0,0,0,0.1)]",
                                                    i === 1 && frozenCount >= 2 && "sticky left-[50px] z-40 bg-background shadow-[2px_0_5px_rgba(0,0,0,0.1)]",
                                                    i === 2 && frozenCount >= 3 && "sticky left-[200px] z-40 bg-background shadow-[2px_0_5px_rgba(0,0,0,0.1)]"
                                                )}
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
                                    const effectiveStatus = (commStatus === 'Paga' || commStatus === 'Parcial') ? commStatus : (p.dateApproved ? 'Pendente' : null);
                                    const colorValue = effectiveStatus ? (statusColors[effectiveStatus.toUpperCase()] || statusColors[effectiveStatus]) : undefined;
                                    
                                    return (
                                        <TableRow key={row.id} data-state={row.getIsSelected() && 'selected'} className={cn("transition-colors border-b h-14 hover:bg-primary/[0.03]", colorValue && "status-row-custom")} style={{ '--status-color': colorValue } as any}>
                                            {row.getVisibleCells().map((cell, i) => (
                                                <TableCell 
                                                    key={cell.id} 
                                                    style={{ width: cell.column.getSize() }} 
                                                    className={cn(
                                                        "p-3 text-sm border-none",
                                                        i === 0 && frozenCount >= 1 && "sticky left-0 z-30 bg-background shadow-[2px_0_5px_rgba(0,0,0,0.05)]",
                                                        i === 1 && frozenCount >= 2 && "sticky left-[50px] z-30 bg-background shadow-[2px_0_5px_rgba(0,0,0,0.05)]",
                                                        i === 2 && frozenCount >= 3 && "sticky left-[200px] z-30 bg-background shadow-[2px_0_5px_rgba(0,0,0,0.05)]"
                                                    )}
                                                >
                                                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                                </TableCell>
                                            ))}
                                        </TableRow>
                                    )
                                })
                            ) : (
                                <TableRow><TableCell colSpan={columns.length} className="h-32 text-center text-muted-foreground font-black uppercase text-[10px] tracking-widest opacity-40">Nenhum registro encontrado.</TableCell></TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>

                <div className="flex items-center justify-between px-6 py-4 border-t-2 bg-muted/10 font-black text-[11px] uppercase tracking-[0.1em] text-foreground/60 min-h-[64px]">
                    <div className="flex items-center gap-4">
                        <div>{numSelected} SELECIONADOS.</div>
                        {numSelected > 0 && (
                            <>
                                <Separator orientation="vertical" className="h-4 bg-zinc-300" />
                                <div className="text-primary font-black">BRUTO: <span className="text-foreground">{isPrivacyMode ? '•••••' : formatCurrency(totalGross)}</span></div>
                                <Separator orientation="vertical" className="h-4 bg-zinc-300" />
                                <div className="text-primary font-black">COMISSÃO: <span className="text-foreground">{isPrivacyMode ? '•••••' : formatCurrency(totalCommission)}</span></div>
                            </>
                        )}
                    </div>
                    <div className="flex items-center gap-6 text-primary font-black">PÁG {table.getState().pagination.pageIndex + 1} DE {table.getPageCount()}</div>
                </div>
            </Card>
        </div>
    </DndContext>
  );
});

FinancialDataTable.displayName = 'FinancialDataTable';
