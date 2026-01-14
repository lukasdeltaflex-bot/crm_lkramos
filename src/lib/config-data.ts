
import type { ProductType, ProposalStatus, CommissionStatus } from './types';

export const productTypes: readonly ProductType[] = ['Margem', 'Margem CLT', 'Saque Complementar', 'Cartão - Plástico', 'Cartão com saque', 'Portabilidade', 'Refin Port', 'Refin', 'Saque FGTS'];
export const proposalStatuses: readonly ProposalStatus[] = ['Em Andamento', 'Aguardando Saldo', 'Pago', 'Saldo Pago', 'Pendente', 'Reprovado'];
export const commissionStatuses: readonly CommissionStatus[] = ['Pendente', 'Paga', 'Parcial'];
export const approvingBodies: readonly string[] = ['INSS', 'SPPREV', 'Federal', 'SIAPE', 'USP', 'GOVERNO', 'CLT', 'Outro'];

export const banks: readonly string[] = [
  "001 - Banco do Brasil S.A.",
  "104 - Caixa Econômica Federal",
  "237 - Bradesco S.A.",
  "341 - Itaú Unibanco S.A.",
  "033 - Santander (Brasil) S.A.",
  "260 - Nu Pagamentos S.A. - Nubank",
  "077 - Inter S.A.",
  "336 - C6 S.A.",
  "212 - Original S.A.",
  "208 - BTG Pactual S.A.",
  "422 - Safra S.A.",
  "655 - Votorantim S.A.",
  "745 - Citibank N.A.",
  "623 - PAN S.A.",
  "739 - Neon S.A.",
  "318 - BMG S.A.",
  "707 - Daycoval S.A.",
  "025 - Alfa S.A.",
  "626 - Sofisa S.A.",
  "643 - Pine S.A.",
  "653 - Indusval S.A.",
  "121 - Agibank S.A.",
  "746 - Modal S.A.",
  "003 - da Amazônia S.A.",
  "004 - do Nordeste do Brasil S.A.",
  "041 - Banrisul - do Estado do Rio Grande do Sul S.A.",
  "070 - BRB - de Brasília S.A.",
  "119 - ABC Brasil S.A.",
  "222 - Fibra S.A.",
  "600 - Luso Brasileiro S.A.",
  "083 - Rendimento S.A.",
  "102 - Triângulo S.A. (Tribanco)",
  "389 - Mercantil do Brasil S.A.",
  "751 - Paraná S.A.",
  "Outro"
];

    
