
'use server';
/**
 * @fileOverview Fluxo Genkit para extrair dados de clientes a partir de imagens ou PDFs (OCR).
 * Otimizado com sistema de logs técnicos detalhados para diagnóstico de infraestrutura.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const BenefitFromImageSchema = z.object({
    number: z.string().optional().describe('Número do benefício INSS.'),
    species: z.string().optional().describe('Espécie do benefício.'),
    salary: z.number().optional().describe('Valor do salário ou benefício.'),
    rmcBank: z.string().optional().describe('Banco da reserva RMC identificado.'),
    rccBank: z.string().optional().describe('Banco da reserva RCC identificado.'),
});

const ExtractFromImageOutputSchema = z.object({
    name: z.string().optional().describe('Nome completo do cliente.'),
    cpf: z.string().optional().describe('CPF formatado 000.000.000-00.'),
    birthDate: z.string().optional().describe('Data de nascimento no formato YYYY-MM-DD.'),
    benefits: z.array(BenefitFromImageSchema).optional().describe('Lista de benefícios, salários e cartões identificados no extrato ou documento.'),
    city: z.string().optional().describe('Cidade do endereço.'),
    state: z.string().optional().describe('Estado (UF) do endereço.'),
    phone: z.string().optional().describe('Telefone principal de contato encontrado.'),
    phone2: z.string().optional().describe('Segundo telefone de contato encontrado.'),
}).describe('Dados extraídos da imagem ou PDF do documento.');

export type ExtractFromImageOutput = z.infer<typeof ExtractFromImageOutputSchema>;

export async function extractDataFromImage(photoDataUri: string): Promise<ExtractFromImageOutput> {
  return extractDataFromImageFlow({ photoDataUri });
}

const extractDataFromImageFlow = ai.defineFlow(
  {
    name: 'extractDataFromImageFlow',
    inputSchema: z.object({
      photoDataUri: z.string().describe("A imagem ou PDF do documento como data URI Base64."),
    }),
    outputSchema: ExtractFromImageOutputSchema,
  },
  async (input) => {
    let contentType = 'image/jpeg';
    const match = input.photoDataUri.match(/^data:([^;]+);base64,/);
    if (match) {
        contentType = match[1];
    }

    try {
        const { output } = await ai.generate({
          model: 'googleai/gemini-1.5-flash',
          prompt: [
            { text: `Você é um assistente de elite para correspondentes bancários.
            Analise este documento (RG, CNH, PDF de Extrato ou Ficha) e extraia os dados estruturados.
            
            REGRAS CRÍTICAS:
            1. Identifique Nome, CPF e Nascimento.
            2. Localize Números de Benefício (NB), valores de Salário e bancos de cartões (RMC/RCC).
            3. Formate a data de nascimento como YYYY-MM-DD.
            4. Se encontrar múltiplos telefones, separe obrigatoriamente em phone e phone2.` },
            { media: { url: input.photoDataUri, contentType: contentType } }
          ],
          config: {
            safetySettings: [
              { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
              { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
              { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
              { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
              { category: 'HARM_CATEGORY_CIVIC_INTEGRITY', threshold: 'BLOCK_NONE' },
            ],
          },
          output: { schema: ExtractFromImageOutputSchema }
        });

        const result = output || {};

        // 🛡️ BLINDAGEM CONTRA TELEFONES CONCATENADOS
        if (result.phone && !result.phone2) {
            const phoneMatches = result.phone.match(/\(?\d{2}\)?\s?\d{4,5}-?\d{4}/g);
            if (phoneMatches && phoneMatches.length > 1) {
                result.phone = phoneMatches[0];
                result.phone2 = phoneMatches[1];
            }
        }

        return result;
    } catch (error: any) {
        // 🔍 LOG DE DIAGNÓSTICO REAL (Terminal npm run dev)
        console.error("❌ --- ERRO TÉCNICO IA ---");
        console.error("MENSAGEM:", error.message);
        console.error("DETALHES COMPLETOS:", JSON.stringify(error, null, 2));
        console.error("--------------------------");
        
        let userMessage = "A IA encontrou um problema de comunicação.";
        const errStr = String(error).toUpperCase();
        const errMsg = String(error.message || '').toUpperCase();
        
        if (errStr.includes("API_KEY_INVALID") || errMsg.includes("API KEY NOT VALID") || errMsg.includes("400")) {
            userMessage = "Erro de Credencial: A chave no .env foi rejeitada pelo Google.";
        } else if (errStr.includes("429") || errStr.includes("QUOTA")) {
            userMessage = "Limite de uso atingido. Aguarde 60 segundos.";
        } else if (errStr.includes("SAFETY")) {
            userMessage = "Bloqueio de Segurança: O documento não pôde ser lido.";
        } else if (errStr.includes("FETCH") || errStr.includes("NETWORK") || errStr.includes("CONNECT") || errStr.includes("UND_ERR_CONNECT")) {
            // Inclui o erro técnico real para o usuário ver se for algo como DNS
            userMessage = `Falha de Conexão (${error.message || 'Network Error'}).`;
        }
        
        throw new Error(`${userMessage} Verifique se o arquivo está legível e não ultrapassa 4MB.`);
    }
  }
);
