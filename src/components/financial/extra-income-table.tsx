'use client';

import React, { useState, useMemo } from 'react';
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
import type { ExtraIncome } from '@/lib/types';
import { format, parseISO, isSameMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Edit, Trash2, TrendingUp, Filter, AlertCircle, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface ExtraIncomeTableProps {
  incomes: ExtraIncome[];
  onEdit: (income: ExtraIncome) => void;
  onDelete: (id: string) => Promise<void>;
  isPrivacyMode?: boolean;
}

export function ExtraIncomeTable({ incomes, onEdit, onDelete, isPrivacyMode = false }: ExtraIncomeTableProps) {
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [periodFilter, setPeriodFilter] = useState<'current_month' | 'all'>('current_month');
  
  // Estado para exclusão segura com confirmação
  const [incomeToDelete, setIncomeToDelete] = useState<ExtraIncome | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Lista única de categorias presentes nos dados
  const availableCategories = useMemo(() => {
    const set = new Set<string>();
    incomes.forEach(i => {
      if (i.category) set.add(i.category.trim());
    });
    return Array.from(set).sort();
  }, [incomes]);

  // Filtragem dos lançamentos
  const filteredIncomes = useMemo(() => {
    const now = new Date();
    return incomes.filter(inc => {
      if (inc.deleted === true) return false;

      // Filtro de Categoria
      if (categoryFilter !== 'all' && inc.category !== categoryFilter) {
        return false;
      }

      // Filtro de Período
      if (periodFilter === 'current_month') {
        try {
          const d = parseISO(inc.date);
          if (!isSameMonth(d, now) || d.getFullYear() !== now.getFullYear()) {
            return false;
          }
        } catch {
          // ignora falha de parse
        }
      }

      return true;
    }).sort((a, b) => b.date.localeCompare(a.date));
  }, [incomes, categoryFilter, periodFilter]);

  // Total das receitas filtradas
  const totalAmount = useMemo(() => {
    return filteredIncomes.reduce((sum, item) => sum + (item.amount || 0), 0);
  }, [filteredIncomes]);

  const handleConfirmDelete = async () => {
    if (!incomeToDelete || isDeleting) return;
    setIsDeleting(true);
    try {
      await onDelete(incomeToDelete.id);
      setIncomeToDelete(null);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* BARRA DE FILTROS E TOTALIZADOR DA TABELA */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-muted/20 p-4 rounded-2xl border">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Filtros:</span>
          </div>

          <Select value={periodFilter} onValueChange={(val: any) => setPeriodFilter(val)}>
            <SelectTrigger className="h-8 rounded-lg text-xs font-bold w-36 bg-background">
              <SelectValue placeholder="Período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="current_month" className="text-xs font-bold">Mês Atual</SelectItem>
              <SelectItem value="all" className="text-xs font-bold">Todo Histórico</SelectItem>
            </SelectContent>
          </Select>

          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="h-8 rounded-lg text-xs font-bold w-48 bg-background">
              <SelectValue placeholder="Todas as Categorias" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-xs font-bold">Todas as Categorias</SelectItem>
              {availableCategories.map(cat => (
                <SelectItem key={cat} value={cat} className="text-xs font-bold">{cat}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs font-medium text-muted-foreground">
            {filteredIncomes.length} lançamento{filteredIncomes.length === 1 ? '' : 's'}
          </span>
          <div className="bg-green-500/10 border border-green-500/20 px-3 py-1.5 rounded-xl flex items-center gap-2">
            <span className="text-[10px] font-black uppercase text-green-700 tracking-wider">Subtotal:</span>
            <span className="text-sm font-black text-green-600 font-mono">
              {isPrivacyMode ? '•••••' : formatCurrency(totalAmount)}
            </span>
          </div>
        </div>
      </div>

      {/* TABELA DE RECEITAS AVULSAS */}
      {filteredIncomes.length === 0 ? (
        <div className="py-20 text-center border-2 border-dashed rounded-xl bg-muted/5">
          <TrendingUp className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-20" />
          <p className="text-muted-foreground font-bold">Nenhuma receita avulsa encontrada no filtro selecionado.</p>
          <p className="text-xs text-muted-foreground/60 mt-1">Utilize o botão acima para registrar comissões avulsas ou outros recebimentos.</p>
        </div>
      ) : (
        <div className="rounded-xl border shadow-sm overflow-hidden bg-card">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow>
                <TableHead className="text-[10px] font-black uppercase tracking-widest">Data</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-widest">Descrição</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-widest">Categoria</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-widest">Forma Pgto.</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-widest">Observações</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-widest text-right">Valor</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-widest text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredIncomes.map((income) => (
                <TableRow key={income.id} className="hover:bg-muted/20 transition-colors">
                  <TableCell className="text-xs font-medium whitespace-nowrap">
                    {format(parseISO(income.date), 'dd/MM/yyyy', { locale: ptBR })}
                  </TableCell>
                  <TableCell className="font-bold text-sm">
                    {income.description}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 text-[10px] font-black uppercase">
                      {income.category}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {income.paymentMethod || '-'}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate" title={income.observations}>
                    {income.observations || '-'}
                  </TableCell>
                  <TableCell className="text-right font-black text-green-600 whitespace-nowrap font-mono text-sm">
                    {isPrivacyMode ? '•••••' : formatCurrency(income.amount)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-primary" onClick={() => onEdit(income)} title="Editar Receita">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-muted-foreground hover:text-destructive" 
                        onClick={() => setIncomeToDelete(income)} 
                        title="Excluir Lançamento com Confirmação"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* DIÁLOGO DE CONFIRMAÇÃO DE EXCLUSÃO SEGURA */}
      <AlertDialog open={!!incomeToDelete} onOpenChange={(open) => { if (!open && !isDeleting) setIncomeToDelete(null); }}>
        <AlertDialogContent className="rounded-2xl max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive font-black">
              <AlertCircle className="h-5 w-5" /> Confirmar Exclusão de Receita
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs space-y-2 pt-2">
              <p>Tem certeza de que deseja excluir permanentemente o lançamento:</p>
              <div className="p-3 bg-muted/30 rounded-xl border space-y-1">
                <p className="font-bold text-foreground text-sm">{incomeToDelete?.description}</p>
                <p className="text-green-600 font-mono font-black text-base">{incomeToDelete && formatCurrency(incomeToDelete.amount)}</p>
                <p className="text-[11px] text-muted-foreground">Categoria: {incomeToDelete?.category}</p>
              </div>
              <p className="text-muted-foreground/80">Esta ação não poderá ser desfeita e afetará exclusivamente este registro.</p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting} className="rounded-xl font-bold">Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={(e) => { e.preventDefault(); handleConfirmDelete(); }} 
              disabled={isDeleting}
              className="rounded-xl font-bold bg-destructive hover:bg-destructive/90 text-white"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Excluindo...
                </>
              ) : (
                'Excluir Receita'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
