'use client';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Clock, Info, X } from 'lucide-react';
import { followUpReminder } from '@/ai/flows/follow-up-reminder';
import { useEffect, useState } from 'react';
import { Skeleton } from '../ui/skeleton';
import { differenceInDays } from 'date-fns';
import type { Proposal, Customer } from '@/lib/types';
import { useMemo } from 'react';

type ReminderMessage = {
  proposalId: string;
  proposalNumber: string;
  customerName: string;
  reminderMessage: string;
};

interface FollowUpRemindersProps {
    proposals: Proposal[];
    customers: Customer[];
    isLoading: boolean;
}

function FollowUpReminderItem({ reminder, onDismiss }: { reminder: ReminderMessage; onDismiss: (id: string) => void }) {
  return (
    <Alert variant="warning">
      <Clock className="h-4 w-4" />
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

export function FollowUpReminders({ proposals, customers, isLoading }: FollowUpRemindersProps) {
  const [reminders, setReminders] = useState<ReminderMessage[]>([]);
  const [dismissedReminders, setDismissedReminders] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(true);

  const longRunningProposals = useMemo(() => {
    if (!customers || !proposals) return [];
    const customerMap = new Map(customers.map(c => [c.id, c]));
    return proposals
      .filter(p => p.status === 'Em Andamento' && differenceInDays(new Date(), new Date(p.dateDigitized)) > 20)
      .map(p => ({...p, customer: customerMap.get(p.customerId)}))
      .filter(p => p.customer); // Ensure customer exists
  }, [proposals, customers]);

  useEffect(() => {
    async function fetchReminders() {
      if (isLoading) return;

      setIsGenerating(true);
      if (longRunningProposals.length > 0) {
        try {
            const reminderPromises = longRunningProposals.map(proposal => 
            followUpReminder({
                customerName: proposal.customer!.name,
                proposalNumber: proposal.proposalNumber,
                daysOpen: differenceInDays(new Date(), new Date(proposal.dateDigitized)),
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
            console.error("Error fetching follow-up reminders:", error);
            setReminders([]);
        }
      } else {
        setReminders([]);
      }
      setIsGenerating(false);
    }
    fetchReminders();
  }, [isLoading, JSON.stringify(longRunningProposals)]);
  
  const handleDismiss = (proposalId: string) => {
    setDismissedReminders(prev => [...prev, proposalId]);
  };

  const visibleReminders = reminders.filter(r => !dismissedReminders.includes(r.proposalId));
  const showLoadingState = isLoading || isGenerating;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline">Lembretes de Acompanhamento</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {showLoadingState ? (
          <div className="space-y-4">
             <div className="p-4 border rounded-lg">
                <Skeleton className="h-5 w-3/4 mb-2" />
                <Skeleton className="h-4 w-full" />
              </div>
          </div>
        ) : visibleReminders.length > 0 ? (
          visibleReminders.map((reminder) => (
            <FollowUpReminderItem key={reminder.proposalId} reminder={reminder} onDismiss={handleDismiss} />
          ))
        ) : (
          <div className="flex flex-col items-center justify-center text-center text-muted-foreground p-4">
             <Info className="h-8 w-8 mb-2" />
            <p>Nenhuma proposta precisando de acompanhamento.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
