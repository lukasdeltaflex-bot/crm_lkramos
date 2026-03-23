'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity, Users, FileText, CalendarClock, Bot, Wifi, WifiOff } from 'lucide-react';
import { useUser, useFirestore } from '@/firebase';
import { collection, getCountFromServer, query, where } from 'firebase/firestore';

interface SystemHealthPanelProps {
  totalCustomers: number;
  totalProposals: number;
}

export function SystemHealthPanel({ totalCustomers, totalProposals }: SystemHealthPanelProps) {
  const { user } = useUser();
  const firestore = useFirestore();
  
  const [totalFollowUps, setTotalFollowUps] = useState<number | null>(null);
  const [firebaseStatus, setFirebaseStatus] = useState<'ok' | 'error'>('ok');
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  useEffect(() => {
    let isMounted = true;
    
    async function fetchFollowUps() {
      if (!firestore || !user) {
        if (isMounted) setFirebaseStatus('error');
        return;
      }
      try {
        const q = query(collection(firestore, 'users', user.uid, 'followUps'), where('status', '==', 'pending'));
        const snap = await getCountFromServer(q);
        if (isMounted) {
            setTotalFollowUps(snap.data().count);
            setFirebaseStatus('ok');
            setLastUpdate(new Date());
        }
      } catch (e) {
        console.error("Health check error:", e);
        if (isMounted) setFirebaseStatus('error');
      }
    }
    
    fetchFollowUps();
    const interval = setInterval(fetchFollowUps, 60000); // 1 minuto update
    return () => {
        isMounted = false;
        clearInterval(interval);
    };
  }, [firestore, user]);

  return (
    <Card className="border-2 border-primary/10 shadow-sm h-full flex flex-col">
      <CardHeader className="pb-2">
        <CardTitle className="text-[11px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
          <Activity className="h-4 w-4 text-blue-500" />
          Saúde do Sistema
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col justify-between">
        <div className="grid grid-cols-2 gap-x-4 gap-y-6">
          <div className="space-y-1">
            <p className="text-[10px] font-bold uppercase text-muted-foreground flex items-center gap-1.5"><Users className="h-3 w-3"/> Clientes</p>
            <p className="text-2xl font-black">{totalCustomers}</p>
          </div>
          <div className="space-y-1">
            <p className="text-[10px] font-bold uppercase text-muted-foreground flex items-center gap-1.5"><FileText className="h-3 w-3"/> Propostas</p>
            <p className="text-2xl font-black">{totalProposals}</p>
          </div>
          <div className="space-y-1">
            <p className="text-[10px] font-bold uppercase text-muted-foreground flex items-center gap-1.5"><CalendarClock className="h-3 w-3"/> Retornos PD</p>
            <p className="text-2xl font-black">
              {totalFollowUps === null ? <span className="animate-pulse">...</span> : totalFollowUps}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-[10px] font-bold uppercase text-muted-foreground flex items-center gap-1.5"><Bot className="h-3 w-3"/> Gemini IA</p>
            <p className="text-sm font-black uppercase text-emerald-500 flex items-center gap-1.5 mt-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0"></span> Online
            </p>
          </div>
        </div>

        <div className="mt-6 pt-3 border-t border-border/50 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
                {firebaseStatus === 'ok' ? (
                    <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[9px] font-black uppercase tracking-widest">
                        <Activity className="h-3 w-3 animate-pulse" /> DB Online
                    </div>
                ) : (
                    <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-red-500/10 text-red-600 dark:text-red-400 text-[9px] font-black uppercase tracking-widest">
                        <WifiOff className="h-3 w-3" /> Offline
                    </div>
                )}
            </div>
            <p className="text-[9px] text-muted-foreground font-bold uppercase tracking-widest">
                Ping: {lastUpdate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </p>
        </div>
      </CardContent>
    </Card>
  );
}
