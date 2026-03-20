'use server';

/**
 * @fileOverview Fluxo Genkit para gerar mensagens de aniversário personalizadas.
 * 
 * Refatorado para chamada direta do modelo para máxima estabilidade em Server Actions.
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

/**
 * Gera uma mensagem de aniversário personalizada via Gemini.
 * Chamada direta via ai.generate para evitar instabilidades de registro de fluxos.
 */
export async function generateBirthdayMessage(input: BirthdayMessageInput): Promise<BirthdayMessageOutput> {
  try {
    const { output } = await ai.generate({
      model: 'googleai/gemini-1.5-flash',
      prompt: `Você é um assistente de relacionamento de um correspondente bancário de elite chamado LK RAMOS.
      Sua tarefa é gerar uma mensagem de aniversário para o cliente ${input.customerName}.

      REGRAS:
      1. O tom deve ser profissional, caloroso e de gratidão pela parceria.
      2. Deseje saúde, paz e prosperidade.
      3. A mensagem deve ser curta (máximo 3 parágrafos pequenos) para facilitar a leitura no WhatsApp.
      4. Use emojis de forma moderada e elegante (🎂, ✨, 🚀).
      5. Não mencione valores de empréstimo ou propostas específicas, foque no dia do cliente.

      Saída em Português do Brasil.`,
      output: { schema: BirthdayMessageOutputSchema }
    });

    if (!output || !output.message) {
      throw new Error('A IA não retornou um conteúdo válido.');
    }

    return output;
  } catch (error) {
    console.error("❌ ERRO NA GERAÇÃO DE MENSAGEM IA:", error);
    throw new Error("Falha ao gerar mensagem de aniversário via IA.");
  }
}
