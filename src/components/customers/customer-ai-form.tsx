'use client';

import { useState } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Sparkles, Loader2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { extractCustomerData, type ExtractCustomerDataOutput } from '@/ai/flows/extract-customer-data-flow';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { Info } from 'lucide-react';

interface CustomerAiFormProps {
  onSubmit: (data: ExtractCustomerDataOutput) => void;
}

export function CustomerAiForm({ onSubmit }: CustomerAiFormProps) {
  const [text, setText] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleExtract = async () => {
    if (!text.trim()) {
      toast({
        variant: 'destructive',
        title: 'Texto vazio',
        description: 'Por favor, cole as informações do cliente na área de texto.',
      });
      return;
    }
    setIsLoading(true);
    try {
      const extractedData = await extractCustomerData(text);
      toast({
        title: 'Dados extraídos com sucesso!',
        description: 'Revise as informações no formulário de cadastro.',
      });
      onSubmit(extractedData);
    } catch (error) {
      console.error('Error extracting customer data:', error);
      toast({
        variant: 'destructive',
        title: 'Erro ao extrair dados',
        description: 'Não foi possível analisar o texto. Verifique o texto e tente novamente.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4 py-4">
        <Alert>
            <Info className="h-4 w-4" />
            <AlertTitle>Como usar</AlertTitle>
            <AlertDescription>
            Cole qualquer texto com as informações do cliente (de um e-mail, WhatsApp, etc.). A IA tentará extrair os dados e preencher o formulário para você.
            </AlertDescription>
        </Alert>

      <Textarea
        placeholder="Exemplo: O cliente João da Silva (CPF 123.456.789-00) mora na Rua das Flores, 123, São Paulo - SP..."
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={10}
        disabled={isLoading}
      />
      <div className="flex justify-end">
        <Button onClick={handleExtract} disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Analisando...
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-4 w-4" />
              Analisar e Preencher Formulário
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
