'use server';

/**
 * @fileOverview This file defines a Genkit flow for generating customer birthday alerts,
 * specifically for loan officers who need to be aware of customers approaching 75 years of age.
 *
 * - customerBirthdayAlert - The function to generate the birthday alert.
 * - CustomerBirthdayAlertInput - The input type for the customerBirthdayAlert function.
 * - CustomerBirthdayAlertOutput - The output type for the customerBirthdayAlert function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const CustomerBirthdayAlertInputSchema = z.object({
  customerName: z.string().describe('The name of the customer.'),
  customerAge: z.number().describe('The age of the customer.'),
});
export type CustomerBirthdayAlertInput = z.infer<typeof CustomerBirthdayAlertInputSchema>;

const CustomerBirthdayAlertOutputSchema = z.object({
  alertMessage: z.string().describe('The alert message for the loan officer.'),
});
export type CustomerBirthdayAlertOutput = z.infer<typeof CustomerBirthdayAlertOutputSchema>;

export async function customerBirthdayAlert(input: CustomerBirthdayAlertInput): Promise<CustomerBirthdayAlertOutput> {
  return customerBirthdayAlertFlow(input);
}

const prompt = ai.definePrompt({
  name: 'customerBirthdayAlertPrompt',
  input: {schema: CustomerBirthdayAlertInputSchema},
  output: {schema: CustomerBirthdayAlertOutputSchema},
  prompt: `You are a helpful assistant for a loan officer.
  The loan officer needs to be aware of customers approaching 75 years of age, as those customers may no longer be eligible for loans.
  Generate an alert message for the loan officer, given the customer's name and age.

  Customer Name: {{{customerName}}}
  Customer Age: {{{customerAge}}}

  Alert Message: `,
});

const customerBirthdayAlertFlow = ai.defineFlow(
  {
    name: 'customerBirthdayAlertFlow',
    inputSchema: CustomerBirthdayAlertInputSchema,
    outputSchema: CustomerBirthdayAlertOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
