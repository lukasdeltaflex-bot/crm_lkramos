
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
 * StatsCard com visual premium LK RAMOS.
 * - Bordas sutis: border-border/50
 * - Valores monetários font-normal para elegância
 */
export function StatsCard({ title, value, icon: Icon, description, percentage, className, valueClassName }: StatsCardProps) {
  return (
    <Card className={cn('hover:shadow-md transition-all group relative overflow-hidden border border-border/50 bg-card shadow-sm', className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 print:pb-1">
        <CardTitle className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground group-hover:text-primary transition-colors print:text-[8px]">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground/50 group-hover:text-primary transition-colors" />
      </CardHeader>
      <CardContent className="print:pt-1">
        <div className="flex items-baseline justify-between gap-2">
            <div className={cn("text-2xl font-normal tracking-tight text-foreground print:text-lg", valueClassName)}>{value}</div>
            {percentage !== undefined && (
                <div className="text-[10px] font-bold bg-background/50 dark:bg-black/20 backdrop-blur-sm px-1.5 py-0.5 rounded border border-border/50">
                    {percentage.toFixed(1).replace('.', ',')}%
                </div>
            )}
        </div>
        {description && <p className="text-[10px] font-medium text-muted-foreground mt-1 uppercase opacity-70">{description}</p>}
      </CardContent>
    </Card>
  );
}
