'use client';

import { Area, AreaChart, CartesianGrid, XAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils';
import type { Proposal } from '@/lib/types';
import { useMemo, useState } from 'react';
import { Skeleton } from '../ui/skeleton';
import { Button } from '../ui/button';
import { Eye, EyeOff, TrendingUp } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface CommissionChartProps {
    proposals: Proposal[];
}

export function CommissionChart({ proposals }: CommissionChartProps) {
    const [isPrivacyMode, setIsPrivacyMode] = useState(false);
    const data = useMemo(() => {
        const monthlyData: { [key: string]: number } = {};

        proposals.forEach(p => {
            if (p.commissionStatus !== 'Pendente' && p.commissionPaymentDate && p.amountPaid) {
                const date = new Date(p.commissionPaymentDate);
                const monthKey = format(date, 'MMM', { locale: ptBR }).replace('.', '').toLowerCase(); 
                if (!monthlyData[monthKey]) {
                    monthlyData[monthKey] = 0;
                }
                monthlyData[monthKey] += p.amountPaid;
            }
        });

        const monthOrder = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
        
        return monthOrder.map(monthName => ({
            name: monthName,
            total: monthlyData[monthName.toLowerCase()] || 0,
        }));

    }, [proposals]);

  return (
    <Card className="border-border/50 shadow-lg rounded-xl overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between pb-2 bg-muted/5">
            <div className="space-y-1">
                <CardTitle className="text-xl font-bold text-primary flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 opacity-60" />
                    Histórico de Comissões
                </CardTitle>
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground opacity-70">Desempenho financeiro anual</p>
            </div>
            <Button variant="ghost" size="icon" onClick={() => setIsPrivacyMode(!isPrivacyMode)} className="h-8 w-8 rounded-full hover:bg-primary/5">
              {isPrivacyMode ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
        </CardHeader>
        <CardContent className="pt-6">
            {isPrivacyMode ? (
                 <div className="flex aspect-video items-center justify-center h-[350px]">
                    <Skeleton className="h-full w-full rounded-lg" />
                </div>
            ) : (
                <div className="h-[350px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart
                            data={data}
                            margin={{ left: 0, right: 0, top: 10, bottom: 0 }}
                        >
                            <defs>
                                <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="hsl(var(--muted-foreground)/0.1)" />
                            <XAxis
                                dataKey="name"
                                tickLine={false}
                                axisLine={false}
                                tickMargin={12}
                                fontSize={11}
                                fontWeight="bold"
                                tickFormatter={(value) => value.slice(0, 3).toUpperCase()}
                                stroke="hsl(var(--muted-foreground))"
                            />
                            <Tooltip
                                cursor={{ stroke: 'hsl(var(--primary))', strokeWidth: 1, strokeDasharray: '4 4' }}
                                content={({ active, payload }) => {
                                    if (active && payload && payload.length) {
                                        return (
                                            <div className="bg-background/95 backdrop-blur-md border border-border shadow-xl p-3 rounded-lg flex flex-col gap-1">
                                                <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">{payload[0].payload.name}</p>
                                                <p className="text-sm font-bold text-primary">{formatCurrency(payload[0].value as number)}</p>
                                            </div>
                                        );
                                    }
                                    return null;
                                }}
                            />
                            <Area
                                type="monotone"
                                dataKey="total"
                                stroke="hsl(var(--primary))"
                                strokeWidth={3}
                                fillOpacity={1}
                                fill="url(#colorTotal)"
                                animationDuration={1500}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            )}
        </CardContent>
    </Card>
  );
}
