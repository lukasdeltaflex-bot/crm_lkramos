
export type Customer = {
  id: string;
  name: string;
  cpf: string;
  benefit: string;
  phone: string;
  email: string;
  dateOfBirth: string; // YYYY-MM-DD
  observations?: string;
};

export type ProductType =
  | 'Margem'
  | 'Margem CLT'
  | 'Saque Complementar'
  | 'Cartão - Plástico'
  | 'Portabilidade'
  | 'Refin Port'
  | 'Refin'
  | 'Saque FGTS';

export type ProposalStatus =
  | 'Em Andamento'
  | 'Aguardando Saldo'
  | 'Pago'
  | 'Rejeitado'
  | 'Saldo Pago'
  | 'Pendente';

export type CommissionStatus = 'Pendente' | 'Paga' | 'Parcial';

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
  approvingBody: string;
  commissionValue: number;
  commissionStatus: CommissionStatus;
  commissionPercentage: number;
  amountPaid?: number;
  promoter: string;
  bank: string;
  dateDigitized: string; // YYYY-MM-DD
  dateApproved?: string; // YYYY-MM-DD - Data de Averbação
  datePaidToClient?: string; // YYYY-MM-DD - Data de Pagamento ao Cliente
  commissionPaymentDate?: string; // YYYY-MM-DD
  bankOrigin?: string;
  debtBalanceArrivalDate?: string; // YYYY-MM-DD
  interestRate?: number;
  operator?: string;
  commissionBase?: 'gross' | 'net';
};
