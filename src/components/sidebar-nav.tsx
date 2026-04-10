'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  useSidebar
} from '@/components/ui/sidebar';
import { LayoutDashboard, FileText, Users, CircleDollarSign, Cog, User, CalendarClock, BookOpen, NotebookTabs, Trash2, Calculator } from 'lucide-react';

const links = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/customers', label: 'Clientes', icon: Users },
  { href: '/follow-ups', label: 'Retornos', icon: CalendarClock },
  { href: '/proposals', label: 'Propostas', icon: FileText },
  { href: '/financial', label: 'Financeiro', icon: CircleDollarSign },
  { href: '/management', label: 'Gestão & Notícias', icon: NotebookTabs },
  { href: '/portability-simulator', label: 'Simul. Portabilidade', icon: Calculator },
];

const bottomLinks = [
    { href: '/trash', label: 'Lixeira', icon: Trash2 },
    { href: '/manual', label: 'Guia do Usuário', icon: BookOpen },
    { href: '/profile', label: 'Meu Perfil', icon: User },
    { href: '/settings', label: 'Configurações', icon: Cog },
]

export function SidebarNav() {
  const pathname = usePathname();
  const { isMobile, setOpenMobile } = useSidebar();

  const handleNavClick = () => {
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  return (
    <>
    <SidebarMenu>
      {links.map((link) => {
        // 🛡️ SEGURANÇA: pathname pode ser null no Next.js App Router em certos estados de renderização
        const isActive = !pathname 
            ? false 
            : link.href === '/' 
                ? pathname === '/' 
                : pathname.startsWith(link.href);

        return (
            <SidebarMenuItem key={link.href}>
            <SidebarMenuButton
                asChild
                isActive={isActive}
                tooltip={link.label}
                onClick={handleNavClick}
            >
                <Link href={link.href} className="flex items-center gap-2">
                    <link.icon className="shrink-0" />
                    <span>{link.label}</span>
                </Link>
            </SidebarMenuButton>
            </SidebarMenuItem>
        )
      })}
    </SidebarMenu>
    <div className="flex-grow" />
     <SidebarMenu>
        {bottomLinks.map((link) => (
            <SidebarMenuItem key={link.href}>
                <SidebarMenuButton
                asChild
                isActive={pathname?.startsWith(link.href)}
                tooltip={link.label}
                onClick={handleNavClick}
                >
                <Link href={link.href} className="flex items-center gap-2">
                    <link.icon className="shrink-0" />
                    <span>{link.label}</span>
                </Link>
                </SidebarMenuButton>
            </SidebarMenuItem>
        ))}
     </SidebarMenu>
    </>
  );
}
