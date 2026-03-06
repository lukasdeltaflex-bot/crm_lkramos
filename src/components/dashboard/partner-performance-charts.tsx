'use client';

import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { formatCurrency, cleanBankName } from '@/lib/utils';
import type { Proposal, UserSettings } from '@/lib/types';
import { useMemo } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BankIcon } from '@/components/bank-icon';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';

interface PartnerPerformanceChartsProps {
  proposals: Proposal[];
}

/**
 * Componente customizado para o eixo Y que exibe o ícone do banco e o nome limpo.
 */
const CustomYAxisTick = ({ x, y, payload, type, bankDomains, promoterDomains, showBankLogos, showPromoterLogos }: any) => {
  if (type === 'banks') {
    const cleanedName = cleanBankName(payload.value);
    const domain = bankDomains?.[payload.value];
    return (
      <g transform={`translate(${x},${y})`}>
        <foreignObject x={-185} y={-10} width={180} height={20}>
          <div className="flex items-center justify-end gap-2 w-full h-full pr-1">
            <span className="text-[10px] font-bold text-muted-foreground truncate text-right flex-1 leading-none">
              {cleanedName}
            </span>
            <div className="shrink-0">
                <BankIcon bankName={payload.value} domain={domain} showLogo={showBankLogos} className="h-3.5 w-3.5" />
            </div>
          </div>
        </foreignObject>
      </g>
    );
  }

  if (type === 'promoters') {
    const domain = promoterDomains?.[payload.value];
    return (
      <g transform={`translate(${x},${y})`}>
        <foreignObject x={-185} y={-10} width={180} height={20}>
          <div className="flex items-center justify-end gap-2 w-full h-full pr-1">
            <span className="text-[10px] font-bold text-muted-foreground truncate text-right flex-1 leading-none">
              {payload.value}
            </span>
            <div className="shrink-0">
                <BankIcon bankName={payload.value} domain={domain} showLogo={showPromoterLogos} className="h-3.5 w-3.5" />
            </div>
          </div>
        </foreignObject>
      </g>
    );
  }

  return (
    <text
      x={x - 10}
      y={y}
      dy={4}
      textAnchor="end"
      fill="hsl(var(--muted-foreground))"
      fontSize={11}
      fontWeight="bold"
    >
      {payload.value.length > 25 ? `${payload.value.substring(0, 25)}...` : payload.value}
    </text>
  );
};

export function PartnerPerformanceCharts({ proposals }: PartnerPerformanceChartsProps) {
  const { user } = useUser();
  const firestore = useFirestore();

  const settingsDocRef = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return doc(firestore, 'userSettings', user.uid);
  }, [firestore, user]);

  const { data: userSettings } = useDoc<UserSettings>(settingsDocRef);
  const showBankLogos = userSettings?.showBankLogos ?? true;
  const showPromoterLogos = userSettings?.showPromoterLogos ?? true;
  const bankDomains = userSettings?.bankDomains || {};
  const promoterDomains = userSettings?.promoterDomains || {};

  const bankData = useMemo(() => {
    const dataMap: Record<string, number> = {};
    proposals.forEach(p => {
      const bank = p.bank || 'Não Informado';
      const amount = Number(p.commissionBase === 'net' ? (p.netAmount || 0) : (p.grossAmount || 0)) || 0;
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
      const amount = Number(p.commissionBase === 'net' ? (p.netAmount || 0) : (p.grossAmount || 0)) || 0;
      dataMap[promoter] = (dataMap[promoter] || 0) + amount;
    });

    return Object.entries(dataMap)
      .map(([name, total]) => ({ name, total }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);
  }, [proposals]);

  const operatorData = useMemo(() => {
    const dataMap: Record<string, number> = {};
    proposals.forEach(p => {
      if (p.status === 'Pago' || p.status === 'Saldo Pago') {
        const operator = p.operator || 'Sem Operador';
        const amount = Number(p.commissionBase === 'net' ? (p.netAmount || 0) : (p.grossAmount || 0)) || 0;
        dataMap[operator] = (dataMap[operator] || 0) + amount;
      }
    });

    return Object.entries(dataMap)
      .map(([name, total]) => ({ name, total }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);
  }, [proposals]);

  const renderChart = (data: { name: string; total: number }[], type: 'banks' | 'promoters' | 'operators') => (
    <div className="h-[300px] w-full pt-4">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ left: 0, right: 30 }}>
          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--muted-foreground)/0.1)" />
          <XAxis type="number" hide />
          <YAxis 
            dataKey="name" 
            type="category" 
            width={180} 
            tickLine={false}
            axisLine={false}
            tick={<CustomYAxisTick type={type} bankDomains={bankDomains} promoterDomains={promoterDomains} showBankLogos={showBankLogos} showPromoterLogos={showPromoterLogos} />}
          />
          <Tooltip 
            cursor={{ fill: 'hsl(var(--muted)/0.1)' }}
            formatter={(value: number, name: any, props: any) => {
                const label = type === 'banks' ? cleanBankName(props.payload.name) : props.payload.name;
                return [formatCurrency(value), label];
            }}
            contentStyle={{ 
              borderRadius: 'var(--radius)',
              border: '1px solid hsl(var(--border))',
              backgroundColor: 'hsl(var(--background))',
              color: 'hsl(var(--foreground))'
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

  if (proposals.length === 0) return (
    <Card className="h-full border-border/50 shadow-md">
        <CardHeader>
            <CardTitle className="text-xl font-headline text-primary">Rankings de Produção</CardTitle>
            <CardDescription>Aguardando propostas para gerar análise</CardDescription>
        </CardHeader>
        <CardContent className="h-[300px] flex items-center justify-center text-muted-foreground border-2 border-dashed rounded-xl m-6">
            Sem dados suficientes no período.
        </CardContent>
    </Card>
  );

  return (
    <Card className="h-full border-border/50 shadow-md">
      <CardHeader>
        <CardTitle className="text-xl font-headline text-primary">Rankings de Produção</CardTitle>
        <CardDescription>Performance financeira por categoria (Top 5)</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="banks">
          <TabsList className="grid w-full grid-cols-3 mb-4 bg-muted/50">
            <TabsTrigger value="banks">Bancos</TabsTrigger>
            <TabsTrigger value="promoters">Promotoras</TabsTrigger>
            <TabsTrigger value="operators">Operadores</TabsTrigger>
          </TabsList>
          <TabsContent value="banks" className="mt-0">
            {bankData.length > 0 ? renderChart(bankData, 'banks') : (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground text-sm border-2 border-dashed rounded-lg">
                    Nenhum banco registrado no período.
                </div>
            )}
          </TabsContent>
          <TabsContent value="promoters" className="mt-0">
            {promoterData.length > 0 ? renderChart(promoterData, 'promoters') : (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground text-sm border-2 border-dashed rounded-lg">
                    Nenhuma promotora registrada no período.
                </div>
            )}
          </TabsContent>
          <TabsContent value="operators" className="mt-0">
            {operatorData.length > 0 ? renderChart(operatorData, 'operators') : (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground text-sm border-2 border-dashed rounded-lg text-center p-4">
                    Nenhum operador com propostas pagas neste período.
                </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
