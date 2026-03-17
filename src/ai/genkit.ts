
import 'dotenv/config';
import { genkit } from 'genkit';
import { googleAI, gemini15Flash } from '@genkit-ai/google-genai';

/**
 * 🤖 NÚCLEO DE INTELIGÊNCIA ARTIFICIAL - LK RAMOS
 * Configuração estabilizada para Genkit 1.x com carregamento de chave resiliente.
 */

const apiKey = process.env.GOOGLE_GENAI_API_KEY || process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;

export const ai = genkit({
  plugins: [
    googleAI({ apiKey })
  ],
  model: gemini15Flash, // Define o modelo padrão para evitar INVALID_ARGUMENT
});
