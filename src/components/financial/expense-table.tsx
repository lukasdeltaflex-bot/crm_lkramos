
'use client';

import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/utils';
import type { Expense } from '@/lib/types';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Edit, Trash2, Receipt } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface ExpenseTableProps {
  expenses: Expense[];
  onEdit: (expense: Expense) => void;
  onDelete: (id: string) => void;
}

export function ExpenseTable({ expenses, onEdit, onDelete }: ExpenseTableProps) {
  if (expenses.length === 0) {
    return (
      <div className="py-20 text-center border-2 border-dashed rounded-xl bg-muted/5">
        <Receipt className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-20" />
        <p className="text-muted-foreground font-bold">Nenhuma despesa lançada.</p>
        <p className="text-xs text-muted-foreground/60 mt-1">Lançar gastos ajuda a calcular seu lucro real.</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border shadow-sm overflow-hidden">
      <Table>
        <TableHeader className="bg-muted/30">
          <TableRow>
            <TableHead className="text-[10px] font-black uppercase tracking-widest">Data</TableHead>
            <TableHead className="text-[10px] font-black uppercase tracking-widest">Descrição</TableHead>
            <TableHead className="text-[10px] font-black uppercase tracking-widest">Categoria</TableHead>
            <TableHead className="text-[10px] font-black uppercase tracking-widest text-right">Valor</TableHead>
            <TableHead className="text-[10px] font-black uppercase tracking-widest text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {expenses.map((expense) => (
            <TableRow key={expense.id} className="hover:bg-muted/20 transition-colors">
              <TableCell className="text-xs font-medium">
                {format(parseISO(expense.date), 'dd/MM/yyyy', { locale: ptBR })}
              </TableCell>
              <TableCell className="font-bold text-sm">{expense.description}</TableCell>
              <TableCell>
                <Badge variant="outline" className="bg-background text-[10px] font-black uppercase border-zinc-300">
                    {expense.category}
                </Badge>
              </TableCell>
              <TableCell className="text-right font-bold text-red-600">
                {formatCurrency(expense.amount)}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-1">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEdit(expense)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => onDelete(expense.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
