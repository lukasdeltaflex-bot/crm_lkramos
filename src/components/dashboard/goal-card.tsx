'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Target, TrendingUp, Pencil, Check, X, Banknote } from 'lucide-react';
import { formatCurrency, cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface GoalCardProps {
  currentProduction: number;
  isPrivacyMode?: boolean;
  onValueClick?: () => void;
  className?: string;
}

const STORAGE_KEY_GOAL = 'lk-ramos-monthly-goal-v1';

export function GoalCard({ currentProduction, isPrivacyMode, onValueClick, className }: GoalCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [monthlyGoal, setMonthlyGoal] = useState(100000);
  const [editValue, setEditValue] = useState('100000');

  useEffect(() => {
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

  const percentage = Math.min((currentProduction / monthlyGoal) * 100, 100);
  const isGoalReached = currentProduction >= monthlyGoal;

  return (
    <Card className={cn('hover:border-primary/50 transition-colors group relative overflow-hidden', className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex items-center gap-2">
          <CardTitle className="text-sm font-medium">Produção e Meta Mensal</CardTitle>
          <Banknote className="h-4 w-4 text-primary" />
        </div>
        <div className="flex items-center gap-2">
          {isEditing ? (
            <div className="flex items-center gap-1">
              <Input
                type="number"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                className="h-7 w-24 text-xs"
                autoFocus
              />
              <Button size="icon" variant="ghost" className="h-7 w-7" onClick={handleSave}>
                <Check className="h-3 w-3 text-green-500" />
              </Button>
              <Button size="icon" variant="ghost" className="h-7 w-7" onClick={handleCancel}>
                <X className="h-3 w-3 text-destructive" />
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <CardDescription className="text-xs font-semibold">Meta: {isPrivacyMode ? '•••••' : formatCurrency(monthlyGoal)}</CardDescription>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity" 
                onClick={(e) => {
                  e.stopPropagation();
                  setIsEditing(true);
                }}
              >
                <Pencil className="h-3 w-3" />
              </Button>
            </div>
          )}
          <Target className={cn("h-4 w-4", isGoalReached ? "text-green-500" : "text-muted-foreground")} />
        </div>
      </CardHeader>
      <CardContent 
        className={cn("pt-4 cursor-pointer", isPrivacyMode && "blur-sm select-none")}
        onClick={onValueClick}
      >
        <div className="flex flex-col gap-6">
          <div className="flex items-end justify-between">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Total Digitado no Mês</p>
              <div className="text-4xl font-bold text-primary">
                {isPrivacyMode ? '•••••' : formatCurrency(currentProduction)}
              </div>
            </div>
            <div className={cn("flex flex-col items-end gap-1 font-bold", isGoalReached ? "text-green-500" : "text-primary")}>
              <div className="flex items-center gap-1 text-lg">
                <TrendingUp className="h-5 w-5" />
                {percentage.toFixed(1)}%
              </div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-tighter">Concluído</p>
            </div>
          </div>
          
          <div className="space-y-2">
            <Progress value={percentage} className="h-3 bg-secondary" />
            <div className="flex justify-between items-center text-[11px] font-medium">
              {isGoalReached ? (
                <p className="text-green-500 animate-pulse flex items-center gap-1 font-bold">
                  🎉 META ATINGIDA! VOCÊ É INCRÍVEL!
                </p>
              ) : (
                <p className="text-muted-foreground">
                  Faltam <span className="text-foreground font-bold">{formatCurrency(monthlyGoal - currentProduction)}</span> para atingir o objetivo.
                </p>
              )}
              <p className="text-muted-foreground">
                Baseado em Valor {currentProduction > 0 ? 'Digitado' : 'Bruto'}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
