import { Firestore, doc, getDoc, setDoc, deleteDoc } from 'firebase/firestore';
import { cleanFirestoreData } from '@/lib/utils';
import type { Customer, Proposal } from '@/lib/types';
import type { ContractPairItem, ContractRefinData } from '@/app/proposals/grouped-portability-form';

export type DraftSaveStatus = 'idle' | 'saving' | 'saved' | 'error' | 'restoring';

export interface ProposalDraft {
  id: string; // 'active'
  ownerId: string;
  createdAt: string;
  updatedAt: string;
  mode: 'single' | 'grouped';
  sheetMode: 'new' | 'edit';
  proposalId?: string; // se editando proposta existente
  
  // Dados do modo unitário
  formData?: any;

  // Dados do modo agrupado (Portabilidade + Refin / Junção de Parcelas)
  groupedData?: {
    operationMode: 'individual' | 'junction';
    customerId: string;
    selectedBenefitNumber: string;
    contracts: ContractPairItem[];
    consolidatedRefin: ContractRefinData;
    activeContractIndex: number;
    activeSubTab: 'portabilidade' | 'refin';
  };

  // Metadados informativos para exibição no banner de recuperação
  summary: {
    customerName?: string;
    operationTypeLabel: string;
    contractsCount: number;
    description: string;
  };
}

const SESSION_KEY = 'lk_ramos_active_proposal_draft';

/**
 * Verifica se os dados preenchidos no modo unitário são significativos.
 */
export function hasSingleFormDataChanges(data: any): boolean {
  if (!data) return false;
  return Boolean(
    (data.customerId && data.customerId.trim() !== '') ||
    (data.proposalNumber && data.proposalNumber.trim() !== '') ||
    (data.originalContractNumber && data.originalContractNumber.trim() !== '') ||
    (Number(data.grossAmount) > 0) ||
    (Number(data.netAmount) > 0) ||
    (Number(data.installmentAmount) > 0) ||
    (data.bank && data.bank.trim() !== '') ||
    (data.promoter && data.promoter.trim() !== '') ||
    (data.observations && data.observations.trim() !== '') ||
    (data.attachments && data.attachments.length > 0)
  );
}

/**
 * Verifica se os dados preenchidos no modo agrupado (Junção de Parcelas) são significativos.
 */
export function hasGroupedDataChanges(groupedData: any): boolean {
  if (!groupedData) return false;
  if (groupedData.customerId && groupedData.customerId.trim() !== '') return true;
  if (groupedData.contracts && groupedData.contracts.length > 1) return true;

  if (Array.isArray(groupedData.contracts)) {
    for (const pair of groupedData.contracts) {
      const p = pair?.portabilidade;
      const r = pair?.refin;
      if (
        (p?.originalContractNumber && p.originalContractNumber.trim() !== '') ||
        (p?.proposalNumber && p.proposalNumber.trim() !== '') ||
        (p?.bank && p.bank.trim() !== '') ||
        (p?.bankOrigin && p.bankOrigin.trim() !== '') ||
        (Number(p?.installmentAmount) > 0) ||
        (Number(p?.grossAmount) > 0) ||
        (p?.observations && p.observations.trim() !== '') ||
        (r?.proposalNumber && r.proposalNumber.trim() !== '') ||
        (Number(r?.installmentAmount) > 0) ||
        (Number(r?.netAmount) > 0) ||
        (r?.observations && r.observations.trim() !== '')
      ) {
        return true;
      }
    }
  }

  const cr = groupedData.consolidatedRefin;
  if (cr) {
    if (
      (cr.proposalNumber && cr.proposalNumber.trim() !== '') ||
      (Number(cr.installmentAmount) > 0) ||
      (Number(cr.netAmount) > 0) ||
      (Number(cr.grossAmount) > 0) ||
      (cr.bank && cr.bank.trim() !== '') ||
      (cr.observations && cr.observations.trim() !== '')
    ) {
      return true;
    }
  }

  return false;
}

/**
 * Salva o rascunho ativo no Firestore e faz backup de sessão.
 * Isolado em `users/${userId}/proposalDrafts/active`.
 */
export async function saveProposalDraft(
  firestore: Firestore | null,
  userId: string,
  draftData: Omit<ProposalDraft, 'id' | 'ownerId' | 'updatedAt'>
): Promise<void> {
  if (!userId) return;

  const fullDraft: ProposalDraft = {
    ...draftData,
    id: 'active',
    ownerId: userId,
    updatedAt: new Date().toISOString(),
  };

  // Salva no sessionStorage para recuperação ultrarrápida
  try {
    if (typeof window !== 'undefined') {
      window.sessionStorage.setItem(`${SESSION_KEY}_${userId}`, JSON.stringify(fullDraft));
    }
  } catch (e) {
    // sessionStorage pode estar desabilitado em modo anônimo
  }

  // Persiste no Firestore
  if (firestore) {
    const draftDocRef = doc(firestore, 'users', userId, 'proposalDrafts', 'active');
    const cleaned = cleanFirestoreData(fullDraft);
    await setDoc(draftDocRef, cleaned, { merge: true });
  }
}

/**
 * Carrega o rascunho ativo do usuário.
 * Verifica validade e isolamento por `ownerId`.
 */
export async function loadProposalDraft(
  firestore: Firestore | null,
  userId: string
): Promise<ProposalDraft | null> {
  if (!userId) return null;

  // 1. Tenta carregar do Firestore primeiro
  if (firestore) {
    try {
      const draftDocRef = doc(firestore, 'users', userId, 'proposalDrafts', 'active');
      const snap = await getDoc(draftDocRef);
      if (snap.exists()) {
        const data = snap.data() as ProposalDraft;
        // Validação de isolamento: somente se pertencer ao próprio usuário
        if (data.ownerId === userId) {
          // Verifica se possui alterações reais
          const isMeaningful = data.mode === 'grouped'
            ? hasGroupedDataChanges(data.groupedData)
            : hasSingleFormDataChanges(data.formData);

          if (isMeaningful) {
            return data;
          }
        }
      }
    } catch (e) {
      console.warn('Falha ao ler rascunho do Firestore:', e);
    }
  }

  // 2. Fallback de sessionStorage
  try {
    if (typeof window !== 'undefined') {
      const raw = window.sessionStorage.getItem(`${SESSION_KEY}_${userId}`);
      if (raw) {
        const parsed = JSON.parse(raw) as ProposalDraft;
        if (parsed.ownerId === userId) {
          const isMeaningful = parsed.mode === 'grouped'
            ? hasGroupedDataChanges(parsed.groupedData)
            : hasSingleFormDataChanges(parsed.formData);

          if (isMeaningful) {
            return parsed;
          }
        }
      }
    }
  } catch (e) {
    // Silencia erros de parse
  }

  return null;
}

/**
 * Remove o rascunho ativo (após salvar a proposta com sucesso ou descarte explícito).
 */
export async function clearProposalDraft(
  firestore: Firestore | null,
  userId: string
): Promise<void> {
  if (!userId) return;

  try {
    if (typeof window !== 'undefined') {
      window.sessionStorage.removeItem(`${SESSION_KEY}_${userId}`);
    }
  } catch (e) {
    // ignore
  }

  if (firestore) {
    try {
      const draftDocRef = doc(firestore, 'users', userId, 'proposalDrafts', 'active');
      await deleteDoc(draftDocRef);
    } catch (e) {
      console.warn('Falha ao remover rascunho do Firestore:', e);
    }
  }
}
