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
 * StatsCard Premium Executivo LK RAMOS
 * Fonte fina, elegante e colorida conforme o status.
 * Contornos coloridos e preenchimento suave.
 */
export function StatsCard({ title, value, icon: Icon, description, percentage, className, valueClassName }: StatsCardProps) {
  
  // Mapeamento de cores para bordas, fundos e agora para o TEXTO do valor
  const getThemeStyles = () => {
    const t = title.toLowerCase();
    
    if (t.includes('total') || t.includes('digitado') || t.includes('comissões')) 
        return {
            card: 'border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/20',
            text: 'text-slate-600 dark:text-slate-300'
        };
    
    if (t.includes('recebida') || t.includes('paga') || t.includes('pago')) 
        return {
            card: 'border-green-300 dark:border-green-800 bg-green-50/50 dark:bg-green-900/20',
            text: 'text-green-600 dark:text-green-400'
        };
    
    if (t.includes('saldo a receber') || t.includes('saldo pago')) 
        return {
            card: 'border-orange-300 dark:border-orange-800 bg-orange-50/50 dark:bg-orange-900/20',
            text: 'text-orange-600 dark:text-orange-400'
        };
    
    if (t.includes('comissão esperada') || t.includes('aguardando') || t.includes('andamento')) 
        return {
            card: 'border-blue-300 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-900/20',
            text: 'text-blue-600 dark:text-blue-400'
        };
    
    if (t.includes('pendente')) 
        return {
            card: 'border-purple-300 dark:border-purple-800 bg-purple-50/50 dark:bg-purple-900/20',
            text: 'text-purple-600 dark:text-purple-400'
        };
    
    if (t.includes('reprovado')) 
        return {
            card: 'border-red-300 dark:border-red-800 bg-red-50/50 dark:bg-red-900/20',
            text: 'text-red-600 dark:text-red-400'
        };

    return { card: 'border-border bg-card', text: 'text-foreground' };
  };

  const theme = getThemeStyles();

  return (
    <Card className={cn(
        'hover:shadow-lg transition-all group relative overflow-hidden shadow-md rounded-xl h-full min-h-[160px] flex flex-col border-2', 
        theme.card,
        className
    )}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 print:pb-1">
        <CardTitle className="text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground/80 group-hover:text-primary transition-colors print:text-[8px]">
            {title}
        </CardTitle>
        <div className="p-2 rounded-lg bg-background/50 dark:bg-black/20 shadow-sm border border-border/10">
            <Icon className={cn("h-4 w-4 opacity-80 group-hover:opacity-100 transition-opacity", theme.text)} />
        </div>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col justify-between print:pt-1">
        <div className="flex items-baseline justify-between gap-2">
            <div className={cn("text-3xl font-normal tracking-tighter print:text-lg", theme.text, valueClassName)}>
                {value}
            </div>
            {percentage !== undefined && (
                <div className="text-[10px] font-bold bg-background/80 dark:bg-black/40 px-2.5 py-1 rounded-full border border-border/50 shadow-sm text-primary">
                    {percentage.toFixed(1).replace('.', ',')}%
                </div>
            )}
        </div>
        
        <div className="mt-3 border-t pt-2 border-border/30 min-h-[24px]">
            {description ? (
                <p className="text-[10px] font-bold text-muted-foreground/60 mt-0 uppercase tracking-tighter">
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
