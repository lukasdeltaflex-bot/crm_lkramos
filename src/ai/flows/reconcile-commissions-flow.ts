
'use server';
/**
 * @fileOverview Fluxo de IA V2 para extrair e conciliar dados de comissões.
 */

import { ai } from '@/ai/genkit';
import { gemini15Flash } from '@genkit-ai/google-genai';
import { z } from 'genkit';

const CommissionDataSchema = z.object({
  customerCpf: z.string().describe('O CPF do cliente associado à comissão.'),
  proposalIdentifier: z.string().optional().describe('Número do contrato ou proposta.'),
  amountPaid: z.number().describe('O valor exato da comissão que foi paga.'),
  bankName: z.string().optional().describe('Nome do banco ou promotora no relatório.'),
});

const ReconcileCommissionsOutputSchema = z.object({
  commissions: z.array(CommissionDataSchema).describe('Lista das comissões extraídas.'),
});

export type ReconcileCommissionsOutput = z.infer<typeof ReconcileCommissionsOutputSchema>;

const ReconcileInputSchema = z.object({
    text: z.string().optional(),
    fileDataUri: z.string().optional().describe("Data URI do arquivo (PDF ou Imagem)"),
});

// 🛡️ FIX: Definindo o fluxo ANTES da função exportada para garantir o registro da Server Action
const reconcileCommissionsFlow = ai.defineFlow(
  {
    name: 'reconcileCommissionsFlow',
    inputSchema: ReconcileInputSchema,
    outputSchema: ReconcileCommissionsOutputSchema,
  },
  async (input) => {
    const promptParts: any[] = [
        { text: `Você é um assistente financeiro de elite para correspondentes bancários.
        Sua tarefa é extrair uma lista de pagamentos de comissão de um relatório.
        
        REGRAS:
        1. Capture CPF (formatado), Número da Proposta/Contrato e o Valor Pago (numérico).
        2. Seja extremamente rigoroso com os valores decimais.
        3. Se houver múltiplos contratos para o mesmo CPF, liste cada um individualmente.` }
    ];

    if (input.fileDataUri) {
        let contentType = 'image/jpeg';
        const match = input.fileDataUri.match(/^data:([^;]+);base64,/);
        if (match) contentType = match[1];
        promptParts.push({ media: { url: input.fileDataUri, contentType } });
    }

    if (input.text) {
        promptParts.push({ text: `Texto do Relatório:\n${input.text}` });
    }

    const { output } = await ai.generate({
        model: gemini15Flash,
        prompt: promptParts,
        output: { schema: ReconcileCommissionsOutputSchema }
    });

    return output || { commissions: [] };
  }
);

/**
 * Server Action exportada para ser utilizada pelos componentes Client.
 */
export async function reconcileCommissions(input: z.infer<typeof ReconcileInputSchema>): Promise<ReconcileCommissionsOutput> {
  return reconcileCommissionsFlow(input);
}
