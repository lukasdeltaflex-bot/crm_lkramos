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
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { format, parse, isValid } from 'date-fns';
import type { ExtraIncome } from '@/lib/types';
import { useEffect, useMemo } from 'react';
import { Loader2, PlusCircle, Save } from 'lucide-react';
import { formatDateSafe } from '@/lib/utils';

const extraIncomeSchema = z.object({
  description: z.string().min(3, 'A descrição deve ter pelo menos 3 caracteres.'),
  amount: z.coerce.number().min(0.01, 'O valor deve ser maior que zero.'),
  date: z.string().refine((val) => {
    const parsed = parse(val, 'dd/MM/yyyy', new Date());
    return isValid(parsed) && val.length === 10;
  }, {
    message: "Data inválida. Use o formato dd/mm/aaaa.",
  }),
  category: z.string({ required_error: 'Selecione uma categoria.' }).min(1, 'Selecione uma categoria.'),
  paymentMethod: z.string().optional(),
  observations: z.string().optional(),
});

export type ExtraIncomeFormValues = z.infer<typeof extraIncomeSchema>;

interface ExtraIncomeFormProps {
  income?: ExtraIncome;
  categories: string[];
  onSubmit: (data: ExtraIncomeFormValues) => void;
  isSaving?: boolean;
}

const applyDateMask = (value: string) => {
  let v = value.replace(/\D/g, "").substring(0, 8);
  if (v.length > 4) v = v.replace(/(\d{2})(\d{2})(\d)/, "$1/$2/$3");
  else if (v.length > 2) v = v.replace(/(\d{2})(\d)/, "$1/$2");
  return v;
};

const PAYMENT_METHODS = [
  'Pix',
  'Transferência Bancária (TED/DOC)',
  'Dinheiro / Espécie',
  'Boleto Bancário',
  'Cartão de Crédito',
  'Cartão de Débito',
  'Cheque',
  'Outro'
];

export function ExtraIncomeForm({ income, categories, onSubmit, isSaving = false }: ExtraIncomeFormProps) {
  const finalCategories = useMemo(() => {
    const baseList = Array.isArray(categories) ? [...categories] : [];
    const list = baseList.map(c => c?.trim()).filter(Boolean);
    
    const incCat = income?.category?.trim();
    if (incCat && !list.includes(incCat)) {
      list.push(incCat);
    }
    return list.length > 0 ? list : ['Comissão avulsa', 'Prestação de serviços', 'Receita extraordinária', 'Outros recebimentos'];
  }, [categories, income?.category]);

  const form = useForm<ExtraIncomeFormValues>({
    resolver: zodResolver(extraIncomeSchema),
    defaultValues: {
      description: '',
      amount: 0,
      date: format(new Date(), 'dd/MM/yyyy'),
      category: finalCategories[0] || 'Comissão avulsa',
      paymentMethod: 'Pix',
      observations: '',
    },
  });

  useEffect(() => {
    if (income) {
      form.reset({
        description: income.description || '',
        amount: income.amount ?? 0,
        date: formatDateSafe(income.date),
        category: income.category || finalCategories[0] || 'Comissão avulsa',
        paymentMethod: income.paymentMethod || 'Pix',
        observations: income.observations || '',
      });
    } else {
      form.reset({
        description: '',
        amount: 0,
        date: format(new Date(), 'dd/MM/yyyy'),
        category: finalCategories[0] || 'Comissão avulsa',
        paymentMethod: 'Pix',
        observations: '',
      });
    }
  }, [income, form, finalCategories]);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descrição da Receita *</FormLabel>
              <FormControl>
                <Input placeholder="Ex: Honorários avulsos, Comissão de parceria, etc." {...field} value={field.value ?? ''} disabled={isSaving} />
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
                <FormLabel>Valor Recebido (R$) *</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    step="0.01" 
                    placeholder="0,00" 
                    {...field} 
                    value={field.value ?? ''} 
                    onChange={e => field.onChange(e.target.value === '' ? '' : parseFloat(e.target.value))} 
                    disabled={isSaving} 
                  />
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
                <FormLabel>Data do Recebimento *</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="DD/MM/AAAA" 
                    {...field} 
                    value={field.value ?? ''} 
                    onChange={e => field.onChange(applyDateMask(e.target.value))} 
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
                <FormLabel>Categoria *</FormLabel>
                <Select onValueChange={field.onChange} value={field.value} disabled={isSaving}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a categoria" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {finalCategories.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="paymentMethod"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Forma de Recebimento</FormLabel>
                <Select onValueChange={field.onChange} value={field.value} disabled={isSaving}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Forma de pgto." />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {PAYMENT_METHODS.map((pm) => (
                      <SelectItem key={pm} value={pm}>
                        {pm}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="observations"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Observações (Opcional)</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Informações adicionais sobre o recebimento..." 
                  {...field} 
                  value={field.value ?? ''} 
                  disabled={isSaving} 
                  className="resize-none h-20"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="pt-4 flex justify-end gap-2">
          <Button type="submit" disabled={isSaving} className="rounded-full font-bold px-6 bg-green-600 hover:bg-green-700 text-white">
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Salvando...
              </>
            ) : income ? (
              <>
                <Save className="mr-2 h-4 w-4" />
                Salvar Alterações
              </>
            ) : (
              <>
                <PlusCircle className="mr-2 h-4 w-4" />
                Lançar Receita
              </>
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
