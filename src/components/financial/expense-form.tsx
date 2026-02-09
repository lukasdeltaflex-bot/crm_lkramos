
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { format, parse } from 'date-fns';
import type { Expense, ExpenseCategory } from '@/lib/types';
import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';

const categories: ExpenseCategory[] = ['Aluguel', 'Internet', 'Telefonia', 'Tráfego Pago', 'Salários', 'Impostos', 'Outros'];

const expenseSchema = z.object({
  description: z.string().min(3, 'A descrição deve ter pelo menos 3 caracteres.'),
  amount: z.coerce.number().min(0.01, 'O valor deve ser maior que zero.'),
  date: z.string().refine((val) => !isNaN(parse(val, 'yyyy-MM-dd', new Date()).getTime()), {
    message: "Data inválida.",
  }),
  category: z.string({ required_error: 'Selecione uma categoria.' }),
});

type ExpenseFormValues = z.infer<typeof expenseSchema>;

interface ExpenseFormProps {
  expense?: Expense;
  onSubmit: (data: ExpenseFormValues) => void;
  isSaving?: boolean;
}

export function ExpenseForm({ expense, onSubmit, isSaving = false }: ExpenseFormProps) {
  const form = useForm<ExpenseFormValues>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      description: '',
      amount: 0,
      date: format(new Date(), 'yyyy-MM-dd'),
      category: 'Outros',
    },
  });

  useEffect(() => {
    if (expense) {
      form.reset({
        description: expense.description,
        amount: expense.amount,
        date: expense.date,
        category: expense.category,
      });
    }
  }, [expense, form]);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descrição da Despesa</FormLabel>
              <FormControl>
                <Input placeholder="Ex: Pagamento Aluguel Junho" {...field} disabled={isSaving} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
            <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Valor (R$)</FormLabel>
                    <FormControl>
                        <Input type="number" step="0.01" placeholder="0.00" {...field} disabled={isSaving} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
            />
            <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Data de Vencimento/Pago</FormLabel>
                    <FormControl>
                        <Input type="date" {...field} disabled={isSaving} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
            />
        </div>

        <FormField
          control={form.control}
          name="category"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Categoria</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value} disabled={isSaving}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a categoria" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end pt-4">
          <Button type="submit" disabled={isSaving}>
            {isSaving ? (
                <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Salvando...
                </>
            ) : (
                'Salvar Despesa'
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
