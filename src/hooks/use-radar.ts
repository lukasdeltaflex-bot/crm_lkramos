import { useMemo, useCallback } from 'react';
import { useFirestore, useUser, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, doc, setDoc, deleteDoc, addDoc } from 'firebase/firestore';
import type { Customer, Proposal } from '@/lib/types';
import { differenceInMonths, differenceInDays, addDays } from 'date-fns';
import { getAge, parseDateSafe, getStatusBehavior } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';

export type RadarSignalType = 'retencao' | 'saque';

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

    rawOpportunities.forEach(opp => {
      const dbSignal = signalMap.get(opp.id);
      
      const mergedOpp = { ...opp, dbSignal };

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
  }, [rawOpportunities, radarSignals]);

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

  return {
    activeSignals,
    dismissedSignals,
    dismissSignal,
    restoreSignal,
    updateSignalJustification
  };
}
