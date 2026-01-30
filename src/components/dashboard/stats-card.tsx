
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

export function StatsCard({ title, value, icon: Icon, description, percentage, className, valueClassName }: StatsCardProps) {
  return (
    <Card className={cn('hover:shadow-md transition-all group relative overflow-hidden border-none', className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 print:pb-1">
        <CardTitle className="text-sm font-bold uppercase tracking-tight print:text-xs">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
      </CardHeader>
      <CardContent className="print:pt-1">
        <div className="flex items-baseline justify-between gap-2">
            <div className={cn("text-2xl font-black print:text-lg", valueClassName)}>{value}</div>
            {percentage !== undefined && (
                <div className="text-[10px] font-bold bg-white/50 backdrop-blur-sm px-1.5 py-0.5 rounded border border-black/5">
                    {percentage.toFixed(1).replace('.', ',')}%
                </div>
            )}
        </div>
        {description && <p className="text-[10px] font-medium text-muted-foreground mt-1 uppercase opacity-70">{description}</p>}
      </CardContent>
    </Card>
  );
}
