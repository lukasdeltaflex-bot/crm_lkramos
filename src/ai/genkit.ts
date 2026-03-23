import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';

// Bloqueia a execução no lado do cliente
if (typeof window !== 'undefined') {
  throw new Error('⚠️ Genkit e a API Key NÃO podem ser executados no lado do cliente.');
}

// Log de depuração (obrigatório) - verifica especificamente o GEMINI_API_KEY
console.log('API KEY loaded:', !!process.env.GEMINI_API_KEY);

/**
 * 🤖 NÚCLEO DE INTELIGÊNCIA ARTIFICIAL - LK RAMOS
 * Configuração estabilizada para Google AI Studio (Gemini).
 * Utiliza a API Key do ambiente com fallback para garantir compatibilidade local e Vercel.
 */
const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || process.env.GOOGLE_GENAI_API_KEY;

if (!apiKey) {
  console.warn("❌ Erro Crítico IA: Nenhuma API Key do Gemini/Google AI foi encontrada. Verifique as variáveis de ambiente.");
}

export const ai = genkit({
  plugins: apiKey ? [googleAI({ apiKey })] : [googleAI()],
});

/**
 * 🛡️ CAMADA SEGURA DE IA
 * Função centralizada para geração de texto com tratamento de erros.
 * @param prompt O texto de comando para a IA.
 */
export async function gerarTextoIA(prompt: string): Promise<string> {
    if (!prompt || !apiKey) {
        console.error("❌ Erro IA: Prompt vazio ou API Key não configurada.");
        return '';
    }
    
    try {
        const { text } = await ai.generate({
            model: 'googleai/gemini-2.5-flash-lite',
            prompt,
            config: {
                maxOutputTokens: 2048,
                temperature: 0.4,
            }
        });
        
        return text || '';
    } catch (error) {
        console.error("❌ Erro na chamada Gemini API:", error);
        return '';
    }
}
