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
import { CalendarIcon, Sparkles, AlertCircle, Loader2 } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import type { Customer } from '@/lib/types';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { useEffect, useState } from 'react';
import { summarizeNotes } from '@/ai/flows/summarize-notes-flow';
import { toast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';

const customerSchema = z.object({
  name: z.string().min(3, 'O nome deve ter pelo menos 3 caracteres.'),
  cpf: z.string().length(14, 'O CPF deve ter 11 dígitos.'),
  benefitNumber: z.string().optional(),
  phone: z.string().min(10, 'O telefone é obrigatório.'),
  email: z.string().email('O email é inválido.'),
  birthDate: z.date({ required_error: 'A data de nascimento é obrigatória.' }),
  observations: z.string().optional(),
  // Address
  cep: z.string().optional(),
  street: z.string().optional(),
  number: z.string().optional(),
  complement: z.string().optional(),
  neighborhood: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
});

type CustomerFormValues = z.infer<typeof customerSchema>;

type FormCustomer = Omit<Customer, 'id' | 'userId'>;

interface CustomerFormProps {
  customer?: Customer;
  onSubmit: (data: FormCustomer) => void;
}

export function CustomerForm({ customer, onSubmit }: CustomerFormProps) {
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [isFetchingCep, setIsFetchingCep] = useState(false);
  const [age, setAge] = useState<number | null>(null);

  const form = useForm<CustomerFormValues>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      name: '',
      cpf: '',
      benefitNumber: '',
      phone: '',
      email: '',
      observations: '',
      cep: '',
      street: '',
      number: '',
      complement: '',
      neighborhood: '',
      city: '',
      state: '',
    },
  });

  const birthDate = form.watch('birthDate');

  useEffect(() => {
    if (birthDate) {
      const today = new Date();
      const birth = new Date(birthDate);
      let calculatedAge = today.getFullYear() - birth.getFullYear();
      const m = today.getMonth() - birth.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
        calculatedAge--;
      }
      setAge(calculatedAge);
    } else {
      setAge(null);
    }
  }, [birthDate]);

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
        benefitNumber: '',
        phone: '',
        email: '',
        birthDate: undefined,
        observations: '',
        cep: '',
        street: '',
        number: '',
        complement: '',
        neighborhood: '',
        city: '',
        state: '',
      });
    }
  }, [customer, form]);

  function handleFormSubmit(data: CustomerFormValues) {
    const newCustomerData: FormCustomer = {
      ...data,
      birthDate: format(data.birthDate, 'yyyy-MM-dd'),
    };
    onSubmit(newCustomerData);
  }
  
  const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, "");
    if (value.length > 11) value = value.substring(0, 11);
    value = value.replace(/(\d{3})(\d)/, "$1.$2");
    value = value.replace(/(\d{3})(\d)/, "$1.$2");
    value = value.replace(/(\d{3})(\d{1,2})$/, "$1-$2");
    e.target.value = value;
    form.setValue('cpf', value, { shouldValidate: true });
  };
  
  const handleCepChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, "");
    if (value.length > 8) value = value.substring(0, 8);
    value = value.replace(/(\d{5})(\d)/, "$1-$2");
    e.target.value = value;
    form.setValue('cep', value, { shouldValidate: true });
  }

  const handleCepBlur = async (e: React.FocusEvent<HTMLInputElement>) => {
    const cep = e.target.value.replace(/\D/g, '');
    if (cep.length !== 8) {
        return;
    }
    setIsFetchingCep(true);
    try {
        const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
        const data = await response.json();
        if (data.erro) {
            toast({
                variant: 'destructive',
                title: 'CEP não encontrado',
                description: 'Verifique o CEP digitado e tente novamente.',
            });
            form.setValue('street', '');
            form.setValue('neighborhood', '');
            form.setValue('city', '');
            form.setValue('state', '');
        } else {
            form.setValue('street', data.logradouro);
            form.setValue('neighborhood', data.bairro);
            form.setValue('city', data.localidade);
            form.setValue('state', data.uf);
            form.setFocus('number'); // Move focus to the number field
        }
    } catch (error) {
        toast({
            variant: 'destructive',
            title: 'Erro ao buscar CEP',
            description: 'Não foi possível buscar o endereço. Verifique sua conexão.',
        });
    } finally {
        setIsFetchingCep(false);
    }
  }

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
          <div className="space-y-8">
            {/* Dados Pessoais */}
            <div className='space-y-4'>
                <h3 className="text-lg font-medium">Dados Pessoais</h3>
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
                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
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
                    name="benefitNumber"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Número do Benefício</FormLabel>
                        <FormControl>
                            <Input placeholder="123.456.789-0" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                </div>
                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
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
                </div>
                <div className="flex items-start gap-4">
                    <FormField
                            control={form.control}
                            name="birthDate"
                            render={({ field }) => (
                            <FormItem className="flex flex-col pt-2">
                                <FormLabel>
                                    Data de Nascimento {age !== null && <span className="text-muted-foreground">({age} anos)</span>}
                                </FormLabel>
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
                                        format(field.value, 'dd/MM/yyyy', { locale: ptBR })
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
                                    defaultMonth={field.value || new Date(new Date().setFullYear(new Date().getFullYear() - 30))}
                                    locale={ptBR}
                                    disabled={(date) =>
                                        date > new Date()
                                    }
                                    initialFocus
                                    fromYear={1920}
                                    toYear={new Date().getFullYear()}
                                    captionLayout="dropdown-buttons"
                                    />
                                </PopoverContent>
                                </Popover>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                    {age !== null && age >= 74 && (
                        <Alert variant="destructive" className="mt-2 max-w-xs">
                            <AlertCircle className="h-4 w-4" />
                            <AlertTitle>Atenção!</AlertTitle>
                            <AlertDescription>
                                Cliente com {age} anos. Verifique as restrições de idade para os produtos de empréstimo.
                            </AlertDescription>
                        </Alert>
                    )}
                </div>
            </div>

            <Separator />
            
            {/* Endereço */}
            <div className='space-y-4'>
                <h3 className="text-lg font-medium">Endereço</h3>
                <FormField
                    control={form.control}
                    name="cep"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>CEP</FormLabel>
                        <FormControl>
                            <div className='relative'>
                                <Input placeholder="00000-000" {...field} onChange={handleCepChange} onBlur={handleCepBlur} maxLength={9} className="max-w-xs" />
                                {isFetchingCep && <Loader2 className="absolute right-3 top-2.5 h-5 w-5 animate-spin text-muted-foreground" />}
                            </div>
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                    <FormField
                        control={form.control}
                        name="street"
                        render={({ field }) => (
                            <FormItem className='col-span-2'>
                            <FormLabel>Logradouro</FormLabel>
                            <FormControl>
                                <Input placeholder="Rua das Flores" {...field} />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                     <FormField
                        control={form.control}
                        name="number"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Número</FormLabel>
                            <FormControl>
                                <Input placeholder="123" {...field} />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>
                <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                    <FormField
                        control={form.control}
                        name="complement"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Complemento</FormLabel>
                            <FormControl>
                                <Input placeholder="Apto 45" {...field} />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="neighborhood"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Bairro</FormLabel>
                            <FormControl>
                                <Input placeholder="Centro" {...field} />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>
                <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                    <FormField
                        control={form.control}
                        name="city"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Cidade</FormLabel>
                            <FormControl>
                                <Input placeholder="São Paulo" {...field} />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="state"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Estado</FormLabel>
                            <FormControl>
                                <Input placeholder="SP" {...field} />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>
            </div>

            <Separator />

            {/* Observações */}
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
