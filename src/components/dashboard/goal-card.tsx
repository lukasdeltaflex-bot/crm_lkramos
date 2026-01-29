'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Target, TrendingUp } from 'lucide-react';
import { formatCurrency, cn } from '@/lib/utils';

interface GoalCardProps {
  currentProduction: number;
  monthlyGoal?: number;
  className?: string;
}

export function GoalCard({ currentProduction, monthlyGoal = 100000, className }: GoalCardProps) {
  const percentage = Math.min((currentProduction / monthlyGoal) * 100, 100);
  const isGoalReached = currentProduction >= monthlyGoal;

  return (
    <Card className={cn('hover:border-primary/50 transition-colors', className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="space-y-1">
          <CardTitle className="text-sm font-medium">Meta de Produção Mensal</CardTitle>
          <CardDescription className="text-xs">Meta: {formatCurrency(monthlyGoal)}</CardDescription>
        </div>
        <Target className={cn("h-4 w-4", isGoalReached ? "text-green-500" : "text-muted-foreground")} />
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-3">
          <div className="flex items-end justify-between gap-2">
            <div className="text-2xl font-bold">{formatCurrency(currentProduction)}</div>
            <div className={cn("flex items-center gap-1 text-xs font-medium", isGoalReached ? "text-green-500" : "text-muted-foreground")}>
              <TrendingUp className="h-3 w-3" />
              {percentage.toFixed(1)}%
            </div>
          </div>
          <Progress value={percentage} className="h-2" />
          {isGoalReached ? (
            <p className="text-[10px] text-green-500 font-medium animate-pulse">🎉 Meta atingida! Parabéns!</p>
          ) : (
            <p className="text-[10px] text-muted-foreground">Faltam {formatCurrency(monthlyGoal - currentProduction)} para a meta.</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
