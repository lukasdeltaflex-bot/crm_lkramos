
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
import type { ProposalStatus } from '@/lib/types';

interface StatusCellProps {
  proposalId: string;
  currentStatus: ProposalStatus;
  onStatusChange: (proposalId: string, newStatus: ProposalStatus) => void;
}

const getStatusClass = (status: ProposalStatus) => {
  return cn('w-full justify-center text-xs', {
    'border-green-500/50 text-green-500 hover:bg-green-500/10': status === 'Pago' || status === 'Saldo Pago',
    'border-yellow-500/50 text-yellow-500 hover:bg-yellow-500/10': status === 'Em Andamento',
    'border-blue-500/50 text-blue-500 hover:bg-blue-500/10': status === 'Aguardando Saldo',
    'border-red-500/50 text-red-500 hover:bg-red-500/10': status === 'Reprovado',
    'border-purple-500/50 text-purple-500 hover:bg-purple-500/10': status === 'Pendente',
  });
};

export function StatusCell({ proposalId, currentStatus, onStatusChange }: StatusCellProps) {
  return (
    <Select
      value={currentStatus}
      onValueChange={(newStatus: ProposalStatus) =>
        onStatusChange(proposalId, newStatus)
      }
    >
      <SelectTrigger className="p-0 border-0 focus:ring-0 focus:ring-offset-0 shadow-none bg-transparent">
        <SelectValue asChild>
            <Badge variant="outline" className={getStatusClass(currentStatus)}>
                {currentStatus}
            </Badge>
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {proposalStatuses.map((status) => (
          <SelectItem key={status} value={status}>
            {status}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
