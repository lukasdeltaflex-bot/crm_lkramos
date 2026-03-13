
import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';

/**
 * 🤖 NÚCLEO DE INTELIGÊNCIA ARTIFICIAL - LK RAMOS
 * Configuração otimizada do Genkit 1.x para o ambiente de servidor.
 * A chave de API é injetada explicitamente para garantir compatibilidade com o ambiente.
 */

export const ai = genkit({
  plugins: [
    googleAI({
      apiKey: process.env.GOOGLE_GENAI_API_KEY
    })
  ],
  model: 'googleai/gemini-1.5-flash',
});
