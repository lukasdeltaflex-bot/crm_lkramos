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
    email: z.string().email('O endereço de e-mail do cliente.').optional(),
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
  prompt: `Você é um assistente de IA especialista em análise e extração de dados para um sistema de CRM de correspondentes bancários. Sua tarefa é analisar o texto fornecido, que pode ser uma transcrição de áudio, uma mensagem de WhatsApp, um e-mail ou qualquer texto não estruturado, e extrair as informações do cliente da forma mais precisa e inteligente possível.

O texto pode vir em formatos estruturados, como cópias de outros sistemas. Seja capaz de interpretar esses formatos.

**Exemplo de formato estruturado comum:**
\`\`\`
CPF: 796.298.908-44 / Benefício: 1588063230
Nome: NATALINA SANTOS PEIXOTO
Data de Nascimento: 25/12/1954 - Idade: 71 anos
Endereço: ODETE GORI BICUDO 190
Bairro: NOVA VOTORANTIM
Cidade: VOTORANTIM - Estado: SP
CEP: 18113-400
\`\`\`
A partir do exemplo acima, você deve extrair o CPF, o número do benefício, o nome, a data de nascimento, e as informações de endereço (logradouro, número, bairro, cidade, estado, cep). Ignore a idade.

**Inteligência e Regras:**

1.  **Interpretação e Inferência:**
    *   **Endereço:** Se o texto mencionar um CEP, busque e preencha automaticamente os campos de logradouro, bairro, cidade e estado, mesmo que não estejam explícitos. No exemplo acima, "ODETE GORI BICUDO 190" deve ser separado em 'street' ("ODETE GORI BICUDO") e 'number' ("190").
    *   **Benefícios Múltiplos:** O cliente pode ter mais de um benefício. Extraia todos os números e suas respectivas espécies (ex: "aposentadoria por idade", "pensão por morte") que encontrar.
    *   **Nomes Compostos:** Lide corretamente com nomes completos, incluindo sobrenomes compostos.
    *   **Dados Implícitos:** Se o texto diz "ele é de São Paulo", infira que o estado é 'SP'.

2.  **Limpeza e Formatação de Dados:**
    *   **CPF**: Formate sempre como '000.000.000-00'. Remova caracteres não numéricos e adicione a pontuação correta.
    *   **Telefones**: Formate como '(00) 90000-0000' ou '(00) 0000-0000'. Identifique o telefone principal e um secundário se houver.
    *   **CEP**: Formate como '00000-000'.
    *   **Datas**: Converta qualquer formato de data (ex: 30/11/1970, 30 de nov de 70, trinta de novembro de mil novecentos e setenta) para o formato padrão **'YYYY-MM-DD'**.
    *   **Caixa Alta/Baixa:** Padronize nomes e endereços para terem a primeira letra de cada palavra em maiúscula (Title Case), a menos que seja uma sigla como 'SP'.

3.  **Precisão e Campos Vazios:**
    *   Se uma informação não for encontrada no texto, simplesmente omita a chave do objeto JSON de saída.
    *   **NÃO INVENTE DADOS.** Se não tiver certeza sobre uma informação, prefira deixá-la de fora.
    *   Não inclua o valor "undefined" como uma string.

**Texto para análise:**
{{{input}}}

Analise o texto e gere a saída JSON estruturada com os dados do cliente.`,
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
