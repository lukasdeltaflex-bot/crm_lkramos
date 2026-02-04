'use client';

import React, { useMemo } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/utils';
import type { Proposal, Customer } from '@/lib/types';
import { differenceInDays, parseISO } from 'date-fns';
import { TrendingUp, Clock, Zap, Award, BarChart3 } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

type ProposalWithCustomer = Proposal & { customer?: Customer };

interface PromoterEfficiencyReportProps {
  proposals: ProposalWithCustomer[];
}

export function PromoterEfficiencyReport({ proposals }: PromoterEfficiencyReportProps) {
  const stats = useMemo(() => {
    const report: Record<string, {
      name: string;
      count: number;
      totalCommission: number;
      paidCommission: number;
      totalDaysToPay: number;
      paidCount: number;
    }> = {};

    proposals.forEach(p => {
      const name = p.promoter || 'Não Informada';
      if (!report[name]) {
        report[name] = { name, count: 0, totalCommission: 0, paidCommission: 0, totalDaysToPay: 0, paidCount: 0 };
      }

      const promoter = report[name];
      promoter.count++;
      promoter.totalCommission += (p.commissionValue || 0);

      if (p.commissionStatus === 'Paga' && p.commissionPaymentDate && p.datePaidToClient) {
        promoter.paidCommission += (p.amountPaid || 0);
        promoter.paidCount++;
        const days = differenceInDays(new Date(p.commissionPaymentDate), new Date(p.datePaidToClient));
        if (days >= 0) promoter.totalDaysToPay += days;
      }
    });

    return Object.values(report).map(p => ({
      ...p,
      avgTicket: p.count > 0 ? p.totalCommission / p.count : 0,
      avgDays: p.paidCount > 0 ? p.totalDaysToPay / p.paidCount : null,
      efficiency: p.totalCommission > 0 ? (p.paidCommission / p.totalCommission) * 100 : 0
    })).sort((a, b) => b.totalCommission - a.totalCommission);
  }, [proposals]);

  const getSpeedBadge = (days: number | null) => {
    if (days === null) return <Badge variant="secondary" className="opacity-50">N/A</Badge>;
    if (days <= 5) return <Badge className="bg-green-500 hover:bg-green-600">Flash ({Math.round(days)}d)</Badge>;
    if (days <= 12) return <Badge className="bg-blue-500 hover:bg-blue-600">Rápido ({Math.round(days)}d)</Badge>;
    if (days <= 20) return <Badge className="bg-yellow-500 text-black hover:bg-yellow-600">Normal ({Math.round(days)}d)</Badge>;
    return <Badge variant="destructive">Lento ({Math.round(days)}d)</Badge>;
  };

  return (
    <div className="space-y-6 py-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-primary/5 border-primary/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                <Award className="h-3 w-3 text-primary" /> Melhor Parceiro (Volume)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold truncate">{stats[0]?.name || '---'}</div>
            <p className="text-[10px] text-muted-foreground mt-1">Líder em comissões geradas</p>
          </CardContent>
        </Card>
        <Card className="bg-green-50/50 border-green-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                <Zap className="h-3 w-3 text-green-600" /> Mais Ágil (Pagamento)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold truncate">
                {stats.filter(s => s.avgDays !== null).sort((a,b) => (a.avgDays || 999) - (b.avgDays || 999))[0]?.name || '---'}
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">Menor tempo médio de repasse</p>
          </CardContent>
        </Card>
        <Card className="bg-blue-50/50 border-blue-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                <TrendingUp className="h-3 w-3 text-blue-600" /> Maior Ticket Médio
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold truncate">
                {stats.sort((a,b) => b.avgTicket - a.avgTicket)[0]?.name || '---'}
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">Melhor rentabilidade por contrato</p>
          </CardContent>
        </Card>
      </div>

      <div className="rounded-xl border shadow-sm overflow-hidden">
        <ScrollArea className="h-[400px]">
          <Table>
            <TableHeader className="bg-muted/30 sticky top-0 z-10">
              <TableRow>
                <TableHead className="text-[10px] font-black uppercase tracking-widest">Promotora</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-widest text-center">Contratos</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-widest text-right">Ticket Médio</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-widest text-right">Total Gerado</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-widest text-center">Velocidade</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-widest text-right">Eficiência</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stats.map((item) => (
                <TableRow key={item.name} className="hover:bg-muted/20">
                  <TableCell className="font-bold text-sm">{item.name}</TableCell>
                  <TableCell className="text-center font-medium">{item.count}</TableCell>
                  <TableCell className="text-right text-muted-foreground">{formatCurrency(item.avgTicket)}</TableCell>
                  <TableCell className="text-right font-bold text-primary">{formatCurrency(item.totalCommission)}</TableCell>
                  <TableCell className="text-center">{getSpeedBadge(item.avgDays)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex flex-col items-end">
                        <span className="font-black text-xs">{item.efficiency.toFixed(1)}%</span>
                        <div className="w-16 h-1 bg-muted rounded-full mt-1 overflow-hidden">
                            <div 
                                className="h-full bg-primary" 
                                style={{ width: `${item.efficiency}%` }}
                            />
                        </div>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </ScrollArea>
      </div>
    </div>
  );
}
