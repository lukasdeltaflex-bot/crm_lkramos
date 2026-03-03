'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sparkles, Bot, Loader2 } from 'lucide-react';
import type { Customer, Proposal } from '@/lib/types';
import { toast } from '@/hooks/use-toast';
import { summarizeCustomerHistory } from '@/ai/flows/summarize-customer-history-flow';
import { Skeleton } from '../ui/skeleton';
import { cn, formatDateSafe } from '@/lib/utils';
import { ScrollArea } from '../ui/scroll-area';

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
            bank: p.bank,
            dateDigitized: formatDateSafe(p.dateDigitized),
            grossAmount: p.grossAmount || 0,
            netAmount: p.netAmount || 0,
            commissionValue: p.commissionValue || 0,
        }));

      const result = await summarizeCustomerHistory({
        customerName: customer.name,
        customerObservations: customer.observations || '',
        proposals: proposalSummary,
      });

      setSummary(result);
    } catch (error) {
      console.error('Error generating AI summary:', error);
      toast({
        variant: 'destructive',
        title: 'Erro na Inteligência Artificial',
        description: 'Verifique sua conexão e tente novamente.',
      });
    } finally {
      setIsSummarizing(false);
    }
  };

  const renderFormattedSummary = (text: string) => {
    return text.split('\n').map((line, index) => {
      const trimmedLine = line.trim();
      if (!trimmedLine) return <div key={index} className="h-2" />;

      const isListItem = trimmedLine.startsWith('* ') || trimmedLine.startsWith('- ') || /^\d+\./.test(trimmedLine);
      
      const parts = trimmedLine.split(/(\*\*.*?\*\*)/g);
      const content = parts.map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={i} className="font-black text-primary">{part.slice(2, -2)}</strong>;
        }
        return part;
      });

      return (
        <div 
            key={index} 
            className={cn(
                "text-xs leading-relaxed mb-1",
                isListItem ? "pl-4 relative before:content-['•'] before:absolute before:left-0 before:text-primary/40" : ""
            )}
        >
          {content}
        </div>
      );
    });
  };

  return (
    <Card className="border-primary/20 shadow-lg overflow-hidden bg-primary/[0.02]">
      <CardHeader className="flex flex-row items-center justify-between pb-4 bg-primary/5 border-b border-primary/10">
        <div className='space-y-1'>
            <CardTitle className="flex items-center gap-2 text-lg font-black uppercase text-primary">
                <Bot className="h-5 w-5" />
                Análise Estratégica IA
            </CardTitle>
            <CardDescription className="text-[10px] font-bold uppercase tracking-widest opacity-60">
                Insights sobre histórico e perfil do cliente
            </CardDescription>
        </div>
        <Button 
            onClick={handleGenerateSummary} 
            disabled={isSummarizing}
            className="rounded-full h-9 px-6 bg-primary font-black uppercase text-[10px] tracking-widest shadow-lg shadow-primary/20 transition-all border-none"
        >
          {isSummarizing ? (
            <><Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> Processando...</>
          ) : (
            <><Sparkles className="mr-2 h-3.5 w-3.5 fill-current" /> Gerar Consultoria</>
          )}
        </Button>
      </CardHeader>
      
      {(isSummarizing || summary) && (
        <CardContent className="pt-6">
          {isSummarizing ? (
             <div className="space-y-3 p-4 border-2 border-dashed rounded-2xl bg-background/50">
                <Skeleton className="h-3 w-1/3 bg-primary/10" />
                <Skeleton className="h-3 w-full bg-primary/5" />
                <Skeleton className="h-3 w-full bg-primary/5" />
                <Skeleton className="h-3 w-4/5 bg-primary/5" />
             </div>
          ) : summary ? (
            <div className="p-6 bg-white dark:bg-zinc-950 rounded-2xl border-2 border-primary/10 shadow-inner relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-primary/20" />
                <ScrollArea className="h-full max-h-[300px]">
                    <div className="space-y-1 pr-4">
                        {renderFormattedSummary(summary)}
                    </div>
                </ScrollArea>
            </div>
          ) : null}
        </CardContent>
      )}
      {!summary && !isSummarizing && (
          <div className="p-8 text-center">
              <p className="text-[10px] font-black uppercase text-muted-foreground tracking-[0.2em] opacity-40">Aguardando comando de análise estratégica</p>
          </div>
      )}
    </Card>
  );
}
