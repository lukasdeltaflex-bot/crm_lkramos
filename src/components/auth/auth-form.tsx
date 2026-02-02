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
    // MODO EMERGÊNCIA: Login desativado até configuração de chave real no firebase.ts
    toast({
        variant: 'destructive',
        title: 'Sistema em Modo de Segurança',
        description: 'Configure sua API KEY real no arquivo src/firebase/firebase.ts e descomente as funções de login no código.',
    });
    
    console.warn("⚠️ Tentativa de login interceptada pelo modo de segurança.");
    console.log("Dados do formulário:", data.email);

    /* 
    COMENTADO PARA EVITAR CRASH POR API KEY INVÁLIDA (CONFORME SOLICITADO)
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
        toast({
          title: 'Login realizado com sucesso!',
        });
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
          title: 'Conta criada com sucesso!',
          description: 'Enviamos um link de verificação para o seu e-mail.',
        });
        
        router.push(`/verify-email?email=${data.email}`);
      }
    } catch (error: any) {
      console.error(error);
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Falha na autenticação. Verifique os logs do console.',
      });
    }
    */
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
      <CardFooter className="text-sm">
        {type === 'login' ? (
          <p>
            Não tem uma conta?{' '}
            <Link href="/signup" className="font-semibold text-primary hover:underline">
              Cadastre-se
            </Link>
          </p>
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
