'use server';

/**
 * @fileOverview This file defines a Genkit flow for generating customer birthday alerts,
 * specifically for loan officers who need to be aware of customers approaching 75 years of age.
 *
 * - customerBirthdayAlert - The function to generate the birthday alert.
 * - CustomerBirthdayAlertInput - The input type for the customerBirthdayAlert function.
 * - CustomerBirthdayAlertOutput - The output type for the customerBirthdayAlert function.
 */

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
  // Mock implementation to avoid API key errors
  return {
    alertMessage: `Lembrete: O aniversário de 75 anos de ${input.customerName} está se aproximando.`
  }
}
