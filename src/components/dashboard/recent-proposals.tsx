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
import { Badge } from '../ui/badge';
import { Skeleton } from '../ui/skeleton';
import { formatCurrency, cn, calculateBusinessDays } from '@/lib/utils';
import type { Proposal, Customer } from '@/lib/types';
import { useMemo, useState, useEffect } from 'react';
import { AlertCircle, ArrowRight } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import Link from 'next/link';

interface RecentProposalsProps {
    proposals: Proposal[];
    customers: Customer[];
    isLoading: boolean;
}

export function RecentProposals({ proposals, customers, isLoading }: RecentProposalsProps) {
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  const recentProposals = useMemo(() => {
    const customerMap = new Map(customers.map(c => [c.id, c]));
    return proposals
        .sort((a, b) => new Date(b.dateDigitized).getTime() - new Date(a.dateDigitized).getTime())
        .slice(0, 10)
        .map(p => ({...p, customer: customerMap.get(p.customerId)}))
  }, [proposals, customers]);

  return (
    <Card className="border-border/50 shadow-sm overflow-hidden bg-card/50">
      <CardHeader className="flex flex-row items-center justify-between pb-4">
        <CardTitle className="font-headline text-xl text-primary">Últimas Propostas Digitadas</CardTitle>
        <Link href="/proposals">
            <Badge variant="secondary" className="cursor-pointer hover:bg-secondary/80 flex gap-1 items-center px-3 py-1 transition-colors">
                Ver todas <ArrowRight className="h-3 w-3" />
            </Badge>
        </Link>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader className="bg-muted/20 border-b border-border/50">
            <TableRow className="hover:bg-transparent">
              <TableHead className="px-6 py-4 font-bold text-[10px] uppercase tracking-widest text-muted-foreground">Cliente</TableHead>
              <TableHead className="px-6 py-4 font-bold text-[10px] uppercase tracking-widest text-muted-foreground">Produto</TableHead>
              <TableHead className="px-6 py-4 font-bold text-[10px] uppercase tracking-widest text-muted-foreground">Status</TableHead>
              <TableHead className="px-6 py-4 font-bold text-[10px] uppercase tracking-widest text-muted-foreground text-right">Valor Bruto</TableHead>
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
                    <TableCell colSpan={4} className="text-center h-32 text-muted-foreground italic">Nenhuma proposta registrada recentemente.</TableCell>
                </TableRow>
            ) : (
                recentProposals.map((proposal) => {
                    const isPortAwaitingBalance = proposal.product === 'Portabilidade' && proposal.status === 'Aguardando Saldo';
                    const businessDays = hasMounted && proposal.dateDigitized ? calculateBusinessDays(new Date(proposal.dateDigitized)) : 0;

                    return (
                        <TableRow key={proposal.id} className="hover:bg-muted/30 transition-all group">
                            <TableCell className="px-6 py-5">
                                <div className="font-semibold text-primary/90 group-hover:text-primary transition-colors">{proposal.customer?.name || 'Cliente não encontrado'}</div>
                                <div className="text-[10px] text-muted-foreground mt-0.5">
                                    {proposal.customer?.cpf || 'CPF não informado'}
                                </div>
                            </TableCell>
                            <TableCell className="px-6 py-5">
                                <span className="text-sm font-medium opacity-80">{proposal.product}</span>
                            </TableCell>
                            <TableCell className="px-6 py-5">
                                <div className="flex items-center gap-2">
                                    <Badge
                                        variant="outline"
                                        className={cn('px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-tight', {
                                            'border-green-500/50 text-green-600 bg-green-50/50 dark:bg-green-900/10': proposal.status === 'Pago',
                                            'border-orange-500/50 text-orange-600 bg-orange-50/50 dark:bg-orange-900/10': proposal.status === 'Saldo Pago',
                                            'border-yellow-500/50 text-yellow-600 bg-yellow-50/50 dark:bg-yellow-900/10': proposal.status === 'Em Andamento',
                                            'border-blue-500/50 text-blue-600 bg-blue-50/50 dark:bg-blue-900/10': proposal.status === 'Aguardando Saldo',
                                            'border-red-500/50 text-red-600 bg-red-50/50 dark:bg-red-900/10': proposal.status === 'Reprovado',
                                            'border-purple-500/50 text-purple-600 bg-purple-50/50 dark:bg-purple-900/10': proposal.status === 'Pendente',
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
                                                    <p className="font-semibold">Monitoramento de Saldo</p>
                                                    <p>Prazo decorrido: {businessDays} dia(s) úteis.</p>
                                                    <p className="text-[10px] text-muted-foreground">O prazo bancário padrão é de 5 dias úteis.</p>
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
