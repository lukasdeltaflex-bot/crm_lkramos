
import 'dotenv/config'; // Carrega o .env antes de tudo para o Genkit Dev UI
import { genkit } from 'genkit';
import { googleAI, gemini15Flash } from '@genkit-ai/google-genai';

/**
 * 🤖 NÚCLEO DE INTELIGÊNCIA ARTIFICIAL - LK RAMOS
 * Configuração otimizada para Genkit 1.x com suporte a ambiente local.
 */

const apiKey = process.env.GOOGLE_GENAI_API_KEY || process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;

if (!apiKey && typeof window === 'undefined') {
  console.warn("⚠️ AVISO: Nenhuma chave de API de IA foi detectada. As funções de IA podem falhar.");
}

export const ai = genkit({
  plugins: [
    googleAI({
      apiKey: apiKey
    })
  ],
  model: gemini15Flash, // Modelo padrão ultra-rápido para extrações e resumos
});
