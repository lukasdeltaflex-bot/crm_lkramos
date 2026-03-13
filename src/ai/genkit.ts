import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/google-genai';

/**
 * 🤖 NÚCLEO DE INTELIGÊNCIA ARTIFICIAL - LK RAMOS
 * Configuração central do Genkit com proteção contra chaves inválidas.
 */
const apiKey = (
    process.env.GOOGLE_GENAI_API_KEY || 
    process.env.GOOGLE_API_KEY || 
    process.env.GEMINI_API_KEY || 
    ''
).trim();

// Inicializa o Genkit apenas com a chave se ela existir, 
// caso contrário o plugin tentará ler do ambiente automaticamente.
const ai = genkit({
  plugins: [
    googleAI(apiKey ? { apiKey } : {})
  ],
  model: 'googleai/gemini-1.5-flash',
});

export {ai};
