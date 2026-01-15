'use client';

import React, { useState } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Sparkles, Loader2, AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
    reconcileCommissions,
    type ReconcileCommissionsOutput,
} from '@/ai/flows/reconcile-commissions-flow';
import type { Proposal, Customer } from '@/lib/types';
import { setDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { doc } from 'firebase/firestore';
import { useFirestore } from '@/firebase';
import { ScrollArea } from '../ui/scroll-area';
import { Separator } from '../ui/separator';
import { formatCurrency } from '@/lib/utils';
import { Badge } from '../ui/badge';

type ProposalWithCustomer = Proposal & { customer?: Customer };

interface CommissionReconciliationProps {
  proposals: ProposalWithCustomer[];
  onFinished: () => void;
}

type ReconciliationResult = {
  status: 'matched' | 'discrepancy' | 'unmatched';
  reportCpf: string;
  reportAmount: number;
  proposal?: ProposalWithCustomer;
  message: string;
};

export function CommissionReconciliation({ proposals, onFinished }: CommissionReconciliationProps) {
  const [text, setText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<ReconciliationResult[]>([]);
  const firestore = useFirestore();

  const handleExtractAndReconcile = async () => {
    if (!text.trim()) {
      toast({
        variant: 'destructive',
        title: 'Texto vazio',
        description: 'Por favor, cole as informações do relatório na área de texto.',
      });
      return;
    }
    setIsLoading(true);
    setResults([]);
    try {
      const extractedData = await reconcileCommissions(text);
      
      const reconciliationResults: ReconciliationResult[] = [];
      const proposalsMap = new Map(proposals.map(p => [p.customer?.cpf, p]));

      for (const item of extractedData.commissions) {
        const matchingProposal = proposalsMap.get(item.customerCpf.replace(/\D/g, ''));
        
        if (matchingProposal) {
          if (Math.abs(matchingProposal.commissionValue - item.amountPaid) < 0.01) {
            reconciliationResults.push({
              status: 'matched',
              reportCpf: item.customerCpf,
              reportAmount: item.amountPaid,
              proposal: matchingProposal,
              message: 'Valor da comissão corresponde ao esperado.',
            });
          } else {
            reconciliationResults.push({
              status: 'discrepancy',
              reportCpf: item.customerCpf,
              reportAmount: item.amountPaid,
              proposal: matchingProposal,
              message: `Discrepância: esperado ${formatCurrency(matchingProposal.commissionValue)}, pago ${formatCurrency(item.amountPaid)}.`,
            });
          }
        } else {
          reconciliationResults.push({
            status: 'unmatched',
            reportCpf: item.customerCpf,
            reportAmount: item.amountPaid,
            message: 'Nenhuma proposta pendente encontrada para este CPF.',
          });
        }
      }
      
      setResults(reconciliationResults);
      toast({
        title: 'Dados Extraídos e Pré-conciliados!',
        description: 'Revise os resultados da conciliação abaixo.',
      });
    } catch (error) {
      console.error('Error reconciling commissions:', error);
      toast({
        variant: 'destructive',
        title: 'Erro ao analisar o relatório',
        description: 'Não foi possível processar o texto. Verifique o formato e tente novamente.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmReconciliation = () => {
    if (!firestore) return;
    
    const matchedItems = results.filter(r => r.status === 'matched');
    if (matchedItems.length === 0) {
      toast({ variant: 'destructive', title: 'Nenhuma Ação a ser Feita', description: 'Não há comissões correspondentes para confirmar.' });
      return;
    }

    matchedItems.forEach(item => {
        if (item.proposal) {
            const proposalRef = doc(firestore, 'loanProposals', item.proposal.id);
            setDocumentNonBlocking(proposalRef, {
                commissionStatus: 'Paga',
                amountPaid: item.reportAmount,
                commissionPaymentDate: new Date().toISOString(),
            }, { merge: true });
        }
    });

    toast({
        title: 'Comissões Atualizadas!',
        description: `${matchedItems.length} proposta(s) foram atualizadas para "Paga".`,
    });
    onFinished();
  };

  const getStatusBadge = (status: ReconciliationResult['status']) => {
    switch (status) {
        case 'matched': return <Badge variant="default" className="bg-green-500">Correspondente</Badge>;
        case 'discrepancy': return <Badge variant="destructive">Discrepância</Badge>;
        case 'unmatched': return <Badge variant="secondary">Não Encontrado</Badge>;
    }
  }


  return (
    <div className="space-y-4 py-4">
      <Alert>
        <AlertDescription>
          Cole o conteúdo do seu relatório de pagamento de comissões (pode ser de um PDF, Excel, etc.). A IA irá extrair os dados e compará-los com as propostas pendentes no sistema.
        </AlertDescription>
      </Alert>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
            <h3 className="font-medium mb-2">1. Cole o texto do relatório</h3>
            <Textarea
                placeholder="Ex: Cliente: JOÃO DA SILVA, CPF: 123.456.789-00, Contrato: 98765, Valor Pago: R$ 1.500,00..."
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={15}
                disabled={isLoading}
            />
        </div>
        <div className="flex flex-col">
            <h3 className="font-medium mb-2">2. Resultados da Conciliação</h3>
            <ScrollArea className="flex-grow border rounded-md p-4 bg-muted/30">
                {isLoading && <div className="flex items-center justify-center h-full"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground"/></div>}
                {!isLoading && results.length === 0 && <p className="text-sm text-muted-foreground text-center pt-10">Aguardando análise do relatório...</p>}
                <div className="space-y-3">
                    {results.map((res, index) => (
                        <div key={index} className="p-3 rounded-md bg-background border">
                           <div className="flex items-center justify-between mb-2">
                                <p className="font-semibold text-sm">{res.proposal?.customer?.name || `CPF: ${res.reportCpf}`}</p>
                                {getStatusBadge(res.status)}
                           </div>
                           <p className="text-sm text-muted-foreground">{res.message}</p>
                        </div>
                    ))}
                </div>
            </ScrollArea>
        </div>
      </div>

      <div className="flex justify-between items-center pt-4">
        <Button onClick={handleExtractAndReconcile} disabled={isLoading}>
          {isLoading ? (
            <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Analisando...</>
          ) : (
            <><Sparkles className="mr-2 h-4 w-4" /> Analisar Relatório</>
          )}
        </Button>
        {results.length > 0 && (
             <div className="flex items-center gap-4">
                 <p className="text-sm text-muted-foreground">
                    {results.filter(r => r.status === 'matched').length} comissões prontas para baixar.
                 </p>
                <Button onClick={handleConfirmReconciliation}>
                    Confirmar e Baixar Comissões Pagas
                </Button>
            </div>
        )}
      </div>
    </div>
  );
}
