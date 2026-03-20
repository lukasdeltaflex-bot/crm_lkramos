import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, Pencil, Check, X, Trophy, Zap } from 'lucide-react';
import { formatCurrency, cn, formatCurrencyInput } from '@/lib/utils';
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
  const [editValue, setEditValue] = useState<number>(monthlyGoal || 0);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    setEditValue(monthlyGoal || 0);
  }, [monthlyGoal]);

  const handleSave = () => {
    if (editValue > 0) {
      onGoalChange(editValue);
      setIsEditing(false);
    }
  };

  const percentageOfGoal = Math.min((currentProduction / (monthlyGoal || 1)) * 100, 100);
  const conversionRate = totalDigitized > 0 ? (currentProduction / totalDigitized) * 100 : 0;

  const renderSparkline = () => {
    // 🛡️ BLINDAGEM MATEMÁTICA V2: Evita erros em séries históricas curtas ou zeradas
    if (!sparklineData || sparklineData.length < 2) return null;
    
    const validData = sparklineData.map(v => Number(v) || 0);
    const max = Math.max(...validData, 1);
    const width = 100;
    const height = 22;
    
    const points = validData.map((v, i) => {
        const x = (i / (validData.length - 1)) * width;
        const y = height - (v / max) * height;
        return `${x},${y}`;
    }).join(' ');

    return (
        <svg width={width} height={height} className="opacity-50" preserveAspectRatio="none">
            <polyline
                fill="none"
                stroke={isHot ? "#10b981" : "#16a34a"}
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
        isHot && 'ring-2 ring-emerald-500 ring-offset-2 scale-[1.01] border-emerald-500 bg-emerald-50/30 dark:bg-emerald-900/10 shadow-[0_0_25px_rgba(16,185,129,0.3)]',
        className
    )}>
      <CardContent className="p-4 sm:p-5">
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-4">
            <div className={cn(
                "p-2 rounded-xl transition-all duration-700",
                isHot ? "bg-emerald-100 dark:bg-emerald-900/40 animate-pulse scale-110" : "bg-green-100 dark:bg-green-900/40"
            )}>
                <Trophy className={cn("h-4 w-4", isHot ? "text-emerald-600" : "text-green-600")} />
            </div>
            <div>
              <h3 className={cn(
                  "text-xs font-black uppercase tracking-widest transition-colors",
                  isHot ? "text-emerald-800 dark:text-emerald-400" : "text-green-800 dark:text-green-400"
              )}>
                  {isHot ? 'Objetivo Conquistado' : 'Meta de Produção'}
              </h3>
              <p className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-tighter">Performance real acumulada</p>
            </div>
          </div>

          {isEditing ? (
            <div className="flex items-center gap-2 bg-white dark:bg-zinc-900 p-1.5 rounded-lg border shadow-sm scale-95 origin-right animate-in zoom-in-95">
              <div className="relative flex items-center">
                <span className="absolute left-3 text-[10px] font-black text-muted-foreground">R$</span>
                <Input
                  type="text"
                  value={formatCurrencyInput(editValue)}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, "");
                    const num = val ? parseInt(val) / 100 : 0;
                    setEditValue(num);
                  }}
                  className="h-8 w-32 text-xs border-none font-bold pl-8 focus-visible:ring-0"
                  autoFocus
                />
              </div>
              <Button size="icon" variant="ghost" className="h-8 w-8 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20" onClick={handleSave}><Check className="h-4 w-4" /></Button>
              <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:bg-red-50 dark:hover:bg-red-900/20" onClick={() => setIsEditing(false)}><X className="h-4 w-4" /></Button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <div className="hidden md:block">{renderSparkline()}</div>
              <div className={cn(
                  "text-[10px] font-black px-3 py-1 rounded-full border shadow-sm animate-in fade-in transition-colors",
                  isHot 
                    ? "text-emerald-700 bg-emerald-50/80 border-emerald-200" 
                    : "text-green-700 dark:text-green-400 bg-white/90 dark:bg-zinc-950/60 border-green-100 dark:border-green-900/50"
              )}>
                META: {isPrivacyMode ? '•••••' : formatCurrency(monthlyGoal)}
              </div>
              <Button variant="ghost" size="icon" className="h-7 w-7 opacity-40 hover:opacity-100 transition-opacity" onClick={() => setIsEditing(true)}>
                <Pencil className="h-3.5 w-3.5" />
              </Button>
            </div>
          )}
        </div>

        <div className="flex items-end justify-between mb-2" onClick={onValueClick}>
          <div className="space-y-2 cursor-pointer group">
            <div className={cn(
                "text-2xl sm:text-3xl font-light tracking-tighter group-hover:translate-x-1 transition-all duration-500",
                isHot ? "text-emerald-600 dark:text-emerald-400" : "text-green-600 dark:text-green-400"
            )}>
              {isPrivacyMode ? '•••••' : formatCurrency(currentProduction)}
            </div>
            <div className="flex items-center gap-2 text-[10px] font-black text-muted-foreground uppercase tracking-widest">
              <TrendingUp className={cn("h-3.5 w-3.5", isHot ? "text-emerald-500" : "text-green-500")} />
              Conversão: <span className="text-foreground">{conversionRate.toFixed(1)}%</span>
            </div>
          </div>

          <div className="text-right space-y-2">
            <div className={cn(
                "text-xl sm:text-2xl font-light tracking-tighter animate-in slide-in-from-right-2",
                isHot ? "text-emerald-600 dark:text-emerald-400" : "text-green-600 dark:text-green-400"
            )}>
              {percentageOfGoal.toFixed(1)}%
            </div>
            <p className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-widest">Atingido</p>
          </div>
        </div>

        <div className="relative pt-1.5">
            <Progress 
                value={percentageOfGoal} 
                className={cn(
                    "h-1.5 transition-all duration-1000",
                    isHot ? "bg-emerald-100 dark:bg-emerald-900/30 [&>div]:bg-emerald-500" : "bg-green-100 dark:bg-green-900/30"
                )} 
            />
        </div>

        {topContributor && (
            <div className={cn(
                "mt-3 pt-3 border-t flex items-center justify-between",
                isHot ? "border-emerald-200/50" : "border-green-200/50"
            )}>
                <div className="flex items-center gap-2">
                    <div className={cn("h-1.5 w-1.5 rounded-full animate-pulse", isHot ? "bg-emerald-500" : "bg-green-500")} />
                    <span className="text-[10px] font-bold text-muted-foreground uppercase">Líder:</span>
                    <span className="text-[10px] font-black text-primary uppercase">{topContributor}</span>
                </div>
                {isHot ? (
                    <div className="flex items-center gap-2 text-[9px] font-black text-emerald-600 animate-in zoom-in">
                        <Trophy className="h-2.5 w-2.5 fill-current" /> META BATIDA
                    </div>
                ) : (
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
