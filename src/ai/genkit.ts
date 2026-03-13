import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/google-genai';

/**
 * 🤖 NÚCLEO DE INTELIGÊNCIA ARTIFICIAL - LK RAMOS
 * Configuração central do Genkit v1.x com injeção forçada de chave.
 */

// Busca a chave em todas as variáveis possíveis e remove espaços
const apiKey = (
    process.env.GOOGLE_GENAI_API_KEY || 
    process.env.GOOGLE_API_KEY || 
    process.env.GEMINI_API_KEY || 
    ''
).trim();

export const ai = genkit({
  plugins: [
    googleAI({ apiKey: apiKey || undefined })
  ],
  model: 'googleai/gemini-1.5-flash',
});
