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
import { useAuth, useFirestore } from '@/firebase';
import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
  signInWithEmailAndPassword,
} from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { Logo } from '../logo';
import type { UserProfile } from '@/lib/types';


const loginSchema = z.object({
  email: z.string().email('Email inválido.'),
  password: z.string().min(6, 'A senha deve ter pelo menos 6 caracteres.'),
});

const signupSchema = z
  .object({
    email: z.string().email('Email inválido.'),
    password: z.string().min(6, 'A senha deve ter pelo menos 6 caracteres.'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'As senhas não coincidem.',
    path: ['confirmPassword'],
  });

interface AuthFormProps {
  type: 'login' | 'signup';
}

export function AuthForm({ type }: AuthFormProps) {
  const auth = useAuth();
  const firestore = useFirestore();
  const router = useRouter();

  const formSchema = type === 'login' ? loginSchema : signupSchema;
  type FormValues = z.infer<typeof formSchema>;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
      ...(type === 'signup' && { confirmPassword: '' }),
    },
  });

  async function handleFormSubmit(data: FormValues) {
    // Verificação de segurança: Se a chave ainda for a de exemplo, avisamos o usuário
    if (auth.app.options.apiKey === "AIzaSyXXXXXXXXXXXX") {
        toast({
            variant: 'destructive',
            title: 'Configuração Pendente',
            description: 'Você precisa colar sua API KEY real no arquivo src/firebase/firebase.ts para logar.',
        });
        return;
    }

    try {
      if (type === 'login') {
        const userCredential = await signInWithEmailAndPassword(auth, data.email, data.password);
        
        if (!userCredential.user.emailVerified) {
          toast({
            variant: 'destructive',
            title: 'E-mail não verificado',
            description: 'Por favor, verifique seu e-mail antes de fazer login.',
          });
          await auth.signOut();
          router.push(`/verify-email?email=${data.email}`);
          return;
        }
        
        toast({ title: 'Bem-vindo de volta!' });
        router.push('/');
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
        const user = userCredential.user;
        
        if (user && firestore) {
          const userProfileRef = doc(firestore, 'users', user.uid);
          const newUserProfile: UserProfile = {
            uid: user.uid,
            email: user.email!,
            displayName: user.email!.split('@')[0],
          };
          await setDoc(userProfileRef, newUserProfile);
          await sendEmailVerification(user);
        }

        toast({
          title: 'Conta criada!',
          description: 'Verifique seu e-mail para ativar o acesso.',
        });
        
        router.push(`/verify-email?email=${data.email}`);
      }
    } catch (error: any) {
      console.error("Auth Error:", error);
      let message = 'Falha na autenticação.';
      
      if (error.code === 'auth/invalid-credential' || error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
        message = 'E-mail ou senha incorretos.';
      } else if (error.code === 'auth/email-already-in-use') {
        message = 'Este e-mail já está cadastrado.';
      } else if (error.code === 'auth/api-key-not-valid') {
        message = 'Erro crítico: A API KEY no arquivo firebase.ts é inválida ou está restrita.';
      }

      toast({
        variant: 'destructive',
        title: 'Erro no Acesso',
        description: message,
      });
    }
  }

  const isSubmitting = form.formState.isSubmitting;

  return (
    <Card className="border-border/50 shadow-md">
      <CardHeader className="items-center text-center">
        <div className='flex justify-center mb-4'>
            <Logo />
        </div>
        <CardTitle>{type === 'login' ? 'Acessar sua conta' : 'Criar nova conta'}</CardTitle>
        <CardDescription>
          {type === 'login'
            ? 'Use seu email e senha para entrar.'
            : 'Preencha os campos para se cadastrar.'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="seu@email.com"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Senha</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="••••••••" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {type === 'signup' && (
              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirmar Senha</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting
                ? 'Aguarde...'
                : type === 'login'
                ? 'Entrar'
                : 'Criar Conta'}
            </Button>
          </form>
        </Form>
      </CardContent>
      <CardFooter className="text-sm flex flex-col items-center gap-3">
        {type === 'login' ? (
          <>
            <p>
              Não tem uma conta?{' '}
              <Link href="/signup" className="font-semibold text-primary hover:underline">
                Cadastre-se
              </Link>
            </p>
            <Link href="/forgot-password" title="Recuperar Senha" className="text-muted-foreground hover:text-primary transition-colors text-xs font-medium">
                Esqueci minha senha
            </Link>
          </>
        ) : (
          <p>
            Já tem uma conta?{' '}
            <Link href="/login" className="font-semibold text-primary hover:underline">
              Faça login
            </Link>
          </p>
        )}
      </CardFooter>
    </Card>
  );
}
