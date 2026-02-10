
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
  isHot?: boolean;
  isCritical?: boolean;
  topContributor?: string;
}

export function StatsCard({ 
    title, 
    value, 
    icon: Icon, 
    description, 
    subValue,
    percentage, 
    className, 
    valueClassName,
    isHot = false,
    isCritical = false,
    topContributor
}: StatsCardProps) {
  const { statusColors, containerStyle } = useTheme();
  
  const getThemeStyles = () => {
    const t = title.toUpperCase();
    const customColor = statusColors[title] || statusColors[t];

    if (customColor) {
        return {
            card: cn(containerStyle === 'glow' && 'style-glow'),
            style: { 
                borderColor: `hsla(${customColor}, 0.5)`,
                backgroundColor: `hsla(${customColor}, 0.12)`,
                color: `hsl(${customColor})`,
                '--status-color': customColor 
            } as any
        };
    }
    
    // Fallback neutro
    return { 
        card: 'border-zinc-200 bg-zinc-50/50 dark:bg-zinc-900/10 dark:border-zinc-800', 
        style: { color: 'hsl(var(--foreground))' }
    };
  };

  const theme = getThemeStyles();

  return (
    <Card 
        className={cn(
            'hover:shadow-lg transition-all group relative overflow-hidden rounded-xl h-full flex flex-col border-2 py-3.5 px-5', 
            theme.card,
            className
        )}
        style={theme.style}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 p-0 mb-1.5">
        <div className="flex flex-col gap-0.5">
            <CardTitle className="text-[10px] font-black uppercase tracking-[0.1em]">
                {title}
            </CardTitle>
            {isCritical ? (
                <div className="flex items-center gap-1 text-[8px] font-bold text-red-600 animate-bounce">
                    <AlertTriangle className="h-2.5 w-2.5 fill-current" /> PENDÊNCIA
                </div>
            ) : isHot && (
                <div className="flex items-center gap-1 text-[8px] font-black text-orange-600 bg-white/80 dark:bg-black/40 px-1.5 py-0.5 rounded-full border border-orange-200 animate-pulse">
                    <Zap className="h-2.5 w-2.5 fill-current" /> EM ALTA
                </div>
            )}
        </div>
        <Icon className="h-4 w-4 opacity-80" />
      </CardHeader>
      <CardContent className="flex-1 flex flex-col justify-between p-0">
        <div className="flex items-baseline justify-between gap-2">
            <div className={cn("text-2xl sm:text-3xl font-light tracking-tighter", valueClassName)}>
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
                <p className="text-[9px] font-bold truncate max-w-[100px]">
                    {topContributor.split(' ')[0]}
                </p>
            )}
        </div>
      </CardContent>
    </Card>
  );
}
