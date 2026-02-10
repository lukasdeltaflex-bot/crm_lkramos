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
import { cn } from '@/lib/utils';
import { proposalStatuses } from '@/lib/config-data';
import type { ProposalStatus, ProposalHistoryEntry } from '@/lib/types';
import { useFirestore, auth } from '@/firebase';
import { doc, updateDoc, arrayUnion } from 'firebase/firestore';
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

const getStatusClass = (status: ProposalStatus) => {
  return cn('w-full justify-center text-[10px] font-black uppercase tracking-tighter py-1 px-3 border-2 transition-all status-custom');
};

export function StatusCell({ proposalId, currentStatus, product, onStatusChange }: StatusCellProps) {
  const firestore = useFirestore();
  const { statusColors, containerStyle } = useTheme();

  const handleUpdate = (newStatus: ProposalStatus) => {
    if (newStatus === currentStatus) return;

    if (onStatusChange) {
        onStatusChange(proposalId, newStatus, product);
        return;
    }

    if (!firestore) return;

    const now = new Date().toISOString();
    const dataToUpdate: any = { status: newStatus };
    
    const isPortability = product === 'Portabilidade';

    if (newStatus === 'Pago') {
        dataToUpdate.dateApproved = now;
        dataToUpdate.datePaidToClient = now;
    } 
    else if (newStatus === 'Saldo Pago' && isPortability) {
        dataToUpdate.debtBalanceArrivalDate = now;
    }

    const user = auth?.currentUser;
    const userName = user?.displayName || user?.email || 'Sistema';

    const historyEntry: ProposalHistoryEntry = {
        id: crypto.randomUUID(),
        date: now,
        message: `Status alterado de "${currentStatus}" para "${newStatus}" (Automático)`,
        userName: userName
    };
    dataToUpdate.history = arrayUnion(historyEntry);

    const docRef = doc(firestore, 'loanProposals', proposalId);
    updateDoc(docRef, dataToUpdate)
        .then(() => {
            toast({
                title: 'Status Atualizado!',
                description: `Proposta alterada para "${newStatus}" com sucesso.`,
            });
        })
        .catch(async (error) => {
            errorEmitter.emit('permission-error', new FirestorePermissionError({
                path: docRef.path,
                operation: 'update',
                requestResourceData: dataToUpdate
            }));
        });
  };

  const colorValue = statusColors[currentStatus];

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
                    getStatusClass(currentStatus),
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