'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Bell, Cake, BadgePercent, X, CalendarClock, Bot, Loader2, MessageSquareText, Hourglass, Coins, Zap, AlertTriangle, Newspaper, UserPlus, ChevronRight, Download, Receipt } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useCollection, useFirestore, useUser, useMemoFirebase, useDoc } from '@/firebase';
import { collection, query, where, doc, setDoc, orderBy, limit } from 'firebase/firestore';
import type { Customer, Proposal, FollowUp, UserSettings, Lead, Expense } from '@/lib/types';
import { differenceInDays, format, differenceInMonths, parseISO, isAfter, subDays, startOfDay, isBefore } from 'date-fns';
import { getWhatsAppUrl, calculateBusinessDays, getAge, parseDateSafe } from '@/lib/utils';
import Link from 'next/link';
import { generateBirthdayMessage } from '@/ai/flows/generate-birthday-message-flow';
import { toast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

export function NotificationBell() {
  const { user } = useUser();
  const firestore = useFirestore();
  const [isClient, setIsClient] = useState(false);
  const [hasNewLeadPulse, setHasNewLeadPulse] = useState(false);
  const lastLeadIdRef = useRef<string | null>(null);

  // AI State
  const [isGeneratingBday, setIsGeneratingBday] = useState(false);
  const [generatedBdayMessage, setGeneratedBdayMessage] = useState('');
  const [selectedBdayCustomer, setSelectedBdayCustomer] = useState<Customer | null>(null);
  const [isBdayModalOpen, setIsBdayModalOpen] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const customersQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(
        collection(firestore, 'customers'), 
        where('ownerId', '==', user.uid)
    );
  }, [firestore, user]);

  const proposalsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(
        collection(firestore, 'loanProposals'), 
        where('ownerId', '==', user.uid),
        // IMPORTANTE: Foco apenas em propostas passíveis de atraso/comissão. Requer índice (ownerId + status IN) no Firebase.
        where('status', 'in', ['Pago', 'Saldo Pago', 'Aguardando Saldo', 'Em Andamento']) 
    );
  }, [firestore, user]);

  const expensesQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return collection(firestore, 'users', user.uid, 'expenses');
  }, [firestore, user]);

  const followUpsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(
        collection(firestore, 'users', user.uid, 'followUps'), 
        // Removemos o filtro de status da query do Firestore para aceitar 'pending' e 'pendente' via loop local
        limit(100)
    );
  }, [firestore, user]);

  const newsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(
        collection(firestore, 'managementNews'), 
        where('status', '==', 'Published'),
        orderBy('date', 'desc'),
        limit(10)
    );
  }, [firestore]);

  const leadsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(
        collection(firestore, 'leads'),
        where('ownerId', '==', user.uid)
    );
  }, [firestore, user]);

  const settingsDocRef = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return doc(firestore, 'userSettings', user.uid);
  }, [firestore, user]);

  const { data: customers } = useCollection<Customer>(customersQuery);
  const { data: proposals } = useCollection<Proposal>(proposalsQuery);
  const { data: followUps } = useCollection<FollowUp>(followUpsQuery);
  const { data: news } = useCollection<any>(newsQuery);
  const { data: leads } = useCollection<Lead>(leadsQuery);
  const { data: expenses } = useCollection<Expense>(expensesQuery);
  const { data: userSettings } = useDoc<UserSettings>(settingsDocRef);

  useEffect(() => {
    if (leads && leads.length > 0) {
        const sortedLeads = [...leads].sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
        const latestLead = sortedLeads[0];
        if (lastLeadIdRef.current && lastLeadIdRef.current !== latestLead.id) {
            setHasNewLeadPulse(true);
            toast({ 
                title: "🚀 NOVO LEAD RECEBIDO!", 
                description: `${latestLead.name} acabou de preencher a ficha.`,
                variant: "default"
            });
        }
        lastLeadIdRef.current = latestLead.id;
    }
  }, [leads]);

  const dismissedIds = userSettings?.dismissedAlerts || [];

  const notifications = React.useMemo(() => {
    if (!isClient) return [];
    
    const alerts: { id: string; title: string; type: 'birthday' | 'commission' | 'followup' | 'debt' | 'partial' | 'radar' | 'age' | 'news' | 'lead' | 'expense'; date: string; link: string; customerId?: string }[] = [];
    const now = new Date();
    const todayStr = format(now, 'MM-dd');
    const todayIso = format(now, 'yyyy-MM-dd');
    const threeDaysAgo = subDays(now, 3);
    const startOfToday = startOfDay(now);

    // 1. LEADS DO PORTAL (Novos)
    [...(leads || [])].sort((a, b) => (parseDateSafe(b.createdAt)?.getTime() || 0) - (parseDateSafe(a.createdAt)?.getTime() || 0)).filter(l => l.status === 'pending').forEach(lead => {
        alerts.push({
            id: `lead-${lead.id}`,
            title: `Portal: ${lead.name}`,
            type: 'lead',
            date: lead.createdAt && parseDateSafe(lead.createdAt) ? format(parseDateSafe(lead.createdAt)!, 'dd/MM HH:mm') : 'Pendente',
            link: `/customers?editLead=${lead.id}`
        });
    });

    // 2. NOVIDADES (Sino Especial)
    news?.forEach(item => {
        const publishDate = parseISO(item.date);
        if (isAfter(publishDate, threeDaysAgo)) {
            alerts.push({
                id: `news-${item.id}`,
                title: `Novidade: ${item.title}`,
                type: 'news',
                date: 'Publicado agora',
                link: '/management'
            });
        }
    });

    // 3. CONTAS A PAGAR (Operacional) - NOVO NO SINO
    expenses?.filter(e => !e.paid).forEach(e => {
        const expDate = parseDateSafe(e.date);
        if (expDate && (differenceInDays(expDate, now) <= 5 || isBefore(expDate, startOfToday))) {
            alerts.push({
                id: `exp-${e.id}`,
                title: `Pagar: ${e.description}`,
                type: 'expense',
                date: isBefore(expDate, startOfToday) ? 'Atrasada!' : e.date,
                link: '/financial?tab=expenses'
            });
        }
    });

    // 4. CLIENTES (Aniversário, Idade, Radar)
    customers?.filter(c => c.deleted !== true && c.status !== 'inactive').forEach(c => {
      const age = getAge(c.birthDate);
      
      if (age === 74) {
        alerts.push({
          id: `age-${c.id}`,
          title: `Atenção Idade: ${c.name}`,
          type: 'age',
          date: 'Fará 75 anos',
          link: `/customers/${c.id}`,
          customerId: c.id
        });
      }

      if (c.birthDate && c.birthDate.substring(5) === todayStr) {
        alerts.push({
          id: `bday-today-${c.id}`, // Sincronizado com DailySummary
          title: `Parabéns: ${c.name}`,
          type: 'birthday',
          date: 'Hoje',
          link: `/customers/${c.id}`,
          customerId: c.id
        });
      }

      const hasMatured = proposals?.some(p => {
          if (p.deleted === true || p.customerId !== c.id) return false;
          if (!['Pago', 'Saldo Pago'].includes(p.status)) return false;
          if (!p.datePaidToClient) return false;
          const paidDate = parseDateSafe(p.datePaidToClient);
          return paidDate && differenceInMonths(now, paidDate) >= 12;
      });

      if (hasMatured && age < 75) {
          alerts.push({
              id: `radar-${c.id}`,
              title: `Radar: ${c.name}`,
              type: 'radar',
              date: 'Contrato Maduro',
              link: `/customers/${c.id}`
          });
      }
    });

    // 5. RETORNOS AGENDADOS (Follow-ups Manuais)
    followUps?.filter(f => {
        if (f.deleted === true || !f.dueDate) return false;
        return f.status === 'pending' || f.status === 'pendente';
    }).forEach(f => {
        const dueDateStr = f.dueDate.substring(0, 10);
        if (dueDateStr <= todayIso) {
            alerts.push({
                id: `fup-${f.id}`,
                title: `Retorno: ${f.contactName}`,
                type: 'followup',
                date: dueDateStr === todayIso ? 'Hoje' : 'Atrasado',
                link: '/follow-ups'
            });
        }
    });

    // 6. PROPOSTAS (Comissões e Pendências Operacionais)
    proposals?.filter(p => p.deleted !== true).forEach(p => {
      // Comissão Pendente
      if (['Pago', 'Saldo Pago'].includes(p.status) && p.commissionStatus === 'Pendente' && p.datePaidToClient) {
        const paidDate = parseDateSafe(p.datePaidToClient);
        const days = paidDate ? differenceInDays(now, paidDate) : 0;
        if (days > 7) {
          alerts.push({
            id: `comm-${p.id}`,
            title: `Comissão: ${p.proposalNumber}`,
            type: 'commission',
            date: `${days} dias`,
            link: `/proposals?open=${p.id}`
          });
        }
      }

      // Saldo Atrasado (Portabilidade)
      if (p.product === 'Portabilidade' && p.status === 'Aguardando Saldo' && p.dateDigitized) {
          const bizDays = calculateBusinessDays(p.dateDigitized);
          if (bizDays >= 5) {
              alerts.push({
                  id: `debt-${p.id}`,
                  title: `Saldo: ${p.proposalNumber}`,
                  type: 'debt',
                  date: `${bizDays} dias úteis`,
                  link: `/proposals?open=${p.id}`
              });
          }
      }

      // Cobrança de Saldo (Parcial)
      if (p.commissionStatus === 'Parcial' && p.commissionPaymentDate) {
          const lastPayDate = parseDateSafe(p.commissionPaymentDate);
          const daysSince = lastPayDate ? differenceInDays(now, lastPayDate) : 0;
          if (daysSince > 15) {
              alerts.push({
                  id: `part-${p.id}`,
                  title: `Saldo: ${p.proposalNumber}`,
                  type: 'partial',
                  date: `${daysSince} dias`,
                  link: `/proposals?open=${p.id}`
              });
          }
      }

      // Lembrete de Acompanhamento (Em Andamento há muito tempo) - NOVO NO SINO
      if (p.status === 'Em Andamento' && p.dateDigitized) {
          const digitDate = parseDateSafe(p.dateDigitized);
          const days = digitDate ? differenceInDays(now, digitDate) : 0;
          if (days > 20) {
              alerts.push({
                  id: `fup-prop-${p.id}`,
                  title: `Atrasada: ${p.proposalNumber}`,
                  type: 'followup',
                  date: `${days} dias`,
                  link: `/proposals?open=${p.id}`
              });
          }
      }
    });

    return alerts;
  }, [customers, proposals, followUps, news, leads, expenses, isClient]);

  const visibleNotifications = React.useMemo(() => {
    const readIds = userSettings?.readAlerts || [];
    return notifications.filter(n => !dismissedIds.includes(n.id) && !readIds.includes(n.id));
  }, [notifications, dismissedIds, userSettings?.readAlerts]);

  const handleDismiss = async (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user || !firestore) return;

    try {
        await setDoc(doc(firestore, 'userSettings', user.uid), {
            dismissedAlerts: [...dismissedIds, id]
        }, { merge: true });
    } catch (err) {
        console.error("Failed to dismiss cloud alert:", err);
    }
  };

  const dismissQuietly = async (id: string) => {
    if (!user || !firestore) return;
    try {
        const readIds = userSettings?.readAlerts || [];
        if (!readIds.includes(id)) {
            await setDoc(doc(firestore, 'userSettings', user.uid), {
                readAlerts: [...readIds, id]
            }, { merge: true });
        }
    } catch (err) {}
  };

  const handleBdayClick = async (e: React.MouseEvent | React.SyntheticEvent, customerId: string) => {
    // 🛡️ ISOLAMENTO TOTAL: Impede que o clique dispare navegação no Link pai ou feche o DropdownMenu
    if (e) {
        e.preventDefault();
        e.stopPropagation();
    }
    
    const customer = customers?.find(c => c.id === customerId);
    if (!customer) return;

    setSelectedBdayCustomer(customer);
    setIsGeneratingBday(true);
    setGeneratedBdayMessage('');
    setIsBdayModalOpen(true);

    try {
        const result = await generateBirthdayMessage({ customerName: customer.name });
        setGeneratedBdayMessage(result.message);
    } catch (error) {
        console.error("Erro na geração de parabéns:", error);
        toast({ variant: 'destructive', title: 'Erro na IA', description: 'Não foi possível gerar a mensagem agora.' });
        // Mantemos o modal aberto para não dar a impressão de "apenas fechou"
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

  const count = visibleNotifications.length;

  return (
    <>
    <DropdownMenu onOpenChange={(open) => open && setHasNewLeadPulse(false)}>
      <DropdownMenuTrigger asChild>
        < Button 
            variant="ghost" 
            size="icon" 
            className={cn(
                "relative transition-all duration-500",
                isClient && hasNewLeadPulse && "animate-alert-pulse text-orange-500"
            )}
            style={isClient && hasNewLeadPulse ? { '--status-color': '24 95% 53%' } as any : {}}
        >
          < Bell className={cn("h-5 w-5", isClient && hasNewLeadPulse && "fill-current")} />
          {isClient && count > 0 && (
            <Badge className={cn(
                "absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-[10px] animate-in zoom-in",
                hasNewLeadPulse ? "bg-orange-600" : "bg-red-500"
            )}>
              {count}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        {!isClient ? (
            <div className="p-8 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto opacity-20" /></div>
        ) : (
            <>
                <div className="flex items-center justify-between p-2 px-3">
                    <DropdownMenuLabel className="p-0">Notificações</DropdownMenuLabel>
                    {dismissedIds.length > 0 && (
                        <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-auto p-0 text-[10px] text-muted-foreground hover:text-primary"
                            onClick={async () => {
                                if (user && firestore) {
                                    await setDoc(doc(firestore, 'userSettings', user.uid), { 
                                        dismissedAlerts: [],
                                        readAlerts: [] 
                                    }, { merge: true });
                                }
                            }}
                        >
                            Restaurar Tudo
                        </Button>
                    )}
                </div>
                <DropdownMenuSeparator />
                {count === 0 ? (
                <div className="p-8 text-center text-sm text-muted-foreground">
                    <Bell className="h-8 w-8 mx-auto mb-2 opacity-20" />
                    Nenhum alerta novo.
                </div>
                ) : (
                <div className="max-h-96 overflow-y-auto">
                    {visibleNotifications.map((n) => (
                    <div key={n.id} className="relative group">
                        <div className="flex items-center pr-10">
                            <Link href={n.link} passHref className="flex-1" onClick={() => dismissQuietly(n.id)}>
                                <DropdownMenuItem className="w-full p-2 pl-4 focus:bg-muted/30 cursor-pointer border-b">
                                <div className="flex items-start gap-3 w-full">
                                    {n.type === 'lead' && <Zap className="h-5 w-5 text-purple-500 mt-1" />}
                                    {n.type === 'birthday' && <Cake className="h-5 w-5 text-pink-500 mt-1" />}
                                    {n.type === 'commission' && <Download className="h-4 w-4 text-emerald-500 mt-1" />}
                                    {n.type === 'followup' && <CalendarClock className="h-4 w-4 text-blue-500 mt-1" />}
                                    {n.type === 'debt' && <Hourglass className="h-4 w-4 text-red-500 mt-1" />}
                                    {n.type === 'partial' && <Coins className="h-4 w-4 text-blue-500 mt-1" />}
                                    {n.type === 'news' && <Newspaper className="h-4 w-4 text-emerald-500 mt-1" />}
                                    {n.type === 'expense' && <Receipt className="h-4 w-4 text-red-500 mt-1" />}
                                    <div className="space-y-1 overflow-hidden">
                                    <p className="text-xs font-bold leading-none truncate">{n.title}</p>
                                    <p className="text-[10px] text-muted-foreground">{n.date}</p>
                                    </div>
                                </div>
                                </DropdownMenuItem>
                            </Link>
                            {n.type === 'birthday' && n.customerId && (
                                <Button 
                                    type="button"
                                    variant="ghost" 
                                    size="icon" 
                                    className="absolute right-10 top-1/2 -translate-y-1/2 h-8 w-8 text-pink-500 hover:bg-pink-50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-20"
                                    onClick={(e) => handleBdayClick(e, n.customerId!)}
                                    title="Gerar Mensagem WhatsApp"
                                >
                                    <Bot className="h-4 w-4" />
                                </Button>
                            )}
                        </div>
                        <button
                            onClick={(e) => handleDismiss(e, n.id)}
                            className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-muted rounded-md"
                            title="Remover"
                        >
                            <X className="h-3 w-3 text-muted-foreground" />
                        </button>
                    </div>
                    ))}
                </div>
                )}
            </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>

    <Dialog open={isBdayModalOpen} onOpenChange={setIsBdayModalOpen}>
        <DialogContent className="max-w-md rounded-[2rem]">
            <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                    <MessageSquareText className="h-5 w-5 text-pink-500" />
                    Mensagem IA: {selectedBdayCustomer?.name}
                </DialogTitle>
                <DialogDescription>Script personalizado gerado por inteligência artificial para parabenizar o cliente.</DialogDescription>
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
