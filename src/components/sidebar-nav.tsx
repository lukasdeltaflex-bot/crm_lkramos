'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from '@/components/ui/sidebar';
import { LayoutDashboard, FileText, Users, CircleDollarSign, Cog, User, CalendarClock } from 'lucide-react';

const links = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/customers', label: 'Clientes', icon: Users },
  { href: '/follow-ups', label: 'Retornos', icon: CalendarClock },
  { href: '/proposals', label: 'Propostas', icon: FileText },
  { href: '/financial', label: 'Financeiro', icon: CircleDollarSign },
];

const bottomLinks = [
    { href: '/profile', label: 'Meu Perfil', icon: User },
    { href: '/settings', label: 'Configurações', icon: Cog },
]

export function SidebarNav() {
  const pathname = usePathname();

  return (
    <>
    <SidebarMenu>
      {links.map((link) => (
        <SidebarMenuItem key={link.href}>
          <Link href={link.href} passHref legacyBehavior>
            <SidebarMenuButton
              asChild
              isActive={pathname === link.href}
              tooltip={link.label}
            >
              <a className="flex items-center gap-2">
                <link.icon />
                <span>{link.label}</span>
              </a>
            </SidebarMenuButton>
          </Link>
        </SidebarMenuItem>
      ))}
    </SidebarMenu>
    <div className="flex-grow" />
     <SidebarMenu>
        {bottomLinks.map((link) => (
            <SidebarMenuItem key={link.href}>
            <Link href={link.href} passHref legacyBehavior>
                <SidebarMenuButton
                asChild
                isActive={pathname === link.href}
                tooltip={link.label}
                >
                <a className="flex items-center gap-2">
                    <link.icon />
                    <span>{link.label}</span>
                </a>
                </SidebarMenuButton>
            </Link>
            </SidebarMenuItem>
        ))}
     </SidebarMenu>
    </>
  );
}
