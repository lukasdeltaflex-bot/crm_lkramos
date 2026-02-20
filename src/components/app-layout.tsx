'use client';

import React from 'react';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarInset,
  SidebarTrigger,
  SidebarRail
} from '@/components/ui/sidebar';
import { Logo } from '@/components/logo';
import { SidebarNav } from '@/components/sidebar-nav';
import { Header } from '@/components/header';
import { AuthGuard } from './auth/auth-guard';
import { useTheme } from './theme-provider';
import { cn } from '@/lib/utils';

export function AppLayout({ children }: { children: React.ReactNode }) {
  const currentYear = new Date().getFullYear();
  const { auraStyle } = useTheme();

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
                auraStyle !== 'limpo' && `aura-${auraStyle}`
            )}>
            <Header className="print:hidden z-20" />
            <main className="flex-1 p-4 sm:p-6 print:p-0 z-10 w-full relative">
                <div className="max-w-full">
                    {children}
                </div>
            </main>
            
            <footer className="mt-auto py-4 px-6 border-t bg-muted/20 text-[10px] text-muted-foreground flex flex-col sm:flex-row justify-between items-center gap-2 print:hidden z-10">
                <p>© {currentYear} LK RAMOS Gestão de Propostas. Todos os direitos reservados.</p>
                <div className="flex gap-4">
                    <a href="/terms" className="hover:text-primary transition-colors">Termos de Uso</a>
                    <a href="/privacy" className="hover:text-primary transition-colors">Privacidade</a>
                </div>
            </footer>
            </SidebarInset>
        </SidebarProvider>
      </AuthGuard>
  );
}