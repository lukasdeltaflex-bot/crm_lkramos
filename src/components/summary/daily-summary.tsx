'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Bot, Send, BellRing, Clock, BadgePercent, X, Info, Loader2, CalendarClock, Cake, MessageSquareText, Hourglass, Coins } from 'lucide-react';
import type { Customer, Proposal, UserProfile, FollowUp } from '@/lib/types';
import { Skeleton } from '../ui/skeleton';
import { differenceInDays, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { calculateBusinessDays, getAge, cn, getWhatsAppUrl } from '@/lib/utils';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { toast } from '@/hooks/use-toast';
import { sendSummaryEmail } from '@/ai/flows/send-summary-email-flow';
import { generateBirthdayMessage } from '@/ai/flows/generate-birthday-message-flow';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection } from 'firebase/firestore';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';

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
  action,
}: {
  id: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  onDismiss: (id: string) => void;
  action?: React.ReactNode;
}) {
  return (
    <Alert className="bg-card shadow-sm border-border/50 relative hover:border-primary/30 transition-colors">
      <div className="flex items-start gap-3">
        <div className="mt-0.5">{icon}</div>
        <div className="flex-1">
          <AlertTitle className="text-sm font-bold tracking-tight">{title}</AlertTitle>
          <AlertDescription className="text-[11px] text-muted-foreground leading-snug">{description}</AlertDescription>
          {action && <div className="mt-2">{action}</div>}
        </div>
      </div>
      <button
        onClick={() => onDismiss(id)}
        className="absolute top-2 right-2 p-1 text-muted-foreground/50 hover:text-foreground rounded-md transition-colors"
        aria-label="Dispensar alerta"
      >
        <X className="h-3.5 w-3.5" />
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
  
  // AI Birthday Message State
  const [isGeneratingBday, setIsGeneratingBday] = useState(false);
  const [generatedBdayMessage, setGeneratedBdayMessage] = useState('');
  const [selectedBdayCustomer, setSelectedBdayCustomer] = useState<Customer | null>(null);
  const [isBdayModalOpen, setIsBdayModalOpen] = useState(false);

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
            customerId: c.id,
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

  const handleGenerateBdayMessage = async (customerId: string) => {
    const customer = customers.find(c => c.id === customerId);
    if (!customer) return;

    setSelectedBdayCustomer(customer);
    setIsGeneratingBday(true);
    setGeneratedBdayMessage('');
    setIsBdayModalOpen(true);

    try {
        const { message } = await generateBirthdayMessage({ customerName: customer.name });
        setGeneratedBdayMessage(message);
    } catch (error) {
        console.error("Error generating bday message:", error);
        toast({ variant: 'destructive', title: 'Erro na IA', description: 'Não foi possível gerar a mensagem agora.' });
        setIsBdayModalOpen(false);
    } finally {
        setIsGeneratingBday(false);
    }
  };

  const handleSendToWhatsApp = () => {
    if (!selectedBdayCustomer || !generatedBdayMessage) return;
    const url = getWhatsAppUrl(selectedBdayCustomer.phone);
    const encodedMsg = encodeURIComponent(generatedBdayMessage);
    window.open(`${url}&text=${encodedMsg}`, '_blank');
    setIsBdayModalOpen(false);
  };

  if (!isClient) {
    return (
        <Card className="border-border/50 shadow-lg rounded-xl overflow-hidden">
            <CardHeader className="bg-muted/10">
                <CardTitle className="flex items-center gap-2 font-bold"><Bot className="text-primary" /> Resumo Diário</CardTitle>
                <CardDescription className="text-[10px] font-bold uppercase tracking-widest opacity-60">Analisando dados...</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
                <div className="space-y-4">
                    <Skeleton className="h-20 w-full rounded-xl" />
                    <Skeleton className="h-20 w-full rounded-xl" />
                </div>
            </CardContent>
        </Card>
    );
  }
  
  return (
    <>
    <Card className="h-full flex flex-col border-border/50 shadow-lg rounded-xl overflow-hidden bg-card">
      <CardHeader className="flex flex-row items-center justify-between pb-4 bg-muted/10 border-b border-border/30">
        <div className='space-y-1'>
            <CardTitle className="text-lg font-bold flex items-center gap-2">
                <Bot className="text-primary h-5 w-5" />
                Inteligência Diária
            </CardTitle>
            <CardDescription className="text-[10px] font-bold uppercase tracking-widest opacity-60">
                Alertas estratégicos do dia
            </CardDescription>
        </div>
        <Button 
            variant="default" 
            size="sm" 
            onClick={handleSendEmail} 
            disabled={isSending}
            className="h-8 px-4 bg-primary text-primary-foreground hover:bg-primary/90 rounded-full font-bold text-[10px] uppercase tracking-wider shadow-md transition-all group"
        >
            {isSending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin mr-2" />
            ) : (
                <Send className="h-3.5 w-3.5 mr-2 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            )}
            Resumo E-mail
        </Button>
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden pt-6">
        {!hasVisibleAlerts ? (
            <div className="flex h-full flex-col items-center justify-center text-center text-muted-foreground p-8 border-2 border-dashed border-border/50 rounded-xl bg-muted/5">
                <Info className="h-10 w-10 mb-4 opacity-20" />
                <p className="font-bold text-sm text-foreground/80">Tudo em dia!</p>
                <p className="text-[11px] opacity-60 mt-1">Nenhuma pendência ou alerta estratégico para agora.</p>
            </div>
        ) : (
            <ScrollArea className="h-[400px] w-full">
                <div className="space-y-5 pr-4 pb-6">
                    {visibleManualFollowUps.length > 0 && (
                        <div className="space-y-2">
                            <h3 className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/80 flex items-center gap-2">
                                <CalendarClock className="h-3 w-3 text-primary" /> Retornos Agendados
                            </h3>
                            <div className="grid gap-2">
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
                        </div>
                    )}
                    {visibleBirthdayAlerts.length > 0 && (
                        <div className="space-y-2">
                            <h3 className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/80 flex items-center gap-2">
                                <Cake className="h-3 w-3 text-pink-500" /> Aniversariantes do Dia
                            </h3>
                            <div className="grid gap-2">
                                {visibleBirthdayAlerts.map(alert => (
                                    <SummaryAlertItem 
                                        key={alert.id}
                                        id={alert.id}
                                        icon={<Cake className="h-4 w-4 text-pink-500" />}
                                        title={alert.customerName}
                                        description={`Cliente completa ${alert.age} anos hoje! Deseje parabéns.`}
                                        onDismiss={handleDismiss}
                                        action={
                                            <Button 
                                                size="sm" 
                                                variant="outline" 
                                                className="h-7 text-[10px] font-bold border-pink-200 text-pink-600 hover:bg-pink-50"
                                                onClick={() => handleGenerateBdayMessage(alert.customerId)}
                                            >
                                                <Bot className="mr-1.5 h-3 w-3" />
                                                Gerar Mensagem WhatsApp
                                            </Button>
                                        }
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                    {visibleDebtBalanceReminders.length > 0 && (
                        <div className="space-y-2">
                            <h3 className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/80 flex items-center gap-2">
                                <Hourglass className="h-3 w-3 text-destructive" /> Alertas de Saldo Devedor
                            </h3>
                            <div className="grid gap-2">
                                {visibleDebtBalanceReminders.map(reminder => (
                                    <SummaryAlertItem 
                                        key={reminder.id}
                                        id={reminder.id}
                                        icon={<Hourglass className="h-4 w-4 text-destructive" />}
                                        title={`${reminder.customerName}`}
                                        description={`Proposta ${reminder.proposalNumber} aguardando saldo há ${reminder.daysWaiting} dias úteis. Prazo de 5 dias atingido.`}
                                        onDismiss={handleDismiss}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                    {visibleFollowUpReminders.length > 0 && (
                        <div className="space-y-2">
                            <h3 className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/80 flex items-center gap-2">
                                <Clock className="h-3 w-3 text-orange-500" /> Esteiras em Atraso
                            </h3>
                            <div className="grid gap-2">
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
                        </div>
                    )}
                    {visibleCommissionReminders.length > 0 && (
                        <div className="space-y-2">
                            <h3 className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/80 flex items-center gap-2">
                                <BadgePercent className="h-3 w-3 text-primary" /> Cobranças Pendentes
                            </h3>
                            <div className="grid gap-2">
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
                        </div>
                    )}
                    {visiblePartialCommissionReminders.length > 0 && (
                        <div className="space-y-2">
                            <h3 className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/80 flex items-center gap-2">
                                <Coins className="h-3 w-3 text-orange-500" /> Comissões Parciais
                            </h3>
                            <div className="grid gap-2">
                                {visiblePartialCommissionReminders.map(reminder => (
                                    <SummaryAlertItem 
                                        key={reminder.id}
                                        id={reminder.id}
                                        icon={<Coins className="h-4 w-4 text-orange-500" />}
                                        title={`${reminder.customerName}`}
                                        description={`Recebido R$ ${reminder.amountPaid.toFixed(2)} de R$ ${reminder.totalCommission.toFixed(2)} há ${reminder.daysSincePayment} dias. Cobrar saldo.`}
                                        onDismiss={handleDismiss}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </ScrollArea>
        )}
      </CardContent>
    </Card>

    <Dialog open={isBdayModalOpen} onOpenChange={setIsBdayModalOpen}>
        <DialogContent className="max-w-md">
            <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                    <MessageSquareText className="h-5 w-5 text-pink-500" />
                    Parabéns: {selectedBdayCustomer?.name}
                </DialogTitle>
            </DialogHeader>
            <div className="py-4">
                {isGeneratingBday ? (
                    <div className="flex flex-col items-center justify-center py-10 gap-4">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        <p className="text-sm text-muted-foreground animate-pulse">A IA está criando uma mensagem única...</p>
                    </div>
                ) : (
                    <textarea 
                        className="w-full min-h-[150px] p-4 rounded-lg border bg-muted/30 text-sm focus:ring-2 focus:ring-primary outline-none"
                        value={generatedBdayMessage}
                        onChange={(e) => setGeneratedBdayMessage(e.target.value)}
                    />
                )}
            </div>
            <DialogFooter>
                <Button variant="ghost" onClick={() => setIsBdayModalOpen(false)}>Cancelar</Button>
                <Button onClick={handleSendToWhatsApp} disabled={isGeneratingBday || !generatedBdayMessage}>
                    Enviar para WhatsApp
                </Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>
    </>
  );
}
