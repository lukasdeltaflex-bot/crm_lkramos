'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency, cn, calculateBusinessDays, cleanBankName } from '@/lib/utils';
import type { Proposal, Customer, UserSettings } from '@/lib/types';
import { useMemo, useState, useEffect } from 'react';
import { ArrowRight, Zap, Clock } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import Link from 'next/link';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { BankIcon } from '@/components/bank-icon';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { useTheme } from '@/components/theme-provider';

interface RecentProposalsProps {
    proposals: Proposal[];
    customers: Customer[];
    isLoading: boolean;
}

export function RecentProposals({ proposals, customers, isLoading }: RecentProposalsProps) {
  const [hasMounted, setHasMounted] = useState(false);
  const { user } = useUser();
  const firestore = useFirestore();
  const { statusColors } = useTheme();

  useEffect(() => {
    setHasMounted(true);
  }, []);

  const settingsDocRef = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return doc(firestore, 'userSettings', user.uid);
  }, [firestore, user]);

  const { data: userSettings } = useDoc<UserSettings>(settingsDocRef);
  const showLogos = userSettings?.showBankLogos ?? true;

  const recentProposals = useMemo(() => {
    const customerMap = new Map(customers.map(c => [c.id, c]));
    return [...proposals]
        .sort((a, b) => new Date(b.dateDigitized).getTime() - new Date(a.dateDigitized).getTime())
        .slice(0, 10)
        .map(p => ({...p, customer: customerMap.get(p.customerId)}))
  }, [proposals, customers]);

  const getInitials = (name?: string) => {
    if (!name) return '??';
    return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
  }

  return (
    <Card className="border-border/50 shadow-lg overflow-hidden bg-card rounded-xl">
      <CardHeader className="flex flex-row items-center justify-between pb-4 bg-muted/10">
        <div className="space-y-1">
            <CardTitle className="font-bold text-xl text-primary">Últimas Propostas Digitadas</CardTitle>
            <p className="text-xs text-muted-foreground font-medium">Monitoramento em tempo real da esteira</p>
        </div>
        <Link href="/proposals">
            <Button variant="outline" size="sm" className="h-8 rounded-full px-4 text-xs font-bold shadow-sm text-primary border-primary/20 hover:bg-primary/10">
                Explorar Tudo <ArrowRight className="ml-2 h-3 w-3" />
            </Button>
        </Link>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader className="bg-muted/20 border-b border-border/50">
            <TableRow className="hover:bg-transparent">
              <TableHead className="px-6 py-4 font-bold text-[10px] uppercase tracking-widest text-muted-foreground/80">Cliente</TableHead>
              <TableHead className="px-6 py-4 font-bold text-[10px] uppercase tracking-widest text-muted-foreground/80">Banco / Produto</TableHead>
              <TableHead className="px-6 py-4 font-bold text-[10px] uppercase tracking-widest text-muted-foreground/80">Status</TableHead>
              <TableHead className="px-6 py-4 font-bold text-[10px] uppercase tracking-widest text-muted-foreground/80 text-right">Valor Bruto</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                        <TableCell className="px-6 py-5"><Skeleton className="h-5 w-32" /></TableCell>
                        <TableCell className="px-6 py-5"><Skeleton className="h-5 w-24" /></TableCell>
                        <TableCell className="px-6 py-5"><Skeleton className="h-5 w-20" /></TableCell>
                        <TableCell className="px-6 py-5 text-right"><Skeleton className="h-5 w-28 ml-auto" /></TableCell>
                    </TableRow>
                ))
            ) : recentProposals.length === 0 ? (
                <TableRow>
                    <TableCell colSpan={4} className="text-center h-48 text-muted-foreground italic">Nenhuma proposta registrada recentemente.</TableCell>
                </TableRow>
            ) : (
                recentProposals.map((proposal) => {
                    const isPortAwaitingBalance = proposal.product === 'Portabilidade' && proposal.status === 'Aguardando Saldo';
                    
                    const referenceDate = proposal.statusAwaitingBalanceAt || proposal.dateDigitized;
                    const businessDays = hasMounted && referenceDate ? calculateBusinessDays(referenceDate) : 0;
                    
                    const statusKey = proposal.status.toUpperCase();
                    const colorValue = statusColors[statusKey] || statusColors[proposal.status];
                    const cleanBank = cleanBankName(proposal.bank);
                    const customDomain = userSettings?.bankDomains?.[proposal.bank];
                    const isBigWin = proposal.commissionValue >= 3000;

                    return (
                        <TableRow 
                            key={proposal.id} 
                            className={cn(
                                "hover:bg-primary/[0.02] border-b border-border/30 transition-all group",
                                colorValue && "status-row-custom"
                            )}
                            style={colorValue ? { '--status-color': colorValue } as any : {}}
                        >
                            <TableCell className="px-6 py-5">
                                <div className="flex items-center gap-3">
                                    <Avatar className="h-9 w-9 border border-primary/10 shadow-sm">
                                        <AvatarFallback className="text-[10px] font-bold bg-primary/10 text-primary/70">
                                            {getInitials(proposal.customer?.name)}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="overflow-hidden">
                                        <div className="flex items-center gap-2">
                                            <div className="font-bold text-primary/90 group-hover:text-primary transition-colors truncate max-w-[180px]">{proposal.customer?.name || 'Cliente não encontrado'}</div>
                                            {isBigWin && <Zap className="h-3 w-3 text-orange-500 fill-orange-500" title="Contrato de Alta Performance" />}
                                        </div>
                                        <div className="text-[10px] text-muted-foreground font-medium mt-0.5">
                                            {proposal.customer?.cpf || 'CPF não informado'}
                                        </div>
                                    </div>
                                </div>
                            </TableCell>
                            <TableCell className="px-6 py-5">
                                <div className="flex flex-col gap-1.5">
                                    <div className="flex items-center gap-2">
                                        <BankIcon bankName={proposal.bank} domain={customDomain} showLogo={showLogos} className="h-4 w-4" />
                                        <span className="text-[10px] font-bold text-muted-foreground truncate max-w-[120px]">{cleanBank}</span>
                                    </div>
                                    <Badge variant="secondary" className="bg-muted/50 text-muted-foreground font-bold text-[9px] border-none px-2 py-0 w-fit">
                                        {proposal.product}
                                    </Badge>
                                </div>
                            </TableCell>
                            <TableCell className="px-6 py-5">
                                <div className="flex items-center gap-2">
                                    <Badge
                                        variant="outline"
                                        className="px-3 py-1 text-[10px] font-black uppercase tracking-wider border-2 status-custom rounded-full"
                                        style={colorValue ? { '--status-color': colorValue } as any : {}}
                                    >
                                        {proposal.status}
                                    </Badge>
                                    {isPortAwaitingBalance && hasMounted && (
                                        <TooltipProvider>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <div className={cn(
                                                        "flex items-center justify-center h-5 w-5 rounded-full border cursor-help transition-all shadow-sm",
                                                        businessDays >= 5 
                                                            ? "bg-red-50 border-red-200 text-red-600 animate-alert-pulse" 
                                                            : "bg-blue-50 border-blue-200 text-blue-500"
                                                    )}>
                                                        <Clock className="h-3 w-3" />
                                                    </div>
                                                </TooltipTrigger>
                                                <TooltipContent side="top" className="bg-white text-zinc-950 border shadow-2xl p-4 rounded-xl min-w-[200px]">
                                                    <div className="space-y-1 text-center">
                                                        <p className="font-bold text-sm text-blue-600">Monitoramento de Saldo</p>
                                                        <p className="text-xs font-medium text-muted-foreground">Prazo decorrido: <span className="font-bold text-zinc-900">{businessDays} dia(s) úteis.</span></p>
                                                    </div>
                                                </TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>
                                    )}
                                </div>
                            </TableCell>
                            <TableCell className="px-6 py-5 text-right font-normal text-primary">
                                <div className="flex flex-col items-end">
                                    <span className={cn(isBigWin && "font-bold text-orange-600")}>{formatCurrency(proposal.grossAmount)}</span>
                                    {isBigWin && <span className="text-[8px] font-black uppercase text-orange-500 tracking-tighter">Alto Volume</span>}
                                </div>
                            </TableCell>
                        </TableRow>
                    );
                })
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
