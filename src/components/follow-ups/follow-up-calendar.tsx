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
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { FollowUp } from '@/lib/types';
import { Badge } from '@/components/ui/badge';

interface FollowUpCalendarProps {
  followUps: FollowUp[];
  onSelectDate: (date: Date) => void;
}

export function FollowUpCalendar({ followUps, onSelectDate }: FollowUpCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

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

  const getFollowUpsForDay = (day: Date) => {
    return followUps.filter(f => 
        f.status === 'pending' && 
        f.deleted !== true &&
        isSameDay(parseISO(f.dueDate), day)
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between bg-card p-4 rounded-xl border border-border/50 shadow-sm">
        <div className="flex items-center gap-4">
            <div className="p-2 bg-primary/10 rounded-lg">
                <CalendarIcon className="h-5 w-5 text-primary" />
            </div>
            <div>
                <h3 className="text-lg font-bold capitalize">
                    {format(currentMonth, 'MMMM yyyy', { locale: ptBR })}
                </h3>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Visão Mensal de Retornos</p>
            </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={goToToday} className="h-8 text-xs font-bold uppercase">Hoje</Button>
          <div className="flex items-center border rounded-md">
            <Button variant="ghost" size="icon" onClick={prevMonth} className="h-8 w-8 rounded-none border-r">
                <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={nextMonth} className="h-8 w-8 rounded-none">
                <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <Card className="overflow-hidden border-border/50 shadow-md">
        <div className="grid grid-cols-7 border-b bg-muted/20">
          {daysOfWeek.map((day) => (
            <div key={day} className="py-3 text-center text-[10px] font-black uppercase tracking-widest text-muted-foreground border-r last:border-r-0">
              {day}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {calendarDays.map((day, i) => {
            const dayFollowUps = getFollowUpsForDay(day);
            const isCurrentMonth = isSameMonth(day, monthStart);
            const isTodayDay = isToday(day);

            return (
              <div
                key={day.toString()}
                onClick={() => onSelectDate(day)}
                className={cn(
                  "min-h-[100px] p-2 border-r border-b last:border-r-0 cursor-pointer transition-all hover:bg-primary/[0.02] group relative",
                  !isCurrentMonth && "bg-muted/10 opacity-40",
                  isTodayDay && "bg-primary/[0.03]"
                )}
              >
                <div className="flex justify-between items-start">
                    <span className={cn(
                        "text-xs font-bold h-6 w-6 flex items-center justify-center rounded-full transition-colors",
                        isTodayDay ? "bg-primary text-white" : "text-muted-foreground group-hover:text-primary"
                    )}>
                        {format(day, 'd')}
                    </span>
                    {dayFollowUps.length > 0 && (
                        <Badge variant="default" className="h-5 min-w-[20px] px-1.5 flex items-center justify-center text-[10px] font-black bg-primary">
                            {dayFollowUps.length}
                        </Badge>
                    )}
                </div>
                
                <div className="mt-2 space-y-1 overflow-hidden">
                    {dayFollowUps.slice(0, 2).map((f) => (
                        <div key={f.id} className="text-[9px] font-bold truncate bg-primary/5 text-primary p-1 rounded border border-primary/10 leading-none">
                            • {f.dueTime ? `${f.dueTime} - ` : ''}{f.contactName}
                        </div>
                    ))}
                    {dayFollowUps.length > 2 && (
                        <div className="text-[8px] font-black text-muted-foreground uppercase text-center pt-1">
                            + {dayFollowUps.length - 2} outros
                        </div>
                    )}
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}