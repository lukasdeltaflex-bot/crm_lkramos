
import 'dotenv/config';
import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';

/**
 * 🤖 NÚCLEO DE INTELIGÊNCIA ARTIFICIAL - LK RAMOS
 * Configuração otimizada para Gemini 1.5 Flash com carregamento dinâmico de chaves.
 */

const apiKey = process.env.GOOGLE_GENAI_API_KEY || process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

export const ai = genkit({
  plugins: [
    googleAI({ apiKey })
  ],
  model: 'googleai/gemini-1.5-flash', // Define o modelo padrão global para evitar erros de argumento
});
