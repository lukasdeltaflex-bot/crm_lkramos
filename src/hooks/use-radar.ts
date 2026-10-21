import { useMemo, useCallback } from 'react';
import { useFirestore, useUser, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, doc, setDoc, deleteDoc, addDoc } from 'firebase/firestore';
import type { Customer, Proposal, RadarTabulation, RadarSignalType } from '@/lib/types';
import { differenceInMonths, differenceInDays, addDays } from 'date-fns';
import { getAge, parseDateSafe, getStatusBehavior } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';

export type { RadarSignalType, RadarTabulation };

export interface RadarSignalData {
  id: string;
  clientId: string;
  type: RadarSignalType;
  baseDate: string;
  status: 'dispensada' | 'ativa';
  justificativa?: string;
  dismissedAt?: string;
  nextReentryDate?: string;
}

export interface RadarOpportunity {
  id: string; // clientId_type_baseDate
  customer: Customer;
  lastProposal: Proposal;
  type: RadarSignalType;
  baseDate: string;
  daysSincePaid?: number;
  monthsSincePaid?: number;
  dbSignal?: RadarSignalData;
}

export function useRadar(customers: Customer[] | undefined, proposals: Proposal[] | undefined, activeConfigs: any) {
  const { user } = useUser();
  const firestore = useFirestore();

  const signalsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, 'users', user.uid, 'radarSignals'));
  }, [firestore, user]);

  const { data: radarSignalsRaw } = useCollection<RadarSignalData>(signalsQuery);
  const radarSignals = radarSignalsRaw || [];

  const tabulationsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, 'users', user.uid, 'radarTabulations'));
  }, [firestore, user]);

  const { data: radarTabulationsRaw } = useCollection<RadarTabulation>(tabulationsQuery);
  const radarTabulations = radarTabulationsRaw || [];

  // Active tabulations ordered by date descending
  const activeTabulations = useMemo(() => {
    const list = radarTabulations.filter(t => t.status === 'ativa');
    list.sort((a, b) => {
      const dateA = a.tabulatedAt ? new Date(a.tabulatedAt).getTime() : 0;
      const dateB = b.tabulatedAt ? new Date(b.tabulatedAt).getTime() : 0;
      return dateB - dateA;
    });
    return list;
  }, [radarTabulations]);

  // Lookup map for fast checking whether a client has active permanent tabulation for a type
  const activeTabulationsMap = useMemo(() => {
    const map = new Map<string, RadarTabulation>();
    activeTabulations.forEach(tab => {
      map.set(`${tab.clientId}_${tab.type}`, tab);
    });
    return map;
  }, [activeTabulations]);

  // Calculate raw opportunities based on pure business rules
  const rawOpportunities = useMemo(() => {
    if (!proposals || !customers) return [];
    
    const now = new Date();
    const opportunities: RadarOpportunity[] = [];

    customers.forEach(customer => {
      // 0. TRAVA OPERACIONAL REQUERIDA: 
      // Se o cliente possuir QUALQUER proposta atualmente "em andamento" ou "pendente", 
      // ele NÃO deve aparecer no Radar (fica suspenso até o desfecho da proposta).
      const hasOngoingProposal = proposals.some(p => {
        if (p.customerId !== customer.id) return false;
        if (p.deleted) return false;
        const behavior = getStatusBehavior(p.status, activeConfigs);
        return behavior === 'in_progress' || behavior === 'pending';
      });

      if (hasOngoingProposal) {
        return; // Pula este cliente, suspendendo do Radar
      }

      // 1. Check for Retenção / Refinanciamento (Matured Contracts >= 12 months)
      if (customer.status === 'active' && getAge(customer.birthDate) < 75) {
        const maturedProposals = proposals.filter(p => {
          if (p.customerId !== customer.id) return false;
          if (p.deleted) return false;
          const behavior = getStatusBehavior(p.status, activeConfigs);
          if (behavior !== 'success') return false;
          if (!p.datePaidToClient) return false;
          
          const paidDate = parseDateSafe(p.datePaidToClient);
          if (!paidDate) return false;
          return differenceInMonths(now, paidDate) >= 12;
        });

        if (maturedProposals.length > 0) {
          const oldest = [...maturedProposals].sort((a,b) => (a.datePaidToClient || '').localeCompare(b.datePaidToClient || ''))[0];
          const paidDate = parseDateSafe(oldest.datePaidToClient);
          if (paidDate) {
            const months = differenceInMonths(now, paidDate);
            const baseDate = oldest.datePaidToClient!.substring(0, 10);
            
            opportunities.push({
              id: `${customer.id}_retencao_${baseDate}`,
              customer,
              lastProposal: oldest,
              type: 'retencao',
              baseDate,
              monthsSincePaid: months
            });
          }
        }
      }

      // 2. Check for Saque Complementar (>= 30 days since latest saque)
      if (customer.status === 'active') {
        const saques = proposals.filter(p => {
          if (p.customerId !== customer.id) return false;
          if (p.deleted) return false;
          if (p.product !== 'Saque Complementar') return false;
          const behavior = getStatusBehavior(p.status, activeConfigs);
          if (behavior !== 'success') return false;
          if (!p.datePaidToClient) return false;
          return true;
        });

        if (saques.length > 0) {
          const latestSaque = [...saques].sort((a,b) => (b.datePaidToClient || '').localeCompare(a.datePaidToClient || ''))[0];
          const paidDate = parseDateSafe(latestSaque.datePaidToClient);
          
          if (paidDate) {
            const days = differenceInDays(now, paidDate);
            if (days >= 30) {
              const baseDate = latestSaque.datePaidToClient!.substring(0, 10);
              opportunities.push({
                id: `${customer.id}_saque_${baseDate}`,
                customer,
                lastProposal: latestSaque,
                type: 'saque',
                baseDate,
                daysSincePaid: days
              });
            }
          }
        }
      }
    });

    return opportunities;
  }, [proposals, customers, activeConfigs]);

    // Merge raw opportunities with their states from Firestore
    const { activeSignals, dismissedSignals } = useMemo(() => {
      const active: RadarOpportunity[] = [];
      const dismissed: RadarOpportunity[] = [];
      const now = new Date();
  
      const signalMap = new Map<string, RadarSignalData>();
      // If there are multiple records for the same client+type+baseDate, the last one in the array wins. 
      // Ideally, there should only be one due to our save logic.
      radarSignals.forEach(sig => {
         const key = `${sig.clientId}_${sig.type}_${sig.baseDate}`;
         signalMap.set(key, sig);
      });
  
      const processedRawOppIds = new Set<string>();

      rawOpportunities.forEach(opp => {
        // Precedência Absoluta: clientes com tabulação permanente ativa para o tipo são completamente excluídos
        if (activeTabulationsMap.has(`${opp.customer.id}_${opp.type}`)) {
          return;
        }

        const dbSignal = signalMap.get(opp.id);
        
        const mergedOpp = { ...opp, dbSignal };
        processedRawOppIds.add(opp.id);
  
        if (dbSignal && dbSignal.status === 'dispensada') {
          // Recurrence logic for Saque Complementar
          if (mergedOpp.type === 'saque' && dbSignal.nextReentryDate) {
            const reEntryDate = new Date(dbSignal.nextReentryDate);
            if (now >= reEntryDate) {
              // Recurrence hit, treat as active
              active.push(mergedOpp);
              // It could be shown visually as a recurrence if we wanted, but the rule is just "voltar automaticamente"
            } else {
              dismissed.push(mergedOpp);
            }
          } else {
            // Normal dismissed (e.g. retenção without reentry date or missing it)
            dismissed.push(mergedOpp);
          }
        } else {
          // No signal doc or explicitly active -> active
          active.push(mergedOpp);
        }
      });
  
      // Fetch completely the dismissed list with any other signal that is 'dispensada'
      // but was not caught in the rawOpportunities (due to active constraints like ongoing proposals or older saques).
      // This ensures the Historical view of dismissed opportunities works correctly.
      radarSignals.forEach(sig => {
        if (sig.status === 'dispensada') {
          // Também ignora se estiver com tabulação permanente ativa
          if (activeTabulationsMap.has(`${sig.clientId}_${sig.type}`)) {
            return;
          }

          const key = `${sig.clientId}_${sig.type}_${sig.baseDate}`;
          if (!processedRawOppIds.has(key)) {
            const cust = customers?.find(c => c.id === sig.clientId);
            if (cust) {
              const matchingProposal = proposals?.find(
                p => p.customerId === cust.id && !p.deleted && p.datePaidToClient?.startsWith(sig.baseDate)
              ) || proposals?.find(p => p.customerId === cust.id && !p.deleted);
  
              if (matchingProposal) {
                dismissed.push({
                  id: key,
                  customer: cust,
                  lastProposal: matchingProposal,
                  type: sig.type,
                  baseDate: sig.baseDate,
                  dbSignal: sig
                });
              }
            }
          }
        }
      });

      // Sort active: Saque first (by days desc), then Retention (by months desc)
    active.sort((a, b) => {
       if (a.type !== b.type) return a.type === 'saque' ? -1 : 1;
       if (a.type === 'saque') return (b.daysSincePaid || 0) - (a.daysSincePaid || 0);
       return (b.monthsSincePaid || 0) - (a.monthsSincePaid || 0);
    });

    // Sort dismissed by date dismissed
    dismissed.sort((a, b) => {
        const dateA = a.dbSignal?.dismissedAt ? new Date(a.dbSignal.dismissedAt).getTime() : 0;
        const dateB = b.dbSignal?.dismissedAt ? new Date(b.dbSignal.dismissedAt).getTime() : 0;
        return dateB - dateA; // newest first
    });

    return { activeSignals: active, dismissedSignals: dismissed };
  }, [rawOpportunities, radarSignals, activeTabulationsMap, customers, proposals]);

  const dismissSignal = useCallback(async (opportunity: RadarOpportunity, justificativa: string) => {
    if (!user || !firestore) return;
    
    // We will use the opportunity.id as the document ID because it includes clientId_type_baseDate
    // This perfectly satisfies the "única por cliente + tipo + data base" requirement.
    const docRef = doc(firestore, 'users', user.uid, 'radarSignals', opportunity.id);
    
    // Recurrence logic for Saque
    const nextReentryDate = opportunity.type === 'saque' 
      ? addDays(new Date(), 10).toISOString() 
      : undefined;

    const signalData: Omit<RadarSignalData, 'id'> = {
      clientId: opportunity.customer.id,
      type: opportunity.type,
      baseDate: opportunity.baseDate,
      status: 'dispensada',
      justificativa,
      dismissedAt: new Date().toISOString(),
      ...(nextReentryDate && { nextReentryDate })
    };

    try {
      await setDoc(docRef, signalData, { merge: true });
      toast({ title: 'Oportunidade dispensada', description: 'Justificativa salva com sucesso.' });
    } catch (err) {
      console.error('Error dispensing signal', err);
      toast({ title: 'Erro', description: 'Não foi possível dispensar a oportunidade.', variant: 'destructive' });
    }
  }, [user, firestore]);

  const restoreSignal = useCallback(async (opportunity: RadarOpportunity) => {
    if (!user || !firestore) return;
    const docRef = doc(firestore, 'users', user.uid, 'radarSignals', opportunity.id);
    
    try {
      await setDoc(docRef, { status: 'ativa' }, { merge: true });
      toast({ title: 'Restaurado', description: 'Oportunidade voltou ao Radar com sucesso.' });
    } catch (err) {
      console.error('Error restoring signal', err);
      toast({ title: 'Erro', description: 'Não foi possível restaurar.', variant: 'destructive' });
    }
  }, [user, firestore]);

  const updateSignalJustification = useCallback(async (opportunity: RadarOpportunity, justificativa: string) => {
    if (!user || !firestore) return;
    const docRef = doc(firestore, 'users', user.uid, 'radarSignals', opportunity.id);
    try {
      await setDoc(docRef, { justificativa }, { merge: true });
      toast({ title: 'Motivo atualizado', description: 'A justificativa foi salva com sucesso.' });
    } catch (err) {
      console.error('Error updating signal justification', err);
      toast({ title: 'Erro', description: 'Não foi possível atualizar o motivo.', variant: 'destructive' });
    }
  }, [user, firestore]);

  const tabulateClient = useCallback(async (
    opportunity: RadarOpportunity,
    motive: string,
    details?: string
  ) => {
    if (!user || !firestore) return;

    const tabId = `${opportunity.customer.id}_${opportunity.type}`;
    const docRef = doc(firestore, 'users', user.uid, 'radarTabulations', tabId);

    const tabulationData: RadarTabulation = {
      id: tabId,
      clientId: opportunity.customer.id,
      customerName: opportunity.customer.name || 'Cliente',
      customerCpf: opportunity.customer.cpf || '',
      type: opportunity.type,
      bank: opportunity.lastProposal?.bank || '',
      motive,
      details: details?.trim() || '',
      tabulatedAt: new Date().toISOString(),
      tabulatedBy: user.email || user.uid,
      status: 'ativa'
    };

    try {
      await setDoc(docRef, tabulationData, { merge: true });
      toast({
        title: 'Tabulação Permanente Registrada',
        description: `${opportunity.customer.name} foi retirado permanentemente do Radar de Vendas.`
      });
    } catch (err) {
      console.error('Error tabulating client permanently', err);
      toast({
        title: 'Erro',
        description: 'Não foi possível registrar a tabulação permanente.',
        variant: 'destructive'
      });
      throw err;
    }
  }, [user, firestore]);

  const untabulateClient = useCallback(async (tabulation: RadarTabulation) => {
    if (!user || !firestore) return;
    const docRef = doc(firestore, 'users', user.uid, 'radarTabulations', tabulation.id);

    try {
      await setDoc(docRef, {
        status: 'revogada',
        revokedAt: new Date().toISOString(),
        revokedBy: user.email || user.uid
      }, { merge: true });

      toast({
        title: 'Tabulação Revertida',
        description: `A restrição de ${tabulation.customerName} foi removida. O cliente volta a ser avaliado pelas regras normais.`
      });
    } catch (err) {
      console.error('Error revoking permanent tabulation', err);
      toast({
        title: 'Erro',
        description: 'Não foi possível reverter a tabulação permanente.',
        variant: 'destructive'
      });
      throw err;
    }
  }, [user, firestore]);

  return {
    activeSignals,
    dismissedSignals,
    activeTabulations,
    tabulateClient,
    untabulateClient,
    dismissSignal,
    restoreSignal,
    updateSignalJustification
  };
}
