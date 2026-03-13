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
    // Se o resultado for idêntico ao original, a IA falhou em processar ou foi bloqueada
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
    // 🛡️ SEGURANÇA TOTAL: Permite termos técnicos do mercado financeiro sem bloqueios
    safetySettings: [
      { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
    ],
  },
  prompt: `Você é um redator sênior especializado em Correspondente Bancário.
Sua missão é PEGAR o texto bruto fornecido e REESCREVÊ-LO de forma profissional, elegante e concisa.

### REGRAS DE OURO:
1. **Transformação Total**: Converta gírias e frases soltas em termos técnicos (ex: "cliente não quer" -> "Desistência por parte do proponente").
2. **Conciliação de Dados**: Mantenha nomes de bancos, números de contratos e valores monetários.
3. **Tom Executivo**: O texto final deve parecer escrito por um gerente de banco.
4. **Sem Fallback**: Não retorne o texto original. Mude a estrutura gramatical.
5. **Justificativas**: Se for uma reprova, descreva o impedimento técnico de forma direta.

TEXTO PARA PROCESSAR:
"""
{{{notes}}}
"""

Retorne o resultado no campo "summary" do JSON. Saída em Português do Brasil.`,
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
        // Tenta uma segunda abordagem sem o JSON schema se a primeira falhar ou for bloqueada
        const { text } = await ai.generate({
            prompt: `Reescreva profissionalmente este comentário de proposta bancária: "${input.notes}". Seja curto e use termos técnicos.`
        });
        return { summary: text.trim() || input.notes };
    }
    
    return output;
  }
);
