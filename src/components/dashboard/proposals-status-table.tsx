'use client';

import * as React from 'react';
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
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
import type { Customer, Proposal } from '@/lib/types';
import { statusColumns } from './status-columns';
import { StatusBreakdownChart } from './status-breakdown-chart';
import { useTheme } from '@/components/theme-provider';
import { cn } from '@/lib/utils';

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
}

function DataTable<TData, TValue>({
  columns,
  data,
}: DataTableProps<TData, TValue>) {
  const { statusColors } = useTheme();
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  return (
    <div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => {
                const proposal = row.original as any;
                const status = proposal.status;
                const statusKey = status.toUpperCase();
                const colorValue = statusColors[statusKey] || statusColors[status];

                return (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && 'selected'}
                    className={cn(
                        "transition-colors border-b",
                        colorValue && "status-row-custom"
                    )}
                    style={colorValue ? { '--status-color': colorValue } as any : {}}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                )
              })
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  Nenhuma proposta encontrada.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-end space-x-2 py-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
        >
          Anterior
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
        >
          Próximo
        </Button>
      </div>
    </div>
  );
}

type ProposalWithCustomer = Proposal & { customer: { name: string } | undefined };

export function ProposalsStatusTable({ proposals = [], customers = [], amountType = 'grossAmount' }: { proposals?: Proposal[], customers?: Customer[], amountType?: 'grossAmount' | 'commissionValue' }) {
    
    const data: ProposalWithCustomer[] = React.useMemo(() => {
        const safeProposals = Array.isArray(proposals) ? proposals : [];
        const safeCustomers = Array.isArray(customers) ? customers : [];
        const customerMap = new Map(safeCustomers.map(c => [c.id, c]));
        
        return safeProposals.map(proposal => {
            const customer = customerMap.get(proposal.customerId);
            return {
                ...proposal,
                customer: customer ? { name: customer.name } : undefined
            }
        });
    }, [proposals, customers]);

  if (!proposals || (Array.isArray(proposals) && proposals.length === 0)) {
    return (
      <div className="flex items-center justify-center h-40 text-muted-foreground">
        Nenhuma proposta para este status no período selecionado.
      </div>
    );
  }

  return (
    <div className="space-y-4">
        <StatusBreakdownChart proposals={Array.isArray(proposals) ? proposals : []} amountType={amountType} />
        <DataTable columns={statusColumns} data={data} />
    </div>
    );
}
