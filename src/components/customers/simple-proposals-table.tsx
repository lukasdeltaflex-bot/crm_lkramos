'use client';

import * as React from 'react';
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
} from '@tanstack/react-table';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import type { Proposal, ProposalStatus } from '@/lib/types';
import { formatCurrency, cleanBankName } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { ArrowUpDown, Copy, Landmark } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from '@/hooks/use-toast';
import { BankIcon } from '@/components/bank-icon';

const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    try {
        const date = parseISO(dateString);
        if (isNaN(date.getTime())) return '-';
        return format(date, "dd/MM/yyyy", { locale: ptBR });
    } catch (e) {
        return '-';
    }
}

export const columns: ColumnDef<Proposal>[] = [
  {
    accessorKey: 'proposalNumber',
    header: 'Proposta nº',
    cell: ({ row }) => {
        const proposalNumber = row.getValue('proposalNumber') as string;
        if (!proposalNumber) return '-';
        
        const handleCopy = (e: React.MouseEvent) => {
            e.preventDefault();
            e.stopPropagation();
            navigator.clipboard.writeText(proposalNumber);
            toast({
                title: 'Número da Proposta copiado!',
            });
        };

        return (
            <div className="flex items-center gap-1 font-bold">
                <span>{proposalNumber}</span>
                <Button variant="ghost" size="icon" className="h-6 w-6 opacity-40 hover:opacity-100" onClick={handleCopy}>
                    <Copy className="h-3 w-3" />
                </Button>
            </div>
        )
    }
  },
  {
    accessorKey: 'product',
    header: 'Produto',
    cell: ({ row }) => <span className="text-xs font-medium">{row.getValue('product')}</span>
  },
  {
    accessorKey: 'bank',
    header: 'Banco',
    cell: ({ row }) => {
      const bank = row.getValue('bank') as string;
      return (
        <div className="flex items-center gap-2">
          <BankIcon bankName={bank} className="h-4 w-4" />
          <span className="truncate max-w-[120px] text-[10px] font-black uppercase tracking-tight text-muted-foreground">
            {cleanBankName(bank)}
          </span>
        </div>
      );
    }
  },
  {
    accessorKey: 'grossAmount',
    header: ({ column }) => (
      <div className="text-right">
        <Button
          variant="ghost"
          size="sm"
          className="h-8 text-[10px] font-black uppercase"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Valor Bruto
          <ArrowUpDown className="ml-2 h-3 w-3" />
        </Button>
      </div>
    ),
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue('grossAmount'));
      return (
        <div className="text-right font-bold text-primary">{formatCurrency(amount)}</div>
      );
    },
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => {
        const status = row.getValue('status') as ProposalStatus;
        return (
            <Badge variant="outline" className={cn("text-[9px] font-black uppercase px-2 py-0.5 rounded-full border-2", {
                'border-green-500/30 text-green-600 bg-green-50': status === 'Pago',
                'border-orange-500/30 text-orange-600 bg-orange-50': status === 'Saldo Pago',
                'border-yellow-500/30 text-yellow-600 bg-yellow-50': status === 'Em Andamento',
                'border-blue-500/30 text-blue-600 bg-blue-50': status === 'Aguardando Saldo',
                'border-red-500/30 text-red-600 bg-red-50': status === 'Reprovado',
                'border-purple-500/30 text-purple-600 bg-purple-50': status === 'Pendente',
              })}>
                {status}
            </Badge>
        )
    }
  },
  {
    accessorKey: 'dateDigitized',
    header: ({ column }) => (
        <Button
          variant="ghost"
          size="sm"
          className="h-8 text-[10px] font-black uppercase"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Data Digitação
          <ArrowUpDown className="ml-2 h-3 w-3" />
        </Button>
      ),
    cell: ({ row }) => <span className="text-xs text-muted-foreground">{formatDate(row.getValue('dateDigitized'))}</span>
  },
];


export function SimpleProposalsTable({ proposals }: { proposals: Proposal[] }) {
  const [sorting, setSorting] = React.useState<SortingState>([
    { id: 'dateDigitized', desc: true }
  ]);

  const table = useReactTable({
    data: proposals,
    columns,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    state: {
      sorting,
    },
  });

  return (
    <div>
      <div className="rounded-xl border border-border/50 overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/30">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="hover:bg-transparent border-b">
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} className="h-10 text-[9px] font-black uppercase tracking-widest">
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && 'selected'}
                  className="hover:bg-muted/10 border-b last:border-0"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="py-3">
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center text-[10px] font-black uppercase text-muted-foreground/40 tracking-widest"
                >
                  Nenhuma proposta registrada.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-end gap-2 py-4">
        <Button
          variant="outline"
          size="sm"
          className="h-8 rounded-full text-[10px] font-bold uppercase px-4"
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
        >
          Anterior
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="h-8 rounded-full text-[10px] font-bold uppercase px-4"
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
        >
          Próximo
        </Button>
      </div>
    </div>
  );
}