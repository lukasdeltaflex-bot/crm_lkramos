
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
  FormDescription,
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
import { useEffect, useMemo } from 'react';
import { Loader2, CalendarRange, ListOrdered } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { formatCurrencyInput, formatDateSafe } from '@/lib/utils';

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
  recurrence: z.enum(['none', 'monthly', 'annually', 'semi-annually', 'installments']).default('none'),
  installmentsCount: z.coerce.number().min(1).max(120).optional().default(1),
});

export type ExpenseFormValues = z.infer<typeof expenseSchema>;

interface ExpenseFormProps {
  expense?: Expense;
  categories: string[];
  onSubmit: (data: ExpenseFormValues) => void;
  isSaving?: boolean;
}

const applyDateMask = (value: string) => {
    let v = value.replace(/\D/g, "").substring(0, 8);
    if (v.length > 4) v = v.replace(/(\d{2})(\d{2})(\d)/, "$1/$2/$3");
    else if (v.length > 2) v = v.replace(/(\d{2})(\d)/, "$1/$2");
    return v;
};

export function ExpenseForm({ expense, categories, onSubmit, isSaving = false }: ExpenseFormProps) {
  const finalCategories = useMemo(() => {
    const list = [...categories];
    if (expense?.category && !list.includes(expense.category)) {
        list.push(expense.category);
    }
    return list;
  }, [categories, expense?.category]);

  const form = useForm<ExpenseFormValues>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      description: expense?.description || '',
      amount: expense?.amount ?? 0,
      date: expense?.date ? formatDateSafe(expense.date) : format(new Date(), 'dd/MM/yyyy'),
      category: expense?.category || categories[0] || '',
      paid: expense?.paid ?? false,
      recurrence: expense?.recurrence || 'none',
      installmentsCount: expense?.installmentsCount || 1,
    },
  });

  useEffect(() => {
    if (expense) {
      form.reset({
        description: expense.description || '',
        amount: expense.amount ?? 0,
        date: formatDateSafe(expense.date),
        category: expense.category || categories[0] || '',
        paid: expense.paid ?? false,
        recurrence: expense.recurrence || 'none',
        installmentsCount: expense.installmentsCount || 1,
      });
    }
  }, [expense, form, categories]);

  const watchRecurrence = form.watch('recurrence');

  const handleFormSubmit = (data: ExpenseFormValues) => {
    onSubmit(data);
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
                <Input placeholder="Ex: Aluguel, Internet, etc." {...field} value={field.value ?? ''} disabled={isSaving || !!expense} />
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
                            <Input 
                                type="text" 
                                className="pl-9 font-bold text-red-600" 
                                value={formatCurrencyInput(field.value)}
                                onChange={(e) => {
                                    const val = e.target.value.replace(/\D/g, "");
                                    const num = val ? parseInt(val) / 100 : 0;
                                    field.onChange(num);
                                }}
                                placeholder="0,00"
                                disabled={isSaving || !!expense} 
                            />
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
                    <FormLabel>Vencimento / Data</FormLabel>
                    <FormControl>
                        <Input 
                            placeholder="dd/mm/aaaa" 
                            {...field} 
                            value={field.value ?? ''} 
                            onChange={(e) => field.onChange(applyDateMask(e.target.value))}
                            maxLength={10}
                            disabled={isSaving || !!expense} 
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
                    disabled={isSaving || !!expense}
                >
                    <FormControl>
                    <SelectTrigger>
                        <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                    {finalCategories.map((cat) => (
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
                            <FormLabel className="cursor-pointer">Já está paga</FormLabel>
                        </div>
                    </FormItem>
                )}
            />
        </div>

        {!expense && (
            <div className="p-4 rounded-xl border-2 border-dashed bg-muted/5 space-y-4 animate-in fade-in duration-500">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="recurrence"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-primary/60">
                                    <CalendarRange className="h-3 w-3" /> Tipo de Despesa
                                </FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                    <FormControl>
                                        <SelectTrigger className="h-9 font-bold text-xs">
                                            <SelectValue />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="none">Lançamento Único</SelectItem>
                                        <SelectItem value="monthly">Mensal</SelectItem>
                                        <SelectItem value="semi-annually">Semestral</SelectItem>
                                        <SelectItem value="annually">Anual</SelectItem>
                                        <SelectItem value="installments">Parcelada</SelectItem>
                                    </SelectContent>
                                </Select>
                            </FormItem>
                        )}
                    />

                    {watchRecurrence !== 'none' && (
                        <FormField
                            control={form.control}
                            name="installmentsCount"
                            render={({ field }) => (
                                <FormItem className="animate-in zoom-in-95">
                                    <FormLabel className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-orange-600">
                                        <ListOrdered className="h-3 w-3" /> Qtd. de Vezes
                                    </FormLabel>
                                    <FormControl>
                                        <Input type="number" {...field} min={1} max={120} className="h-9 font-bold" />
                                    </FormControl>
                                    <FormDescription className="text-[9px]">Repetições automáticas.</FormDescription>
                                </FormItem>
                            )}
                        />
                    )}
                </div>
                <p className="text-[9px] text-muted-foreground leading-tight uppercase font-bold text-center opacity-60">
                    O sistema criará automaticamente as entradas futuras no fluxo de caixa.
                </p>
            </div>
        )}

        <div className="flex justify-end pt-4">
          <Button type="submit" disabled={isSaving} className="rounded-full px-8 font-bold">
            {isSaving ? (
                <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processando...
                </>
            ) : (
                expense ? 'Atualizar Pagamento' : 'Lançar no Financeiro'
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
