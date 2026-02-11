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
  style?: React.CSSProperties;
  overrideStatusColors?: Record<string, string>;
  overrideContainerStyle?: string;
  overrideIntensity?: string;
  overrideRadius?: string;
  overrideAnimationStyle?: string;
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
    topContributor,
    style,
    overrideStatusColors,
    overrideContainerStyle,
    overrideIntensity,
    overrideRadius,
    overrideAnimationStyle
}: StatsCardProps) {
  const { statusColors: globalStatusColors, containerStyle: globalContainerStyle, colorIntensity: globalIntensity, radius: globalRadius, animationStyle: globalAnimationStyle } = useTheme();
  
  const statusColors = overrideStatusColors || globalStatusColors;
  const containerStyle = overrideContainerStyle || globalContainerStyle;
  const intensity = overrideIntensity || globalIntensity;
  const radius = overrideRadius || globalRadius;
  const animationStyle = overrideAnimationStyle || globalAnimationStyle;

  const getThemeStyles = () => {
    const statusKey = title.toUpperCase();
    
    // Tenta encontrar a cor baseada no título (exatamente como no Laboratório)
    let customColor = statusColors[statusKey] || statusColors[title];

    // COR NEUTRA PARA CARDS ESPECÍFICOS DE VOLUME
    if (statusKey === "TOTAL DIGITADO" || statusKey === "PRODUÇÃO DIGITADA") {
        customColor = "240 5% 65%"; 
    }

    const cardClasses = cn(
        'hover:shadow-lg transition-all group relative overflow-hidden flex flex-col border-2 py-3.5 px-5 min-h-[160px] h-full card',
        `style-${containerStyle}`,
        containerStyle === 'glow' && 'style-glow',
        `intensity-${intensity}`,
        `radius-${radius}`,
        `anim-${animationStyle}`,
        'status-custom',
        isHot && 'card-hot-neon',
        className
    );

    return {
        card: cardClasses,
        style: { 
            '--status-color': customColor || '217 33% 25%',
        } as any
    };
  };

  const themeStyles = getThemeStyles();

  return (
    <Card 
        className={cn(themeStyles.card)}
        style={{ ...themeStyles.style, ...style }}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 p-0 mb-1.5">
        <div className="flex flex-col gap-0.5">
            <CardTitle className="text-[10px] font-black uppercase tracking-[0.1em]">
                {title}
            </CardTitle>
            {isCritical ? (
                <div className="flex items-center gap-1 text-[8px] font-bold text-red-600 animate-alert-pulse">
                    <AlertTriangle className="h-2.5 w-2.5 fill-current" /> PENDÊNCIA
                </div>
            ) : isHot && (
                <div className="flex items-center gap-1 text-[8px] font-black text-orange-600 dark:text-orange-400 bg-background/80 dark:bg-zinc-950/60 px-1.5 py-0.5 rounded-full border border-orange-200 dark:border-orange-900/50">
                    <Zap className="h-2.5 w-2.5 fill-current" /> EM ALTA
                </div>
            )}
        </div>
        <Icon className="h-4 w-4 opacity-80" />
      </CardHeader>
      <CardContent className="flex-1 flex flex-col justify-between p-0">
        <div className="flex items-baseline justify-between gap-2">
            <div className={cn("text-2xl sm:text-3xl font-light tracking-tighter text-foreground dark:text-zinc-100", valueClassName)}>
                {value}
            </div>
            {percentage !== undefined && (
                <div className="text-[10px] font-bold bg-background/60 dark:bg-zinc-950/40 px-2 py-0.5 rounded border border-border/30">
                    {percentage.toFixed(1).replace('.', ',')}%
                </div>
            )}
        </div>
        
        <div className="mt-2 pt-2 border-t border-border/10 flex items-center justify-between">
            <div className="flex flex-col">
                <p className="text-[9px] font-bold opacity-70 uppercase tracking-tighter text-muted-foreground dark:text-zinc-400">
                    {description}
                </p>
                {subValue && (
                    <p className="text-[9px] font-black opacity-80 uppercase tracking-tighter mt-0.5 dark:text-zinc-300">
                        {subValue}
                    </p>
                )}
            </div>
            {topContributor && (
                <p className="text-[9px] font-bold truncate max-w-[100px] text-foreground dark:text-zinc-200">
                    {topContributor.split(' ')[0]}
                </p>
            )}
        </div>
      </CardContent>
    </Card>
  );
}
