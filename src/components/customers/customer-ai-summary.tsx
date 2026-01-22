'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sparkles, Bot, Loader2 } from 'lucide-react';
import type { Customer, Proposal } from '@/lib/types';
import { toast } from '@/hooks/use-toast';
import { summarizeCustomerHistory } from '@/ai/flows/summarize-customer-history-flow';
import { Skeleton } from '../ui/skeleton';

interface CustomerAiSummaryProps {
  customer: Customer;
  proposals: Proposal[];
}

export function CustomerAiSummary({ customer, proposals }: CustomerAiSummaryProps) {
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [summary, setSummary] = useState<string | null>(null);

  const handleGenerateSummary = async () => {
    setIsSummarizing(true);
    setSummary(null);

    try {
        const proposalSummary = proposals.map(p => ({
            product: p.product,
            status: p.status,
            grossAmount: p.grossAmount,
            netAmount: p.netAmount,
            commissionValue: p.commissionValue,
        }));

      const result = await summarizeCustomerHistory({
        customerName: customer.name,
        customerObservations: customer.observations,
        proposals: proposalSummary,
      });

      setSummary(result);
    } catch (error) {
      console.error('Error generating AI summary:', error);
      toast({
        variant: 'destructive',
        title: 'Erro ao gerar resumo',
        description: 'Não foi possível se conectar à IA. Tente novamente mais tarde.',
      });
    } finally {
      setIsSummarizing(false);
    }
  };

  const renderFormattedSummary = (text: string) => {
    // Basic markdown-like formatting for bullet points
    return text.split('\n').map((line, index) => {
      if (line.startsWith('* ') || line.startsWith('- ')) {
        return <li key={index} className="ml-4">{line.substring(2)}</li>;
      }
      if (line.trim() === '') {
        return <br key={index} />;
      }
       // Simple bold formatting
       const parts = line.split(/(\*\*.*?\*\*)/g);
       return (
         <p key={index}>
           {parts.map((part, i) =>
             part.startsWith('**') && part.endsWith('**') ? (
               <strong key={i}>{part.slice(2, -2)}</strong>
             ) : (
               part
             )
           )}
         </p>
       );
    });
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div className='space-y-1.5'>
            <CardTitle className="flex items-center gap-2">
                <Bot />
                Análise Estratégica com IA
            </CardTitle>
            <CardDescription>
                Clique no botão para gerar um resumo do histórico e perfil do cliente.
            </CardDescription>
        </div>
        <Button onClick={handleGenerateSummary} disabled={isSummarizing}>
          {isSummarizing ? (
            <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> <span>Gerando...</span></>
          ) : (
            <><Sparkles className="mr-2 h-4 w-4" /> <span>Gerar Análise</span></>
          )}
        </Button>
      </CardHeader>
      {(isSummarizing || summary) && (
        <CardContent>
          {isSummarizing ? (
             <div className="space-y-2 rounded-md border border-dashed p-4">
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-4/5" />
             </div>
          ) : summary ? (
            <div className="prose prose-sm max-w-none text-foreground bg-secondary/30 p-4 rounded-md">
              <ul className='list-disc space-y-2'>
                {renderFormattedSummary(summary)}
              </ul>
            </div>
          ) : null}
        </CardContent>
      )}
    </Card>
  );
}
