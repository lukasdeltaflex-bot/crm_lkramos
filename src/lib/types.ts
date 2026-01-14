export type Customer = {
  id: string;
  name: string;
  cpf: string;
  phone: string;
  email: string;
  dateOfBirth: string; // YYYY-MM-DD
};

export type ProductType =
  | 'Margem'
  | 'Margem CLT'
  | 'Saque Complementar'
  | 'Cartão de Crédito'
  | 'Portabilidade'
  | 'Refin da Port'
  | 'Refinanciamento'
  | 'Saque FGTS';

export type ProposalStatus =
  | 'Em Andamento'
  | 'Aguardando Saldo'
  | 'Aprovado'
  | 'Pago'
  | 'Rejeitado';

export type Proposal = {
  id: string;
  proposalNumber: string;
  customerId: string;
  product: ProductType;
  table: string;
  term: number;
  installmentAmount: number;
  netAmount: number;
  grossAmount: number;
  status: ProposalStatus;
  commissionValue: number;
  commissionPaid: boolean;
  dateDigitized: string; // YYYY-MM-DD
  dateApproved?: string; // YYYY-MM-DD
  datePaid?: string; // YYYY-MM-DD
  commissionPaymentDate?: string; // YYYY-MM-DD
};
