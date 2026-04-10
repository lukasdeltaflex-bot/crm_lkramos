'use client';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { BadgePercent, Info, X } from 'lucide-react';
import { commissionReminder } from '@/ai/flows/commission-reminder-flow';
import { useEffect, useState, useMemo } from 'react';
import { Skeleton } from '../ui/skeleton';
import { differenceInDays } from 'date-fns';
import { useUser, useFirestore, useDoc } from '@/firebase';
import { doc } from 'firebase/firestore';
import { normalizeStatuses, getStatusBehavior } from '@/lib/utils';
import type { Proposal, Customer, UserSettings } from '@/lib/types';

type ReminderMessage = {
  proposalId: string;
  proposalNumber: string;
  customerName: string;
  reminderMessage: string;
};

interface CommissionRemindersProps {
    proposals: Proposal[];
    customers: Customer[];
    isLoading: boolean;
}

const DISMISS_STORAGE_KEY = 'dismissed-commission-reminders-v1';

function CommissionReminderItem({ reminder, onDismiss }: { reminder: ReminderMessage; onDismiss: (id: string) => void }) {
  return (
    <Alert variant="destructive">
      <BadgePercent className="h-4 w-4" />
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

export function CommissionReminders({ proposals, customers, isLoading }: CommissionRemindersProps) {
  const { user } = useUser();
  const firestore = useFirestore();
  const [reminders, setReminders] = useState<ReminderMessage[]>([]);
  const [dismissedReminders, setDismissedReminders] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(true);
  const [isClient, setIsClient] = useState(false);

  const settingsDocRef = useMemo(() => {
    if (!user || !firestore) return null;
    return doc(firestore, 'userSettings', user.uid);
  }, [firestore, user]);

  const { data: userSettings } = useDoc<UserSettings>(settingsDocRef as any);
  const activeConfigs = useMemo(() => normalizeStatuses(userSettings?.proposalStatuses || []), [userSettings]);

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

  const pendingCommissions = useMemo(() => {
    if (!customers || !proposals) return [];
    const customerMap = new Map(customers.map(c => [c.id, c]));
    return proposals
      .filter(p => {
        const behavior = getStatusBehavior(p.status, activeConfigs);
        return (
          behavior === 'success' && 
          p.commissionStatus === 'Pendente' &&
          p.datePaidToClient && 
          differenceInDays(new Date(), new Date(p.datePaidToClient)) > 7
        );
      })
      .map(p => ({...p, customer: customerMap.get(p.customerId)}))
      .filter(p => p.customer);
  }, [proposals, customers, activeConfigs]);

  useEffect(() => {
    async function fetchReminders() {
      if (isLoading) return;

      setIsGenerating(true);
      if (pendingCommissions.length > 0) {
        try {
            const reminderPromises = pendingCommissions.map(proposal => 
            commissionReminder({
                customerName: proposal.customer!.name,
                proposalNumber: proposal.proposalNumber,
                daysPending: differenceInDays(new Date(), new Date(proposal.datePaidToClient!)),
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
            console.error("Error fetching commission reminders:", error);
            setReminders([]);
        }
      } else {
        setReminders([]);
      }
      setIsGenerating(false);
    }
    fetchReminders();
  }, [isLoading, JSON.stringify(pendingCommissions)]);

  const handleDismiss = (proposalId: string) => {
    const newDismissed = [...dismissedReminders, proposalId];
    setDismissedReminders(newDismissed);
    try {
        localStorage.setItem(DISMISS_STORAGE_KEY, JSON.stringify(newDismissed));
    } catch (error) {
        console.error("Failed to save dismissed alerts to localStorage", error);
    }
  };
  
  const visibleReminders = isClient ? reminders.filter(reminder => !dismissedReminders.includes(reminder.proposalId)) : [];
  const showLoadingState = isLoading || isGenerating;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline">Alerta de Comissões Pendentes</CardTitle>
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
            <CommissionReminderItem key={reminder.proposalId} reminder={reminder} onDismiss={handleDismiss} />
          ))
        ) : (
          <div className="flex flex-col items-center justify-center text-center text-muted-foreground p-4">
             <Info className="h-8 w-8 mb-2" />
            <p>Nenhuma comissão pendente há mais de 7 dias.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
