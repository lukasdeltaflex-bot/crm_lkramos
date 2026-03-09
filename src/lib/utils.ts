import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { format, parseISO, isValid, differenceInDays, startOfDay, parse } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { Customer, Proposal } from './types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(amount);
}

/**
 * 🛡️ MOTOR DE DATAS V3 (DETECÇÃO DE FORMATO)
 * Resolve falhas de parsing entre ISO (DB) e BR (Input).
 */
export function parseDateSafe(dateStr: string | undefined | null): Date | null {
    if (!dateStr) return null;
    
    try {
        // 1. Tenta formato ISO (YYYY-MM-DD...)
        if (dateStr.includes('-') && dateStr.indexOf('-') === 4) {
            const date = parseISO(dateStr);
            if (isValid(date)) return date;
        }

        // 2. Tenta formato BR (DD/MM/YYYY)
        if (dateStr.includes('/')) {
            const date = parse(dateStr, 'dd/MM/yyyy', new Date());
            if (isValid(date)) return date;
        }

        // 3. Fallback genérico (pode falhar em meses/dias invertidos dependendo do browser)
        const fallback = new Date(dateStr);
        return isValid(fallback) ? fallback : null;
    } catch (e) {
        return null;
    }
}

export function getAge(birthDate: string): number {
  const birth = parseDateSafe(birthDate);
  if (!birth) return 0;
  
  const today = new Date();
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
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ');
}

export function isWhatsApp(phone: string): boolean {
    if (!phone) return false;
    const digitsOnly = phone.replace(/\D/g, '');
    const baseNumber = digitsOnly.length >= 12 && digitsOnly.startsWith('55') 
        ? digitsOnly.substring(2) 
        : digitsOnly;
    return baseNumber.length >= 10 && baseNumber.length <= 11 && !/^(\d)\1+$/.test(baseNumber);
}

export function getWhatsAppUrl(phone: string): string {
    if (!phone) return "";
    const digitsOnly = phone.replace(/\D/g, '');
    const finalNumber = (digitsOnly.length === 10 || digitsOnly.length === 11) 
        ? `55${digitsOnly}` 
        : digitsOnly;
    return `https://api.whatsapp.com/send?phone=${finalNumber}`;
}

export function handlePhoneMask(value: string): string {
    if (!value) return "";
    let v = value.replace(/\D/g, "");
    if (v.length > 11) v = v.substring(0, 11);
    
    if (v.length > 10) {
        v = v.replace(/^(\d{2})(\d{5})(\d{4}).*/, "($1) $2-$3");
    } else if (v.length > 5) {
        v = v.replace(/^(\d{2})(\d{4})(\d{0,4}).*/, "($1) $2-$3");
    } else if (v.length > 2) {
        v = v.replace(/^(\d{2})(\d{0,5})/, "($1) $2");
    } else if (v.length > 0) {
        v = v.replace(/^(\d{0,2})/, "($1");
    }
    return v;
}

/**
 * 💰 MÁSCARA DE MOEDA EM TEMPO REAL
 * Formata números para o padrão visual BR (1.500,00) mantendo o valor numérico.
 */
export function formatCurrencyInput(value: number | undefined): string {
    if (value === undefined || isNaN(value)) return "";
    return new Intl.NumberFormat('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(value);
}

export function formatDateSafe(dateString?: string, formatStr: string = "dd/MM/yyyy"): string {
    const date = parseDateSafe(dateString);
    return date ? format(date, formatStr, { locale: ptBR }) : '-';
}

export function calculateBusinessDays(startDateStr: string | Date): number {
    const start = typeof startDateStr === 'string' ? parseDateSafe(startDateStr) : startDateStr;
    if (!start || isNaN(start.getTime())) return 0;
    
    let count = 0;
    const curDate = startOfDay(new Date(start));
    const now = startOfDay(new Date());
    
    // Começa a contar a partir do dia seguinte
    curDate.setDate(curDate.getDate() + 1);

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
    for (let i = 1; i <= 9; i++) sum = sum + parseInt(cleanCPF.substring(i - 1, i)) * (11 - i);
    remainder = (sum * 10) % 11;
    if ((remainder === 10) || (remainder === 11)) remainder = 0;
    if (remainder !== parseInt(cleanCPF.substring(9, 10))) return false;
    
    sum = 0;
    for (let i = 1; i <= 10; i++) sum = sum + parseInt(cleanCPF.substring(i - 1, i)) * (12 - i);
    remainder = (sum * 10) % 11;
    if ((remainder === 10) || (remainder === 11)) remainder = 0;
    if (remainder !== parseInt(cleanCPF.substring(10, 11))) return false;
    
    return true;
}

export function cleanBankName(name?: string): string {
  if (!name) return '';
  const cleaned = name.replace(/^\d+[\s-]*[-]*[\s]*/, '').trim().replace(/\s+/g, ' ');
  return cleaned || name;
}

/**
 * 🧹 LIMPEZA DE DADOS FIREBASE V2
 * Remove campos 'undefined' e garante que apenas objetos planos sejam enviados.
 * Refinado para ser compatível com Safari iOS e minificação.
 */
export function cleanFirestoreData(data: any): any {
    if (data === null) return null;
    if (data === undefined) return undefined;
    if (data instanceof Date) return data.toISOString();
    
    // Verificação de objeto plano segura para Safari
    const isPlainObject = (obj: any) => {
        return typeof obj === 'object' && obj !== null && Object.getPrototypeOf(obj) === Object.prototype;
    };

    if (typeof data === 'string') return data.trim();
    
    if (Array.isArray(data)) {
        return data.map(item => cleanFirestoreData(item)).filter(i => i !== undefined);
    }
    
    if (isPlainObject(data)) {
        const cleaned: any = {};
        Object.keys(data).forEach(key => {
            const val = data[key];
            if (val !== undefined) cleaned[key] = cleanFirestoreData(val);
        });
        return cleaned;
    }
    
    return data;
}

export function getSmartTags(customer: Customer, proposals: Proposal[] = []): { label: string; color: string }[] {
    const tags: { label: string; color: string }[] = [];
    const now = new Date();

    // 🛡️ ALERTA 75 ANOS: Identifica clientes se aproximando ou atingindo o limite de idade
    const age = getAge(customer.birthDate);
    if (age >= 74 && age <= 75) {
        tags.push({ label: 'ALERTA 75 ANOS', color: 'bg-red-500' }); // Cor sólida para evitar invisibilidade
    }

    const customerProposals = proposals.filter(p => p.customerId === customer.id);
    const totalComm = customerProposals.reduce((s, p) => s + (p.amountPaid || 0), 0);
    
    if (totalComm >= 5000) tags.push({ label: '💎 ELITE', color: 'bg-amber-500' });
    
    const hasRecent = customerProposals.some(p => {
        const d = parseDateSafe(p.dateDigitized);
        return d && differenceInDays(now, d) <= 30;
    });
    if (hasRecent) tags.push({ label: 'ATIVO', color: 'bg-orange-600' });
    
    const hasAnyInLast6Months = customerProposals.some(p => {
        const d = parseDateSafe(p.dateDigitized);
        return d && differenceInDays(now, d) <= 180;
    });
    if (!hasAnyInLast6Months && customerProposals.length > 0) tags.push({ label: '🧊 REATIVAR', color: 'bg-blue-400' });
    
    if (customerProposals.some(p => !['Pago', 'Reprovado', 'Saldo Pago'].includes(p.status))) {
        tags.push({ label: '⚖️ EM ESTEIRA', color: 'bg-blue-500' });
    }
    
    return tags;
}