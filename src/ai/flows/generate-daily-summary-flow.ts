'use server';
/**
 * @fileOverview Um fluxo Genkit para gerar um resumo diário consolidado de todos os alertas e pendências.
 *
 * - generateDailySummary - A função para chamar o fluxo de resumo.
 * - GenerateDailySummaryInput - O tipo de entrada para o fluxo.
 * - GenerateDailySummaryOutput - O tipo de saída (string com o resumo formatado).
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const BirthdayAlertSchema = z.object({
    customerName: z.string(),
    age: z.number(),
});

const FollowUpReminderSchema = z.object({
    customerName: z.string(),
    proposalNumber: z.string(),
    daysOpen: z.number(),
});

const CommissionReminderSchema = z.object({
    customerName: z.string(),
    proposalNumber: z.string(),
    daysPending: z.number(),
});

const DebtBalanceReminderSchema = z.object({
    customerName: z.string(),
    proposalNumber: z.string(),
    daysWaiting: z.number(),
});

const PartialCommissionReminderSchema = z.object({
    customerName: z.string(),
    proposalNumber: z.string(),
    amountPaid: z.number(),
    totalCommission: z.number(),
    daysSincePayment: z.number(),
});

const GenerateDailySummaryInputSchema = z.object({
  userName: z.string().describe('O nome do agente de crédito para quem o resumo é destinado.'),
  birthdayAlerts: z.array(BirthdayAlertSchema).optional().describe('Alertas de aniversário de clientes se aproximando de 75 anos.'),
  followUpReminders: z.array(FollowUpReminderSchema).optional().describe('Lembretes para propostas em andamento por muito tempo.'),
  commissionReminders: z.array(CommissionReminderSchema).optional().describe('Alertas para comissões de propostas pagas que continuam pendentes.'),
  debtBalanceReminders: z.array(DebtBalanceReminderSchema).optional().describe('Alertas para propostas de portabilidade aguardando saldo devedor com prazo próximo do vencimento.'),
  partialCommissionReminders: z.array(PartialCommissionReminderSchema).optional().describe('Lembretes para cobrar o restante de comissões pagas parcialmente.'),
});

export type GenerateDailySummaryInput = z.infer<typeof GenerateDailySummaryInputSchema>;

const GenerateDailySummaryOutputSchema = z.string();
export type GenerateDailySummaryOutput = z.infer<typeof GenerateDailySummaryOutputSchema>;

export async function generateDailySummary(input: GenerateDailySummaryInput): Promise<GenerateDailySummaryOutput> {
  return generateDailySummaryFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateDailySummaryPrompt',
  input: { schema: GenerateDailySummaryInputSchema },
  output: { schema: z.string().nullable() },
  prompt: `Você é um assistente executivo para um agente de crédito. Sua tarefa é criar um resumo diário (um "briefing matinal") claro, conciso e bem formatado, com as pendências e alertas mais importantes do dia para o agente chamado {{{userName}}}.

Use as informações fornecidas para construir o resumo. Se uma seção não tiver alertas, mencione que não há pendências para aquele tópico. Formate a saída usando markdown, com títulos claros para cada seção. O tom deve ser profissional, mas encorajador. A saída deve ser em português do Brasil.

**Estrutura do Resumo:**

### 🎂 Alertas de Aniversário (Clientes Próximos de 75 Anos)
{{#if birthdayAlerts}}
  {{#each birthdayAlerts}}
  - **{{customerName}}**: Cliente completará {{age}} anos em breve. Verifique as políticas de crédito para esta faixa etária.
  {{/each}}
{{else}}
  - Nenhuma pendência.
{{/if}}

### ⏰ Lembretes de Acompanhamento (Follow-up)
{{#if followUpReminders}}
  {{#each followUpReminders}}
  - **{{customerName}} (Prop. nº {{proposalNumber}})**: A proposta está "Em Andamento" há {{daysOpen}} dias. Sugestão: entre em contato para uma atualização.
  {{/each}}
{{else}}
  - Nenhuma pendência.
{{/if}}

### 💰 Alertas de Comissão Pendente
{{#if commissionReminders}}
  {{#each commissionReminders}}
  - **{{customerName}} (Prop. nº {{proposalNumber}})**: A comissão está pendente há {{daysPending}} dias. Sugestão: verifique o pagamento com a promotora/banco.
  {{/each}}
{{else}}
  - Nenhuma pendência.
{{/if}}

### 💰 Lembretes de Comissão Parcial
{{#if partialCommissionReminders}}
    {{#each partialCommissionReminders}}
    - **{{customerName}} (Prop. nº {{proposalNumber}})**: Recebido R$ {{amountPaid}} de R$ {{totalCommission}} há {{daysSincePayment}} dias. Sugestão: cobrar o valor restante.
    {{/each}}
{{else}}
    - Nenhuma pendência.
{{/if}}

### ⏳ Alertas de Saldo Devedor (Portabilidade)
{{#if debtBalanceReminders}}
  {{#each debtBalanceReminders}}
  - **{{customerName}} (Prop. nº {{proposalNumber}})**: Aguardando saldo há {{daysWaiting}} dias úteis. O prazo está se esgotando, verifique o status.
  {{/each}}
{{else}}
  - Nenhuma pendência.
{{/if}}

Finalize com uma mensagem positiva.

É crucial que você sempre gere um resumo. Se por algum motivo as informações acima estiverem vazias ou ausentes, simplesmente informe que não há pendências para cada categoria e finalize com a mensagem positiva. Não retorne uma resposta vazia.`,
    config: {
        safetySettings: [
          {
            category: 'HARM_CATEGORY_HARASSMENT',
            threshold: 'BLOCK_NONE',
          },
          {
            category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
            threshold: 'BLOCK_NONE',
          },
        ],
    },
});

const generateDailySummaryFlow = ai.defineFlow(
  {
    name: 'generateDailySummaryFlow',
    inputSchema: GenerateDailySummaryInputSchema,
    outputSchema: GenerateDailySummaryOutputSchema,
  },
  async (input) => {
    // Verifica se há pelo menos um alerta para processar
    const hasAnyAlert = 
        (input.birthdayAlerts && input.birthdayAlerts.length > 0) ||
        (input.followUpReminders && input.followUpReminders.length > 0) ||
        (input.commissionReminders && input.commissionReminders.length > 0) ||
        (input.debtBalanceReminders && input.debtBalanceReminders.length > 0) ||
        (input.partialCommissionReminders && input.partialCommissionReminders.length > 0);

    if (!hasAnyAlert) {
        return `Olá, ${input.userName}! Nenhuma pendência ou alerta importante para hoje. Tenha um ótimo dia!`;
    }
    
    const { output } = await prompt(input);
    
    if (!output) {
      return `Olá, ${input.userName}! Não foi possível gerar o resumo de pendências.`;
    }

    return `Olá, ${input.userName}! Aqui está o seu resumo de pendências para hoje:\n\n${output}\n\nTenha um dia produtivo!`;
  }
);
