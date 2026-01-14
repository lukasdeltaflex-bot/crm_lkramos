
'use client';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { SidebarTrigger } from '@/components/ui/sidebar';
import Link from 'next/link';
import { useAuth } from '@/firebase';
import { signOut } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { toast } from '@/hooks/use-toast';

export function Header() {
  const auth = useAuth();
  const router = useRouter();

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      toast({
        title: 'Você saiu da sua conta.',
      });
      router.push('/login');
    } catch (error) {
      console.error('Error signing out: ', error);
      toast({
        variant: 'destructive',
        title: 'Erro ao sair',
        description: 'Não foi possível fazer o logout. Tente novamente.',
      });
    }
  };

  const getInitials = (email?: string | null) => {
    if (!email) return '..';
    return email.substring(0, 2).toUpperCase();
  };

  return (
    <header className="flex h-14 items-center gap-4 border-b bg-card px-4 lg:h-[60px] lg:px-6">
      <SidebarTrigger className="md:hidden" />
      <div className="w-full flex-1">
        {/* Can be used for a global search */}
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="secondary" size="icon" className="rounded-full">
            <Avatar>
              <AvatarImage src={auth.currentUser?.photoURL || ''} data-ai-hint="person face" />
              <AvatarFallback>{getInitials(auth.currentUser?.email)}</AvatarFallback>
            </Avatar>
            <span className="sr-only">Alternar menu de usuário</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Minha Conta</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <Link href="/settings" passHref>
            <DropdownMenuItem>Configurações</DropdownMenuItem>
          </Link>
          <DropdownMenuItem>Suporte</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleSignOut}>Sair</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
