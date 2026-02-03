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
import { format } from 'date-fns';
import type { FollowUp, Customer } from '@/lib/types';
import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const schema = z.object({
  contactName: z.string().min(2, 'O nome é obrigatório.'),
  contactPhone: z.string().optional(),
  customerId: z.string().optional(),
  referralInfo: z.string().optional(),
  description: z.string().min(5, 'Descreva o motivo do retorno.'),
  dueDate: z.string().min(10, 'Data inválida.'),
});

type FormValues = z.infer<typeof schema>;

interface Props {
  customers: Customer[];
  initialData?: FollowUp;
  onSubmit: (data: FormValues) => void;
  isSaving?: boolean;
}

export function FollowUpForm({ customers, initialData, onSubmit, isSaving = false }: Props) {
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      contactName: '',
      contactPhone: '',
      customerId: '',
      referralInfo: '',
      description: '',
      dueDate: format(new Date(), 'yyyy-MM-dd'),
    },
  });

  useEffect(() => {
    if (initialData) {
      form.reset({
        contactName: initialData.contactName,
        contactPhone: initialData.contactPhone || '',
        customerId: initialData.customerId || '',
        referralInfo: initialData.referralInfo || '',
        description: initialData.description,
        dueDate: initialData.dueDate,
      });
    }
  }, [initialData, form]);

  const selectedCustomerId = form.watch('customerId');

  useEffect(() => {
    if (selectedCustomerId && selectedCustomerId !== 'none') {
        const customer = customers.find(c => c.id === selectedCustomerId);
        if (customer) {
            form.setValue('contactName', customer.name);
            form.setValue('contactPhone', customer.phone);
        }
    }
  }, [selectedCustomerId, customers, form]);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
        <FormField
          control={form.control}
          name="customerId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Vincular a um Cliente Existente (Opcional)</FormLabel>
              <Select 
                onValueChange={(val) => field.onChange(val === 'none' ? '' : val)} 
                value={field.value || 'none'}
                disabled={isSaving}
              >
                <FormControl>
                  <SelectTrigger className="bg-muted/30">
                    <SelectValue placeholder="Selecione um cliente cadastrado..." />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="none">Nenhum (Novo Contato)</SelectItem>
                  {customers.filter(c => c.name !== 'Cliente Removido').map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.name} ({c.cpf})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
                control={form.control}
                name="contactName"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Nome do Contato</FormLabel>
                    <FormControl>
                        <Input placeholder="Ex: João da Silva (Esposo da Ana)" {...field} disabled={isSaving} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
            />
            <FormField
                control={form.control}
                name="contactPhone"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Telefone (Opcional)</FormLabel>
                    <FormControl>
                        <Input placeholder="(00) 00000-0000" {...field} disabled={isSaving} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
            />
        </div>

        <FormField
          control={form.control}
          name="referralInfo"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Vínculo / Origem</FormLabel>
              <FormControl>
                <Input placeholder="Ex: Indicação da cliente Maria Oliveira" {...field} disabled={isSaving} />
              </FormControl>
              <FormDescription>Explique como chegou a este contato ou qual o vínculo.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
        </div>

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Motivo do Retorno / O que tratar</FormLabel>
              <FormControl>
                <Textarea placeholder="Descreva detalhadamente o que deve ser feito..." {...field} disabled={isSaving} />
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
                'Salvar Agendamento'
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
