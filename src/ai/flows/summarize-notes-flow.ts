'use server';
/**
 * @fileOverview A Genkit flow to summarize customer notes.
 *
 * - summarizeNotes - The function to call the summarization flow.
 * - SummarizeNotesInput - The input type (string).
 * - SummarizeNotesOutput - The output type (string).
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SummarizeNotesInputSchema = z.string().describe('The customer notes to be summarized.');
export type SummarizeNotesInput = z.infer<typeof SummarizeNotesInputSchema>;

const SummarizeNotesOutputSchema = z.string().describe('The summarized and well-formatted customer notes.');
export type SummarizeNotesOutput = z.infer<typeof SummarizeNotesOutputSchema>;

export async function summarizeNotes(input: SummarizeNotesInput): Promise<SummarizeNotesOutput> {
  return summarizeNotesFlow(input);
}

const prompt = ai.definePrompt({
  name: 'summarizeNotesPrompt',
  input: {schema: SummarizeNotesInputSchema},
  output: {schema: SummarizeNotesOutputSchema},
  prompt: `You are an expert assistant. Your task is to summarize and format customer notes for a loan officer.
The notes may be messy, contain typos, or be unstructured.
Your goal is to create a clean, concise, and easy-to-read summary.
Use bullet points for key information.
The output should be in Brazilian Portuguese.

Here are the notes:
"{{{input}}}"

Generate a well-structured summary.`,
});

const summarizeNotesFlow = ai.defineFlow(
  {
    name: 'summarizeNotesFlow',
    inputSchema: SummarizeNotesInputSchema,
    outputSchema: SummarizeNotesOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
