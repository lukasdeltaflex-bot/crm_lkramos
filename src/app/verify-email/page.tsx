
'use client';

import React, { useState, Suspense } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/firebase';
import { sendEmailVerification, Auth, User } from 'firebase/auth';
import { toast } from '@/hooks/use-toast';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { MailCheck, Loader2 } from 'lucide-react';
import { Logo } from '@/components/logo';

function VerifyEmailContent() {
  const auth = useAuth();
  const searchParams = useSearchParams();
  const email = searchParams.get('email');
  const [isLoading, setIsLoading] = useState(false);

  const handleResend = async () => {
    if (!auth.currentUser) {
        toast({
            variant: 'destructive',
            title: 'Erro',
            description: 'Nenhum usuário logado para reenviar o e-mail. Por favor, tente fazer login novamente.',
        });
        return;
    }
    
    setIsLoading(true);
    try {
        await sendEmailVerification(auth.currentUser);
        toast({
            title: 'E-mail Reenviado!',
            description: 'Um novo link de verificação foi enviado para o seu e-mail.',
        });
    } catch (error: any) {
        console.error('Error resending verification email:', error);
        toast({
            variant: 'destructive',
            title: 'Erro ao reenviar',
            description: 'Não foi possível reenviar o e-mail. Tente novamente mais tarde.',
        });
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="items-center text-center">
            <div className='mb-4'>
                <Logo />
            </div>
            <MailCheck className="h-12 w-12 text-primary" />
            <CardTitle className="mt-4">Verifique seu E-mail</CardTitle>
            <CardDescription>
                Enviamos um link de confirmação para <span className="font-semibold text-foreground">{email || 'seu e-mail'}</span>. Por favor, clique no link para ativar sua conta.
            </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
            <p className="text-sm text-muted-foreground">
                Não recebeu o e-mail? Verifique sua caixa de spam ou clique abaixo para reenviar.
            </p>
        </CardContent>
        <CardFooter className="flex-col gap-4">
            <Button onClick={handleResend} className="w-full" disabled={isLoading || !auth.currentUser}>
                {isLoading ? (
                    <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Reenviando...
                    </>
                ) : (
                    'Reenviar E-mail de Verificação'
                )}
            </Button>
            <Link href="/login" className="text-sm text-primary hover:underline">
                Voltar para o Login
            </Link>
        </CardFooter>
      </Card>
    </div>
  );
}


export default function VerifyEmailPage() {
    return (
        <Suspense fallback={<div>Carregando...</div>}>
            <VerifyEmailContent />
        </Suspense>
    )
}
