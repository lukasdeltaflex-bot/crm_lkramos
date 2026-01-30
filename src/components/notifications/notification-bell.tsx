'use client';

import React, { useState, useEffect } from 'react';
import { Bell, Cake, BadgePercent, X, CalendarClock } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useCollection, useFirestore, useUser, useMemoFirebase } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import type { Customer, Proposal, Reminder } from '@/lib/types';
import { differenceInDays, format, isBefore, isToday, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import Link from 'next/link';
import { cn } from '@/lib/utils';

const STORAGE_KEY = 'lk-ramos-dismissed-notifications-v1';

export function NotificationBell() {
  const { user } = useUser();
  const firestore = useFirestore();
  const [dismissedIds, setDismissedIds] = useState<string[]>([]);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setDismissedIds(JSON.parse(saved));
      } catch (e) {
        localStorage.removeItem(STORAGE_KEY);
      }
    }
  }, []);

  const customersQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, 'customers'), where('ownerId', '==', user.uid));
  }, [firestore, user]);

  const proposalsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, 'loanProposals'), where('ownerId', '==', user.uid));
  }, [firestore, user]);

  const remindersQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    // Query simplificada para validar acesso à collection root /reminders
    return query(collection(firestore, 'reminders'));
  }, [firestore, user]);

  const { data: customers } = useCollection<Customer>(customersQuery);
  const { data: proposals } = useCollection<Proposal>(proposalsQuery);
  const { data: reminders } = useCollection<Reminder>(remindersQuery);

  const notifications = React.useMemo(() => {
    if (!isClient) return [];
    
    const alerts: { id: string; title: string; type: 'birthday' | 'commission' | 'reminder'; date: string; link: string }[] = [];
    const now = new Date();
    const todayStr = format(now, 'MM-dd');

    // Aniversários hoje
    customers?.forEach(c => {
      if (c.birthDate && c.birthDate.substring(5) === todayStr) {
        alerts.push({
          id: `bday-${c.id}-${todayStr}`,
          title: `Aniversário: ${c.name}`,
          type: 'birthday',
          date: 'Hoje',
          link: `/customers/${c.id}`
        });
      }
    });

    // Comissões atrasadas (> 7 dias)
    proposals?.forEach(p => {
      if ((p.status === 'Pago' || p.status === 'Saldo Pago') && p.commissionStatus === 'Pendente' && p.datePaidToClient) {
        const days = differenceInDays(now, new Date(p.datePaidToClient));
        if (days > 7) {
          alerts.push({
            id: `comm-${p.id}`,
            title: `Comissão Pendente: ${p.proposalNumber}`,
            type: 'commission',
            date: `${days} dias`,
            link: `/proposals?open=${p.id}`
          });
        }
      }
    });

    // Lembretes da Agenda (Filtro manual no cliente)
    reminders?.filter(r => r.status === 'pending' && r.userId === user?.uid).forEach(r => {
        const dDate = parseISO(r.dueDate);
        if (isToday(dDate) || isBefore(dDate, now)) {
            alerts.push({
                id: `rem-${r.id}`,
                title: `Retorno: ${r.title}`,
                type: 'reminder',
                date: isToday(dDate) ? 'Hoje' : 'Atrasado',
                link: '/agenda'
            });
        }
    });

    return alerts;
  }, [customers, proposals, reminders, isClient, user]);

  const visibleNotifications = React.useMemo(() => {
    return notifications.filter(n => !dismissedIds.includes(n.id));
  }, [notifications, dismissedIds]);

  const handleDismiss = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    const newDismissed = [...dismissedIds, id];
    setDismissedIds(newDismissed);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newDismissed));
  };

  const count = visibleNotifications.length;

  if (!isClient) return <Button variant="ghost" size="icon"><Bell className="h-5 w-5" /></Button>;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {count > 0 && (
            <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-red-500 hover:bg-red-600 text-[10px] animate-in zoom-in">
              {count}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <div className="flex items-center justify-between p-2 px-3">
            <DropdownMenuLabel className="p-0">Notificações</DropdownMenuLabel>
            {dismissedIds.length > 0 && (
                <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-auto p-0 text-[10px] text-muted-foreground hover:text-primary"
                    onClick={() => {
                        setDismissedIds([]);
                        localStorage.removeItem(STORAGE_KEY);
                    }}
                >
                    Restaurar Tudo
                </Button>
            )}
        </div>
        <DropdownMenuSeparator />
        {count === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">
            <Bell className="h-8 w-8 mx-auto mb-2 opacity-20" />
            Nenhum alerta novo.
          </div>
        ) : (
          <div className="max-h-96 overflow-y-auto">
            {visibleNotifications.map((n) => (
              <div key={n.id} className="relative group">
                <Link href={n.link} passHref>
                    <DropdownMenuItem className="cursor-pointer p-3 pr-10">
                    <div className="flex items-start gap-3">
                        {n.type === 'birthday' ? (
                          <Cake className="h-4 w-4 text-pink-500 mt-1" />
                        ) : n.type === 'commission' ? (
                          <BadgePercent className="h-4 w-4 text-orange-500 mt-1" />
                        ) : (
                          <CalendarClock className="h-4 w-4 text-blue-500 mt-1" />
                        )}
                        <div className="space-y-1 overflow-hidden">
                        <p className="text-sm font-medium leading-none truncate">{n.title}</p>
                        <p className="text-xs text-muted-foreground">{n.date}</p>
                        </div>
                    </div>
                    </DropdownMenuItem>
                </Link>
                <button
                    onClick={(e) => handleDismiss(e, n.id)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-muted rounded-md"
                    title="Remover"
                >
                    <X className="h-3 w-3 text-muted-foreground" />
                </button>
              </div>
            ))}
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}