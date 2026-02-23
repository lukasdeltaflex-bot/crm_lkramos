'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
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
import type { Expense } from '@/lib/types';
import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { Switch } from '@/components/ui/switch';

const expenseSchema = z.object({
  description: z.string().min(3, 'A descrição deve ter pelo menos 3 caracteres.'),
  amount: z.coerce.number().min(0.01, 'O valor deve ser maior que zero.'),
  date: z.string().refine((val) => !isNaN(parse(val, 'yyyy-MM-dd', new Date()).getTime()), {
    message: "Data inválida.",
  }),
  category: z.string({ required_error: 'Selecione uma categoria.' }),
  paid: z.boolean().default(false),
});

type ExpenseFormValues = z.infer<typeof expenseSchema>;

interface ExpenseFormProps {
  expense?: Expense;
  categories: string[];
  onSubmit: (data: ExpenseFormValues) => void;
  isSaving?: boolean;
}

export function ExpenseForm({ expense, categories, onSubmit, isSaving = false }: ExpenseFormProps) {
  // 🛡️ BLINDAGEM NUCLEAR V8: Garantindo defaultValues em todos os campos para evitar uncontrolled inputs
  const form = useForm<ExpenseFormValues>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      description: '',
      amount: 0,
      date: format(new Date(), 'yyyy-MM-dd'),
      category: categories[0] || 'Outros',
      paid: false,
    },
  });

  useEffect(() => {
    if (expense) {
      form.reset({
        description: expense.description || '',
        amount: expense.amount ?? 0,
        date: expense.date || format(new Date(), 'yyyy-MM-dd'),
        category: expense.category || 'Outros',
        paid: expense.paid ?? false,
      });
    }
  }, [expense, form, categories]);

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
                <Input placeholder="Ex: Pagamento Aluguel Junho" {...field} value={field.value ?? ''} disabled={isSaving} />
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
                        <div className="relative">
                            <span className="absolute left-3 top-2.5 text-[10px] font-black text-muted-foreground">R$</span>
                            <Input type="number" step="0.01" className="pl-9 font-bold text-red-600" placeholder="0.00" {...field} value={field.value ?? 0} disabled={isSaving} />
                        </div>
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
                        <Input type="date" {...field} value={field.value ?? ''} disabled={isSaving} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
            />
        </div>

        <div className="grid grid-cols-2 gap-4">
            <FormField
            control={form.control}
            name="category"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Categoria</FormLabel>
                <Select onValueChange={field.onChange} value={field.value ?? ''} disabled={isSaving}>
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

            <FormField
                control={form.control}
                name="paid"
                render={({ field }) => (
                    <FormItem className="flex flex-col justify-end pb-2">
                        <div className="flex items-center gap-2">
                            <FormControl>
                                <Switch
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                    disabled={isSaving}
                                />
                            </FormControl>
                            <FormLabel className="cursor-pointer">Despesa Paga</FormLabel>
                        </div>
                    </FormItem>
                )}
            />
        </div>

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