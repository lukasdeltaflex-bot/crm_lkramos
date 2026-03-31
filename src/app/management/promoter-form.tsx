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
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Save, Building2, Phone, User as UserIcon, Headset, MessageSquareText, Mail, Hash, Upload, X, Camera, ShieldCheck, Lock, Globe, KeyRound, Eye, EyeOff } from 'lucide-react';
import { handlePhoneMask, isWhatsApp, getWhatsAppUrl } from '@/lib/utils';
import { WhatsAppIcon } from '@/components/icons/whatsapp-icon';
import { useRef, useState, useEffect } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { encryptPassword, decryptPassword } from '@/lib/crypto-utils';
import { useUser } from '@/firebase';

const promoterSchema = z.object({
  name: z.string().min(1, 'O nome da promotora é obrigatório.'),
  partnerCode: z.string().optional(),
  photoURL: z.string().optional(),
  contactName: z.string().optional(),
  phone: z.string().optional(),
  whatsapp: z.string().optional(),
  supportPhone: z.string().optional(),
  email: z.string().optional(),
  managerEmail: z.string().optional(),
  observations: z.string().optional(),
  username: z.string().optional(),
  password: z.string().optional(),
  secondaryPassword: z.string().optional(),
  website: z.string().optional(),
});

type PromoterFormValues = z.infer<typeof promoterSchema>;

interface PromoterFormProps {
  initialData?: any;
  onSubmit: (data: PromoterFormValues) => void;
  isSaving?: boolean;
}

export function PromoterForm({ initialData, onSubmit, isSaving = false }: PromoterFormProps) {
  const [photoPreview, setPhotoPreview] = useState<string | null>(initialData?.photoURL || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<PromoterFormValues>({
    resolver: zodResolver(promoterSchema),
    defaultValues: initialData || {
      name: '',
      partnerCode: '',
      photoURL: '',
      contactName: '',
      phone: '',
      whatsapp: '',
      supportPhone: '',
      email: '',
      managerEmail: '',
      observations: '',
      username: '',
      password: '',
      secondaryPassword: '',
      website: '',
    },
  });

  const { user } = useUser();
  const [showPassword, setShowPassword] = useState(false);
  const [showSecondaryPassword, setShowSecondaryPassword] = useState(false);
  const [isDecrypting, setIsDecrypting] = useState(false);

  // 🛡️ DESCRIPTOGRAFIA SEGURA PARA EDIÇÃO
  useEffect(() => {
    async function loadPasswords() {
        if (!user?.uid || !initialData) return;
        
        setIsDecrypting(true);
        if (initialData.password) {
            const dec = await decryptPassword(initialData.password, user.uid);
            form.setValue('password', dec);
        }
        if (initialData.secondaryPassword) {
            const dec = await decryptPassword(initialData.secondaryPassword, user.uid);
            form.setValue('secondaryPassword', dec);
        }
        setIsDecrypting(false);
    }
    loadPasswords();
  }, [initialData, user, form]);

  const handleFormSubmit = async (values: PromoterFormValues) => {
    if (!user?.uid) return;
    
    setIsDecrypting(true); // Reutilizando loader para o submit
    const dataToSave = { ...values };
    
    if (values.password) {
        dataToSave.password = await encryptPassword(values.password, user.uid);
    }
    if (values.secondaryPassword) {
        dataToSave.secondaryPassword = await encryptPassword(values.secondaryPassword, user.uid);
    }
    
    onSubmit(dataToSave);
  };

  const watchWhatsapp = form.watch('whatsapp');
  const watchSupport = form.watch('supportPhone');

  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUrl = reader.result as string;
        setPhotoPreview(dataUrl);
        form.setValue('photoURL', dataUrl, { shouldValidate: true });
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <Form {...form}>
      <form id="promoter-form" onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6 pb-4" noValidate>
        {/* CABEÇALHO: LOGO + DADOS BÁSICOS */}
        <div className="flex flex-col md:flex-row gap-6 items-start pb-4 border-b border-primary/5">
            <div className="flex flex-col items-center gap-2 shrink-0">
                <div className="relative group">
                    <Avatar className="h-24 w-28 border-4 border-primary/10 shadow-xl rounded-2xl">
                        <AvatarImage src={photoPreview || undefined} className="object-contain" />
                        <AvatarFallback className="bg-muted text-muted-foreground rounded-2xl">
                            <Building2 className="h-10 w-10 opacity-20" />
                        </AvatarFallback>
                    </Avatar>
                    <div className="absolute inset-0 bg-black/40 rounded-2xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                        <Camera className="text-white h-5 w-5" />
                    </div>
                    {photoPreview && (
                        <button 
                            type="button" 
                            onClick={(e) => { e.stopPropagation(); setPhotoPreview(null); form.setValue('photoURL', ''); }}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1.5 shadow-lg hover:bg-red-600 transition-colors z-10"
                        >
                            <X className="h-3 w-3" />
                        </button>
                    )}
                </div>
                <p className="text-[8px] font-black uppercase text-muted-foreground tracking-[0.2em]">Logo Parceiro</p>
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handlePhotoUpload} />
            </div>

            <div className="flex-1 w-full space-y-4">
                <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel className="flex items-center gap-2 font-bold uppercase text-[10px] tracking-widest"><Building2 className="h-3.5 w-3.5 text-primary" /> Nome da Promotora *</FormLabel>
                        <FormControl><Input placeholder="Ex: Master Promotora" {...field} className="font-bold h-11 text-base" /></FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="partnerCode"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel className="flex items-center gap-2 font-bold uppercase text-[10px] tracking-widest text-muted-foreground"><Hash className="h-3.5 w-3.5" /> ID / Código Interno de Parceiro</FormLabel>
                        <FormControl><Input placeholder="Cód. Identificador" {...field} className="font-mono font-bold h-10 bg-muted/30" /></FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
            </div>
        </div>

        {/* SEÇÃO 1: GESTÃO & APOIO */}
        <div className="space-y-4">
            <div className="flex items-center gap-3">
                <div className="h-px bg-primary/10 flex-1" />
                <span className="text-[9px] font-black uppercase tracking-[0.3em] text-primary/40 leading-none">Gestão & Apoio</span>
                <div className="h-px bg-primary/10 flex-1" />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <FormField
                    control={form.control}
                    name="contactName"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel className="flex items-center gap-2 font-bold uppercase text-[10px] tracking-widest"><UserIcon className="h-3.5 w-3.5 text-primary" /> Nome do Gerente / Contato</FormLabel>
                        <FormControl><Input placeholder="Ex: Maria Clara" {...field} className="h-10" /></FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="whatsapp"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel className="flex items-center gap-2 font-bold uppercase text-[10px] tracking-widest text-green-600"><Phone className="h-3.5 w-3.5" /> WhatsApp Direto Gerente</FormLabel>
                        <FormControl>
                            <div className="relative">
                                <Input placeholder="(00) 00000-0000" {...field} onChange={(e) => field.onChange(handlePhoneMask(e.target.value))} className="h-10" />
                                {isWhatsApp(watchWhatsapp || '') && (
                                    <div className="absolute right-3 top-2 flex items-center">
                                        <WhatsAppIcon className="h-4 w-4" />
                                    </div>
                                )}
                            </div>
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
            </div>
        </div>

        {/* SEÇÃO 2: CONTATOS DIGITAIS & E-MAILS */}
        <div className="space-y-4">
            <div className="flex items-center gap-3">
                <div className="h-px bg-primary/10 flex-1" />
                <span className="text-[9px] font-black uppercase tracking-[0.3em] text-primary/40 leading-none">Contatos & E-mails</span>
                <div className="h-px bg-primary/10 flex-1" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel className="flex items-center gap-2 font-bold uppercase text-[10px] tracking-widest"><Phone className="h-3.5 w-3.5 text-primary" /> Fixo</FormLabel>
                        <FormControl><Input placeholder="(00) 0000-0000" {...field} onChange={(e) => field.onChange(handlePhoneMask(e.target.value))} className="h-10" /></FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="supportPhone"
                    render={({ field }) => (
                        <FormItem className="md:col-span-2">
                        <FormLabel className="flex items-center gap-2 font-bold uppercase text-[10px] tracking-widest text-blue-600"><Headset className="h-3.5 w-3.5" /> Suporte / Central 0800</FormLabel>
                        <FormControl>
                            <div className="relative">
                                <Input placeholder="(00) 0000-0000" {...field} onChange={(e) => field.onChange(handlePhoneMask(e.target.value))} className="h-10" />
                                {isWhatsApp(watchSupport || '') && (
                                    <div className="absolute right-3 top-2 flex items-center">
                                        <WhatsAppIcon className="h-4 w-4" />
                                    </div>
                                )}
                            </div>
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel className="flex items-center gap-2 font-bold uppercase text-[10px] tracking-widest"><Mail className="h-3.5 w-3.5 text-primary" /> E-mail da Promotora</FormLabel>
                        <FormControl><Input placeholder="contato@promotora.com" {...field} type="email" className="h-10" /></FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="managerEmail"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel className="flex items-center gap-2 font-bold uppercase text-[10px] tracking-widest text-blue-600"><Mail className="h-3.5 w-3.5" /> E-mail do Gerente</FormLabel>
                        <FormControl><Input placeholder="gerente@promotora.com" {...field} type="email" className="h-10" /></FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
            </div>
        </div>

        {/* SEÇÃO 3: ACESSO AO PORTAL */}
        <div className="space-y-4">
            <div className="flex items-center gap-3">
                <div className="h-px bg-primary/10 flex-1" />
                <span className="text-[9px] font-black uppercase tracking-[0.3em] text-primary/40 leading-none">Acesso ao Portal</span>
                <div className="h-px bg-primary/10 flex-1" />
            </div>

            <div className="bg-primary/5 p-5 rounded-3xl border border-primary/10 flex items-start gap-4 mb-2">
                <ShieldCheck className="h-6 w-6 text-primary shrink-0 mt-0.5" />
                <p className="text-[10px] font-bold text-primary/80 uppercase leading-relaxed tracking-widest">
                    As credenciais abaixo são protegidas por criptografia AES-256 e visualizadas apenas mediante solicitação via ícone de visibilidade.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                    control={form.control}
                    name="username"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel className="flex items-center gap-2 font-bold uppercase text-[10px] tracking-widest"><UserIcon className="h-3.5 w-3.5 text-primary" /> Usuário Portal</FormLabel>
                        <FormControl><Input placeholder="Login de acesso" {...field} className="h-10" /></FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="website"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel className="flex items-center gap-2 font-bold uppercase text-[10px] tracking-widest"><Globe className="h-3.5 w-3.5 text-primary" /> Link do Portal</FormLabel>
                        <FormControl><Input placeholder="https://sistema.promotora.com" {...field} className="h-10" /></FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel className="flex items-center gap-2 font-bold uppercase text-[10px] tracking-widest"><Lock className="h-3.5 w-3.5 text-primary" /> Senha Principal</FormLabel>
                        <FormControl>
                            <div className="relative">
                                <Input 
                                    type={showPassword ? "text" : "password"} 
                                    placeholder={isDecrypting && initialData?.password ? "Descriptografando..." : "Digite a senha"} 
                                    {...field} 
                                    className="h-10 pr-10 font-mono tracking-widest text-xs" 
                                    disabled={isDecrypting && initialData?.password}
                                />
                                <button 
                                    type="button" 
                                    onClick={(e) => { e.preventDefault(); setShowPassword(!showPassword); }}
                                    className="absolute right-3 top-2.5 text-muted-foreground hover:text-primary transition-colors"
                                >
                                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="secondaryPassword"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel className="flex items-center gap-2 font-bold uppercase text-[10px] tracking-widest text-blue-600"><KeyRound className="h-3.5 w-3.5" /> Senha Relatórios (Contrasenha)</FormLabel>
                        <FormControl>
                             <div className="relative">
                                <Input 
                                    type={showSecondaryPassword ? "text" : "password"} 
                                    placeholder={isDecrypting && initialData?.secondaryPassword ? "Descriptografando..." : "Senha alternativa"} 
                                    {...field} 
                                    className="h-10 pr-10 font-mono tracking-widest text-xs" 
                                    disabled={isDecrypting && initialData?.secondaryPassword}
                                />
                                <button 
                                    type="button" 
                                    onClick={(e) => { e.preventDefault(); setShowSecondaryPassword(!showSecondaryPassword); }}
                                    className="absolute right-3 top-2.5 text-muted-foreground hover:text-primary transition-colors"
                                >
                                    {showSecondaryPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
            </div>
        </div>

        {/* SEÇÃO 4: NOTAS EXTRAS */}
        <div className="space-y-4">
            <div className="flex items-center gap-3">
                <div className="h-px bg-primary/10 flex-1" />
                <span className="text-[9px] font-black uppercase tracking-[0.3em] text-primary/40 leading-none">Anotações Internas</span>
                <div className="h-px bg-primary/10 flex-1" />
            </div>

            <FormField
                control={form.control}
                name="observations"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel className="flex items-center gap-2 font-bold uppercase text-[10px] tracking-widest"><MessageSquareText className="h-3.5 w-3.5" /> Observações e Regras do Parceiro</FormLabel>
                    <FormControl><Textarea placeholder="Prazos, taxas médias, horários de corte..." {...field} className="min-h-[120px] rounded-3xl" /></FormControl>
                    <FormMessage />
                    </FormItem>
                )}
            />
        </div>
      </form>
    </Form>
  );
}