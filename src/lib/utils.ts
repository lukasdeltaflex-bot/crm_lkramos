import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(amount);
}

export function getAge(birthDate: string): number {
  if (!birthDate || !/^\d{4}-\d{2}-\d{2}$/.test(birthDate)) return 0;
  const [year, month, day] = birthDate.split('-').map(Number);
  const today = new Date();
  const birth = new Date(year, month - 1, day);
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}

/**
 * Normalizes a string for searching by removing accents and converting to lowercase.
 */
export function normalizeString(str: string): string {
  if (!str) return '';
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

/**
 * Checks if a phone number is likely a WhatsApp number.
 */
export function isWhatsApp(phone: string): boolean {
    if (!phone) return false;
    const digitsOnly = phone.replace(/\D/g, '');
    return digitsOnly.length === 11;
}

/**
 * Generates a WhatsApp click-to-chat URL.
 */
export function getWhatsAppUrl(phone: string): string {
    const digitsOnly = phone.replace(/\D/g, '');
    return `https://wa.me/55${digitsOnly}`;
}

/**
 * Calculates the number of business days (Mon-Fri) between a start date and now.
 */
export function calculateBusinessDays(startDate: Date): number {
    let count = 0;
    const curDate = new Date(startDate);
    const now = new Date();
    curDate.setDate(curDate.getDate() + 1);
    curDate.setHours(0, 0, 0, 0);
    now.setHours(0, 0, 0, 0);

    while (curDate <= now) {
        const dayOfWeek = curDate.getDay();
        if (dayOfWeek !== 0 && dayOfWeek !== 6) {
            count++;
        }
        curDate.setDate(curDate.getDate() + 1);
    }
    return count;
}

/**
 * Validates a Brazilian CPF using the official mathematical algorithm.
 */
export function validateCPF(cpf: string): boolean {
    const cleanCPF = cpf.replace(/[^\d]+/g, '');
    if (cleanCPF.length !== 11) return false;
    if (/^(\d)\1+$/.test(cleanCPF)) return false;
    
    let sum = 0;
    let remainder;
    
    for (let i = 1; i <= 9; i++) {
        sum = sum + parseInt(cleanCPF.substring(i - 1, i)) * (11 - i);
    }
    
    remainder = (sum * 10) % 11;
    if ((remainder === 10) || (remainder === 11)) remainder = 0;
    if (remainder !== parseInt(cleanCPF.substring(9, 10))) return false;
    
    sum = 0;
    for (let i = 1; i <= 10; i++) {
        sum = sum + parseInt(cleanCPF.substring(i - 1, i)) * (12 - i);
    }
    
    remainder = (sum * 10) % 11;
    if ((remainder === 10) || (remainder === 11)) remainder = 0;
    if (remainder !== parseInt(cleanCPF.substring(10, 11))) return false;
    
    return true;
}

/**
 * Removes the numerical code from a bank name if present (e.g., "001 - Banco do Brasil" -> "Banco do Brasil").
 */
export function cleanBankName(name?: string): string {
  if (!name) return '';
  return name.includes(' - ') ? name.split(' - ')[1] : name;
}
