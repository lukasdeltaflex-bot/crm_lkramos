'use client';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { BellRing, UserCheck } from 'lucide-react';
import { customerBirthdayAlert } from '@/ai/flows/customer-birthday-alert';
import { useEffect, useState, useMemo } from 'react';
import { Skeleton } from '../ui/skeleton';
import type { Customer } from '@/lib/types';
import { getAge } from '@/lib/utils';

type AlertMessage = {
  customerId: string;
  customerName: string;
  alertMessage: string;
};

interface BirthdayAlertsProps {
  customers: Customer[];
  isLoading: boolean;
}

function BirthdayAlertItem({ alert }: { alert: AlertMessage }) {
  return (
    <Alert>
      <BellRing className="h-4 w-4" />
      <AlertTitle>{alert.customerName}</AlertTitle>
      <AlertDescription>{alert.alertMessage}</AlertDescription>
    </Alert>
  );
}

export function BirthdayAlerts({ customers, isLoading }: BirthdayAlertsProps) {
  const [alerts, setAlerts] = useState<AlertMessage[]>([]);
  const [isGenerating, setIsGenerating] = useState(true);

  const upcoming75 = useMemo(() => {
    if (!customers) return [];
    return customers.filter(c => getAge(c.birthDate) >= 74);
  }, [customers]);

  useEffect(() => {
    async function fetchAlerts() {
      if (isLoading) return;
      
      setIsGenerating(true);
      if (upcoming75.length > 0) {
        try {
          const alertPromises = upcoming75.map(customer => 
            customerBirthdayAlert({
              customerName: customer.name,
              customerAge: 75,
            }).then(response => ({
              customerId: customer.id,
              customerName: customer.name,
              alertMessage: response.alertMessage,
            }))
          );
          const results = await Promise.all(alertPromises);
          setAlerts(results);
        } catch (error) {
          console.error("Error fetching birthday alerts:", error);
          setAlerts([]);
        }
      } else {
        setAlerts([]);
      }
      setIsGenerating(false);
    }
    fetchAlerts();
  }, [isLoading, upcoming75]);

  const showLoadingState = isLoading || isGenerating;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline">Alertas de Aniversário (75 anos)</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {showLoadingState ? (
          <div className="space-y-4">
            <div className="p-4 border rounded-lg">
                <Skeleton className="h-5 w-24 mb-2" />
                <Skeleton className="h-4 w-full" />
            </div>
          </div>
        ) : alerts.length > 0 ? (
          alerts.map((alert) => (
            <BirthdayAlertItem key={alert.customerId} alert={alert} />
          ))
        ) : (
          <div className="flex flex-col items-center justify-center text-center text-muted-foreground p-4">
             <UserCheck className="h-8 w-8 mb-2" />
            <p>Nenhum cliente próximo dos 75 anos.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
