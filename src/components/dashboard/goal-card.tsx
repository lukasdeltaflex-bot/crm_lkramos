
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, Pencil, Check, X, Trophy, Zap } from 'lucide-react';
import { formatCurrency, cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface GoalCardProps {
  currentProduction: number;
  totalDigitized: number;
  monthlyGoal: number;
  onGoalChange: (newGoal: number) => void;
  isPrivacyMode?: boolean;
  onValueClick?: () => void;
  className?: string;
  sparklineData?: number[];
  isHot?: boolean;
  topContributor?: string;
}

export function GoalCard({ 
    currentProduction, 
    totalDigitized, 
    monthlyGoal,
    onGoalChange,
    isPrivacyMode, 
    onValueClick, 
    className,
    sparklineData = [],
    isHot = false,
    topContributor
}: GoalCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(String(monthlyGoal));
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    setEditValue(String(monthlyGoal));
  }, [monthlyGoal]);

  const handleSave = () => {
    const parsed = parseFloat(editValue);
    if (!isNaN(parsed) && parsed > 0) {
      onGoalChange(parsed);
      setIsEditing(false);
    }
  };

  const percentageOfGoal = Math.min((currentProduction / (monthlyGoal || 1)) * 100, 100);
  const conversionRate = totalDigitized > 0 ? (currentProduction / totalDigitized) * 100 : 0;

  const renderSparkline = () => {
    if (!sparklineData || sparklineData.length < 2) return null;
    const max = Math.max(...sparklineData, 1);
    const width = 100;
    const height = 22;
    const points = sparklineData.map((v, i) => {
        const x = (i / (sparklineData.length - 1)) * width;
        const y = height - (v / max) * height;
        return `${x},${y}`;
    }).join(' ');

    return (
        <svg width={width} height={height} className="opacity-50">
            <polyline
                fill="none"
                stroke="#16a34a"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
                points={points}
            />
        </svg>
    );
  };

  if (!isClient) return <Card className="h-24 animate-pulse bg-muted rounded-xl w-full" />;

  return (
    <Card className={cn(
        'relative overflow-hidden bg-green-50/50 dark:bg-green-900/10 border-2 border-green-200 dark:border-green-800 shadow-md rounded-2xl w-full transition-all duration-500', 
        isHot && 'ring-2 ring-orange-500 ring-offset-2 scale-[1.01]',
        className
    )}>
      <CardContent className="p-4 sm:p-5">
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-4">
            <div className={cn(
                "p-2 rounded-xl bg-green-100 dark:bg-green-900/40",
                isHot && "bg-orange-100 dark:bg-orange-900/40 animate-pulse"
            )}>
                {isHot ? <Zap className="h-4 w-4 text-orange-600" /> : <Trophy className="h-4 w-4 text-green-600" />}
            </div>
            <div>
              <h3 className="text-xs font-black text-green-800 dark:text-green-400 uppercase tracking-widest">Meta de Produção</h3>
              <p className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-tighter">Performance real acumulada</p>
            </div>
          </div>

          {isEditing ? (
            <div className="flex items-center gap-2 bg-white p-1.5 rounded-lg border shadow-sm scale-95 origin-right">
              <Input
                type="number"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                className="h-8 w-24 text-xs border-none"
                autoFocus
              />
              <Button size="icon" variant="ghost" className="h-8 w-8" onClick={handleSave}><Check className="h-4 w-4 text-green-500" /></Button>
              <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setIsEditing(false)}><X className="h-4 w-4 text-destructive" /></Button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <div className="hidden md:block">{renderSparkline()}</div>
              <div className="text-[10px] font-black text-green-700 bg-white/90 px-3 py-1 rounded-full border border-green-100 shadow-sm">
                META: {isPrivacyMode ? '•••••' : formatCurrency(monthlyGoal)}
              </div>
              <Button variant="ghost" size="icon" className="h-7 w-7 opacity-40 hover:opacity-100 transition-opacity" onClick={() => setIsEditing(true)}>
                <Pencil className="h-3.5 w-3.5" />
              </Button>
            </div>
          )}
        </div>

        <div className="flex items-end justify-between mb-2" onClick={onValueClick}>
          <div className="space-y-1 cursor-pointer group">
            <div className="text-2xl sm:text-3xl font-light tracking-tighter text-green-600 dark:text-green-400 group-hover:translate-x-1 transition-transform">
              {isPrivacyMode ? '•••••' : formatCurrency(currentProduction)}
            </div>
            <div className="flex items-center gap-2 text-[10px] font-black text-muted-foreground uppercase tracking-widest">
              <TrendingUp className="h-3.5 w-3.5 text-green-500" />
              Conversão: <span className="text-foreground">{conversionRate.toFixed(1)}%</span>
            </div>
          </div>

          <div className="text-right">
            <div className="text-xl sm:text-2xl font-light text-green-600 dark:text-green-400 tracking-tighter">
              {percentageOfGoal.toFixed(1)}%
            </div>
            <p className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-widest">Atingido</p>
          </div>
        </div>

        <div className="relative pt-1.5">
            <Progress value={percentageOfGoal} className="h-1.5 bg-green-100 dark:bg-green-900/30" />
        </div>

        {topContributor && (
            <div className="mt-3 pt-3 border-t border-green-200/50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-[10px] font-bold text-muted-foreground uppercase">Líder:</span>
                    <span className="text-[10px] font-black text-primary uppercase">{topContributor}</span>
                </div>
                {isHot && (
                    <div className="flex items-center gap-2 text-[9px] font-black text-orange-600">
                        <Zap className="h-2.5 w-2.5 fill-current" /> PERFORMANCE ALTA
                    </div>
                )}
            </div>
        )}
      </CardContent>
    </Card>
  );
}
