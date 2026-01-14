
'use server';

/**
 * @fileOverview Defines a Genkit flow to generate reminders for following up on long-running proposals.
 *
 * - followUpReminder - The function to generate the follow-up reminder.
 * - FollowUpReminderInput - The input type for the function.
 * - FollowUpReminderOutput - The output type for the function.
 */

import {z} from 'genkit';

const FollowUpReminderInputSchema = z.object({
  customerName: z.string().describe('The name of the customer.'),
  proposalNumber: z.string().describe('The proposal identification number.'),
  daysOpen: z.number().describe('The number of days the proposal has been in "Em Andamento" status.'),
});
export type FollowUpReminderInput = z.infer<typeof FollowUpReminderInputSchema>;

const FollowUpReminderOutputSchema = z.object({
  reminderMessage: z.string().describe('The reminder message for the loan officer.'),
});
export type FollowUpReminderOutput = z.infer<typeof FollowUpReminderOutputSchema>;

export async function followUpReminder(input: FollowUpReminderInput): Promise<FollowUpReminderOutput> {
  // Mock implementation to avoid API key errors
  return {
    reminderMessage: `Atenção: A proposta ${input.proposalNumber} está em andamento há ${input.daysOpen} dias. Considere contatar o cliente ${input.customerName} para uma atualização.`
  }
}
