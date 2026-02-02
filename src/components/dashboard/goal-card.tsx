'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, Pencil, Check, X, Trophy } from 'lucide-react';
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
  const [monthlyGoal, setMonthlyGoal] = useState(150000);
  const [editValue, setEditValue] = useState('150000');
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

  if (!isClient) return <Card className="h-48 animate-pulse bg-muted rounded-xl w-full" />;

  return (
    <Card className={cn(
        'relative overflow-hidden bg-blue-50/40 dark:bg-blue-900/10 border-2 border-blue-200/60 dark:border-blue-800/60 shadow-sm rounded-2xl w-full', 
        className
    )}>
      <CardContent className="p-8">
        {/* Header Row */}
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-full bg-white dark:bg-blue-950 shadow-sm border border-blue-100 dark:border-blue-900">
              <Trophy className="h-5 w-5 text-blue-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-blue-600 dark:text-blue-400 leading-tight">Performance do Mês</h3>
              <p className="text-[10px] font-bold text-muted-foreground/60 dark:text-muted-foreground/80 uppercase tracking-widest">Meta de Contratos Pagos</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {isEditing ? (
              <div className="flex items-center gap-1 bg-white dark:bg-background p-1 rounded-lg border shadow-sm">
                <Input
                  type="number"
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  className="h-7 w-24 text-xs border-none focus-visible:ring-0"
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
                <div className="px-4 py-1.5 bg-white dark:bg-blue-950 rounded-full border border-blue-100 dark:border-blue-900 text-[11px] font-bold text-blue-600 dark:text-blue-400 shadow-sm">
                  Objetivo: {isPrivacyMode ? '•••••' : formatCurrency(monthlyGoal)}
                </div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 rounded-full opacity-40 hover:opacity-100 transition-opacity bg-white/50 dark:bg-black/20" 
                  onClick={() => setIsEditing(true)}
                >
                  <Pencil className="h-3 w-3 text-muted-foreground" />
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Main Content Row */}
        <div className="flex items-end justify-between mb-8" onClick={onValueClick}>
          <div className="space-y-2 cursor-pointer">
            <div className={cn("text-6xl font-normal tracking-tighter text-blue-500 dark:text-blue-400 leading-none")}>
              {isPrivacyMode ? '•••••' : formatCurrency(currentProduction)}
            </div>
            <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground/80 dark:text-muted-foreground uppercase tracking-wider">
              <TrendingUp className="h-3.5 w-3.5 text-green-500" />
              Conversão de <span className="text-foreground dark:text-blue-200">{conversionRate.toFixed(1)}%</span> sobre a digitação total.
            </div>
          </div>

          <div className="text-right space-y-1">
            <div className="text-5xl font-normal text-blue-500 dark:text-blue-400 tracking-tighter tabular-nums">
              {percentageOfGoal.toFixed(1)}%
            </div>
            <p className="text-[10px] font-bold text-muted-foreground/60 dark:text-muted-foreground/80 uppercase tracking-[0.2em]">Concluído</p>
          </div>
        </div>

        {/* Progress Section */}
        <div className="space-y-4">
          <Progress value={percentageOfGoal} className="h-2.5 bg-blue-100/50 dark:bg-blue-900/30" />
          
          <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 dark:text-muted-foreground/80">
            <p>
              Faltam <span className={cn("text-blue-500 dark:text-blue-400")}>
                {isPrivacyMode ? '•••••' : formatCurrency(Math.max(0, monthlyGoal - currentProduction))}
              </span> para o objetivo.
            </p>
            <p>Status: Pago + Saldo Pago</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
