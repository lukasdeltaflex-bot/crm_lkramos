'use server';

/**
 * @fileOverview Define um fluxo Genkit para gerar alertas para comissões pendentes.
 *
 * - commissionReminder - A função para gerar o lembrete de comissão.
 * - CommissionReminderInput - O tipo de entrada para a função.
 * - CommissionReminderOutput - O tipo de saída para a função.
 */

import { ai } from '@/ai/genkit';
import {z} from 'genkit';

const CommissionReminderInputSchema = z.object({
  customerName: z.string().describe('O nome do cliente.'),
  proposalNumber: z.string().describe('O número de identificação da proposta.'),
  daysPending: z.number().describe('O número de dias desde que a proposta foi paga ao cliente e a comissão continua pendente.'),
});
export type CommissionReminderInput = z.infer<typeof CommissionReminderInputSchema>;

const CommissionReminderOutputSchema = z.object({
  reminderMessage: z.string().describe('A mensagem de alerta para o agente de crédito.'),
});
export type CommissionReminderOutput = z.infer<typeof CommissionReminderOutputSchema>;

export async function commissionReminder(input: CommissionReminderInput): Promise<CommissionReminderOutput> {
  return commissionReminderFlow(input);
}

const prompt = ai.definePrompt({
    name: 'commissionReminderPrompt',
    input: { schema: CommissionReminderInputSchema },
    output: { schema: CommissionReminderOutputSchema },
    prompt: `Gere um lembrete conciso para um agente de crédito. A comissão da proposta nº {{{proposalNumber}}} para o cliente {{{customerName}}} está pendente há {{{daysPending}}} dias desde que a proposta foi paga. A mensagem deve sugerir uma verificação do pagamento junto à promotora/banco. A saída deve ser em português do Brasil.`
});

const commissionReminderFlow = ai.defineFlow(
    {
        name: 'commissionReminderFlow',
        inputSchema: CommissionReminderInputSchema,
        outputSchema: CommissionReminderOutputSchema,
    },
    async (input) => {
        const { output } = await prompt(input);
        return output!;
    }
);
