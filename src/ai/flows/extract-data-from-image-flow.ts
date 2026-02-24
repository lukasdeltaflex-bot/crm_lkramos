'use server';
/**
 * @fileOverview Fluxo Genkit para extrair dados de clientes a partir de imagens (OCR).
 *
 * - extractDataFromImage - Função principal para extração via visão computacional.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const BenefitFromImageSchema = z.object({
    number: z.string().optional().describe('Número do benefício INSS.'),
    species: z.string().optional().describe('Espécie do benefício.'),
    rmcBank: z.string().optional().describe('Banco da reserva RMC identificado.'),
    rccBank: z.string().optional().describe('Banco da reserva RCC identificado.'),
});

const ExtractFromImageOutputSchema = z.object({
    name: z.string().optional().describe('Nome completo do cliente.'),
    cpf: z.string().optional().describe('CPF formatado 000.000.000-00.'),
    birthDate: z.string().optional().describe('Data de nascimento no formato YYYY-MM-DD.'),
    benefits: z.array(BenefitFromImageSchema).optional().describe('Lista de benefícios e cartões identificados no extrato ou documento.'),
    city: z.string().optional().describe('Cidade do endereço.'),
    state: z.string().optional().describe('Estado (UF) do endereço.'),
    phone: z.string().optional().describe('Telefone de contato encontrado.'),
}).describe('Dados extraídos da imagem do documento.');

export type ExtractFromImageOutput = z.infer<typeof ExtractFromImageOutputSchema>;

export async function extractDataFromImage(photoDataUri: string): Promise<ExtractFromImageOutput> {
  return extractDataFromImageFlow({ photoDataUri });
}

const extractDataFromImageFlow = ai.defineFlow(
  {
    name: 'extractDataFromImageFlow',
    inputSchema: z.object({
      photoDataUri: z.string().describe("A imagem do documento como data URI Base64."),
    }),
    outputSchema: ExtractFromImageOutputSchema,
  },
  async (input) => {
    const { output } = await ai.generate({
      prompt: [
        { text: `Você é um assistente de elite para correspondentes bancários.
        Analise esta imagem (RG, CNH, Extrato de Empréstimos ou Ficha) e extraia os dados estruturados.
        
        REGRAS:
        1. Identifique Nome, CPF e Nascimento.
        2. EXTRATOS: Se houver lista de benefícios ou reservas de cartão (RMC/RCC), mapeie os bancos correspondentes para cada NB.
        3. Formate a data de nascimento como YYYY-MM-DD.
        4. Seja preciso nos caracteres para evitar erros de digitação.` },
        { media: { url: input.photoDataUri, contentType: 'image/jpeg' } }
      ],
      output: { schema: ExtractFromImageOutputSchema }
    });

    return output || {};
  }
);
