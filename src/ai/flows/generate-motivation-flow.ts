'use server';

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const MotivationOutputSchema = z.object({
  message: z.string().describe('A mensagem motivacional de vendas.'),
});
export type MotivationOutput = z.infer<typeof MotivationOutputSchema>;

export async function generateMotivationMessage(input: { userName: string; currentGoalPercent: number }): Promise<MotivationOutput> {
  try {
    const response = await ai.generate({
      model: 'googleai/gemini-2.5-flash-lite',
      prompt: `Você é um mentor de vendas e coach do correspondente bancário LK RAMOS.
      O usuário ${input.userName} está com ${input.currentGoalPercent.toFixed(1)}% da meta batida neste mês.
      Crie uma frase curta, direta e altamente motivadora para ele continuar focado e vender mais empréstimos.
      Se estiver abaixo de 50%, foque em resiliência.
      Se estiver perto de 100%, foque no sprint final.
      Se bateu 100%, parabenize e sugira dobrar a meta.
      Use emojis (🚀, 🔥, 💰). Máximo de 2 parágrafos curtos.
      Retorne a resposta obrigatoriamente no campo "message" do JSON.`,
      output: { schema: MotivationOutputSchema },
      config: { temperature: 0.8 }
    });

    const output = response.output;
    if (output && output.message) return output;
    if (response.text) return { message: response.text };
    throw new Error('A IA retornou vazio.');
  } catch (error: any) {
    console.error("❌ ERRO DA GEMINI API:", error.message || error);
    throw new Error(`Falha na IA: ${error.message || 'Erro Desconhecido'}`);
  }
}
