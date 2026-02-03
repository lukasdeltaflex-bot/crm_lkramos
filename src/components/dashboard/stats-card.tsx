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
 * StatsCard Premium Executivo Compacto V19
 * Design com fonte ultra-fina e dimensões reduzidas para melhor densidade de dados.
 */
export function StatsCard({ title, value, icon: Icon, description, percentage, className, valueClassName }: StatsCardProps) {
  
  const getThemeStyles = () => {
    const t = title.toLowerCase();
    
    // AMBER/YELLOW: Em Andamento
    if (t.includes('andamento')) 
        return {
            card: 'border-yellow-200 dark:border-yellow-800 bg-yellow-50/30 dark:bg-yellow-900/10',
            text: 'text-yellow-600 dark:text-yellow-500'
        };

    // ORANGE: Saldo Pago / Saldo a Receber
    if (t.includes('saldo pago') || t.includes('saldo a receber')) 
        return {
            card: 'border-orange-200 dark:border-orange-800 bg-orange-50/30 dark:bg-orange-900/10',
            text: 'text-orange-600 dark:text-orange-400'
        };

    // GREEN: Performance / Produção / Recebida / Paga / Pago
    if (t.includes('performance') || t.includes('recebida') || t.includes('paga') || t.includes('pago')) 
        return {
            card: 'border-green-200 dark:border-green-800 bg-green-50/30 dark:bg-green-900/10',
            text: 'text-green-600 dark:text-green-400'
        };
    
    // BLUE: Aguardando / Esperada
    if (t.includes('comissão esperada') || t.includes('aguardando')) 
        return {
            card: 'border-blue-200 dark:border-blue-800 bg-blue-50/30 dark:bg-blue-900/10',
            text: 'text-blue-600 dark:text-blue-400'
        };
    
    // PURPLE: Pendente
    if (t.includes('pendente')) 
        return {
            card: 'border-purple-200 dark:border-purple-800 bg-purple-50/30 dark:bg-purple-900/10',
            text: 'text-purple-600 dark:text-purple-400'
        };
    
    // RED: Reprovado
    if (t.includes('reprovado')) 
        return {
            card: 'border-red-200 dark:border-red-800 bg-red-50/30 dark:bg-red-900/10',
            text: 'text-red-600 dark:text-red-400'
        };

    // SLATE: Default (Total Digitado etc)
    return { 
        card: 'border-slate-200 dark:border-slate-700 bg-slate-50/30 dark:bg-slate-900/10', 
        text: 'text-slate-600 dark:text-slate-300' 
    };
  };

  const theme = getThemeStyles();

  return (
    <Card className={cn(
        'hover:shadow-md transition-all group relative overflow-hidden rounded-xl h-full flex flex-col border-2 py-2 px-3 sm:py-2.5 sm:px-3.5', 
        theme.card,
        className
    )}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 p-0 mb-1">
        <CardTitle className="text-[8px] sm:text-[9px] font-black uppercase tracking-[0.15em] text-muted-foreground/70 group-hover:text-primary transition-colors">
            {title}
        </CardTitle>
        <Icon className={cn("h-3 w-3 opacity-60", theme.text)} />
      </CardHeader>
      <CardContent className="flex-1 flex flex-col justify-between p-0">
        <div className="flex items-baseline justify-between gap-2">
            <div className={cn("text-lg sm:text-2xl font-light tracking-tighter", theme.text, valueClassName)}>
                {value}
            </div>
            {percentage !== undefined && (
                <div className="text-[8px] font-bold bg-background/60 px-1.5 py-0.5 rounded border border-border/30 text-primary">
                    {percentage.toFixed(1).replace('.', ',')}%
                </div>
            )}
        </div>
        
        {description && (
            <div className="mt-1 border-t pt-1 border-border/20">
                <p className="text-[7px] font-bold text-muted-foreground/50 uppercase tracking-tighter">
                    {description}
                </p>
            </div>
        )}
      </CardContent>
    </Card>
  );
}
