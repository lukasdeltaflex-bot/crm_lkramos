
'use client';

import { getProposalsWithCustomerData } from '@/lib/data';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Clock, Info } from 'lucide-react';
import { followUpReminder } from '@/ai/flows/follow-up-reminder';
import { useEffect, useState } from 'react';
import { Skeleton } from '../ui/skeleton';
import { differenceInDays } from 'date-fns';

type ReminderMessage = {
  proposalNumber: string;
  customerName: string;
  reminderMessage: string;
};

function FollowUpReminderItem({ reminder }: { reminder: ReminderMessage }) {
  return (
    <Alert>
      <Clock className="h-4 w-4" />
      <AlertTitle>{reminder.customerName} (Proposta: {reminder.proposalNumber})</AlertTitle>
      <AlertDescription>{reminder.reminderMessage}</AlertDescription>
    </Alert>
  );
}

export function FollowUpReminders() {
  const [reminders, setReminders] = useState<ReminderMessage[]>([]);
  const [loading, setLoading] = useState(true);

  const proposalsWithCustomer = getProposalsWithCustomerData();

  const longRunningProposals = proposalsWithCustomer.filter(p => 
    p.status === 'Em Andamento' && differenceInDays(new Date(), new Date(p.dateDigitized)) > 20
  );

  useEffect(() => {
    async function fetchReminders() {
      if (longRunningProposals.length > 0) {
        const reminderPromises = longRunningProposals.map(proposal => 
          followUpReminder({
            customerName: proposal.customer.name,
            proposalNumber: proposal.proposalNumber,
            daysOpen: differenceInDays(new Date(), new Date(proposal.dateDigitized)),
          }).then(response => ({
            proposalNumber: proposal.proposalNumber,
            customerName: proposal.customer.name,
            reminderMessage: response.reminderMessage,
          }))
        );
        const results = await Promise.all(reminderPromises);
        setReminders(results);
      }
      setLoading(false);
    }
    fetchReminders();
  }, []); // Dependency array is empty, but the data is filtered on each render.

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline">Lembretes de Acompanhamento</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <div className="space-y-4">
             {longRunningProposals.map(p => (
              <div key={p.id} className="p-4 border rounded-lg">
                <Skeleton className="h-5 w-3/4 mb-2" />
                <Skeleton className="h-4 w-full" />
              </div>
            ))}
          </div>
        ) : reminders.length > 0 ? (
          reminders.map((reminder) => (
            <FollowUpReminderItem key={reminder.proposalNumber} reminder={reminder} />
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
