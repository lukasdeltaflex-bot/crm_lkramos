'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Target, TrendingUp, Pencil, Check, X } from 'lucide-react';
import { formatCurrency, cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface GoalCardProps {
  currentProduction: number;
  className?: string;
}

const STORAGE_KEY_GOAL = 'lk-ramos-monthly-goal-v1';

export function GoalCard({ currentProduction, className }: GoalCardProps) {
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
    <Card className={cn('hover:border-primary/50 transition-colors h-full flex flex-col', className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="space-y-1">
          <CardTitle className="text-sm font-medium">Meta de Produção Mensal</CardTitle>
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
              <CardDescription className="text-xs">Meta: {formatCurrency(monthlyGoal)}</CardDescription>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" 
                onClick={() => setIsEditing(true)}
              >
                <Pencil className="h-2 w-2" />
              </Button>
            </div>
          )}
        </div>
        <Target className={cn("h-4 w-4", isGoalReached ? "text-green-500" : "text-muted-foreground")} />
      </CardHeader>
      <CardContent className="flex-1 flex flex-col justify-center">
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
