
import 'dotenv/config'; // Carrega o .env antes de tudo para o Genkit Dev UI
import { genkit } from 'genkit';
import { googleAI, gemini15Flash } from '@genkit-ai/google-genai';

/**
 * 🤖 NÚCLEO DE INTELIGÊNCIA ARTIFICIAL - LK RAMOS
 * Configuração ultra-robusta para detecção de chaves em múltiplos ambientes.
 */

const apiKey = process.env.GOOGLE_GENAI_API_KEY || 
               process.env.GEMINI_API_KEY || 
               process.env.GOOGLE_API_KEY || 
               process.env.NEXT_PUBLIC_GEMINI_API_KEY;

if (!apiKey && typeof window === 'undefined') {
  console.warn("⚠️ AVISO CRÍTICO: Nenhuma chave de API Gemini detectada. Verifique o arquivo .env ou as variáveis do App Hosting.");
}

export const ai = genkit({
  plugins: [
    googleAI({
      apiKey: apiKey
    })
  ],
  model: gemini15Flash, // Modelo padrão ultra-rápido para extrações e resumos
});
