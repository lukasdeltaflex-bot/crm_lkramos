
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format, parse } from 'date-fns';
import type { Reminder, Customer } from '@/lib/types';
import { useEffect } from 'react';

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
}

export function ReminderForm({ reminder, customers, onSubmit }: ReminderFormProps) {
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

  useEffect(() => {
    if (reminder) {
      form.reset({
        ...reminder,
        customerId: reminder.customerId || '',
      });
    }
  }, [reminder, form]);

  const handleCustomerSelect = (customerId: string) => {
    form.setValue('customerId', customerId);
    if (!form.getValues('title')) {
        const customer = customers.find(c => c.id === customerId);
        if (customer) form.setValue('title', `Retorno: ${customer.name}`);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
        <FormField
          control={form.control}
          name="customerId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Vincular a um Cliente (Opcional)</FormLabel>
              <Select onValueChange={handleCustomerSelect} defaultValue={field.value} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um cliente cadastrado" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="">Nenhum (Cliente Novo/Prospect)</SelectItem>
                  {customers.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>Útil para lembretes de clientes que já estão na sua base.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Título / Nome do Cliente</FormLabel>
              <FormControl>
                <Input placeholder="Ex: João da Silva (Aguardar 90 dias)" {...field} />
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
                <Input type="date" {...field} />
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
                <Textarea placeholder="Motivo do retorno, condições combinadas, etc." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end pt-4">
          <Button type="submit">Salvar Lembrete</Button>
        </div>
      </form>
    </Form>
  );
}
