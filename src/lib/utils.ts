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
    return digitsOnly.length === 11;
}

export function getWhatsAppUrl(phone: string): string {
    const digitsOnly = phone.replace(/\D/g, '');
    return `https://wa.me/55${digitsOnly}`;
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

/**
 * 🛡️ BLINDAGEM FIRESTORE V8
 * Limpa recursivamente objetos e arrays, removendo propriedades 'undefined' 
 * que causam erros de runtime no Firebase.
 */
export function cleanFirestoreData(data: any): any {
    if (data === null || data === undefined) return null;
    
    // Evita processar datas ou outros objetos especiais como objetos comuns
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
