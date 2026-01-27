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
import { useAuth, useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { signOut } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import type { UserProfile } from '@/lib/types';
import { doc } from 'firebase/firestore';
import { ThemeToggle } from '@/components/theme-toggle';
import { LiveClock } from './dashboard/live-clock';

export function Header({ className }: { className?: string }) {
  const auth = useAuth();
  const router = useRouter();
  const firestore = useFirestore();

  const userProfileDocRef = useMemoFirebase(() => {
    if (!auth.currentUser || !firestore) return null;
    return doc(firestore, 'users', auth.currentUser.uid);
  }, [firestore, auth.currentUser]);

  const { data: userProfile } = useDoc<UserProfile>(userProfileDocRef);

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

  const getInitials = (name?: string | null) => {
    if (!name) return '..';
    const names = name.split(' ');
    if (names.length > 1) {
        return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const displayName = userProfile?.displayName || userProfile?.fullName || auth.currentUser?.email;

  return (
    <header className={cn("flex h-14 items-center gap-4 border-b bg-card px-4 lg:h-[60px] lg:px-6", className)}>
      <SidebarTrigger />
      <div className="w-full flex-1">
        <LiveClock />
      </div>
      <ThemeToggle />
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="secondary" size="icon" className="rounded-full">
            <Avatar>
              <AvatarImage src={userProfile?.photoURL || ''} data-ai-hint="rosto de pessoa" />
              <AvatarFallback>{getInitials(displayName)}</AvatarFallback>
            </Avatar>
            <span className="sr-only">Alternar menu de usuário</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Minha Conta</DropdownMenuLabel>
          <DropdownMenuSeparator />
           <Link href="/profile" passHref>
            <DropdownMenuItem>Meu Perfil</DropdownMenuItem>
          </Link>
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
