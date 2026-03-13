
import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/google-genai';

/**
 * 🤖 NÚCLEO DE INTELIGÊNCIA ARTIFICIAL - LK RAMOS
 * Configuração central do Genkit com plugin multimodal Google AI.
 */
const ai = genkit({
  plugins: [
    googleAI({ 
        // 🛡️ Blindagem: Tenta capturar a chave de qualquer uma das variáveis comuns
        apiKey: process.env.GOOGLE_GENAI_API_KEY || process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY 
    })
  ],
  model: 'googleai/gemini-1.5-flash',
});

export {ai};
