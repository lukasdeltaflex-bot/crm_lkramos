'use server';

/**
 * @fileOverview Fluxo Genkit para gerar mensagens de aniversário personalizadas.
 * 
 * Refatorado para chamada direta do modelo com tratamento de erro transparente e fallback.
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
 * @param input Objeto contendo o nome do cliente.
 * @returns Objeto com a mensagem gerada (JSON estruturado ou texto de fallback).
 */
export async function generateBirthdayMessage(input: BirthdayMessageInput): Promise<BirthdayMessageOutput> {
  try {
    console.log(`🤖 IA LK RAMOS: Iniciando geração de parabéns para "${input.customerName}"...`);

    const response = await ai.generate({
      model: 'googleai/gemini-2.5-flash-lite',
      prompt: `Você é um assistente de relacionamento do correspondente bancário LK RAMOS.
      Sua tarefa é criar uma mensagem de parabéns curta, calorosa e profissional para o cliente ${input.customerName}.
      
      DIRETRIZES:
      - Deseje saúde, paz e prosperidade.
      - Use emojis de forma moderada e elegante (🎂, ✨, 🚀).
      - A mensagem deve ter no máximo 3 parágrafos pequenos.
      - O objetivo é fortalecer o vínculo com o cliente no dia dele.
      - Retorne a resposta obrigatoriamente no campo "message" do JSON.`,
      output: { 
        schema: BirthdayMessageOutputSchema 
      },
      config: {
        temperature: 0.7,
      }
    });

    // 🛡️ Tenta extrair o output estruturado (JSON)
    const output = response.output;

    if (output && output.message) {
      return output;
    }

    // 🛡️ FALLBACK: Se o parsing do JSON falhar mas houver texto na resposta
    if (response.text) {
      console.warn("⚠️ IA retornou texto puro em vez de JSON estruturado. Usando fallback.");
      return { message: response.text };
    }

    throw new Error('A IA não retornou um conteúdo válido ou a resposta veio vazia.');
  } catch (error: any) {
    // 🛡️ REVELANDO A CAUSA REAL NO LOG DO SERVIDOR
    console.error("❌ ERRO REAL DA GEMINI API:", error.message || error);
    
    // Repassa o erro detalhado para o frontend sem mascarar com mensagem genérica
    const detail = error.message || 'Erro desconhecido na API do Google';
    throw new Error(`Falha na IA: ${detail}`);
  }
}
