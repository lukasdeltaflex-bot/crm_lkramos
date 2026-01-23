'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Bot, Send, BellRing, Clock, BadgePercent, Hourglass, Coins, X, Info, Loader2 } from 'lucide-react';
import type { Customer, Proposal, UserProfile } from '@/lib/types';
import { Skeleton } from '../ui/skeleton';
import { differenceInDays } from 'date-fns';
import { calculateBusinessDays } from '@/lib/utils';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { toast } from '@/hooks/use-toast';
import { sendSummaryEmail } from '@/ai/flows/send-summary-email-flow';

interface DailySummaryProps {
  proposals: Proposal[];
  customers: Customer[];
  userProfile: UserProfile | null;
}

const DISMISS_STORAGE_KEY = 'dismissed_daily_summary_items_v1';

// A generic alert item component
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
    <Alert className="bg-card shadow-sm">
      {icon}
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription>{description}</AlertDescription>
      <button
        onClick={() => onDismiss(id)}
        className="absolute top-2 right-2 p-1 text-muted-foreground/80 hover:text-foreground rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        aria-label="Dispensar alerta"
      >
        <X className="h-4 w-4" />
      </button>
    </Alert>
  );
}


export function DailySummary({ proposals, customers, userProfile }: DailySummaryProps) {
  const [dismissedItems, setDismissedItems] = useState<string[]>([]);
  const [isClient, setIsClient] = useState(false);
  const [isSending, setIsSending] = useState(false);

  // Load dismissed items from localStorage on initial render
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

  // Memoize alert calculations
  const alertData = useMemo(() => {
    const getAge = (birthDate: string) => {
        if (!birthDate) return 0;
        const today = new Date();
        const birth = new Date(birthDate);
        let age = today.getFullYear() - birth.getFullYear();
        const m = today.getMonth() - birth.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
          age--;
        }
        return age;
    };

    const customerMap = new Map(customers.map(c => [c.id, c]));

    const birthdayAlerts = customers
        .filter(c => getAge(c.birthDate) >= 74)
        .map(c => ({ 
            id: `birthday-${c.id}`,
            customerName: c.name, 
            age: 75 
        }));

    const followUpReminders = proposals
      .filter(p => p.status === 'Em Andamento' && p.dateDigitized && differenceInDays(new Date(), new Date(p.dateDigitized)) > 20)
      .map(p => ({
        id: `followup-${p.id}`,
        customerName: customerMap.get(p.customerId)?.name || 'Cliente Desconhecido',
        proposalNumber: p.proposalNumber,
        daysOpen: differenceInDays(new Date(), new Date(p.dateDigitized)),
      }));

    const commissionReminders = proposals
      .filter(p => 
        (p.status === 'Pago' || p.status === 'Saldo Pago') && 
        p.commissionStatus === 'Pendente' &&
        p.datePaidToClient && 
        differenceInDays(new Date(), new Date(p.datePaidToClient)) > 7
      )
      .map(p => ({
        id: `commission-${p.id}`,
        customerName: customerMap.get(p.customerId)?.name || 'Cliente Desconhecido',
        proposalNumber: p.proposalNumber,
        daysPending: differenceInDays(new Date(), new Date(p.datePaidToClient!)),
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
            differenceInDays(new Date(), new Date(p.commissionPaymentDate)) > 15
        )
        .map(p => ({
            id: `partial-${p.id}`,
            customerName: customerMap.get(p.customerId)?.name || 'Cliente Desconhecido',
            proposalNumber: p.proposalNumber,
            amountPaid: p.amountPaid,
            totalCommission: p.commissionValue,
            daysSincePayment: differenceInDays(new Date(), new Date(p.commissionPaymentDate!)),
        }));

    return { birthdayAlerts, followUpReminders, commissionReminders, debtBalanceReminders, partialCommissionReminders };
  }, [proposals, customers]);

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
        const { birthdayAlerts, followUpReminders, commissionReminders, debtBalanceReminders, partialCommissionReminders } = alertData;
        
        const hasAnyAlert = birthdayAlerts.length > 0 || followUpReminders.length > 0 || commissionReminders.length > 0 || debtBalanceReminders.length > 0 || partialCommissionReminders.length > 0;

        let summaryContent = '';
        if (!hasAnyAlert) {
            summaryContent = `Nenhuma pendência ou alerta importante para hoje. Tenha um ótimo dia!`;
        } else {
            let summary = 'Aqui está o seu resumo de pendências para hoje:\n\n';
            
            if (birthdayAlerts.length > 0) {
                summary += '### 🎂 Alertas de Aniversário (Clientes Próximos de 75 Anos)\n';
                birthdayAlerts.forEach(alert => {
                    summary += `- **${alert.customerName}**: Cliente completará ${alert.age} anos em breve. Verifique as políticas de crédito para esta faixa etária.\n`;
                });
                summary += '\n';
            }
            
            if (followUpReminders.length > 0) {
                summary += '### ⏰ Lembretes de Acompanhamento (Follow-up)\n';
                followUpReminders.forEach(reminder => {
                    summary += `- **${reminder.customerName} (Prop. nº ${reminder.proposalNumber})**: A proposta está "Em Andamento" há ${reminder.daysOpen} dias. Sugestão: entre em contato para uma atualização.\n`;
                });
                summary += '\n';
            }

            if (commissionReminders.length > 0) {
                summary += '### 💰 Alertas de Comissão Pendente\n';
                commissionReminders.forEach(reminder => {
                    summary += `- **${reminder.customerName} (Prop. nº ${reminder.proposalNumber})**: A comissão está pendente há ${reminder.daysPending} dias. Sugestão: verifique o pagamento com a promotora/banco.\n`;
                });
                summary += '\n';
            }

            if (partialCommissionReminders.length > 0) {
                summary += '### 💰 Lembretes de Comissão Parcial\n';
                partialCommissionReminders.forEach(reminder => {
                    summary += `- **${reminder.customerName} (Prop. nº ${reminder.proposalNumber})**: Recebido R$ ${reminder.amountPaid.toFixed(2)} de R$ ${reminder.totalCommission.toFixed(2)} há ${reminder.daysSincePayment} dias. Sugestão: cobrar o valor restante.\n`;
                });
                summary += '\n';
            }
            
            if (debtBalanceReminders.length > 0) {
                summary += '### ⏳ Alertas de Saldo Devedor (Portabilidade)\n';
                debtBalanceReminders.forEach(reminder => {
                    summary += `- **${reminder.customerName} (Prop. nº ${reminder.proposalNumber})**: Aguardando saldo há ${reminder.daysWaiting} dias úteis. O prazo está se esgotando, verifique o status.\n`;
                });
                summary += '\n';
            }
            summaryContent = summary;
        }

      const result = await sendSummaryEmail({
        recipientName: userProfile.displayName || userProfile.fullName || 'Usuário',
        recipientEmail: userProfile.email,
        summaryContent: summaryContent,
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
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><Bot /> Resumo Diário de Pendências</CardTitle>
                <CardDescription>Um resumo de todos os alertas e pendências gerado por IA para facilitar seu dia.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-4 rounded-md border border-dashed p-4">
                    <Skeleton className="h-6 w-1/3" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                    <div className='pt-4'>
                        <Skeleton className="h-6 w-1/3" />
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-4/5" />
                    </div>
                </div>
            </CardContent>
        </Card>
    );
  }
  
  const visibleBirthdayAlerts = alertData.birthdayAlerts.filter(a => !dismissedItems.includes(a.id));
  const visibleFollowUpReminders = alertData.followUpReminders.filter(r => !dismissedItems.includes(r.id));
  const visibleCommissionReminders = alertData.commissionReminders.filter(r => !dismissedItems.includes(r.id));
  const visibleDebtBalanceReminders = alertData.debtBalanceReminders.filter(r => !dismissedItems.includes(r.id));
  const visiblePartialCommissionReminders = alertData.partialCommissionReminders.filter(r => !dismissedItems.includes(r.id));

  const hasVisibleAlerts = 
    visibleBirthdayAlerts.length > 0 ||
    visibleFollowUpReminders.length > 0 ||
    visibleCommissionReminders.length > 0 ||
    visibleDebtBalanceReminders.length > 0 ||
    visiblePartialCommissionReminders.length > 0;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div className='space-y-1.5'>
            <CardTitle className="flex items-center gap-2">
                <Bot />
                Resumo Diário de Pendências
            </CardTitle>
            <CardDescription>
                Um resumo de todos os alertas e pendências importantes para o seu dia.
            </CardDescription>
        </div>
        <Button onClick={handleSendEmail} disabled={isSending}>
            {isSending ? (
                <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Enviando...
                </>
            ) : (
                <>
                    <Send className="mr-2 h-4 w-4" />
                    Enviar E-mail de Resumo
                </>
            )}
        </Button>
      </CardHeader>
      <CardContent>
        {!hasVisibleAlerts ? (
            <div className="flex flex-col items-center justify-center text-center text-muted-foreground p-8 border-2 border-dashed rounded-lg">
                <Info className="h-10 w-10 mb-4" />
                <p className="font-semibold">Nenhuma pendência ou alerta para hoje.</p>
                <p className="text-sm">Tenha um ótimo dia!</p>
            </div>
        ) : (
            <div className="space-y-6">
                {visibleBirthdayAlerts.length > 0 && (
                    <div>
                        <h3 className="font-semibold mb-2">🎂 Alertas de Aniversário (Clientes Próximos de 75 Anos)</h3>
                        <div className="space-y-2">
                            {visibleBirthdayAlerts.map(alert => (
                                <SummaryAlertItem 
                                    key={alert.id}
                                    id={alert.id}
                                    icon={<BellRing className="h-4 w-4" />}
                                    title={alert.customerName}
                                    description={`Cliente completará ${alert.age} anos em breve. Verifique as políticas de crédito para esta faixa etária.`}
                                    onDismiss={handleDismiss}
                                />
                            ))}
                        </div>
                    </div>
                )}
                 {visibleFollowUpReminders.length > 0 && (
                    <div>
                        <h3 className="font-semibold mb-2">⏰ Lembretes de Acompanhamento (Follow-up)</h3>
                        <div className="space-y-2">
                            {visibleFollowUpReminders.map(reminder => (
                                <SummaryAlertItem 
                                    key={reminder.id}
                                    id={reminder.id}
                                    icon={<Clock className="h-4 w-4" />}
                                    title={`${reminder.customerName} (Prop. nº ${reminder.proposalNumber})`}
                                    description={`A proposta está "Em Andamento" há ${reminder.daysOpen} dias. Sugestão: entre em contato para uma atualização.`}
                                    onDismiss={handleDismiss}
                                />
                            ))}
                        </div>
                    </div>
                )}
                 {visibleCommissionReminders.length > 0 && (
                    <div>
                        <h3 className="font-semibold mb-2">💰 Alertas de Comissão Pendente</h3>
                        <div className="space-y-2">
                            {visibleCommissionReminders.map(reminder => (
                                <SummaryAlertItem 
                                    key={reminder.id}
                                    id={reminder.id}
                                    icon={<BadgePercent className="h-4 w-4" />}
                                    title={`${reminder.customerName} (Prop. nº ${reminder.proposalNumber})`}
                                    description={`A comissão está pendente há ${reminder.daysPending} dias. Sugestão: verifique o pagamento com a promotora/banco.`}
                                    onDismiss={handleDismiss}
                                />
                            ))}
                        </div>
                    </div>
                )}
                 {visiblePartialCommissionReminders.length > 0 && (
                    <div>
                        <h3 className="font-semibold mb-2">💰 Lembretes de Comissão Parcial</h3>
                        <div className="space-y-2">
                            {visiblePartialCommissionReminders.map(reminder => (
                                <SummaryAlertItem 
                                    key={reminder.id}
                                    id={reminder.id}
                                    icon={<Coins className="h-4 w-4" />}
                                    title={`${reminder.customerName} (Prop. nº ${reminder.proposalNumber})`}
                                    description={`Recebido R$ ${reminder.amountPaid.toFixed(2)} de R$ ${reminder.totalCommission.toFixed(2)} há ${reminder.daysSincePayment} dias. Sugestão: cobrar o valor restante.`}
                                    onDismiss={handleDismiss}
                                />
                            ))}
                        </div>
                    </div>
                )}
                 {visibleDebtBalanceReminders.length > 0 && (
                    <div>
                        <h3 className="font-semibold mb-2">⏳ Alertas de Saldo Devedor (Portabilidade)</h3>
                        <div className="space-y-2">
                            {visibleDebtBalanceReminders.map(reminder => (
                                <SummaryAlertItem 
                                    key={reminder.id}
                                    id={reminder.id}
                                    icon={<Hourglass className="h-4 w-4" />}
                                    title={`${reminder.customerName} (Prop. nº ${reminder.proposalNumber})`}
                                    description={`Aguardando saldo há ${reminder.daysWaiting} dias úteis. O prazo está se esgotando, verifique o status.`}
                                    onDismiss={handleDismiss}
                                />
                            ))}
                        </div>
                    </div>
                )}
            </div>
        )}
      </CardContent>
    </Card>
  );
}
