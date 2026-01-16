'use client';

import { Area, AreaChart, CartesianGrid, XAxis } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils';
import type { Proposal } from '@/lib/types';
import { useMemo, useState } from 'react';
import { Skeleton } from '../ui/skeleton';
import { Button } from '../ui/button';
import { Eye, EyeOff } from 'lucide-react';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';

interface CommissionChartProps {
    proposals: Proposal[];
}

const chartConfig = {
  total: {
    label: 'Comissão',
    color: 'hsl(var(--accent))',
  },
} satisfies ChartConfig;

export function CommissionChart({ proposals }: CommissionChartProps) {
    const [isPrivacyMode, setIsPrivacyMode] = useState(false);
    const data = useMemo(() => {
        const monthlyData: { [key: string]: number } = {};

        proposals.forEach(p => {
            if (p.commissionStatus !== 'Pendente' && p.commissionPaymentDate && p.amountPaid) {
                const date = new Date(p.commissionPaymentDate);
                const month = date.toLocaleString('default', { month: 'short' });
                if (!monthlyData[month]) {
                    monthlyData[month] = 0;
                }
                monthlyData[month] += p.amountPaid;
            }
        });

        const monthOrder = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
        const currentYear = new Date().getFullYear();
        
        return monthOrder.map(month => {
            const date = new Date(`${month} 1, ${currentYear}`);
            const monthName = date.toLocaleString('pt-BR', { month: 'short' }).replace('.', '');
            return {
                name: monthName.charAt(0).toUpperCase() + monthName.slice(1),
                total: monthlyData[month] || 0,
            };
        });

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
            {isPrivacyMode ? (
                 <div className="flex aspect-video items-center justify-center h-[350px]">
                    <Skeleton className="h-full w-full" />
                </div>
            ) : (
                <ChartContainer config={chartConfig} className="h-[350px] w-full">
                <AreaChart
                  accessibilityLayer
                  data={data}
                  margin={{
                    left: 12,
                    right: 12,
                  }}
                >
                  <CartesianGrid vertical={false} />
                  <XAxis
                    dataKey="name"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    tickFormatter={(value) => value.slice(0, 3)}
                  />
                  <ChartTooltip
                    cursor={false}
                    content={<ChartTooltipContent 
                        formatter={(value) => formatCurrency(value as number)}
                        indicator="dot"
                    />}
                  />
                  <defs>
                    <linearGradient id="fillTotal" x1="0" y1="0" x2="0" y2="1">
                        <stop
                            offset="5%"
                            stopColor="var(--color-total)"
                            stopOpacity={0.8}
                        />
                        <stop
                            offset="95%"
                            stopColor="var(--color-total)"
                            stopOpacity={0.1}
                        />
                    </linearGradient>
                  </defs>
                  <Area
                    dataKey="total"
                    type="natural"
                    fill="url(#fillTotal)"
                    stroke="var(--color-total)"
                    stackId="a"
                  />
                </AreaChart>
              </ChartContainer>
            )}
        </CardContent>
    </Card>
  );
}
