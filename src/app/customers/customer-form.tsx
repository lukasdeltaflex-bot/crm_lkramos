
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { CalendarIcon, Sparkles } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import type { Customer } from '@/lib/types';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { useEffect, useState } from 'react';
import { summarizeNotes } from '@/ai/flows/summarize-notes-flow';
import { toast } from '@/hooks/use-toast';

const customerSchema = z.object({
  name: z.string().min(3, 'O nome deve ter pelo menos 3 caracteres.'),
  cpf: z.string().length(14, 'O CPF deve ter 11 dígitos.'),
  phone: z.string().min(10, 'O telefone é obrigatório.'),
  email: z.string().email('O email é inválido.'),
  birthDate: z.date({ required_error: 'A data de nascimento é obrigatória.' }),
  observations: z.string().optional(),
});

type CustomerFormValues = z.infer<typeof customerSchema>;

// The form now only deals with the data it needs to edit.
// It doesn't need to know about `id` or `userId`.
type FormCustomer = Omit<Customer, 'id' | 'userId'>;

interface CustomerFormProps {
  customer?: Customer;
  onSubmit: (data: FormCustomer) => void;
}

export function CustomerForm({ customer, onSubmit }: CustomerFormProps) {
  const [isSummarizing, setIsSummarizing] = useState(false);
  const form = useForm<CustomerFormValues>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      name: '',
      cpf: '',
      phone: '',
      email: '',
      observations: '',
    },
  });

  useEffect(() => {
    if (customer) {
      form.reset({
        ...customer,
        birthDate: customer.birthDate ? new Date(customer.birthDate) : undefined,
      });
    } else {
      form.reset({
        name: '',
        cpf: '',
        phone: '',
        email: '',
        birthDate: undefined,
        observations: '',
      });
    }
  }, [customer, form]);

  function handleFormSubmit(data: CustomerFormValues) {
    // We only pass back the data that the parent component needs.
    // The parent is responsible for adding id/userId.
    const newCustomerData: FormCustomer = {
      ...data,
      birthDate: format(data.birthDate, 'yyyy-MM-dd'),
    };
    onSubmit(newCustomerData);
  }
  
  const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, "");
    value = value.replace(/(\d{3})(\d)/, "$1.$2");
    value = value.replace(/(\d{3})(\d)/, "$1.$2");
    value = value.replace(/(\d{3})(\d{1,2})$/, "$1-$2");
    form.setValue('cpf', value, { shouldValidate: true });
  };
  
  const handleSummarize = async () => {
    const currentObservations = form.getValues('observations');
    if (!currentObservations || currentObservations.trim() === '') {
      toast({
        variant: 'destructive',
        title: 'Campo vazio',
        description: 'Não há observações para resumir.',
      });
      return;
    }

    setIsSummarizing(true);
    try {
      const summary = await summarizeNotes(currentObservations);
      form.setValue('observations', summary, { shouldValidate: true });
      toast({
        title: 'Observações Resumidas!',
        description: 'As anotações foram resumidas com sucesso pela IA.',
      });
    } catch (error) {
      console.error('Error summarizing notes:', error);
      toast({
        variant: 'destructive',
        title: 'Erro ao resumir',
        description: 'Não foi possível gerar o resumo. Tente novamente.',
      });
    } finally {
      setIsSummarizing(false);
    }
  };


  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleFormSubmit)} className="py-4">
        <ScrollArea className="h-[calc(100vh-12rem)] pr-4">
          <div className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome Completo</FormLabel>
                  <FormControl>
                    <Input placeholder="João da Silva" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="cpf"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>CPF</FormLabel>
                  <FormControl>
                    <Input placeholder="000.000.000-00" {...field} onChange={handleCpfChange} maxLength={14}/>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input placeholder="joao.silva@example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Telefone</FormLabel>
                  <FormControl>
                    <Input placeholder="(11) 98765-4321" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
                    control={form.control}
                    name="birthDate"
                    render={({ field }) => (
                    <FormItem className="flex flex-col pt-2">
                        <FormLabel>Data de Nascimento</FormLabel>
                        <Popover>
                        <PopoverTrigger asChild>
                            <FormControl>
                            <Button
                                variant={'outline'}
                                className={cn(
                                'w-[240px] pl-3 text-left font-normal',
                                !field.value && 'text-muted-foreground'
                                )}
                            >
                                {field.value ? (
                                format(field.value, 'PPP')
                                ) : (
                                <span>Escolha uma data</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                            </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) =>
                                date > new Date() || date < new Date('1900-01-01')
                            }
                            initialFocus
                            />
                        </PopoverContent>
                        </Popover>
                        <FormMessage />
                    </FormItem>
                    )}
                />
            <FormField
              control={form.control}
              name="observations"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center justify-between">
                    <FormLabel>Observações</FormLabel>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleSummarize}
                      disabled={isSummarizing}
                    >
                      <Sparkles className="mr-2 h-4 w-4" />
                      {isSummarizing ? 'Resumindo...' : 'Resumir com IA'}
                    </Button>
                  </div>
                  <FormControl>
                    <Textarea
                      placeholder="Anotações sobre o cliente..."
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </ScrollArea>
        <div className="flex justify-end pt-8">
          <Button type="submit">Salvar Cliente</Button>
        </div>
      </form>
    </Form>
  );
}
