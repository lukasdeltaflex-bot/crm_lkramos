'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Bot, Send, BellRing, Clock, BadgePercent, X, Info, Loader2, CalendarClock } from 'lucide-react';
import type { Customer, Proposal, UserProfile, FollowUp } from '@/lib/types';
import { Skeleton } from '../ui/skeleton';
import { differenceInDays, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { calculateBusinessDays, getAge, cn } from '@/lib/utils';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { toast } from '@/hooks/use-toast';
import { sendSummaryEmail } from '@/ai/flows/send-summary-email-flow';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection } from 'firebase/firestore';

interface DailySummaryProps {
  proposals: Proposal[];
  customers: Customer[];
  userProfile: UserProfile | null;
}

const DISMISS_STORAGE_KEY = 'dismissed_daily_summary_items_v1';

function SummaryAlertItem({
  id,
  icon,
  title,
  description,
  onDismiss,
}: {
  id: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  onDismiss: (id: string) => void;
}) {
  return (
    <Alert className="bg-card shadow-sm border-border/50 relative">
      <div className="flex items-start gap-3">
        <div className="mt-0.5">{icon}</div>
        <div className="flex-1">
          <AlertTitle className="text-sm font-semibold">{title}</AlertTitle>
          <AlertDescription className="text-xs text-muted-foreground">{description}</AlertDescription>
        </div>
      </div>
      <button
        onClick={() => onDismiss(id)}
        className="absolute top-2 right-2 p-1 text-muted-foreground/80 hover:text-foreground rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        aria-label="Dispensar alerta"
      >
        <X className="h-4 w-4" />
      </button>
    </Alert>
  );
}

export function DailySummary({ proposals, customers, userProfile }: DailySummaryProps) {
  const { user } = useUser();
  const firestore = useFirestore();
  const [dismissedItems, setDismissedItems] = useState<string[]>([]);
  const [isClient, setIsClient] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const followUpsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return collection(firestore, 'users', user.uid, 'followUps');
  }, [firestore, user]);
  const { data: followUps } = useCollection<FollowUp>(followUpsQuery);

  useEffect(() => {
    setIsClient(true);
    try {
      const storedDismissed = localStorage.getItem(DISMISS_STORAGE_KEY);
      if (storedDismissed) {
        setDismissedItems(JSON.parse(storedDismissed));
      }
    } catch (error) {
      console.error("Failed to parse dismissed items from localStorage", error);
      localStorage.removeItem(DISMISS_STORAGE_KEY);
    }
  }, []);

  const handleDismiss = (itemId: string) => {
    const newDismissed = [...dismissedItems, itemId];
    setDismissedItems(newDismissed);
    try {
        localStorage.setItem(DISMISS_STORAGE_KEY, JSON.stringify(newDismissed));
    } catch (error) {
        console.error("Failed to save dismissed items to localStorage", error);
    }
  };

  const alertData = useMemo(() => {
    if (!isClient || !proposals || !customers) return { birthdayAlerts: [], followUpReminders: [], commissionReminders: [], debtBalanceReminders: [], partialCommissionReminders: [], manualFollowUps: [] };

    const now = new Date();
    const todayIso = format(now, 'yyyy-MM-dd');
    const customerMap = new Map(customers.map(c => [c.id, c]));

    const birthdayAlerts = customers
        .filter(c => getAge(c.birthDate) >= 74)
        .map(c => ({ 
            id: `birthday-${c.id}`,
            customerName: c.name, 
            age: getAge(c.birthDate) >= 75 ? getAge(c.birthDate) : 75
        }));

    const followUpReminders = proposals
      .filter(p => p.status === 'Em Andamento' && p.dateDigitized && differenceInDays(now, new Date(p.dateDigitized)) > 20)
      .map(p => ({
        id: `proposal-fup-${p.id}`,
        customerName: customerMap.get(p.customerId)?.name || 'Cliente Desconhecido',
        proposalNumber: p.proposalNumber,
        daysOpen: differenceInDays(now, new Date(p.dateDigitized)),
      }));

    const commissionReminders = proposals
      .filter(p => 
        (p.status === 'Pago' || p.status === 'Saldo Pago') && 
        p.commissionStatus === 'Pendente' &&
        p.datePaidToClient && 
        differenceInDays(now, new Date(p.datePaidToClient)) > 7
      )
      .map(p => ({
        id: `commission-${p.id}`,
        customerName: customerMap.get(p.customerId)?.name || 'Cliente Desconhecido',
        proposalNumber: p.proposalNumber,
        daysPending: differenceInDays(now, new Date(p.datePaidToClient!)),
      }));

    const debtBalanceReminders = proposals
        .filter(p => 
            p.product === 'Portabilidade' &&
            p.status === 'Aguardando Saldo' &&
            p.dateDigitized &&
            calculateBusinessDays(new Date(p.dateDigitized)) >= 5
        )
        .map(p => ({
            id: `debt-${p.id}`,
            customerName: customerMap.get(p.customerId)?.name || 'Cliente Desconhecido',
            proposalNumber: p.proposalNumber,
            daysWaiting: calculateBusinessDays(new Date(p.dateDigitized)),
        }));
    
    const partialCommissionReminders = proposals
        .filter(p => 
            p.commissionStatus === 'Parcial' &&
            p.commissionPaymentDate && 
            differenceInDays(now, new Date(p.commissionPaymentDate)) > 15
        )
        .map(p => ({
            id: `partial-${p.id}`,
            customerName: customerMap.get(p.customerId)?.name || 'Cliente Desconhecido',
            proposalNumber: p.proposalNumber,
            amountPaid: p.amountPaid,
            totalCommission: p.commissionValue,
            daysSincePayment: differenceInDays(now, new Date(p.commissionPaymentDate!)),
        }));

    const manualFollowUps = (followUps || [])
        .filter(f => f.status === 'pending' && f.dueDate <= todayIso)
        .map(f => ({
            id: `manual-fup-${f.id}`,
            contactName: f.contactName,
            description: f.description,
            isToday: f.dueDate === todayIso
        }));

    return { birthdayAlerts, followUpReminders, commissionReminders, debtBalanceReminders, partialCommissionReminders, manualFollowUps };
  }, [proposals, customers, followUps, isClient]);
  
  const visibleBirthdayAlerts = alertData.birthdayAlerts.filter(a => !dismissedItems.includes(a.id));
  const visibleFollowUpReminders = alertData.followUpReminders.filter(r => !dismissedItems.includes(r.id));
  const visibleCommissionReminders = alertData.commissionReminders.filter(r => !dismissedItems.includes(r.id));
  const visibleDebtBalanceReminders = alertData.debtBalanceReminders.filter(r => !dismissedItems.includes(r.id));
  const visiblePartialCommissionReminders = alertData.partialCommissionReminders.filter(r => !dismissedItems.includes(r.id));
  const visibleManualFollowUps = alertData.manualFollowUps.filter(f => !dismissedItems.includes(f.id));

  const hasVisibleAlerts = 
    visibleBirthdayAlerts.length > 0 ||
    visibleFollowUpReminders.length > 0 ||
    visibleCommissionReminders.length > 0 ||
    visibleDebtBalanceReminders.length > 0 ||
    visiblePartialCommissionReminders.length > 0 ||
    visibleManualFollowUps.length > 0;

  const handleSendEmail = async () => {
    if (!userProfile || !userProfile.email) {
      toast({
        variant: 'destructive',
        title: 'E-mail não encontrado',
        description: 'Não foi possível encontrar o e-mail do seu perfil para enviar o resumo.',
      });
      return;
    }

    setIsSending(true);
    try {
      const summaryDataForFlow = {
        userName: userProfile.displayName || userProfile.fullName || 'Usuário',
        birthdayAlerts: visibleBirthdayAlerts.map(a => ({ customerName: a.customerName, age: a.age })),
        followUpReminders: visibleFollowUpReminders.map(r => ({ customerName: r.customerName, proposalNumber: r.proposalNumber, daysOpen: r.daysOpen })),
        commissionReminders: visibleCommissionReminders.map(r => ({ customerName: r.customerName, proposalNumber: r.proposalNumber, daysPending: r.daysPending })),
        debtBalanceReminders: visibleDebtBalanceReminders.map(r => ({ customerName: r.customerName, proposalNumber: r.proposalNumber, daysWaiting: r.daysWaiting })),
        partialCommissionReminders: visiblePartialCommissionReminders.map(r => ({ customerName: r.customerName, proposalNumber: r.proposalNumber, amountPaid: r.amountPaid, totalCommission: r.totalCommission, daysSincePayment: r.daysSincePayment })),
      };

      const result = await sendSummaryEmail({
        recipientName: userProfile.displayName || userProfile.fullName || 'Usuário',
        recipientEmail: userProfile.email,
        summaryData: summaryDataForFlow,
      });

      if (result.success) {
        toast({
          title: 'E-mail Enviado!',
          description: `Um resumo das suas pendências foi enviado para ${userProfile.email}.`,
        });
      } else {
        toast({
            variant: 'destructive',
            title: 'Falha ao Enviar',
            description: result.message,
        });
      }
    } catch (error) {
      console.error('Error sending summary email:', error);
      toast({
        variant: 'destructive',
        title: 'Falha no Envio',
        description: 'Não foi possível enviar o e-mail de resumo. Tente novamente mais tarde.',
      });
    } finally {
      setIsSending(false);
    }
  };

  if (!isClient) {
    return (
        <Card className="border-border/50 shadow-sm">
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><Bot /> Resumo Diário</CardTitle>
                <CardDescription>Carregando alertas por IA...</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    <Skeleton className="h-20 w-full" />
                    <Skeleton className="h-20 w-full" />
                </div>
            </CardContent>
        </Card>
    );
  }
  
  return (
    <Card className="h-full flex flex-col border-border/50 shadow-sm">
      <CardHeader className="flex flex-row items-start justify-between pb-2">
        <div className='space-y-1'>
            <CardTitle className="text-lg font-headline flex items-center gap-2">
                <Bot className="text-primary h-5 w-5" />
                Resumo de Pendências
            </CardTitle>
            <CardDescription className="text-xs">
                Alertas estratégicos para o seu dia.
            </CardDescription>
        </div>
        <button onClick={handleSendEmail} disabled={isSending} className="h-8 px-3 rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground flex items-center gap-2 text-xs transition-colors">
            {isSending ? (
                <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
                <><Send className="h-3 w-3" /> Email</>
            )}
        </button>
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden pt-2">
        {!hasVisibleAlerts ? (
            <div className="flex h-full flex-col items-center justify-center text-center text-muted-foreground p-8 border-2 border-dashed border-border/50 rounded-lg bg-muted/5">
                <Info className="h-10 w-10 mb-4 opacity-20" />
                <p className="font-semibold text-sm">Nenhuma pendência para hoje.</p>
                <p className="text-xs">Tenha um dia produtivo!</p>
            </div>
        ) : (
            <ScrollArea className="h-full w-full">
                <div className="space-y-4 pr-4 pb-4">
                    {visibleManualFollowUps.length > 0 && (
                        <div className="space-y-2">
                            <h3 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                                <CalendarClock className="h-3 w-3" /> Retornos Agendados
                            </h3>
                            {visibleManualFollowUps.map(f => (
                                <SummaryAlertItem 
                                    key={f.id}
                                    id={f.id}
                                    icon={<CalendarClock className={cn("h-4 w-4", f.isToday ? "text-yellow-500" : "text-destructive")} />}
                                    title={f.contactName}
                                    description={f.description}
                                    onDismiss={handleDismiss}
                                />
                            ))}
                        </div>
                    )}
                    {visibleBirthdayAlerts.length > 0 && (
                        <div className="space-y-2">
                            <h3 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                                <BellRing className="h-3 w-3" /> Alertas de Idade (75+)
                            </h3>
                            {visibleBirthdayAlerts.map(alert => (
                                <SummaryAlertItem 
                                    key={alert.id}
                                    id={alert.id}
                                    icon={<BellRing className="h-4 w-4 text-pink-500" />}
                                    title={alert.customerName}
                                    description={`Cliente completará ${alert.age} anos. Verifique as políticas bancárias.`}
                                    onDismiss={handleDismiss}
                                />
                            ))}
                        </div>
                    )}
                    {visibleFollowUpReminders.length > 0 && (
                        <div className="space-y-2">
                            <h3 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                                <Clock className="h-3 w-3" /> Esteiras em Atraso
                            </h3>
                            {visibleFollowUpReminders.map(reminder => (
                                <SummaryAlertItem 
                                    key={reminder.id}
                                    id={reminder.id}
                                    icon={<Clock className="h-4 w-4 text-orange-500" />}
                                    title={`${reminder.customerName}`}
                                    description={`Proposta ${reminder.proposalNumber} sem movimentação há ${reminder.daysOpen} dias.`}
                                    onDismiss={handleDismiss}
                                />
                            ))}
                        </div>
                    )}
                    {visibleCommissionReminders.length > 0 && (
                        <div className="space-y-2">
                            <h3 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                                <BadgePercent className="h-3 w-3" /> Cobranças Pendentes
                            </h3>
                            {visibleCommissionReminders.map(reminder => (
                                <SummaryAlertItem 
                                    key={reminder.id}
                                    id={reminder.id}
                                    icon={<BadgePercent className="h-4 w-4 text-primary" />}
                                    title={`${reminder.customerName}`}
                                    description={`Comissão da Prop. ${reminder.proposalNumber} não identificada há ${reminder.daysPending} dias.`}
                                    onDismiss={handleDismiss}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
