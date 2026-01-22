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
 * Checks if a phone number is likely a WhatsApp number.
 * Heuristic: checks if the number (after DDD) has 9 digits.
 * @param phone The phone number string, e.g., "(11) 98765-4321".
 * @returns True if it's likely a WhatsApp number.
 */
export function isWhatsApp(phone: string): boolean {
    if (!phone) return false;
    const digitsOnly = phone.replace(/\D/g, '');
    // Check if it has 11 digits (DDD + 9 digits for mobile)
    return digitsOnly.length === 11;
}

/**
 * Generates a WhatsApp click-to-chat URL.
 * @param phone The phone number string.
 * @returns The WhatsApp URL.
 */
export function getWhatsAppUrl(phone: string): string {
    const digitsOnly = phone.replace(/\D/g, '');
    // Assumes country code is Brazil (55)
    return `https://wa.me/55${digitsOnly}`;
}

/**
 * Calculates the number of business days (Mon-Fri) between a start date and now.
 * The count starts from the day after the startDate.
 * @param startDate The start date of the period.
 * @returns The total number of business days.
 */
export function calculateBusinessDays(startDate: Date): number {
    let count = 0;
    const curDate = new Date(startDate);
    const now = new Date();

    // Start counting from the next day
    curDate.setDate(curDate.getDate() + 1);

    // Normalize to the start of the day to ensure correct comparison
    curDate.setHours(0, 0, 0, 0);
    now.setHours(0, 0, 0, 0);

    while (curDate <= now) {
        const dayOfWeek = curDate.getDay();
        if (dayOfWeek !== 0 && dayOfWeek !== 6) { // 0=Sunday, 6=Saturday
            count++;
        }
        curDate.setDate(curDate.getDate() + 1);
    }
    return count;
}
