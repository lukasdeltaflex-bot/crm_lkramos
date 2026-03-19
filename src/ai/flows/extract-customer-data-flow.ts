'use server';
/**
 * @fileOverview Um fluxo Genkit para extrair dados estruturados de clientes a partir de um texto não estruturado.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const BenefitSchema = z.object({
    number: z.string().describe("O número do benefício INSS do cliente."),
    species: z.string().optional().describe("A espécie do benefício (ex: Aposentadoria por Idade, Pensão por Morte)."),
    salary: z.number().optional().describe("O valor do salário/benefício mensal."),
    rmcBank: z.string().optional().describe("Nome do banco onde o cliente possui reserva de Cartão RMC."),
    rccBank: z.string().optional().describe("Nome do banco onde o cliente possui reserva de Cartão RCC (Cartão Benefício)."),
});

const ExtractCustomerDataOutputSchema = z.object({
    name: z.string().optional().describe('O nome completo do cliente.'),
    cpf: z.string().optional().describe('O CPF do cliente (formato 000.000.000-00).'),
    benefits: z.array(BenefitSchema).optional().describe('Uma lista de benefícios do cliente.'),
    phone: z.string().optional().describe('O número de telefone principal do cliente.'),
    phone2: z.string().optional().describe('Um segundo número de telefone do cliente.'),
    email: z.string().optional().describe('O endereço de e-mail do cliente.'),
    birthDate: z.string().optional().describe('A data de nascimento do cliente no formato YYYY-MM-DD.'),
    city: z.string().optional().describe('A cidade do cliente.'),
    state: z.string().optional().describe('O estado (UF) do cliente.'),
}).describe('Os dados extraídos do cliente.');

export type ExtractCustomerDataOutput = z.infer<typeof ExtractCustomerDataOutputSchema>;

/**
 * Server Action para extração de texto estruturado.
 */
export async function extractCustomerData(text: string): Promise<ExtractCustomerDataOutput> {
    if (!text || text.trim() === '') return {};

    try {
        const { output } = await ai.generate({
            model: 'googleai/gemini-1.5-flash',
            prompt: `Você é um assistente de extração de dados especializado em correspondentes bancários brasileiros. Analise o TEXTO e extraia informações para um JSON estruturado.

            ### REGRAS:
            1. CPF / Benefício: Extraia da primeira linha ou campos identificados. 
            2. Salário: Identifique o valor bruto ou líquido do benefício se disponível.
            3. Data de Nascimento: Converta para YYYY-MM-DD.
            4. Telefones: Se houver mais de um número, separe-os nos campos phone e phone2.

            ### TEXTO:
            "${text}"`,
            output: { schema: ExtractCustomerDataOutputSchema }
        });

        return output || {};
    } catch (error: any) {
        console.error("❌ ERRO NA EXTRAÇÃO Gemini:", error);
        throw new Error(`Falha na extração de dados via Gemini API.`);
    }
}
