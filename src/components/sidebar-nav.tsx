'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from '@/components/ui/sidebar';
import { LayoutDashboard, FileText, Users, CircleDollarSign, Cog } from 'lucide-react';

const links = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/proposals', label: 'Propostas', icon: FileText },
  { href: '/customers', label: 'Clientes', icon: Users },
  { href: '/financial', label: 'Financeiro', icon: CircleDollarSign },
];

const bottomLinks = [
    { href: '/settings', label: 'Configurações', icon: Cog },
]

export function SidebarNav() {
  const pathname = usePathname();

  return (
    <>
    <SidebarMenu>
      {links.map((link) => (
        <SidebarMenuItem key={link.href}>
          <Link href={link.href} passHref>
            <SidebarMenuButton
              asChild
              isActive={pathname === link.href}
              tooltip={link.label}
            >
              <span>
                <link.icon />
                <span>{link.label}</span>
              </span>
            </SidebarMenuButton>
          </Link>
        </SidebarMenuItem>
      ))}
    </SidebarMenu>
    <div className="flex-grow" />
     <SidebarMenu>
        {bottomLinks.map((link) => (
            <SidebarMenuItem key={link.href}>
            <Link href={link.href} passHref>
                <SidebarMenuButton
                asChild
                isActive={pathname === link.href}
                tooltip={link.label}
                >
                <span>
                    <link.icon />
                    <span>{link.label}</span>
                </span>
                </SidebarMenuButton>
            </Link>
            </SidebarMenuItem>
        ))}
     </SidebarMenu>
    </>
  );
}
