'use client';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Hourglass, Info, X } from 'lucide-react';
import { debtBalanceReminder } from '@/ai/flows/debt-balance-reminder-flow';
import { useEffect, useState, useMemo } from 'react';
import { Skeleton } from '../ui/skeleton';
import { calculateBusinessDays } from '@/lib/utils';
import type { Proposal, Customer } from '@/lib/types';

type ReminderMessage = {
  proposalId: string;
  proposalNumber: string;
  customerName: string;
  reminderMessage: string;
};

interface DebtBalanceRemindersProps {
    proposals: Proposal[];
    customers: Customer[];
    isLoading: boolean;
}

const DISMISS_STORAGE_KEY = 'dismissed-debt-balance-reminders-v1';

function DebtBalanceReminderItem({ reminder, onDismiss }: { reminder: ReminderMessage; onDismiss: (id: string) => void }) {
  return (
    <Alert variant="destructive">
      <Hourglass className="h-4 w-4" />
      <AlertTitle>{reminder.customerName} (Proposta: {reminder.proposalNumber})</AlertTitle>
      <AlertDescription>{reminder.reminderMessage}</AlertDescription>
      <button 
        onClick={() => onDismiss(reminder.proposalId)} 
        className="absolute top-2 right-2 p-1 text-muted-foreground/80 hover:text-foreground rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        aria-label="Dispensar alerta"
      >
        <X className="h-4 w-4" />
      </button>
    </Alert>
  );
}

export function DebtBalanceReminders({ proposals, customers, isLoading }: DebtBalanceRemindersProps) {
  const [reminders, setReminders] = useState<ReminderMessage[]>([]);
  const [dismissedReminders, setDismissedReminders] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(true);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    try {
      const storedDismissed = localStorage.getItem(DISMISS_STORAGE_KEY);
      if (storedDismissed) {
        setDismissedReminders(JSON.parse(storedDismissed));
      }
    } catch (error) {
        console.error("Failed to parse dismissed alerts from localStorage", error);
        localStorage.removeItem(DISMISS_STORAGE_KEY);
    }
  }, []);

  const proposalsAwaitingBalance = useMemo(() => {
    if (!customers || !proposals) return [];
    const customerMap = new Map(customers.map(c => [c.id, c]));
    return proposals
      .filter(p => 
        p.product === 'Portabilidade' &&
        p.status === 'Aguardando Saldo' &&
        p.dateDigitized &&
        calculateBusinessDays(new Date(p.dateDigitized)) >= 5
      )
      .map(p => ({...p, customer: customerMap.get(p.customerId)}))
      .filter(p => p.customer);
  }, [proposals, customers]);

  useEffect(() => {
    async function fetchReminders() {
      if (isLoading) return;

      setIsGenerating(true);
      if (proposalsAwaitingBalance.length > 0) {
        try {
            const reminderPromises = proposalsAwaitingBalance.map(proposal => 
                debtBalanceReminder({
                customerName: proposal.customer!.name,
                proposalNumber: proposal.proposalNumber,
                daysWaiting: calculateBusinessDays(new Date(proposal.dateDigitized)),
            }).then(response => ({
                proposalId: proposal.id,
                proposalNumber: proposal.proposalNumber,
                customerName: proposal.customer!.name,
                reminderMessage: response.reminderMessage,
            }))
            );
            const results = await Promise.all(reminderPromises);
            setReminders(results);
        } catch (error) {
            console.error("Error fetching debt balance reminders:", error);
            setReminders([]); // Clear on error
        }
      } else {
        setReminders([]); // No proposals, so no reminders
      }
      setIsGenerating(false);
    }
    fetchReminders();
  }, [isLoading, JSON.stringify(proposalsAwaitingBalance)]);

  const handleDismiss = (proposalId: string) => {
    const newDismissed = [...dismissedReminders, proposalId];
    setDismissedReminders(newDismissed);
    try {
        localStorage.setItem(DISMISS_STORAGE_KEY, JSON.stringify(newDismissed));
    } catch (error) {
        console.error("Failed to save dismissed alerts to localStorage", error);
    }
  };

  const visibleReminders = isClient ? reminders.filter(r => !dismissedReminders.includes(r.proposalId)) : [];
  const showLoadingState = isLoading || isGenerating;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline">Alerta de Saldo Devedor</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {showLoadingState ? (
          <div className="space-y-4">
             <div className="p-4 border rounded-lg">
                <Skeleton className="h-5 w-3/4 mb-2" />
                <Skeleton className="h-4 w-full" />
              </div>
          </div>
        ) : isClient && visibleReminders.length > 0 ? (
          visibleReminders.map((reminder) => (
            <DebtBalanceReminderItem key={reminder.proposalId} reminder={reminder} onDismiss={handleDismiss} />
          ))
        ) : (
          <div className="flex flex-col items-center justify-center text-center text-muted-foreground p-4">
             <Info className="h-8 w-8 mb-2" />
            <p>Nenhuma portabilidade com prazo de saldo vencendo.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
