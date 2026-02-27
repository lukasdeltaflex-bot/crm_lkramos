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
    Loader2,
    AlertCircle,
    CheckCircle2,
    Sparkles,
    MessageSquareText,
    FolderLock,
    AlertTriangle,
    User,
    FileText,
    UserRound,
    Mail,
    Phone,
    Calendar,
    CreditCard,
    MapPin,
    Home,
    Map,
    Hash,
    CircleDollarSign,
    Tag,
    X,
    Info,
    CreditCard as CardIcon
} from 'lucide-react';
import { format, parse, isValid, differenceInYears } from 'date-fns';
import { validateCPF, handlePhoneMask, cn, isWhatsApp, getWhatsAppUrl, cleanBankName } from '@/lib/utils';
import type { Customer, UserSettings } from '@/lib/types';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { useEffect, useState, useMemo, useCallback } from 'react';
import { toast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { WhatsAppIcon } from '@/components/icons/whatsapp-icon';
import { CustomerAttachmentUploader } from '@/components/customers/customer-attachment-uploader';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { summarizeNotes } from '@/ai/flows/summarize-notes-flow';
import { useUser } from '@/firebase';
import { BankIcon } from '@/components/bank-icon';
import * as configData from '@/lib/config-data';

const benefitSchema = z.object({
    number: z.string().min(1, "O Nº do benefício é obrigatório."),
    species: z.string().nullable().optional(),
    salary: z.coerce.number().min(0, "Valor inválido.").optional(),
    rmcBank: z.string().optional(),
    rccBank: z.string().optional(),
});

const attachmentSchema = z.object({
  name: z.string(),
  url: z.string(),
  type: z.string(),
  size: z.number(),
});

const customerSchema = z.object({
  name: z.string().min(3, 'O nome é obrigatório (mín. 3 letras).'),
  cpf: z.string().min(11, 'CPF obrigatório.').refine((val) => validateCPF(val), {
    message: "CPF Inválido - Verifique os dígitos.",
  }),
  gender: z.string().default(""),
  status: z.enum(['active', 'inactive']).default('active'),
  benefits: z.array(benefitSchema).optional(),
  tags: z.array(z.string()).optional(),
  phone: z.string().min(10, 'O telefone principal é obrigatório.'),
  phone2: z.string().nullable().optional(),
  email: z.string().email('E-mail inválido.').or(z.literal('')).nullable().optional(),
  birthDate: z.string().refine((date) => {
    try {
      if (!date) return false;
      const parsedDate = date.includes('-') 
        ? parse(date, 'yyyy-MM-dd', new Date())
        : parse(date, 'dd/MM/yyyy', new Date());
      return isValid(parsedDate);
    } catch { return false; }
  }, { message: 'Data de nascimento obrigatória/inválida.' }),
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
  userSettings?: UserSettings | null;
  defaultValues?: any;
  onSubmit: (data: FormCustomer) => void;
  isSaving?: boolean;
}

export function CustomerForm({ customer, allCustomers, userSettings, defaultValues, onSubmit, isSaving = false }: CustomerFormProps) {
  const { user } = useUser();
  const [isFetchingCep, setIsFetchingCep] = useState(false);
  const [isSummarizing, setIsSummarizing] = useState(false);

  const banks = userSettings?.banks || configData.banks;
  const availableTags = userSettings?.customerTags || configData.defaultCustomerTags;
  const showLogos = userSettings?.showBankLogos ?? true;

  const initialValues = useMemo(() => {
    const source = customer || defaultValues;
    let formattedBirthDate = '';
    
    if (source?.birthDate) {
        try {
            const date = source.birthDate.includes('-') 
              ? parse(source.birthDate, 'yyyy-MM-dd', new Date())
              : parse(source.birthDate, 'dd/MM/yyyy', new Date());
            if (isValid(date)) formattedBirthDate = format(date, 'dd/MM/yyyy');
        } catch (e) {}
    }

    return {
      name: source?.name || '',
      cpf: source?.cpf || '',
      gender: source?.gender || '',
      status: source?.status || 'active',
      benefits: source?.benefits || [],
      tags: source?.tags || [],
      phone: source?.phone || '',
      phone2: source?.phone2 || '',
      email: source?.email || '',
      birthDate: formattedBirthDate,
      observations: source?.observations || '',
      cep: source?.cep || '',
      street: source?.street || '',
      number: source?.number || '',
      complement: source?.complement || '',
      neighborhood: source?.neighborhood || '',
      city: source?.city || '',
      state: source?.state || '',
      documents: source?.documents || [],
    };
  }, [customer, defaultValues]);

  const form = useForm<CustomerFormValues>({
    resolver: zodResolver(customerSchema),
    mode: 'all',
    defaultValues: initialValues,
  });

  const { fields: benefitFields, append: appendBenefit, remove: removeBenefit } = useFieldArray({
    control: form.control,
    name: "benefits"
  });

  const watchPhone = form.watch('phone');
  const watchCpf = form.watch('cpf');
  const watchBirthDate = form.watch('birthDate');
  const watchObservations = form.watch('observations');
  const watchCep = form.watch('cep');
  const watchTags = form.watch('tags') || [];

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
    const cleanCpf = watchCpf?.replace(/\D/g, '');

    allCustomers.forEach(c => {
        if (c.id === currentId) return;
        if (cleanPhone && c.phone?.replace(/\D/g, '') === cleanPhone) results.phone = true;
        if (cleanCpf && c.cpf?.replace(/\D/g, '') === cleanCpf) results.cpf = true;
    });
    return results;
  }, [allCustomers, watchPhone, watchCpf, customer?.id, defaultValues?.id]);

  useEffect(() => {
    if (duplicity.cpf && watchCpf.length === 14) {
        toast({
            variant: 'destructive',
            title: '⚠️ CPF JÁ CADASTRADO',
            description: 'Este documento já existe no sistema. Localize o cliente pela busca para evitar duplicidade.'
        });
    }
  }, [duplicity.cpf, watchCpf]);

  const handleCepLookup = useCallback(async (cleanCep: string) => {
    if (cleanCep.length !== 8) return;
    
    setIsFetchingCep(true);
    try {
        const response = await fetch(`/api/cep/${cleanCep}`);
        if (!response.ok) throw new Error('Falha no proxy');
        const data = await response.json();
        
        if (data && !data.erro) {
            form.setValue('street', data.logradouro || '', { shouldValidate: true, shouldDirty: true });
            form.setValue('neighborhood', data.bairro || '', { shouldValidate: true, shouldDirty: true });
            form.setValue('city', data.localidade || '', { shouldValidate: true, shouldDirty: true });
            form.setValue('state', data.uf || '', { shouldValidate: true, shouldDirty: true });
            toast({ title: "Endereço localizado!" });
        }
    } catch (error) {
        console.warn("Busca automática de CEP indisponível.");
    } finally {
        setIsFetchingCep(false);
    }
  }, [form]);

  useEffect(() => {
    const cleanCep = (watchCep || '').replace(/\D/g, '');
    const isActuallyChanging = form.formState.dirtyFields.cep;
    
    if (cleanCep.length === 8 && isActuallyChanging) {
        handleCepLookup(cleanCep);
    }
  }, [watchCep, handleCepLookup, form.formState.dirtyFields.cep]);

  const handleSummarize = async () => {
    if (!watchObservations || watchObservations.trim().length < 10) {
        toast({ variant: 'destructive', title: 'Texto muito curto', description: 'Escreva mais um pouco para a IA resumir.' });
        return;
    }
    setIsSummarizing(true);
    try {
        const summary = await summarizeNotes(watchObservations);
        form.setValue('observations', summary, { shouldValidate: true });
        toast({ title: 'Resumo concluído com IA!' });
    } catch (e) {
        toast({ variant: 'destructive', title: 'Erro na IA' });
    } finally {
        setIsSummarizing(false);
    }
  };

  const handleTagToggle = (tag: string) => {
    const currentTags = form.getValues('tags') || [];
    if (currentTags.includes(tag)) {
        form.setValue('tags', currentTags.filter(t => t !== tag), { shouldDirty: true });
    } else {
        form.setValue('tags', [...currentTags, tag], { shouldDirty: true });
    }
  };

  const handleFormSubmit = (data: CustomerFormValues) => {
    if (duplicity.phone || duplicity.cpf) {
        toast({ variant: 'destructive', title: 'Dados duplicados detectados', description: 'Corrija campos em vermelho.' });
        return;
    }
    const parsedBirthDate = parse(data.birthDate, 'dd/MM/yyyy', new Date());
    const newCustomerData: FormCustomer = {
      ...data,
      gender: data.gender as any,
      birthDate: format(parsedBirthDate, 'yyyy-MM-dd'),
      benefits: data.benefits || [],
      tags: data.tags || [],
      documents: data.documents || [],
    };
    onSubmit(newCustomerData);
  }

  const currentCustomerId = customer?.id || defaultValues?.id;
  const errors = form.formState.errors;
  const hasErrors = Object.keys(errors).length > 0;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleFormSubmit)} className="py-2">
        <ScrollArea className="h-[75vh] pr-4">
          <div className="space-y-10">
            {(hasErrors || duplicity.cpf || duplicity.phone) && (
                <Alert variant="destructive" className="rounded-2xl border-2 bg-red-50 border-red-500">
                    <AlertCircle className="h-5 w-5 text-red-600" />
                    <AlertTitle className="font-black uppercase text-sm tracking-widest text-red-700">Atenção: Correção Necessária</AlertTitle>
                    <AlertDescription className="text-xs font-bold text-red-600 space-y-1 mt-2">
                        {errors.name && <p>• O Nome Completo é obrigatório.</p>}
                        {errors.cpf && <p>• {errors.cpf.message}</p>}
                        {duplicity.cpf && <p className="animate-bounce">• ESTE CPF JÁ EXISTE NA BASE DE DADOS.</p>}
                        {errors.phone && <p>• O Telefone Principal é obrigatório.</p>}
                        {duplicity.phone && <p>• Este Telefone já está em uso por outro cliente.</p>}
                        {errors.birthDate && <p>• A Data de Nascimento é obrigatória e deve ser válida.</p>}
                    </AlertDescription>
                </Alert>
            )}

            <div className="space-y-6 relative">
                <div className="flex items-center justify-between">
                    <h3 className="text-xl font-bold uppercase tracking-tight text-[#00AEEF]">
                        Dados Obrigatórios
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
                        <FormLabel className="text-xs font-medium text-muted-foreground flex items-center gap-2">
                            <User className="h-3.5 w-3.5 text-[#00AEEF]" /> Nome Completo *
                        </FormLabel>
                        <FormControl>
                            <Input placeholder="Nome completo do cliente" {...field} className={cn("rounded-full h-11 px-5 border-zinc-200 font-bold", errors.name && "border-red-500 bg-red-50")} />
                        </FormControl>
                        </FormItem>
                    )}
                />

                <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                    <FormField
                        control={form.control}
                        name="cpf"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel className="text-xs font-medium text-muted-foreground flex items-center gap-2">
                                <FileText className="h-3.5 w-3.5 text-[#00AEEF]" /> CPF *
                            </FormLabel>
                            <FormControl>
                                <div className="relative">
                                    <Input 
                                        placeholder="000.000.000-00" 
                                        {...field} 
                                        onChange={(e) => field.onChange(e.target.value.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4"))} 
                                        maxLength={14}
                                        className={cn("rounded-full h-11 px-5 border-zinc-200 font-bold transition-all", (duplicity.cpf || errors.cpf) && "border-red-500 bg-red-50 ring-2 ring-red-500/20")}
                                    />
                                    {(duplicity.cpf || errors.cpf) && <AlertTriangle className="absolute right-4 top-3.5 h-5 w-5 text-red-500 animate-pulse" />}
                                    {!errors.cpf && !duplicity.cpf && watchCpf.length === 14 && <CheckCircle2 className="absolute right-4 top-3.5 h-5 w-5 text-green-500" />}
                                </div>
                            </FormControl>
                            </FormItem>
                        )}
                    />
                    <FormField
                      control={form.control}
                      name="gender"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs font-medium text-muted-foreground flex items-center gap-2">
                            <UserRound className="h-3.5 w-3.5 text-[#00AEEF]" /> Gênero
                          </FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                                <SelectTrigger className="rounded-full h-11 px-5 border-zinc-200 font-bold">
                                    <SelectValue placeholder="Opcional" />
                                </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Masculino">Masculino</SelectItem>
                              <SelectItem value="Feminino">Feminino</SelectItem>
                            </SelectContent>
                          </Select>
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
                            <FormLabel className="text-xs font-medium text-muted-foreground flex items-center gap-2">
                                <Mail className="h-3.5 w-3.5 text-[#00AEEF]" /> E-mail
                            </FormLabel>
                            <FormControl>
                                <Input placeholder="exemplo@email.com" {...field} value={field.value ?? ''} className="rounded-full h-11 px-5 border-zinc-200 font-bold" />
                            </FormControl>
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="phone"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel className="text-xs font-medium text-muted-foreground flex items-center gap-2">
                                <Phone className="h-3.5 w-3.5 text-[#00AEEF]" /> Telefone Principal *
                            </FormLabel>
                            <FormControl>
                                <div className="relative">
                                    <Input 
                                        placeholder="(00) 00000-0000" 
                                        {...field} 
                                        className={cn("rounded-full h-11 px-5 border-zinc-200 font-bold", (duplicity.phone || errors.phone) && "border-red-500 bg-red-50")} 
                                        onChange={(e) => field.onChange(handlePhoneMask(e.target.value))} 
                                        maxLength={15} 
                                    />
                                    {isWhatsApp(watchPhone) && (
                                        <a href={getWhatsAppUrl(watchPhone)} target="_blank" rel="noopener noreferrer" className="absolute right-4 top-3 h-5 hover:scale-125 transition-transform" title="Abrir WhatsApp">
                                            <WhatsAppIcon className="h-4 w-4" />
                                        </a>
                                    )}
                                </div>
                            </FormControl>
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="phone2"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel className="text-xs font-medium text-muted-foreground flex items-center gap-2">
                                <Phone className="h-3.5 w-3.5 text-[#00AEEF]" /> Telefone 2
                            </FormLabel>
                            <FormControl>
                                <Input placeholder="(00) 00000-0000" {...field} value={field.value ?? ''} onChange={(e) => handlePhoneMask(e.target.value)} maxLength={15} className="rounded-full h-11 px-5 border-zinc-200 font-bold"/>
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
                                <div className="flex items-center gap-2"><Calendar className="h-3.5 w-3.5 text-[#00AEEF]" /> Nascimento *</div>
                                {customerAge !== null && (
                                    <Badge variant="outline" className={cn(
                                        "h-5 text-[9px] font-black uppercase border-2",
                                        customerAge >= 74 ? "bg-red-50 text-red-600 border-red-200 animate-pulse" : "bg-blue-50 text-blue-600 border-blue-200"
                                    )}>
                                        {customerAge} ANOS
                                    </Badge>
                                )}
                            </FormLabel>
                            <FormControl>
                                <Input 
                                    placeholder="dd/mm/aaaa" 
                                    {...field} 
                                    className={cn("rounded-full h-11 px-5 border-zinc-200 font-bold", errors.birthDate && "border-red-500 bg-red-50")} 
                                    maxLength={10} 
                                    onChange={(e) => field.onChange(e.target.value.replace(/\D/g, "").replace(/(\d{2})(\d)/, "$1/$2").replace(/(\d{2})(\d)/, "$1/$2").substring(0, 10))}
                                />
                            </FormControl>
                            </FormItem>
                        )}
                    />
                </div>
            </div>

            <div className="h-px bg-zinc-100" />

            {/* SEÇÃO DE ETIQUETAS */}
            <div className="space-y-6">
                <h3 className="text-xl font-bold uppercase tracking-tight text-[#00AEEF] flex items-center gap-2">
                    <Tag className="h-5 w-5" /> Classificação e Perfil
                </h3>
                <div className="space-y-4">
                    <p className="text-[10px] font-black uppercase text-muted-foreground tracking-[0.2em]">Etiquetas Selecionadas</p>
                    <div className="flex flex-wrap gap-2 min-h-[40px] p-4 rounded-3xl bg-muted/5 border-2 border-dashed border-zinc-200">
                        {watchTags.length > 0 ? watchTags.map(tag => (
                            <Badge key={tag} className="gap-1.5 pl-3 pr-1 py-1.5 rounded-full bg-primary text-white font-bold border-none shadow-sm animate-in zoom-in-95">
                                {tag}
                                <button type="button" onClick={() => handleTagToggle(tag)} className="h-5 w-5 rounded-full bg-black/10 flex items-center justify-center hover:bg-black/20 transition-colors">
                                    <X className="h-3 w-3" />
                                </button>
                            </Badge>
                        )) : (
                            <span className="text-[10px] font-black uppercase text-muted-foreground/40 italic flex items-center gap-2">
                                <Info className="h-3.5 w-3.5" /> Nenhuma etiqueta atribuída
                            </span>
                        )}
                    </div>
                    <div className="space-y-2">
                        <p className="text-[10px] font-black uppercase text-muted-foreground tracking-[0.2em]">Etiquetas Sugeridas</p>
                        <div className="flex flex-wrap gap-2">
                            {availableTags.map(tag => {
                                const isSelected = watchTags.includes(tag);
                                return (
                                    <Button
                                        key={tag}
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleTagToggle(tag)}
                                        className={cn(
                                            "rounded-full font-bold h-8 transition-all border-2",
                                            isSelected ? "bg-primary text-white border-primary shadow-md scale-105" : "border-zinc-200 text-muted-foreground hover:border-primary/40"
                                        )}
                                    >
                                        {tag}
                                    </Button>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>

            <div className="h-px bg-zinc-100" />

            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <h3 className="text-xl font-bold uppercase tracking-tight text-[#00AEEF]">
                        Benefícios e Reservas de Cartão
                    </h3>
                    <Button type="button" variant="outline" size="sm" onClick={() => appendBenefit({ number: '', species: '', salary: 0, rmcBank: '', rccBank: '' })} className="rounded-full h-9 px-5 border-[#00AEEF]/30 hover:bg-[#00AEEF]/5 text-[#00AEEF] font-bold">
                        <PlusCircle className="h-4 w-4 mr-2" /> Adicionar NB
                    </Button>
                </div>
                <div className="space-y-8">
                    {benefitFields.map((field, index) => (
                        <div key={field.id} className="p-6 rounded-3xl bg-muted/10 border border-border/50 space-y-6 animate-in fade-in slide-in-from-left-2">
                            <div className="flex justify-between items-start">
                                <div className="w-full space-y-6">
                                    {/* DOCK 1: DADOS DO BENEFÍCIO (EMERALD/TEAL) */}
                                    <div className="flex flex-col md:flex-row items-center gap-3 bg-background/60 border border-border/50 rounded-2xl p-1.5 shadow-sm h-auto md:h-20 w-full">
                                        <div className="flex-1 flex flex-col justify-center px-5 border-b md:border-b-0 md:border-r border-border/30 py-3 md:py-0 w-full">
                                            <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1.5">Nº do Benefício</span>
                                            <FormField
                                                control={form.control}
                                                name={`benefits.${index}.number`}
                                                render={({ field }) => (
                                                    <FormControl><Input placeholder="000.000.000-0" {...field} className="h-9 border-none bg-transparent shadow-none p-0 focus:ring-0 font-mono font-bold text-sm" /></FormControl>
                                                )}
                                            />
                                        </div>
                                        <div className="flex-1 flex flex-col justify-center px-5 border-b md:border-b-0 md:border-r border-border/30 py-3 md:py-0 w-full">
                                            <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1.5">Espécie / Tipo</span>
                                            <FormField
                                                control={form.control}
                                                name={`benefits.${index}.species`}
                                                render={({ field }) => (
                                                    <FormControl><Input placeholder="Aposentadoria Idade" {...field} value={field.value ?? ''} className="h-9 border-none bg-transparent shadow-none p-0 focus:ring-0 font-bold text-sm" /></FormControl>
                                                )}
                                            />
                                        </div>
                                        <div className="flex-1 flex flex-col justify-center px-5 py-3 md:py-0 w-full">
                                            <span className="text-[10px] font-black text-green-600 uppercase tracking-widest mb-1.5">Valor Salário (R$)</span>
                                            <FormField
                                                control={form.control}
                                                name={`benefits.${index}.salary`}
                                                render={({ field }) => (
                                                    <div className="relative flex items-center">
                                                        <span className="absolute left-0 text-[10px] font-black text-green-600/40">R$</span>
                                                        <FormControl>
                                                            <Input 
                                                                type="number" 
                                                                step="0.01" 
                                                                className="h-9 border-none bg-transparent shadow-none p-0 pl-7 focus:ring-0 font-bold text-sm text-green-600" 
                                                                {...field} 
                                                                value={field.value ?? 0}
                                                                onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                                            />
                                                        </FormControl>
                                                    </div>
                                                )}
                                            />
                                        </div>
                                    </div>

                                    {/* DOCK 2: RESERVAS DE CARTÃO (BLUE/ORANGE) */}
                                    <div className="flex flex-col md:flex-row items-center gap-3 bg-background/60 border border-border/50 rounded-2xl p-1.5 shadow-sm h-auto md:h-20 w-full">
                                        <div className="flex-1 flex flex-col justify-center px-5 border-b md:border-b-0 md:border-r border-border/30 py-3 md:py-0 w-full">
                                            <span className="text-[10px] font-black text-orange-600 uppercase tracking-widest mb-1.5">Reserva RMC</span>
                                            <FormField
                                                control={form.control}
                                                name={`benefits.${index}.rmcBank`}
                                                render={({ field }) => (
                                                    <Select onValueChange={field.onChange} value={field.value ?? ''}>
                                                        <FormControl>
                                                            <SelectTrigger className="h-9 border-none bg-transparent shadow-none p-0 focus:ring-0 font-bold text-sm">
                                                                <SelectValue placeholder="Livre / Selecione" />
                                                            </SelectTrigger>
                                                        </FormControl>
                                                        <SelectContent>
                                                            <SelectItem value="none">Sem Reserva</SelectItem>
                                                            {banks.map(b => (
                                                                <SelectItem key={b} value={b}>
                                                                    <div className="flex items-center gap-2.5">
                                                                        <BankIcon bankName={b} domain={userSettings?.bankDomains?.[b]} showLogo={showLogos} className="h-4 w-4" />
                                                                        <span className="text-xs uppercase font-bold">{cleanBankName(b)}</span>
                                                                    </div>
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                )}
                                            />
                                        </div>
                                        <div className="flex-1 flex flex-col justify-center px-5 py-3 md:py-0 w-full">
                                            <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-1.5">Reserva RCC</span>
                                            <FormField
                                                control={form.control}
                                                name={`benefits.${index}.rccBank`}
                                                render={({ field }) => (
                                                    <Select onValueChange={field.onChange} value={field.value ?? ''}>
                                                        <FormControl>
                                                            <SelectTrigger className="h-9 border-none bg-transparent shadow-none p-0 focus:ring-0 font-bold text-sm">
                                                                <SelectValue placeholder="Livre / Selecione" />
                                                            </SelectTrigger>
                                                        </FormControl>
                                                        <SelectContent>
                                                            <SelectItem value="none">Sem Reserva</SelectItem>
                                                            {banks.map(b => (
                                                                <SelectItem key={b} value={b}>
                                                                    <div className="flex items-center gap-2.5">
                                                                        <BankIcon bankName={b} domain={userSettings?.bankDomains?.[b]} showLogo={showLogos} className="h-4 w-4" />
                                                                        <span className="text-xs uppercase font-bold">{cleanBankName(b)}</span>
                                                                    </div>
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                )}
                                            />
                                        </div>
                                    </div>
                                </div>
                                <Button type="button" variant="ghost" size="icon" onClick={() => removeBenefit(index)} className="text-red-400 h-10 w-10 hover:bg-red-50 rounded-full ml-4">
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    ))}
                    {benefitFields.length === 0 && (
                        <div className="py-10 text-center border-2 border-dashed rounded-3xl opacity-20 text-[10px] font-black uppercase tracking-widest">
                            Nenhum benefício ou cartão cadastrado
                        </div>
                    )}
                </div>
            </div>

            <div className="h-px bg-zinc-100" />

            <div className="space-y-6">
                <h3 className="text-xl font-bold uppercase tracking-tight text-[#00AEEF]">Localização</h3>
                <div className='grid grid-cols-1 md:grid-cols-4 gap-6'>
                    <FormField
                        control={form.control}
                        name="cep"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel className="text-xs font-medium text-muted-foreground flex items-center gap-2">
                                <MapPin className="h-3.5 w-3.5 text-[#00AEEF]" /> CEP
                            </FormLabel>
                            <FormControl>
                                <div className='relative'>
                                    <Input 
                                        placeholder="00000-000" 
                                        {...field} 
                                        value={field.value ?? ''} 
                                        maxLength={9} 
                                        onChange={(e) => {
                                            let v = e.target.value.replace(/\D/g, "");
                                            if (v.length > 5) v = v.replace(/(\d{5})(\d)/, "$1-$2");
                                            field.onChange(v);
                                        }}
                                        className="rounded-full h-11 px-5 border-zinc-200 font-bold" 
                                    />
                                    {isFetchingCep && <Loader2 className="absolute right-4 top-3.5 h-4 w-4 animate-spin text-[#00AEEF]" />}
                                </div>
                            </FormControl>
                            </FormItem>
                        )}
                    />
                    <div className="md:col-span-2">
                        <FormField control={form.control} name="street" render={({ field }) => (
                            <FormItem><FormLabel className="text-xs font-medium text-muted-foreground flex items-center gap-2"><Home className="h-3.5 w-3.5 text-[#00AEEF]" /> Logradouro</FormLabel><FormControl><Input placeholder="Rua / Avenida" {...field} value={field.value ?? ''} className="rounded-full h-11 px-5 border-zinc-200 font-bold" /></FormControl></FormItem>
                        )} />
                    </div>
                    <FormField control={form.control} name="number" render={({ field }) => (
                        <FormItem><FormLabel className="text-xs font-medium text-muted-foreground flex items-center gap-2"><Hash className="h-3.5 w-3.5 text-[#00AEEF]" /> Número</FormLabel><FormControl><Input placeholder="123" {...field} value={field.value ?? ''} className="rounded-full h-11 px-5 border-zinc-200 font-bold" /></FormControl></FormItem>
                    )} />
                </div>
                <div className='grid grid-cols-1 md:grid-cols-4 gap-6'>
                    <FormField control={form.control} name="complement" render={({ field }) => (
                        <FormItem><FormLabel className="text-xs font-medium text-muted-foreground flex items-center gap-2"><Home className="h-3.5 w-3.5 text-[#00AEEF]" /> Complemento</FormLabel><FormControl><Input placeholder="Apto, Bloco..." {...field} value={field.value ?? ''} className="rounded-full h-11 px-5 border-zinc-200 font-bold" /></FormControl></FormItem>
                    )} />
                    <FormField control={form.control} name="neighborhood" render={({ field }) => (
                        <FormItem><FormLabel className="text-xs font-medium text-muted-foreground flex items-center gap-2"><MapPin className="h-3.5 w-3.5 text-[#00AEEF]" /> Bairro</FormLabel><FormControl><Input placeholder="Bairro" {...field} value={field.value ?? ''} className="rounded-full h-11 px-5 border-zinc-200 font-bold" /></FormControl></FormItem>
                    )} />
                    <FormField control={form.control} name="city" render={({ field }) => (
                        <FormItem><FormLabel className="text-xs font-medium text-muted-foreground flex items-center gap-2"><Map className="h-3.5 w-3.5 text-[#00AEEF]" /> Cidade</FormLabel><FormControl><Input placeholder="Cidade" {...field} value={field.value ?? ''} className="rounded-full h-11 px-5 border-zinc-200 font-bold" /></FormControl></FormItem>
                    )} />
                    <FormField control={form.control} name="state" render={({ field }) => (
                        <FormItem><FormLabel className="text-xs font-medium text-muted-foreground flex items-center gap-2"><Map className="h-3.5 w-3.5 text-[#00AEEF]" /> UF</FormLabel><FormControl><Input placeholder="SP" {...field} value={field.value ?? ''} className="rounded-full h-11 px-5 border-zinc-200 uppercase font-bold" maxLength={2} /></FormControl></FormItem>
                    )} />
                </div>
            </div>

            <div className="h-px bg-zinc-100" />

            <div className="space-y-6">
                <h3 className="text-xl font-bold uppercase tracking-tight text-[#00AEEF] flex items-center gap-2">
                    <FolderLock className="h-5 w-5" /> Documentação Fixa
                </h3>
                <CustomerAttachmentUploader 
                    userId={user?.uid || 'system'} 
                    customerId={currentCustomerId || 'new'} 
                    initialAttachments={form.getValues('documents') || []} 
                    onAttachmentsChange={(docs) => form.setValue('documents', docs, { shouldValidate: true })}
                    isReadOnly={false}
                />
            </div>

            <div className="h-px bg-zinc-100" />

            <div className="space-y-4 pb-10">
                <div className="flex items-center justify-between">
                    <h3 className="text-xl font-bold uppercase tracking-tight text-[#00AEEF] flex items-center gap-2">
                        <MessageSquareText className="h-5 w-5" /> Observações Estratégicas
                    </h3>
                    <Button 
                        type="button" 
                        variant="outline" 
                        size="sm" 
                        className="rounded-full h-9 px-5 border-primary/20 bg-primary/5 text-primary font-bold hover:bg-primary/10"
                        onClick={handleSummarize}
                        disabled={isSummarizing || !watchObservations}
                    >
                        {isSummarizing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Sparkles className="h-4 w-4 mr-2" />}
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
                                placeholder="Anotações internas sobre o perfil do cliente..." 
                                {...field} 
                                value={field.value ?? ''} 
                                className="min-h-[120px] rounded-2xl border-zinc-200 bg-muted/5 p-5 focus-visible:ring-[#00AEEF] font-medium"
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
                disabled={isSaving || duplicity.phone || duplicity.cpf || hasErrors} 
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