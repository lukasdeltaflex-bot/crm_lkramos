import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';

/**
 * 🤖 NÚCLEO DE INTELIGÊNCIA ARTIFICIAL - LK RAMOS
 * Configuração de segurança: A chave da API é lida automaticamente do ambiente.
 * Modelo padrão: gemini-1.5-flash para máxima estabilidade e compatibilidade multimodal.
 */

export const ai = genkit({
  plugins: [
    googleAI()
  ],
  // 🛡️ ESTABILIDADE: gemini-1.5-flash é o modelo de produção mais resiliente
  model: 'googleai/gemini-1.5-flash',
});
