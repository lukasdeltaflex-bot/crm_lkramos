import 'dotenv/config';
import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';

/**
 * 🤖 NÚCLEO DE INTELIGÊNCIA ARTIFICIAL - LK RAMOS
 * Configuração de segurança: A chave da API é lida exclusivamente via variável de ambiente.
 */

export const ai = genkit({
  plugins: [
    googleAI({ 
      apiKey: process.env.GOOGLE_GENAI_API_KEY || process.env.GEMINI_API_KEY 
    })
  ],
  // Define o modelo de nova geração como padrão para todos os fluxos
  model: 'googleai/gemini-2.0-flash',
});
