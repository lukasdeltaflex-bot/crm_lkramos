
'use server';

/**
 * @fileOverview Defines a Genkit flow to generate reminders for following up on long-running proposals.
 *
 * - followUpReminder - The function to generate the follow-up reminder.
 * - FollowUpReminderInput - The input type for the function.
 * - FollowUpReminderOutput - The output type for the function.
 */

import {ai} from '@/ai/genkit';
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
  return followUpReminderFlow(input);
}

const prompt = ai.definePrompt({
  name: 'followUpReminderPrompt',
  input: {schema: FollowUpReminderInputSchema},
  output: {schema: FollowUpReminderOutputSchema},
  prompt: `You are a helpful assistant for a loan officer.
  A proposal has been open for a significant amount of time and may require a follow-up.
  Generate a concise, friendly, and actionable reminder message for the loan officer.
  The proposal has been open for {{{daysOpen}}} days.
  The customer is {{{customerName}}} and the proposal number is {{{proposalNumber}}}.

  Generate the message in Brazilian Portuguese.
  Example: "Atenção: A proposta {{{proposalNumber}}} está em andamento há {{{daysOpen}}} dias. Considere contatar o cliente {{{customerName}}} para uma atualização."`,
});

const followUpReminderFlow = ai.defineFlow(
  {
    name: 'followUpReminderFlow',
    inputSchema: FollowUpReminderInputSchema,
    outputSchema: FollowUpReminderOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
