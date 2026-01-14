import React from 'react';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarInset,
} from '@/components/ui/sidebar';
import { Logo } from '@/components/logo';
import { SidebarNav } from '@/components/sidebar-nav';
import { Header } from '@/components/header';
import { AuthGuard } from '@/components/auth/auth-guard';

export function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <SidebarProvider>
        <Sidebar>
          <SidebarHeader>
            <Logo />
          </SidebarHeader>
          <SidebarContent>
            <SidebarNav />
          </SidebarContent>
        </Sidebar>
        <SidebarInset>
          <Header />
          <main className="flex-1 p-4 sm:p-6">{children}</main>
        </SidebarInset>
      </SidebarProvider>
    </AuthGuard>
  );
}
