import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { format, parseISO, isValid, differenceInDays, startOfDay, parse } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { Customer, Proposal, ProposalStatusConfig, StatusBehavior } from './types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number | undefined | null) {
  const val = Number(amount) || 0;
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(val);
}

/**
 * 🛡️ STORAGE URL PROTECTOR V2
 * Utiliza variável de ambiente para o Project ID, evitando erros em múltiplos ambientes.
 */
export function getSafeStorageUrl(url?: string): string {
    if (!url || typeof url !== 'string') return url || '';
    if (url.includes('firebasestorage.googleapis.com') && !url.includes('userProject=')) {
        const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
        if (projectId) {
            const separator = url.includes('?') ? '&' : '?';
            return `${url}${separator}userProject=${projectId}`;
        }
    }

    return url;
}

/**
 * 🛡️ MOTOR DE DATAS V3 (DETECÇÃO DE FORMATO)
 * Resolve falhas de parsing entre ISO (DB) e BR (Input).
 */
export function parseDateSafe(dateStr: any): Date | null {
    if (!dateStr) return null;
    
    // Suporte para Timestamps do Firebase
    if (dateStr?.seconds) return new Date(dateStr.seconds * 1000);
    if (typeof dateStr.toDate === 'function') return dateStr.toDate();

    try {
        const str = String(dateStr);
        // 1. Tenta formato ISO (YYYY-MM-DD...)
        if (str.includes('-') && str.indexOf('-') === 4) {
            const date = parseISO(str);
            if (isValid(date)) return date;
        }

        // 2. Tenta formato BR (DD/MM/YYYY)
        if (str.includes('/')) {
            const date = parse(str, 'dd/MM/yyyy', new Date());
            if (isValid(date)) return date;
        }

        // 3. Fallback genérico
        const fallback = new Date(str);
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

/**
 * ⚡ CÁLCULO DE DIAS ÚTEIS (OTIMIZADO)
 * Conta os dias entre datas pulando fins de semana.
 */
/**
 * 🇧🇷 CÁLCULO DE FERIADOS NACIONAIS
 * Retorna um Set de strings no formato YYYY-MM-DD com os feriados do ano.
 */
function getBrazilianHolidays(year: number): Set<string> {
    const holidays = new Set<string>();
    
    // Feriados Fixos
    holidays.add(`${year}-01-01`); // Ano Novo
    holidays.add(`${year}-04-21`); // Tiradentes
    holidays.add(`${year}-05-01`); // Dia do Trabalho
    holidays.add(`${year}-07-09`); // Revolução Constitucionalista (SP - Comum em CRMs BR, mas nacional são os abaixo)
    holidays.add(`${year}-09-07`); // Independência
    holidays.add(`${year}-10-12`); // Nossa Senhora Aparecida
    holidays.add(`${year}-11-02`); // Finados
    holidays.add(`${year}-11-15`); // Proclamação da República
    holidays.add(`${year}-11-20`); // Dia da Consciência Negra (Nacional a partir de 2024)
    holidays.add(`${year}-12-25`); // Natal

    // Cálculo da Páscoa (Algoritmo de Gauss)
    const a = year % 19;
    const b = Math.floor(year / 100);
    const c = year % 100;
    const d = Math.floor(b / 4);
    const e = b % 4;
    const f = Math.floor((b + 8) / 25);
    const g = Math.floor((b - f + 1) / 3);
    const h = (19 * a + b - d - g + 15) % 30;
    const i = Math.floor(c / 4);
    const k = c % 4;
    const l = (32 + 2 * e + 2 * i - h - k) % 7;
    const m = Math.floor((a + 11 * h + 22 * l) / 451);
    const month = Math.floor((h + l - 7 * m + 114) / 31);
    const day = ((h + l - 7 * m + 114) % 31) + 1;
    
    const easter = new Date(year, month - 1, day);
    
    const addDate = (base: Date, days: number) => {
        const d = new Date(base);
        d.setDate(d.getDate() + days);
        holidays.add(d.toISOString().split('T')[0]);
    };

    addDate(easter, -48); // Segunda de Carnaval
    addDate(easter, -47); // Terça de Carnaval
    addDate(easter, -2);  // Sexta-feira Santa
    addDate(easter, 60);  // Corpus Christi

    return holidays;
}

/**
 * ⚡ CÁLCULO DE DIAS ÚTEIS (OTIMIZADO + FERIADOS)
 * Conta os dias entre datas pulando fins de semana e feriados nacionais.
 */
export function calculateBusinessDays(startDateStr: string | Date): number {
    const start = typeof startDateStr === 'string' ? parseDateSafe(startDateStr) : startDateStr;
    if (!start || isNaN(start.getTime())) return 0;
    
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    
    const curDate = new Date(start);
    curDate.setHours(0, 0, 0, 0);
    
    if (curDate > now) return 0;
    
    const diffDays = Math.abs(differenceInDays(now, curDate));
    if (diffDays > 365) return 260;

    let count = 0;
    curDate.setDate(curDate.getDate() + 1);

    // Cache de feriados por ano para evitar recálculo no loop
    const holidayCache: Record<number, Set<string>> = {};

    while (curDate <= now) {
        const year = curDate.getFullYear();
        if (!holidayCache[year]) {
            holidayCache[year] = getBrazilianHolidays(year);
        }

        const dayOfWeek = curDate.getDay();
        const dateStr = curDate.toISOString().split('T')[0];
        
        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
        const isHoliday = holidayCache[year].has(dateStr);

        if (!isWeekend && !isHoliday) {
            count++;
        }
        curDate.setDate(curDate.getDate() + 1);
    }
    return count;
}

/**
 * 📊 GESTÃO DE STATUS DINÂMICA
 * Normaliza o formato de status (string -> objeto) e utilitários de busca com suporte a semântica (behavior).
 */

function deduceStatusBehavior(statusId: string): StatusBehavior {
    const s = statusId.toLowerCase();
    if (s.includes('pago')) return 'success';
    if (s.includes('reprovado') || s.includes('indeferido') || s.includes('negado')) return 'rejection';
    if (s.includes('cancelado') || s.includes('desistência')) return 'canceled';
    if (s.includes('pendente')) return 'pending';
    return 'in_progress';
}

export function normalizeStatuses(statuses: (string | ProposalStatusConfig)[] | undefined | null): ProposalStatusConfig[] {
    if (!statuses || !Array.isArray(statuses)) return [];
    
    return statuses.map((s, index) => {
        if (typeof s === 'string') {
            return {
                id: s, 
                label: s,
                isActive: true,
                showOnDashboard: true,
                order: index,
                behavior: deduceStatusBehavior(s)
            };
        }
        return {
            ...s,
            behavior: s.behavior || deduceStatusBehavior(s.id)
        };
    }).sort((a, b) => a.order - b.order);
}

export function getStatusBehavior(statusId: string, configs: ProposalStatusConfig[]): StatusBehavior {
    if (!statusId) return 'pending';
    const config = configs.find(c => c.id === statusId);
    if (config?.behavior) return config.behavior;
    return deduceStatusBehavior(statusId);
}

export function getStatusLabel(statusId: string, configs: ProposalStatusConfig[]): string {
    if (!configs || configs.length === 0) return statusId;
    const config = configs.find(c => c.id === statusId);
    return config ? config.label : statusId;
}

export function getStatusColor(statusId: string, configs: ProposalStatusConfig[], themeColors: Record<string, string>): string | undefined {
    if (configs && configs.length > 0) {
        const config = configs.find(c => c.id === statusId);
        if (config?.color) return config.color;
    }
    
    const key = statusId.toUpperCase();
    return themeColors[key] || themeColors[statusId];
}

/**
 * ⚡ MOTOR DE INTELIGÊNCIA OPERACIONAL
 * Determina se uma proposta está em atraso crítico.
 */
export function isProposalCritical(p: Proposal, statusConfigs: ProposalStatusConfig[] = []): boolean {
    const behavior = getStatusBehavior(p.status, statusConfigs);
    if (behavior === 'success' || behavior === 'rejection' || behavior === 'canceled' || p.deleted === true) return false;

    // Captura a data da última ação no histórico
    const historyDates = (p.history || []).map(h => h.date);
    const lastHistoryDate = historyDates.length > 0 ? [...historyDates].sort().reverse()[0] : null;

    // Define a base de tempo por status
    let baseDate = p.statusUpdatedAt || p.dateDigitized;
    if (p.status === 'Aguardando Saldo' && p.statusAwaitingBalanceAt) {
        baseDate = p.statusAwaitingBalanceAt;
    }

    if (!baseDate) return false;
    
    const businessDays = calculateBusinessDays(baseDate);
    
    // Regras de atraso por tipo de status
    if (p.status === 'Aguardando Saldo' && businessDays >= 5) return true;
    if (behavior === 'in_progress' && businessDays >= 7) return true;
    if (behavior === 'pending' && businessDays >= 3) return true;

    return false;
}

export function validateCPF(cpf: string): boolean {
    const cleanCPF = String(cpf || '').replace(/[^\d]+/g, '');
    
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

export function cleanFirestoreData(data: any): any {
    if (data === null) return null;
    if (data === undefined) return undefined;
    if (data instanceof Date) return data.toISOString();
    
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

export function getSmartTags(customer: Customer, proposals: Proposal[] = [], statusConfigs: ProposalStatusConfig[] = []): { label: string; color: string }[] {
    const tags: { label: string; color: string }[] = [];
    const now = new Date();

    const age = getAge(customer.birthDate);
    if (age >= 74 && age <= 75) {
        tags.push({ label: 'ALERTA 75 ANOS', color: 'bg-red-500' });
    }

    const customerProposals = proposals.filter(p => p.customerId === customer.id && p.deleted !== true);
    const totalComm = customerProposals.reduce((s, p) => {
        const behavior = getStatusBehavior(p.status, statusConfigs);
        return s + (behavior === 'success' ? (p.amountPaid || 0) : 0);
    }, 0);
    
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
    
    if (customerProposals.some(p => {
        const behavior = getStatusBehavior(p.status, statusConfigs);
        return behavior === 'in_progress' || behavior === 'pending';
    })) {
        tags.push({ label: '⚖️ EM ESTEIRA', color: 'bg-blue-500' });
    }
    
    return tags;
}
