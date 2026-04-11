'use server';
/**
 * @fileOverview Fluxo Genkit para analisar interpretativamente os textos manuais das regras bancárias.
 * Segue restrições estritas para não inventar regras e apenas reforçar bloqueios claros.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { ExtractPortabilityDataOutput } from './extract-portability-data-flow';

const RuleTextAnalysisSchema = z.object({
    ruleId: z.string(),
    statusOverride: z.enum(['RED', 'YELLOW', 'GREEN']).optional().describe('Se o texto indicar bloqueio claro, retorne RED. Se indicar atenção, YELLOW. Nunca altere para GREEN se já for vermelho.'),
    additionalReasons: z.array(z.string()).optional().describe('Mensagens curtas explicando a restrição encontrada no texto.'),
    isUnsure: z.boolean().optional().describe('Marque como true se o texto for vago ou insuficiente para tomar uma decisão segura.'),
});

const AnalyzeTextRulesOutputSchema = z.array(RuleTextAnalysisSchema);

export type RuleTextAnalysis = z.infer<typeof RuleTextAnalysisSchema>;

interface RuleToAnalyze {
    id: string;
    bankName: string;
    whatItDoes: string;
    whatItDoesNotDo: string;
    observations: string;
}

/**
 * Server Action para interpretação complementar por IA.
 */
export async function analyzeTextRulesWithAI(
    contract: NonNullable<ExtractPortabilityDataOutput['contracts']>[0],
    rules: RuleToAnalyze[]
): Promise<RuleTextAnalysis[]> {
    if (rules.length === 0) return [];

    try {
        const { output } = await ai.generate({
            model: "googleai/gemini-2.5-flash-lite",
            prompt: [
                { text: `Você é um especialista em crédito consignado e portabilidade de empréstimos.
Sua tarefa é analisar o CONTRATO do cliente e compará-lo com as REGRAS MANUAIS (descritas em texto) de diversos bancos.

CONTRATO DO CLIENTE:
- Banco de Origem: ${contract.sourceBank || 'Não informado'}
- Parcela: R$ ${contract.installmentValue || 0}
- Pagas: ${contract.installmentsPaid || 0}
- Saldo: R$ ${contract.outstandingBalance || 0}

REGRAS MANUAIS DOS BANCOS:
${rules.map(r => `
--- BANCO: ${r.bankName} (ID: ${r.id}) ---
- O que faz: ${r.whatItDoes || 'Não informado'}
- Restrições: ${r.whatItDoesNotDo || 'Não informado'}
- Observações: ${r.observations || 'Não informado'}
`).join('\n')}

DIRETRIZES OBRIGATÓRIAS:
1. HIERARQUIA: Você é um complemento interpretativo. Não invente regras.
2. BLOQUEIO: Se o texto do banco disser explicitamente que NÃO faz algo que o contrato possui (ex: "Não aceita Banco Pan" e o contrato é do Pan), mude o status para RED.
3. ATENÇÃO: Se o texto sugerir uma condição especial ou dúvida documental, mude para YELLOW.
4. FALHA SEGURA: Se o texto for vago ("pode ser que", "depende") ou insuficiente para decidir, marque 'isUnsure: true'.
5. RASTREABILIDADE: Em 'additionalReasons', cite exatamente onde leu a restrição (ex: "Restrição identificada no campo 'Restrições'").
6. RESTRITIVO: Você nunca deve aprovar (GREEN) algo que pareça arriscado. Na dúvida, seja conservador.
7. PRIORIDADE: Se você encontrar um conflito onde os números permitem mas o texto proíbe, o TEXTO PROÍBE (vira RED). Se o texto permitir mas os números proibirem, mantenha proibido (você não sobrescreve regras numéricas).

Retorne um array JSON com a análise para cada ID de regra fornecido.` }
            ],
            output: { schema: AnalyzeTextRulesOutputSchema }
        });

        return output || [];
    } catch (error) {
        console.error("❌ ERRO NA ANÁLISE DE TEXTO POR IA:", error);
        return [];
    }
}
