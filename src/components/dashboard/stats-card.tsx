import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { LucideIcon, Zap, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatsCardProps {
  title: string;
  value: string;
  icon: LucideIcon;
  description?: string;
  subValue?: string;
  percentage?: number;
  className?: string;
  valueClassName?: string;
  sparklineData?: number[];
  isHot?: boolean;
  isCritical?: boolean;
  topContributor?: string;
}

/**
 * StatsCard Premium Executivo V29
 * Equilíbrio perfeito entre tamanho e densidade de informação.
 * Cor Zinc para totais e semântica para status.
 */
export function StatsCard({ 
    title, 
    value, 
    icon: Icon, 
    description, 
    subValue,
    percentage, 
    className, 
    valueClassName,
    sparklineData = [],
    isHot = false,
    isCritical = false,
    topContributor
}: StatsCardProps) {
  
  const getThemeStyles = () => {
    const t = title.toLowerCase();

    if (isCritical) 
        return {
            card: 'border-red-300 dark:border-red-800 bg-red-50/50 dark:bg-red-900/20 animate-pulse shadow-[0_0_15px_rgba(220,38,38,0.1)]',
            text: 'text-red-600 dark:text-red-400',
            stroke: '#dc2626'
        };

    if (t === 'total digitado' || t === 'total de comissões')
        return {
            card: 'border-zinc-300 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-900/10',
            text: 'text-zinc-600 dark:text-zinc-400',
            stroke: '#52525b'
        };
    
    if (t.includes('andamento') || t.includes('esperada')) 
        return {
            card: 'border-yellow-200 dark:border-yellow-800 bg-yellow-50/30 dark:bg-yellow-900/10',
            text: 'text-yellow-600 dark:text-yellow-500',
            stroke: '#d97706'
        };

    if (t.includes('saldo pago') || t.includes('saldo a receber')) 
        return {
            card: 'border-orange-200 dark:border-orange-800 bg-orange-50/30 dark:bg-orange-900/10',
            text: 'text-orange-600 dark:text-orange-400',
            stroke: '#ea580c'
        };

    if (t.includes('performance') || t.includes('recebida') || t.includes('paga') || t.includes('pago')) 
        return {
            card: 'border-green-200 dark:border-green-800 bg-green-50/30 dark:bg-green-900/10',
            text: 'text-green-600 dark:text-green-400',
            stroke: '#16a34a'
        };
    
    if (t.includes('aguardando')) 
        return {
            card: 'border-blue-200 dark:border-blue-800 bg-blue-50/30 dark:bg-blue-900/10',
            text: 'text-blue-600 dark:text-blue-400',
            stroke: '#2563eb'
        };
    
    if (t.includes('pendente')) 
        return {
            card: 'border-purple-200 dark:border-purple-800 bg-purple-50/30 dark:bg-purple-900/10',
            text: 'text-purple-600 dark:text-purple-400',
            stroke: '#9333ea'
        };
    
    if (t.includes('reprovado')) 
        return {
            card: 'border-red-200 dark:border-red-800 bg-red-50/30 dark:bg-red-900/10',
            text: 'text-red-600 dark:text-red-400',
            stroke: '#dc2626'
        };

    return { 
        card: 'border-slate-200 dark:border-slate-700 bg-slate-50/30 dark:bg-slate-900/10', 
        text: 'text-slate-600 dark:text-slate-300',
        stroke: '#475569'
    };
  };

  const theme = getThemeStyles();

  const renderSparkline = () => {
    if (!sparklineData || sparklineData.length < 2) return null;
    const max = Math.max(...sparklineData, 1);
    const width = 70;
    const height = 22;
    const points = sparklineData.map((v, i) => {
        const x = (i / (sparklineData.length - 1)) * width;
        const y = height - (v / max) * height;
        return `${x},${y}`;
    }).join(' ');

    return (
        <svg width={width} height={height} className="opacity-40">
            <polyline
                fill="none"
                stroke={theme.stroke}
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                points={points}
            />
        </svg>
    );
  };

  return (
    <Card className={cn(
        'hover:shadow-md transition-all group relative overflow-hidden rounded-xl h-full flex flex-col border-2 py-3.5 px-5', 
        theme.card,
        isHot && 'ring-2 ring-orange-500 ring-offset-2',
        className
    )}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 p-0 mb-1.5">
        <div className="flex flex-col gap-0.5">
            <CardTitle className="text-[10px] font-black uppercase tracking-[0.1em] text-muted-foreground group-hover:text-primary transition-colors">
                {title}
            </CardTitle>
            {isCritical ? (
                <div className="flex items-center gap-1 text-[8px] font-bold text-red-600 animate-bounce">
                    <AlertTriangle className="h-2.5 w-2.5 fill-current" /> PENDÊNCIA
                </div>
            ) : isHot && (
                <div className="flex items-center gap-1 text-[8px] font-bold text-orange-600 animate-pulse">
                    <Zap className="h-2.5 w-2.5 fill-current" /> EM ALTA
                </div>
            )}
        </div>
        <div className="flex items-center gap-2">
            {renderSparkline()}
            <Icon className={cn("h-4 w-4 opacity-60", theme.text)} />
        </div>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col justify-between p-0">
        <div className="flex items-baseline justify-between gap-2">
            <div className={cn("text-2xl sm:text-3xl font-light tracking-tighter", theme.text, valueClassName)}>
                {value}
            </div>
            {percentage !== undefined && (
                <div className="text-[10px] font-bold bg-background/60 px-2 py-0.5 rounded border border-border/30 text-primary">
                    {percentage.toFixed(1).replace('.', ',')}%
                </div>
            )}
        </div>
        
        <div className="mt-2 pt-2 border-t border-border/10 flex items-center justify-between">
            <div className="flex flex-col">
                <p className="text-[9px] font-bold text-muted-foreground/70 uppercase tracking-tighter">
                    {description}
                </p>
                {subValue && (
                    <p className="text-[9px] font-black text-primary/70 uppercase tracking-tighter mt-0.5">
                        {subValue}
                    </p>
                )}
            </div>
            {topContributor && (
                <p className="text-[9px] font-bold text-primary/60 truncate max-w-[100px]">
                    {topContributor.split(' ')[0]}
                </p>
            )}
        </div>
      </CardContent>
    </Card>
  );
}
