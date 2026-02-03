import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatsCardProps {
  title: string;
  value: string;
  icon: LucideIcon;
  description?: string;
  percentage?: number;
  className?: string;
  valueClassName?: string;
}

/**
 * StatsCard Premium LK RAMOS
 * Altura rigorosamente uniforme, alinhamento perfeito e contornos coloridos leves para identificar o status.
 */
export function StatsCard({ title, value, icon: Icon, description, percentage, className, valueClassName }: StatsCardProps) {
  
  // Mapeamento de cores para bordas e ícones baseado no título
  const getThemeColor = () => {
    const t = title.toLowerCase();
    if (t.includes('digitado')) return 'border-slate-300 dark:border-slate-700 text-slate-500';
    if (t.includes('pendente')) return 'border-purple-300 dark:border-purple-700 text-purple-500';
    if (t.includes('andamento')) return 'border-yellow-300 dark:border-yellow-700 text-yellow-500';
    if (t.includes('aguardando')) return 'border-blue-300 dark:border-blue-700 text-blue-500';
    if (t.includes('saldo pago')) return 'border-orange-300 dark:border-orange-700 text-orange-500';
    if (t.includes('reprovado')) return 'border-red-300 dark:border-red-700 text-red-500';
    if (t.includes('comissão') || t.includes('paga') || t.includes('recebida')) return 'border-green-300 dark:border-green-700 text-green-500';
    if (t.includes('esperada')) return 'border-blue-300 dark:border-blue-700 text-blue-500';
    return 'border-border text-primary';
  };

  const themeClasses = getThemeColor();

  return (
    <Card className={cn(
        'hover:shadow-xl transition-all group relative overflow-hidden bg-card shadow-md rounded-xl h-full min-h-[160px] flex flex-col border-2', 
        themeClasses.split(' ')[0],
        className
    )}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 print:pb-1">
        <CardTitle className="text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground group-hover:text-primary transition-colors print:text-[8px]">
            {title}
        </CardTitle>
        <div className={cn("p-2 rounded-lg bg-current/5 transition-colors", themeClasses.split(' ')[2])}>
            <Icon className="h-4 w-4 opacity-70 group-hover:opacity-100 transition-opacity" />
        </div>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col justify-between print:pt-1">
        <div className="flex items-baseline justify-between gap-2">
            <div className={cn("text-2xl font-normal tracking-tight text-foreground print:text-lg", valueClassName)}>{value}</div>
            {percentage !== undefined && (
                <div className="text-[10px] font-bold bg-background dark:bg-black/40 px-2.5 py-1 rounded-full border border-border/50 shadow-sm text-primary">
                    {percentage.toFixed(1).replace('.', ',')}%
                </div>
            )}
        </div>
        
        <div className="mt-3 border-t pt-2 border-border/30 min-h-[24px]">
            {description ? (
                <p className="text-[10px] font-bold text-muted-foreground mt-0 uppercase tracking-tighter opacity-60">
                    {description}
                </p>
            ) : (
                <div className="h-[14px] w-full" />
            )}
        </div>
      </CardContent>
    </Card>
  );
}
