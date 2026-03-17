'use server';
/**
 * @fileOverview Um fluxo Genkit para extrair dados estruturados de clientes a partir de um texto não estruturado.
 *
 * - extractCustomerData - A função para chamar o fluxo de extração.
 * - ExtractCustomerDataOutput - O tipo de saída (objeto com os dados do cliente).
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
    benefits: z.array(BenefitSchema).optional().describe('Uma lista de benefícios do cliente, cada um com número, espécie, salário e bancos de cartões.'),
    phone: z.string().optional().describe('O número de telefone principal do cliente (formato (00) 90000-0000).'),
    phone2: z.string().optional().describe('Um segundo número de telefone do cliente, se houver (formato (00) 90000-0000).'),
    email: z.string().optional().describe('O endereço de e-mail do cliente.'),
    birthDate: z.string().optional().describe('A data de nascimento do cliente no formato YYYY-MM-DD.'),
    cep: z.string().optional().describe('O CEP do endereço do cliente (formato 00000-000).'),
    street: z.string().optional().describe('O logradouro (rua, avenida) do cliente.'),
    number: z.string().optional().describe('O número do endereço do cliente.'),
    complement: z.string().optional().describe('O complemento do endereço (apto, bloco).'),
    neighborhood: z.string().optional().describe('O bairro do cliente.'),
    city: z.string().optional().describe('A cidade do cliente.'),
    state: z.string().optional().describe('O estado (UF) do cliente.'),
}).describe('Os dados extraídos do cliente.');

export type ExtractCustomerDataOutput = z.infer<typeof ExtractCustomerDataOutputSchema>;

/**
 * Server Action para extração de texto.
 * Refatorada para ser uma função autônoma, garantindo o registro correto no Next.js 15.
 */
export async function extractCustomerData(text: string): Promise<ExtractCustomerDataOutput> {
    if (!text || text.trim() === '') return {};

    try {
        const { output } = await ai.generate({
            model: 'googleai/gemini-1.5-flash',
            prompt: `Você é um assistente de extração de dados especializado em correspondentes bancários. Sua função é analisar o TEXTO e extrair informações para um JSON estruturado.

            ### REGRAS CRÍTICAS DE NEGÓCIO:
            1. CPF / Benefício: Extraia da primeira linha ou campos identificados. 
            2. Salário: Identifique o valor bruto ou líquido do benefício se disponível.
            3. Cartões RMC/RCC: Se identificar bancos vinculados a reservas de cartão (RMC ou RCC/Benefício), inclua no objeto do benefício correspondente.
            4. Data de Nascimento: Converta para YYYY-MM-DD.
            5. Telefones: Se houver mais de um número no texto, separe-os obrigatoriamente nos campos phone e phone2.
            6. OMISSÃO: Se um campo não existir, NÃO o invente.

            ### TEXTO PARA PROCESSAR:
            """
            ${text}
            """`,
            output: { schema: ExtractCustomerDataOutputSchema }
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
        console.error("❌ ERRO NA EXTRAÇÃO DE TEXTO:", error);
        throw new Error(`Falha na extração de dados via IA.`);
    }
}
