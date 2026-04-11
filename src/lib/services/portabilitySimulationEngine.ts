import { PortabilityRule, SourceBankRule, ConditionRule } from '@/lib/types';
import { ExtractPortabilityDataOutput } from '@/ai/flows/extract-portability-data-flow';
import { differenceInDays, parse, parseISO, isValid } from 'date-fns';

function parseContractDate(dateStr?: string): Date | null {
    if (!dateStr) return null;
    try {
        // Tenta ISO primeiro
        let d = parseISO(dateStr);
        if (isValid(d)) return d;
        
        // Tenta DD/MM/YYYY
        d = parse(dateStr, 'dd/MM/yyyy', new Date());
        if (isValid(d)) return d;
        
        // Tenta YYYY-MM-DD
        d = parse(dateStr, 'yyyy-MM-dd', new Date());
        if (isValid(d)) return d;
        
        return null;
    } catch { return null; }
}

export type SimulationResultStatus = 'GREEN' | 'RED' | 'YELLOW';

export interface Scenarios {
  isPurePortability: boolean;
  canRefinance: boolean;
  usesAvailableMargin: boolean;
  theoreticalCashback: number;
}

export interface BankSimulationResult {
  ruleId: string;
  bankName: string;
  promoter: string;
  status: SimulationResultStatus;
  reasons: string[];
  manualAnalysisRequired: boolean;
  scenarios: Scenarios;
  score: number;
  minRate: number;
}

export function runSimulationForContract(
  customerData: ExtractPortabilityDataOutput,
  contract: NonNullable<ExtractPortabilityDataOutput['contracts']>[0],
  rules: PortabilityRule[]
): BankSimulationResult[] {
  const results: BankSimulationResult[] = [];

  for (const rule of rules) {
    if (!rule.isActive) continue;

    let status: SimulationResultStatus = 'GREEN';
    const reasons: string[] = [];
    
    // 1. Validar regras de Origem (SourceBankRules) - Exceções
    const sourceBankName = contract.sourceBank?.toLowerCase() || '';
    const installmentsPaid = contract.installmentsPaid ?? 0;
    const contractDate = parseContractDate((contract as any).contractStartDate);
    const contractDays = contractDate ? differenceInDays(new Date(), contractDate) : null;    let matchedSourceRule: SourceBankRule | undefined;
    if (sourceBankName && rule.sourceBankRules && rule.sourceBankRules.length > 0) {
      matchedSourceRule = rule.sourceBankRules.find(r => 
        sourceBankName.includes(r.bankName.toLowerCase()) || r.bankName.toLowerCase().includes(sourceBankName)
      );
      
      if (matchedSourceRule) {
        if (matchedSourceRule.isBlocked) {
          status = 'RED';
          reasons.push(`Banco de origem (${matchedSourceRule.bankName}) está bloqueado nesta regra.`);
        } else if (!matchedSourceRule.isAllowed) {
           status = 'RED';
           reasons.push(`Banco de origem (${matchedSourceRule.bankName}) não é permitido nesta regra.`);
        }
      }
    }

    // ---------------------------------------------------------
    // 2. Validação de Carência e Parcelas (Baseline vs Exceção)
    // ---------------------------------------------------------
    const t = rule.valuesRules;
    if (t && status !== 'RED') {
        // a) Zero Pagas (Exceção sobrescreve Geral)
        let allowsZero = t.allowsZeroPaidInstallments ?? true;
        if (matchedSourceRule && matchedSourceRule.allowsZeroPaid !== undefined) {
            allowsZero = matchedSourceRule.allowsZeroPaid;
        }
        if (installmentsPaid === 0 && !allowsZero) {
            status = 'RED';
            reasons.push(matchedSourceRule 
                ? `O banco de origem ${matchedSourceRule.bankName} não aceita contratos com 0 parcelas pagas.`
                : `Esta regra de banco não aceita contratos com 0 parcelas pagas.`);
        }

        // b) Mínimo de Parcelas Pagas (Exceção sobrescreve Geral)
        let minPAG = t.minPaidInstallmentsGeneral ?? 0;
        if (matchedSourceRule && matchedSourceRule.minPaidInstallments !== undefined) {
            minPAG = matchedSourceRule.minPaidInstallments;
        }
        if (status !== 'RED' && minPAG > 0 && installmentsPaid < minPAG) {
            status = 'RED';
            reasons.push(matchedSourceRule
                ? `Banco origem ${matchedSourceRule.bankName} exige no mínimo ${minPAG} parcelas pagas (possui ${installmentsPaid}).`
                : `Exige no mínimo ${minPAG} parcelas pagas (atualmente possui ${installmentsPaid}).`);
        }

        // c) Dias de Contrato (Exceção sobrescreve Geral)
        let minDays = t.minContractDays ?? 0;
        if (matchedSourceRule && matchedSourceRule.minContractDays !== undefined) {
            minDays = matchedSourceRule.minContractDays;
        }
        if (status !== 'RED' && minDays > 0) {
            if (contractDays === null) {
                status = 'YELLOW';
                reasons.push(`Data de início não extraída. Exigido carência de ${minDays} dias de contrato.`);
            } else if (contractDays < minDays) {
                status = 'RED';
                reasons.push(`Tempo de contrato insuficiente (${contractDays} dias). Exigido: ${minDays} dias.`);
            }
        }
    }

    // 3. Validação Financeira (Valores Mínimos)
    const v = rule.valuesRules;
    if (v) {
      if (v.minInstallment > 0 && (contract.installmentValue || 0) < v.minInstallment) {
        status = 'RED';
        reasons.push(`Parcela de R$ ${contract.installmentValue} é inferior ao mínimo exigido (R$ ${v.minInstallment}).`);
      }
      if (v.minBalance > 0 && (contract.outstandingBalance || 0) > 0 && (contract.outstandingBalance || 0) < v.minBalance) {
         // O saldo é menor que o mínimo exigido
         status = 'RED';
         reasons.push(`Saldo devedor de R$ ${contract.outstandingBalance} é inferior ao mínimo exigido (R$ ${v.minBalance}).`);
      }
    }

    // 3. Condicionais Dinâmicas
    if (rule.conditions && rule.conditions.length > 0) {
        for (const cond of rule.conditions) {
            if (cond.conditionType === 'byValue' && contract.outstandingBalance) {
                if (contract.outstandingBalance >= (cond.minValue || 0) && contract.outstandingBalance <= (cond.maxValue || 99999999)) {
                    if (cond.minInstallments && (contract.installmentsPaid || 0) < cond.minInstallments) {
                        status = 'RED';
                        reasons.push(`Devido a condicional de saldo, faltam parcelas: Exigido ${cond.minInstallments}, possui ${(contract.installmentsPaid || 0)}.`);
                    }
                }
            }
        }
    }

    // 4. Regras de Idade e Prazo (Estruturadas)
    if (rule.ageRules && rule.ageRules.length > 0) {
        const customerAge = customerData.age || 0;
        
        // Em portabilidade, a "Faixa de Valor" da regra etária geralmente refere-se ao Saldo Devedor.
        // Se o saldo não existir, o motor usará 0 como base (podendo impactar a seleção da regra).
        const currentContractValue = contract.outstandingBalance || 0; 
        
        // Fallback: se não tiver totalInstallments (prazo original), assume 84 meses para cálculo de risco etário
        const totalInstallments = contract.totalInstallments || 84; 
        const installmentsPaid = contract.installmentsPaid || 0;
        const remainingInstallments = Math.max(0, totalInstallments - installmentsPaid);

        if (!customerData.age) {
            status = 'YELLOW';
            reasons.push("Idade não extraída. Verifique se o cliente atende aos limites deste banco.");
        } else {
            // Filtra as regras que se aplicam ao valor da parcela/contrato deste cliente
            const applicableRules = rule.ageRules.filter(ar => {
                const minV = ar.minContractValue || 0;
                const maxV = ar.maxContractValue || 99999999;
                return currentContractValue >= minV && currentContractValue <= maxV;
            });

            for (const ageRule of applicableRules) {
                // Validação de Idade Atual
                if (ageRule.minAge && customerAge < ageRule.minAge) {
                    status = 'RED';
                    reasons.push(`Idade mínima não atingida: Possui ${customerAge} anos, exigido ${ageRule.minAge} anos para este valor.`);
                }
                if (ageRule.maxAge && customerAge > ageRule.maxAge) {
                    status = 'RED';
                    reasons.push(`Idade máxima excedida: Possui ${customerAge} anos, limite de ${ageRule.maxAge} anos para este valor.`);
                }
                
                // Validação de Prazo Máximo
                if (ageRule.maxInstallments && totalInstallments > ageRule.maxInstallments) {
                    status = 'RED';
                    reasons.push(`Prazo de ${totalInstallments}m excede o limite permitido (${ageRule.maxInstallments}m) para esta faixa.`);
                }
                
                // Cálculos de Idade no Final do Contrato
                const yearsRemaining = remainingInstallments / 12;
                const ageAtEnd = customerAge + yearsRemaining;
                
                // 🛡️ SEGURANÇA: Validar se os cálculos resultaram em números válidos antes de comparar
                if (isNaN(ageAtEnd)) {
                    status = 'YELLOW';
                    reasons.push("Dados de prazo ou idade insuficientes para cálculo preciso do fim do contrato.");
                } else {
                    // Idade Máxima Volante (Idade + Prazo Restante)
                    if (ageRule.maxAgeAtContractEnd && ageAtEnd > ageRule.maxAgeAtContractEnd) {
                        status = 'RED';
                        reasons.push(`Idade ao fim do contrato (${ageAtEnd.toFixed(1)} anos) excede o limite de ${ageRule.maxAgeAtContractEnd} anos.`);
                    }

                    // Idade Fixa de Encerramento
                    if (ageRule.contractMustEndByAge && ageAtEnd > ageRule.contractMustEndByAge) {
                        status = 'RED';
                        reasons.push(`Operação deve encerrar obrigatoriamente até os ${ageRule.contractMustEndByAge} anos.`);
                    }
                }
            }
        }
    }

    // 5. Regras Avançadas (Legado/Texto)
    if (rule.advancedRules?.rulesBySpecies && customerData.benefitSpecies) {
      if (rule.advancedRules.rulesBySpecies.toLowerCase().includes(customerData.benefitSpecies.toLowerCase())) {
         status = 'YELLOW';
         reasons.push(`Atenção a restrição de espécie: "${rule.advancedRules.rulesBySpecies}"`);
      }
    }

    // 5. Validação Manual
    if (rule.texts?.manualAnalysisRequired) {
      if (status !== 'RED') {
        status = 'YELLOW';
      }
      reasons.push("Esta operação exige OBRIGATORIAMENTE análise manual do digitador antes da inserção.");
    }

    // 6. Validação de falta de dados críticos
    if (!contract.installmentValue && v?.minInstallment > 0) {
      status = 'YELLOW';
      reasons.push("Regra insuficiente para decidir: Faltou extrair/informar o Valor da Parcela.");
    }
    if (contract.installmentsPaid === undefined && (rule.valuesRules?.minPaidInstallmentsGeneral || rule.sourceBankRules?.some(r=>r.minPaidInstallments > 0))) {
        status = 'YELLOW';
        reasons.push("Regra insuficiente para decidir: Faltou extrair/informar a Qtd. Parcelas Pagas.");
    }

    if (reasons.length === 0) {
        reasons.push("Todas as premissas numéricas cadastradas foram atendidas.");
    }

    // Cenários Teóricos (🛡️ SEGURANÇA: Proteção contra divisão por zero ou dados nulos)
    const usedRate = rule.rateRules?.minRefinRate || rule.rateRules?.minPortabilityRate || 1.66;
    const estimatedFactor = 0.023; // Fator médio estimado
    
    const theoreticalCashback = (contract.installmentValue && contract.outstandingBalance)
        ? ((contract.installmentValue / estimatedFactor) - (contract.outstandingBalance || 0)) 
        : 0; 
        
    const scenarios: Scenarios = {
        isPurePortability: rule.generalRules?.purePortability || false,
        canRefinance: (!rule.generalRules?.purePortability && ((theoreticalCashback > 0) || rule.generalRules?.requiresRefinancing)) || false,
        usesAvailableMargin: (rule.generalRules?.aggregatesMargin && (customerData.availableMargin || 0) > 0) || false,
        theoreticalCashback: (isNaN(theoreticalCashback) || theoreticalCashback < 0) ? 0 : theoreticalCashback
    };

    // Critérios de Ranking do Usuário:
    // 1: banco que realmente cabe com segurança (Sem análise manual) -> Max score
    // 2: maior valor de troco/liberação -> tie break 1
    // 3: menor taxa -> tie break 2 (- usedRate)
    let score = 0;
    if (status === 'GREEN') {
        score += 10000000;
        if (!rule.texts?.manualAnalysisRequired) {
            score += 5000000;
        }
    } else if (status === 'YELLOW') {
        score += 1000000;
    }
    
    score += scenarios.theoreticalCashback;
    score -= (usedRate * 1000);

    results.push({
      ruleId: rule.id,
      bankName: rule.bankName,
      promoter: rule.promoter,
      status,
      reasons,
      manualAnalysisRequired: rule.texts?.manualAnalysisRequired || false,
      scenarios,
      score,
      minRate: usedRate
    });
  }

  // Ordena pelo maior score (critério do usuário)
  return results.sort((a, b) => b.score - a.score);
}
