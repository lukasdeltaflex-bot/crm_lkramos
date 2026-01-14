
import type { Customer, Proposal, ProductType, ProposalStatus, CommissionStatus } from './types';

export const customers: Customer[] = [
  { id: '1', name: 'João da Silva', cpf: '111.222.333-44', benefit: '123456789-0', phone: '(11) 98765-4321', email: 'joao.silva@example.com', dateOfBirth: '1955-03-15', observations: 'Cliente antigo, prefere contato por telefone.' },
  { id: '2', name: 'Maria Oliveira', cpf: '222.333.444-55', benefit: '234567890-1', phone: '(21) 91234-5678', email: 'maria.oliveira@example.com', dateOfBirth: '1949-11-20', observations: 'Possui 2 benefícios.' },
  { id: '3', name: 'Carlos Pereira', cpf: '333.444.555-66', benefit: '345678901-2', phone: '(31) 95555-4444', email: 'carlos.pereira@example.com', dateOfBirth: '1960-07-01' },
  { id: '4', name: 'Ana Costa', cpf: '444.555.666-77', benefit: '456789012-3', phone: '(41) 98888-7777', email: 'ana.costa@example.com', dateOfBirth: '1952-01-30' },
  { id: '5', name: 'Pedro Martins', cpf: '555.666.777-88', benefit: '567890123-4', phone: '(51) 97777-6666', email: 'pedro.martins@example.com', dateOfBirth: '1949-08-10', observations: 'Indicado por João da Silva.' },
  { id: '6', name: 'Sandra Santos', cpf: '666.777.888-99', benefit: '678901234-5', phone: '(61) 96666-5555', email: 'sandra.santos@example.com', dateOfBirth: '1968-12-05' },
  { id: '7', name: 'Bruno Lima', cpf: '777.888.999-00', benefit: '789012345-6', phone: '(71) 95432-1098', email: 'bruno.lima@example.com', dateOfBirth: '1970-02-25' },
  { id: '8', name: 'Lúcia Ferreira', cpf: '888.999.000-11', benefit: '890123456-7', phone: '(81) 99876-5432', email: 'lucia.ferreira@example.com', dateOfBirth: '1958-09-18' },
  { id: '9', name: 'Ricardo Almeida', cpf: '999.000.111-22', benefit: '901234567-8', phone: '(91) 98765-1234', email: 'ricardo.almeida@example.com', dateOfBirth: '1963-05-22' },
  { id: '10', name: 'Fernanda Rocha', cpf: '000.111.222-33', benefit: '012345678-9', phone: '(11) 91111-2222', email: 'fernanda.rocha@example.com', dateOfBirth: '1954-10-12', observations: 'Cliente solicitou não receber contatos de marketing.' },
];

export const proposals: Proposal[] = [
  {
    id: 'p1', proposalNumber: 'PRO123456', customerId: '1', product: 'Margem', table: 'Tabela A', term: 84,
    installmentAmount: 350.50, netAmount: 15000, grossAmount: 29442, status: 'Pago', approvingBody: 'INSS', commissionValue: 750,
    commissionStatus: 'Paga', amountPaid: 750, commissionPercentage: 5, promoter: 'Promotora X', bank: '104 - Caixa Econômica Federal', dateDigitized: '2024-01-10', dateApproved: '2024-01-12', datePaidToClient: '2024-01-15', commissionPaymentDate: '2024-02-01',
    operator: 'Operador 1', commissionBase: 'net', interestRate: 1.8
  },
  {
    id: 'p2', proposalNumber: 'PRO123457', customerId: '2', product: 'Portabilidade', table: 'Tabela B', term: 72,
    installmentAmount: 500.00, netAmount: 20000, grossAmount: 36000, status: 'Pendente', approvingBody: 'SPPREV', commissionValue: 1200,
    commissionStatus: 'Pendente', commissionPercentage: 6, promoter: 'Promotora Y', bank: '237 - Bradesco S.A.', dateDigitized: '2024-05-05',
    bankOrigin: '033 - Santander (Brasil) S.A.', operator: 'Operador 2', commissionBase: 'gross', interestRate: 1.9, debtBalanceArrivalDate: '2024-05-10',
  },
  {
    id: 'p3', proposalNumber: 'PRO123458', customerId: '3', product: 'Refin', table: 'Tabela C', term: 84,
    installmentAmount: 200.00, netAmount: 8000, grossAmount: 16800, status: 'Em Andamento', approvingBody: 'INSS', commissionValue: 400,
    commissionStatus: 'Pendente', commissionPercentage: 5, promoter: 'Promotora Z', bank: '341 - Itaú Unibanco S.A.', dateDigitized: '2024-07-01',
    operator: 'Operador 1', commissionBase: 'net', interestRate: 2.0
  },
  {
    id: 'p4', proposalNumber: 'PRO123459', customerId: '4', product: 'Cartão - Plástico', table: 'Cartão Benefício', term: 1,
    installmentAmount: 0, netAmount: 1500, grossAmount: 1500, status: 'Reprovado', approvingBody: 'INSS', commissionValue: 50,
    commissionStatus: 'Pendente', commissionPercentage: 3.33, promoter: 'Promotora X', bank: '077 - Inter S.A.', dateDigitized: '2024-04-15',
    operator: 'Operador 3', commissionBase: 'gross', interestRate: 22.0
  },
  {
    id: 'p5', proposalNumber: 'PRO123460', customerId: '5', product: 'Saque Complementar', table: 'Saque RMC', term: 1,
    installmentAmount: 0, netAmount: 2500, grossAmount: 2500, status: 'Saldo Pago', approvingBody: 'Federal', commissionValue: 125,
    commissionStatus: 'Paga', amountPaid: 125, commissionPercentage: 5, promoter: 'Promotora Y', bank: '260 - Nu Pagamentos S.A. - Nubank', dateDigitized: '2024-05-02', dateApproved: '2024-05-03', datePaidToClient: '2024-05-05', commissionPaymentDate: '2024-06-01',
    operator: 'Operador 2', commissionBase: 'net', interestRate: 0
  },
  {
    id: 'p6', proposalNumber: 'PRO123461', customerId: '6', product: 'Refin Port', table: 'Tabela D', term: 84,
    installmentAmount: 450.75, netAmount: 18000, grossAmount: 37863, status: 'Aguardando Saldo', approvingBody: 'INSS', commissionValue: 900,
    commissionStatus: 'Pendente', commissionPercentage: 5, promoter: 'Promotora Z', bank: '001 - Banco do Brasil S.A.', dateDigitized: '2024-06-20',
    operator: 'Operador 1', commissionBase: 'gross', interestRate: 1.85, debtBalanceArrivalDate: '2024-06-25'
  },
  {
    id: 'p7', proposalNumber: 'PRO123462', customerId: '1', product: 'Refin', table: 'Tabela A', term: 84,
    installmentAmount: 150.00, netAmount: 5000, grossAmount: 12600, status: 'Pago', approvingBody: 'SPPREV', commissionValue: 250,
    commissionStatus: 'Parcial', amountPaid: 200, commissionPercentage: 5, promoter: 'Promotora X', bank: '237 - Bradesco S.A.', dateDigitized: '2024-07-10', dateApproved: '2024-07-12', datePaidToClient: '2024-07-16', commissionPaymentDate: '2024-08-01',
    operator: 'Operador 3', commissionBase: 'net', interestRate: 1.95
  },
  {
    id: 'p8', proposalNumber: 'PRO123463', customerId: '7', product: 'Margem', table: 'Tabela F', term: 84,
    installmentAmount: 1000.00, netAmount: 40000, grossAmount: 84000, status: 'Pendente', approvingBody: 'INSS', commissionValue: 2000,
    commissionStatus: 'Pendente', commissionPercentage: 5, promoter: 'Promotora Y', bank: '341 - Itaú Unibanco S.A.', dateDigitized: '2024-07-25',
    operator: 'Operador 2', commissionBase: 'gross', interestRate: 1.75
  },
  {
    id: 'p9', proposalNumber: 'PRO123464', customerId: '8', product: 'Portabilidade', table: 'Tabela B', term: 60,
    installmentAmount: 800.00, netAmount: 30000, grossAmount: 48000, status: 'Em Andamento', approvingBody: 'Federal', commissionValue: 1800,
    commissionStatus: 'Pendente', commissionPercentage: 6, promoter: 'Promotora Z', bank: '077 - Inter S.A.', dateDigitized: '2023-11-01',
    bankOrigin: '041 - Banrisul - do Estado do Rio Grande do Sul S.A.', operator: 'Operador 1', commissionBase: 'gross', interestRate: 2.1, debtBalanceArrivalDate: '2023-11-10'
  },
  {
    id: 'p10', proposalNumber: 'PRO123465', customerId: '9', product: 'Margem', table: 'Tabela G', term: 84,
    installmentAmount: 650.00, netAmount: 25000, grossAmount: 54600, status: 'Saldo Pago', approvingBody: 'INSS', commissionValue: 1250,
    commissionStatus: 'Paga', amountPaid: 1250, commissionPercentage: 5, promoter: 'Promotora X', bank: '260 - Nu Pagamentos S.A. - Nubank', dateDigitized: '2023-12-10', dateApproved: '2023-12-12', datePaidToClient: '2023-12-15', commissionPaymentDate: '2024-01-01',
    operator: 'Operador 3', commissionBase: 'net', interestRate: 1.88
  },
  {
    id: 'p11', proposalNumber: 'PRO123466', customerId: '10', product: 'Refin Port', table: 'Tabela E', term: 84,
    installmentAmount: 300.00, netAmount: 12000, grossAmount: 25200, status: 'Pendente', approvingBody: 'SPPREV', commissionValue: 600,
    commissionStatus: 'Pendente', commissionPercentage: 5, promoter: 'Promotora Y', bank: '001 - Banco do Brasil S.A.', dateDigitized: '2024-07-02',
    operator: 'Operador 2', commissionBase: 'gross', interestRate: 1.99, debtBalanceArrivalDate: '2024-07-08'
  },
  {
    id: 'p12', proposalNumber: 'PRO123467', customerId: '2', product: 'Cartão - Plástico', table: 'Cartão Benefício', term: 1,
    installmentAmount: 0, netAmount: 1800, grossAmount: 1800, status: 'Saldo Pago', approvingBody: 'INSS', commissionValue: 90,
    commissionStatus: 'Parcial', amountPaid: 70, commissionPercentage: 5, promoter: 'Promotora Z', bank: '237 - Bradesco S.A.', dateDigitized: '2024-05-20', dateApproved: '2024-05-21', datePaidToClient: '2024-05-22', commissionPaymentDate: '2024-06-01',
    operator: 'Operador 1', commissionBase: 'net', interestRate: 23.5
  }
];

// Helper to get full customer object from proposal
export const getProposalsWithCustomerData = () => {
  return proposals.map(proposal => {
    const customer = customers.find(c => c.id === proposal.customerId);
    if (!customer) {
        throw new Error(`Cliente com id ${proposal.customerId} não encontrado para a proposta ${proposal.id}`);
    }
    return {
      ...proposal,
      customer,
    }
  });
};
