'use server';

/**
 * @fileOverview Fluxo Genkit para gerar mensagens de aniversário personalizadas.
 *
 * - generateBirthdayMessage - Função para chamar o fluxo.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const BirthdayMessageInputSchema = z.object({
  customerName: z.string().describe('O nome do cliente aniversariante.'),
});
export type BirthdayMessageInput = z.infer<typeof BirthdayMessageInputSchema>;

const BirthdayMessageOutputSchema = z.object({
  message: z.string().describe('A mensagem de parabéns gerada pela IA.'),
});
export type BirthdayMessageOutput = z.infer<typeof BirthdayMessageOutputSchema>;

export async function generateBirthdayMessage(input: BirthdayMessageInput): Promise<BirthdayMessageOutput> {
  return generateBirthdayMessageFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateBirthdayMessagePrompt',
  model: 'googleai/gemini-1.5-flash',
  input: { schema: BirthdayMessageInputSchema },
  output: { schema: BirthdayMessageOutputSchema },
  prompt: `Você é um assistente de relacionamento de um correspondente bancário de elite chamado LK RAMOS.
Sua tarefa é gerar uma mensagem de aniversário para o cliente {{{customerName}}}.

REGRAS:
1. O tom deve ser profissional, caloroso e de gratidão pela parceria.
2. Deseje saúde, paz e prosperidade.
3. A mensagem deve ser curta (máximo 3 parágrafos pequenos) para facilitar a leitura no WhatsApp.
4. Use emojis de forma moderada e elegante (🎂, ✨, 🚀).
5. Não mencione valores de empréstimo ou propostas específicas, foque no dia do cliente.

Saída em Português do Brasil.`,
});

const generateBirthdayMessageFlow = ai.defineFlow(
  {
    name: 'generateBirthdayMessageFlow',
    inputSchema: BirthdayMessageInputSchema,
    outputSchema: BirthdayMessageOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
