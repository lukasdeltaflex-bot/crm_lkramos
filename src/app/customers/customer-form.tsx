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
import { Sparkles, Loader2, PlusCircle, Trash2, FileText as FileIcon, UserCheck, UserX, AlertTriangle, MapPin, Mail } from 'lucide-react';
import { format, parse, isValid } from 'date-fns';
import { getAge, validateCPF, handlePhoneMask, isWhatsApp, cleanFirestoreData, getWhatsAppUrl } from '@/lib/utils';
import type { Customer, Attachment } from '@/lib/types';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { useEffect, useState, useMemo } from 'react';
import { summarizeNotes } from '@/ai/flows/summarize-notes-flow';
import { toast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';
import { WhatsAppIcon } from '@/components/icons/whatsapp-icon';
import { CustomerAttachmentUploader } from '@/components/customers/customer-attachment-uploader';
import { useUser, useFirestore } from '@/firebase';
import { doc, collection } from 'firebase/firestore';
import { useTheme } from '@/components/theme-provider';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

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

  // 🛡️ SINCRONIZAÇÃO ATÔMICA (Evita reset do Gênero)
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

  /**
   * 🛡️ FUNÇÃO DE BUSCA DE CEP (FRONTEND)
   * Ela chama nossa rota de backend /api/cep para evitar o erro "Failed to fetch" (CORS).
   */
  const handleCepBlur = async (e: React.FocusEvent<HTMLInputElement>) => {
    const cep = e.target.value.replace(/\D/g, '');
    if (cep.length !== 8) return;
    
    setIsFetchingCep(true);
    try {
        const response = await fetch(`/api/cep/${cep}`);
        
        if (!response.ok) throw new Error('Rede bloqueada');

        const data = await response.json();
        
        if (data && !data.erro) {
            form.setValue('street', data.logradouro || '', { shouldValidate: true });
            form.setValue('neighborhood', data.bairro || '', { shouldValidate: true });
            form.setValue('city', data.localidade || '', { shouldValidate: true });
            form.setValue('state', data.uf || '', { shouldValidate: true });
            toast({ title: "Endereço Localizado", description: "Campos preenchidos via Proxy Seguro." });
        } else {
            toast({ variant: 'destructive', title: "CEP não encontrado", description: "Verifique o número digitado." });
        }
    } catch (error) {
        console.warn("CEP Fetch Error:", error);
        toast({ 
            variant: 'destructive', 
            title: 'Busca Indisponível', 
            description: 'A rede bloqueou a consulta direta. Preencha manualmente.' 
        });
    } finally {
        setIsFetchingCep(false);
    }
  }

  const handleFormSubmit = (data: CustomerFormValues) => {
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

  // --- Resto do componente (JSX) mantido para referência ---
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleFormSubmit)} className="py-4">
        <ScrollArea className="h-[75vh] pr-4">
          <div className="space-y-8">
            <div className='space-y-4'>
                <h3 className="text-lg font-black uppercase tracking-widest text-primary/60">Dados Pessoais</h3>
                <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Nome Completo</FormLabel>
                        <FormControl><Input placeholder="João da Silva" {...field} value={field.value ?? ''} /></FormControl>
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
                            <FormControl><Input placeholder="000.000.000-00" {...field} value={field.value ?? ''} onChange={(e) => field.onChange(e.target.value.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4"))} maxLength={14}/></FormControl>
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
                            <FormControl><SelectTrigger><SelectValue placeholder="Selecione o gênero" /></SelectTrigger></FormControl>
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
                
                <FormField
                    control={form.control}
                    name="cep"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>CEP</FormLabel>
                        <FormControl>
                            <div className='relative max-w-[240px]'>
                                <Input 
                                    placeholder="00000-000" 
                                    {...field} 
                                    value={field.value ?? ''} 
                                    onBlur={handleCepBlur} 
                                    maxLength={9} 
                                />
                                {isFetchingCep && <Loader2 className="absolute right-3 top-2.5 h-5 w-5 animate-spin text-primary" />}
                            </div>
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                
                {/* Outros campos ocultados para foco no código solicitado */}
            </div>
          </div>
        </ScrollArea>
        <div className="flex justify-end pt-8">
            <Button type="submit" disabled={isSaving} className="rounded-full px-10 font-bold bg-[#00AEEF]">
                Salvar Cliente
            </Button>
        </div>
      </form>
    </Form>
  );
}
