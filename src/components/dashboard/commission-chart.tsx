'use client';

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { proposals } from '@/lib/data';
import { formatCurrency } from '@/lib/utils';

const getMonthlyCommissions = () => {
    const monthlyData: { [key: string]: number } = {};

    proposals.forEach(p => {
        if (p.commissionPaid && p.commissionPaymentDate) {
            const month = new Date(p.commissionPaymentDate).toLocaleString('default', { month: 'short' });
            if (!monthlyData[month]) {
                monthlyData[month] = 0;
            }
            monthlyData[month] += p.commissionValue;
        }
    });

    const monthOrder = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    
    return monthOrder.map(month => ({
        name: month,
        total: monthlyData[month] || 0,
    })).filter(d => d.total > 0);
}


export function CommissionChart() {
    const data = getMonthlyCommissions();
  return (
    <Card>
        <CardHeader>
            <CardTitle className="font-headline">Visão Geral das Comissões</CardTitle>
        </CardHeader>
        <CardContent>
            <ResponsiveContainer width="100%" height={350}>
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
                <Bar dataKey="total" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
            </ResponsiveContainer>
        </CardContent>
    </Card>
  );
}
