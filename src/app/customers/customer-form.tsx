'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useFieldArray } from 'react-hook-form';
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
import { CalendarIcon, Sparkles, AlertCircle, Loader2, PlusCircle, Trash2 } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { format, parse } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import type { Customer, Benefit } from '@/lib/types';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { useEffect, useState } from 'react';
import { summarizeNotes } from '@/ai/flows/summarize-notes-flow';
import { toast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { isWhatsApp, getWhatsAppUrl } from '@/lib/utils';
import { WhatsAppIcon } from '@/components/icons/whatsapp-icon';

const benefitSchema = z.object({
    number: z.string().min(1, "O número do benefício é obrigatório."),
    species: z.string().optional(),
});

const customerSchema = z.object({
  name: z.string().min(3, 'O nome deve ter pelo menos 3 caracteres.'),
  cpf: z.string().length(14, 'O CPF deve ter 11 dígitos.'),
  benefits: z.array(benefitSchema).optional(),
  phone: z.string().min(10, 'O telefone é obrigatório.'),
  phone2: z.string().optional(),
  email: z.string().email('O email é inválido.').or(z.literal('')).optional(),
  birthDate: z.string().refine((date) => {
    try {
      const parsedDate = parse(date, 'dd/MM/yyyy', new Date());
      return !isNaN(parsedDate.getTime());
    } catch {
      return false;
    }
  }, { message: 'Data inválida. Use o formato dd/mm/aaaa.' }),
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

type FormCustomer = Omit<Customer, 'id' | 'ownerId' | 'numericId'>;

type CustomerFormData = Partial<Omit<Customer, 'id' | 'ownerId'>>;

interface CustomerFormProps {
  customer?: Customer;
  defaultValues?: CustomerFormData;
  onSubmit: (data: FormCustomer) => void;
  isSaving?: boolean;
}

export function CustomerForm({ customer, defaultValues, onSubmit, isSaving = false }: CustomerFormProps) {
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [isFetchingCep, setIsFetchingCep] = useState(false);
  const [age, setAge] = useState<number | null>(null);

  const form = useForm<CustomerFormValues>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      name: '',
      cpf: '',
      benefits: [],
      phone: '',
      phone2: '',
      email: '',
      birthDate: '',
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

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "benefits"
  });

  const birthDateValue = form.watch('birthDate');
  const phone1Value = form.watch('phone');
  const phone2Value = form.watch('phone2');

  useEffect(() => {
    if (birthDateValue && birthDateValue.length === 10) {
      try {
        const birth = parse(birthDateValue, 'dd/MM/yyyy', new Date());
        if (!isNaN(birth.getTime())) {
          const today = new Date();
          let calculatedAge = today.getFullYear() - birth.getFullYear();
          const m = today.getMonth() - birth.getMonth();
          if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
            calculatedAge--;
          }
          setAge(calculatedAge);
        } else {
            setAge(null)
        }
      } catch {
        setAge(null);
      }
    } else {
      setAge(null);
    }
  }, [birthDateValue]);

  useEffect(() => {
    const getInitialData = () => {
        const initial = {
            name: '',
            cpf: '',
            benefits: [],
            phone: '',
            phone2: '',
            email: '',
            birthDate: '',
            observations: '',
            cep: '',
            street: '',
            number: '',
            complement: '',
            neighborhood: '',
            city: '',
            state: '',
        };

        const source = customer || defaultValues;

        if (source) {
          let formattedBirthDate = '';
          if (source.birthDate) {
              try {
                  // The date from DB is YYYY-MM-DD, need to parse it correctly
                  const date = parse(source.birthDate, 'yyyy-MM-dd', new Date());
                  if (!isNaN(date.getTime())) {
                      formattedBirthDate = format(date, 'dd/MM/yyyy');
                  }
              } catch (e) {
                // If parsing fails, leave it blank
              }
          }
          return {
            ...initial,
            ...source,
            benefits: source.benefits || [],
            birthDate: formattedBirthDate,
          };
        }
        return initial;
    }
    form.reset(getInitialData());
  }, [customer, defaultValues, form]);

  function handleFormSubmit(data: CustomerFormValues) {
    const parsedDate = parse(data.birthDate, 'dd/MM/yyyy', new Date());
    const newCustomerData: FormCustomer = {
      ...data,
      birthDate: format(parsedDate, 'yyyy-MM-dd'),
      benefits: data.benefits || [],
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
  
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>, fieldName: 'phone' | 'phone2') => {
    let value = e.target.value.replace(/\D/g, "");
    if (value.length > 11) value = value.substring(0, 11);
    value = value.replace(/^(\d{2})(\d)/, "($1) $2");
    if (value.length > 9) {
        value = value.replace(/(\d{5})(\d)/, "$1-$2");
    }
    e.target.value = value;
    form.setValue(fieldName, value, { shouldValidate: true });
  };

  const handleCepChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, "");
    if (value.length > 8) value = value.substring(0, 8);
    value = value.replace(/(\d{5})(\d)/, "$1-$2");
    e.target.value = value;
    form.setValue('cep', value, { shouldValidate: true });
  }

  const handleBirthDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, "");
    if (value.length > 8) value = value.substring(0, 8);
    value = value.replace(/(\d{2})(\d)/, '$1/$2');
    value = value.replace(/(\d{2})(\d)/, '$1/$2');
    e.target.value = value;
    form.setValue('birthDate', value, { shouldValidate: true });
  };


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
        <ScrollArea className="h-[70vh] pr-4">
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
                </div>
                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                    <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                            <Input placeholder="joao.silva@example.com" {...field} value={field.value ?? ''}/>
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
                                    <div className="relative flex items-center">
                                        <Input
                                            placeholder="(11) 98765-4321"
                                            {...field}
                                            onChange={(e) => handlePhoneChange(e, 'phone')}
                                            maxLength={15}
                                            className="pr-10"
                                        />
                                        {isWhatsApp(phone1Value) && (
                                            <a href={getWhatsAppUrl(phone1Value)} target="_blank" rel="noopener noreferrer" className="absolute right-3 text-green-500 hover:text-green-600">
                                                <WhatsAppIcon />
                                            </a>
                                        )}
                                    </div>
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="phone2"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Telefone 2 (Opcional)</FormLabel>
                                <FormControl>
                                    <div className="relative flex items-center">
                                        <Input
                                            placeholder="(11) 91234-5678"
                                            {...field}
                                            onChange={(e) => handlePhoneChange(e, 'phone2')}
                                            maxLength={15}
                                            value={field.value || ''}
                                            className="pr-10"
                                        />
                                        {phone2Value && isWhatsApp(phone2Value) && (
                                            <a href={getWhatsAppUrl(phone2Value)} target="_blank" rel="noopener noreferrer" className="absolute right-3 text-green-500 hover:text-green-600">
                                                <WhatsAppIcon />
                                            </a>
                                        )}
                                    </div>
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
                        <FormItem>
                            <FormLabel>Data de Nascimento {age !== null && <span className="text-muted-foreground">({age} anos)</span>}</FormLabel>
                            <FormControl>
                                <Input 
                                    placeholder="dd/mm/aaaa" 
                                    {...field} 
                                    onChange={handleBirthDateChange} 
                                    maxLength={10} 
                                    className="w-[240px]"
                                />
                            </FormControl>
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
            
            {/* Benefícios */}
            <div>
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium">Benefícios INSS</h3>
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => append({ number: "", species: "" })}
                    >
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Adicionar Benefício
                    </Button>
                </div>
                <div className="space-y-4">
                {fields.map((field, index) => (
                    <div key={field.id} className="flex items-center gap-2 p-3 border rounded-md bg-secondary/30">
                        <FormField
                            control={form.control}
                            name={`benefits.${index}.number`}
                            render={({ field }) => (
                                <FormItem className="flex-1">
                                    <FormLabel className='text-xs'>Número do Benefício</FormLabel>
                                    <FormControl>
                                        <Input placeholder='000.000.000-0' {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name={`benefits.${index}.species`}
                            render={({ field }) => (
                                <FormItem className="flex-1">
                                    <FormLabel className='text-xs'>Espécie (Opcional)</FormLabel>
                                    <FormControl>
                                        <Input placeholder='Aposentadoria por Idade' {...field} value={field.value ?? ''} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="self-center mt-5"
                            onClick={() => remove(index)}
                        >
                            <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                    </div>
                ))}
                {fields.length === 0 && (
                    <div className="text-sm text-muted-foreground text-center py-4 border border-dashed rounded-md">
                        <p>Nenhum benefício adicionado.</p>
                    </div>
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
                                <Input placeholder="00000-000" {...field} onChange={handleCepChange} onBlur={handleCepBlur} maxLength={9} className="max-w-xs" value={field.value || ''} />
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
                                <Input placeholder="Rua das Flores" {...field} value={field.value || ''} />
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
                                <Input placeholder="123" {...field} value={field.value || ''} />
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
                                <Input placeholder="Apto 45" {...field} value={field.value || ''} />
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
                                <Input placeholder="Centro" {...field} value={field.value || ''} />
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
                                <Input placeholder="São Paulo" {...field} value={field.value || ''} />
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
                                <Input placeholder="SP" {...field} value={field.value || ''} />
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
                      value={field.value || ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </ScrollArea>
        <div className="flex justify-end pt-8">
          <Button type="submit" disabled={isSaving}>
            {isSaving ? (
                <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Salvando...
                </>
            ) : (
                'Salvar Cliente'
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}

    