'use server';
/**
 * @fileOverview Um fluxo Genkit para resumir e profissionalizar anotações.
 *
 * - summarizeNotes - A função para chamar o fluxo de sumarização via Gemini API.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const SummarizeNotesOutputSchema = z.object({
  summary: z.string().describe('O texto reescrito de forma profissional e concisa.'),
});

/**
 * Server Action para resumir notas.
 * Utiliza Gemini 1.5 Flash para transformar textos informais em pareceres técnicos.
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
      2. Seja extremamente direto. Use termos como: "Inviabilidade técnica", "Desistência por parte do proponente", "Impedimento na averbação".
      3. Mantenha valores e nomes de bancos intactos.
      4. O resultado deve ser conciso (máximo 3 frases).

      TEXTO BRUTO:
      """
      ${notes}
      """`,
      output: { schema: SummarizeNotesOutputSchema },
      config: {
        temperature: 0.2,
      },
    });

    if (!output || !output.summary) {
        return notes;
    }

    return output.summary;
  } catch (error: any) {
    console.error("❌ AI Summary Error:", error);
    // Retorna o original em caso de falha para não travar a UI
    return notes;
  }
}
