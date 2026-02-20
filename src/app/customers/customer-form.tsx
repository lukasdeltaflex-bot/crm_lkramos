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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Sparkles, Loader2, PlusCircle, Trash2, FileText as FileIcon, UserCheck, UserX, FolderLock } from 'lucide-react';
import { format, parse, isValid } from 'date-fns';
import { cn, getAge, validateCPF } from '@/lib/utils';
import type { Customer, Attachment } from '@/lib/types';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { useEffect, useState, useMemo } from 'react';
import { summarizeNotes } from '@/ai/flows/summarize-notes-flow';
import { toast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';
import { isWhatsApp, handlePhoneMask } from '@/lib/utils';
import { WhatsAppIcon } from '@/components/icons/whatsapp-icon';
import { CustomerAttachmentUploader } from '@/components/customers/customer-attachment-uploader';
import { useUser, useFirestore } from '@/firebase';
import { doc, collection } from 'firebase/firestore';
import { useTheme } from '@/components/theme-provider';

const benefitSchema = z.object({
    number: z.string().min(1, "O número do benefício é obrigatório."),
    species: z.string().nullable().optional(),
});

const attachmentSchema = z.object({
  name: z.string(),
  url: z.string(),
  type: z.string(),
  size: z.number(),
});

const customerSchema = z.object({
  name: z.string().min(3, 'O nome deve ter pelo menos 3 caracteres.'),
  cpf: z.string().min(11, 'CPF incompleto.').refine((val) => validateCPF(val), {
    message: "CPF inválido. Verifique se há erro de digitação.",
  }),
  gender: z.string().optional().nullable(),
  status: z.enum(['active', 'inactive']).default('active'),
  benefits: z.array(benefitSchema).optional(),
  phone: z.string().min(10, 'O telefone é obrigatório.'),
  phone2: z.string().nullable().optional(),
  email: z.string().email('O email é inválido.').or(z.literal('')).nullable().optional(),
  birthDate: z.string().refine((date) => {
    try {
      if (!date) return false;
      const parsedDate = parse(date, 'dd/MM/yyyy', new Date());
      return isValid(parsedDate);
    } catch {
      return false;
    }
  }, { message: 'Data inválida. Use o formato dd/mm/aaaa.' }),
  observations: z.string().nullable().optional(),
  cep: z.string().nullable().optional(),
  street: z.string().nullable().optional(),
  number: z.string().nullable().optional(),
  complement: z.string().nullable().optional(),
  neighborhood: z.string().nullable().optional(),
  city: z.string().nullable().optional(),
  state: z.string().nullable().optional(),
  documents: z.array(attachmentSchema).optional(),
});

type CustomerFormValues = z.infer<typeof customerSchema>;
type FormCustomer = Omit<Customer, 'id' | 'ownerId' | 'numericId'>;
type CustomerFormData = Partial<Omit<Customer, 'id' | 'ownerId'>>;

interface CustomerFormProps {
  customer?: Customer;
  allCustomers: Customer[];
  defaultValues?: CustomerFormData;
  onSubmit: (data: FormCustomer) => void;
  isSaving?: boolean;
}

export function CustomerForm({ customer, allCustomers, defaultValues, onSubmit, isSaving = false }: CustomerFormProps) {
  const { user } = useUser();
  const firestore = useFirestore();
  const { statusColors } = useTheme();
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [isFetchingCep, setIsFetchingCep] = useState(false);
  const [age, setAge] = useState<number | null>(null);
  const [tempCustomerId, setTempCustomerId] = useState<string | undefined>(undefined);

  const form = useForm<CustomerFormValues>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      name: '',
      cpf: '',
      gender: '',
      status: 'active',
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
      documents: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "benefits"
  });

  // 🛡️ BLINDAGEM NUCLEAR: Sincronização atômica e forçada do formulário
  useEffect(() => {
    const source = customer || defaultValues;
    if (source) {
      let formattedBirthDate = '';
      if (source.birthDate) {
          try {
              const date = source.birthDate.includes('-') 
                ? parse(source.birthDate, 'yyyy-MM-dd', new Date())
                : parse(source.birthDate, 'dd/MM/yyyy', new Date());
              if (isValid(date)) formattedBirthDate = format(date, 'dd/MM/yyyy');
          } catch (e) {}
      }
      
      form.reset({
        name: source.name || '',
        cpf: source.cpf || '',
        gender: source.gender || '',
        status: source.status || 'active',
        benefits: source.benefits || [],
        phone: source.phone || '',
        phone2: source.phone2 || '',
        email: source.email || '',
        birthDate: formattedBirthDate,
        observations: source.observations || '',
        cep: source.cep || '',
        street: source.street || '',
        number: source.number || '',
        complement: source.complement || '',
        neighborhood: source.neighborhood || '',
        city: source.city || '',
        state: source.state || '',
        documents: source.documents || [],
      });

      // Trava de segurança extra para garantir o Gênero
      if (source.gender) {
          setTimeout(() => {
            form.setValue('gender', source.gender, { shouldValidate: true, shouldDirty: true });
          }, 10);
      }
    }
  }, [customer, defaultValues, form]);

  useEffect(() => {
    if (firestore && !customer?.id && !tempCustomerId) {
        setTempCustomerId(doc(collection(firestore, 'customers')).id);
    }
  }, [firestore, customer, tempCustomerId]);

  const cpfValue = form.watch('cpf');
  const birthDateValue = form.watch('birthDate');
  const phone1Value = form.watch('phone');
  const currentStatusValue = form.watch('status');

  const duplicateCpfCustomer = useMemo(() => {
    if (!cpfValue || cpfValue.length < 14) return null;
    return allCustomers.find(c => c.cpf === cpfValue && c.id !== customer?.id);
  }, [cpfValue, allCustomers, customer]);

  useEffect(() => {
    if (birthDateValue && birthDateValue.length === 10) {
      try {
        const parsedDate = parse(birthDateValue, 'dd/MM/yyyy', new Date());
        if (isValid(parsedDate)) {
          const formattedForUtil = format(parsedDate, 'yyyy-MM-dd');
          setAge(getAge(formattedForUtil));
        }
      } catch {
        setAge(null);
      }
    } else {
      setAge(null);
    }
  }, [birthDateValue]);

  const handleAiSummarize = async () => {
    const notes = form.getValues('observations');
    if (!notes || notes.length < 10) {
        toast({ variant: 'destructive', title: 'Notas insuficientes', description: 'Escreva um pouco mais para a IA resumir.' });
        return;
    }
    setIsSummarizing(true);
    try {
        const summary = await summarizeNotes(notes);
        form.setValue('observations', summary, { shouldValidate: true });
        toast({ title: 'Resumo Gerado!', description: 'As anotações foram otimizadas pela IA.' });
    } catch (e) {
        toast({ variant: 'destructive', title: 'Erro na IA' });
    } finally {
        setIsSummarizing(false);
    }
  };

  function handleFormSubmit(data: CustomerFormValues) {
    if (duplicateCpfCustomer) {
        toast({ variant: 'destructive', title: 'CPF Duplicado' });
        return;
    }

    const parsedDate = parse(data.birthDate, 'dd/MM/yyyy', new Date());
    if (!isValid(parsedDate)) {
        toast({ variant: 'destructive', title: 'Data de Nascimento inválida' });
        return;
    }

    const newCustomerData: FormCustomer = {
      ...data,
      birthDate: format(parsedDate, 'yyyy-MM-dd'),
      benefits: data.benefits || [],
      documents: data.documents || [],
      gender: data.gender as any || null 
    };
    onSubmit(newCustomerData);
  }
  
  const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, "");
    if (value.length > 11) value = value.substring(0, 11);
    value = value.replace(/(\d{3})(\d)/, "$1.$2");
    value = value.replace(/(\d{3})(\d)/, "$1.$2");
    value = value.replace(/(\d{3})(\d{1,2})$/, "$1-$2");
    form.setValue('cpf', value, { shouldValidate: true });
  };
  
  const handleBirthDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, "");
    if (value.length > 8) value = value.substring(0, 8);
    value = value.replace(/(\d{2})(\d)/, '$1/$2');
    value = value.replace(/(\d{2})(\d)/, '$1/$2');
    form.setValue('birthDate', value, { shouldValidate: true });
  };

  const handleCepBlur = async (e: React.FocusEvent<HTMLInputElement>) => {
    const cep = e.target.value.replace(/\D/g, '');
    if (cep.length !== 8) return;
    setIsFetchingCep(true);
    try {
        const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
        const data = await response.json();
        if (!data.erro) {
            form.setValue('street', data.logradouro);
            form.setValue('neighborhood', data.bairro);
            form.setValue('city', data.localidade);
            form.setValue('state', data.uf);
            form.setFocus('number');
        }
    } catch (error) {
        toast({ variant: 'destructive', title: 'Erro ao buscar CEP' });
    } finally {
        setIsFetchingCep(false);
    }
  }

  const handleAttachmentsChange = (docs: Attachment[]) => {
    form.setValue('documents', docs, { shouldValidate: true });
  };

  const statusColor = currentStatusValue === 'active' 
    ? (statusColors['ATIVO'] || '142 76% 36%') 
    : (statusColors['INATIVO'] || '240 5% 65%');

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleFormSubmit)} className="py-4">
        <ScrollArea className="h-[75vh] pr-4">
          <div className="space-y-8">
            <div className='space-y-4'>
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-black uppercase tracking-widest text-primary/60">Dados Pessoais</h3>
                    <FormField
                      control={form.control}
                      name="status"
                      render={({ field }) => (
                        <FormItem className="w-40">
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger 
                                className="h-9 text-[10px] font-black uppercase tracking-widest border-2 status-custom rounded-full transition-all shadow-sm"
                                style={{ '--status-color': statusColor } as any}
                              >
                                <div className="flex items-center gap-2">
                                    {field.value === 'active' ? <UserCheck className="h-3.5 w-3.5" /> : <UserX className="h-3.5 w-3.5" />}
                                    <SelectValue placeholder="Status" />
                                </div>
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="active" className="text-[10px] font-black uppercase">Ativo</SelectItem>
                              <SelectItem value="inactive" className="text-[10px] font-black uppercase">Inativo</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormItem>
                      )}
                    />
                </div>
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
                        {duplicateCpfCustomer && (
                            <p className="text-xs text-destructive font-bold">CPF já cadastrado para: {duplicateCpfCustomer.name}</p>
                        )}
                        </FormItem>
                    )}
                    />
                    <FormField
                      control={form.control}
                      name="gender"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Gênero</FormLabel>
                          <Select 
                            key={customer?.id || 'new-customer-select'} 
                            onValueChange={field.onChange} 
                            value={field.value || ""}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione o gênero" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Masculino">Masculino</SelectItem>
                              <SelectItem value="Feminino">Feminino</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                </div>
                <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                    <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                            <Input placeholder="seu@exemplo.com" {...field} value={field.value ?? ''}/>
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
                                <FormLabel>Telefone Principal</FormLabel>
                                <FormControl>
                                    <div className="relative">
                                        <Input
                                            placeholder="(11) 98765-4321"
                                            {...field}
                                            onChange={(e) => form.setValue('phone', handlePhoneMask(e.target.value), { shouldValidate: true })}
                                            maxLength={15}
                                        />
                                        {isWhatsApp(phone1Value) && (
                                            <WhatsAppIcon className="absolute right-3 top-2.5" />
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
                                <FormLabel>Telefone 2</FormLabel>
                                <FormControl>
                                    <Input
                                        placeholder="(11) 98765-4321"
                                        {...field}
                                        value={field.value || ''}
                                        onChange={(e) => form.setValue('phone2', handlePhoneMask(e.target.value), { shouldValidate: true })}
                                        maxLength={15}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>
                <FormField
                    control={form.control}
                    name="birthDate"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Data de Nascimento {age !== null && <span className="text-muted-foreground">({age} anos)</span>}</FormLabel>
                        <FormControl>
                            <Input placeholder="dd/mm/aaaa" {...field} onChange={handleBirthDateChange} maxLength={10} className="w-[240px]"/>
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
            </div>

            <Separator />
            
            <div>
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-black uppercase tracking-widest text-primary/60">Benefícios INSS</h3>
                    <Button type="button" variant="outline" size="sm" onClick={() => append({ number: "", species: "" })}>
                        <PlusCircle className="mr-2 h-4 w-4" /> Adicionar
                    </Button>
                </div>
                <div className="space-y-4">
                {fields.map((field, index) => (
                    <div key={field.id} className="flex items-start gap-2 p-3 border rounded-md bg-secondary/30">
                        <FormField
                            control={form.control}
                            name={`benefits.${index}.number`}
                            render={({ field }) => (
                                <FormItem className="flex-1">
                                    <FormLabel className='text-xs'>Número do Benefício</FormLabel>
                                    <FormControl><Input placeholder='000.000.000-0' {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name={`benefits.${index}.species`}
                            render={({ field }) => (
                                <FormItem className="flex-1">
                                    <FormLabel className='text-xs'>Espécie / Nome</FormLabel>
                                    <FormControl><Input placeholder='Ex: Aposentadoria...' {...field} value={field.value || ''} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <Button type="button" variant="ghost" size="icon" className="self-end mb-1" onClick={() => remove(index)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                    </div>
                ))}
                </div>
            </div>

            <Separator />

            <div className='space-y-4'>
                <h3 className="text-lg font-black uppercase tracking-widest text-primary/60">Endereço Completo</h3>
                <FormField
                    control={form.control}
                    name="cep"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>CEP</FormLabel>
                        <FormControl>
                            <div className='relative max-w-[240px]'>
                                <Input placeholder="00000-000" {...field} onBlur={handleCepBlur} maxLength={9} value={field.value || ''} onChange={(e) => {
                                    let v = e.target.value.replace(/\D/g, "").substring(0, 8);
                                    if (v.length > 5) v = v.replace(/(\d{5})(\d)/, "$1-$2");
                                    form.setValue('cep', v, { shouldValidate: true });
                                }} />
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
                            <FormControl><Input placeholder="Rua das Flores" {...field} value={field.value || ''} /></FormControl>
                            </FormItem>
                        )}
                    />
                     <FormField
                        control={form.control}
                        name="number"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Número</FormLabel>
                            <FormControl><Input placeholder="123" {...field} value={field.value || ''} /></FormControl>
                            </FormItem>
                        )}
                    />
                </div>
                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                    <FormField
                        control={form.control}
                        name="complement"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Complemento</FormLabel>
                            <FormControl><Input placeholder="Apto 45" {...field} value={field.value || ''} /></FormControl>
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="neighborhood"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Bairro</FormLabel>
                            <FormControl><Input placeholder="Centro" {...field} value={field.value || ''} /></FormControl>
                            </FormItem>
                        )}
                    />
                </div>
                <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                    <FormField
                        control={form.control}
                        name="city"
                        render={({ field }) => (
                            <FormItem className='col-span-2'>
                            <FormLabel>Cidade</FormLabel>
                            <FormControl><Input placeholder="Sua Cidade" {...field} value={field.value || ''} /></FormControl>
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="state"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Estado (UF)</FormLabel>
                            <FormControl><Input placeholder="UF" {...field} value={field.value || ''} maxLength={2} className="uppercase" /></FormControl>
                            </FormItem>
                        )}
                    />
                </div>
            </div>

            <Separator />

            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-black uppercase tracking-widest text-primary/60">Observações</h3>
                    <Button 
                        type="button" 
                        variant="ghost" 
                        size="sm" 
                        className="text-primary hover:bg-primary/5 font-bold gap-2"
                        onClick={handleAiSummarize}
                        disabled={isSummarizing}
                    >
                        {isSummarizing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                        Resumir com IA
                    </Button>
                </div>
                <FormField
                    control={form.control}
                    name="observations"
                    render={({ field }) => (
                        <FormItem>
                            <FormControl>
                                <Textarea 
                                    placeholder="Anotações sobre o cliente..." 
                                    className="min-h-[120px] resize-none" 
                                    {...field} 
                                    value={field.value || ''} 
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
            </div>

            <Separator />

            <div className="space-y-4">
                <div className="flex items-center gap-2">
                    <FileIcon className="h-5 w-5 text-primary" />
                    <h3 className="text-lg font-black uppercase tracking-widest text-primary/60">Central de Documentos Fixos</h3>
                </div>
                <CustomerAttachmentUploader 
                    userId={user?.uid || ''}
                    customerId={customer?.id || tempCustomerId || ''}
                    initialAttachments={form.getValues('documents') || []}
                    onAttachmentsChange={handleAttachmentsChange}
                    isReadOnly={isSaving}
                />
                <p className="text-[10px] text-muted-foreground font-medium leading-relaxed">
                    Arquivos como RG, CPF e Comprovante de Residência salvos aqui estarão disponíveis em todas as futuras propostas deste cliente.
                </p>
            </div>
          </div>
        </ScrollArea>
        <div className="flex justify-end pt-8">
            <Button type="submit" disabled={isSaving || !!duplicateCpfCustomer} className="rounded-full px-10 font-bold bg-[#00AEEF] hover:bg-[#0096D1] h-12 shadow-lg shadow-[#00AEEF]/20">
                {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Salvar Cliente
            </Button>
        </div>
      </form>
    </Form>
  );
}