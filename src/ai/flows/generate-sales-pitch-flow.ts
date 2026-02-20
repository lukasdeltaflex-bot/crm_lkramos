'use server';

/**
 * @fileOverview Fluxo de IA para gerar scripts de venda persuasivos.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const SalesPitchInputSchema = z.object({
  customerName: z.string().describe('Nome do cliente.'),
  lastProduct: z.string().optional().describe('Último produto contratado.'),
  totalVolume: z.number().optional().describe('Volume total de negócios.'),
  observations: z.string().optional().describe('Observações sobre o perfil do cliente.'),
});

const SalesPitchOutputSchema = z.object({
  pitch: z.string().describe('O script de venda gerado pela IA.'),
});

export async function generateSalesPitch(input: z.infer<typeof SalesPitchInputSchema>) {
  return generateSalesPitchFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateSalesPitchPrompt',
  input: { schema: SalesPitchInputSchema },
  output: { schema: SalesPitchOutputSchema },
  prompt: `Você é um mestre em vendas de crédito consignado para o correspondente LK RAMOS.
Sua tarefa é criar um script de abordagem para o WhatsApp para o cliente {{{customerName}}}.

CONTEXTO DO CLIENTE:
- Último Produto: {{{lastProduct}}}
- Volume Total: R$ {{{totalVolume}}}
- Observações: {{{observations}}}

REGRAS:
1. Gere um texto curto, direto e altamente persuasivo.
2. Use gatilhos mentais de oportunidade, exclusividade ou benefício financeiro.
3. O tom deve ser profissional porém caloroso.
4. Inclua espaços para emojis estratégicos (🚀, 💰, ✅).
5. O objetivo é fazer o cliente responder para iniciarmos uma simulação de Refinanciamento ou Novo Contrato.

Saída em Português do Brasil.`,
});

const generateSalesPitchFlow = ai.defineFlow(
  {
    name: 'generateSalesPitchFlow',
    inputSchema: SalesPitchInputSchema,
    outputSchema: SalesPitchOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
