'use client';

import React, { useState, Suspense, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth, useUser } from '@/firebase';
import { sendEmailVerification } from 'firebase/auth';
import { toast } from '@/hooks/use-toast';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { MailCheck, Loader2 } from 'lucide-react';
import { Logo } from '@/components/logo';
import { Skeleton } from '@/components/ui/skeleton';

const FullPageLoader = () => (
    <div className="flex h-screen w-screen items-center justify-center bg-background">
      <div className="w-1/2 space-y-4">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
      </div>
    </div>
);


function VerifyEmailContent() {
  const auth = useAuth();
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get('email');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (user && user.emailVerified) {
        router.replace('/');
    }
  }, [user, router]);

  const handleResend = async () => {
    const userToVerify = auth.currentUser;
    if (!userToVerify) {
        toast({
            variant: 'destructive',
            title: 'Erro',
            description: 'Nenhum usuário logado para reenviar o e-mail. Por favor, tente fazer login novamente.',
        });
        return;
    }
    
    setIsLoading(true);
    try {
        await sendEmailVerification(userToVerify);
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

  if (isUserLoading || (user && user.emailVerified)) {
      return <FullPageLoader />;
  }

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
                Enviamos um link de confirmação para <span className="font-semibold text-foreground">{email || user?.email || 'seu e-mail'}</span>. Por favor, clique no link para ativar sua conta.
            </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
            <p className="text-sm text-muted-foreground">
                Não recebeu o e-mail? Verifique sua caixa de spam ou clique abaixo para reenviar.
            </p>
        </CardContent>
        <CardFooter className="flex-col gap-4">
            <Button onClick={handleResend} className="w-full" disabled={isLoading}>
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
        <Suspense fallback={<FullPageLoader />}>
            <VerifyEmailContent />
        </Suspense>
    )
}
