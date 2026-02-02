'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Target, TrendingUp, Pencil, Check, X, ShieldCheck, Trophy, Sparkles } from 'lucide-react';
import { formatCurrency, cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface GoalCardProps {
  currentProduction: number;
  totalDigitized: number;
  isPrivacyMode?: boolean;
  onValueClick?: () => void;
  className?: string;
}

const STORAGE_KEY_GOAL = 'lk-ramos-monthly-goal-v1';

export function GoalCard({ currentProduction, totalDigitized, isPrivacyMode, onValueClick, className }: GoalCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [monthlyGoal, setMonthlyGoal] = useState(100000);
  const [editValue, setEditValue] = useState('100000');
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    const savedGoal = localStorage.getItem(STORAGE_KEY_GOAL);
    if (savedGoal) {
      const parsed = parseFloat(savedGoal);
      if (!isNaN(parsed)) {
        setMonthlyGoal(parsed);
        setEditValue(savedGoal);
      }
    }
  }, []);

  const handleSave = () => {
    const parsed = parseFloat(editValue);
    if (!isNaN(parsed) && parsed > 0) {
      setMonthlyGoal(parsed);
      localStorage.setItem(STORAGE_KEY_GOAL, String(parsed));
      setIsEditing(false);
    }
  };

  const handleCancel = () => {
    setEditValue(String(monthlyGoal));
    setIsEditing(false);
  };

  const percentageOfGoal = Math.min((currentProduction / monthlyGoal) * 100, 100);
  const conversionRate = totalDigitized > 0 ? (currentProduction / totalDigitized) * 100 : 0;
  const isGoalReached = currentProduction >= monthlyGoal;

  if (!isClient) return <Card className="h-32 animate-pulse bg-muted rounded-xl" />;

  return (
    <Card className={cn('hover:shadow-lg transition-all group relative overflow-hidden bg-gradient-to-br from-primary/[0.02] to-primary/[0.06] border border-border/50 rounded-xl shadow-md', className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 pt-4 px-6 bg-muted/5">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-full bg-primary/10">
            <Trophy className={cn("h-4 w-4", isGoalReached ? "text-yellow-500 animate-pulse" : "text-primary/60")} />
          </div>
          <div>
            <CardTitle className="text-sm font-bold text-primary">Objetivo do Mês</CardTitle>
            <CardDescription className="text-[9px] font-bold uppercase tracking-widest opacity-60">CONTRATOS PAGOS (MÊS)</CardDescription>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isEditing ? (
            <div className="flex items-center gap-1 bg-background p-1 rounded-lg border shadow-sm">
              <Input
                type="number"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                className="h-6 w-20 text-[10px] border-none focus-visible:ring-0"
                autoFocus
              />
              <Button size="icon" variant="ghost" className="h-6 w-6" onClick={handleSave}>
                <Check className="h-3 w-3 text-green-500" />
              </Button>
              <Button size="icon" variant="ghost" className="h-6 w-6" onClick={handleCancel}>
                <X className="h-3 w-3 text-destructive" />
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <div className="px-2.5 py-0.5 bg-background/50 backdrop-blur-md rounded-full border border-border/50 text-[10px] font-bold text-primary shadow-sm">
                Meta: {isPrivacyMode ? '•••••' : formatCurrency(monthlyGoal)}
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-6 w-6 rounded-full opacity-0 group-hover:opacity-100 transition-opacity bg-background shadow-sm hover:bg-muted" 
                onClick={(e) => {
                  e.stopPropagation();
                  setIsEditing(true);
                }}
              >
                <Pencil className="h-2.5 w-2.5 text-muted-foreground" />
              </Button>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent 
        className={cn("pt-4 pb-6 px-6 cursor-pointer")}
        onClick={onValueClick}
      >
        <div className="flex flex-col gap-6">
          <div className="flex items-end justify-between">
            <div className="space-y-0.5">
              <div className={cn("text-4xl font-normal tracking-tighter text-primary leading-none", isPrivacyMode && "blur-md")}>
                {isPrivacyMode ? '•••••' : formatCurrency(currentProduction)}
              </div>
              <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wide flex items-center gap-1.5 mt-2">
                <TrendingUp className="h-3 w-3 text-green-500" />
                Conversão: <span className="text-primary">{conversionRate.toFixed(1).replace('.', ',')}%</span>
              </p>
            </div>
            <div className={cn("flex flex-col items-end gap-0.5 font-bold", isGoalReached ? "text-green-500" : "text-primary")}>
              <div className="text-3xl tabular-nums tracking-tighter">
                {percentageOfGoal.toFixed(1)}%
              </div>
              <p className="text-[9px] text-muted-foreground uppercase tracking-widest font-black">Progresso</p>
            </div>
          </div>
          
          <div className="space-y-3">
            <div className="relative">
                <Progress value={percentageOfGoal} className="h-3 bg-primary/5 rounded-full" />
                <div className="absolute top-0 bottom-0 left-0 bg-primary shadow-[0_0_15px_rgba(var(--primary),0.3)] transition-all duration-1000 ease-out rounded-full" style={{ width: `${percentageOfGoal}%` }}>
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-[shimmer_2s_infinite]" />
                </div>
            </div>
            <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider">
              {isGoalReached ? (
                <p className="text-green-500 flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5" /> PERFORMANCE EXCELENTE!
                </p>
              ) : (
                <p className="text-muted-foreground">
                  Faltam <span className={cn("text-primary", isPrivacyMode && "blur-sm")}>
                    {isPrivacyMode ? '•••••' : formatCurrency(monthlyGoal - currentProduction)}
                  </span>
                </p>
              )}
              <p className="text-muted-foreground opacity-60">Status: <span className="text-primary font-black">PAGOS</span></p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
