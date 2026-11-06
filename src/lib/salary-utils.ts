import type { Customer, Benefit } from './types';
import { formatCurrency } from './utils';

export type SalaryFilter = {
  presetId?: string;
  min?: number;
  max?: number;
  label: string;
};

export const DEFAULT_SALARY_FILTER: SalaryFilter = {
  presetId: 'all',
  label: 'Todos os Salários',
};

export interface SalaryPreset {
  id: string;
  label: string;
  min?: number;
  max?: number;
}

export const SALARY_PRESETS: SalaryPreset[] = [
  { id: 'all', label: 'Todos os Salários' },
  { id: 'up_to_1621', label: 'Até R$ 1.621,00', max: 1621 },
  { id: '1621_to_2500', label: 'R$ 1.621,00 a R$ 2.500,00', min: 1621, max: 2500 },
  { id: '2500_to_3500', label: 'R$ 2.500,00 a R$ 3.500,00', min: 2500, max: 3500 },
  { id: '3500_to_5000', label: 'R$ 3.500,00 a R$ 5.000,00', min: 3500, max: 5000 },
  { id: 'above_5000', label: 'Acima de R$ 5.000,00', min: 5000 },
];

/**
 * 🛡️ CONVERSOR DEFENSIVO DE SALÁRIO DE BENEFÍCIO
 * Interpreta o valor numérico em Reais armazenado no benefício.
 * Trata valores nulos, undefined, vazios, zero, negativos e strings legadas.
 * Retorna o número em Reais ou null caso seja inválido / não informado.
 */
export function parseSalary(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null;

  if (typeof value === 'number') {
    if (isNaN(value) || !isFinite(value) || value <= 0) return null;
    return value;
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return null;

    // Remove caracteres não numéricos exceto vírgula e ponto
    const cleaned = trimmed.replace(/[^\d.,]/g, '').trim();
    if (!cleaned) return null;

    let normalized = cleaned;
    if (cleaned.includes(',') && cleaned.includes('.')) {
      normalized = cleaned.replace(/\./g, '').replace(',', '.');
    } else if (cleaned.includes(',')) {
      normalized = cleaned.replace(',', '.');
    }

    const parsed = parseFloat(normalized);
    if (isNaN(parsed) || !isFinite(parsed) || parsed <= 0) return null;
    return parsed;
  }

  return null;
}

/**
 * 🎯 AVALIAÇÃO INDIVIDUAL DE BENEFÍCIOS
 * Regra Obrigatória:
 * - O cliente é aprovado se PELO MENOS UM benefício possuir salário dentro da faixa [min, max].
 * - Não soma os salários.
 * - Não calcula média.
 * - Não duplica clientes.
 * - Limites são inclusivos (>= min e <= max).
 */
export function customerMatchesSalaryFilter(
  customer: Customer,
  min?: number,
  max?: number
): boolean {
  // Se nenhum limite foi definido, aceita qualquer cliente
  if (min === undefined && max === undefined) {
    return true;
  }

  const benefits: Benefit[] | undefined = customer.benefits;
  if (!benefits || !Array.isArray(benefits) || benefits.length === 0) {
    return false;
  }

  return benefits.some((b) => {
    const salary = parseSalary(b?.salary);
    if (salary === null) return false;

    if (min !== undefined && salary < min) return false;
    if (max !== undefined && salary > max) return false;

    return true;
  });
}

/**
 * 🏷️ GERAÇÃO DE RÓTULO AMIGÁVEL DA FAIXA
 */
export function formatSalaryLabel(min?: number, max?: number): string {
  if (min === undefined && max === undefined) return 'Todos os Salários';
  if (min !== undefined && max !== undefined) {
    return `${formatCurrency(min)} a ${formatCurrency(max)}`;
  }
  if (min !== undefined) {
    return `A partir de ${formatCurrency(min)}`;
  }
  if (max !== undefined) {
    return `Até ${formatCurrency(max)}`;
  }
  return 'Todos os Salários';
}
