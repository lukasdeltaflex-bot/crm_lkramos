'use server';
/**
 * @fileOverview Um fluxo Genkit para resumir e profissionalizar anotações.
 *
 * - summarizeNotes - A função para chamar o fluxo de sumarização.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const SummarizeNotesInputSchema = z.object({
  notes: z.string().describe('As anotações ou justificativas a serem profissionalizadas.'),
});
export type SummarizeNotesInput = z.infer<typeof SummarizeNotesInputSchema>;

const SummarizeNotesOutputSchema = z.object({
  summary: z.string().describe('O texto reescrito de forma profissional e concisa.'),
});
export type SummarizeNotesOutput = z.infer<typeof SummarizeNotesOutputSchema>;

/**
 * Server Action para resumir notas.
 * Refatorada para chamada direta ao ai.generate para garantir estabilidade no Next.js 15.
 */
export async function summarizeNotes(notes: string): Promise<string> {
  if (!notes || notes.trim().length < 2) return notes;
  
  try {
    const { output } = await ai.generate({
      model: 'googleai/gemini-1.5-flash',
      prompt: `Você é um Redator Executivo Sênior de uma instituição financeira.
      Sua missão é TRANSFORMAR o texto informal abaixo em um parecer técnico formal e elegante.

      REGRAS OBRIGATÓRIAS:
      1. NÃO DEVOLVA O TEXTO ORIGINAL. Use vocabulário do mercado de crédito consignado.
      2. Seja extremamente direto. Use termos como: "Inviabilidade técnica", "Desistência por parte do proponente", "Impedimento na averbação", "Restrição em órgão gestor".
      3. Mantenha valores e nomes de bancos intactos.
      4. O resultado deve ter cara de "Comentário de Gerente de Banco".

      TEXTO BRUTO PARA TRANSFORMAÇÃO:
      """
      ${notes}
      """`,
      output: { schema: SummarizeNotesOutputSchema },
      config: {
        safetySettings: [
          { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
          { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
          { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
          { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
        ],
      },
    });

    if (!output || !output.summary) {
        throw new Error("Retorno vazio da IA.");
    }

    return output.summary;
  } catch (error: any) {
    console.error("❌ AI Summary Error:", error);
    // Lança o erro para que o componente UI possa tratar e exibir o toast apropriado
    throw new Error(`Falha no processamento da IA: ${error.message || 'Erro desconhecido'}`);
  }
}
