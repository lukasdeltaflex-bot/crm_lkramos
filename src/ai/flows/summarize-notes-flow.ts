'use server';
/**
 * @fileOverview Um fluxo Genkit para resumir e profissionalizar anotações.
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
      model: 'googleai/gemini-2.5-flash-lite',
      prompt: `Atue como um compressor de texto altamente fiel e neutro.
      Sua missão é resumir o conteúdo informado sem adicionar qualquer interpretação, conclusão ou julgamento.

      REGRAS OBRIGATÓRIAS:
      1. NÃO adicione nenhuma informação que não esteja no texto original.
      2. NÃO faça inferências ou deduções de intenção.
      3. NÃO conclua nada além do que foi explicitamente informado. Mantenha o desfecho aberto se o texto assim indicar.
      4. PROIBIDO usar palavras como: "inviável", "desistência", "não prosseguir", "rejeição", a menos que estejam explicitamente no texto original.
      5. NÃO assuma desistência ou inviabilidade por conta própria.
      6. Mantenha neutralidade total e preserve valores e nomes de bancos.
      7. O resultado deve ser curto e direto (máximo 3 frases).

      TEXTO ORIGINAL:
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
    return notes;
  }
}
