'use client';

import React, { useState } from 'react';
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  isSameMonth, 
  isSameDay, 
  addMonths, 
  subMonths,
  isToday,
  parseISO
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Cake, MessageSquareText, Bot, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn, getWhatsAppUrl } from '@/lib/utils';
import type { Customer } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { generateBirthdayMessage } from '@/ai/flows/generate-birthday-message-flow';
import { toast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';

interface BirthdayCalendarProps {
  customers: Customer[];
}

export function BirthdayCalendar({ customers }: BirthdayCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  
  // AI Message State
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedMessage, setGeneratedMessage] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isModalOpen, setIsBdayModalOpen] = useState(false);

  const daysOfWeek = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);

  const calendarDays = eachDayOfInterval({
    start: startDate,
    end: endDate,
  });

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const goToToday = () => setCurrentMonth(new Date());

  const getBirthdaysForDay = (day: Date) => {
    const dayStr = format(day, 'MM-dd');
    return customers.filter(c => 
        c.status !== 'inactive' && 
        c.birthDate && 
        c.birthDate.substring(5) === dayStr
    );
  };

  const handleGenerateMessage = async (customer: Customer) => {
    setSelectedCustomer(customer);
    setIsGenerating(true);
    setGeneratedMessage('');
    setIsBdayModalOpen(true);

    try {
        const { message } = await generateBirthdayMessage({ customerName: customer.name });
        setGeneratedMessage(message);
    } catch (error) {
        toast({ variant: 'destructive', title: 'Erro na IA' });
        setIsBdayModalOpen(false);
    } finally {
        setIsGenerating(false);
    }
  };

  const handleSendToWhatsApp = () => {
    if (!selectedCustomer || !generatedMessage) return;
    const url = getWhatsAppUrl(selectedCustomer.phone);
    const encodedMsg = encodeURIComponent(generatedMessage);
    window.open(`${url}&text=${encodedMsg}`, '_blank');
    setIsBdayModalOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between bg-card p-6 rounded-2xl border-2 border-primary/10 shadow-sm">
        <div className="flex items-center gap-4">
            <div className="p-3 bg-pink-100 rounded-2xl text-pink-600">
                <Cake className="h-6 w-6" />
            </div>
            <div>
                <h3 className="text-xl font-black capitalize tracking-tight">
                    {format(currentMonth, 'MMMM yyyy', { locale: ptBR })}
                </h3>
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Agenda de Relacionamento</p>
            </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={goToToday} className="h-9 px-6 rounded-full font-black uppercase text-[10px] tracking-widest border-2">Hoje</Button>
          <div className="flex items-center border-2 rounded-full overflow-hidden bg-background">
            <Button variant="ghost" size="icon" onClick={prevMonth} className="h-9 w-10 rounded-none border-r-2">
                <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={nextMonth} className="h-9 w-10 rounded-none">
                <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <Card className="overflow-hidden border-2 border-primary/10 shadow-xl rounded-[2rem]">
        <div className="grid grid-cols-7 border-b-2 bg-muted/30">
          {daysOfWeek.map((day) => (
            <div key={day} className="py-4 text-center text-[10px] font-black uppercase tracking-widest text-muted-foreground border-r-2 last:border-r-0 border-primary/5">
              {day}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {calendarDays.map((day, i) => {
            const dayBirthdays = getBirthdaysForDay(day);
            const isCurrentMonth = isSameMonth(day, monthStart);
            const isTodayDay = isToday(day);

            return (
              <div
                key={day.toString()}
                className={cn(
                  "min-h-[140px] p-3 border-r-2 border-b-2 last:border-r-0 border-primary/5 transition-all group relative",
                  !isCurrentMonth && "bg-muted/10 opacity-30 pointer-events-none",
                  isTodayDay && "bg-primary/[0.03]"
                )}
              >
                <div className="flex justify-between items-start mb-2">
                    <span className={cn(
                        "text-sm font-black h-7 w-7 flex items-center justify-center rounded-full transition-all",
                        isTodayDay ? "bg-primary text-white shadow-lg shadow-primary/20 scale-110" : "text-muted-foreground group-hover:text-primary"
                    )}>
                        {format(day, 'd')}
                    </span>
                    {dayBirthdays.length > 0 && (
                        <Badge className="bg-pink-500 text-white font-black text-[9px] rounded-full h-5 min-w-[20px] px-1.5 flex items-center justify-center shadow-sm">
                            {dayBirthdays.length}
                        </Badge>
                    )}
                </div>
                
                <div className="space-y-1.5">
                    {dayBirthdays.map((c) => (
                        <button
                            key={c.id}
                            onClick={() => handleGenerateMessage(c)}
                            className="w-full text-left p-1.5 rounded-lg bg-pink-500/5 hover:bg-pink-500/10 border border-pink-500/10 transition-all group/btn"
                        >
                            <div className="flex items-center justify-between gap-1">
                                <span className="text-[10px] font-bold text-pink-700 truncate">{c.name.split(' ')[0]}</span>
                                <Bot className="h-2.5 w-2.5 text-pink-400 opacity-0 group-hover/btn:opacity-100 transition-opacity" />
                            </div>
                        </button>
                    ))}
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      <div className="flex items-center gap-2 justify-center py-4">
          <div className="h-2 w-2 rounded-full bg-pink-500" />
          <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Clique no nome para gerar os parabéns com IA</p>
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsBdayModalOpen}>
        <DialogContent className="max-w-md rounded-[2rem]">
            <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-xl font-black uppercase">
                    <MessageSquareText className="h-5 w-5 text-pink-500" />
                    Parabéns: {selectedCustomer?.name}
                </DialogTitle>
            </DialogHeader>
            <div className="py-4">
                {isGenerating ? (
                    <div className="flex flex-col items-center justify-center py-10 gap-4">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        <p className="text-sm text-muted-foreground animate-pulse font-bold uppercase">A IA está criando uma mensagem única...</p>
                    </div>
                ) : (
                    <textarea 
                        className="w-full min-h-[180px] p-5 rounded-3xl border-2 bg-muted/30 text-sm focus:ring-2 focus:ring-primary outline-none font-medium leading-relaxed"
                        value={generatedMessage}
                        onChange={(e) => setGeneratedMessage(e.target.value)}
                    />
                )}
            </div>
            <DialogFooter className="flex gap-2">
                <Button variant="ghost" className="rounded-full font-bold" onClick={() => setIsBdayModalOpen(false)}>Cancelar</Button>
                <Button 
                    onClick={handleSendToWhatsApp} 
                    disabled={isGenerating || !generatedMessage}
                    className="flex-1 rounded-full font-bold bg-[#25D366] hover:bg-[#1eb954] text-white shadow-lg shadow-green-500/20 gap-2"
                >
                    Enviar para WhatsApp
                </Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
