'use client';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { LucideIcon, Zap, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTheme } from '@/components/theme-provider';

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
 * StatsCard Elite V37
 * Aura de fundo (12%) e Bordas (50%) perfeitamente integradas ao Laboratório de Cores.
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
  const { statusColors } = useTheme();
  
  const getThemeStyles = () => {
    // Prioridade: Cor do Laboratório de Status
    const customColor = statusColors[title];
    if (customColor) {
        return {
            card: '',
            style: { 
                borderColor: `hsla(${customColor}, 0.5)`,
                backgroundColor: `hsla(${customColor}, 0.12)`,
                color: `hsl(${customColor})`,
                '--status-color': customColor 
            } as any,
            stroke: `hsl(${customColor})`
        };
    }

    const t = title.toLowerCase();
    if (isCritical) return { card: 'border-red-400 bg-red-50 dark:bg-red-900/20 animate-pulse', style: {}, stroke: '#dc2626' };

    // Fallbacks Neutros
    if (t.includes('digitado')) return { card: 'border-zinc-300 bg-zinc-50 dark:bg-zinc-900/40', style: {}, stroke: '#a1a1aa' };
    
    return { 
        card: 'border-slate-200 bg-slate-50 dark:bg-slate-900/10', 
        style: {},
        stroke: '#475569'
    };
  };

  const theme = getThemeStyles();

  return (
    <Card 
        className={cn(
            'hover:shadow-lg transition-all group relative overflow-hidden rounded-xl h-full flex flex-col border-2 py-3.5 px-5', 
            theme.card,
            isHot && 'ring-2 ring-orange-500 ring-offset-2',
            className
        )}
        style={theme.style}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 p-0 mb-1.5">
        <div className="flex flex-col gap-0.5">
            <CardTitle className="text-[10px] font-black uppercase tracking-[0.1em]" style={{ color: theme.style?.color || 'inherit' }}>
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
        <Icon className="h-4 w-4 opacity-80" style={{ color: theme.style?.color || 'inherit' }} />
      </CardHeader>
      <CardContent className="flex-1 flex flex-col justify-between p-0">
        <div className="flex items-baseline justify-between gap-2">
            <div className={cn("text-2xl sm:text-3xl font-light tracking-tighter", valueClassName)} style={{ color: theme.style?.color || 'inherit' }}>
                {value}
            </div>
            {percentage !== undefined && (
                <div className="text-[10px] font-bold bg-background/60 px-2 py-0.5 rounded border border-border/30">
                    {percentage.toFixed(1).replace('.', ',')}%
                </div>
            )}
        </div>
        
        <div className="mt-2 pt-2 border-t border-border/10 flex items-center justify-between">
            <div className="flex flex-col">
                <p className="text-[9px] font-bold opacity-70 uppercase tracking-tighter">
                    {description}
                </p>
                {subValue && (
                    <p className="text-[9px] font-black opacity-80 uppercase tracking-tighter mt-0.5">
                        {subValue}
                    </p>
                )}
            </div>
            {topContributor && (
                <p className="text-[9px] font-bold truncate max-w-[100px]" style={{ color: theme.style?.color || 'inherit' }}>
                    {topContributor.split(' ')[0]}
                </p>
            )}
        </div>
      </CardContent>
    </Card>
  );
}