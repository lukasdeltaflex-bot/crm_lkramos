
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
import { Textarea } from '@/components/ui/textarea';
import { format, parse } from 'date-fns';
import type { Reminder, Customer } from '@/lib/types';
import { useEffect, useMemo } from 'react';
import { X, Search, Loader2 } from 'lucide-react';

const reminderSchema = z.object({
  title: z.string().min(1, 'O título ou nome do cliente é obrigatório.'),
  description: z.string().optional(),
  dueDate: z.string().refine((val) => !isNaN(parse(val, 'yyyy-MM-dd', new Date()).getTime()), {
    message: "Data inválida.",
  }),
  customerId: z.string().optional(),
  status: z.enum(['pending', 'completed']),
});

type ReminderFormValues = z.infer<typeof reminderSchema>;

interface ReminderFormProps {
  reminder?: Reminder;
  customers: Customer[];
  onSubmit: (data: ReminderFormValues) => void;
  onOpenCustomerSearch: () => void;
  selectedCustomerFromSearch: Customer | null;
  onCustomerSearchSelectionHandled: () => void;
  isSaving?: boolean;
}

export function ReminderForm({ 
  reminder, 
  customers, 
  onSubmit, 
  onOpenCustomerSearch, 
  selectedCustomerFromSearch, 
  onCustomerSearchSelectionHandled,
  isSaving = false
}: ReminderFormProps) {
  const form = useForm<ReminderFormValues>({
    resolver: zodResolver(reminderSchema),
    defaultValues: {
      title: '',
      description: '',
      dueDate: format(new Date(), 'yyyy-MM-dd'),
      customerId: '',
      status: 'pending',
    },
  });

  const selectedCustomerId = form.watch('customerId');

  const selectedCustomerName = useMemo(() => {
    if (!selectedCustomerId) return "";
    return customers.find(c => c.id === selectedCustomerId)?.name || "Cliente vinculado";
  }, [customers, selectedCustomerId]);

  useEffect(() => {
    if (reminder) {
      form.reset({
        title: reminder.title,
        description: reminder.description || '',
        dueDate: reminder.dueDate,
        customerId: reminder.customerId || '',
        status: reminder.status,
      });
    }
  }, [reminder, form]);

  useEffect(() => {
    if (selectedCustomerFromSearch) {
      form.setValue('customerId', selectedCustomerFromSearch.id, { shouldValidate: true });
      if (!form.getValues('title')) {
        form.setValue('title', `Retorno: ${selectedCustomerFromSearch.name}`);
      }
      onCustomerSearchSelectionHandled();
    }
  }, [selectedCustomerFromSearch, form, onCustomerSearchSelectionHandled]);

  const handleCustomerClear = () => {
    form.setValue('customerId', '');
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
        <FormField
          control={form.control}
          name="customerId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Vincular a um Cliente (Busca por Nome/CPF)</FormLabel>
              <div className="flex items-center gap-2">
                <FormControl>
                  <div className="relative flex-1">
                    <Input
                        readOnly
                        value={selectedCustomerId ? selectedCustomerName : ""}
                        placeholder="Clique em buscar para localizar..."
                        className="bg-muted/30 pr-10"
                    />
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground opacity-50" />
                  </div>
                </FormControl>
                <Button
                  type="button"
                  variant="outline"
                  onClick={onOpenCustomerSearch}
                  disabled={isSaving}
                >
                  {field.value ? 'Trocar' : 'Buscar'}
                </Button>
                {field.value && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={handleCustomerClear}
                    disabled={isSaving}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
              <FormDescription>Pesquise o cliente pelo nome ou CPF para vincular.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Título / Assunto</FormLabel>
              <FormControl>
                <Input placeholder="Ex: Retorno João da Silva" {...field} disabled={isSaving} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="dueDate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Data do Retorno</FormLabel>
              <FormControl>
                <Input type="date" {...field} disabled={isSaving} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Anotações Adicionais</FormLabel>
              <FormControl>
                <Textarea placeholder="Descreva o que deve ser feito..." {...field} disabled={isSaving} />
              </FormControl>
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
                'Salvar Lembrete'
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
