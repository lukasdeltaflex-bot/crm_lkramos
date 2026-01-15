'use client';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { BadgePercent, Info } from 'lucide-react';
import { commissionReminder } from '@/ai/flows/commission-reminder-flow';
import { useEffect, useState, useMemo } from 'react';
import { Skeleton } from '../ui/skeleton';
import { differenceInDays } from 'date-fns';
import type { Proposal, Customer } from '@/lib/types';

type ReminderMessage = {
  proposalNumber: string;
  customerName: string;
  reminderMessage: string;
};

interface CommissionRemindersProps {
    proposals: Proposal[];
    customers: Customer[];
    isLoading: boolean;
}

function CommissionReminderItem({ reminder }: { reminder: ReminderMessage }) {
  return (
    <Alert variant="destructive">
      <BadgePercent className="h-4 w-4" />
      <AlertTitle>{reminder.customerName} (Proposta: {reminder.proposalNumber})</AlertTitle>
      <AlertDescription>{reminder.reminderMessage}</AlertDescription>
    </Alert>
  );
}

export function CommissionReminders({ proposals, customers, isLoading }: CommissionRemindersProps) {
  const [reminders, setReminders] = useState<ReminderMessage[]>([]);
  const [isGenerating, setIsGenerating] = useState(true);

  const pendingCommissions = useMemo(() => {
    const customerMap = new Map(customers.map(c => [c.id, c]));
    return proposals
      .filter(p => 
        (p.status === 'Pago' || p.status === 'Saldo Pago') && 
        p.commissionStatus === 'Pendente' &&
        p.datePaidToClient && 
        differenceInDays(new Date(), new Date(p.datePaidToClient)) > 7
      )
      .map(p => ({...p, customer: customerMap.get(p.customerId)}))
      .filter(p => p.customer);
  }, [proposals, customers]);

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
                proposalNumber: proposal.proposalNumber,
                customerName: proposal.customer!.name,
                reminderMessage: response.reminderMessage,
            }))
            );
            const results = await Promise.all(reminderPromises);
            setReminders(results);
        } catch (error) {
            console.error("Error fetching commission reminders:", error);
        }
      }
      setIsGenerating(false);
    }
    fetchReminders();
  }, [isLoading, JSON.stringify(pendingCommissions)]);

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
        ) : reminders.length > 0 ? (
          reminders.map((reminder) => (
            <CommissionReminderItem key={reminder.proposalNumber} reminder={reminder} />
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
