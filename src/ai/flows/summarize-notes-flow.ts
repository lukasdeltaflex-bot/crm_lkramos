'use server';
/**
 * @fileOverview Um fluxo Genkit para resumir anotações de clientes e justificativas bancárias.
 *
 * - summarizeNotes - A função para chamar o fluxo de sumarização.
 * - SummarizeNotesInput - O tipo de entrada (objeto com a string).
 * - SummarizeNotesOutput - O tipo de saída (objeto com a string).
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SummarizeNotesInputSchema = z.object({
  notes: z.string().describe('As anotações do cliente ou justificativas de reprova a serem resumidas.'),
});
export type SummarizeNotesInput = z.infer<typeof SummarizeNotesInputSchema>;

const SummarizeNotesOutputSchema = z.object({
  summary: z.string().describe('O texto resumido e bem formatado.'),
});
export type SummarizeNotesOutput = z.infer<typeof SummarizeNotesOutputSchema>;

/**
 * Função exportada para ser usada como Server Action.
 * Agora com tratamento de erro robusto e suporte a textos técnicos.
 */
export async function summarizeNotes(notes: string): Promise<string> {
  try {
    const result = await summarizeNotesFlow({ notes });
    return result.summary || notes;
  } catch (error) {
    console.error("AI Summary Error:", error);
    return notes; // Fallback para o texto original em caso de erro
  }
}

const prompt = ai.definePrompt({
  name: 'summarizeNotesPrompt',
  input: {schema: SummarizeNotesInputSchema},
  output: {schema: SummarizeNotesOutputSchema},
  config: {
    // 🛡️ CONFIGURAÇÃO DE SEGURANÇA: Permite termos técnicos como "Reprovado" ou "Dívida"
    safetySettings: [
      { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
    ],
  },
  prompt: `Você é um assistente especialista em correspondentes bancários. Sua tarefa é resumir e organizar anotações.
O texto pode conter justificativas de reprova de contratos, detalhes de negociação ou anotações bagunçadas.

OBJETIVO:
1. Criar um texto limpo, profissional e conciso.
2. Manter nomes de bancos, números de contratos ou valores se presentes.
3. Se for uma justificativa de reprova, explique o motivo de forma direta.
4. Use um tom executivo e de fácil leitura.

Texto para processar:
"""
{{{notes}}}
"""

Gere o resumo estruturado no campo "summary" do JSON. Saída em Português do Brasil.`,
});

const summarizeNotesFlow = ai.defineFlow(
  {
    name: 'summarizeNotesFlow',
    inputSchema: SummarizeNotesInputSchema,
    outputSchema: SummarizeNotesOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    
    if (!output || !output.summary) {
        return { summary: input.notes };
    }
    
    return output;
  }
);
