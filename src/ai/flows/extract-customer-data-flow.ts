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
});

const ExtractCustomerDataOutputSchema = z.object({
    name: z.string().optional().describe('O nome completo do cliente.'),
    cpf: z.string().optional().describe('O CPF do cliente (formato 000.000.000-00).'),
    benefits: z.array(BenefitSchema).optional().describe('Uma lista de benefícios do cliente, cada um com número e espécie.'),
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
  prompt: `Você é um assistente de extração de dados. Sua única função é analisar o TEXTO DO USUÁRIO e extrair as informações para um JSON, seguindo as REGRAS e os EXEMPLOS abaixo. Seja extremamente preciso.

### REGRAS OBRIGATÓRIAS:

1.  **CPF / Benefício**: Extraia da primeira linha. O Benefício DEVE ser um array de objetos. Ex: \`"benefits": [{"number": "1588063230"}]\`.
2.  **Nome**: Extraia da linha "Nome:".
3.  **Data de Nascimento**: Extraia APENAS a data da linha "Data de Nascimento:", no formato \`DD/MM/YYYY\`, e converta para \`YYYY-MM-DD\`. IGNORE a idade.
4.  **Endereço**: Na linha "Endereço:", o primeiro grupo de números é o \`number\`. O que vem antes é a \`street\`. O que vem depois (se houver) é o \`complement\`.
5.  **Demais Endereços**: Extraia "Bairro", "Cidade", "Estado" e "CEP" de suas linhas.
6.  **OMISSÃO É REGRA**: Se um campo (ex: email, telefone) não estiver no texto, NÃO o inclua no JSON final.

### EXEMPLOS DE EXECUÇÃO PERFEITA:

---
**EXEMPLO 1**
*Texto de Entrada:*
CPF: 796.298.908-44 / Benefício: 1588063230
Nome: NATALINA SANTOS PEIXOTO
Data de Nascimento: 25/12/1954 - Idade: 71 anos
Endereço: ODETE GORI BICUDO 190
Bairro: NOVA VOTORANTIM
Cidade: VOTORANTIM - Estado: SP
CEP: 18113-400
*Saída JSON:*
{"name":"NATALINA SANTOS PEIXOTO","cpf":"796.298.908-44","benefits":[{"number":"1588063230"}],"birthDate":"1954-12-25","street":"ODETE GORI BICUDO","number":"190","neighborhood":"NOVA VOTORANTIM","city":"VOTORANTIM","state":"SP","cep":"18113-400"}
---
**EXEMPLO 2**
*Texto de Entrada:*
CPF: 986.101.206-00 / Benefício: 545406412
Nome: JEUSA CRISTINA NERY DE OLIVEIRA
Data de Nascimento: 31/05/1969 - Idade: 56 anos
Endereço: AVENIDA PAVAO 700 APTO 83
Bairro: INDIANOPOLIS
Cidade: SAO PAULO - Estado: SP
CEP: 04516-012
*Saída JSON:*
{"name":"JEUSA CRISTINA NERY DE OLIVEIRA","cpf":"986.101.206-00","benefits":[{"number":"545406412"}],"birthDate":"1969-05-31","street":"AVENIDA PAVAO","number":"700","complement":"APTO 83","neighborhood":"INDIANOPOLIS","city":"SAO PAULO","state":"SP","cep":"04516-012"}
---
**EXEMPLO 3**
*Texto de Entrada:*
CPF: 240.605.851-49 / Benefício: 1596159011
Nome: IVAN MENDES DE OLIVEIRA
Data de Nascimento: 02/12/1959 - Idade: 66 anos
Endereço: SAO PAULO 1240
Bairro: JARDIM NOVO HORIZ
Cidade: CUIABA - Estado: MT
CEP: 78058-689
*Saída JSON:*
{"name":"IVAN MENDES DE OLIVEIRA","cpf":"240.605.851-49","benefits":[{"number":"1596159011"}],"birthDate":"1959-12-02","street":"SAO PAULO","number":"1240","neighborhood":"JARDIM NOVO HORIZ","city":"CUIABA","state":"MT","cep":"78058-689"}
---

### TEXTO DO USUÁRIO PARA PROCESSAR:
\`\`\`
{{{input}}}
\`\`\`

Agora, processe o TEXTO DO USUÁRIO e gere o JSON de saída.`,
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
