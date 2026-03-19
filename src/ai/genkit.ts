import { genkit } from 'genkit';
import { googleAI, gemini15Flash } from '@genkit-ai/google-genai';

/**
 * 🤖 NÚCLEO DE INTELIGÊNCIA ARTIFICIAL - LK RAMOS
 * Configuração estabilizada para Google AI Studio (Gemini).
 * Utiliza exclusivamente a API Key do ambiente para garantir independência.
 */

const apiKey = process.env.GOOGLE_GENAI_API_KEY || process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;

export const ai = genkit({
  plugins: [
    googleAI({ apiKey })
  ],
  // 🛡️ ESTABILIDADE: Utiliza a constante oficial para garantir o endpoint correto
  model: gemini15Flash,
});

/**
 * 🛡️ CAMADA SEGURA DE IA
 * Função centralizada para geração de texto com tratamento de erros.
 * @param prompt O texto de comando para a IA.
 * @param model Opcional: modelo específico (padrão gemini-1.5-flash).
 */
export async function gerarTextoIA(prompt: string, model: any = gemini15Flash): Promise<string> {
    if (!prompt || !apiKey) {
        console.error("❌ Erro IA: Prompt vazio ou API Key não configurada.");
        return '';
    }
    
    try {
        const { text } = await ai.generate({
            model,
            prompt,
            config: {
                maxOutputTokens: 2048,
                temperature: 0.4,
            }
        });
        
        return text || '';
    } catch (error) {
        console.error("❌ Erro na chamada Gemini API:", error);
        return ''; // Retorno padrão resiliente
    }
}
