import type { ProductType, ProposalStatus, CommissionStatus } from './types';

/**
 * 🛠️ CONFIGURAÇÕES MESTRE LK RAMOS
 * Removido 'readonly' para garantir compatibilidade com o build do Next.js e TypeScript.
 */

export const productTypes: ProductType[] = ['Margem', 'Margem CLT', 'Saque Complementar', 'Cartão - Plástico', 'Cartão com saque', 'Portabilidade', 'Refin Port', 'Refin', 'Saque FGTS'];

export const proposalStatuses: ProposalStatus[] = ['Em Andamento', 'Aguardando Saldo', 'Pago', 'Saldo Pago', 'Pendente', 'Reprovado'];

export const commissionStatuses: CommissionStatus[] = ['Pendente', 'Paga', 'Parcial'];

export const approvingBodies: string[] = ['INSS', 'SPPREV', 'Federal', 'SIAPE', 'USP', 'GOVERNO', 'CLT', 'Outro'];

export const expenseCategories: string[] = ['Aluguel', 'Internet', 'Telefonia', 'Tráfego Pago', 'Salários', 'Impostos', 'Outros'];

export const defaultCustomerTags: string[] = ['💎 VIP', '✅ Margem Livre', '⚠️ Restrição', '📞 Receptivo', '🚀 Prospecção', '👴 Aposentado', '🏦 Servidor', '💼 CLT'];

export const defaultRejectionReasons: string[] = ['Retenção do cliente', 'Contrato já liquidado', 'Contrato não encontrado', 'Saldo devedor divergente', 'Erro de averbação', 'Desistência do cliente', 'Margem excedida', 'Vínculo empregatício incompatível'];

export const defaultRadarJustifications: string[] = [
  "Sem margem",
  "Banco não liberou",
  "Sem troco mínimo",
  "Cliente não quis",
  "Sem limite de saque",
  "Já atendido recentemente",
  "Venda fechada",
  "Cliente respondeu depois",
  "Outro"
];

export const defaultHistoryTopics: string[] = [
  '⏳ Aguardando retorno da CIP (Saldo)',
  '⏳ Aguardando desbloqueio benefício',
  '⏳ Aguardando portabilidade',
  '⌚ Aguardando pagamento saldo devedor',
  '✍️ Aguardando assinatura digital',
  '⚠️ Pendente reapresentação',
  '🏦 Proposta enviada ao sistema do banco',
  '📞 Tentativa de contato sem sucesso',
  '📑 Documentação em análise pela promotora',
  '✅ Averbação solicitada ao órgão',
  '🔍 Em análise de fraude/prevenção',
  '🚀 Cliente aceitou a oferta de Refin'
];

export const operationalSteps = [
  { id: 'formalization', label: 'Formalização', icon: 'send' },
  { id: 'documentation', label: 'Documentação', icon: 'file' },
  { id: 'signature', label: 'Checklist Promotora', icon: 'pen' },
  { id: 'approval', label: 'Averbação', icon: 'check' }
];

export const banks: string[] = [
  "Banco do Brasil S.A.",
  "Caixa Econômica Federal",
  "Bradesco S.A.",
  "Itaú Unibanco S.A.",
  "Santander (Brasil) S.A.",
  "Nu Pagamentos S.A. - Nubank",
  "Inter S.A.",
  "C6 S.A.",
  "Original S.A.",
  "BTG Pactual S.A.",
  "Safra S.A.",
  "Votorantim S.A.",
  "Citibank N.A.",
  "PAN S.A.",
  "Neon S.A.",
  "BMG S.A.",
  "Daycoval S.A.",
  "Alfa S.A.",
  "Sofisa S.A.",
  "Pine S.A.",
  "Indusval S.A.",
  "Agibank S.A.",
  "Modal S.A.",
  "da Amazônia S.A.",
  "do Nordeste do Brasil S.A.",
  "Banrisul - do Estado do Rio Grande do Sul S.A.",
  "BRB - de Brasília S.A.",
  "ABC Brasil S.A.",
  "Fibra S.A.",
  "Luso Brasileiro S.A.",
  "Rendimento S.A.",
  "Triângulo S.A. (Tribanco)",
  "Mercantil do Brasil S.A.",
  "Paraná S.A.",
  "Outro"
];
