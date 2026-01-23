'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Bot, Loader2, Send } from 'lucide-react';
import type { Customer, Proposal, UserProfile } from '@/lib/types';
import { toast } from '@/hooks/use-toast';
import { Skeleton } from '../ui/skeleton';
import { generateDailySummary, type GenerateDailySummaryInput } from '@/ai/flows/generate-daily-summary-flow';
import { differenceInDays } from 'date-fns';
import { calculateBusinessDays } from '@/lib/utils';

interface DailySummaryProps {
  proposals: Proposal[];
  customers: Customer[];
  userProfile: UserProfile | null;
}

export function DailySummary({ proposals, customers, userProfile }: DailySummaryProps) {
  const [isGenerating, setIsGenerating] = useState(true);
  const [summary, setSummary] = useState<string | null>(null);

  // Memoize alert calculations
  const alertData = useMemo(() => {
    const getAge = (birthDate: string) => {
        const today = new Date();
        const birth = new Date(birthDate);
        let age = today.getFullYear() - birth.getFullYear();
        const m = today.getMonth() - birth.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
          age--;
        }
        return age;
      };

    const birthdayAlerts = customers
        .filter(c => getAge(c.birthDate) >= 74)
        .map(c => ({ customerName: c.name, age: 75 }));

    const customerMap = new Map(customers.map(c => [c.id, c]));

    const followUpReminders = proposals
      .filter(p => p.status === 'Em Andamento' && differenceInDays(new Date(), new Date(p.dateDigitized)) > 20)
      .map(p => ({
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
            customerName: customerMap.get(p.customerId)?.name || 'Cliente Desconhecido',
            proposalNumber: p.proposalNumber,
            amountPaid: p.amountPaid,
            totalCommission: p.commissionValue,
            daysSincePayment: differenceInDays(new Date(), new Date(p.commissionPaymentDate!)),
        }));

    return { birthdayAlerts, followUpReminders, commissionReminders, debtBalanceReminders, partialCommissionReminders };
  }, [proposals, customers]);

  useEffect(() => {
    const generateSummary = async () => {
        setIsGenerating(true);
        setSummary(null);

        const input: GenerateDailySummaryInput = {
            userName: userProfile?.displayName || userProfile?.email || 'Agente',
            ...alertData
        };

        try {
            const result = await generateDailySummary(input);
            setSummary(result);
        } catch (error) {
            console.error('Error generating daily summary:', error);
            toast({
            variant: 'destructive',
            title: 'Erro ao gerar resumo',
            description: 'Não foi possível se conectar à IA. Tente novamente mais tarde.',
            });
        } finally {
            setIsGenerating(false);
        }
    }
    generateSummary();
  }, [alertData, userProfile]);

  const renderFormattedSummary = (text: string) => {
    // Basic markdown-like formatting for titles and bullet points
    return text.split('\n').map((line, index) => {
      if (line.startsWith('### ')) {
        return <h3 key={index} className="font-semibold text-lg mt-4 mb-2">{line.substring(4)}</h3>;
      }
      if (line.startsWith('- ')) {
        const parts = line.substring(2).split(/(\*\*.*?\*\*)/g);
        return (
            <li key={index} className="ml-4">
              {parts.map((part, i) =>
                part.startsWith('**') && part.endsWith('**') ? (
                  <strong key={i}>{part.slice(2, -2)}</strong>
                ) : (
                  part
                )
              )}
            </li>
          );
      }
      if (line.trim() === '') {
        return <br key={index} />;
      }
       return <p key={index}>{line}</p>;
    });
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div className='space-y-1.5'>
            <CardTitle className="flex items-center gap-2">
                <Bot />
                Resumo Diário de Pendências
            </CardTitle>
            <CardDescription>
                Um resumo de todos os alertas e pendências gerado por IA para facilitar seu dia.
            </CardDescription>
        </div>
        <Button disabled={true}>
            <Send className="mr-2 h-4 w-4" />
            Enviar E-mail de Resumo
        </Button>
      </CardHeader>
      <CardContent>
          {isGenerating ? (
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
          ) : summary ? (
            <div className="prose prose-sm max-w-none text-foreground border bg-card p-6 rounded-lg shadow-sm">
              <ul className='list-disc space-y-2'>
                {renderFormattedSummary(summary)}
              </ul>
            </div>
          ) : null}
        </CardContent>
    </Card>
  );
}
