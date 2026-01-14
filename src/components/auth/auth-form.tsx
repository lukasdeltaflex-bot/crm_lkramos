
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
import { useAuth } from '@/firebase';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { Logo } from '../logo';

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
    try {
      if (type === 'login') {
        await signInWithEmailAndPassword(auth, data.email, data.password);
        toast({
          title: 'Login realizado com sucesso!',
        });
        router.push('/');
      } else {
        await createUserWithEmailAndPassword(auth, data.email, data.password);
        toast({
          title: 'Conta criada com sucesso!',
          description: 'Você já pode fazer o login.',
        });
        router.push('/login');
      }
    } catch (error: any) {
      console.error(error);
      let message = 'Ocorreu um erro. Tente novamente.';
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
        message = 'Email ou senha inválidos.';
      } else if (error.code === 'auth/email-already-in-use') {
        message = 'Este email já está em uso.';
      }
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: message,
      });
    }
  }

  const isSubmitting = form.formState.isSubmitting;

  return (
    <Card>
      <CardHeader className="text-center">
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
