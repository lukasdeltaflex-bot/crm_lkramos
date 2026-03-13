import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/google-genai';

/**
 * 🤖 NÚCLEO DE INTELIGÊNCIA ARTIFICIAL - LK RAMOS
 * Configuração central do Genkit com proteção contra espaços em branco nas chaves.
 * Suporta múltiplas variantes de nomes de variáveis de ambiente.
 */
const apiKey = (
    process.env.GOOGLE_GENAI_API_KEY || 
    process.env.GOOGLE_API_KEY || 
    process.env.GEMINI_API_KEY || 
    ''
).trim();

const ai = genkit({
  plugins: [
    googleAI({ 
        apiKey: apiKey 
    })
  ],
  model: 'googleai/gemini-1.5-flash',
});

export {ai};