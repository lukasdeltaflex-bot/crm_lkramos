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
import { Loader2, Save, Landmark, Link as LinkIcon, Lock, User, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { useState, useEffect } from 'react';
import { encryptPassword, decryptPassword } from '@/lib/crypto-utils';
import { useUser } from '@/firebase';

const bankSchema = z.object({
  bankName: z.string().min(2, 'Nome do banco é obrigatório.'),
  accessUrl: z.string().optional(),
  login: z.string().min(1, 'Login obrigatório.').or(z.literal('')),
  password: z.string().min(1, 'Senha obrigatória.').or(z.literal('')),
  observations: z.string().optional(),
});

type BankFormValues = z.infer<typeof bankSchema>;

interface BankFormProps {
  initialData?: any;
  onSubmit: (data: any) => void;
  isSaving?: boolean;
}

export function BankForm({ initialData, onSubmit, isSaving = false }: BankFormProps) {
  const { user } = useUser();
  const [showPassword, setShowPassword] = useState(false);
  const [isDecrypting, setIsDecrypting] = useState(false);

  const form = useForm<BankFormValues>({
    resolver: zodResolver(bankSchema),
    defaultValues: {
      bankName: initialData?.bankName || '',
      accessUrl: initialData?.accessUrl || '',
      login: initialData?.login || '',
      password: '', // Senha em texto limpo para o form
      observations: initialData?.observations || '',
    },
  });

  // 🛡️ DESCRIPTOGRAFIA SEGURA PARA EDIÇÃO
  useEffect(() => {
    async function loadPassword() {
        if (initialData?.password && user?.uid) {
            setIsDecrypting(true);
            const decrypted = await decryptPassword(initialData.password, user.uid);
            form.setValue('password', decrypted);
            setIsDecrypting(false);
        }
    }
    loadPassword();
  }, [initialData, user, form]);

  const handleFormSubmit = async (values: BankFormValues) => {
    if (!user?.uid) return;
    
    // Criptografa antes de salvar
    const encrypted = await encryptPassword(values.password, user.uid);
    onSubmit({
        ...values,
        password: encrypted
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6">
        <div className="bg-primary/5 p-4 rounded-xl border border-primary/10 flex items-start gap-3 mb-4">
            <ShieldCheck className="h-5 w-5 text-primary shrink-0 mt-0.5" />
            <p className="text-[10px] font-bold text-primary uppercase leading-relaxed tracking-widest">
                Proteção AES-256: Sua senha será criptografada no seu dispositivo e salva como dado ilegível no banco de dados.
            </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
                control={form.control}
                name="bankName"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel className="flex items-center gap-2"><Landmark className="h-3.5 w-3.5" /> Nome do Banco</FormLabel>
                    <FormControl><Input placeholder="Ex: Banco Itaú" {...field} /></FormControl>
                    <FormMessage />
                    </FormItem>
                )}
            />
            <FormField
                control={form.control}
                name="accessUrl"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel className="flex items-center gap-2"><LinkIcon className="h-3.5 w-3.5" /> Link do Sistema</FormLabel>
                    <FormControl><Input placeholder="https://..." {...field} /></FormControl>
                    <FormMessage />
                    </FormItem>
                )}
            />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
                control={form.control}
                name="login"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel className="flex items-center gap-2"><User className="h-3.5 w-3.5" /> Usuário / CPF</FormLabel>
                    <FormControl><Input placeholder="Digite seu login" {...field} /></FormControl>
                    <FormMessage />
                    </FormItem>
                )}
            />
            <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel className="flex items-center gap-2"><Lock className="h-3.5 w-3.5" /> Senha Segura</FormLabel>
                    <FormControl>
                        <div className="relative">
                            <Input 
                                type={showPassword ? "text" : "password"} 
                                placeholder={isDecrypting ? "Descriptografando..." : "Sua senha secreta"} 
                                className="pr-10 font-mono" 
                                {...field} 
                                disabled={isDecrypting}
                            />
                            <button 
                                type="button" 
                                onClick={() => setShowPassword(!showPassword)}
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
        </div>

        <FormField
          control={form.control}
          name="observations"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Informações Adicionais</FormLabel>
              <FormControl><Textarea placeholder="Token, chave de segurança ou observações..." {...field} /></FormControl>
            </FormItem>
          )}
        />

        <div className="flex justify-end pt-4 border-t">
          <Button type="submit" disabled={isSaving || isDecrypting} className="rounded-full px-8 h-12 font-black uppercase text-xs tracking-widest shadow-xl bg-primary">
            {isSaving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Protegendo...</> : <><Save className="mr-2 h-4 w-4" /> Blindar Credencial</>}
          </Button>
        </div>
      </form>
    </Form>
  );
}