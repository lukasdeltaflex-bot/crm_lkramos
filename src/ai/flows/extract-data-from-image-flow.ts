
'use server';
/**
 * @fileOverview Fluxo Genkit para extrair dados de clientes a partir de imagens ou PDFs (OCR).
 *
 * - extractDataFromImage - Função principal para extração via visão computacional multimodal.
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
    // Detecta o mime-type a partir da Data URI para envio correto ao modelo multimodal
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
            Analise este documento (RG, CNH, PDF de Extrato de Empréstimos ou Ficha) e extraia os dados estruturados.
            
            REGRAS CRÍTICAS:
            1. Identifique Nome, CPF e Nascimento.
            2. EXTRATOS PDF: Localize todos os Números de Benefício (NB), seus valores de Salário/Mensalidade e bancos de cartões (RMC/RCC).
            3. Formate a data de nascimento como YYYY-MM-DD.
            4. Seja extremamente preciso nos caracteres para evitar erros de digitação.
            5. Se identificar múltiplos benefícios, liste-os individualmente.
            6. TELEFONES: Se encontrar mais de um número de telefone, separe-os nos campos phone e phone2. NÃO concatene dois números no mesmo campo.` },
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
        console.error("AI Generation Error Details:", error);
        
        // Mensagem de erro mais detalhada para o usuário
        let msg = "A Inteligência Artificial não conseguiu processar este documento.";
        const errStr = String(error).toUpperCase();
        
        if (errStr.includes("429") || errStr.includes("QUOTA")) {
            msg = "Limite de uso da IA atingido (Cota 429). Aguarde um minuto e tente novamente.";
        } else if (errStr.includes("SAFETY") || errStr.includes("CANDIDATE")) {
            msg = "O documento foi bloqueado pelos filtros de segurança. Tente uma foto mais clara e sem sombras.";
        } else if (errStr.includes("API KEY") || errStr.includes("AUTHENTICATION") || errStr.includes("401")) {
            msg = `Erro de autenticação da IA (${error.message || 'Chave Inválida'}). Verifique o arquivo .env.`;
        }
        
        throw new Error(`${msg} Certifique-se de que o arquivo está legível e não ultrapassa 4MB.`);
    }
  }
);
