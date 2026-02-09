
export type Benefit = {
  number: string;
  species?: string;
};

export type Attachment = {
  name: string;
  url: string;
  type: string;
  size: number;
};

export type ProposalHistoryEntry = {
  id: string;
  date: string; // ISO String
  message: string;
  userName?: string;
};

export type CustomerStatus = 'active' | 'inactive';

export type Customer = {
  id: string;
  numericId: number;
  name: string;
  cpf: string;
  gender?: 'Masculino' | 'Feminino';
  status?: CustomerStatus;
  benefits?: Benefit[];
  phone: string;
  phone2?: string;
  email?: string;
  birthDate: string; // YYYY-MM-DD
  observations?: string;
  ownerId: string;
  // Address fields
  cep?: string;
  street?: string;
  number?: string;
  complement?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  documents?: Attachment[]; // Central de documentos fixos
};

export type ProductType =
  | 'Margem'
  | 'Margem CLT'
  | 'Saque Complementar'
  | 'Cartão - Plástico'
  | 'Cartão com saque'
  | 'Portabilidade'
  | 'Refin Port'
  | 'Refin'
  | 'Saque FGTS';

export type ProposalStatus =
  | 'Em Andamento'
  | 'Aguardando Saldo'
  | 'Pago'
  | 'Saldo Pago'
  | 'Pendente'
  | 'Reprovado';

export type CommissionStatus = 'Pendente' | 'Paga' | 'Parcial';

export type BankConfig = {
  name: string;
  domain?: string;
};

export type Proposal = {
  id: string;
  ownerId: string;
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
  amountPaid: number;
  promoter: string;
  bank: string;
  dateDigitized: string; // YYYY-MM-DD
  dateApproved?: string; // YYYY-MM-DD
  datePaidToClient?: string; // YYYY-MM-DD
  commissionPaymentDate?: string; // YYYY-MM-DD
  bankOrigin?: string;
  debtBalanceArrivalDate?: string; // YYYY-MM-DD
  interestRate?: number;
  operator?: string;
  commissionBase?: 'gross' | 'net';
  selectedBenefitNumber?: string;
  attachments?: Attachment[];
  observations?: string;
  history?: ProposalHistoryEntry[];
};

export type UserSettings = {
  productTypes: string[];
  proposalStatuses: string[];
  commissionStatuses: string[];
  approvingBodies: string[];
  banks: string[];
  bankDomains?: Record<string, string>; // Mapeamento de Nome -> Domínio para ícones
  showBankLogos?: boolean;
};

export type UserProfile = {
  uid: string;
  email: string;
  fullName?: string;
  displayName?: string;
  photoURL?: string;
  birthDate?: string; // YYYY-MM-DD
  phone?: string;
}

export type FollowUpStatus = 'pending' | 'completed' | 'rescheduled' | 'cancelled';

export type FollowUp = {
  id: string;
  ownerId: string;
  contactName: string;
  contactPhone?: string;
  customerId?: string; // Opcional: link para cliente real
  referralInfo?: string; // Ex: "Esposo da Ana Silva"
  description: string;
  dueDate: string; // YYYY-MM-DD
  status: FollowUpStatus;
  createdAt: string;
  completedAt?: string;
  notes?: string;
};

export type ExpenseCategory = 'Aluguel' | 'Internet' | 'Telefonia' | 'Tráfego Pago' | 'Salários' | 'Impostos' | 'Outros';

export type Expense = {
  id: string;
  ownerId: string;
  description: string;
  amount: number;
  date: string; // YYYY-MM-DD
  category: ExpenseCategory;
};
