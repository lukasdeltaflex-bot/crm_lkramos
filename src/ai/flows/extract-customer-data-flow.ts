'use server';
/**
 * @fileOverview Um fluxo Genkit para extrair dados estruturados de clientes a partir de um texto não estruturado.
 *
 * - extractCustomerData - A função para chamar o fluxo de extração.
 * - ExtractCustomerDataInput - O tipo de entrada (string com o texto).
 * - ExtractCustomerDataOutput - O tipo de saída (objeto com os dados do cliente).
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const ExtractCustomerDataOutputSchema = z.object({
    name: z.string().optional().describe('O nome completo do cliente.'),
    cpf: z.string().optional().describe('O CPF do cliente (formato 000.000.000-00).'),
    benefitNumber: z.string().optional().describe('O número do benefício INSS do cliente.'),
    phone: z.string().optional().describe('O número de telefone do cliente.'),
    email: z.string().email().optional().describe('O endereço de e-mail do cliente.'),
    birthDate: z.string().optional().describe('A data de nascimento do cliente no formato YYYY-MM-DD.'),
    cep: z.string().optional().describe('O CEP do endereço do cliente.'),
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
  prompt: `Você é um assistente especialista em processar dados de clientes para um sistema de CRM.
Sua tarefa é analisar o texto fornecido e extrair as informações do cliente da forma mais precisa possível, preenchendo o schema de saída.

Aqui estão algumas regras importantes:
1.  **CPF**: Formate sempre como '000.000.000-00'. Se o texto tiver apenas os números, adicione a pontuação.
2.  **Datas**: Converta qualquer formato de data (ex: 30/11/1970) para o formato 'YYYY-MM-DD'.
3.  **CEP**: Formate como '00000-000'.
4.  **Campos Vazios**: Se uma informação não for encontrada no texto, deixe o campo correspondente como 'undefined'. Não invente dados.
5.  **Extração**: Extraia o máximo de informações que conseguir do texto.

Texto para análise:
{{{input}}}

Gere a saída JSON estruturada com base no texto.`,
});

const extractCustomerDataFlow = ai.defineFlow(
  {
    name: 'extractCustomerDataFlow',
    inputSchema: z.string(),
    outputSchema: ExtractCustomerDataOutputSchema,
  },
  async (input) => {
    if (!input || input.trim() === '') {
        throw new Error('O texto de entrada não pode estar vazio.');
    }
    const { output } = await prompt(input);
    return output!;
  }
);
