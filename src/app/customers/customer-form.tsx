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
import { 
    PlusCircle, 
    Trash2, 
    UserCheck, 
    AlertTriangle, 
    Loader2,
    Mail,
    Phone as PhoneIcon,
    FolderLock,
    Calendar as CalendarIcon,
    Search
} from 'lucide-react';
import { format, parse, isValid, differenceInYears } from 'date-fns';
import { validateCPF, handlePhoneMask, cleanFirestoreData, cn, isWhatsApp, getWhatsAppUrl } from '@/lib/utils';
import type { Customer, Attachment } from '@/lib/types';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { useEffect, useState, useMemo } from 'react';
import { toast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { WhatsAppIcon } from '@/components/icons/whatsapp-icon';
import { CustomerAttachmentUploader } from '@/components/customers/customer-attachment-uploader';

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
    message: "CPF inválido.",
  }),
  gender: z.string().nullable().optional(),
  status: z.enum(['active', 'inactive']).default('active'),
  benefits: z.array(benefitSchema).optional(),
  phone: z.string().min(10, 'O telefone é obrigatório.'),
  phone2: z.string().nullable().optional(),
  email: z.string().email('E-mail inválido.').or(z.literal('')).nullable().optional(),
  birthDate: z.string().refine((date) => {
    try {
      if (!date) return false;
      const parsedDate = parse(date, 'dd/MM/yyyy', new Date());
      return isValid(parsedDate);
    } catch { return false; }
  }, { message: 'Data inválida.' }),
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

interface CustomerFormProps {
  customer?: Customer;
  allCustomers: Customer[];
  defaultValues?: any;
  onSubmit: (data: FormCustomer) => void;
  isSaving?: boolean;
}

export function CustomerForm({ customer, allCustomers, defaultValues, onSubmit, isSaving = false }: CustomerFormProps) {
  const [isFetchingCep, setIsFetchingCep] = useState(false);

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

  const watchPhone = form.watch('phone');
  const watchPhone2 = form.watch('phone2');
  const watchEmail = form.watch('email');
  const watchCpf = form.watch('cpf');
  const watchBirthDate = form.watch('birthDate');

  const customerAge = useMemo(() => {
    if (!watchBirthDate || watchBirthDate.length < 10) return null;
    try {
        const parsed = parse(watchBirthDate, 'dd/MM/yyyy', new Date());
        if (isValid(parsed)) return differenceInYears(new Date(), parsed);
    } catch { return null; }
    return null;
  }, [watchBirthDate]);

  const duplicity = useMemo(() => {
    const results = { phone: false, email: false, cpf: false };
    if (!allCustomers) return results;
    const currentId = customer?.id || defaultValues?.id;
    const cleanPhone = watchPhone?.replace(/\D/g, '');
    const cleanEmail = watchEmail?.trim().toLowerCase();
    const cleanCpf = watchCpf?.replace(/\D/g, '');

    allCustomers.forEach(c => {
        if (c.id === currentId) return;
        if (cleanPhone && c.phone?.replace(/\D/g, '') === cleanPhone) results.phone = true;
        if (cleanEmail && c.email?.trim().toLowerCase() === cleanEmail && cleanEmail !== '') results.email = true;
        if (cleanCpf && c.cpf?.replace(/\D/g, '') === cleanCpf) results.cpf = true;
    });
    return results;
  }, [allCustomers, watchPhone, watchEmail, watchCpf, customer?.id, defaultValues?.id]);

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
    }
  }, [customer, defaultValues, form]);

  const handleCepBlur = async (e: React.FocusEvent<HTMLInputElement>) => {
    const cep = e.target.value.replace(/\D/g, '');
    if (cep.length !== 8) return;
    
    setIsFetchingCep(true);
    try {
        const response = await fetch(`/api/cep/${cep}`);
        if (!response.ok) throw new Error('Falha');
        const data = await response.json();
        
        if (data && !data.erro) {
            form.setValue('street', data.logradouro || '', { shouldValidate: true });
            form.setValue('neighborhood', data.bairro || '', { shouldValidate: true });
            form.setValue('city', data.localidade || '', { shouldValidate: true });
            form.setValue('state', data.uf || '', { shouldValidate: true });
            toast({ title: "Endereço localizado!" });
        }
    } catch (error) {
        toast({ variant: 'destructive', title: 'Busca Indisponível', description: 'Preencha o endereço manualmente.' });
    } finally {
        setIsFetchingCep(false);
    }
  }

  const handleFormSubmit = (data: CustomerFormValues) => {
    if (duplicity.phone || duplicity.email || duplicity.cpf) {
        toast({ variant: 'destructive', title: 'Existem dados duplicados no sistema' });
        return;
    }
    const parsedDate = parse(data.birthDate, 'dd/MM/yyyy', new Date());
    const newCustomerData: FormCustomer = {
      ...data,
      birthDate: format(parsedDate, 'yyyy-MM-dd'),
      benefits: data.benefits || [],
      documents: data.documents || [],
      gender: (data.gender as any) || null 
    };
    onSubmit(cleanFirestoreData(newCustomerData));
  }

  const currentCustomerId = customer?.id || defaultValues?.id;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleFormSubmit)} className="py-2">
        <ScrollArea className="h-[75vh] pr-4">
          <div className="space-y-10">
            {/* SEÇÃO: DADOS PESSOAIS */}
            <div className="space-y-6 relative">
                <div className="flex items-center justify-between">
                    <h3 className="text-xl font-bold uppercase tracking-tight text-[#00AEEF]">
                        Dados Pessoais
                    </h3>
                    <FormField
                        control={form.control}
                        name="status"
                        render={({ field }) => (
                            <div className="w-32">
                                <Select onValueChange={field.onChange} value={field.value}>
                                    <FormControl>
                                        <SelectTrigger className={cn(
                                            "rounded-full h-9 font-black text-[10px] uppercase border-2 transition-all",
                                            field.value === 'active' ? "bg-green-50 border-green-200 text-green-600" : "bg-red-50 border-red-200 text-red-600"
                                        )}>
                                            <div className="flex items-center gap-2">
                                                <UserCheck className="h-3 w-3" />
                                                <SelectValue />
                                            </div>
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="active">Ativo</SelectItem>
                                        <SelectItem value="inactive">Inativo</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        )}
                    />
                </div>

                <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel className="text-xs font-medium text-muted-foreground">Nome Completo</FormLabel>
                        <FormControl><Input placeholder="João da Silva" {...field} className="rounded-full h-11 px-5 border-zinc-200 focus-visible:ring-[#00AEEF]" /></FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />

                <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                    <FormField
                        control={form.control}
                        name="cpf"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel className="text-xs font-medium text-muted-foreground">CPF</FormLabel>
                            <FormControl>
                                <div className="relative">
                                    <Input 
                                        placeholder="000.000.000-00" 
                                        {...field} 
                                        onChange={(e) => field.onChange(e.target.value.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4"))} 
                                        maxLength={14}
                                        className={cn("rounded-full h-11 px-5 border-zinc-200", duplicity.cpf && "border-red-500 bg-red-50 text-red-900")}
                                    />
                                    {duplicity.cpf && <AlertTriangle className="absolute right-4 top-3 h-5 w-5 text-red-500 animate-pulse" />}
                                </div>
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                      control={form.control}
                      name="gender"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs font-medium text-muted-foreground">Gênero</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value || ""}>
                            <FormControl><SelectTrigger className="rounded-full h-11 px-5 border-zinc-200"><SelectValue placeholder="Selecione o gênero" /></SelectTrigger></FormControl>
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

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel className="text-xs font-medium text-muted-foreground">Email</FormLabel>
                            <FormControl>
                                <div className="relative">
                                    <Mail className="absolute left-4 top-3.5 h-4 w-4 text-muted-foreground/40" />
                                    <Input placeholder="seu@exemplo.com" {...field} className={cn("rounded-full h-11 pl-11 border-zinc-200", duplicity.email && "border-red-500 bg-red-50")} />
                                </div>
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
                            <FormLabel className="text-xs font-medium text-muted-foreground">Telefone Principal</FormLabel>
                            <FormControl>
                                <div className="relative">
                                    <Input placeholder="(11) 98765-4321" {...field} className={cn("rounded-full h-11 px-5 border-zinc-200", duplicity.phone && "border-red-500 bg-red-50")} onChange={(e) => field.onChange(handlePhoneMask(e.target.value))} maxLength={15} />
                                    {isWhatsApp(watchPhone) && (
                                        <a href={getWhatsAppUrl(watchPhone)} target="_blank" rel="noopener noreferrer" className="absolute right-4 top-3.5 hover:scale-110 transition-transform">
                                            <WhatsAppIcon className="h-4 w-4" />
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
                            <FormLabel className="text-xs font-medium text-muted-foreground">Telefone 2</FormLabel>
                            <FormControl>
                                <div className="relative">
                                    <Input placeholder="(11) 98765-4321" {...field} value={field.value ?? ''} onChange={(e) => field.onChange(handlePhoneMask(e.target.value))} maxLength={15} className="rounded-full h-11 px-5 border-zinc-200"/>
                                    {isWhatsApp(watchPhone2 || '') && (
                                        <a href={getWhatsAppUrl(watchPhone2!)} target="_blank" rel="noopener noreferrer" className="absolute right-4 top-3.5 hover:scale-110 transition-transform">
                                            <WhatsAppIcon className="h-4 w-4" />
                                        </a>
                                    )}
                                </div>
                            </FormControl>
                            </FormItem>
                        )}
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <FormField
                        control={form.control}
                        name="birthDate"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel className="text-xs font-medium text-muted-foreground flex items-center justify-between">
                                Data de Nascimento
                                {customerAge !== null && (
                                    <Badge variant="outline" className={cn(
                                        "h-5 text-[9px] font-black uppercase border-2",
                                        customerAge >= 74 ? "bg-red-50 text-red-600 border-red-200" : "bg-blue-50 text-blue-600 border-blue-200"
                                    )}>
                                        {customerAge} ANOS
                                    </Badge>
                                )}
                            </FormLabel>
                            <FormControl>
                                <Input 
                                    placeholder="dd/mm/aaaa" 
                                    {...field} 
                                    className="rounded-full h-11 px-5 border-zinc-200" 
                                    maxLength={10} 
                                    onChange={(e) => {
                                        let v = e.target.value.replace(/\D/g, "").substring(0, 8);
                                        if (v.length > 4) v = v.replace(/(\d{2})(\d{2})(\d)/, "$1/$2/$3");
                                        else if (v.length > 2) v = v.replace(/(\d{2})(\d)/, "$1/$2");
                                        field.onChange(v);
                                    }}
                                />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>
            </div>

            <div className="h-px bg-zinc-100" />

            {/* SEÇÃO: BENEFÍCIOS */}
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <h3 className="text-xl font-bold uppercase tracking-tight text-[#00AEEF]">
                        Benefícios INSS
                    </h3>
                    <Button type="button" variant="outline" size="sm" onClick={() => append({ number: '', species: '' })} className="rounded-full h-9 px-5 border-[#00AEEF]/30 hover:bg-[#00AEEF]/5 text-[#00AEEF] font-bold">
                        <PlusCircle className="h-4 w-4 mr-2" /> Adicionar NB
                    </Button>
                </div>
                <div className="space-y-4">
                    {fields.map((field, index) => (
                        <div key={field.id} className="flex gap-4 items-end animate-in fade-in slide-in-from-left-2">
                            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name={`benefits.${index}.number`}
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-[10px] font-bold uppercase opacity-40">Número do Benefício</FormLabel>
                                            <FormControl><Input placeholder="000.000.000-0" {...field} className="rounded-full h-10 border-zinc-200 font-mono" /></FormControl>
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name={`benefits.${index}.species`}
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-[10px] font-bold uppercase opacity-40">Espécie / Tipo</FormLabel>
                                            <FormControl><Input placeholder="Aposentadoria Idade" {...field} value={field.value ?? ''} className="rounded-full h-10 border-zinc-200" /></FormControl>
                                        </FormItem>
                                    )}
                                />
                            </div>
                            <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} className="text-red-400 h-10 w-10 hover:bg-red-50 rounded-full">
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>
                    ))}
                </div>
            </div>

            <div className="h-px bg-zinc-100" />

            {/* SEÇÃO: ENDEREÇO */}
            <div className="space-y-6">
                <h3 className="text-xl font-bold uppercase tracking-tight text-[#00AEEF]">Endereço Completo</h3>
                <div className='grid grid-cols-1 md:grid-cols-4 gap-6'>
                    <FormField
                        control={form.control}
                        name="cep"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel className="text-xs font-medium text-muted-foreground">CEP</FormLabel>
                            <FormControl>
                                <div className='relative'>
                                    <Input placeholder="00000-000" {...field} value={field.value ?? ''} onBlur={handleCepBlur} maxLength={9} className="rounded-full h-11 px-5 border-zinc-200 focus-visible:ring-[#00AEEF]" />
                                    {isFetchingCep && <Loader2 className="absolute right-4 top-3.5 h-4 w-4 animate-spin text-[#00AEEF]" />}
                                </div>
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                    <div className="md:col-span-2">
                        <FormField control={form.control} name="street" render={({ field }) => (
                            <FormItem><FormLabel className="text-xs font-medium text-muted-foreground">Logradouro</FormLabel><FormControl><Input placeholder="Rua / Avenida" {...field} value={field.value ?? ''} className="rounded-full h-11 px-5 border-zinc-200" /></FormControl></FormItem>
                        )} />
                    </div>
                    <FormField control={form.control} name="number" render={({ field }) => (
                        <FormItem><FormLabel className="text-xs font-medium text-muted-foreground">Número</FormLabel><FormControl><Input placeholder="123" {...field} value={field.value ?? ''} className="rounded-full h-11 px-5 border-zinc-200" /></FormControl></FormItem>
                    )} />
                </div>
                <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
                    <FormField control={form.control} name="neighborhood" render={({ field }) => (
                        <FormItem><FormLabel className="text-xs font-medium text-muted-foreground">Bairro</FormLabel><FormControl><Input placeholder="Bairro" {...field} value={field.value ?? ''} className="rounded-full h-11 px-5 border-zinc-200" /></FormControl></FormItem>
                    )} />
                    <FormField control={form.control} name="city" render={({ field }) => (
                        <FormItem><FormLabel className="text-xs font-medium text-muted-foreground">Cidade</FormLabel><FormControl><Input placeholder="Cidade" {...field} value={field.value ?? ''} className="rounded-full h-11 px-5 border-zinc-200" /></FormControl></FormItem>
                    )} />
                    <FormField control={form.control} name="state" render={({ field }) => (
                        <FormItem><FormLabel className="text-xs font-medium text-muted-foreground">UF</FormLabel><FormControl><Input placeholder="SP" {...field} value={field.value ?? ''} className="rounded-full h-11 px-5 border-zinc-200 uppercase" maxLength={2} /></FormControl></FormItem>
                    )} />
                </div>
            </div>

            <div className="h-px bg-zinc-100" />

            {/* SEÇÃO: ANEXOS (DOCUMENTOS FIXOS) */}
            <div className="space-y-6">
                <h3 className="text-xl font-bold uppercase tracking-tight text-[#00AEEF] flex items-center gap-2">
                    <FolderLock className="h-5 w-5" /> Central de Documentos Fixos
                </h3>
                <CustomerAttachmentUploader 
                    userId={customer?.ownerId || 'system'} 
                    customerId={currentCustomerId || 'new'} 
                    initialAttachments={form.getValues('documents') || []} 
                    onAttachmentsChange={(docs) => form.setValue('documents', docs, { shouldValidate: true })}
                    isReadOnly={false}
                />
            </div>

            {/* SEÇÃO: OBSERVAÇÕES */}
            <div className="space-y-4 pb-10">
                <h3 className="text-xl font-bold uppercase tracking-tight text-[#00AEEF]">Observações Estratégicas</h3>
                <FormField
                    control={form.control}
                    name="observations"
                    render={({ field }) => (
                        <FormItem>
                        <FormControl>
                            <Textarea 
                                placeholder="Anotações internas sobre o perfil do cliente..." 
                                {...field} 
                                value={field.value ?? ''} 
                                className="min-h-[100px] rounded-2xl border-zinc-200 bg-muted/5 p-5 focus-visible:ring-[#00AEEF]"
                            />
                        </FormControl>
                        </FormItem>
                    )}
                />
            </div>
          </div>
        </ScrollArea>
        
        <div className="flex justify-end pt-6 border-t mt-4 bg-white">
            <Button 
                type="submit" 
                disabled={isSaving || duplicity.phone || duplicity.email || duplicity.cpf} 
                className="rounded-full px-12 h-12 font-bold text-white bg-[#00AEEF] hover:bg-[#0096D1] shadow-lg shadow-[#00AEEF]/20 transition-all border-none"
            >
                {isSaving ? (
                    <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Salvando...</>
                ) : (
                    'Salvar Cadastro'
                )}
            </Button>
        </div>
      </form>
    </Form>
  );
}