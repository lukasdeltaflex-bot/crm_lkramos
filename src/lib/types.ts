
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

export type Customer = {
  id: string;
  numericId: number;
  name: string;
  cpf: string;
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
};

export type ReminderStatus = 'pending' | 'completed';

export type Reminder = {
  id: string;
  ownerId: string;
  title: string;
  description?: string;
  dueDate: string; // YYYY-MM-DD
  status: ReminderStatus;
  customerId?: string; // Link opcional para cliente existente
  createdAt: string;
};

export type UserSettings = {
  productTypes: string[];
  proposalStatuses: string[];
  commissionStatuses: string[];
  approvingBodies: string[];
  banks: string[];
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
