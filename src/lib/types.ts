export type Benefit = {
  number: string;
  species?: string;
  salary?: number; // Valor do benefício/salário mensal
  rmcBank?: string; // Banco do cartão RMC vinculado a este NB
  rccBank?: string; // Banco do cartão RCC vinculado a este NB
};

export type Attachment = {
  name: string;
  url: string;
  type: string;
  size: number;
  category?: string; // Categoria do documento (ex: RG, Extrato, Endereço)
};

export type ProposalHistoryEntry = {
  id: string;
  date: string; // ISO String
  message: string;
  userName?: string;
};

export type CustomerStatus = 'active' | 'inactive';

export type CustomerCard = {
  type: 'RMC' | 'RCC';
  bank: string;
};

export type Customer = {
  id: string;
  numericId: number;
  name: string;
  cpf: string;
  gender?: 'Masculino' | 'Feminino';
  status?: CustomerStatus;
  benefits?: Benefit[];
  cards?: CustomerCard[]; // Mantido para compatibilidade, mas priorizado via benefits
  tags?: string[]; // Etiquetas de classificação
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
  // Soft Delete
  deleted?: boolean;
  deletedAt?: string;
  deletedBy?: string;
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

export type ProposalHistory = ProposalHistoryEntry[];

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
  originalTerm?: number; // Novo: Prazo original para Portabilidade
  remainingInstallments?: number; // Novo: Parcelas restantes para Portabilidade
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
  statusAwaitingBalanceAt?: string; // ISO String - Quando entrou em Aguardando Saldo
  statusUpdatedAt?: string; // ISO String - Última vez que o status mudou
  interestRate?: number;
  operator?: string;
  commissionBase?: 'gross' | 'net';
  selectedBenefitNumber?: string;
  attachments?: Attachment[];
  observations?: string;
  history?: ProposalHistoryEntry[];
  checklist?: Record<string, boolean>; // Controle operacional por etapas
  originalContractNumber?: string; // Nº do contrato que está sendo portado
  rejectionReason?: string; // Motivo da reprova
  // Soft Delete
  deleted?: boolean;
  deletedAt?: string;
  deletedBy?: string;
};

export type UserSettings = {
  productTypes: string[];
  proposalStatuses: string[];
  commissionStatuses: string[];
  approvingBodies: string[];
  banks: string[];
  promoters?: string[];
  customerTags?: string[]; // Etiquetas oficiais de clientes
  tagColors?: Record<string, string>; // Cores das etiquetas
  expenseCategories: string[];
  rejectionReasons?: string[]; // Motivos de reprova de portabilidade
  historyTopics?: string[]; // Tópicos rápidos para a linha do tempo
  bankDomains?: Record<string, string>;
  promoterDomains?: Record<string, string>;
  showBankLogos?: boolean;
  showPromoterLogos?: boolean;
  // Appearance Elite
  customLogoURL?: string;
  containerStyle?: string;
  backgroundTexture?: string;
  colorIntensity?: string;
  animationStyle?: string;
  fontStyle?: string;
  radius?: string;
  sidebarStyle?: string;
  colorTheme?: string;
  statusColors?: Record<string, string>;
  auraStyle?: string;
  // Cloud Sync
  monthlyGoal?: number;
  dismissedAlerts?: string[];
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
  dueTime?: string; // HH:mm (Opcional)
  status: FollowUpStatus;
  createdAt: string;
  completedAt?: string;
  notes?: string;
  // Soft Delete
  deleted?: boolean;
  deletedAt?: string;
  deletedBy?: string;
};

export type ExpenseRecurrence = 'none' | 'monthly' | 'annually' | 'semi-annually' | 'installments';

export type Expense = {
  id: string;
  ownerId: string;
  description: string;
  amount: number;
  date: string; // YYYY-MM-DD
  category: string;
  paid: boolean;
  recurrence?: ExpenseRecurrence;
  installmentsCount?: number;
  installmentNumber?: number;
  groupId?: string; // Para identificar despesas do mesmo grupo/parcelamento
};

export type Lead = {
  id: string;
  ownerId: string;
  name: string;
  cpf: string;
  phone: string;
  birthDate: string;
  email?: string;
  motherName?: string;
  benefitNumber?: string;
  cep?: string;
  street?: string;
  number?: string;
  complement?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  requestedAmount?: number;
  maxInstallment?: number;
  intentType?: string;
  observations?: string;
  status: 'pending' | 'approved' | 'discarded';
  createdAt: string;
  documents?: Attachment[];
};

export type ManagementPromoter = {
  id: string;
  ownerId: string;
  name: string;
  partnerCode?: string; // Código de parceiro na promotora
  photoURL?: string; // Logo/Foto da promotora
  contactName?: string;
  phone?: string;
  whatsapp?: string;
  supportPhone?: string;
  email?: string;
  managerEmail?: string;
  observations?: string;
}
