
'use client';

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils';
import type { Proposal } from '@/lib/types';
import { useMemo, useState } from 'react';
import { Skeleton } from '../ui/skeleton';
import { Button } from '../ui/button';
import { Eye, EyeOff } from 'lucide-react';

interface CommissionChartProps {
    proposals: Proposal[];
}

export function CommissionChart({ proposals }: CommissionChartProps) {
    const [isPrivacyMode, setIsPrivacyMode] = useState(false);
    const data = useMemo(() => {
        const monthlyData: { [key: string]: number } = {};

        proposals.forEach(p => {
            if (p.commissionStatus !== 'Pendente' && p.commissionPaymentDate && p.amountPaid) {
                const month = new Date(p.commissionPaymentDate).toLocaleString('default', { month: 'short' });
                if (!monthlyData[month]) {
                    monthlyData[month] = 0;
                }
                monthlyData[month] += p.amountPaid;
            }
        });

        const monthOrder = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
        
        const currentYear = new Date().getFullYear();
        const yearData = monthOrder.map(month => {
            const date = new Date(`${month} 1, ${currentYear}`);
            const monthName = date.toLocaleString('pt-BR', { month: 'short' }).replace('.', '');
            return {
                name: monthName.charAt(0).toUpperCase() + monthName.slice(1),
                total: monthlyData[month] || 0,
            };
        });

        return yearData;
    }, [proposals]);

  return (
    <Card>
        <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="font-headline">Visão Geral das Comissões</CardTitle>
            <Button variant="ghost" size="icon" onClick={() => setIsPrivacyMode(!isPrivacyMode)}>
              {isPrivacyMode ? <EyeOff /> : <Eye />}
              <span className="sr-only">{isPrivacyMode ? 'Mostrar valores' : 'Ocultar valores'}</span>
            </Button>
        </CardHeader>
        <CardContent>
            <ResponsiveContainer width="100%" height={350}>
            {isPrivacyMode ? (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                    <Skeleton className="h-full w-full" />
                </div>
            ) : (
                <BarChart data={data}>
                <XAxis
                    dataKey="name"
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                />
                <YAxis
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => formatCurrency(value as number)}
                />
                 <Tooltip
                    cursor={{ fill: 'hsl(var(--background))' }}
                    contentStyle={{ 
                        background: 'hsl(var(--background))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: 'var(--radius)'
                    }}
                    formatter={(value: number) => [formatCurrency(value), 'Total']}
                />
                <Bar dataKey="total" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} />
                </BarChart>
            )}
            </ResponsiveContainer>
        </CardContent>
    </Card>
  );
}
