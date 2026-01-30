'use client';

import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils';
import type { Proposal } from '@/lib/types';
import { useMemo } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface PartnerPerformanceChartsProps {
  proposals: Proposal[];
}

export function PartnerPerformanceCharts({ proposals }: PartnerPerformanceChartsProps) {
  const bankData = useMemo(() => {
    const dataMap: Record<string, number> = {};
    proposals.forEach(p => {
      const bank = p.bank || 'Não Informado';
      const amount = p.commissionBase === 'net' ? (p.netAmount || 0) : (p.grossAmount || 0);
      dataMap[bank] = (dataMap[bank] || 0) + amount;
    });

    return Object.entries(dataMap)
      .map(([name, total]) => ({ name, total }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);
  }, [proposals]);

  const promoterData = useMemo(() => {
    const dataMap: Record<string, number> = {};
    proposals.forEach(p => {
      const promoter = p.promoter || 'Não Informada';
      const amount = p.commissionBase === 'net' ? (p.netAmount || 0) : (p.grossAmount || 0);
      dataMap[promoter] = (dataMap[promoter] || 0) + amount;
    });

    return Object.entries(dataMap)
      .map(([name, total]) => ({ name, total }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);
  }, [proposals]);

  const renderChart = (data: { name: string; total: number }[]) => (
    <div className="h-[300px] w-full pt-4">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ left: 30, right: 30 }}>
          <CartesianGrid strokeDasharray="3 3" horizontal={false} />
          <XAxis type="number" hide />
          <YAxis 
            dataKey="name" 
            type="category" 
            width={120} 
            fontSize={11}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => value.length > 15 ? `${value.substring(0, 15)}...` : value}
          />
          <Tooltip 
            cursor={{ fill: 'hsl(var(--muted)/0.5)' }}
            formatter={(value: number) => [formatCurrency(value), 'Volume']}
            contentStyle={{ 
              borderRadius: 'var(--radius)',
              border: '1px solid hsl(var(--border))',
              backgroundColor: 'hsl(var(--background))' 
            }}
          />
          <Bar 
            dataKey="total" 
            fill="hsl(var(--primary))" 
            radius={[0, 4, 4, 0]} 
            barSize={25}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );

  if (proposals.length === 0) return null;

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-xl font-headline text-primary">Ranking de Performance</CardTitle>
        <CardDescription>Volume financeiro por parceiro (Top 5)</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="banks">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="banks">Bancos</TabsTrigger>
            <TabsTrigger value="promoters">Promotoras</TabsTrigger>
          </TabsList>
          <TabsContent value="banks" className="mt-0">
            {bankData.length > 0 ? renderChart(bankData) : (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground text-sm border-2 border-dashed rounded-lg">
                    Nenhum banco registrado no período.
                </div>
            )}
          </TabsContent>
          <TabsContent value="promoters" className="mt-0">
            {promoterData.length > 0 ? renderChart(promoterData) : (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground text-sm border-2 border-dashed rounded-lg">
                    Nenhuma promotora registrada no período.
                </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
