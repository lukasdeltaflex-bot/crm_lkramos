'use server';

/**
 * @fileOverview Define um fluxo Genkit para "enviar" um resumo por e-mail.
 *
 * - sendSummaryEmail - A função para processar o envio do e-mail de resumo.
 * - SendSummaryEmailInput - O tipo de entrada para a função.
 * - SendSummaryEmailOutput - O tipo de saída para a função.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import nodemailer from 'nodemailer';

const SendSummaryEmailInputSchema = z.object({
  recipientName: z.string().describe('O nome do destinatário.'),
  recipientEmail: z.string().email().describe('O e-mail do destinatário.'),
  summaryContent: z.string().describe('O conteúdo do resumo diário em formato de texto.'),
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
    // Verifica se as credenciais de e-mail estão configuradas no ambiente
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.error('As credenciais de e-mail (EMAIL_USER, EMAIL_PASS) não estão configuradas no arquivo .env');
      return {
          success: false,
          message: 'O serviço de e-mail não está configurado. Verifique as variáveis de ambiente.',
      };
    }

    // Configura o transportador de e-mail usando Nodemailer com as credenciais do Gmail
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
    });

    const emailHtmlBody = `
      <div style="font-family: Arial, sans-serif; line-height: 1.6;">
        <p>Olá, ${input.recipientName}!</p>
        <p>Aqui está o seu resumo diário de pendências:</p>
        <div style="background-color: #f5f5f5; border: 1px solid #e0e0e0; border-radius: 8px; padding: 15px; white-space: pre-wrap; font-family: monospace;">${input.summaryContent.replace(/### (.*?)\n/g, '<h3 style="margin-top: 20px; margin-bottom: 10px; border-bottom: 1px solid #ddd; padding-bottom: 5px;">$1</h3>').replace(/\- \*\*(.*?)\*\*: (.*?)\n/g, '<div><strong>$1:</strong> $2</div>')}</div>
        <p>Atenciosamente,<br>Seu Assistente LK Ramos</p>
      </div>
    `.trim();

    const mailOptions = {
        from: `"Assistente LK Ramos" <${process.env.EMAIL_USER}>`,
        to: input.recipientEmail,
        subject: 'Seu Resumo Diário de Pendências',
        html: emailHtmlBody,
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`E-mail de resumo enviado para: ${input.recipientEmail}`);
        return { success: true, message: 'E-mail de resumo enviado com sucesso!' };
    } catch (error) {
        console.error('Erro ao enviar e-mail:', error);
        return { success: false, message: 'Falha ao enviar e-mail. Verifique as credenciais e a conexão.' };
    }
  }
);
