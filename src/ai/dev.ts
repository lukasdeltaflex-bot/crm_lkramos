'use server';

import { config } from 'dotenv';
config();

import '@/ai/flows/customer-birthday-alert.ts';
import '@/ai/flows/follow-up-reminder.ts';
import '@/ai/flows/summarize-notes-flow.ts';
import '@/ai/flows/summarize-customer-history-flow.ts';
import '@/ai/flows/extract-customer-data-flow.ts';
import '@/ai/flows/extract-data-from-image-flow.ts';
import '@/ai/flows/reconcile-commissions-flow.ts';
import '@/ai/flows/commission-reminder-flow.ts';
import '@/ai/flows/debt-balance-reminder-flow.ts';
import '@/ai/flows/generate-daily-summary-flow.ts';
import '@/ai/flows/partial-commission-reminder-flow.ts';
import '@/ai/flows/send-summary-email-flow.ts';
import '@/ai/flows/generate-birthday-message-flow.ts';
import '@/ai/flows/get-bank-domain-flow.ts';
