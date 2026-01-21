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
  prompt: `Você é um assistente de IA especialista e altamente preciso, treinado para analisar texto e extrair dados de clientes para um sistema de CRM.

**Sua Missão Principal:**
Analisar um bloco de texto que foi copiado de outro sistema. Este texto sempre seguirá uma ESTRUTURA consistente, mas os DADOS do cliente serão diferentes a cada vez. Sua tarefa é extrair os dados e retorná-los em formato JSON, seguindo o schema de saída fornecido.

**Formato do Texto de Entrada (Exemplo):**
O texto de entrada terá um formato semelhante a este:
\`\`\`
CPF: 796.298.908-44 / Benefício: 1588063230

Nome: NATALINA SANTOS PEIXOTO

Data de Nascimento: 25/12/1954 - Idade: 71 anos

Endereço: ODETE GORI BICUDO 190
Bairro: NOVA VOTORANTIM
Cidade: VOTORANTIM - Estado: SP
CEP: 18113-400
\`\`\`

**Análise Detalhada da Estrutura e Regras de Extração:**

1.  **Linha "CPF / Benefício":**
    *   Identifique o valor após "CPF:". Este é o \`cpf\`.
    *   Identifique o valor após "Benefício:". Este é o número do benefício.
    *   Sempre coloque o benefício dentro de um array \`benefits\`, como um objeto com a chave \`number\`. Ex: \` "benefits": [{"number": "1588063230"}] \`. Se houver múltiplos benefícios, adicione todos ao array.

2.  **Linha "Nome":**
    *   Extraia o valor após "Nome:". Este é o \`name\`.

3.  **Linha "Data de Nascimento":**
    *   Extraia a data (ex: "25/12/1954"). Ignore tudo o que vier depois, especialmente a idade. Este é o \`birthDate\`.

4.  **Linha "Endereço":**
    *   Esta linha contém a rua (\`street\`) e o número (\`number\`). Faça o seu melhor para separá-los. Geralmente, o número vem no final. Ex: "ODETE GORI BICUDO 190" -> \`street\`: "ODETE GORI BICUDO", \`number\`: "190".

5.  **Linhas "Bairro", "Cidade - Estado", "CEP":**
    *   Extraia \`neighborhood\`, \`city\`, \`state\`, e \`cep\` de suas respectivas linhas.

**REGRAS DE FORMATAÇÃO (OBRIGATÓRIO):**

*   **CPF**: Se encontrar, formate como '000.000.000-00'.
*   **CEP**: Se encontrar, formate como '00000-000'.
*   **Datas**: Se encontrar, converta **SEMPRE** para o formato **'YYYY-MM-DD'**.
*   **Caixa Alta/Baixa:** Padronize nomes e endereços para terem a primeira letra de cada palavra em maiúscula (Title Case). Ex: "NATALINA SANTOS PEIXOTO" -> "Natalina Santos Peixoto". Siglas como 'SP' devem ser mantidas em maiúsculo.

**REGRA MAIS IMPORTANTE (PRECISÃO):**

*   **NÃO INVENTE DADOS.** Se uma informação (como 'email' ou 'telefone') não estiver presente no texto de entrada, simplesmente omita o campo correspondente no JSON de saída.
*   Se não tiver certeza sobre uma informação, prefira deixá-la de fora. É melhor ter menos dados corretos do que dados inventados.
*   O JSON de saída deve ser estritamente aderente ao schema. Não inclua "undefined" ou "null" como strings. Apenas omita os campos não encontrados.

**Texto para análise:**
{{{input}}}

Analise o texto acima seguindo TODAS as regras e gere a saída JSON estruturada.`,
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
