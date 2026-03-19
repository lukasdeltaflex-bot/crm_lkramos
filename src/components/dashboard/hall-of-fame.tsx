'use client';

import React, { useMemo, useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Trophy, Zap, Star } from 'lucide-react';
import { format, isSameMonth, parseISO, isValid } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { formatCurrency, cn } from '@/lib/utils';
import type { Proposal, Customer } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';

interface HallOfFameProps {
  proposals: Proposal[];
  customers: Customer[];
  isLoading: boolean;
}

export function HallOfFame({ proposals, customers, isLoading }: HallOfFameProps) {
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  const stats = useMemo(() => {
    if (!hasMounted || !proposals || !customers) return null;
    const now = new Date();
    
    // 🛡️ SEGURANÇA: Filtra propostas com datas válidas para o mês atual
    const currentMonthProposals = proposals.filter(p => {
        if (!p.dateDigitized) return false;
        try {
            const d = parseISO(p.dateDigitized);
            return isValid(d) && isSameMonth(d, now);
        } catch { return false; }
    });

    const paidThisMonth = currentMonthProposals.filter(p => p.status === 'Pago' || p.status === 'Saldo Pago');

    // 1. Maior Contrato Pago (Ouro)
    const biggestPaid = [...paidThisMonth].sort((a,b) => (b.grossAmount || 0) - (a.grossAmount || 0))[0];

    // 2. Pico de Produção (Dia)
    const dailyVolume: Record<string, number> = {};
    currentMonthProposals.forEach(p => {
        if (!p.dateDigitized) return;
        const day = p.dateDigitized.split('T')[0];
        if (day) {
            dailyVolume[day] = (dailyVolume[day] || 0) + (p.grossAmount || 0);
        }
    });
    const peakDay = Object.entries(dailyVolume).sort((a,b) => b[1] - a[1])[0];

    // 3. Melhor Cliente (Volume PAGO no Mês)
    const customerPaidVolume: Record<string, number> = {};
    paidThisMonth.forEach(p => {
        customerPaidVolume[p.customerId] = (customerPaidVolume[p.customerId] || 0) + (p.grossAmount || 0);
    });
    const bestCustomerId = Object.entries(customerPaidVolume).sort((a,b) => b[1] - a[1])[0]?.[0];
    const bestCustomer = customers.find(c => c.id === bestCustomerId);

    return {
        biggestPaid,
        peakDay,
        bestCustomer,
        bestCustomerVolume: bestCustomerId ? customerPaidVolume[bestCustomerId] : 0
    };
  }, [proposals, customers, hasMounted]);

  if (isLoading || !hasMounted) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Skeleton className="h-24 w-full rounded-2xl" />
            <Skeleton className="h-24 w-full rounded-2xl" />
            <Skeleton className="h-24 w-full rounded-2xl" />
        </div>
    );
  }

  if (!stats) return null;

  const getFullShortName = (name?: string) => {
    if (!name) return '---';
    const parts = name.trim().split(/\s+/);
    if (parts.length > 1) {
        return `${parts[0]} ${parts[1]}`;
    }
    return parts[0];
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: Contrato Ouro */}
        <Card className="relative overflow-hidden border-amber-500/20 bg-amber-500/[0.03] shadow-md group transition-all hover:scale-[1.02] hover:shadow-lg">
            <div className="absolute top-0 left-0 w-1 h-full bg-amber-500" />
            <CardContent className="p-5 flex items-center gap-4">
                <div className="p-3 rounded-2xl bg-amber-100 text-amber-600 dark:bg-amber-900/40">
                    <Trophy className="h-6 w-6 fill-amber-500" />
                </div>
                <div className="space-y-0.5 overflow-hidden">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-700/60 dark:text-amber-400/60">Contrato Ouro do Mês</p>
                    <p className="text-xl font-black text-foreground truncate">
                        {stats.biggestPaid ? formatCurrency(stats.biggestPaid.grossAmount) : 'R$ 0,00'}
                    </p>
                    <p className="text-[9px] font-bold text-muted-foreground uppercase opacity-60 truncate">
                        {stats.biggestPaid ? `Proposta: ${stats.biggestPaid.proposalNumber}` : "Aguardando 1º Pagamento"}
                    </p>
                </div>
            </CardContent>
        </Card>

        {/* Card 2: Pico de Produção */}
        <Card className="relative overflow-hidden border-blue-500/20 bg-blue-500/[0.03] shadow-md group transition-all hover:scale-[1.02] hover:shadow-lg">
            <div className="absolute top-0 left-0 w-1 h-full bg-blue-500" />
            <CardContent className="p-5 flex items-center gap-4">
                <div className="p-3 rounded-2xl bg-blue-100 text-blue-600 dark:bg-blue-900/40">
                    <Zap className="h-6 w-6 fill-blue-500" />
                </div>
                <div className="space-y-0.5 overflow-hidden">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-700/60 dark:text-blue-400/60">Pico de Produção Diária</p>
                    <p className="text-xl font-black text-foreground truncate">
                        {stats.peakDay ? formatCurrency(stats.peakDay[1]) : 'R$ 0,00'}
                    </p>
                    <p className="text-[9px] font-bold text-muted-foreground uppercase opacity-60 truncate">
                        {stats.peakDay ? `Data: ${format(parseISO(stats.peakDay[0]), 'dd/MM/yyyy')}` : "Foco na digitação!"}
                    </p>
                </div>
            </CardContent>
        </Card>

        {/* Card 3: Estrela da Base */}
        <Card className="relative overflow-hidden border-purple-500/20 bg-purple-500/[0.03] shadow-md group transition-all hover:scale-[1.02] hover:shadow-lg">
            <div className="absolute top-0 left-0 w-1 h-full bg-purple-500" />
            <CardContent className="p-5 flex items-center gap-4">
                <div className="p-3 rounded-2xl bg-purple-100 text-purple-600 dark:bg-purple-900/40">
                    <Star className="h-6 w-6 fill-purple-500" />
                </div>
                <div className="space-y-0.5 overflow-hidden">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-purple-700/60 dark:text-purple-400/60">Cliente Estrela do Mês</p>
                    <p className="text-xl font-black text-foreground truncate uppercase">
                        {stats.bestCustomer ? getFullShortName(stats.bestCustomer.name) : '---'}
                    </p>
                    <p className="text-[9px] font-bold text-muted-foreground uppercase opacity-60 truncate">
                        {stats.bestCustomer ? `Pagos: ${formatCurrency(stats.bestCustomerVolume)}` : "Quem será o próximo?"}
                    </p>
                </div>
            </CardContent>
        </Card>
    </div>
  );
}
