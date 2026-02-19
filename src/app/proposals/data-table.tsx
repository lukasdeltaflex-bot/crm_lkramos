
'use client';

import * as React from 'react';
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  RowSelectionState,
  Table as ReactTable,
  VisibilityState,
  SortingState,
  ColumnSizingState,
} from '@tanstack/react-table';
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
import { Filter, X, Search, Calendar as CalendarIcon, ChevronDown } from 'lucide-react';
import { Card } from '@/components/ui/card';
import type { ProposalStatus, UserSettings } from '@/lib/types';
import { DraggableHeader } from './columns';
import type { ProposalWithCustomer } from './page';
import { Separator } from '@/components/ui/separator';
import { normalizeString, cn } from '@/lib/utils';
import { useTheme } from '@/components/theme-provider';

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
  const [startDateInput, setStartDateInput] = React.useState('');
  const [endDateInput, setEndDateInput] = React.useState('');
  const [appliedDateRange, setAppliedDateRange] = React.useState<DateRange | undefined>(undefined);
  const [columnSizing, setColumnSizing] = React.useState<ColumnSizingState>({});
  
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({
      'Operador': false,
      'Comissão': false,
      'Data Averbação': false,
      'Data Pgto. Cliente': false,
      'Chegada Saldo': false
  });

  const filteredData = React.useMemo(() => {
    let list = data;
    
    if (statusFilter !== 'Todos') {
        list = list.filter(p => p.status === statusFilter);
    }

    if (appliedDateRange && appliedDateRange.from) {
        const fromDate = appliedDateRange.from;
        const toDate = appliedDateRange.to ? endOfDay(appliedDateRange.to) : endOfDay(appliedDateRange.from);
        
        list = list.filter(p => {
            const d = new Date(p.dateDigitized);
            return d >= fromDate && d <= toDate;
        });
    }

    if (globalFilter) {
        const lower = normalizeString(globalFilter);
        list = list.filter(p => 
            normalizeString(p.proposalNumber).includes(lower) ||
            normalizeString(p.customer?.name || '').includes(lower) ||
            normalizeString(p.customer?.cpf || '').includes(lower) ||
            normalizeString(p.bank).includes(lower) ||
            normalizeString(p.product).includes(lower) ||
            normalizeString(p.operator || '').includes(lower)
        );
    }
    
    return list;
  }, [data, statusFilter, globalFilter, appliedDateRange]);

  const table = useReactTable({
    data: filteredData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    onColumnSizingChange: setColumnSizing,
    enableColumnResizing: true,
    columnResizeMode: 'onChange',
    state: { globalFilter, rowSelection, columnVisibility, columnSizing },
    meta: { userSettings },
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

  return (
    <div className="space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-4 bg-muted/10 p-2 rounded-xl border border-border/50 shadow-sm">
            <Tabs value={statusFilter} onValueChange={setStatusFilter}>
                <TabsList className="h-auto flex-wrap justify-start bg-transparent p-0 gap-1">
                    <TabsTrigger value="Todos" className="font-bold px-4 h-9">Todos</TabsTrigger>
                    {['Em Andamento', 'Aguardando Saldo', 'Pago', 'Saldo Pago', 'Pendente', 'Reprovado'].map(s => {
                        const colorValue = statusColors[s.toUpperCase()] || statusColors[s];
                        return (
                            <TabsTrigger 
                                key={s} 
                                value={s} 
                                className="status-tab font-black uppercase text-[10px] tracking-widest px-4 h-9 border border-transparent data-[state=active]:bg-background"
                                style={colorValue ? { '--status-color': colorValue } as any : {}}
                            >
                                {s}
                            </TabsTrigger>
                        );
                    })}
                </TabsList>
            </Tabs>

            <div className="flex items-center gap-3 bg-card border rounded-lg px-2 py-1 shadow-sm ml-auto">
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
                    <SelectTrigger className="h-7 w-[120px] border-none bg-transparent focus:ring-0 text-xs font-bold uppercase p-0">
                        <CalendarIcon className="mr-2 h-3 w-3 text-primary" />
                        <SelectValue placeholder="PERÍODO" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="today">Hoje</SelectItem>
                        <SelectItem value="yesterday">Ontem</SelectItem>
                        <SelectItem value="week">Últimos 7 dias</SelectItem>
                        <SelectItem value="month">Mês Atual</SelectItem>
                    </SelectContent>
                </Select>
                <Separator orientation="vertical" className="h-4" />
                <div className="flex items-center gap-1">
                    <Input 
                        placeholder="De" 
                        value={startDateInput}
                        onChange={(e) => handleDateInputChange(e.target.value, 'start')}
                        className="h-7 w-20 border-none bg-muted/30 text-[10px] text-center font-bold"
                    />
                    <span className="text-muted-foreground">-</span>
                    <Input 
                        placeholder="Até" 
                        value={endDateInput}
                        onChange={(e) => handleDateInputChange(e.target.value, 'end')}
                        className="h-7 w-20 border-none bg-muted/30 text-[10px] text-center font-bold"
                    />
                </div>
                <Button size="sm" onClick={handleApplyFilter} className="h-7 bg-primary rounded-full px-4 text-[10px] font-bold uppercase transition-all shadow-sm">
                    <Filter className="h-3 w-3 mr-1" /> Aplicar
                </Button>
            </div>
        </div>

        <div className="flex items-center justify-between gap-4">
            <div className='relative w-full max-w-md'>
                <Search className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground opacity-60' />
                <Input
                    placeholder="Busca Inteligente (Nome, CPF, Proposta...)"
                    value={globalFilter ?? ''}
                    onChange={(e) => setGlobalFilter(e.target.value)}
                    className="pl-9 h-11 bg-card border-primary/10 rounded-full text-sm font-medium shadow-sm focus-visible:ring-primary/20 transition-all"
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
                    <DropdownMenuSeparator />
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

        <Card className="proposals-table border-border/50 shadow-md rounded-xl overflow-hidden bg-card">
            <div className="p-0">
                <div className="overflow-x-auto">
                    <Table style={{ width: table.getTotalSize() }}>
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
                                    const status = row.original.status;
                                    const colorValue = statusColors[status.toUpperCase()] || statusColors[status];
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
                                                <TableCell key={cell.id} style={{ width: cell.column.getSize() }}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                                            ))}
                                        </TableRow>
                                    )
                                })
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={columns.length} className="h-32 text-center text-muted-foreground font-medium uppercase text-[10px] tracking-widest opacity-40">
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
