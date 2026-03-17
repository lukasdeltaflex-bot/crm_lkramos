'use server';
/**
 * @fileOverview Fluxo Genkit para extrair dados de clientes a partir de imagens ou PDFs (OCR).
 *
 * - extractDataFromImage - Server Action para processar documentos.
 * - ExtractFromImageOutput - O tipo de saída com os dados mapeados.
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

/**
 * Definição do fluxo Genkit.
 * Registrado antes da exportação da Action para garantir o registro no manifesto do Next.js.
 */
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
        console.log(`🤖 IA LK RAMOS: Processando mídia com motor de visão...`);
        
        const { output } = await ai.generate({
          model: 'googleai/gemini-1.5-flash',
          prompt: [
            { text: `Analise este documento de correspondente bancário e extraia: Nome, CPF, Nascimento, NB, Salário e Cartões (RMC/RCC). Formate datas como YYYY-MM-DD.` },
            { media: { url: input.photoDataUri, contentType: contentType } }
          ],
          output: { schema: ExtractFromImageOutputSchema }
        });

        const result = output || {};

        // 🛡️ TRATAMENTO DE TELEFONES: Separa números se vierem concatenados
        if (result.phone && !result.phone2) {
            const phoneMatches = result.phone.match(/\(?\d{2}\)?\s?\d{4,5}-?\d{4}/g);
            if (phoneMatches && phoneMatches.length > 1) {
                result.phone = phoneMatches[0];
                result.phone2 = phoneMatches[1];
            }
        }

        return result;
    } catch (error: any) {
        console.error("❌ ERRO NA CHAMADA DA IA:", error);
        throw new Error(`Falha na comunicação com a IA. Detalhes: ${error.message || 'Erro desconhecido'}`);
    }
  }
);

/**
 * Server Action exportada para ser consumida pela UI.
 * Definida como função assíncrona explícita para compatibilidade com Next.js 15.
 */
export async function extractDataFromImage(photoDataUri: string): Promise<ExtractFromImageOutput> {
  return await extractDataFromImageFlow({ photoDataUri });
}
