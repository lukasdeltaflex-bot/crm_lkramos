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
  FormDescription
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
    Sparkles, 
    Loader2, 
    PlusCircle, 
    Trash2, 
    UserCheck, 
    UserX, 
    AlertTriangle, 
    MapPin, 
    Mail, 
    Phone, 
    Hash, 
    MessageSquareText, 
    Calendar as CalendarIcon 
} from 'lucide-react';
import { format, parse, isValid } from 'date-fns';
import { validateCPF, handlePhoneMask, cleanFirestoreData, cn } from '@/lib/utils';
import type { Customer } from '@/lib/types';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { useEffect, useState, useMemo } from 'react';
import { toast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';

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
  gender: z.string().nullable().optional(),
  status: z.enum(['active', 'inactive']).default('active'),
  benefits: z.array(benefitSchema).optional(),
  phone: z.string().min(10, 'O telefone é obrigatório.'),
  phone2: z.string().nullable().optional(),
  email: z.string().email('Formato de e-mail inválido.').or(z.literal('')).nullable().optional(),
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
  const watchEmail = form.watch('email');
  const watchCpf = form.watch('cpf');

  const duplicity = useMemo(() => {
    const results = { phone: false, email: false, cpf: false };
    if (!allCustomers) return results;

    const currentId = customer?.id;
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
  }, [allCustomers, watchPhone, watchEmail, watchCpf, customer?.id]);

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
        if (!response.ok) throw new Error('Bypass falhou');
        const data = await response.json();
        
        if (data && !data.erro) {
            form.setValue('street', data.logradouro || '', { shouldValidate: true });
            form.setValue('neighborhood', data.bairro || '', { shouldValidate: true });
            form.setValue('city', data.localidade || '', { shouldValidate: true });
            form.setValue('state', data.uf || '', { shouldValidate: true });
            toast({ title: "Localização Automática", description: "Endereço preenchido via proxy seguro." });
        }
    } catch (error) {
        toast({ variant: 'destructive', title: 'Busca Indisponível', description: 'Preencha o endereço manualmente.' });
    } finally {
        setIsFetchingCep(false);
    }
  }

  const handleFormSubmit = (data: CustomerFormValues) => {
    if (duplicity.phone || duplicity.email || duplicity.cpf) {
        toast({ variant: 'destructive', title: 'Erro de Duplicidade', description: 'Corrija os campos em vermelho antes de salvar.' });
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
      gender: (data.gender as any) || null 
    };
    onSubmit(cleanFirestoreData(newCustomerData));
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleFormSubmit)} className="py-4">
        <ScrollArea className="h-[75vh] pr-4">
          <div className="space-y-10">
            <div className="space-y-6">
                <h3 className="text-sm font-black uppercase tracking-[0.2em] text-primary/60 flex items-center gap-2">
                    <UserCheck className="h-4 w-4" /> Dados Cadastrais
                </h3>
                <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Nome Completo</FormLabel>
                        <FormControl><Input placeholder="Ex: JOÃO DA SILVA" {...field} className="uppercase font-bold" /></FormControl>
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
                            <FormLabel>CPF (Documento)</FormLabel>
                            <FormControl>
                                <div className="relative">
                                    <Input 
                                        placeholder="000.000.000-00" 
                                        {...field} 
                                        onChange={(e) => field.onChange(e.target.value.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4"))} 
                                        maxLength={14}
                                        className={cn("font-bold", duplicity.cpf && "border-red-500 bg-red-50 text-red-900")}
                                    />
                                    {duplicity.cpf && <AlertTriangle className="absolute right-3 top-2.5 h-5 w-5 text-red-500 animate-pulse" />}
                                </div>
                            </FormControl>
                            {duplicity.cpf && <p className="text-[10px] font-black text-red-600 uppercase mt-1">Este CPF já está cadastrado!</p>}
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                      control={form.control}
                      name="gender"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Gênero</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value || ""}>
                            <FormControl><SelectTrigger className="font-bold"><SelectValue placeholder="Selecione" /></SelectTrigger></FormControl>
                            <SelectContent>
                              <SelectItem value="Masculino" className="font-bold">Masculino</SelectItem>
                              <SelectItem value="Feminino" className="font-bold">Feminino</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                        control={form.control}
                        name="birthDate"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Data de Nascimento</FormLabel>
                            <FormControl>
                                <div className="relative">
                                    <CalendarIcon className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input 
                                        placeholder="dd/mm/aaaa" 
                                        {...field} 
                                        className="pl-9 font-bold" 
                                        maxLength={10} 
                                        onChange={(e) => {
                                            let v = e.target.value.replace(/\D/g, "").substring(0, 8);
                                            if (v.length > 4) v = v.replace(/(\d{2})(\d{2})(\d)/, "$1/$2/$3");
                                            else if (v.length > 2) v = v.replace(/(\d{2})(\d)/, "$1/$2");
                                            field.onChange(v);
                                        }}
                                    />
                                </div>
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="status"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Situação do Registro</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl><SelectTrigger className="font-bold"><SelectValue /></SelectTrigger></FormControl>
                                <SelectContent>
                                    <SelectItem value="active" className="text-green-600 font-bold">Ativo (Operacional)</SelectItem>
                                    <SelectItem value="inactive" className="text-red-600 font-bold">Inativo (Arquivado)</SelectItem>
                                </SelectContent>
                            </Select>
                            </FormItem>
                        )}
                    />
                </div>
            </div>

            <Separator />

            <div className="space-y-6">
                <h3 className="text-sm font-black uppercase tracking-[0.2em] text-primary/60 flex items-center gap-2">
                    <Mail className="h-4 w-4" /> Canais de Comunicação
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                        control={form.control}
                        name="phone"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Telefone Principal (Celular)</FormLabel>
                            <FormControl>
                                <div className="relative">
                                    <Input 
                                        placeholder="(00) 00000-0000" 
                                        {...field} 
                                        className={cn("font-bold", duplicity.phone && "border-red-500 bg-red-50")} 
                                        onChange={(e) => field.onChange(handlePhoneMask(e.target.value))}
                                        maxLength={15}
                                    />
                                    {duplicity.phone && <AlertTriangle className="absolute right-3 top-2.5 h-5 w-5 text-red-500 animate-pulse" />}
                                </div>
                            </FormControl>
                            {duplicity.phone && <p className="text-[10px] font-black text-red-600 uppercase mt-1">Telefone já pertence a outro cliente!</p>}
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="phone2"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Telefone 2 (Recado/Fixo)</FormLabel>
                            <FormControl><Input placeholder="(00) 0000-0000" {...field} value={field.value ?? ''} onChange={(e) => field.onChange(handlePhoneMask(e.target.value))} maxLength={15} className="font-bold"/></FormControl>
                            </FormItem>
                        )}
                    />
                </div>
                <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Endereço de E-mail</FormLabel>
                        <FormControl>
                            <div className="relative">
                                <Input 
                                    placeholder="exemplo@email.com" 
                                    {...field} 
                                    className={cn("lowercase", duplicity.email && "border-red-500 bg-red-50")} 
                                />
                                {duplicity.email && <AlertTriangle className="absolute right-3 top-2.5 h-5 w-5 text-red-500 animate-pulse" />}
                            </div>
                        </FormControl>
                        {duplicity.email && <p className="text-[10px] font-black text-red-600 uppercase mt-1">Este e-mail já está sendo usado!</p>}
                        <FormMessage />
                        </FormItem>
                    )}
                />
            </div>

            <Separator />

            <div className="space-y-6">
                <h3 className="text-sm font-black uppercase tracking-[0.2em] text-primary/60 flex items-center gap-2">
                    <MapPin className="h-4 w-4" /> Endereço Residencial
                </h3>
                <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                    <FormField
                        control={form.control}
                        name="cep"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>CEP</FormLabel>
                            <FormControl>
                                <div className='relative max-w-[200px]'>
                                    <Input placeholder="00000-000" {...field} value={field.value ?? ''} onBlur={handleCepBlur} maxLength={9} className="font-mono font-bold" />
                                    {isFetchingCep && <Loader2 className="absolute right-3 top-2.5 h-5 w-5 animate-spin text-primary" />}
                                </div>
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                    <div />
                </div>
                <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
                    <div className='md:col-span-2'>
                        <FormField control={form.control} name="street" render={({ field }) => (
                            <FormItem><FormLabel>Logradouro</FormLabel><FormControl><Input placeholder="Rua / Avenida" {...field} value={field.value ?? ''} /></FormControl></FormItem>
                        )} />
                    </div>
                    <FormField control={form.control} name="number" render={({ field }) => (
                        <FormItem><FormLabel>Número</FormLabel><FormControl><Input placeholder="123" {...field} value={field.value ?? ''} /></FormControl></FormItem>
                    )} />
                </div>
                <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                    <FormField control={form.control} name="complement" render={({ field }) => (
                        <FormItem><FormLabel>Complemento</FormLabel><FormControl><Input placeholder="Apto, Bloco, etc." {...field} value={field.value ?? ''} /></FormControl></FormItem>
                    )} />
                    <FormField control={form.control} name="neighborhood" render={({ field }) => (
                        <FormItem><FormLabel>Bairro</FormLabel><FormControl><Input placeholder="Bairro" {...field} value={field.value ?? ''} /></FormControl></FormItem>
                    )} />
                </div>
                <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                    <FormField control={form.control} name="city" render={({ field }) => (
                        <FormItem><FormLabel>Cidade</FormLabel><FormControl><Input placeholder="Cidade" {...field} value={field.value ?? ''} /></FormControl></FormItem>
                    )} />
                    <FormField control={form.control} name="state" render={({ field }) => (
                        <FormItem><FormLabel>Estado (UF)</FormLabel><FormControl><Input placeholder="SP" {...field} value={field.value ?? ''} className="uppercase" maxLength={2} /></FormControl></FormItem>
                    )} />
                </div>
            </div>

            <Separator />

            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <h3 className="text-sm font-black uppercase tracking-[0.2em] text-primary/60 flex items-center gap-2">
                        <Hash className="h-4 w-4" /> Benefícios Vinculados
                    </h3>
                    <Button type="button" variant="outline" size="sm" onClick={() => append({ number: '', species: '' })} className="rounded-full h-8 font-bold border-primary/30 text-primary">
                        <PlusCircle className="h-3 w-3 mr-2" /> Novo NB
                    </Button>
                </div>
                <div className="space-y-4">
                    {fields.map((field, index) => (
                        <div key={field.id} className="flex gap-4 items-end p-4 rounded-xl bg-muted/20 border border-border/50 group animate-in slide-in-from-left-2">
                            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name={`benefits.${index}.number`}
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-[10px] font-black uppercase opacity-60">Número do Benefício</FormLabel>
                                            <FormControl><Input placeholder="000.000.000-0" {...field} className="font-mono font-bold" /></FormControl>
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name={`benefits.${index}.species`}
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-[10px] font-black uppercase opacity-60">Espécie / Tipo</FormLabel>
                                            <FormControl><Input placeholder="Ex: Aposentadoria Idade" {...field} value={field.value ?? ''} className="font-bold" /></FormControl>
                                        </FormItem>
                                    )}
                                />
                            </div>
                            <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} className="text-destructive h-10 w-10">
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>
                    ))}
                    {fields.length === 0 && (
                        <div className="py-8 text-center border-2 border-dashed rounded-xl opacity-30 text-[10px] font-black uppercase tracking-[0.2em]">Nenhum benefício registrado</div>
                    )}
                </div>
            </div>

            <Separator />

            <div className="space-y-6 pb-10">
                <h3 className="text-sm font-black uppercase tracking-[0.2em] text-primary/60 flex items-center gap-2">
                    <MessageSquareText className="h-4 w-4" /> Inteligência e Observações
                </h3>
                <FormField
                    control={form.control}
                    name="observations"
                    render={({ field }) => (
                        <FormItem>
                        <FormControl>
                            <Textarea 
                                placeholder="Anotações estratégicas sobre o perfil do cliente, restrições ou oportunidades..." 
                                {...field} 
                                value={field.value ?? ''} 
                                className="min-h-[120px] resize-none bg-muted/10 border-2"
                            />
                        </FormControl>
                        <FormDescription className="text-[10px] italic">Estas informações alimentam a IA para gerar scripts de venda mais assertivos.</FormDescription>
                        </FormItem>
                    )}
                />
            </div>
          </div>
        </ScrollArea>
        
        <div className="flex justify-end pt-8 border-t mt-4 bg-background sticky bottom-0 z-50">
            <Button 
                type="submit" 
                disabled={isSaving || duplicity.phone || duplicity.email || duplicity.cpf} 
                className="rounded-full px-12 h-12 font-black uppercase tracking-widest bg-[#00AEEF] hover:bg-[#0096D1] shadow-xl transition-all"
            >
                {isSaving ? (
                    <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Salvando...</>
                ) : (
                    <><UserCheck className="mr-2 h-5 w-5" /> Salvar Cadastro</>
                )}
            </Button>
        </div>
      </form>
    </Form>
  );
}
