'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Trophy, Bot, Loader2, Sparkles, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatCurrency, cn } from '@/lib/utils';
import { generateMotivationMessage } from '@/ai/flows/generate-motivation-flow';
import { useUser } from '@/firebase';

interface GamificationPanelProps {
  currentProduction: number;
  monthlyGoal: number;
}

export function GamificationPanel({ currentProduction, monthlyGoal }: GamificationPanelProps) {
  const { user } = useUser();
  const [motivationMsg, setMotivationMsg] = useState('');
  const [isLoadingMsg, setIsLoadingMsg] = useState(false);

  const goalPercent = monthlyGoal > 0 ? (currentProduction / monthlyGoal) * 100 : 0;
  const isGoalReached = goalPercent >= 100;
  const amountLeft = Math.max(0, monthlyGoal - currentProduction);

  let statusText = 'Abaixo da meta';
  let statusColor = 'text-red-500';
  if (goalPercent >= 100) {
    statusText = 'Meta Atingida! 🏆';
    statusColor = 'text-emerald-500';
  } else if (goalPercent >= 80) {
    statusText = 'Quase lá! 🔥';
    statusColor = 'text-orange-500';
  } else if (goalPercent >= 50) {
    statusText = 'No Caminho 🚀';
    statusColor = 'text-blue-500';
  }

  const handleGenerateMotivation = async () => {
    setIsLoadingMsg(true);
    setMotivationMsg('');
    try {
      const res = await generateMotivationMessage({ 
        userName: user?.displayName || 'Equipe', 
        currentGoalPercent: goalPercent 
      });
      setMotivationMsg(res.message);
    } catch (err) {
      setMotivationMsg('Desistir não é uma opção. Continue focado! O próximo contrato pode bater a sua meta.');
    } finally {
      setIsLoadingMsg(false);
    }
  };

  return (
    <Card className="border-2 border-primary/10 shadow-sm relative overflow-hidden h-full flex flex-col">
      <CardHeader className="pb-2">
        <CardTitle className="text-[11px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
          <Target className="h-4 w-4 text-amber-500" />
          Progresso de Meta (Gamificação)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6 flex-1 flex flex-col justify-between">
        
        <div className="flex justify-between items-end">
          <div>
            <p className="text-2xl font-black">{formatCurrency(currentProduction)}</p>
            <p className="text-[10px] font-bold uppercase text-muted-foreground mt-1">
              Alvo: {formatCurrency(monthlyGoal)}
            </p>
          </div>
          <div className="text-right">
            <p className={cn("text-[10px] font-black uppercase mb-1", statusColor)}>{statusText}</p>
            <p className="text-3xl font-black text-primary leading-none">{goalPercent.toFixed(1)}%</p>
          </div>
        </div>

        <div className="space-y-1.5">
          <Progress 
            value={goalPercent} 
            className={cn("h-3", isGoalReached && "bg-emerald-100 dark:bg-emerald-900/40 [&>div]:bg-emerald-500")} 
          />
          {!isGoalReached && (
            <p className="text-[10px] font-bold text-muted-foreground text-right uppercase mt-1">
              Faltam {formatCurrency(amountLeft)}
            </p>
          )}
        </div>

        <div className="pt-4 border-t border-border/50">
          {!motivationMsg && !isLoadingMsg ? (
            <Button 
                onClick={handleGenerateMotivation} 
                variant="outline" 
                className="w-full text-[10px] font-black uppercase tracking-widest rounded-xl border-dashed border-2 h-10 gap-2 hover:bg-purple-50 hover:text-purple-600 hover:border-purple-300 transition-colors"
            >
              <Bot className="h-4 w-4 text-purple-500" /> IA Motivacional
            </Button>
          ) : isLoadingMsg ? (
            <div className="flex items-center justify-center p-3 text-muted-foreground text-[10px] tracking-widest font-black uppercase gap-2 animate-pulse">
              <Loader2 className="h-4 w-4 animate-spin text-purple-500" /> Coach IA Pensando...
            </div>
          ) : (
            <div className="bg-purple-500/10 border border-purple-500/20 p-3 rounded-xl relative group animate-in fade-in zoom-in slide-in-from-bottom-2">
              <Sparkles className="absolute top-2 right-2 h-3 w-3 text-purple-500 opacity-50" />
              <p className="text-[11px] font-bold italic text-purple-900 dark:text-purple-100 tracking-wide leading-relaxed pr-4">
                "{motivationMsg}"
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
