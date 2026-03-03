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
import { format, parse, isValid } from 'date-fns';
import type { Expense } from '@/lib/types';
import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { Switch } from '@/components/ui/switch';

const expenseSchema = z.object({
  description: z.string().min(3, 'A descrição deve ter pelo menos 3 caracteres.'),
  amount: z.coerce.number().min(0.01, 'O valor deve ser maior que zero.'),
  date: z.string().refine((val) => {
    const parsed = parse(val, 'dd/MM/yyyy', new Date());
    return isValid(parsed) && val.length === 10;
  }, {
    message: "Data inválida. Use o formato dd/mm/aaaa.",
  }),
  category: z.string({ required_error: 'Selecione uma categoria.' }),
  paid: z.boolean().default(false),
});

type ExpenseFormValues = z.infer<typeof expenseSchema>;

interface ExpenseFormProps {
  expense?: Expense;
  categories: string[];
  onSubmit: (data: any) => void;
  isSaving?: boolean;
}

const applyDateMask = (value: string) => {
    let v = value.replace(/\D/g, "").substring(0, 8);
    if (v.length > 4) v = v.replace(/(\d{2})(\d{2})(\d)/, "$1/$2/$3");
    else if (v.length > 2) v = v.replace(/(\d{2})(\d)/, "$1/$2");
    return v;
};

export function ExpenseForm({ expense, categories, onSubmit, isSaving = false }: ExpenseFormProps) {
  const form = useForm<ExpenseFormValues>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      description: '',
      amount: 0,
      date: format(new Date(), 'dd/MM/yyyy'),
      category: '',
      paid: false,
    },
  });

  useEffect(() => {
    if (expense) {
      let formattedDate = format(new Date(), 'dd/MM/yyyy');
      if (expense.date) {
          try {
              const d = expense.date.includes('-') 
                ? parse(expense.date, 'yyyy-MM-dd', new Date())
                : parse(expense.date, 'dd/MM/yyyy', new Date());
              if (isValid(d)) formattedDate = format(d, 'dd/MM/yyyy');
          } catch(e) {}
      }

      form.reset({
        description: expense.description || '',
        amount: expense.amount ?? 0,
        date: formattedDate,
        category: expense.category || categories[0] || 'Outros',
        paid: expense.paid ?? false,
      });
    } else {
        form.reset({
            description: '',
            amount: 0,
            date: format(new Date(), 'dd/MM/yyyy'),
            category: categories[0] || 'Outros',
            paid: false,
        });
    }
  }, [expense, form, categories]);

  const handleFormSubmit = (data: ExpenseFormValues) => {
    const parsedDate = parse(data.date, 'dd/MM/yyyy', new Date());
    const isoDate = format(parsedDate, 'yyyy-MM-dd');
    
    onSubmit({
        ...data,
        date: isoDate
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4 py-4">
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
                        <Input 
                            placeholder="dd/mm/aaaa" 
                            {...field} 
                            value={field.value ?? ''} 
                            onChange={(e) => field.onChange(applyDateMask(e.target.value))}
                            maxLength={10}
                            disabled={isSaving} 
                        />
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
                <Select 
                    onValueChange={field.onChange} 
                    value={field.value} 
                    disabled={isSaving}
                >
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
