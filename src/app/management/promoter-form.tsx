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
import { Loader2, Save, Building2, Phone, User as UserIcon, Headset, MessageSquareText, Mail } from 'lucide-react';
import { handlePhoneMask, isWhatsApp, getWhatsAppUrl } from '@/lib/utils';
import { WhatsAppIcon } from '@/components/icons/whatsapp-icon';

const promoterSchema = z.object({
  name: z.string().min(2, 'O nome da promotora é obrigatório.'),
  contactName: z.string().optional(),
  phone: z.string().optional(),
  whatsapp: z.string().optional(),
  supportPhone: z.string().optional(),
  email: z.string().email('E-mail inválido.').or(z.literal('')).optional(),
  managerEmail: z.string().email('E-mail inválido.').or(z.literal('')).optional(),
  observations: z.string().optional(),
});

type PromoterFormValues = z.infer<typeof promoterSchema>;

interface PromoterFormProps {
  initialData?: any;
  onSubmit: (data: PromoterFormValues) => void;
  isSaving?: boolean;
}

export function PromoterForm({ initialData, onSubmit, isSaving = false }: PromoterFormProps) {
  const form = useForm<PromoterFormValues>({
    resolver: zodResolver(promoterSchema),
    defaultValues: initialData || {
      name: '',
      contactName: '',
      phone: '',
      whatsapp: '',
      supportPhone: '',
      email: '',
      managerEmail: '',
      observations: '',
    },
  });

  const watchWhatsapp = form.watch('whatsapp');
  const watchSupport = form.watch('supportPhone');

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-2 font-bold uppercase text-[10px] tracking-widest"><Building2 className="h-3.5 w-3.5 text-primary" /> Nome da Promotora *</FormLabel>
              <FormControl><Input placeholder="Ex: Master Promotora" {...field} className="font-bold" /></FormControl>
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
                    <FormLabel className="flex items-center gap-2 font-bold uppercase text-[10px] tracking-widest"><UserIcon className="h-3.5 w-3.5 text-primary" /> Nome do Gerente</FormLabel>
                    <FormControl><Input placeholder="Ex: Maria Clara" {...field} /></FormControl>
                    </FormItem>
                )}
            />
            <FormField
                control={form.control}
                name="supportPhone"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel className="flex items-center gap-2 font-bold uppercase text-[10px] tracking-widest text-blue-600"><Headset className="h-3.5 w-3.5" /> Suporte / Central</FormLabel>
                    <FormControl>
                        <div className="relative">
                            <Input placeholder="(00) 0000-0000" {...field} onChange={(e) => field.onChange(handlePhoneMask(e.target.value))} />
                            {isWhatsApp(watchSupport || '') && (
                                <a href={getWhatsAppUrl(watchSupport!)} target="_blank" rel="noopener noreferrer" className="absolute right-3 top-2.5 hover:scale-110 transition-transform">
                                    <WhatsAppIcon className="h-4 w-4" />
                                </a>
                            )}
                        </div>
                    </FormControl>
                    </FormItem>
                )}
            />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel className="flex items-center gap-2 font-bold uppercase text-[10px] tracking-widest"><Phone className="h-3.5 w-3.5 text-primary" /> Telefone Fixo</FormLabel>
                    <FormControl><Input placeholder="(00) 0000-0000" {...field} onChange={(e) => field.onChange(handlePhoneMask(e.target.value))} /></FormControl>
                    </FormItem>
                )}
            />
            <FormField
                control={form.control}
                name="whatsapp"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel className="flex items-center gap-2 font-bold uppercase text-[10px] tracking-widest text-green-600"><Phone className="h-3.5 w-3.5" /> WhatsApp Gerente</FormLabel>
                    <FormControl>
                        <div className="relative">
                            <Input placeholder="(00) 00000-0000" {...field} onChange={(e) => field.onChange(handlePhoneMask(e.target.value))} />
                            {isWhatsApp(watchWhatsapp || '') && (
                                <a href={getWhatsAppUrl(watchWhatsapp!)} target="_blank" rel="noopener noreferrer" className="absolute right-3 top-2.5 hover:scale-110 transition-transform">
                                    <WhatsAppIcon className="h-4 w-4" />
                                </a>
                            )}
                        </div>
                    </FormControl>
                    </FormItem>
                )}
            />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel className="flex items-center gap-2 font-bold uppercase text-[10px] tracking-widest"><Mail className="h-3.5 w-3.5 text-primary" /> E-mail Promotora</FormLabel>
                    <FormControl><Input placeholder="contato@promotora.com" {...field} type="email" /></FormControl>
                    <FormMessage />
                    </FormItem>
                )}
            />
            <FormField
                control={form.control}
                name="managerEmail"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel className="flex items-center gap-2 font-bold uppercase text-[10px] tracking-widest"><Mail className="h-3.5 w-3.5 text-blue-600" /> E-mail do Gerente</FormLabel>
                    <FormControl><Input placeholder="gerente@promotora.com" {...field} type="email" /></FormControl>
                    <FormMessage />
                    </FormItem>
                )}
            />
        </div>

        <FormField
          control={form.control}
          name="observations"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-2 font-bold uppercase text-[10px] tracking-widest"><MessageSquareText className="h-3.5 w-3.5" /> Anotações Internas</FormLabel>
              <FormControl><Textarea placeholder="Prazos, taxas médias, horários de corte..." {...field} className="min-h-[100px]" /></FormControl>
            </FormItem>
          )}
        />

        <div className="flex justify-end pt-4 border-t">
          <Button type="submit" disabled={isSaving} className="rounded-full px-8 h-12 font-black uppercase text-xs tracking-widest shadow-xl bg-primary">
            {isSaving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Gravando...</> : <><Save className="mr-2 h-4 w-4" /> Salvar Cadastro</>}
          </Button>
        </div>
      </form>
    </Form>
  );
}
