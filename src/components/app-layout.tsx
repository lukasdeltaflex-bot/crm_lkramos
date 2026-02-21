'use client';

import React from 'react';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarInset,
  SidebarRail
} from '@/components/ui/sidebar';
import { Logo } from '@/components/logo';
import { SidebarNav } from '@/components/sidebar-nav';
import { Header } from '@/components/header';
import { AuthGuard } from './auth/auth-guard';
import { useTheme } from './theme-provider';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';
import Link from 'next/link';

export function AppLayout({ children }: { children: React.ReactNode }) {
  const currentYear = new Date().getFullYear();
  const { auraStyle, backgroundTexture } = useTheme();

  // 🛡️ FIX VISIBILIDADE: Ativa transparência se houver Aura OU Textura
  const isAtmosphericActive = auraStyle !== 'limpo' || backgroundTexture !== 'none';

  return (
      <AuthGuard>
        <SidebarProvider>
            <Sidebar className="print:hidden" collapsible="icon">
            <SidebarRail />
            <SidebarHeader>
                <Logo />
            </SidebarHeader>
            <SidebarContent>
                <SidebarNav />
            </SidebarContent>
            </Sidebar>
            <SidebarInset className={cn(
                "print:m-0 print:p-0 flex flex-col relative transition-all duration-1000 min-w-0 min-h-screen",
                isAtmosphericActive && `aura-${auraStyle} aura-active`,
                isAtmosphericActive && "bg-transparent/0 backdrop-blur-none"
            )}>
            <Header className="print:hidden z-20" />
            <main className="flex-1 p-4 sm:p-6 print:p-0 z-10 w-full relative">
                <div className="max-w-full">
                    {children}
                </div>
            </main>
            
            <footer className={cn(
                "mt-auto py-6 px-8 border-t bg-card text-[11px] text-muted-foreground flex flex-col sm:flex-row justify-between items-center gap-4 print:hidden z-10 transition-all",
                isAtmosphericActive && "bg-card/80 backdrop-blur-xl border-t-white/10 dark:border-t-white/5"
            )}>
                <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4">
                    <p className="font-black uppercase tracking-widest text-foreground/40">© {currentYear} LK RAMOS</p>
                    <Separator orientation="vertical" className="hidden sm:block h-3 bg-border/50" />
                    <p className="font-bold uppercase tracking-tighter opacity-60">Gestão de Propostas de Alta Performance</p>
                </div>
                <div className="flex items-center gap-6">
                    <Link href="/terms" className="font-black uppercase tracking-widest text-foreground/50 hover:text-primary transition-colors">Termos de Uso</Link>
                    <Link href="/privacy" className="font-black uppercase tracking-widest text-foreground/50 hover:text-primary transition-colors">Privacidade</Link>
                </div>
            </footer>
            </SidebarInset>
        </SidebarProvider>
      </AuthGuard>
  );
}
