'use server';
/**
 * @fileOverview Fluxo de IA para extrair e conciliar dados de comissões de relatórios.
 *
 * - reconcileCommissions - A função para chamar o fluxo de conciliação.
 * - ReconcileCommissionsInput - O tipo de entrada (texto do relatório).
 * - ReconcileCommissionsOutput - O tipo de saída (dados de comissão extraídos).
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const CommissionDataSchema = z.object({
  customerCpf: z.string().describe('O CPF do cliente associado à comissão.'),
  proposalIdentifier: z.string().optional().describe('Um número de contrato ou proposta, se disponível.'),
  amountPaid: z.number().describe('O valor da comissão que foi paga.'),
});

const ReconcileCommissionsOutputSchema = z.object({
  commissions: z.array(CommissionDataSchema).describe('Uma lista das comissões extraídas do relatório.'),
});
export type ReconcileCommissionsOutput = z.infer<typeof ReconcileCommissionsOutputSchema>;

export async function reconcileCommissions(reportText: string): Promise<ReconcileCommissionsOutput> {
  return reconcileCommissionsFlow(reportText);
}

const prompt = ai.definePrompt({
  name: 'reconcileCommissionsPrompt',
  input: { schema: z.string() },
  output: { schema: ReconcileCommissionsOutputSchema },
  prompt: `Você é um assistente financeiro especialista em processar relatórios de pagamento de comissões.
Sua tarefa é analisar o texto de um relatório de pagamento e extrair uma lista de todas as comissões pagas.

Para cada comissão, você deve extrair:
1.  **CPF do Cliente**: O CPF completo, formatado como '000.000.000-00'.
2.  **Identificador da Proposta**: Se houver um número de contrato, proposta ou referência, capture-o.
3.  **Valor Pago**: O valor numérico exato da comissão que foi paga.

Analise o texto a seguir e extraia todas as entradas de comissão que encontrar.

Texto do Relatório:
{{{input}}}

Gere a saída JSON estruturada com a lista de comissões.`,
});

const reconcileCommissionsFlow = ai.defineFlow(
  {
    name: 'reconcileCommissionsFlow',
    inputSchema: z.string(),
    outputSchema: ReconcileCommissionsOutputSchema,
  },
  async (input) => {
    if (!input || input.trim() === '') {
      throw new Error('O texto do relatório não pode estar vazio.');
    }
    const { output } = await prompt(input);
    return output!;
  }
);
