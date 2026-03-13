
import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/google-genai';

/**
 * 🤖 NÚCLEO DE INTELIGÊNCIA ARTIFICIAL - LK RAMOS
 * Configuração central do Genkit v1.x.
 * 
 * 🛡️ SEGURANÇA: As chaves de API são carregadas apenas no processo servidor.
 * Este arquivo não deve ser importado por componentes de cliente ('use client').
 */

// Trava de segurança para impedir vazamento acidental para o cliente
if (typeof window !== 'undefined') {
    console.error("ERRO CRÍTICO: Tentativa de carregar lógica de IA no lado do cliente.");
}

// Busca a chave e limpa espaços ou caracteres de quebra de linha
const apiKey = (
    process.env.GOOGLE_GENAI_API_KEY || 
    process.env.GOOGLE_API_KEY || 
    process.env.GEMINI_API_KEY || 
    ''
).trim();

if (!apiKey && typeof window === 'undefined') {
    console.warn("⚠️ ALERTA INFRAESTRUTURA: Chave de API da IA não detectada no ambiente servidor!");
} else if (typeof window === 'undefined') {
    // Log discreto para confirmar o carregamento no terminal
    console.log(`🤖 IA LK RAMOS: Infraestrutura pronta (Chave: ${apiKey.substring(0, 8)}...)`);
}

export const ai = genkit({
  plugins: [
    googleAI({ apiKey: apiKey || undefined })
  ],
  model: 'googleai/gemini-1.5-flash',
});
