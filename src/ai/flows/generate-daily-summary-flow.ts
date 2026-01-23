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

const generateDailySummaryFlow = ai.defineFlow(
  {
    name: 'generateDailySummaryFlow',
    inputSchema: GenerateDailySummaryInputSchema,
    outputSchema: GenerateDailySummaryOutputSchema,
  },
  async (input) => {
    const hasAnyAlert = 
        (input.birthdayAlerts && input.birthdayAlerts.length > 0) ||
        (input.followUpReminders && input.followUpReminders.length > 0) ||
        (input.commissionReminders && input.commissionReminders.length > 0) ||
        (input.debtBalanceReminders && input.debtBalanceReminders.length > 0) ||
        (input.partialCommissionReminders && input.partialCommissionReminders.length > 0);

    if (!hasAnyAlert) {
        return `Olá, ${input.userName}! Nenhuma pendência ou alerta importante para hoje. Tenha um ótimo dia!`;
    }

    let summary = `Olá, ${input.userName}! Aqui está o seu resumo de pendências para hoje:\n\n`;

    summary += '### 🎂 Alertas de Aniversário (Clientes Próximos de 75 Anos)\n';
    if (input.birthdayAlerts && input.birthdayAlerts.length > 0) {
      input.birthdayAlerts.forEach(alert => {
        summary += `- **${alert.customerName}**: Cliente completará ${alert.age} anos em breve. Verifique as políticas de crédito para esta faixa etária.\n`;
      });
    } else {
      summary += '- Nenhuma pendência.\n';
    }
    summary += '\n';

    summary += '### ⏰ Lembretes de Acompanhamento (Follow-up)\n';
    if (input.followUpReminders && input.followUpReminders.length > 0) {
      input.followUpReminders.forEach(reminder => {
        summary += `- **${reminder.customerName} (Prop. nº ${reminder.proposalNumber})**: A proposta está "Em Andamento" há ${reminder.daysOpen} dias. Sugestão: entre em contato para uma atualização.\n`;
      });
    } else {
      summary += '- Nenhuma pendência.\n';
    }
    summary += '\n';

    summary += '### 💰 Alertas de Comissão Pendente\n';
    if (input.commissionReminders && input.commissionReminders.length > 0) {
      input.commissionReminders.forEach(reminder => {
        summary += `- **${reminder.customerName} (Prop. nº ${reminder.proposalNumber})**: A comissão está pendente há ${reminder.daysPending} dias. Sugestão: verifique o pagamento com a promotora/banco.\n`;
      });
    } else {
      summary += '- Nenhuma pendência.\n';
    }
    summary += '\n';

    summary += '### 💰 Lembretes de Comissão Parcial\n';
    if (input.partialCommissionReminders && input.partialCommissionReminders.length > 0) {
        input.partialCommissionReminders.forEach(reminder => {
        summary += `- **${reminder.customerName} (Prop. nº ${reminder.proposalNumber})**: Recebido R$ ${reminder.amountPaid} de R$ ${reminder.totalCommission} há ${reminder.daysSincePayment} dias. Sugestão: cobrar o valor restante.\n`;
      });
    } else {
      summary += '- Nenhuma pendência.\n';
    }
    summary += '\n';

    summary += '### ⏳ Alertas de Saldo Devedor (Portabilidade)\n';
    if (input.debtBalanceReminders && input.debtBalanceReminders.length > 0) {
      input.debtBalanceReminders.forEach(reminder => {
        summary += `- **${reminder.customerName} (Prop. nº ${reminder.proposalNumber})**: Aguardando saldo há ${reminder.daysWaiting} dias úteis. O prazo está se esgotando, verifique o status.\n`;
      });
    } else {
      summary += '- Nenhuma pendência.\n';
    }
    summary += '\n';
    
    summary += 'Tenha um dia produtivo!';
    
    return summary;
  }
);
