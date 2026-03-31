'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Bot, Send, X, Loader2, CalendarClock, Cake, Hourglass, BadgePercent, Zap, Info, ChevronRight, MessageSquareText, Wallet, Receipt, RotateCcw } from 'lucide-react';
import type { Customer, Proposal, UserProfile, FollowUp, UserSettings, Expense, Lead } from '@/lib/types';
import { differenceInDays, format, differenceInMonths, startOfDay, isBefore, parseISO, isValid } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { calculateBusinessDays, getAge, cn, getWhatsAppUrl, formatCurrency, parseDateSafe } from '@/lib/utils';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { toast } from '@/hooks/use-toast';
import { sendSummaryEmail } from '@/ai/flows/send-summary-email-flow';
import { generateBirthdayMessage } from '@/ai/flows/generate-birthday-message-flow';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useUser, useFirestore, useCollection, useMemoFirebase, useDoc } from '@/firebase';
import { collection, doc, setDoc } from 'firebase/firestore';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import Link from 'next/link';

interface DailySummaryProps {
  proposals: Proposal[];
  customers: Customer[];
  userProfile: UserProfile | null;
  expenses?: Expense[];
}

function SummaryAlertItem({
  id,
  icon,
  title,
  description,
  link,
  onDismiss,
  action,
}: {
  id: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  link: string;
  onDismiss: (id: string) => void;
  action?: React.ReactNode;
}) {
  return (
    <div className="relative group">
        <Link href={link} className="block">
            <Alert className="bg-card shadow-sm border-border/50 py-4 cursor-pointer hover:border-primary/40 hover:bg-muted/5 transition-all group-hover:shadow-md">
                <div className="flex items-start gap-4">
                    <div className="mt-1 shrink-0">{icon}</div>
                    <div className="flex-1 overflow-hidden">
                        <AlertTitle className="text-sm font-black uppercase tracking-tight text-foreground group-hover:text-primary transition-colors truncate">
                            {title}
                        </AlertTitle>
                        <AlertDescription className="text-[11px] font-medium text-muted-foreground leading-snug mt-1">
                            {description}
                        </AlertDescription>
                        {action && <div className="mt-3" onClick={(e) => e.stopPropagation()}>{action}</div>}
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground/30 mt-1 opacity-0 group-hover:opacity-100 transition-all" />
                </div>
            </Alert>
        </Link>
        <button
            onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onDismiss(id);
            }}
            className="absolute top-2 right-2 p-1.5 text-muted-foreground/40 hover:text-destructive hover:bg-destructive/10 rounded-md transition-all z-10"
            title="Dispensar alerta"
        >
            <X className="h-3.5 w-3.5" />
        </button>
    </div>
  );
}

export function DailySummary({ proposals, customers, userProfile, expenses = [] }: DailySummaryProps) {
  const { user } = useUser();
  const firestore = useFirestore();
  const [isClient, setIsClient] = useState(false);
  const [isSending, setIsSending] = useState(false);
  
  const [isGeneratingBday, setIsGeneratingBday] = useState(false);
  const [generatedBdayMessage, setGeneratedBdayMessage] = useState('');
  const [selectedBdayCustomer, setSelectedBdayCustomer] = useState<Customer | null>(null);
  const [isBdayModalOpen, setIsBdayModalOpen] = useState(false);

  const followUpsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return collection(firestore, 'users', user.uid, 'followUps');
  }, [firestore, user]);

  const leadsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return collection(firestore, 'leads');
  }, [firestore, user]);

  const settingsDocRef = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return doc(firestore, 'userSettings', user.uid);
  }, [firestore, user]);

  const { data: followUps } = useCollection<FollowUp>(followUpsQuery);
  const { data: leadsData } = useCollection<Lead>(leadsQuery);
  const { data: userSettings } = useDoc<UserSettings>(settingsDocRef);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const dismissedItems = useMemo(() => userSettings?.dismissedAlerts || [], [userSettings]);

  const handleDismiss = async (itemId: string) => {
    if (!user || !firestore) return;
    try {
        const currentDismissed = [...dismissedItems];
        if (!currentDismissed.includes(itemId)) {
            await setDoc(doc(firestore, 'userSettings', user.uid), {
                dismissedAlerts: [...currentDismissed, itemId]
            }, { merge: true });
            toast({ title: "Alerta removido" });
        }
    } catch (e) {
        console.error("Failed to sync dismiss state:", e);
    }
  };

  const handleRestoreAlerts = async () => {
    if (!user || !firestore) return;
    try {
        await setDoc(doc(firestore, 'userSettings', user.uid), {
            dismissedAlerts: []
        }, { merge: true });
        toast({ title: "Alertas Restaurados!" });
    } catch (e) {
        toast({ variant: "destructive", title: "Erro ao restaurar" });
    }
  }

  const alertData = useMemo(() => {
    if (!isClient || !proposals || !customers) return { birthdayAlerts: [], birthdayTodayAlerts: [], followUpReminders: [], commissionReminders: [], debtBalanceReminders: [], partialCommissionReminders: [], manualFollowUps: [], radarAlerts: [], expenseAlerts: [], leadAlerts: [] };

    const now = new Date();
    const todayStr = format(now, 'MM-dd');
    const todayIso = format(now, 'yyyy-MM-dd');
    const customerMap = new Map(customers.map(c => [c.id, c]));

    const birthdayAlerts = customers
        .filter(c => c.deleted !== true && c.status !== 'inactive' && getAge(c.birthDate) >= 74 && getAge(c.birthDate) < 75)
        .map(c => ({ 
            id: `age-${c.id}`,
            customerId: c.id,
            customerName: c.name, 
            age: 75,
            link: `/customers/${c.id}`
        }));

    const birthdayTodayAlerts = customers
        .filter(c => c.deleted !== true && c.status !== 'inactive' && c.birthDate?.substring(5) === todayStr)
        .map(c => ({
            id: `bday-today-${c.id}`,
            customerId: c.id,
            customerName: c.name,
            link: `/customers/${c.id}`
        }));

    const radarAlerts = customers
        .filter(c => c.deleted !== true && c.status !== 'inactive' && getAge(c.birthDate) < 75)
        .filter(c => {
            return proposals.some(p => {
                if (p.deleted === true || p.customerId !== c.id) return false;
                if (p.status !== 'Pago' && p.status !== 'Saldo Pago') return false;
                if (!p.datePaidToClient) return false;
                const paidDate = parseDateSafe(p.datePaidToClient);
                return paidDate && differenceInMonths(now, paidDate) >= 12;
            });
        })
        .map(c => ({
            id: `radar-${c.id}`,
            customerName: c.name,
            customerId: c.id,
            link: `/customers/${c.id}`
        }));

    const followUpReminders = proposals
      .filter(p => p.deleted !== true && p.status === 'Em Andamento' && p.dateDigitized)
      .map(p => {
          const digitDate = parseDateSafe(p.dateDigitized);
          return { ...p, digitDate };
      })
      .filter(p => p.digitDate && differenceInDays(now, p.digitDate) > 20)
      .map(p => ({
        id: `fup-prop-${p.id}`,
        customerName: customerMap.get(p.customerId)?.name || 'Cliente Desconhecido',
        proposalNumber: p.proposalNumber,
        daysOpen: differenceInDays(now, p.digitDate!),
        link: `/proposals?open=${p.id}&search=${p.proposalNumber}`
      }));

    const commissionReminders = proposals
      .filter(p => 
        p.deleted !== true &&
        (p.status === 'Pago' || p.status === 'Saldo Pago') && 
        p.commissionStatus === 'Pendente' &&
        p.datePaidToClient
      )
      .map(p => {
          const paidDate = parseDateSafe(p.datePaidToClient);
          return { ...p, paidDate };
      })
      .filter(p => p.paidDate && differenceInDays(now, p.paidDate) > 7)
      .map(p => ({
        id: `comm-${p.id}`,
        customerName: customerMap.get(p.customerId)?.name || 'Cliente Desconhecido',
        proposalNumber: p.proposalNumber,
        daysPending: differenceInDays(now, p.paidDate!),
        link: `/proposals?open=${p.id}&search=${p.proposalNumber}`
      }));

    const debtBalanceReminders = proposals
        .filter(p => 
            p.deleted !== true &&
            p.product === 'Portabilidade' &&
            p.status === 'Aguardando Saldo' &&
            p.dateDigitized &&
            calculateBusinessDays(p.dateDigitized) >= 5
        )
        .map(p => ({
            id: `debt-${p.id}`,
            customerName: customerMap.get(p.customerId)?.name || 'Cliente Desconhecido',
            proposalNumber: p.proposalNumber,
            daysWaiting: calculateBusinessDays(p.dateDigitized),
            link: `/proposals?open=${p.id}&search=${p.proposalNumber}`
        }));
    
    const partialCommissionReminders = proposals
        .filter(p => 
            p.deleted !== true &&
            p.commissionStatus === 'Parcial' &&
            p.commissionPaymentDate
        )
        .map(p => {
            const lastPayDate = parseDateSafe(p.commissionPaymentDate);
            return { ...p, lastPayDate };
        })
        .filter(p => p.lastPayDate && differenceInDays(now, p.lastPayDate) > 15)
        .map(p => ({
            id: `part-${p.id}`,
            customerName: customerMap.get(p.customerId)?.name || 'Cliente Desconhecido',
            proposalNumber: p.proposalNumber,
            amountPaid: p.amountPaid,
            totalCommission: p.commissionValue,
            daysSincePayment: differenceInDays(now, p.lastPayDate!),
            link: `/proposals?open=${p.id}&search=${p.proposalNumber}`
        }));

    const manualFollowUps = (followUps || [])
        .filter(f => {
            if (f.deleted === true || !f.dueDate) return false;
            // Validação bilíngue de status (Pendente / Pending)
            if (f.status !== 'pending' && f.status !== 'pendente') return false;
            
            const dueDateStr = f.dueDate.substring(0, 10);
            return dueDateStr <= todayIso;
        })
        .map(f => {
            const dueDateStr = f.dueDate.substring(0, 10);
            return {
                id: `fup-${f.id}`,
                contactName: f.contactName,
                description: f.description,
                isToday: dueDateStr === todayIso,
                link: '/follow-ups'
            };
        });

    const expenseAlerts = expenses
        .filter(e => !e.paid)
        .map(e => {
            const expDate = parseDateSafe(e.date);
            return { ...e, expDate };
        })
        .filter(e => e.expDate && (differenceInDays(e.expDate, now) <= 5 || isBefore(e.expDate, startOfDay(now))))
        .map(e => ({
            id: `exp-${e.id}`,
            description: e.description,
            amount: e.amount,
            days: e.expDate ? differenceInDays(e.expDate, startOfDay(now)) : 0,
            link: `/financial?tab=expenses`
        }));

    const leadAlerts = (leadsData || [])
        .filter(l => l.status === 'pending' && l.ownerId === user?.uid)
        .map(l => ({
            id: `lead-${l.id}`,
            name: l.name,
            requestedAmount: l.requestedAmount || 0,
            dateStr: l.createdAt ? format(parseDateSafe(l.createdAt) || now, 'dd/MM/yyyy') : '',
            link: `/customers`
        }));

    return { 
        birthdayAlerts, 
        birthdayTodayAlerts,
        followUpReminders, 
        commissionReminders, 
        debtBalanceReminders, 
        partialCommissionReminders,
        manualFollowUps,
        radarAlerts,
        expenseAlerts,
        leadAlerts
    };
  }, [isClient, proposals, customers, followUps, expenses, leadsData, user?.uid]);
  
  const visibleBirthdayAlerts = alertData.birthdayAlerts.filter(a => !dismissedItems.includes(a.id));
  const visibleBirthdayTodayAlerts = alertData.birthdayTodayAlerts.filter(a => !dismissedItems.includes(a.id));
  const visibleFollowUpReminders = alertData.followUpReminders.filter(a => !dismissedItems.includes(a.id));
  const visibleCommissionReminders = alertData.commissionReminders.filter(a => !dismissedItems.includes(a.id));
  const visibleDebtBalanceReminders = alertData.debtBalanceReminders.filter(a => !dismissedItems.includes(a.id));
  const visiblePartialCommissionReminders = alertData.partialCommissionReminders.filter(a => !dismissedItems.includes(a.id));
  const visibleManualFollowUps = alertData.manualFollowUps.filter(a => !dismissedItems.includes(a.id));
  const visibleRadarAlerts = alertData.radarAlerts.filter(a => !dismissedItems.includes(a.id));
  const visibleExpenseAlerts = alertData.expenseAlerts.filter(a => !dismissedItems.includes(a.id));
  const visibleLeadAlerts = alertData.leadAlerts.filter(a => !dismissedItems.includes(a.id));

  const hasVisibleAlerts = 
    visibleBirthdayAlerts.length > 0 ||
    visibleBirthdayTodayAlerts.length > 0 ||
    visibleFollowUpReminders.length > 0 ||
    visibleCommissionReminders.length > 0 ||
    visibleDebtBalanceReminders.length > 0 ||
    visiblePartialCommissionReminders.length > 0 ||
    visibleManualFollowUps.length > 0 ||
    visibleRadarAlerts.length > 0 ||
    visibleExpenseAlerts.length > 0 ||
    visibleLeadAlerts.length > 0;

  const handleSendEmail = async () => {
    if (!userProfile || !userProfile.email) {
      toast({ variant: 'destructive', title: 'E-mail não encontrado' });
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
        toast({ title: 'E-mail Enviado!' });
      }
    } catch (error) {
      console.error('Error sending summary email:', error);
    } finally {
      setIsSending(false);
    }
  };

  const handleGenerateBdayMessage = async (e: React.MouseEvent, customerId: string) => {
    if (e) {
        e.preventDefault();
        e.stopPropagation();
    }
    
    const customer = customers.find(c => c.id === customerId);
    if (!customer) return;

    setSelectedBdayCustomer(customer);
    setIsGeneratingBday(true);
    setGeneratedBdayMessage('');
    setIsBdayModalOpen(true);

    try {
        const result = await generateBirthdayMessage({ customerName: customer.name });
        setGeneratedBdayMessage(result.message);
    } catch (error) {
        console.error("Erro na IA de parabéns:", error);
        toast({ variant: 'destructive', title: 'Erro na IA', description: 'Não foi possível gerar a mensagem.' });
        // Mantemos aberto para evitar o comportamento de "apenas fechar"
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

  if (!isClient) return null;

  return (
    <>
    <Card className="h-full flex flex-col border-border/50 shadow-lg overflow-hidden bg-card">
      <CardHeader className="flex flex-row items-center justify-between pb-4 bg-muted/10 border-b border-border/30">
        <div className='space-y-1'>
            <CardTitle className="text-lg font-bold flex items-center gap-2">
                <Bot className="text-primary h-5 w-5" />
                Inteligência Diária
            </CardTitle>
            <CardDescription className="text-[10px] font-black uppercase tracking-[0.15em] opacity-60">
                Alertas estratégicos do dia
            </CardDescription>
        </div>
        <div className="flex items-center gap-2">
            {dismissedItems.length > 0 && (
                <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={handleRestoreAlerts}
                    className="h-9 px-3 rounded-full text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-primary transition-all"
                >
                    <RotateCcw className="h-3.5 w-3.5 mr-1.5" /> Restaurar
                </Button>
            )}
            <Button 
                variant="default" 
                size="sm" 
                onClick={handleSendEmail} 
                disabled={isSending}
                className="h-9 px-5 bg-primary text-primary-foreground hover:bg-primary/90 rounded-full font-bold text-[10px] uppercase tracking-wider shadow-lg transition-all group"
            >
                {isSending ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-2" /> : <Send className="h-3.5 w-3.5 mr-2 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />}
                Resumo E-mail
            </Button>
        </div>
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden pt-6 pb-0">
        {!hasVisibleAlerts ? (
            <div className="flex h-[400px] flex-col items-center justify-center text-center text-muted-foreground p-8 border-2 border-dashed border-border/50 rounded-xl bg-muted/5">
                <Info className="h-10 w-10 mb-4 opacity-20" />
                <p className="font-bold text-sm text-foreground/80 tracking-tight">Esteira Limpa!</p>
                <p className="text-[11px] opacity-60 mt-1 uppercase font-bold tracking-tighter">Nenhuma pendência para agora.</p>
            </div>
        ) : (
            <ScrollArea className="h-[450px] w-full">
                <div className="space-y-6 pr-4 pb-10">
                    {visibleLeadAlerts.length > 0 && (
                        <div className="space-y-3">
                            <h3 className="text-[10px] font-black uppercase tracking-[0.25em] text-orange-600 flex items-center gap-2 px-1">
                                <Zap className="h-3.5 w-3.5" /> Novos Leads do Portal ({visibleLeadAlerts.length})
                            </h3>
                            <div className="grid gap-2.5">
                                {visibleLeadAlerts.map((alert: any) => (
                                    <SummaryAlertItem
                                        key={alert.id}
                                        id={alert.id}
                                        icon={<div className="h-5 w-5 rounded-full bg-orange-500/10 flex items-center justify-center border border-orange-500/20"><Zap className="h-3 w-3 text-orange-500" /></div>}
                                        title={<span className="text-orange-600">Lead: {alert.name}</span> as any}
                                        description={`Desejado: ${formatCurrency(alert.requestedAmount)} (${alert.dateStr}). Clique para ver na aba Clientes.`}
                                        link={alert.link}
                                        onDismiss={handleDismiss}
                                    />
                                ))}
                            </div>
                        </div>
                    )}

                    {visibleExpenseAlerts.length > 0 && (
                        <div className="space-y-3">
                            <h3 className="text-[10px] font-black uppercase tracking-[0.25em] text-red-600 flex items-center gap-2 px-1">
                                <Receipt className="h-3.5 w-3.5" /> Contas a Pagar (Operacional)
                            </h3>
                            <div className="grid gap-2.5">
                                {visibleExpenseAlerts.map(e => (
                                    <SummaryAlertItem 
                                        key={e.id}
                                        id={e.id}
                                        icon={<Receipt className={cn("h-4.5 w-4.5", e.isLate ? "text-red-600 animate-pulse" : "text-red-400")} />}
                                        title={e.title}
                                        description={`Vencimento: ${e.date} | Valor: ${formatCurrency(e.amount)}. ${e.isLate ? 'ATRASADA!' : ''}`}
                                        link={e.link}
                                        onDismiss={handleDismiss}
                                    />
                                ))}
                            </div>
                        </div>
                    )}

                    {visibleBirthdayTodayAlerts.length > 0 && (
                        <div className="space-y-3">
                            <h3 className="text-[10px] font-black uppercase tracking-[0.25em] text-pink-600 flex items-center gap-2 px-1">
                                <Cake className="h-3.5 w-3.5" /> Aniversariantes de Hoje
                            </h3>
                            <div className="grid gap-2.5">
                                {visibleBirthdayTodayAlerts.map(alert => (
                                    <SummaryAlertItem 
                                        key={alert.id}
                                        id={alert.id}
                                        icon={<Cake className="h-4.5 w-4.5 text-pink-500" />}
                                        title={alert.customerName}
                                        description="Hoje é o aniversário deste cliente! Envie uma mensagem personalizada."
                                        link={alert.link}
                                        onDismiss={handleDismiss}
                                        action={
                                            <Button 
                                                size="sm" 
                                                variant="outline" 
                                                className="h-8 text-[10px] font-black uppercase border-pink-200 text-pink-600 hover:bg-pink-50"
                                                onClick={(e) => handleGenerateBdayMessage(e, alert.customerId)}
                                            >
                                                <Bot className="mr-2 h-3.5 w-3.5" /> Gerar Mensagem IA
                                            </Button>
                                        }
                                    />
                                ))}
                            </div>
                        </div>
                    )}

                    {visibleDebtBalanceReminders.length > 0 && (
                        <div className="space-y-3">
                            <h3 className="text-[10px] font-black uppercase tracking-[0.25em] text-red-600 flex items-center gap-2 px-1">
                                <Hourglass className="h-3.5 w-3.5" /> Alertas de Saldo Devedor
                            </h3>
                            <div className="grid gap-2.5">
                                {visibleDebtBalanceReminders.map(reminder => (
                                    <SummaryAlertItem 
                                        key={reminder.id}
                                        id={reminder.id}
                                        icon={<Hourglass className="h-4.5 w-4.5 text-red-500" />}
                                        title={reminder.customerName}
                                        description={`Proposta ${reminder.proposalNumber} aguardando saldo há ${reminder.daysWaiting} dias úteis.`}
                                        link={reminder.link}
                                        onDismiss={handleDismiss}
                                    />
                                ))}
                            </div>
                        </div>
                    )}

                    {(visibleCommissionReminders.length > 0 || visiblePartialCommissionReminders.length > 0) && (
                        <div className="space-y-3">
                            <h3 className="text-[10px] font-black uppercase tracking-[0.25em] text-blue-600 flex items-center gap-2 px-1">
                                <BadgePercent className="h-3.5 w-3.5" /> Cobranças Pendentes
                            </h3>
                            <div className="grid gap-2.5">
                                {visibleCommissionReminders.map(reminder => (
                                    <SummaryAlertItem 
                                        key={reminder.id}
                                        id={reminder.id}
                                        icon={<BadgePercent className="h-4.5 w-4.5 text-blue-500" />}
                                        title={reminder.customerName}
                                        description={`Comissão da Prop. ${reminder.proposalNumber} pendente há ${reminder.daysPending} dias.`}
                                        link={reminder.link}
                                        onDismiss={handleDismiss}
                                    />
                                ))}
                                {visiblePartialCommissionReminders.map(reminder => (
                                    <SummaryAlertItem 
                                        key={reminder.id}
                                        id={reminder.id}
                                        icon={<Coins className="h-4.5 w-4.5 text-blue-500" />}
                                        title={reminder.customerName}
                                        description={`Recebido R$ ${reminder.amountPaid.toFixed(2)} de R$ ${reminder.totalCommission.toFixed(2)}. Cobrar saldo.`}
                                        link={reminder.link}
                                        onDismiss={handleDismiss}
                                    />
                                ))}
                            </div>
                        </div>
                    )}

                    {visibleRadarAlerts.length > 0 && (
                        <div className="space-y-3">
                            <h3 className="text-[10px] font-black uppercase tracking-[0.25em] text-orange-600 flex items-center gap-2 px-1">
                                <Zap className="h-3.5 w-3.5 fill-orange-600" /> Radar de Vendas (Retenção)
                            </h3>
                            <div className="grid gap-2.5">
                                {visibleRadarAlerts.map(r => (
                                    <SummaryAlertItem 
                                        key={r.id}
                                        id={r.id}
                                        icon={<Zap className="h-4.5 w-4.5 text-orange-500 fill-orange-500" />}
                                        title={r.customerName}
                                        description="Contrato pago há mais de 12 meses. Oportunidade de Refinanciamento."
                                        link={r.link}
                                        onDismiss={handleDismiss}
                                    />
                                ))}
                            </div>
                        </div>
                    )}

                    {visibleManualFollowUps.length > 0 && (
                        <div className="space-y-3">
                            <h3 className="text-[10px] font-black uppercase tracking-[0.25em] text-purple-600 flex items-center gap-2 px-1">
                                <CalendarClock className="h-3.5 w-3.5" /> Retornos Agendados
                            </h3>
                            <div className="grid gap-2.5">
                                {visibleManualFollowUps.map(f => (
                                    <SummaryAlertItem 
                                        key={f.id}
                                        id={f.id}
                                        icon={<CalendarClock className={cn("h-4.5 w-4.5", f.isToday ? "text-yellow-500" : "text-destructive")} />}
                                        title={f.contactName}
                                        description={f.description}
                                        link={f.link}
                                        onDismiss={handleDismiss}
                                    />
                                ))}
                            </div>
                        </div>
                    )}

                    {visibleBirthdayAlerts.length > 0 && (
                        <div className="space-y-3">
                            <h3 className="text-[10px] font-black uppercase tracking-[0.25em] text-pink-600 flex items-center gap-2 px-1">
                                <Cake className="h-3.5 w-3.5" /> Alerta de Idade (75 Anos)
                            </h3>
                            <div className="grid gap-2.5">
                                {visibleBirthdayAlerts.map(alert => (
                                    <SummaryAlertItem 
                                        key={alert.id}
                                        id={alert.id}
                                        icon={<Cake className="h-4.5 w-4.5 text-pink-500" />}
                                        title={alert.customerName}
                                        description={`Próximo aos ${alert.age} anos. Verifique restrições.`}
                                        link={alert.link}
                                        onDismiss={handleDismiss}
                                        action={
                                            <Button 
                                                size="sm" 
                                                variant="outline" 
                                                className="h-8 text-[10px] font-black uppercase border-pink-200 text-pink-600 hover:bg-pink-50"
                                                onClick={(e) => handleGenerateBdayMessage(e, alert.customerId)}
                                            >
                                                <Bot className="mr-2 h-3.5 w-3.5" /> Gerar Mensagem IA
                                            </Button>
                                        }
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
        <DialogContent className="max-w-md rounded-[2rem]">
            <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                    <MessageSquareText className="h-5 w-5 text-pink-500" />
                    Mensagem IA: {selectedBdayCustomer?.name}
                </DialogTitle>
            </DialogHeader>
            <div className="py-4">
                {isGeneratingBday ? (
                    <div className="flex flex-col items-center justify-center py-10 gap-4">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        <p className="text-sm text-muted-foreground animate-pulse font-bold uppercase">Criando parabéns personalizado...</p>
                    </div>
                ) : (
                    <textarea 
                        className="w-full min-h-[150px] p-4 rounded-3xl border-2 bg-muted/30 text-sm focus:ring-2 focus:ring-primary outline-none font-medium leading-relaxed"
                        value={generatedBdayMessage}
                        onChange={(e) => setGeneratedBdayMessage(e.target.value)}
                    />
                )}
            </div>
            <DialogFooter>
                <Button variant="ghost" className="rounded-full font-bold" onClick={() => setIsBdayModalOpen(false)}>Cancelar</Button>
                <Button onClick={handleSendToWhatsApp} className="rounded-full font-bold" disabled={isGeneratingBday || !generatedBdayMessage}>
                    Enviar para WhatsApp
                </Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>
    </>
  );
}
