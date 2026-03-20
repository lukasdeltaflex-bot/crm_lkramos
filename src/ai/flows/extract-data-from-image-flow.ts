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

/**
 * Server Action exportada para processar documentos via Vision API.
 */
export async function extractDataFromImage(photoDataUri: string): Promise<ExtractFromImageOutput> {
    if (!photoDataUri) throw new Error("Documento não fornecido.");

    let contentType = 'image/jpeg';
    const match = photoDataUri.match(/^data:([^;]+);base64,/);
    if (match) {
        contentType = match[1];
    }

    try {
        console.log(`🤖 IA LK RAMOS: Iniciando Vision OCR via Gemini 1.5 Flash...`);
        
        const { output } = await ai.generate({
model: "googleai/gemini-2.5-flash-lite",
          prompt: [
            { text: `Analise este documento de correspondente bancário e extraia: Nome, CPF, Nascimento, NB, Salário e Cartões (RMC/RCC). Formate datas como YYYY-MM-DD. Se encontrar mais de um telefone, separe-os em phone e phone2.` },
            { media: { url: photoDataUri, contentType: contentType } }
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
        console.error("❌ ERRO NA CHAMADA DA IA (Vision):", error);
        throw new Error(`Falha na comunicação com a IA. Detalhes: ${error.message || 'Erro de rede'}`);
    }
}
