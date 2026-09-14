'use client';

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { BankIcon } from '@/components/bank-icon';
import { 
  cn, 
  formatCurrencyInput, 
  cleanBankName, 
  normalizeStatuses, 
  getStatusColor 
} from '@/lib/utils';
import * as configData from '@/lib/config-data';
import type { Customer, Proposal, ProposalStatus, UserSettings } from '@/lib/types';
import { toast } from '@/hooks/use-toast';
import { format, parse, isValid } from 'date-fns';
import { 
  Plus, 
  Trash2, 
  Save, 
  Loader2, 
  Sparkles, 
  Landmark, 
  CircleDollarSign, 
  ListChecks, 
  History, 
  Users, 
  Search, 
  CreditCard, 
  AlertTriangle,
  Percent,
  Send,
  FileCheck,
  PenTool,
  ShieldCheck,
  Zap,
  ArrowRight,
  Layers,
  Copy
} from 'lucide-react';
import { useTheme } from '@/components/theme-provider';
import { useUser } from '@/firebase';
import { summarizeNotes } from '@/ai/flows/summarize-notes-flow';

export interface ContractPortabilityData {
  status: ProposalStatus;
  rejectionReason?: string;
  originalContractNumber: string;
  bankOrigin: string;
  installmentAmount: number;
  grossAmount: number; // Saldo devedor
  bank: string;
  proposalNumber: string;
  approvingBody: string;
  table: string;
  remainingInstallments?: number;
  originalTerm?: number;
  interestRate?: number;
  dateDigitized: string; // dd/MM/yyyy
  debtBalanceArrivalDate?: string; // dd/MM/yyyy
  dateApproved?: string; // dd/MM/yyyy
  commissionBase: 'gross' | 'net';
  commissionPercentage: number;
  commissionValue: number;
  promoter: string;
  operator: string;
  checklist: Record<string, boolean>;
  observations: string;
}

export interface ContractRefinData {
  status: ProposalStatus;
  rejectionReason?: string;
  installmentAmount: number;
  netAmount: number; // Valor liberado ao cliente (troco)
  grossAmount: number; // Valor bruto do contrato
  bank: string;
  proposalNumber: string;
  approvingBody: string;
  table: string;
  term: number; // Prazo digitado em meses
  interestRate?: number;
  dateDigitized: string; // dd/MM/yyyy
  dateApproved?: string; // dd/MM/yyyy
  datePaidToClient?: string; // dd/MM/yyyy
  commissionBase: 'gross' | 'net';
  commissionPercentage: number;
  commissionValue: number;
  promoter: string;
  operator: string;
  checklist: Record<string, boolean>;
  observations: string;
}

export interface ContractPairItem {
  id: string;
  portabilidade: ContractPortabilityData;
  refin: ContractRefinData;
}

interface GroupedPortabilityFormProps {
  customers: Customer[];
  allProposals?: Proposal[];
  userSettings: UserSettings | null;
  onSubmit: (data: any) => void;
  onCancel: () => void;
  onOpenCustomerSearch: () => void;
  selectedCustomerFromSearch: Customer | null;
  onCustomerSearchSelectionHandled: () => void;
  isSaving?: boolean;
  initialCustomerId?: string;
  initialBenefitNumber?: string;
}

const applyDateMask = (value: string) => {
  let v = value.replace(/\D/g, '').substring(0, 8);
  if (v.length > 4) v = v.replace(/(\d{2})(\d{2})(\d)/, '$1/$2/$3');
  else if (v.length > 2) v = v.replace(/(\d{2})(\d)/, '$1/$2');
  return v;
};

const createDefaultPortability = (todayFormatted: string, operator = ''): ContractPortabilityData => ({
  status: 'Em Andamento',
  rejectionReason: '',
  originalContractNumber: '',
  bankOrigin: '',
  installmentAmount: 0,
  grossAmount: 0,
  bank: '',
  proposalNumber: '',
  approvingBody: 'INSS',
  table: '',
  remainingInstallments: 0,
  originalTerm: 84,
  interestRate: 0,
  dateDigitized: todayFormatted,
  debtBalanceArrivalDate: '',
  dateApproved: '',
  commissionBase: 'gross',
  commissionPercentage: 0,
  commissionValue: 0,
  promoter: '',
  operator,
  checklist: {
    formalization: false,
    documentation: false,
    signature: false,
    approval: false,
  },
  observations: '',
});

const createDefaultRefin = (todayFormatted: string, operator = ''): ContractRefinData => ({
  status: 'Em Andamento',
  rejectionReason: '',
  installmentAmount: 0,
  netAmount: 0,
  grossAmount: 0,
  bank: '',
  proposalNumber: '',
  approvingBody: 'INSS',
  table: '',
  term: 84,
  interestRate: 0,
  dateDigitized: todayFormatted,
  dateApproved: '',
  datePaidToClient: '',
  commissionBase: 'gross',
  commissionPercentage: 0,
  commissionValue: 0,
  promoter: '',
  operator,
  checklist: {
    formalization: false,
    documentation: false,
    signature: false,
    approval: false,
  },
  observations: '',
});

export function GroupedPortabilityForm({
  customers,
  allProposals = [],
  userSettings,
  onSubmit,
  onCancel,
  onOpenCustomerSearch,
  selectedCustomerFromSearch,
  onCustomerSearchSelectionHandled,
  isSaving = false,
  initialCustomerId = '',
  initialBenefitNumber = '',
}: GroupedPortabilityFormProps) {
  const { user } = useUser();
  const { statusColors } = useTheme();

  const todayFormatted = useMemo(() => format(new Date(), 'dd/MM/yyyy'), []);
  const defaultOperator = '';

  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(initialCustomerId);
  const [selectedBenefitNumber, setSelectedBenefitNumber] = useState<string>(initialBenefitNumber);

  const [contracts, setContracts] = useState<ContractPairItem[]>([
    {
      id: 'contract-1',
      portabilidade: createDefaultPortability(todayFormatted, defaultOperator),
      refin: createDefaultRefin(todayFormatted, defaultOperator),
    },
  ]);

  const [activeContractIndex, setActiveContractIndex] = useState<number>(0);
  const [activeSubTab, setActiveSubTab] = useState<'portabilidade' | 'refin'>('portabilidade');
  const [validationErrors, setValidationErrors] = useState<{ contractIdx: number; role: string; message: string } | null>(null);
  const [isSummarizing, setIsSummarizing] = useState(false);

  const activeConfigs = useMemo(
    () => normalizeStatuses(userSettings?.proposalStatuses || configData.proposalStatuses),
    [userSettings]
  );
  const rejectionReasons = userSettings?.rejectionReasons || configData.defaultRejectionReasons;
  const historyTopics = userSettings?.historyTopics || configData.defaultHistoryTopics;
  const approvingBodies = userSettings?.approvingBodies || configData.approvingBodies;
  const banks = userSettings?.banks || configData.banks;
  const showLogosSettings = userSettings?.showBankLogos ?? true;
  const bankDomainsMap = userSettings?.bankDomains;
  const approvingBodyDomainsMap = userSettings?.approvingBodyDomains;

  const selectedCustomer = useMemo(() => {
    return customers.find((c) => c.id === selectedCustomerId);
  }, [customers, selectedCustomerId]);

  useEffect(() => {
    if (selectedCustomerFromSearch) {
      setSelectedCustomerId(selectedCustomerFromSearch.id);
      if (selectedCustomerFromSearch.benefits && selectedCustomerFromSearch.benefits.length === 1) {
        setSelectedBenefitNumber(selectedCustomerFromSearch.benefits[0].number);
      }
      onCustomerSearchSelectionHandled();
    }
  }, [selectedCustomerFromSearch, onCustomerSearchSelectionHandled]);

  const memoizedBankOptions = useMemo(() => {
    return banks.map((b) => (
      <SelectItem key={b} value={b}>
        <div className="flex items-center gap-2">
          <BankIcon bankName={b} domain={bankDomainsMap?.[b]} showLogo={showLogosSettings} className="h-4 w-4" />
          <span className="font-bold text-xs uppercase">{cleanBankName(b)}</span>
        </div>
      </SelectItem>
    ));
  }, [banks, bankDomainsMap, showLogosSettings]);

  const memoizedApprovingBodyOptions = useMemo(() => {
    return approvingBodies.map((body) => (
      <SelectItem key={body} value={body}>
        <div className="flex items-center gap-2">
          <BankIcon bankName={body} domain={approvingBodyDomainsMap?.[body]} showLogo={showLogosSettings} className="h-4 w-4" />
          <span className="font-bold text-xs uppercase">{body}</span>
        </div>
      </SelectItem>
    ));
  }, [approvingBodies, approvingBodyDomainsMap, showLogosSettings]);

  const handleAddContract = () => {
    const newIdx = contracts.length + 1;
    // Herda valores padrão do contrato anterior para agilidade operacional
    const prevContract = contracts[contracts.length - 1];
    const newPort = createDefaultPortability(todayFormatted, defaultOperator);
    const newRefin = createDefaultRefin(todayFormatted, defaultOperator);

    if (prevContract) {
      newPort.bank = prevContract.portabilidade.bank;
      newPort.approvingBody = prevContract.portabilidade.approvingBody;
      newPort.promoter = prevContract.portabilidade.promoter;
      newPort.operator = prevContract.portabilidade.operator;
      newPort.table = prevContract.portabilidade.table;

      newRefin.bank = prevContract.refin.bank || prevContract.portabilidade.bank;
      newRefin.approvingBody = prevContract.refin.approvingBody;
      newRefin.promoter = prevContract.refin.promoter;
      newRefin.operator = prevContract.refin.operator;
      newRefin.table = prevContract.refin.table;
    }

    setContracts((prev) => [
      ...prev,
      {
        id: `contract-${Date.now()}`,
        portabilidade: newPort,
        refin: newRefin,
      },
    ]);
    setActiveContractIndex(newIdx - 1);
    setActiveSubTab('portabilidade');
  };

  const handleRemoveContract = (idxToRemove: number) => {
    if (contracts.length <= 1) {
      toast({ variant: 'destructive', title: 'Aviso', description: 'A operação deve conter ao menos 1 contrato.' });
      return;
    }
    setContracts((prev) => prev.filter((_, i) => i !== idxToRemove));
    if (activeContractIndex >= contracts.length - 1) {
      setActiveContractIndex(Math.max(0, contracts.length - 2));
    }
  };

  const updatePortabilityField = useCallback(
    <K extends keyof ContractPortabilityData>(field: K, value: ContractPortabilityData[K]) => {
      setContracts((prev) => {
        const next = [...prev];
        const currentPair = { ...next[activeContractIndex] };
        const updatedPort = { ...currentPair.portabilidade, [field]: value };

        // Recálculo automático de comissão
        if (field === 'commissionPercentage' || field === 'commissionBase' || field === 'grossAmount') {
          const baseAmount = updatedPort.commissionBase === 'gross' ? updatedPort.grossAmount : 0;
          const rawPercent = field === 'commissionPercentage' ? value : updatedPort.commissionPercentage;
          const percent = parseFloat(String(rawPercent).replace(',', '.')) || 0;
          updatedPort.commissionValue = parseFloat(((baseAmount * percent) / 100).toFixed(2));
        }

        // Auto-sincronização de conveniência para o Refin
        const updatedRefin = { ...currentPair.refin };
        if (field === 'bank' && !updatedRefin.bank) updatedRefin.bank = value as string;
        if (field === 'approvingBody') updatedRefin.approvingBody = value as string;
        if (field === 'promoter' && !updatedRefin.promoter) updatedRefin.promoter = value as string;
        if (field === 'operator' && !updatedRefin.operator) updatedRefin.operator = value as string;
        if (field === 'installmentAmount' && updatedRefin.installmentAmount === 0) {
          updatedRefin.installmentAmount = value as number;
        }

        currentPair.portabilidade = updatedPort;
        currentPair.refin = updatedRefin;
        next[activeContractIndex] = currentPair;
        return next;
      });
    },
    [activeContractIndex]
  );

  const updateRefinField = useCallback(
    <K extends keyof ContractRefinData>(field: K, value: ContractRefinData[K]) => {
      setContracts((prev) => {
        const next = [...prev];
        const currentPair = { ...next[activeContractIndex] };
        const updatedRefin = { ...currentPair.refin, [field]: value };

        // Recálculo automático de comissão
        if (field === 'commissionPercentage' || field === 'commissionBase' || field === 'grossAmount' || field === 'netAmount') {
          const baseAmount = updatedRefin.commissionBase === 'gross' ? updatedRefin.grossAmount : updatedRefin.netAmount;
          const rawPercent = field === 'commissionPercentage' ? value : updatedRefin.commissionPercentage;
          const percent = parseFloat(String(rawPercent).replace(',', '.')) || 0;
          updatedRefin.commissionValue = parseFloat(((baseAmount * percent) / 100).toFixed(2));
        }

        currentPair.refin = updatedRefin;
        next[activeContractIndex] = currentPair;
        return next;
      });
    },
    [activeContractIndex]
  );

  const handleSummarizeObs = async (role: 'portabilidade' | 'refin') => {
    const currentPair = contracts[activeContractIndex];
    const text = role === 'portabilidade' ? currentPair.portabilidade.observations : currentPair.refin.observations;
    if (!text || text.trim().length < 10) {
      toast({ variant: 'destructive', title: 'Texto curto', description: 'Escreva um parecer para a IA resumir.' });
      return;
    }
    setIsSummarizing(true);
    try {
      const summary = await summarizeNotes(text);
      if (role === 'portabilidade') updatePortabilityField('observations', summary);
      else updateRefinField('observations', summary);
      toast({ title: 'Observações resumidas com IA!' });
    } catch (e) {
      toast({ variant: 'destructive', title: 'Falha na IA' });
    } finally {
      setIsSummarizing(false);
    }
  };

  const handleValidateAndSubmit = () => {
    setValidationErrors(null);

    if (!selectedCustomerId) {
      toast({ variant: 'destructive', title: 'Cliente não selecionado', description: 'Selecione um cliente para vincular a operação.' });
      return;
    }

    // Validação estrita de todos os contratos antes do writeBatch
    for (let i = 0; i < contracts.length; i++) {
      const pair = contracts[i];
      const p = pair.portabilidade;
      const r = pair.refin;

      // Validação Portabilidade
      if (!p.originalContractNumber || p.originalContractNumber.trim() === '') {
        setActiveContractIndex(i);
        setActiveSubTab('portabilidade');
        setValidationErrors({ contractIdx: i + 1, role: 'Portabilidade', message: 'N° do contrato portado (origem) é obrigatório.' });
        toast({ variant: 'destructive', title: `Erro no Contrato ${i + 1} (Portabilidade)`, description: 'N° do contrato portado é obrigatório.' });
        return;
      }
      if (!p.bank || p.bank.trim() === '') {
        setActiveContractIndex(i);
        setActiveSubTab('portabilidade');
        setValidationErrors({ contractIdx: i + 1, role: 'Portabilidade', message: 'Banco digitado é obrigatório.' });
        toast({ variant: 'destructive', title: `Erro no Contrato ${i + 1} (Portabilidade)`, description: 'Banco digitado é obrigatório.' });
        return;
      }
      if (!p.proposalNumber || p.proposalNumber.trim() === '') {
        setActiveContractIndex(i);
        setActiveSubTab('portabilidade');
        setValidationErrors({ contractIdx: i + 1, role: 'Portabilidade', message: 'N° da proposta de Portabilidade é obrigatório.' });
        toast({ variant: 'destructive', title: `Erro no Contrato ${i + 1} (Portabilidade)`, description: 'N° da proposta é obrigatório.' });
        return;
      }
      if (!p.table || p.table.trim() === '') {
        setActiveContractIndex(i);
        setActiveSubTab('portabilidade');
        setValidationErrors({ contractIdx: i + 1, role: 'Portabilidade', message: 'Tabela utilizada é obrigatória.' });
        toast({ variant: 'destructive', title: `Erro no Contrato ${i + 1} (Portabilidade)`, description: 'Tabela é obrigatória.' });
        return;
      }
      if (!p.promoter || p.promoter.trim() === '') {
        setActiveContractIndex(i);
        setActiveSubTab('portabilidade');
        setValidationErrors({ contractIdx: i + 1, role: 'Portabilidade', message: 'Promotora é obrigatória.' });
        toast({ variant: 'destructive', title: `Erro no Contrato ${i + 1} (Portabilidade)`, description: 'Promotora é obrigatória.' });
        return;
      }
      if (!p.operator || p.operator.trim() === '') {
        setActiveContractIndex(i);
        setActiveSubTab('portabilidade');
        setValidationErrors({ contractIdx: i + 1, role: 'Portabilidade', message: 'Operador responsável é obrigatório.' });
        toast({ variant: 'destructive', title: `Erro no Contrato ${i + 1} (Portabilidade)`, description: 'Operador é obrigatório.' });
        return;
      }
      if (p.status === 'Reprovado' && (!p.rejectionReason || p.rejectionReason.trim() === '')) {
        setActiveContractIndex(i);
        setActiveSubTab('portabilidade');
        setValidationErrors({ contractIdx: i + 1, role: 'Portabilidade', message: 'Selecione o motivo da reprova.' });
        toast({ variant: 'destructive', title: `Erro no Contrato ${i + 1} (Portabilidade)`, description: 'Motivo da reprova obrigatório.' });
        return;
      }

      // Validação Refin da Portabilidade
      if (!r.proposalNumber || r.proposalNumber.trim() === '') {
        setActiveContractIndex(i);
        setActiveSubTab('refin');
        setValidationErrors({ contractIdx: i + 1, role: 'Refin da Portabilidade', message: 'N° da proposta do Refin é obrigatório.' });
        toast({ variant: 'destructive', title: `Erro no Contrato ${i + 1} (Refin)`, description: 'N° da proposta do Refin é obrigatório.' });
        return;
      }
      if (!r.bank || r.bank.trim() === '') {
        setActiveContractIndex(i);
        setActiveSubTab('refin');
        setValidationErrors({ contractIdx: i + 1, role: 'Refin da Portabilidade', message: 'Banco digitado do Refin é obrigatório.' });
        toast({ variant: 'destructive', title: `Erro no Contrato ${i + 1} (Refin)`, description: 'Banco digitado é obrigatório.' });
        return;
      }
      if (!r.table || r.table.trim() === '') {
        setActiveContractIndex(i);
        setActiveSubTab('refin');
        setValidationErrors({ contractIdx: i + 1, role: 'Refin da Portabilidade', message: 'Tabela do Refin é obrigatória.' });
        toast({ variant: 'destructive', title: `Erro no Contrato ${i + 1} (Refin)`, description: 'Tabela é obrigatória.' });
        return;
      }
      if (!r.term || r.term <= 0) {
        setActiveContractIndex(i);
        setActiveSubTab('refin');
        setValidationErrors({ contractIdx: i + 1, role: 'Refin da Portabilidade', message: 'Prazo digitado em meses é obrigatório.' });
        toast({ variant: 'destructive', title: `Erro no Contrato ${i + 1} (Refin)`, description: 'Prazo do Refin é obrigatório.' });
        return;
      }
      if (!r.promoter || r.promoter.trim() === '') {
        setActiveContractIndex(i);
        setActiveSubTab('refin');
        setValidationErrors({ contractIdx: i + 1, role: 'Refin da Portabilidade', message: 'Promotora do Refin é obrigatória.' });
        toast({ variant: 'destructive', title: `Erro no Contrato ${i + 1} (Refin)`, description: 'Promotora é obrigatória.' });
        return;
      }
      if (!r.operator || r.operator.trim() === '') {
        setActiveContractIndex(i);
        setActiveSubTab('refin');
        setValidationErrors({ contractIdx: i + 1, role: 'Refin da Portabilidade', message: 'Operador do Refin é obrigatório.' });
        toast({ variant: 'destructive', title: `Erro no Contrato ${i + 1} (Refin)`, description: 'Operador é obrigatório.' });
        return;
      }
      if (r.status === 'Reprovado' && (!r.rejectionReason || r.rejectionReason.trim() === '')) {
        setActiveContractIndex(i);
        setActiveSubTab('refin');
        setValidationErrors({ contractIdx: i + 1, role: 'Refin da Portabilidade', message: 'Selecione o motivo da reprova do Refin.' });
        toast({ variant: 'destructive', title: `Erro no Contrato ${i + 1} (Refin)`, description: 'Motivo da reprova obrigatório.' });
        return;
      }
    }

    const convertToIso = (dateStr?: string) => {
      if (!dateStr || dateStr.trim() === '') return null;
      try {
        const parsed = parse(dateStr, 'dd/MM/yyyy', new Date());
        return isValid(parsed) ? parsed.toISOString() : null;
      } catch {
        return null;
      }
    };

    // Formatação do payload agrupado
    const formattedContracts = contracts.map((pair, index) => ({
      index: index + 1,
      portabilidade: {
        ...pair.portabilidade,
        product: 'Portabilidade',
        customerId: selectedCustomerId,
        selectedBenefitNumber: selectedBenefitNumber || '',
        dateDigitized: convertToIso(pair.portabilidade.dateDigitized),
        debtBalanceArrivalDate: convertToIso(pair.portabilidade.debtBalanceArrivalDate),
        dateApproved: convertToIso(pair.portabilidade.dateApproved),
        netAmount: 0,
        term: pair.portabilidade.remainingInstallments || pair.portabilidade.originalTerm || 84,
      },
      refin: {
        ...pair.refin,
        product: 'Refin Port',
        customerId: selectedCustomerId,
        selectedBenefitNumber: selectedBenefitNumber || '',
        dateDigitized: convertToIso(pair.refin.dateDigitized),
        dateApproved: convertToIso(pair.refin.dateApproved),
        datePaidToClient: convertToIso(pair.refin.datePaidToClient),
      },
    }));

    onSubmit({
      isGroupedOperation: true,
      operationType: 'portabilidade_refin',
      customerId: selectedCustomerId,
      contracts: formattedContracts,
    });
  };

  const currentContract = contracts[activeContractIndex] || contracts[0];
  const currentPort = currentContract.portabilidade;
  const currentRefin = currentContract.refin;

  const currentRejectedPrevious = useMemo(() => {
    if (!allProposals || !currentPort.originalContractNumber || currentPort.originalContractNumber.trim().length < 5) return null;
    const cleanNum = currentPort.originalContractNumber.trim().toLowerCase();
    return allProposals.find(p => 
      p.originalContractNumber &&
      p.originalContractNumber.trim().toLowerCase() === cleanNum &&
      p.status === 'Reprovado'
    );
  }, [allProposals, currentPort.originalContractNumber]);

  const portStatusColor = currentPort.status ? getStatusColor(currentPort.status, activeConfigs, statusColors) : undefined;
  const refinStatusColor = currentRefin.status ? getStatusColor(currentRefin.status, activeConfigs, statusColors) : undefined;

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <ScrollArea className="flex-1 px-8">
        <div className="space-y-8 pb-10 pt-4">

          {/* Banner de Operação Agrupada */}
          <div className="p-4 rounded-3xl bg-blue-50/50 dark:bg-blue-950/20 border-2 border-blue-200 dark:border-blue-900 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-2xl bg-blue-500 text-white flex items-center justify-center font-bold shadow-md shadow-blue-500/20">
                <Layers className="h-5 w-5" />
              </div>
              <div>
                <h4 className="font-black text-sm uppercase tracking-tight text-blue-900 dark:text-blue-100">
                  Operação Casada: Portabilidade + Refin
                </h4>
                <p className="text-[11px] font-bold text-blue-600/80 dark:text-blue-300">
                  Cada contrato gerará 2 propostas reais vinculadas (Portabilidade + Refin Port). Total no lote: <span className="underline font-extrabold">{contracts.length} contrato(s) = {contracts.length * 2} propostas</span>.
                </p>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              onClick={handleAddContract}
              disabled={isSaving}
              className="h-11 px-5 rounded-2xl border-2 border-blue-500 text-blue-600 dark:text-blue-300 bg-white dark:bg-zinc-900 font-black text-xs uppercase tracking-wider hover:bg-blue-50 transition-all shadow-sm"
            >
              <Plus className="h-4 w-4 mr-1.5" /> Adicionar Contrato
            </Button>
          </div>

          {/* Seção 1: Dados do Cliente (Compartilhado com toda a operação) */}
          <div className="space-y-4">
            <h3 className="text-[11px] font-black uppercase tracking-[0.25em] text-primary/60 flex items-center gap-2">
              <Users className="h-4 w-4" /> Seção 1 – Dados do Cliente da Operação
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1.5 block">
                  Cliente Selecionado *
                </Label>
                <div className="flex items-center gap-3">
                  <div className="relative flex-1">
                    <Input
                      readOnly
                      value={selectedCustomer?.name || 'Clique em buscar para selecionar...'}
                      className="h-12 w-full bg-muted/20 font-black rounded-xl border-2 pr-10"
                    />
                    <Search className="absolute right-3 top-3.5 h-5 w-5 text-muted-foreground opacity-20" />
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={onOpenCustomerSearch}
                    disabled={isSaving}
                    className="h-12 px-6 rounded-xl font-bold border-2 border-primary/20 bg-primary/5 hover:bg-primary/10"
                  >
                    {selectedCustomerId ? 'Trocar' : 'Buscar'}
                  </Button>
                </div>
              </div>

              <div>
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1.5 block">
                  Nº Benefício Vincular
                </Label>
                <Select
                  value={selectedBenefitNumber}
                  onValueChange={setSelectedBenefitNumber}
                  disabled={!selectedCustomer || isSaving}
                >
                  <SelectTrigger className="h-12 rounded-xl border-2 px-4">
                    <div className="flex items-center gap-2 overflow-hidden">
                      <CreditCard className="h-4 w-4 shrink-0 text-primary/40" />
                      <SelectValue placeholder="Selecione o benefício..." />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    {selectedCustomer?.benefits?.map((b) => (
                      <SelectItem key={b.number} value={b.number} className="py-2.5">
                        <div className="flex items-center gap-2 overflow-hidden">
                          <span className="font-black text-sm tracking-tight text-foreground">{b.number}</span>
                          <span className="text-muted-foreground opacity-40">|</span>
                          <span className="text-[10px] font-bold text-muted-foreground uppercase truncate">
                            {b.species || 'Sem espécie'}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                    {(!selectedCustomer?.benefits || selectedCustomer.benefits.length === 0) && (
                      <SelectItem value="none" disabled>
                        Nenhum benefício cadastrado
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <Separator />

          {/* Alerta de Erro de Validação */}
          {validationErrors && (
            <Alert variant="destructive" className="rounded-2xl border-2 border-red-500 bg-red-50">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <AlertTitle className="font-black uppercase text-xs">
                Ajuste Necessário no Contrato #{validationErrors.contractIdx} ({validationErrors.role})
              </AlertTitle>
              <AlertDescription className="text-xs font-bold text-red-700">
                {validationErrors.message}
              </AlertDescription>
            </Alert>
          )}

          {/* Abas de Navegação entre Múltiplos Contratos */}
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-2 overflow-x-auto pb-2 custom-scrollbar">
              <div className="flex items-center gap-2">
                {contracts.map((cItem, idx) => {
                  const hasPrevRejected = Boolean(
                    allProposals &&
                    cItem.portabilidade?.originalContractNumber &&
                    cItem.portabilidade.originalContractNumber.trim().length >= 5 &&
                    allProposals.some(p => 
                      p.originalContractNumber &&
                      p.originalContractNumber.trim().toLowerCase() === cItem.portabilidade.originalContractNumber.trim().toLowerCase() &&
                      p.status === 'Reprovado'
                    )
                  );
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setActiveContractIndex(idx);
                        setValidationErrors(null);
                      }}
                      className={cn(
                        'px-5 py-2.5 rounded-2xl font-black text-xs uppercase tracking-wider transition-all border-2 flex items-center gap-2 select-none',
                        activeContractIndex === idx
                          ? 'bg-primary text-primary-foreground border-primary shadow-lg'
                          : 'bg-muted/30 text-muted-foreground border-transparent hover:border-border',
                        hasPrevRejected && activeContractIndex !== idx && 'border-amber-400/60 bg-amber-50/20 text-amber-900 dark:text-amber-200'
                      )}
                    >
                      <span>Contrato #{idx + 1}</span>
                      {hasPrevRejected && (
                        <span title="Contrato com histórico de reprova">
                          <AlertTriangle className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                        </span>
                      )}
                    {contracts.length > 1 && (
                      <span
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveContract(idx);
                        }}
                        title="Remover Contrato"
                        className="opacity-40 hover:opacity-100 hover:text-red-300 p-0.5"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </span>
                    )}
                  </button>
                );
              })}
              </div>

              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={handleAddContract}
                disabled={isSaving}
                className="h-10 px-4 rounded-xl font-bold text-xs uppercase text-primary hover:bg-primary/5"
              >
                <Plus className="h-4 w-4 mr-1" /> Novo Contrato
              </Button>
            </div>

            {/* Sub-Abas do Contrato Ativo: Portabilidade vs Refin */}
            <div className="p-1 rounded-2xl bg-muted/30 border-2 border-muted flex gap-2">
              <button
                type="button"
                onClick={() => setActiveSubTab('portabilidade')}
                className={cn(
                  'flex-1 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 select-none',
                  activeSubTab === 'portabilidade'
                    ? 'bg-background text-blue-600 shadow-md border border-blue-100'
                    : 'text-muted-foreground opacity-60 hover:opacity-100'
                )}
              >
                <span className="h-2 w-2 rounded-full bg-blue-500" />
                1. Portabilidade Pura (Contrato #{activeContractIndex + 1})
              </button>
              <button
                type="button"
                onClick={() => setActiveSubTab('refin')}
                className={cn(
                  'flex-1 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 select-none',
                  activeSubTab === 'refin'
                    ? 'bg-background text-emerald-600 shadow-md border border-emerald-100'
                    : 'text-muted-foreground opacity-60 hover:opacity-100'
                )}
              >
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                2. Refin da Portabilidade (Contrato #{activeContractIndex + 1})
              </button>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* CONTEÚDO: 1. PORTABILIDADE (DO CONTRATO ATIVO) */}
          {/* ========================================================================= */}
          {activeSubTab === 'portabilidade' && (
            <div className="space-y-8 animate-in fade-in duration-200">
              {currentRejectedPrevious && (
                <Alert variant="destructive" className="rounded-3xl border-2 border-red-500 bg-red-50 animate-in slide-in-from-top-4">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                  <AlertTitle className="font-black uppercase text-xs">Contrato com Histórico de Reprova</AlertTitle>
                  <AlertDescription className="text-[11px] font-bold text-red-700">
                    Este contrato ({currentPort.originalContractNumber}) já foi reprovado anteriormente nesta base. 
                    MOTIVO: <span className="underline">{currentRejectedPrevious.rejectionReason || "Não informado"}</span>. 
                    Verifique antes de prosseguir com a redigitação.
                  </AlertDescription>
                </Alert>
              )}

              {/* Seção 2: Produto e Status */}
              <div className="space-y-4">
                <h4 className="text-[11px] font-black uppercase tracking-[0.25em] text-blue-600 flex items-center gap-2">
                  <Landmark className="h-4 w-4" /> Portabilidade — Status & Dados da Origem
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1.5 block">
                      Status da Esteira *
                    </Label>
                    <Select
                      value={currentPort.status}
                      onValueChange={(val: ProposalStatus) => updatePortabilityField('status', val)}
                    >
                      <SelectTrigger
                        className="status-custom font-black text-[10px] uppercase tracking-widest border-2 rounded-full h-12 px-8"
                        style={portStatusColor ? ({ '--status-color': portStatusColor } as any) : {}}
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {activeConfigs
                          .filter((conf) => conf.isActive || conf.id === currentPort.status)
                          .map((conf) => (
                            <SelectItem key={conf.id} value={conf.id} className="text-[10px] font-bold uppercase">
                              {conf.label}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {currentPort.status === 'Reprovado' && (
                    <div>
                      <Label className="text-[10px] font-black uppercase tracking-widest text-red-600 mb-1.5 block">
                        Motivo da Reprova *
                      </Label>
                      <Select
                        value={currentPort.rejectionReason}
                        onValueChange={(val) => updatePortabilityField('rejectionReason', val)}
                      >
                        <SelectTrigger className="h-12 font-black rounded-xl border-2 border-red-200 bg-red-50/30 text-red-700">
                          <SelectValue placeholder="Selecione..." />
                        </SelectTrigger>
                        <SelectContent>
                          {rejectionReasons.map((r) => (
                            <SelectItem key={r} value={r}>
                              {r}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 rounded-3xl bg-blue-50/30 border-2 border-blue-100">
                  <div>
                    <Label className="text-[10px] font-black uppercase tracking-widest text-blue-600 mb-1.5 block">
                      N° Contrato Origem (Obrigatório) *
                    </Label>
                    <Input
                      placeholder="Número do contrato no banco anterior"
                      value={currentPort.originalContractNumber}
                      onChange={(e) => updatePortabilityField('originalContractNumber', e.target.value)}
                      onPaste={(e) => {
                        e.preventDefault();
                        const pasted = e.clipboardData.getData('text').replace(/\s+/g, '');
                        updatePortabilityField('originalContractNumber', pasted);
                      }}
                      className="h-12 font-black border-2 border-white rounded-xl"
                    />
                  </div>
                  <div>
                    <Label className="text-[10px] font-black uppercase tracking-widest text-blue-600 mb-1.5 block">
                      Banco Portado (Origem)
                    </Label>
                    <Select
                      value={currentPort.bankOrigin}
                      onValueChange={(val) => updatePortabilityField('bankOrigin', val)}
                    >
                      <SelectTrigger className="h-12 font-bold border-2 border-white rounded-xl">
                        <SelectValue placeholder="Selecione o banco de origem..." />
                      </SelectTrigger>
                      <SelectContent>{memoizedBankOptions}</SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Seção 3: Valores & Dados Bancários da Portabilidade */}
              <div className="space-y-4">
                <h4 className="text-[11px] font-black uppercase tracking-[0.25em] text-primary/60 flex items-center gap-2">
                  <CircleDollarSign className="h-4 w-4" /> Portabilidade — Valores & Contrato
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 rounded-3xl bg-muted/10 border-2 border-muted">
                  <div>
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1.5 block">
                      Valor da Parcela *
                    </Label>
                    <div className="relative">
                      <span className="absolute left-4 top-3.5 text-[10px] font-black opacity-30">R$</span>
                      <Input
                        type="text"
                        className="h-12 pl-10 font-black border-2 rounded-xl"
                        value={formatCurrencyInput(currentPort.installmentAmount)}
                        onChange={(e) =>
                          updatePortabilityField('installmentAmount', parseInt(e.target.value.replace(/\D/g, '')) / 100 || 0)
                        }
                      />
                    </div>
                  </div>

                  <div>
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1.5 block">
                      Saldo Devedor / Valor Bruto (Contrato) *
                    </Label>
                    <div className="relative">
                      <span className="absolute left-4 top-3.5 text-[10px] font-black opacity-30">R$</span>
                      <Input
                        type="text"
                        className="h-12 pl-10 font-black border-2 rounded-xl"
                        value={formatCurrencyInput(currentPort.grossAmount)}
                        onChange={(e) =>
                          updatePortabilityField('grossAmount', parseInt(e.target.value.replace(/\D/g, '')) / 100 || 0)
                        }
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1.5 block">
                      Banco Digitado (Destino) *
                    </Label>
                    <Select
                      value={currentPort.bank}
                      onValueChange={(val) => updatePortabilityField('bank', val)}
                    >
                      <SelectTrigger className="h-12 font-black border-2 rounded-xl">
                        <SelectValue placeholder="Selecione o banco..." />
                      </SelectTrigger>
                      <SelectContent>{memoizedBankOptions}</SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1.5 block">
                      N° Proposta Portabilidade *
                    </Label>
                    <Input
                      placeholder="000000000"
                      value={currentPort.proposalNumber}
                      onChange={(e) => updatePortabilityField('proposalNumber', e.target.value)}
                      onPaste={(e) => {
                        e.preventDefault();
                        const pasted = e.clipboardData.getData('text').replace(/\s+/g, '');
                        updatePortabilityField('proposalNumber', pasted);
                      }}
                      className="h-12 font-black border-2 rounded-xl"
                    />
                  </div>

                  <div>
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1.5 block">
                      Órgão Aprovador *
                    </Label>
                    <Select
                      value={currentPort.approvingBody}
                      onValueChange={(val) => updatePortabilityField('approvingBody', val)}
                    >
                      <SelectTrigger className="h-12 font-black rounded-xl border-2">
                        <SelectValue placeholder="Selecione o órgão..." />
                      </SelectTrigger>
                      <SelectContent>{memoizedApprovingBodyOptions}</SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1.5 block">
                      Tabela Utilizada *
                    </Label>
                    <Input
                      placeholder="Ex: Tabela Flex Port"
                      value={currentPort.table}
                      onChange={(e) => updatePortabilityField('table', e.target.value)}
                      className="h-12 font-bold border-2 rounded-xl"
                    />
                  </div>

                  <div>
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1.5 block">
                      Taxa de Juros (% a.m)
                    </Label>
                    <div className="relative">
                      <Input
                        type="number"
                        step="0.01"
                        value={currentPort.interestRate || ''}
                        onChange={(e) => updatePortabilityField('interestRate', parseFloat(e.target.value) || 0)}
                        className="h-12 font-black border-2 rounded-xl pr-10"
                      />
                      <Percent className="absolute right-4 top-3.5 h-4 w-4 opacity-30" />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 rounded-2xl bg-blue-50/30 border-2 border-blue-100">
                  <div>
                    <Label className="text-[10px] font-black uppercase tracking-widest text-blue-600 mb-1.5 block">
                      Parcelas Restantes
                    </Label>
                    <Input
                      type="number"
                      value={currentPort.remainingInstallments || ''}
                      onChange={(e) => updatePortabilityField('remainingInstallments', parseInt(e.target.value) || 0)}
                      className="h-12 font-black border-2 border-white rounded-xl"
                    />
                  </div>
                  <div>
                    <Label className="text-[10px] font-black uppercase tracking-widest text-blue-600 mb-1.5 block">
                      Prazo Contrato Original
                    </Label>
                    <Input
                      type="number"
                      value={currentPort.originalTerm || ''}
                      onChange={(e) => updatePortabilityField('originalTerm', parseInt(e.target.value) || 0)}
                      className="h-12 font-black border-2 border-white rounded-xl"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1.5 block">
                      Data Digitação *
                    </Label>
                    <Input
                      placeholder="dd/mm/aaaa"
                      value={currentPort.dateDigitized}
                      onChange={(e) => updatePortabilityField('dateDigitized', applyDateMask(e.target.value))}
                      maxLength={10}
                      className="h-12 font-black border-2 rounded-xl"
                    />
                  </div>

                  <div>
                    <Label className="text-[10px] font-black uppercase tracking-widest text-blue-600 mb-1.5 block">
                      Retorno Saldo Devedor
                    </Label>
                    <Input
                      placeholder="dd/mm/aaaa"
                      value={currentPort.debtBalanceArrivalDate}
                      onChange={(e) => updatePortabilityField('debtBalanceArrivalDate', applyDateMask(e.target.value))}
                      maxLength={10}
                      className="h-12 font-black border-2 border-blue-200 bg-blue-50/20 rounded-xl"
                    />
                  </div>

                  <div>
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1.5 block">
                      Data Averbação
                    </Label>
                    <Input
                      placeholder="dd/mm/aaaa"
                      value={currentPort.dateApproved}
                      onChange={(e) => updatePortabilityField('dateApproved', applyDateMask(e.target.value))}
                      maxLength={10}
                      className="h-12 font-black border-2 rounded-xl"
                    />
                  </div>
                </div>
              </div>

              {/* Seção 4: Comissionamento da Portabilidade */}
              <div className="space-y-4">
                <h4 className="text-[11px] font-black uppercase tracking-[0.25em] text-emerald-700 flex items-center gap-2">
                  <CircleDollarSign className="h-4 w-4" /> Portabilidade — Comissionamento
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6 rounded-3xl bg-emerald-50/20 border-2 border-emerald-100">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-emerald-700 block">Base Cálculo</Label>
                    <RadioGroup
                      value={currentPort.commissionBase}
                      onValueChange={(val: 'gross' | 'net') => updatePortabilityField('commissionBase', val)}
                      className="flex gap-4 pt-2"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="gross" id={`port-gross-${activeContractIndex}`} />
                        <Label htmlFor={`port-gross-${activeContractIndex}`} className="text-xs font-bold uppercase">
                          Bruto
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="net" id={`port-net-${activeContractIndex}`} />
                        <Label htmlFor={`port-net-${activeContractIndex}`} className="text-xs font-bold uppercase">
                          Líquido
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>

                  <div>
                    <Label className="text-[10px] font-black uppercase text-emerald-700 mb-1.5 block">
                      Porcentagem (%)
                    </Label>
                    <div className="relative">
                      <Input
                        type="text"
                        inputMode="decimal"
                        value={String(currentPort.commissionPercentage ?? '')}
                        onChange={(e) => {
                          const raw = e.target.value;
                          if (raw === '' || /^[0-9]*[,.]?[0-9]*$/.test(raw)) {
                            const numericVal = raw === '' || raw === ',' || raw === '.' ? 0 : parseFloat(raw.replace(',', '.')) || 0;
                            updatePortabilityField('commissionPercentage', numericVal as any);
                          }
                        }}
                        className="h-12 pr-10 font-black border-2 rounded-xl text-emerald-600"
                      />
                      <Percent className="absolute right-4 top-3.5 h-4 w-4 text-emerald-600/40" />
                    </div>
                  </div>

                  <div>
                    <Label className="text-[10px] font-black uppercase text-emerald-700 mb-1.5 block">
                      Vlr Comissão (R$)
                    </Label>
                    <div className="relative">
                      <span className="absolute left-4 top-3.5 text-[10px] font-black text-emerald-600/40">R$</span>
                      <Input
                        type="text"
                        className="h-12 pl-10 font-black border-2 rounded-xl text-emerald-600 bg-emerald-50/50"
                        value={formatCurrencyInput(currentPort.commissionValue)}
                        readOnly
                      />
                    </div>
                  </div>

                  <div>
                    <Label className="text-[10px] font-black uppercase text-emerald-700 mb-1.5 block">Promotora *</Label>
                    <Select
                      value={currentPort.promoter}
                      onValueChange={(val) => updatePortabilityField('promoter', val)}
                    >
                      <SelectTrigger className="h-12 font-bold border-2 rounded-xl">
                        <SelectValue placeholder="Selecione a promotora..." />
                      </SelectTrigger>
                      <SelectContent>
                        {userSettings?.promoters?.map((p) => (
                          <SelectItem key={p} value={p}>
                            <div className="flex items-center gap-2">
                              <BankIcon
                                bankName={p}
                                domain={userSettings?.promoterDomains?.[p]}
                                showLogo={userSettings?.showPromoterLogos ?? true}
                                className="h-4 w-4"
                              />
                              <span className="font-bold text-xs uppercase">{p}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-[10px] font-black uppercase text-emerald-700 mb-1.5 block">
                      Operador Responsável *
                    </Label>
                    <Input
                      placeholder="Nome do digitador"
                      value={currentPort.operator}
                      onChange={(e) => updatePortabilityField('operator', e.target.value)}
                      className="h-12 font-bold border-2 rounded-xl"
                    />
                  </div>
                </div>
              </div>

              {/* Seção 5: Checklist da Portabilidade */}
              <div className="space-y-4">
                <h4 className="text-[11px] font-black uppercase tracking-[0.25em] text-primary/60 flex items-center gap-2">
                  <ListChecks className="h-4 w-4" /> Portabilidade — Check-list Operacional
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { id: 'formalization', label: 'Formalização', icon: Send, color: 'text-blue-500' },
                    { id: 'documentation', label: 'Documentação', icon: FileCheck, color: 'text-orange-500' },
                    { id: 'signature', label: 'Checklist Promotora', icon: PenTool, color: 'text-purple-500' },
                    { id: 'approval', label: 'Averbação', icon: ShieldCheck, color: 'text-green-500' },
                  ].map((step) => {
                    const isChecked = !!currentPort.checklist?.[step.id];
                    return (
                      <div
                        key={step.id}
                        onClick={() =>
                          updatePortabilityField('checklist', {
                            ...currentPort.checklist,
                            [step.id]: !isChecked,
                          })
                        }
                        className={cn(
                          'p-4 rounded-2xl border-2 flex flex-col items-center justify-center gap-3 transition-all cursor-pointer select-none',
                          isChecked
                            ? 'bg-background border-primary shadow-md'
                            : 'bg-muted/30 border-transparent opacity-40 grayscale'
                        )}
                      >
                        <step.icon className={cn('h-5 w-5', isChecked && step.color)} />
                        <span className="text-[10px] font-black uppercase tracking-widest">{step.label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Seção 6: Observações da Portabilidade */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                    Observações Técnicas da Portabilidade
                  </Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-7 rounded-full text-[10px] font-bold px-3 border-primary/20 bg-primary/5 text-primary hover:bg-primary/10"
                    onClick={() => handleSummarizeObs('portabilidade')}
                    disabled={isSummarizing || !currentPort.observations}
                  >
                    {isSummarizing ? (
                      <Loader2 className="h-3 w-3 animate-spin mr-1.5" />
                    ) : (
                      <Sparkles className="h-3 w-3 mr-1.5" />
                    )}
                    Resumir com IA
                  </Button>
                </div>
                <Textarea
                  placeholder="Tokens de CIP, retenção, dados do contrato anterior..."
                  value={currentPort.observations}
                  onChange={(e) => updatePortabilityField('observations', e.target.value)}
                  className="min-h-[120px] rounded-2xl border-2 p-4"
                />
              </div>

              {/* Botão de Avanço Rápido para o Refin */}
              <div className="flex justify-end pt-2">
                <Button
                  type="button"
                  onClick={() => setActiveSubTab('refin')}
                  className="rounded-full px-6 font-black uppercase text-xs tracking-wider bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  Prosseguir para Refin da Portabilidade <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* CONTEÚDO: 2. REFIN DA PORTABILIDADE (DO CONTRATO ATIVO) */}
          {/* ========================================================================= */}
          {activeSubTab === 'refin' && (
            <div className="space-y-8 animate-in fade-in duration-200">
              {/* Seção 2: Status do Refin */}
              <div className="space-y-4">
                <h4 className="text-[11px] font-black uppercase tracking-[0.25em] text-emerald-600 flex items-center gap-2">
                  <Landmark className="h-4 w-4" /> Refin da Portabilidade — Status da Esteira
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1.5 block">
                      Status do Refin *
                    </Label>
                    <Select
                      value={currentRefin.status}
                      onValueChange={(val: ProposalStatus) => updateRefinField('status', val)}
                    >
                      <SelectTrigger
                        className="status-custom font-black text-[10px] uppercase tracking-widest border-2 rounded-full h-12 px-8"
                        style={refinStatusColor ? ({ '--status-color': refinStatusColor } as any) : {}}
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {activeConfigs
                          .filter((conf) => conf.isActive || conf.id === currentRefin.status)
                          .map((conf) => (
                            <SelectItem key={conf.id} value={conf.id} className="text-[10px] font-bold uppercase">
                              {conf.label}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {currentRefin.status === 'Reprovado' && (
                    <div>
                      <Label className="text-[10px] font-black uppercase tracking-widest text-red-600 mb-1.5 block">
                        Motivo da Reprova do Refin *
                      </Label>
                      <Select
                        value={currentRefin.rejectionReason}
                        onValueChange={(val) => updateRefinField('rejectionReason', val)}
                      >
                        <SelectTrigger className="h-12 font-black rounded-xl border-2 border-red-200 bg-red-50/30 text-red-700">
                          <SelectValue placeholder="Selecione..." />
                        </SelectTrigger>
                        <SelectContent>
                          {rejectionReasons.map((r) => (
                            <SelectItem key={r} value={r}>
                              {r}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
              </div>

              {/* Seção 3: Valores do Refin (Troco Liberado + Bruto + Parcela) */}
              <div className="space-y-4">
                <h4 className="text-[11px] font-black uppercase tracking-[0.25em] text-primary/60 flex items-center gap-2">
                  <CircleDollarSign className="h-4 w-4" /> Refin da Portabilidade — Valores & Troco
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6 rounded-3xl bg-muted/10 border-2 border-muted">
                  <div>
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1.5 block">
                      Valor da Parcela *
                    </Label>
                    <div className="relative">
                      <span className="absolute left-4 top-3.5 text-[10px] font-black opacity-30">R$</span>
                      <Input
                        type="text"
                        className="h-12 pl-10 font-black border-2 rounded-xl"
                        value={formatCurrencyInput(currentRefin.installmentAmount)}
                        onChange={(e) =>
                          updateRefinField('installmentAmount', parseInt(e.target.value.replace(/\D/g, '')) / 100 || 0)
                        }
                      />
                    </div>
                  </div>

                  <div>
                    <Label className="text-[10px] font-black uppercase tracking-widest text-emerald-600 mb-1.5 block">
                      Valor Liberado ao Cliente (Troco) *
                    </Label>
                    <div className="relative">
                      <span className="absolute left-4 top-3.5 text-[10px] font-black text-emerald-600/40">R$</span>
                      <Input
                        type="text"
                        className="h-12 pl-10 font-black border-2 border-emerald-200 bg-emerald-50/30 text-emerald-700 rounded-xl"
                        value={formatCurrencyInput(currentRefin.netAmount)}
                        onChange={(e) =>
                          updateRefinField('netAmount', parseInt(e.target.value.replace(/\D/g, '')) / 100 || 0)
                        }
                      />
                    </div>
                  </div>

                  <div>
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1.5 block">
                      Valor Bruto (Novo Contrato) *
                    </Label>
                    <div className="relative">
                      <span className="absolute left-4 top-3.5 text-[10px] font-black opacity-30">R$</span>
                      <Input
                        type="text"
                        className="h-12 pl-10 font-black border-2 rounded-xl"
                        value={formatCurrencyInput(currentRefin.grossAmount)}
                        onChange={(e) =>
                          updateRefinField('grossAmount', parseInt(e.target.value.replace(/\D/g, '')) / 100 || 0)
                        }
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1.5 block">
                      Banco Digitado *
                    </Label>
                    <Select value={currentRefin.bank} onValueChange={(val) => updateRefinField('bank', val)}>
                      <SelectTrigger className="h-12 font-black border-2 rounded-xl">
                        <SelectValue placeholder="Selecione o banco..." />
                      </SelectTrigger>
                      <SelectContent>{memoizedBankOptions}</SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1.5 block">
                      N° Proposta do Refin *
                    </Label>
                    <Input
                      placeholder="000000000"
                      value={currentRefin.proposalNumber}
                      onChange={(e) => updateRefinField('proposalNumber', e.target.value)}
                      className="h-12 font-black border-2 rounded-xl"
                    />
                  </div>

                  <div>
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1.5 block">
                      Órgão Aprovador *
                    </Label>
                    <Select
                      value={currentRefin.approvingBody}
                      onValueChange={(val) => updateRefinField('approvingBody', val)}
                    >
                      <SelectTrigger className="h-12 font-black rounded-xl border-2">
                        <SelectValue placeholder="Selecione o órgão..." />
                      </SelectTrigger>
                      <SelectContent>{memoizedApprovingBodyOptions}</SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1.5 block">
                      Tabela Utilizada *
                    </Label>
                    <Input
                      placeholder="Ex: Tabela Refin Port"
                      value={currentRefin.table}
                      onChange={(e) => updateRefinField('table', e.target.value)}
                      className="h-12 font-bold border-2 rounded-xl"
                    />
                  </div>

                  <div>
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1.5 block">
                      Prazo Digitado (Meses) *
                    </Label>
                    <Input
                      type="number"
                      value={currentRefin.term || ''}
                      onChange={(e) => updateRefinField('term', parseInt(e.target.value) || 0)}
                      className="h-12 font-black border-2 rounded-xl"
                    />
                  </div>

                  <div>
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1.5 block">
                      Taxa de Juros (% a.m)
                    </Label>
                    <div className="relative">
                      <Input
                        type="number"
                        step="0.01"
                        value={currentRefin.interestRate || ''}
                        onChange={(e) => updateRefinField('interestRate', parseFloat(e.target.value) || 0)}
                        className="h-12 font-black border-2 rounded-xl pr-10"
                      />
                      <Percent className="absolute right-4 top-3.5 h-4 w-4 opacity-30" />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1.5 block">
                      Data Digitação *
                    </Label>
                    <Input
                      placeholder="dd/mm/aaaa"
                      value={currentRefin.dateDigitized}
                      onChange={(e) => updateRefinField('dateDigitized', applyDateMask(e.target.value))}
                      maxLength={10}
                      className="h-12 font-black border-2 rounded-xl"
                    />
                  </div>

                  <div>
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1.5 block">
                      Data Averbação
                    </Label>
                    <Input
                      placeholder="dd/mm/aaaa"
                      value={currentRefin.dateApproved}
                      onChange={(e) => updateRefinField('dateApproved', applyDateMask(e.target.value))}
                      maxLength={10}
                      className="h-12 font-black border-2 rounded-xl"
                    />
                  </div>

                  <div>
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1.5 block">
                      Pagamento ao Cliente
                    </Label>
                    <Input
                      placeholder="dd/mm/aaaa"
                      value={currentRefin.datePaidToClient}
                      onChange={(e) => updateRefinField('datePaidToClient', applyDateMask(e.target.value))}
                      maxLength={10}
                      className="h-12 font-black border-2 rounded-xl"
                    />
                  </div>
                </div>
              </div>

              {/* Seção 4: Comissionamento do Refin */}
              <div className="space-y-4">
                <h4 className="text-[11px] font-black uppercase tracking-[0.25em] text-emerald-700 flex items-center gap-2">
                  <CircleDollarSign className="h-4 w-4" /> Refin da Portabilidade — Comissionamento
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6 rounded-3xl bg-emerald-50/20 border-2 border-emerald-100">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-emerald-700 block">Base Cálculo</Label>
                    <RadioGroup
                      value={currentRefin.commissionBase}
                      onValueChange={(val: 'gross' | 'net') => updateRefinField('commissionBase', val)}
                      className="flex gap-4 pt-2"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="gross" id={`refin-gross-${activeContractIndex}`} />
                        <Label htmlFor={`refin-gross-${activeContractIndex}`} className="text-xs font-bold uppercase">
                          Bruto
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="net" id={`refin-net-${activeContractIndex}`} />
                        <Label htmlFor={`refin-net-${activeContractIndex}`} className="text-xs font-bold uppercase">
                          Líquido
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>

                  <div>
                    <Label className="text-[10px] font-black uppercase text-emerald-700 mb-1.5 block">
                      Porcentagem (%)
                    </Label>
                    <div className="relative">
                      <Input
                        type="text"
                        inputMode="decimal"
                        value={String(currentRefin.commissionPercentage ?? '')}
                        onChange={(e) => {
                          const raw = e.target.value;
                          if (raw === '' || /^[0-9]*[,.]?[0-9]*$/.test(raw)) {
                            const numericVal = raw === '' || raw === ',' || raw === '.' ? 0 : parseFloat(raw.replace(',', '.')) || 0;
                            updateRefinField('commissionPercentage', numericVal as any);
                          }
                        }}
                        className="h-12 pr-10 font-black border-2 rounded-xl text-emerald-600"
                      />
                      <Percent className="absolute right-4 top-3.5 h-4 w-4 text-emerald-600/40" />
                    </div>
                  </div>

                  <div>
                    <Label className="text-[10px] font-black uppercase text-emerald-700 mb-1.5 block">
                      Vlr Comissão (R$)
                    </Label>
                    <div className="relative">
                      <span className="absolute left-4 top-3.5 text-[10px] font-black text-emerald-600/40">R$</span>
                      <Input
                        type="text"
                        className="h-12 pl-10 font-black border-2 rounded-xl text-emerald-600 bg-emerald-50/50"
                        value={formatCurrencyInput(currentRefin.commissionValue)}
                        readOnly
                      />
                    </div>
                  </div>

                  <div>
                    <Label className="text-[10px] font-black uppercase text-emerald-700 mb-1.5 block">Promotora *</Label>
                    <Select value={currentRefin.promoter} onValueChange={(val) => updateRefinField('promoter', val)}>
                      <SelectTrigger className="h-12 font-bold border-2 rounded-xl">
                        <SelectValue placeholder="Selecione a promotora..." />
                      </SelectTrigger>
                      <SelectContent>
                        {userSettings?.promoters?.map((p) => (
                          <SelectItem key={p} value={p}>
                            <div className="flex items-center gap-2">
                              <BankIcon
                                bankName={p}
                                domain={userSettings?.promoterDomains?.[p]}
                                showLogo={userSettings?.showPromoterLogos ?? true}
                                className="h-4 w-4"
                              />
                              <span className="font-bold text-xs uppercase">{p}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-[10px] font-black uppercase text-emerald-700 mb-1.5 block">
                      Operador Responsável *
                    </Label>
                    <Input
                      placeholder="Nome do digitador"
                      value={currentRefin.operator}
                      onChange={(e) => updateRefinField('operator', e.target.value)}
                      className="h-12 font-bold border-2 rounded-xl"
                    />
                  </div>
                </div>
              </div>

              {/* Seção 5: Checklist do Refin */}
              <div className="space-y-4">
                <h4 className="text-[11px] font-black uppercase tracking-[0.25em] text-primary/60 flex items-center gap-2">
                  <ListChecks className="h-4 w-4" /> Refin da Portabilidade — Check-list Operacional
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { id: 'formalization', label: 'Formalização', icon: Send, color: 'text-blue-500' },
                    { id: 'documentation', label: 'Documentação', icon: FileCheck, color: 'text-orange-500' },
                    { id: 'signature', label: 'Checklist Promotora', icon: PenTool, color: 'text-purple-500' },
                    { id: 'approval', label: 'Averbação', icon: ShieldCheck, color: 'text-green-500' },
                  ].map((step) => {
                    const isChecked = !!currentRefin.checklist?.[step.id];
                    return (
                      <div
                        key={step.id}
                        onClick={() =>
                          updateRefinField('checklist', {
                            ...currentRefin.checklist,
                            [step.id]: !isChecked,
                          })
                        }
                        className={cn(
                          'p-4 rounded-2xl border-2 flex flex-col items-center justify-center gap-3 transition-all cursor-pointer select-none',
                          isChecked
                            ? 'bg-background border-primary shadow-md'
                            : 'bg-muted/30 border-transparent opacity-40 grayscale'
                        )}
                      >
                        <step.icon className={cn('h-5 w-5', isChecked && step.color)} />
                        <span className="text-[10px] font-black uppercase tracking-widest">{step.label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Seção 6: Observações do Refin */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                    Observações Técnicas do Refin
                  </Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-7 rounded-full text-[10px] font-bold px-3 border-primary/20 bg-primary/5 text-primary hover:bg-primary/10"
                    onClick={() => handleSummarizeObs('refin')}
                    disabled={isSummarizing || !currentRefin.observations}
                  >
                    {isSummarizing ? (
                      <Loader2 className="h-3 w-3 animate-spin mr-1.5" />
                    ) : (
                      <Sparkles className="h-3 w-3 mr-1.5" />
                    )}
                    Resumir com IA
                  </Button>
                </div>
                <Textarea
                  placeholder="Detalhes sobre a liberação de troco, averbação do refin..."
                  value={currentRefin.observations}
                  onChange={(e) => updateRefinField('observations', e.target.value)}
                  className="min-h-[120px] rounded-2xl border-2 p-4"
                />
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Barra Inferior Fixa com Salvar Operação */}
      <div className="sticky bottom-0 px-8 py-5 border-t bg-background z-20 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-wider py-1 px-3">
            {contracts.length} Contrato(s) no Lote ({contracts.length * 2} Propostas)
          </Badge>
          <Button
            type="button"
            variant="ghost"
            onClick={onCancel}
            disabled={isSaving}
            className="text-xs font-bold text-muted-foreground hover:text-foreground"
          >
            Voltar ao Modo Unitário
          </Button>
        </div>

        <Button
          type="button"
          onClick={handleValidateAndSubmit}
          disabled={isSaving || isSummarizing}
          className="rounded-full px-10 font-black uppercase text-xs tracking-[0.2em] bg-[#00AEEF] hover:bg-[#0096D1] text-white shadow-2xl shadow-[#00AEEF]/30 transition-all border-none h-14"
        >
          {isSaving ? (
            <>
              <Loader2 className="mr-3 h-5 w-5 animate-spin" /> Gravando Lote...
            </>
          ) : (
            <>
              <Save className="mr-3 h-5 w-5" /> Salvar Operação ({contracts.length * 2} Propostas)
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
