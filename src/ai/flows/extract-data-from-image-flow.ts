'use server';
/**
 * @fileOverview Fluxo Genkit para extrair dados de clientes a partir de imagens ou PDFs (OCR).
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
        console.log(`🤖 IA LK RAMOS: Processando mídia tipo ${contentType}...`);
        
        const { output } = await ai.generate({
          model: 'googleai/gemini-1.5-flash',
          prompt: [
            { text: `Analise este documento de correspondente bancário e extraia: Nome, CPF, Nascimento, NB, Salário e Cartões (RMC/RCC). Formate datas como YYYY-MM-DD.` },
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

        if (result.phone && !result.phone2) {
            const phoneMatches = result.phone.match(/\(?\d{2}\)?\s?\d{4,5}-?\d{4}/g);
            if (phoneMatches && phoneMatches.length > 1) {
                result.phone = phoneMatches[0];
                result.phone2 = phoneMatches[1];
            }
        }

        return result;
    } catch (error: any) {
        console.error("❌ ERRO RAW DA API GEMINI:", error);
        
        let msg = "Falha na comunicação com a IA.";
        const raw = String(error).toUpperCase();
        
        if (raw.includes("API_KEY_INVALID")) msg = "Chave de API Inválida.";
        if (raw.includes("403")) msg = "Acesso Negado (Verifique se a API está ativa no Cloud).";
        if (raw.includes("429")) msg = "Limite de requisições excedido.";
        
        throw new Error(`${msg} Detalhes: ${error.message || 'Erro desconhecido'}`);
    }
  }
);

export async function extractDataFromImage(photoDataUri: string): Promise<ExtractFromImageOutput> {
  return extractDataFromImageFlow({ photoDataUri });
}