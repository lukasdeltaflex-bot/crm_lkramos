import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';

/**
 * 🤖 NÚCLEO DE INTELIGÊNCIA ARTIFICIAL - LK RAMOS
 * Configuração resiliente para Produção: tenta carregar a chave de múltiplas variáveis
 * comuns em ambientes Cloud (App Hosting / Cloud Run).
 */

const apiKey = process.env.GOOGLE_GENAI_API_KEY || process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;

export const ai = genkit({
  plugins: [
    googleAI({ apiKey })
  ],
  // 🛡️ ESTABILIDADE: gemini-1.5-flash é o modelo de produção mais resiliente para multimodal
  model: 'googleai/gemini-1.5-flash',
});
