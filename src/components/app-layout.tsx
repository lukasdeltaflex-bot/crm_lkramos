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

export function AppLayout({ children }: { children: React.ReactNode }) {
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
            <SidebarInset className="print:m-0 print:p-0">
            <Header className="print:hidden" />
            <main className="flex-1 p-4 sm:p-6 print:p-0">{children}</main>
            </SidebarInset>
        </SidebarProvider>
      </AuthGuard>
  );
}
