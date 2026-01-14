export type Customer = {
  id: string;
  name: string;
  cpf: string;
  phone: string;
  email: string;
  dateOfBirth: string; // YYYY-MM-DD
};

export type ProductType =
  | 'Margin'
  | 'Margin CLT'
  | 'Supplementary Withdrawal'
  | 'Plastic Card'
  | 'Port'
  | 'Refin Port'
  | 'Refin'
  | 'FGTS Withdrawal';

export type ProposalStatus =
  | 'In Progress'
  | 'Awaiting Balance'
  | 'Approved'
  | 'Paid'
  | 'Rejected';

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
