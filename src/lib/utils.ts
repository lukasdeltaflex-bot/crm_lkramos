import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { format, parseISO, isValid } from 'date-fns';
import { ptBR } from 'date-fns/locale';

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

export function normalizeString(str: string): string {
  if (!str) return '';
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

export function isWhatsApp(phone: string): boolean {
    if (!phone) return false;
    const digitsOnly = phone.replace(/\D/g, '');
    
    // Requisitos LK RAMOS para ser WhatsApp (Celular Brasileiro Real):
    // 1. Deve ter exatamente 11 dígitos (DDD + 9 + 8 dígitos)
    const isValidLength = digitsOnly.length === 11;
    // 2. O terceiro dígito (início do número) deve ser '9'
    const startsWithNine = digitsOnly[2] === '9';
    // 3. Não deve ser uma sequência de números idênticos (ex: 11111111111)
    const isNotRepeated = !/^(\d)\1+$/.test(digitsOnly);

    return isValidLength && startsWithNine && isNotRepeated;
}

export function getWhatsAppUrl(phone: string): string {
    const digitsOnly = phone.replace(/\D/g, '');
    return `https://wa.me/55${digitsOnly}`;
}

export function handlePhoneMask(value: string): string {
    if (!value) return "";
    let v = value.replace(/\D/g, "");
    if (v.length > 11) v = v.substring(0, 11);
    
    if (v.length > 10) {
        // Celular: (00) 00000-0000
        v = v.replace(/^(\d{2})(\d{5})(\d{4}).*/, "($1) $2-$3");
    } else if (v.length > 5) {
        // Fixo: (00) 0000-0000
        v = v.replace(/^(\d{2})(\d{4})(\d{0,4}).*/, "($1) $2-$3");
    } else if (v.length > 2) {
        v = v.replace(/^(\d{2})(\d{0,5})/, "($1) $2");
    } else if (v.length > 0) {
        v = v.replace(/^(\d{0,2})/, "($1");
    }
    return v;
}

export function formatDateSafe(dateString?: string, formatStr: string = "dd/MM/yyyy"): string {
    if (!dateString) return '-';
    try {
        if (dateString.includes('T')) {
            const date = parseISO(dateString);
            return isValid(date) ? format(date, formatStr, { locale: ptBR }) : '-';
        }
        const parts = dateString.split('-');
        if (parts.length === 3) {
            const date = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
            return format(date, formatStr, { locale: ptBR });
        }
        return '-';
    } catch (e) {
        return '-';
    }
}

export function calculateBusinessDays(startDateStr: string | Date): number {
    const start = typeof startDateStr === 'string' 
        ? (startDateStr.includes('T') ? parseISO(startDateStr) : new Date(startDateStr + 'T00:00:00'))
        : new Date(startDateStr);
        
    if (isNaN(start.getTime())) return 0;
    
    let count = 0;
    const curDate = new Date(start);
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

export function cleanBankName(name?: string): string {
  if (!name) return '';
  const cleaned = name.replace(/^\d+[\s-]*[-]*[\s]*/, '').trim();
  return cleaned || name;
}

export function cleanFirestoreData(data: any): any {
    if (data === null || data === undefined) return null;
    if (data instanceof Date) return data.toISOString();
    if (Array.isArray(data)) {
        return data.map(item => cleanFirestoreData(item)).filter(i => i !== undefined);
    }
    if (typeof data === 'object') {
        const cleaned: any = {};
        Object.keys(data).forEach(key => {
            const val = data[key];
            if (val !== undefined) {
                cleaned[key] = cleanFirestoreData(val);
            }
        });
        return cleaned;
    }
    return data;
}
