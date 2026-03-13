
import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/google-genai';

/**
 * 🤖 NÚCLEO DE INTELIGÊNCIA ARTIFICIAL - LK RAMOS
 * Configuração central do Genkit v1.x com tratamento de segurança de chave.
 */

// Busca a chave e remove espaços invisíveis que podem quebrar a autenticação
const rawKey = (
    process.env.GOOGLE_GENAI_API_KEY || 
    process.env.GOOGLE_API_KEY || 
    process.env.GEMINI_API_KEY || 
    ''
).trim();

if (!rawKey && typeof window === 'undefined') {
    console.warn("⚠️ ALERTA INFRAESTRUTURA: Nenhuma chave de API detectada no processo servidor!");
}

export const ai = genkit({
  plugins: [
    googleAI({ apiKey: rawKey || undefined })
  ],
  model: 'googleai/gemini-1.5-flash',
});
