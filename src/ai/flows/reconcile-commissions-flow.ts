'use server';
/**
 * @fileOverview Fluxo de IA para extrair e conciliar dados de comissões de relatórios financeiros.
 */

import { ai } from '@/ai/genkit';
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

/**
 * Server Action para conciliação financeira via Gemini 1.5 Flash.
 */
export async function reconcileCommissions(input: z.infer<typeof ReconcileInputSchema>): Promise<ReconcileCommissionsOutput> {
    const promptParts: any[] = [
        { text: `Você é um assistente financeiro sênior para correspondentes bancários.
        Sua tarefa é extrair uma lista de pagamentos de comissão de um relatório.
        Capture CPF (formatado), Número da Proposta/Contrato e o Valor Pago (numérico).
        Seja extremamente rigoroso com os valores decimais.` }
    ];

    if (input.fileDataUri) {
        let contentType = 'image/jpeg';
        const match = input.fileDataUri.match(/^data:([^;]+);base64,/);
        if (match) contentType = match[1];
        promptParts.push({ media: { url: input.fileDataUri, contentType } });
    }

    if (input.text) {
        promptParts.push({ text: `Dados do Relatório:\n${input.text}` });
    }

    try {
        const { output } = await ai.generate({
            model: 'googleai/gemini-2.0-flash',
            prompt: promptParts,
            output: { schema: ReconcileCommissionsOutputSchema }
        });

        return output || { commissions: [] };
    } catch (error: any) {
        console.error("❌ Erro na Conciliação IA:", error);
        throw new Error("Falha ao processar o relatório via IA.");
    }
}
