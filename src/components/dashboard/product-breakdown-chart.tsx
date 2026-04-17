
'use client';

import * as React from "react"
import { Label, Pie, PieChart } from "recharts"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import type { Proposal } from "@/lib/types"
import { formatCurrency } from "@/lib/utils"

interface ProductBreakdownChartProps {
  proposals: Proposal[]
}

const chartConfig = {
  amount: {
    label: "Volume",
  },
  "Margem": { label: "Margem", color: "hsl(217, 91%, 60%)" },
  "Portabilidade": { label: "Portabilidade", color: "hsl(142, 76%, 36%)" },
  "Refin": { label: "Refin", color: "hsl(45, 93%, 47%)" },
  "Saque Complementar": { label: "Saque", color: "hsl(24, 95%, 53%)" },
  "Cartão com saque": { label: "Cartão", color: "hsl(262, 83%, 58%)" },
  "Refin Port": { label: "Refin Port", color: "hsl(199, 89%, 48%)" },
  "Saque FGTS": { label: "Saque FGTS", color: "hsl(158, 78%, 41%)" },
  "Margem CLT": { label: "Margem CLT", color: "hsl(322, 84%, 50%)" },
  "Cartão - Plástico": { label: "Cartão Plástico", color: "hsl(346, 77%, 49%)" },
  "other": { label: "Outros", color: "hsl(215, 25%, 27%)" }
} satisfies ChartConfig

export function ProductBreakdownChart({ proposals }: ProductBreakdownChartProps) {
  const chartData = React.useMemo(() => {
    const data: Record<string, number> = {}
    proposals.forEach((p) => {
      // Baseada agora no valor bruto do contrato digitado
      const amount = p.grossAmount || 0;
      data[p.product] = (data[p.product] || 0) + amount
    })

    return Object.entries(data)
      .map(([name, value]) => ({
        product: name,
        amount: value,
        fill: (chartConfig[name as keyof typeof chartConfig] as any)?.color || chartConfig.other.color,
      }))
      .sort((a, b) => b.amount - a.amount)
  }, [proposals])

  const totalVolume = React.useMemo(() => {
    // Sincroniza com o Total Digitado passado via props (Mês Vigente)
    return proposals.reduce((acc, curr) => acc + (curr.grossAmount || 0), 0);
  }, [proposals])

  if (proposals.length === 0) return (
    <Card className="flex flex-col h-full items-center justify-center p-10 border-dashed">
        <p className="text-muted-foreground text-sm">Sem produção no período para o mix.</p>
    </Card>
  )

  return (
    <Card className="flex flex-col h-full border-none shadow-md hover:shadow-lg transition-all duration-300">
      <CardHeader className="items-center pb-0">
        <CardTitle className="text-xl font-headline font-bold text-primary">Mix de Produtos</CardTitle>
        <CardDescription className="text-sm font-medium">Volume financeiro por categoria</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pb-4 pt-6">
        <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-square max-h-[300px]"
        >
          <PieChart>
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent 
                  hideLabel 
                  formatter={(value, name) => (
                    <div className="flex flex-col gap-1">
                      <span className="font-bold text-xs uppercase text-muted-foreground">{name}</span>
                      <span className="text-primary font-bold">{formatCurrency(Number(value))}</span>
                    </div>
                  )}
                />
              }
            />
            <Pie
              data={chartData}
              dataKey="amount"
              nameKey="product"
              innerRadius={75}
              outerRadius={105}
              paddingAngle={5}
              strokeWidth={0}
            >
              <Label
                content={({ viewBox }) => {
                  if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                    return (
                      <text
                        x={viewBox.cx}
                        y={viewBox.cy}
                        textAnchor="middle"
                        dominantBaseline="middle"
                      >
                        <tspan
                          x={viewBox.cx}
                          y={viewBox.cy}
                          className="fill-foreground text-3xl font-extrabold"
                        >
                          {chartData.length}
                        </tspan>
                        <tspan
                          x={viewBox.cx}
                          y={(viewBox.cy || 0) + 24}
                          className="fill-muted-foreground text-[10px] font-bold uppercase tracking-widest"
                        >
                          Produtos
                        </tspan>
                      </text>
                    )
                  }
                }}
              />
            </Pie>
          </PieChart>
        </ChartContainer>
      </CardContent>
      <div className="p-6 pt-0 border-t bg-muted/5 flex items-center justify-between rounded-b-lg">
        <div className="flex flex-col">
            <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-tighter">Volume Digitado (Mês)</span>
            <span className="text-lg font-bold text-primary">{formatCurrency(totalVolume)}</span>
        </div>
        <div className="flex -space-x-2">
            {chartData.slice(0, 4).map((item, i) => (
                <div 
                    key={i} 
                    className="h-4 w-4 rounded-full border-2 border-background shadow-sm" 
                    style={{ backgroundColor: item.fill }} 
                    title={item.product} 
                />
            ))}
        </div>
      </div>
    </Card>
  )
}
