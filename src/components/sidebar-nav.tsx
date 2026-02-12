'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from '@/components/ui/sidebar';
import { LayoutDashboard, FileText, Users, CircleDollarSign, Cog, User, CalendarClock, BookOpen } from 'lucide-react';

const links = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/customers', label: 'Clientes', icon: Users },
  { href: '/follow-ups', label: 'Retornos', icon: CalendarClock },
  { href: '/propostas', label: 'Propostas', icon: FileText, hidden: true }, // Map legacy
  { href: '/proposals', label: 'Propostas', icon: FileText },
  { href: '/financial', label: 'Financeiro', icon: CircleDollarSign },
];

const bottomLinks = [
    { href: '/manual', label: 'Guia do Usuário', icon: BookOpen },
    { href: '/profile', label: 'Meu Perfil', icon: User },
    { href: '/settings', label: 'Configurações', icon: Cog },
]

export function SidebarNav() {
  const pathname = usePathname();

  return (
    <>
    <SidebarMenu>
      {links.filter(l => !l.hidden).map((link) => {
        // Lógica de ativação inteligente: exata para o dashboard, ou por início de caminho para as outras seções
        const isActive = link.href === '/' 
            ? pathname === '/' 
            : pathname.startsWith(link.href);

        return (
            <SidebarMenuItem key={link.href}>
            <SidebarMenuButton
                asChild
                isActive={isActive}
                tooltip={link.label}
            >
                <Link href={link.href}>
                <link.icon />
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
                isActive={pathname.startsWith(link.href)}
                tooltip={link.label}
                >
                <Link href={link.href}>
                    <link.icon />
                    <span>{link.label}</span>
                </Link>
                </SidebarMenuButton>
            </SidebarMenuItem>
        ))}
     </SidebarMenu>
    </>
  );
}
