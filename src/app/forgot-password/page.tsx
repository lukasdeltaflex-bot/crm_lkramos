'use client';

import React, { useState } from 'react';
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
import { toast } from '@/hooks/use-toast';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import Link from 'next/link';
import { useAuth } from '@/firebase';
import { sendPasswordResetEmail } from 'firebase/auth';
import { Logo } from '@/components/logo';
import { Loader2, Mail, ArrowLeft } from 'lucide-react';

const schema = z.object({
  email: z.string().email('Email inválido.'),
});

type FormValues = z.infer<typeof schema>;

export default function ForgotPasswordPage() {
  const auth = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      email: '',
    },
  });

  async function onSubmit(data: FormValues) {
    setIsSubmitting(true);
    try {
      await sendPasswordResetEmail(auth, data.email);
      toast({
        title: 'E-mail enviado!',
        description: 'Verifique sua caixa de entrada para redefinir sua senha.',
      });
      form.reset();
    } catch (error: any) {
      console.error("Reset Error:", error);
      let message = 'Falha ao solicitar redefinição.';
      
      if (error.code === 'auth/user-not-found') {
        message = 'E-mail não encontrado em nossa base.';
      } else if (error.code === 'auth/invalid-email') {
        message = 'Formato de e-mail inválido.';
      } else if (error.code === 'auth/too-many-requests') {
        message = 'Muitas solicitações. Tente novamente em alguns minutos.';
      }

      toast({
        variant: 'destructive',
        title: 'Erro na Recuperação',
        description: message,
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <Card className="w-full max-w-sm border-border/50 shadow-md">
        <CardHeader className="items-center text-center">
          <div className='flex justify-center mb-4'>
              <Logo />
          </div>
          <CardTitle>Recuperar Senha</CardTitle>
          <CardDescription>
            Informe seu e-mail cadastrado para receber o link de redefinição oficial.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email Cadastrado</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="seu@email.com"
                        {...field}
                        disabled={isSubmitting}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full h-11 font-bold" disabled={isSubmitting}>
                {isSubmitting ? (
                    <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Enviando...
                    </>
                ) : (
                    <>
                        <Mail className="mr-2 h-4 w-4" />
                        Enviar Instruções
                    </>
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex justify-center text-sm">
          <Link href="/login" className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors font-medium">
            <ArrowLeft className="h-3 w-3" />
            Voltar para o Login
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}
