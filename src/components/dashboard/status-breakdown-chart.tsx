'use client';

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { Proposal } from '@/lib/types';
import { formatCurrency } from '@/lib/utils';
import { useMemo } from 'react';

interface StatusBreakdownChartProps {
    proposals: Proposal[];
}

export function StatusBreakdownChart({ proposals }: StatusBreakdownChartProps) {
    const data = useMemo(() => {
        const productBreakdown: { [key: string]: number } = {};

        proposals.forEach(p => {
            if (!productBreakdown[p.product]) {
                productBreakdown[p.product] = 0;
            }
            productBreakdown[p.product] += p.grossAmount;
        });

        return Object.keys(productBreakdown).map(product => ({
            name: product,
            total: productBreakdown[product],
        })).sort((a, b) => b.total - a.total);
    }, [proposals]);

  if (data.length === 0) {
    return <div className="text-center text-muted-foreground py-10">Nenhuma proposta para exibir.</div>
  }

  return (
    <div className="h-[400px] w-full pt-4">
        <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} layout="vertical" margin={{ left: 0, right: 30 }}>
            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--muted-foreground)/0.1)" />
            <XAxis
                type="number"
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => formatCurrency(value as number)}
            />
            <YAxis
                type="category"
                dataKey="name"
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                fontWeight="bold"
                tickLine={false}
                axisLine={false}
                width={80}
                interval={0}
            />
             <Tooltip
                cursor={{ fill: 'hsl(var(--muted)/0.1)' }}
                contentStyle={{ 
                    background: 'hsl(var(--background))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: 'var(--radius)',
                    color: 'hsl(var(--foreground))'
                }}
                formatter={(value: number) => [formatCurrency(value), 'Total']}
            />
            <Bar dataKey="total" fill="hsl(var(--accent))" radius={[0, 4, 4, 0]} barSize={30}/>
            </BarChart>
        </ResponsiveContainer>
    </div>
  );
}
