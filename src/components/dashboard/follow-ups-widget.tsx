
'use client';

import React, { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CalendarClock, Phone, CheckCircle2, ChevronRight, Clock } from 'lucide-react';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, orderBy, limit } from 'firebase/firestore';
import type { FollowUp } from '@/lib/types';
import { format, parseISO, isToday, isBefore, startOfDay, addDays, isSameDay } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';

export function FollowUpsWidget() {
  const { user } = useUser();
  const firestore = useFirestore();

  // 🛡️ REATIVIDADE TOTAL: O useMemoFirebase agora depende do user.uid
  // Isso garante que o widget seja reconstruído instantaneamente quando uma ação ocorre.
  const followUpsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(
      collection(firestore, 'users', user.uid, 'followUps'),
      where('status', '==', 'pending'),
      orderBy('dueDate', 'asc'),
      limit(5)
    );
  }, [firestore, user]);

  const { data: followUps, isLoading } = useCollection<FollowUp>(followUpsQuery);

  const getStatusInfo = (dueDate: string) => {
    const date = parseISO(dueDate);
    const now = new Date();
    if (isToday(date)) return { label: 'Hoje', className: 'bg-yellow-500 text-black' };
    if (isBefore(date, startOfDay(now))) return { label: 'Atrasado', className: 'bg-destructive text-white' };
    if (isSameDay(date, addDays(now, 1))) return { label: 'Amanhã', className: 'bg-blue-500 text-white' };
    return { label: format(date, 'dd/MM'), className: 'bg-secondary text-muted-foreground' };
  };

  return (
    <Card className="h-full border-border/50 shadow-sm overflow-hidden flex flex-col">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
            <div className="space-y-1">
                <CardTitle className="text-lg font-headline flex items-center gap-2">
                    <CalendarClock className="h-5 w-5 text-primary" />
                    Próximos Retornos
                </CardTitle>
                <CardDescription>Oportunidades e Follow-ups</CardDescription>
            </div>
            <Link href="/follow-ups">
                <Button variant="ghost" size="sm" className="text-xs">
                    Ver Todos <ChevronRight className="ml-1 h-3 w-3" />
                </Button>
            </Link>
        </div>
      </CardHeader>
      <CardContent className="flex-1 space-y-3 pt-2">
        {isLoading ? (
            <div className="space-y-3">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
            </div>
        ) : !followUps || followUps.length === 0 ? (
            <div className="h-32 flex flex-col items-center justify-center text-center text-muted-foreground border-2 border-dashed rounded-lg bg-muted/5 border-border/50">
                <CalendarClock className="h-8 w-8 mb-2 opacity-20" />
                <p className="text-xs">Nenhum retorno agendado.</p>
            </div>
        ) : (
            <div className="space-y-3 animate-in fade-in duration-500">
                {followUps.map((f) => {
                    const status = getStatusInfo(f.dueDate);
                    return (
                        <Link key={f.id} href="/follow-ups">
                            <div className="group flex items-center gap-3 p-3 rounded-lg border border-border/50 bg-card hover:bg-muted/30 hover:border-primary/30 transition-all">
                                <Badge className={cn("h-10 w-10 flex flex-col items-center justify-center p-0 rounded-md text-[10px] shrink-0", status.className)}>
                                    <span className="font-bold">{status.label}</span>
                                </Badge>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <p className="text-sm font-semibold truncate group-hover:text-primary transition-colors">{f.contactName}</p>
                                        {f.dueTime && (
                                            <Badge variant="outline" className="h-4 px-1.5 text-[9px] font-black border-primary/30 text-primary gap-1">
                                                <Clock className="h-2 w-2" /> {f.dueTime}
                                            </Badge>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2 text-[10px] text-muted-foreground mt-1">
                                        {f.referralInfo ? (
                                            <span className="px-2 py-0.5 bg-primary/5 text-primary border border-primary/20 rounded text-[9px] font-black uppercase tracking-tight truncate max-w-[180px]">
                                                {f.referralInfo}
                                            </span>
                                        ) : (
                                            <span className="flex items-center gap-1">
                                                <Phone className="h-2.5 w-2.5" />
                                                {f.contactPhone || 'S/ Tel'}
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <CheckCircle2 className="h-4 w-4 text-muted-foreground group-hover:text-primary opacity-0 group-hover:opacity-100 transition-all" />
                            </div>
                        </Link>
                    );
                })}
            </div>
        )}
      </CardContent>
    </Card>
  );
}
