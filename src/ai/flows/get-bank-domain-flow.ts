'use server';

/**
 * @fileOverview Fluxo de IA para descobrir o domínio oficial de um banco pelo nome.
 */

import { ai } from '@/ai/genkit';
import { gemini15Flash } from '@genkit-ai/google-genai';
import { z } from 'genkit';

const GetBankDomainInputSchema = z.object({
  bankName: z.string().describe('O nome do banco para pesquisar o domínio.'),
});

const GetBankDomainOutputSchema = z.object({
  domain: z.string().describe('O domínio oficial do site do banco (ex: itau.com.br).'),
});

export async function getBankDomain(input: { bankName: string }): Promise<{ domain: string }> {
  return getBankDomainFlow(input);
}

const getBankDomainFlow = ai.defineFlow(
  {
    name: 'getBankDomainFlow',
    inputSchema: GetBankDomainInputSchema,
    outputSchema: GetBankDomainOutputSchema,
  },
  async (input) => {
    const { text } = await ai.generate({
        model: gemini15Flash,
        prompt: `Você é um assistente técnico especialista em instituições financeiras brasileiras. 
        Sua tarefa é retornar APENAS o domínio (URL principal) do site oficial do banco: "${input.bankName}".
        
        REGRAS:
        1. Retorne apenas o domínio, sem "https://", sem "www" e sem barras.
        2. Se for um banco conhecido, use o domínio real (Ex: Itaú -> itau.com.br).
        3. Se for uma cooperativa ou banco menor, tente deduzir o site.
        4. Se não tiver certeza absoluta, retorne "null".
        
        Exemplo de Saída:
        bancodobrasil.com.br`
    });

    const domain = text.trim().toLowerCase()
        .replace(/^https?:\/\//, '')
        .replace(/^www\./, '')
        .split('/')[0]
        .split(' ')[0];

    return { domain: domain === 'null' ? '' : domain };
  }
);
