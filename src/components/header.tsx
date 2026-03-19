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
import { NotificationBell } from './notifications/notification-bell';
import { GlobalSearch } from './global-search';

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

  /**
   * 🛡️ MOTOR DE INICIAIS BLINDADO
   * Suporta nomes vazios, nulos, apenas espaços ou caracteres especiais sem quebrar.
   */
  const getInitials = (name?: string | null) => {
    if (!name || typeof name !== 'string' || name.trim() === '') return '..';
    
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length > 1) {
        const first = parts[0]?.[0] || '';
        const last = parts[parts.length - 1]?.[0] || '';
        return `${first}${last}`.toUpperCase();
    }
    
    return name.trim().substring(0, 2).toUpperCase();
  };

  const displayName = userProfile?.displayName || userProfile?.fullName || auth.currentUser?.email || 'Usuário';

  return (
    <header className={cn("flex h-14 items-center gap-4 border-b bg-card px-4 lg:h-[60px] lg:px-6", className)}>
      <SidebarTrigger />
      <div className="flex-1 flex items-center gap-4">
        <div className="hidden xl:block">
            <LiveClock />
        </div>
        <div className="flex-1 flex justify-center max-w-md mx-auto">
            <GlobalSearch />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <NotificationBell />
        <ThemeToggle />
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
            <Button variant="secondary" size="icon" className="rounded-full overflow-hidden">
                <Avatar>
                <AvatarImage src={userProfile?.photoURL || ''} data-ai-hint="rosto de pessoa" />
                <AvatarFallback className="font-bold">{getInitials(displayName)}</AvatarFallback>
                </Avatar>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
            <DropdownMenuLabel className="max-w-[200px] truncate">{displayName}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <Link href="/profile" passHref>
                <DropdownMenuItem className="cursor-pointer">Meu Perfil</DropdownMenuItem>
            </Link>
            <Link href="/settings" passHref>
                <DropdownMenuItem className="cursor-pointer">Configurações</DropdownMenuItem>
            </Link>
            <DropdownMenuItem className="cursor-pointer">Suporte</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="cursor-pointer text-destructive focus:text-destructive" onClick={handleSignOut}>Sair</DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
