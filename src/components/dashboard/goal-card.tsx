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

  const percentageOfGoal = Math.min((currentProduction / monthlyGoal) * 100, 100);
  const conversionRate = totalDigitized > 0 ? (currentProduction / totalDigitized) * 100 : 0;

  if (!isClient) return <Card className="h-32 animate-pulse bg-muted rounded-xl w-full" />;

  return (
    <Card className={cn(
        'relative overflow-hidden bg-green-50/50 dark:bg-green-900/10 border-2 border-green-200 dark:border-green-800 shadow-md rounded-2xl w-full', 
        className
    )}>
      <CardContent className="p-4 sm:p-6">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <Trophy className="h-4 w-4 text-green-500" />
            <div>
              <h3 className="text-xs sm:text-sm font-bold text-green-700 dark:text-green-400 uppercase tracking-tight">Performance do Mês</h3>
              <p className="text-[8px] font-black text-muted-foreground/60 uppercase tracking-widest">Contratos Pagos vs Meta</p>
            </div>
          </div>

          {isEditing ? (
            <div className="flex items-center gap-1 bg-white p-1 rounded-lg border shadow-sm scale-90 origin-right">
              <Input
                type="number"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                className="h-7 w-20 text-xs border-none"
                autoFocus
              />
              <Button size="icon" variant="ghost" className="h-6 w-6" onClick={handleSave}><Check className="h-3 w-3 text-green-500" /></Button>
              <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => setIsEditing(false)}><X className="h-3 w-3 text-destructive" /></Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <div className="text-[9px] font-bold text-green-700 bg-white/80 px-2 py-0.5 rounded border border-green-100 shadow-sm">
                Meta: {isPrivacyMode ? '•••••' : formatCurrency(monthlyGoal)}
              </div>
              <Button variant="ghost" size="icon" className="h-6 w-6 opacity-40 hover:opacity-100" onClick={() => setIsEditing(true)}>
                <Pencil className="h-3 w-3" />
              </Button>
            </div>
          )}
        </div>

        <div className="flex items-end justify-between mb-3" onClick={onValueClick}>
          <div className="space-y-0 cursor-pointer">
            <div className="text-3xl sm:text-4xl font-light tracking-tighter text-green-600 dark:text-green-400">
              {isPrivacyMode ? '•••••' : formatCurrency(currentProduction)}
            </div>
            <div className="flex items-center gap-1.5 text-[9px] font-bold text-muted-foreground uppercase">
              <TrendingUp className="h-3 w-3 text-green-500" />
              Conversão: <span className="text-foreground">{conversionRate.toFixed(1)}%</span>
            </div>
          </div>

          <div className="text-right">
            <div className="text-2xl sm:text-3xl font-light text-green-600 dark:text-green-400 tracking-tighter">
              {percentageOfGoal.toFixed(1)}%
            </div>
            <p className="text-[8px] font-black text-muted-foreground/60 uppercase tracking-widest">Objetivo</p>
          </div>
        </div>

        <Progress value={percentageOfGoal} className="h-1.5 bg-green-100 dark:bg-green-900/30" />
      </CardContent>
    </Card>
  );
}
