'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Bot, Loader2, Sparkles, Target, Settings2, Eye, EyeOff, Calendar as CalendarIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatCurrency, cn } from '@/lib/utils';
import { generateMotivationMessage } from '@/ai/flows/generate-motivation-flow';
import { useUser } from '@/firebase';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { getDay, format, isToday } from 'date-fns';

interface GamificationPanelProps {
  currentProduction: number;
  monthlyGoal: number;
  currentDailyProduction?: number;
  dailyGoal?: number;
  onGoalsChange?: (monthly: number, daily: number) => void;
  dailyHistory?: { date: Date, commission: number, contract: number }[];
}

export function GamificationPanel({ 
    currentProduction, 
    monthlyGoal, 
    currentDailyProduction = 0, 
    dailyGoal = 5000,
    onGoalsChange,
    dailyHistory
}: GamificationPanelProps) {
  const { user } = useUser();
  const [motivationMsg, setMotivationMsg] = useState('');
  const [isLoadingMsg, setIsLoadingMsg] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isPrivacyMode, setIsPrivacyMode] = useState(false);
  const [tempMonthly, setTempMonthly] = useState('');
  const [tempDaily, setTempDaily] = useState('');

  const calculateStats = (current: number, goal: number) => {
      const g = goal > 0 ? goal : 1;
      const percent = (current / g) * 100;
      const left = Math.max(0, g - current);
      let text = 'Abaixo da meta';
      let color = 'text-red-500';
      const reached = percent >= 100;
      if (reached) {
        text = 'Meta Atingida! 🏆';
        color = 'text-emerald-500';
      } else if (percent >= 80) {
        text = 'Quase lá! 🔥';
        color = 'text-orange-500';
      } else if (percent >= 50) {
        text = 'No Caminho 🚀';
        color = 'text-blue-500';
      }
      return { percent, left, text, color, reached };
  };

  const monthlyStats = calculateStats(currentProduction, monthlyGoal);
  const dailyStats = calculateStats(currentDailyProduction, dailyGoal);

  const handleGenerateMotivation = async (percent: number) => {
    setIsLoadingMsg(true);
    setMotivationMsg('');
    try {
      const res = await generateMotivationMessage({ 
        userName: user?.displayName || 'Equipe', 
        currentGoalPercent: percent 
      });
      setMotivationMsg(res.message);
    } catch (err) {
      setMotivationMsg('Desistir não é uma opção. Continue focado! O próximo contrato pode bater a sua meta.');
    } finally {
      setIsLoadingMsg(false);
    }
  };

  const handleSaveGoals = () => {
      const m = Number(tempMonthly.replace(/\D/g, '')) / 100 || monthlyGoal;
      const d = Number(tempDaily.replace(/\D/g, '')) / 100 || dailyGoal;
      onGoalsChange?.(m, d);
      setIsEditing(false);
  };

  const formatInputCurrency = (val: string) => {
      const num = Number(val.replace(/\D/g, '')) / 100;
      return num.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const openEdit = () => {
      setTempMonthly((monthlyGoal * 100).toString());
      setTempDaily((dailyGoal * 100).toString());
      setIsEditing(true);
  };

  const GoalView = ({ title, current, goal, stats }: { title: string, current: number, goal: number, stats: any }) => (
      <div className="space-y-6 flex-1 flex flex-col justify-between animate-in fade-in duration-300">
        <div className="flex justify-between items-end">
          <div>
            <p className="text-2xl font-black">{isPrivacyMode ? '•••••' : formatCurrency(current)}</p>
            <p className="text-[10px] font-bold uppercase text-muted-foreground mt-1">
              Alvo {title}: {isPrivacyMode ? '•••••' : formatCurrency(goal)}
            </p>
          </div>
          <div className="text-right">
            <p className={cn("text-[10px] font-black uppercase mb-1", stats.color)}>{stats.text}</p>
            <p className="text-3xl font-black text-primary leading-none">{stats.percent.toFixed(1)}%</p>
          </div>
        </div>

        <div className="space-y-1.5">
          <Progress 
            value={stats.percent} 
            className={cn("h-3", stats.reached && "bg-emerald-100 dark:bg-emerald-900/40 [&>div]:bg-emerald-500")} 
          />
          {!stats.reached && (
            <p className="text-[10px] font-bold text-muted-foreground text-right uppercase mt-1">
              Faltam {isPrivacyMode ? '•••••' : formatCurrency(stats.left)}
            </p>
          )}
        </div>

        <div className="pt-4 border-t border-border/50">
          {!motivationMsg && !isLoadingMsg ? (
            <Button 
                onClick={() => handleGenerateMotivation(stats.percent)} 
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
        
        {/* CALENDÁRIO DIÁRIO INTEGRADO - EXCLUSIVO DA TELA DIÁRIA */}
        {title === 'Diário' && dailyHistory && dailyHistory.length > 0 && (
           <div className="mt-4 pt-4 border-t border-border/50">
              <p className="text-[10px] font-black uppercase text-muted-foreground mb-3 text-center flex items-center justify-center gap-1.5">
                  <CalendarIcon className="h-3 w-3" /> Desempenho do Mês
              </p>
              <div className="grid grid-cols-7 gap-1">
                 {['D','S','T','Q','Q','S','S'].map((d, i) => (
                    <div key={`header-${i}`} className="text-[8px] font-black text-center text-muted-foreground/50 mb-1">{d}</div>
                 ))}
                 {Array.from({ length: getDay(dailyHistory[0].date) }).map((_, i) => (
                    <div key={`empty-${i}`} className="h-8" />
                 ))}
                 {dailyHistory.map((dayData, i) => {
                     const reached = dayData.commission >= goal; // meta do dia batida
                     const today = isToday(dayData.date);
                     const hasProd = dayData.commission > 0 || dayData.contract > 0;
                     return (
                         <div 
                             key={`day-${i}`} 
                             className={cn(
                                 "h-8 rounded-[4px] flex flex-col items-center justify-center relative group transition-colors select-none",
                                 today && "ring-2 ring-primary bg-primary/10",
                                 !today && reached ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400" : (!today && hasProd ? "bg-primary/5" : (!today && "hover:bg-muted/50 dark:hover:bg-muted/30"))
                             )}
                             title={isPrivacyMode ? 'Valores Ocultos' : `${format(dayData.date, 'dd/MM')} - Prod: ${formatCurrency(dayData.contract)} | Meta: ${formatCurrency(dayData.commission)}`}
                         >
                             <span className={cn("text-[9px] font-black z-10", reached && !today ? "text-emerald-700 dark:text-emerald-400" : (today ? "text-primary" : "text-foreground/70"))}>
                                 {format(dayData.date, 'd')}
                             </span>
                             {hasProd && !reached && (
                                 <div className="w-1 h-1 rounded-full bg-primary/40 mt-0.5" />
                             )}
                             {reached && (
                                 <Target className="absolute w-5 h-5 text-emerald-500/20 z-0" />
                             )}
                         </div>
                     );
                 })}
              </div>
           </div>
        )}
      </div>
  );

  return (
    <>
    <Card className="border-2 border-primary/10 shadow-sm relative overflow-hidden h-full flex flex-col">
      <CardHeader className="pb-0">
        <div className="flex justify-between items-center mb-4">
            <CardTitle className="text-[11px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                <Target className="h-4 w-4 text-amber-500" />
                Progresso de Meta
            </CardTitle>
            <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" onClick={() => setIsPrivacyMode(!isPrivacyMode)} className="h-6 w-6 text-muted-foreground hover:text-primary">
                    {isPrivacyMode ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                </Button>
                {onGoalsChange && (
                    <Button variant="ghost" size="icon" onClick={openEdit} className="h-6 w-6 text-muted-foreground hover:text-primary">
                        <Settings2 className="h-3.5 w-3.5" />
                    </Button>
                )}
            </div>
        </div>
      </CardHeader>
      
      <Tabs defaultValue="daily" className="flex-1 flex flex-col" onValueChange={() => setMotivationMsg('')}>
        <div className="px-6 pb-2">
            <TabsList className="grid w-full grid-cols-2 h-8">
                <TabsTrigger value="daily" className="text-[10px] font-black uppercase tracking-widest">Diária</TabsTrigger>
                <TabsTrigger value="monthly" className="text-[10px] font-black uppercase tracking-widest">Mensal</TabsTrigger>
            </TabsList>
        </div>
        
        <CardContent className="flex-1 flex flex-col pt-4">
            <TabsContent value="daily" className="mt-0 flex-1 flex flex-col">
                <GoalView title="Diário" current={currentDailyProduction} goal={dailyGoal} stats={dailyStats} />
            </TabsContent>
            <TabsContent value="monthly" className="mt-0 flex-1 flex flex-col">
                <GoalView title="Mensal" current={currentProduction} goal={monthlyGoal} stats={monthlyStats} />
            </TabsContent>
        </CardContent>
      </Tabs>
    </Card>

    <Dialog open={isEditing} onOpenChange={setIsEditing}>
        <DialogContent className="max-w-xs rounded-[2rem]">
            <DialogHeader>
                <DialogTitle className="text-sm font-black uppercase tracking-widest">Configurar Metas</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
                <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Meta Diária (R$)</label>
                    <Input 
                        value={formatInputCurrency(tempDaily)}
                        onChange={(e) => setTempDaily(handleDateMaskBypass(e))}
                        className="font-black text-primary border-2 focus-visible:ring-primary/20"
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Meta Mensal (R$)</label>
                    <Input 
                        value={formatInputCurrency(tempMonthly)}
                        onChange={(e) => setTempMonthly(handleDateMaskBypass(e))}
                        className="font-black text-primary border-2 focus-visible:ring-primary/20"
                    />
                </div>
            </div>
            <DialogFooter>
                <Button variant="ghost" className="rounded-full text-xs font-bold" onClick={() => setIsEditing(false)}>Cancelar</Button>
                <Button onClick={handleSaveGoals} className="rounded-full text-xs font-bold">Salvar Metas</Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>
    </>
  );

  function handleDateMaskBypass(e: any) {
      if (e && e.target) return e.target.value;
      return e;
  }
}
