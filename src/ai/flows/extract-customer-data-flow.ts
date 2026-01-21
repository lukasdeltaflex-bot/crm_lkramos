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
  prompt: `### TAREFA
Você é um assistente de extração de dados especialista. Sua tarefa é extrair informações de clientes de um bloco de texto bruto e retorná-las como um objeto JSON estruturado. O texto sempre terá a mesma estrutura de campos (CPF, Nome, etc.), mas os dados de cada cliente serão diferentes.

### REGRAS DE EXTRAÇÃO E FORMATAÇÃO (OBRIGATÓRIO)

1.  **Linha \`CPF / Benefício\`**:
    *   Extraia o CPF do campo \`CPF:\`.
    *   Extraia o número do benefício do campo \`Benefício:\`. O valor de \`benefits\` DEVE ser um array de objetos. Exemplo: \`[{ "number": "1588063230" }]\`.

2.  **Linha \`Nome\`**:
    *   Extraia o nome completo.
    *   Converta para Title Case (Ex: "Natalina Santos Peixoto").

3.  **Linha \`Data de Nascimento\`**:
    *   Extraia APENAS a data. Ignore o texto sobre a idade (Ex: "- Idade: 71 anos").
    *   **CRÍTICO**: Converta a data de \`DD/MM/YYYY\` para \`YYYY-MM-DD\`.

4.  **Linha \`Endereço\`**: Esta é a parte mais complexa.
    *   A linha contém a rua, o número e, às vezes, um complemento.
    *   \`street\`: É todo o texto ANTES do número.
    *   \`number\`: É o número do imóvel.
    *   \`complement\`: É todo o texto DEPOIS do número. Se não houver, omita este campo.
    *   **Exemplo A**: "ODETE GORI BICUDO 190" -> \`street\` é "Odete Gori Bicudo", \`number\` é "190".
    *   **Exemplo B**: "AVENIDA PAVAO 700 APTO 83" -> \`street\` é "Avenida Pavao", \`number\` é "700", \`complement\` é "Apto 83".
    *   Converta \`street\` e \`complement\` para Title Case.

5.  **Outros Campos de Endereço**:
    *   Extraia \`Bairro\`, \`Cidade\` e \`CEP\` de seus respectivos campos.
    *   Converta \`Bairro\` e \`Cidade\` para Title Case.
    *   Extraia \`Estado\` e mantenha em MAIÚSCULAS (Ex: "SP").

6.  **Dados Não Presentes**: Se o texto não contiver informações como \`phone\` ou \`email\`, omita completamente essas chaves do JSON final. Não use \`null\` ou \`undefined\`.

### TEXTO PARA PROCESSAR
{{{input}}}

Agora, analise o texto acima e produza o JSON estruturado seguindo TODAS as regras estritamente.`,
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
