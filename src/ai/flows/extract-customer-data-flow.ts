'use server';
/**
 * @fileOverview Um fluxo Genkit para extrair dados estruturados de clientes a partir de um texto não estruturado.
 *
 * - extractCustomerData - A função para chamar o fluxo de extração.
 * - ExtractCustomerDataInput - O tipo de entrada (string com o texto).
 * - ExtractCustomerDataOutput - O tipo de saída (objeto com os dados do cliente).
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const BenefitSchema = z.object({
    number: z.string().describe("O número do benefício INSS do cliente."),
    species: z.string().optional().describe("A espécie do benefício (ex: Aposentadoria por Idade, Pensão por Morte)."),
    rmcBank: z.string().optional().describe("Nome do banco onde o cliente possui reserva de Cartão RMC."),
    rccBank: z.string().optional().describe("Nome do banco onde o cliente possui reserva de Cartão RCC (Cartão Benefício)."),
});

const ExtractCustomerDataOutputSchema = z.object({
    name: z.string().optional().describe('O nome completo do cliente.'),
    cpf: z.string().optional().describe('O CPF do cliente (formato 000.000.000-00).'),
    benefits: z.array(BenefitSchema).optional().describe('Uma lista de benefícios do cliente, cada um com número, espécie e bancos de cartões.'),
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

export async function extractCustomerData(text: string): Promise<ExtractCustomerDataOutput> {
  return extractCustomerDataFlow(text);
}

const prompt = ai.definePrompt({
  name: 'extractCustomerDataPrompt',
  input: { schema: z.string() },
  output: { schema: ExtractCustomerDataOutputSchema },
  prompt: `Você é um assistente de extração de dados especializado em correspondentes bancários. Sua função é analisar o TEXTO e extrair informações para um JSON estruturado.

### REGRAS CRÍTICAS DE NEGÓCIO:

1.  **CPF / Benefício**: Extraia da primeira linha ou campos identificados. 
2.  **Cartões RMC/RCC**: Se identificar bancos vinculados a reservas de cartão (RMC ou RCC/Benefício), inclua no objeto do benefício correspondente.
3.  **Data de Nascimento**: Converta para YYYY-MM-DD.
4.  **OMISSÃO**: Se um campo não existir, NÃO o invente.

### EXEMPLO DE EXTRATO:
*Entrada:*
Nome: JOAO SILVA
CPF: 123.456.789-00
NB: 158.806.323-0 - RMC: BANCO PAN / RCC: BANCO ITAU
Endereço: RUA TESTE 100 - SP

*Saída:*
{"name":"JOAO SILVA","cpf":"123.456.789-00","benefits":[{"number":"1588063230","rmcBank":"PAN S.A.","rccBank":"Itaú Unibanco S.A."}],"street":"RUA TESTE","number":"100","state":"SP"}

### TEXTO PARA PROCESSAR:
\`\`\`
{{{input}}}
\`\`\`

Processe o texto e retorne apenas o JSON.`,
});

const extractCustomerDataFlow = ai.defineFlow(
  {
    name: 'extractCustomerDataFlow',
    inputSchema: z.string(),
    outputSchema: ExtractCustomerDataOutputSchema,
  },
  async (input) => {
    if (!input || input.trim() === '') {
        return {};
    }
    const { output } = await prompt(input);
    return output || {};
  }
);
