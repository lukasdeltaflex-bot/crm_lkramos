
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
import { Badge } from '../ui/badge';
import { Skeleton } from '../ui/skeleton';
import { formatCurrency, cn, calculateBusinessDays } from '@/lib/utils';
import type { Proposal, Customer, UserSettings } from '@/lib/types';
import { useMemo, useState, useEffect } from 'react';
import { AlertCircle, ArrowRight, User } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import Link from 'next/link';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { BankIcon } from '../bank-icon';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';

interface RecentProposalsProps {
    proposals: Proposal[];
    customers: Customer[];
    isLoading: boolean;
}

export function RecentProposals({ proposals, customers, isLoading }: RecentProposalsProps) {
  const [hasMounted, setHasMounted] = useState(false);
  const { user } = useUser();
  const firestore = useFirestore();

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
    return proposals
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
                    const businessDays = hasMounted && proposal.dateDigitized ? calculateBusinessDays(new Date(proposal.dateDigitized)) : 0;

                    // Limpa o nome do banco para exibição (remove código legado se existir)
                    const cleanBankName = proposal.bank.includes(' - ') ? proposal.bank.split(' - ')[1] : proposal.bank;

                    return (
                        <TableRow key={proposal.id} className="hover:bg-primary/[0.02] border-b border-border/30 transition-all group">
                            <TableCell className="px-6 py-5">
                                <div className="flex items-center gap-3">
                                    <Avatar className="h-9 w-9 border border-primary/10 shadow-sm">
                                        <AvatarFallback className="text-[10px] font-bold bg-primary/10 text-primary/70">
                                            {getInitials(proposal.customer?.name)}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="overflow-hidden">
                                        <div className="font-bold text-primary/90 group-hover:text-primary transition-colors truncate max-w-[200px]">{proposal.customer?.name || 'Cliente não encontrado'}</div>
                                        <div className="text-[10px] text-muted-foreground font-medium mt-0.5">
                                            {proposal.customer?.cpf || 'CPF não informado'}
                                        </div>
                                    </div>
                                </div>
                            </TableCell>
                            <TableCell className="px-6 py-5">
                                <div className="flex flex-col gap-1.5">
                                    <div className="flex items-center gap-2">
                                        <BankIcon bankName={proposal.bank} showLogo={showLogos} className="h-4 w-4" />
                                        <span className="text-[10px] font-bold text-muted-foreground truncate max-w-[120px]">{cleanBankName}</span>
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
                                        className={cn('px-3 py-1 text-[10px] font-medium uppercase tracking-wider border-2', {
                                            'border-green-500/30 text-green-600 bg-green-50/80 dark:bg-green-900/40': proposal.status === 'Pago',
                                            'border-orange-500/30 text-orange-600 bg-orange-50/80 dark:bg-orange-900/40': proposal.status === 'Saldo Pago',
                                            'border-yellow-500/30 text-yellow-600 bg-yellow-50/80 dark:bg-yellow-900/40': proposal.status === 'Em Andamento',
                                            'border-blue-500/30 text-blue-600 bg-blue-50/80 dark:bg-blue-900/40': proposal.status === 'Aguardando Saldo',
                                            'border-red-500/30 text-red-600 bg-red-50/80 dark:bg-red-900/40': proposal.status === 'Reprovado',
                                            'border-purple-500/30 text-purple-600 bg-purple-50/80 dark:bg-green-900/40': proposal.status === 'Pendente',
                                        })}
                                    >
                                        {proposal.status}
                                    </Badge>
                                    {isPortAwaitingBalance && hasMounted && (
                                        <TooltipProvider>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <AlertCircle className={cn(
                                                        "h-4 w-4 cursor-help transition-colors", 
                                                        businessDays >= 5 ? "text-destructive animate-pulse" : 
                                                        businessDays === 4 ? "text-orange-500" : 
                                                        "text-blue-400"
                                                    )} />
                                                </TooltipTrigger>
                                                <TooltipContent>
                                                    <p className="font-semibold text-xs text-primary">Monitoramento de Saldo</p>
                                                    <p className="text-[10px]">Prazo decorrido: {businessDays} dia(s) úteis.</p>
                                                </TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>
                                    )}
                                </div>
                            </TableCell>
                            <TableCell className="px-6 py-5 text-right font-normal text-primary">
                                {formatCurrency(proposal.grossAmount)}
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
