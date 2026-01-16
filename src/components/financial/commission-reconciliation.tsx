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
import { doc, setDoc } from 'firebase/firestore';
import { useFirestore } from '@/firebase';
import { ScrollArea } from '../ui/scroll-area';
import { Separator } from '../ui/separator';
import { formatCurrency } from '@/lib/utils';
import { Badge } from '../ui/badge';
import { DialogFooter, DialogClose } from '../ui/dialog';

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
      const proposalsMap = new Map<string, ProposalWithCustomer>();
      // Use proposalNumber as a more reliable key if CPFs can have multiple proposals
      proposals.forEach(p => {
        if(p.customer?.cpf) {
            // This is a simplification; a real scenario might need to handle multiple proposals per CPF
            proposalsMap.set(p.customer.cpf.replace(/\D/g, ''), p);
        }
      });


      for (const item of extractedData.commissions) {
        const cpfKey = item.customerCpf.replace(/\D/g, '');
        const matchingProposal = proposalsMap.get(cpfKey);
        
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

  const handleConfirmReconciliation = async () => {
    if (!firestore) return;
    
    const matchedItems = results.filter(r => r.status === 'matched');
    if (matchedItems.length === 0) {
      toast({ variant: 'destructive', title: 'Nenhuma Ação a ser Feita', description: 'Não há comissões correspondentes para confirmar.' });
      return;
    }

    const updatePromises = matchedItems.map(item => {
        if (item.proposal) {
            const proposalRef = doc(firestore, 'loanProposals', item.proposal.id);
            return setDoc(proposalRef, {
                commissionStatus: 'Paga',
                amountPaid: item.reportAmount,
                commissionPaymentDate: new Date().toISOString(),
            }, { merge: true });
        }
        return Promise.resolve();
    });

    try {
        await Promise.all(updatePromises);
        toast({
            title: 'Comissões Atualizadas!',
            description: `${matchedItems.length} proposta(s) foram atualizadas para "Paga".`,
        });
        onFinished();
    } catch (error) {
        console.error("Error updating commissions:", error);
        toast({
            variant: "destructive",
            title: "Erro ao Atualizar",
            description: "Não foi possível atualizar as comissões. Tente novamente."
        });
    }
  };

  const getStatusBadge = (status: ReconciliationResult['status']) => {
    switch (status) {
        case 'matched': return <Badge variant="default" className="bg-green-500">Correspondente</Badge>;
        case 'discrepancy': return <Badge variant="destructive">Discrepância</Badge>;
        case 'unmatched': return <Badge variant="secondary">Não Encontrado</Badge>;
    }
  }


  return (
    <>
      <ScrollArea className="max-h-[calc(80vh-10rem)]">
        <div className="space-y-4 py-4 pr-6">
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
                    <div className="h-full min-h-96 border rounded-md p-4 bg-muted/30 relative">
                        {isLoading && <div className="absolute inset-0 flex items-center justify-center bg-background/50"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground"/></div>}
                        {!isLoading && results.length === 0 && <p className="text-sm text-muted-foreground text-center pt-10">Aguardando análise do relatório...</p>}
                        <ScrollArea className="h-96">
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
            </div>
        </div>
      </ScrollArea>
      
      <DialogFooter className="pt-6 sm:justify-between">
         <DialogClose asChild>
            <Button variant="outline">Fechar</Button>
         </DialogClose>
        <div className="flex items-center justify-end gap-2">
            <Button onClick={handleExtractAndReconcile} disabled={isLoading} variant="secondary">
            {isLoading ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Analisando...</>
            ) : (
                <><Sparkles className="mr-2 h-4 w-4" /> Analisar Relatório</>
            )}
            </Button>
            {results.length > 0 && results.some(r => r.status === 'matched') && (
                <Button onClick={handleConfirmReconciliation}>
                    Confirmar e Baixar Comissões
                </Button>
            )}
        </div>
      </DialogFooter>
    </>
  );
}
