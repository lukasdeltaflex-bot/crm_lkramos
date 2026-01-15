'use server';

import { config } from 'dotenv';
config();

import '@/ai/flows/customer-birthday-alert.ts';
import '@/ai/flows/follow-up-reminder.ts';
import '@/ai/flows/summarize-notes-flow.ts';
import '@/ai/flows/summarize-customer-history-flow.ts';
import '@/ai/flows/extract-customer-data-flow.ts';
import '@/ai/flows/reconcile-commissions-flow.ts';
