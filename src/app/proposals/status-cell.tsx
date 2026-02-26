'use client';

import React from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { cn, cleanFirestoreData } from '@/lib/utils';
import { proposalStatuses } from '@/lib/config-data';
import type { ProposalStatus, ProposalHistoryEntry } from '@/lib/types';
import { useFirestore, auth } from '@/firebase';
import { doc, updateDoc, arrayUnion, getDoc } from 'firebase/firestore';
import { toast } from '@/hooks/use-toast';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { useTheme } from '@/components/theme-provider';

interface StatusCellProps {
  proposalId: string;
  currentStatus: ProposalStatus;
  product?: string;
  onStatusChange?: (proposalId: string, newStatus: ProposalStatus, product?: string) => void;
}

export function StatusCell({ proposalId, currentStatus, product, onStatusChange }: StatusCellProps) {
  const firestore = useFirestore();
  const { statusColors, containerStyle } = useTheme();

  const handleUpdate = async (newStatus: ProposalStatus) => {
    if (newStatus === currentStatus) return;

    // Se houver uma função de status change (como na página de Propostas), delegamos para ela.
    // A página de propostas agora intercepta 'Reprovado' para abrir o formulário.
    if (onStatusChange) {
        onStatusChange(proposalId, newStatus, product);
        return;
    }

    if (!firestore) return;

    const now = new Date().toISOString();
    const user = auth?.currentUser;
    const userName = user?.displayName || user?.email || 'Sistema';

    const dataToUpdate: any = { 
      status: newStatus,
      statusUpdatedAt: now
    };
    
    const isPortability = product === 'Portabilidade';

    if (newStatus === 'Pago') {
        dataToUpdate.dateApproved = now;
        dataToUpdate.datePaidToClient = now;
    } 
    else if (newStatus === 'Saldo Pago' && isPortability) {
        dataToUpdate.debtBalanceArrivalDate = now;
    }
    else if (newStatus === 'Aguardando Saldo' && isPortability) {
        dataToUpdate.statusAwaitingBalanceAt = now;
    }

    const historyEntry: ProposalHistoryEntry = {
        id: crypto.randomUUID(),
        date: now,
        message: `⚙️ Status alterado rapidamente de "${currentStatus}" para "${newStatus}"`,
        userName: userName
    };
    dataToUpdate.history = arrayUnion(historyEntry);

    try {
        const docRef = doc(firestore, 'loanProposals', proposalId);
        const snap = await getDoc(docRef);
        if (snap.exists()) {
            const proposal = snap.data();
            const hasAverbacao = !!(dataToUpdate.dateApproved || proposal.dateApproved);
            
            if (newStatus !== 'Reprovado' && hasAverbacao) {
                if (!proposal.commissionStatus) {
                    dataToUpdate.commissionStatus = 'Pendente';
                }
            }
        }
    } catch (e) {}

    const docRef = doc(firestore, 'loanProposals', proposalId);
    
    updateDoc(docRef, cleanFirestoreData(dataToUpdate))
        .then(() => {
            toast({
                title: 'Status Atualizado!',
                description: `Proposta alterada para "${newStatus}" com sucesso.`,
            });
        })
        .catch(async (error) => {
            if (error.code === 'permission-denied') {
                errorEmitter.emit('permission-error', new FirestorePermissionError({
                    path: docRef.path,
                    operation: 'update',
                    requestResourceData: dataToUpdate
                }));
            }
        });
  };

  const statusKey = currentStatus.toUpperCase();
  const colorValue = statusColors[statusKey] || statusColors[currentStatus];

  return (
    <Select
      value={currentStatus}
      onValueChange={(newStatus: ProposalStatus) => handleUpdate(newStatus)}
    >
      <SelectTrigger className="p-0 border-0 focus:ring-0 focus:ring-offset-0 shadow-none bg-transparent h-auto w-full group">
        <SelectValue asChild>
            <Badge 
                variant="outline" 
                className={cn(
                    "w-full justify-center text-[10px] font-black uppercase tracking-tighter py-1.5 px-4 border-2 transition-all status-custom rounded-full",
                    containerStyle === 'glow' && "shadow-[0_0_10px_hsla(var(--status-color),0.3)]"
                )}
                style={colorValue ? { 
                    '--status-color': colorValue 
                } as any : {}}
            >
                {currentStatus}
            </Badge>
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {proposalStatuses.map((status) => (
          <SelectItem key={status} value={status} className="text-[10px] font-black uppercase">
            {status}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
