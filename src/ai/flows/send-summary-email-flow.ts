'use server';

/**
 * @fileOverview Define um fluxo Genkit para enviar um resumo por e-mail.
 *
 * - sendSummaryEmail - A função para processar o envio do e-mail de resumo.
 * - SendSummaryEmailInput - O tipo de entrada para a função.
 * - SendSummaryEmailOutput - O tipo de saída para a função.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import nodemailer from 'nodemailer';

// Define the schemas for the structured data, mirroring generate-daily-summary-flow
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

const SummaryDataSchema = z.object({
  userName: z.string(),
  birthdayAlerts: z.array(BirthdayAlertSchema).optional(),
  followUpReminders: z.array(FollowUpReminderSchema).optional(),
  commissionReminders: z.array(CommissionReminderSchema).optional(),
  debtBalanceReminders: z.array(DebtBalanceReminderSchema).optional(),
  partialCommissionReminders: z.array(PartialCommissionReminderSchema).optional(),
});


const SendSummaryEmailInputSchema = z.object({
  recipientName: z.string().describe('O nome do destinatário.'),
  recipientEmail: z.string().email().describe('O e-mail do destinatário.'),
  summaryData: SummaryDataSchema,
});
export type SendSummaryEmailInput = z.infer<typeof SendSummaryEmailInputSchema>;

const SendSummaryEmailOutputSchema = z.object({
  success: z.boolean(),
  message: z.string(),
});
export type SendSummaryEmailOutput = z.infer<typeof SendSummaryEmailOutputSchema>;

export async function sendSummaryEmail(input: SendSummaryEmailInput): Promise<SendSummaryEmailOutput> {
  return sendSummaryEmailFlow(input);
}

const sendSummaryEmailFlow = ai.defineFlow(
  {
    name: 'sendSummaryEmailFlow',
    inputSchema: SendSummaryEmailInputSchema,
    outputSchema: SendSummaryEmailOutputSchema,
  },
  async (input) => {
    // 🛡️ VALIDAÇÃO DE CREDENCIAIS V2
    const EMAIL_USER = process.env.EMAIL_USER;
    const EMAIL_PASS = process.env.EMAIL_PASS;

    if (!EMAIL_USER || !EMAIL_PASS) {
      console.warn('🛡️ LK RAMOS: E-mail não configurado em produção (EMAIL_USER/EMAIL_PASS ausentes).');
      return {
          success: false,
          message: 'Serviço de e-mail temporariamente indisponível. Contate o administrador.',
      };
    }
    
    // 1. Generate the summary content string from the structured data
    const summaryData = input.summaryData;
    const hasAnyAlert = 
        (summaryData.birthdayAlerts && summaryData.birthdayAlerts.length > 0) ||
        (summaryData.followUpReminders && summaryData.followUpReminders.length > 0) ||
        (summaryData.commissionReminders && summaryData.commissionReminders.length > 0) ||
        (summaryData.debtBalanceReminders && summaryData.debtBalanceReminders.length > 0) ||
        (summaryData.partialCommissionReminders && summaryData.partialCommissionReminders.length > 0);

    let summaryContent: string;
    if (!hasAnyAlert) {
        summaryContent = `Nenhuma pendência ou alerta importante para hoje. Tenha um ótimo dia!`;
    } else {
        let summary = ``;

        if (summaryData.birthdayAlerts && summaryData.birthdayAlerts.length > 0) {
            summary += '### 🎂 Alertas de Aniversário (Clientes Próximos de 75 Anos)\n';
            summaryData.birthdayAlerts.forEach(alert => {
                summary += `- **${alert.customerName}**: Cliente completará ${alert.age} anos em breve. Verifique as políticas de crédito para esta faixa etária.\n`;
            });
            summary += '\n';
        }

        if (summaryData.followUpReminders && summaryData.followUpReminders.length > 0) {
            summary += '### ⏰ Lembretes de Acompanhamento (Follow-up)\n';
            summaryData.followUpReminders.forEach(reminder => {
                summary += `- **${reminder.customerName} (Prop. nº ${reminder.proposalNumber})**: A proposta está "Em Andamento" há ${reminder.daysOpen} dias. Sugestão: entre em contato para uma atualização.\n`;
            });
            summary += '\n';
        }

        if (summaryData.commissionReminders && summaryData.commissionReminders.length > 0) {
            summary += '### 💰 Alertas de Comissão Pendente\n';
            summaryData.commissionReminders.forEach(reminder => {
                summary += `- **${reminder.customerName} (Prop. nº ${reminder.proposalNumber})**: A comissão está pendente há ${reminder.daysPending} dias. Sugestão: verifique o pagamento com a promotora/banco.\n`;
            });
            summary += '\n';
        }
        
        if (summaryData.partialCommissionReminders && summaryData.partialCommissionReminders.length > 0) {
            summary += '### 💰 Lembretes de Comissão Parcial\n';
            summaryData.partialCommissionReminders.forEach(reminder => {
                summary += `- **${reminder.customerName} (Prop. nº ${reminder.proposalNumber})**: Recebido R$ ${reminder.amountPaid.toFixed(2)} de R$ ${reminder.totalCommission.toFixed(2)} há ${reminder.daysSincePayment} dias. Sugestão: cobrar o valor restante.\n`;
            });
            summary += '\n';
        }
        
        if (summaryData.debtBalanceReminders && summaryData.debtBalanceReminders.length > 0) {
            summary += '### ⏳ Alertas de Saldo Devedor (Portabilidade)\n';
            summaryData.debtBalanceReminders.forEach(reminder => {
                summary += `- **${reminder.customerName} (Prop. nº ${reminder.proposalNumber})**: Aguardando saldo há ${reminder.daysWaiting} dias úteis. O prazo está se esgotando, verifique o status.\n`;
            });
            summary += '\n';
        }
        summaryContent = summary;
    }

    // 2. Format the email body with the generated content
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: EMAIL_USER,
            pass: EMAIL_PASS,
        },
    });

    const emailHtmlBody = `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <p>Olá, ${input.recipientName}!</p>
        <p>Aqui está o seu resumo diário de pendências:</p>
        <div style="background-color: #f7f7f7; border: 1px solid #e0e0e0; border-radius: 8px; padding: 20px; font-size: 14px;">
          ${summaryContent
            .replace(/\n\n/g, '<br>')
            .replace(/### (.*?)\n/g, '<h3 style="margin-top: 20px; margin-bottom: 10px; border-bottom: 1px solid #ddd; padding-bottom: 5px; font-size: 16px;">$1</h3>')
            .replace(/\- \*\*(.*?)\*\*:/g, '<div style="margin-bottom: 10px;"><strong>$1:</strong>')
            .replace(/\n/g, '</div>')
          }
        </div>
        <p style="margin-top: 20px;">Atenciosamente,<br>Seu Assistente LK Ramos</p>
      </div>
    `.trim();

    const mailOptions = {
        from: `"Assistente LK Ramos" <${EMAIL_USER}>`,
        to: input.recipientEmail,
        subject: 'Seu Resumo Diário de Pendências',
        html: emailHtmlBody,
    };

    try {
        await transporter.sendMail(mailOptions);
        return { success: true, message: 'E-mail enviado com sucesso!' };
    } catch (error) {
        console.error('🛡️ Erro no disparo SMTP:', error);
        return { success: false, message: 'Falha técnica no envio do e-mail.' };
    }
  }
);
