'use client';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { BellRing, UserCheck, X } from 'lucide-react';
import { customerBirthdayAlert } from '@/ai/flows/customer-birthday-alert';
import { useEffect, useState, useMemo } from 'react';
import { Skeleton } from '../ui/skeleton';
import type { Customer } from '@/lib/types';
import { getAge } from '@/lib/utils';
import { Button } from '../ui/button';

type AlertMessage = {
  customerId: string;
  customerName: string;
  alertMessage: string;
};

interface BirthdayAlertsProps {
  customers: Customer[];
  isLoading: boolean;
}

const DISMISS_STORAGE_KEY = 'dismissed-birthday-alerts-v1';

function BirthdayAlertItem({ alert, onDismiss }: { alert: AlertMessage; onDismiss: (id: string) => void }) {
  return (
    <Alert variant="warning">
      <BellRing className="h-4 w-4" />
      <AlertTitle>{alert.customerName}</AlertTitle>
      <AlertDescription>{alert.alertMessage}</AlertDescription>
      <button 
        onClick={() => onDismiss(alert.customerId)} 
        className="absolute top-2 right-2 p-1 text-muted-foreground/80 hover:text-foreground rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        aria-label="Dispensar alerta"
      >
        <X className="h-4 w-4" />
      </button>
    </Alert>
  );
}

export function BirthdayAlerts({ customers, isLoading }: BirthdayAlertsProps) {
  const [alerts, setAlerts] = useState<AlertMessage[]>([]);
  const [dismissedAlerts, setDismissedAlerts] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(true);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    try {
      const storedDismissed = localStorage.getItem(DISMISS_STORAGE_KEY);
      if (storedDismissed) {
        setDismissedAlerts(JSON.parse(storedDismissed));
      }
    } catch (error) {
      console.error("Failed to parse dismissed alerts from localStorage", error);
      localStorage.removeItem(DISMISS_STORAGE_KEY);
    }
  }, []);

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

  const handleDismiss = (customerId: string) => {
    const newDismissed = [...dismissedAlerts, customerId];
    setDismissedAlerts(newDismissed);
    try {
        localStorage.setItem(DISMISS_STORAGE_KEY, JSON.stringify(newDismissed));
    } catch (error) {
        console.error("Failed to save dismissed alerts to localStorage", error);
    }
  };

  const visibleAlerts = isClient ? alerts.filter(alert => !dismissedAlerts.includes(alert.customerId)) : [];
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
        ) : isClient && visibleAlerts.length > 0 ? (
          visibleAlerts.map((alert) => (
            <BirthdayAlertItem key={alert.customerId} alert={alert} onDismiss={handleDismiss} />
          ))
        ) : (
          <div className="flex flex-col items-center justify-center text-center text-muted-foreground p-4">
             <UserCheck className="h-8 w-8 mb-2" />
            <p>Nenhum alerta de aniversário no momento.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
