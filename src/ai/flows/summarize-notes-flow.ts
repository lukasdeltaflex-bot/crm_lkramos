'use server';
/**
 * @fileOverview Um fluxo Genkit para resumir e profissionalizar anotações.
 *
 * - summarizeNotes - A função para chamar o fluxo de sumarização.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SummarizeNotesInputSchema = z.object({
  notes: z.string().describe('As anotações ou justificativas a serem profissionalizadas.'),
});
export type SummarizeNotesInput = z.infer<typeof SummarizeNotesInputSchema>;

const SummarizeNotesOutputSchema = z.object({
  summary: z.string().describe('O texto reescrito de forma profissional e concisa.'),
});
export type SummarizeNotesOutput = z.infer<typeof SummarizeNotesOutputSchema>;

/**
 * Função exportada para ser usada como Server Action.
 * Transformada em um motor de escrita profissional para correspondentes bancários.
 */
export async function summarizeNotes(notes: string): Promise<string> {
  if (!notes || notes.trim().length < 2) return notes;
  
  try {
    const result = await summarizeNotesFlow({ notes });
    return result.summary || notes;
  } catch (error) {
    console.error("AI Summary Error:", error);
    return notes;
  }
}

const prompt = ai.definePrompt({
  name: 'summarizeNotesPrompt',
  input: {schema: SummarizeNotesInputSchema},
  output: {schema: SummarizeNotesOutputSchema},
  config: {
    safetySettings: [
      { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
    ],
  },
  prompt: `Você é um Redator Executivo Sênior de uma instituição financeira.
Sua missão é TRANSFORMAR o texto informal abaixo em um parecer técnico formal e elegante.

REGRAS OBRIGATÓRIAS:
1. NÃO DEVOLVA O TEXTO ORIGINAL. Use vocabulário do mercado de crédito consignado.
2. Seja extremamente direto. Use termos como: "Inviabilidade técnica", "Desistência por parte do proponente", "Impedimento na averbação", "Restrição em órgão gestor".
3. Mantenha valores e nomes de bancos intactos.
4. O resultado deve ter cara de "Comentário de Gerente de Banco".

TEXTO BRUTO PARA TRANSFORMAÇÃO:
"""
{{{notes}}}
"""

Retorne o parecer no campo "summary" do JSON. Saída em Português do Brasil.`,
});

const summarizeNotesFlow = ai.defineFlow(
  {
    name: 'summarizeNotesFlow',
    inputSchema: SummarizeNotesInputSchema,
    outputSchema: SummarizeNotesOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    
    if (!output || !output.summary || output.summary.trim() === input.notes.trim()) {
        const { text } = await ai.generate({
            prompt: `Reescreva como um parecer técnico bancário formal (não use o texto original): "${input.notes}"`
        });
        return { summary: text.trim() || input.notes };
    }
    
    return output;
  }
);
