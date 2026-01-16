'use client';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { ChevronsUpDown } from 'lucide-react';
import type { CommissionStatus, Proposal, Customer } from '@/lib/types';
import { cn } from '@/lib/utils';

type ProposalWithCustomer = Proposal & { customer?: Customer };

interface CommissionStatusCellProps {
  proposal: ProposalWithCustomer;
  onStatusUpdate: (proposal: ProposalWithCustomer, newStatus: CommissionStatus) => void;
  onEdit: (proposal: ProposalWithCustomer) => void;
}

export function CommissionStatusCell({ proposal, onStatusUpdate, onEdit }: CommissionStatusCellProps) {
    const { commissionStatus } = proposal;

    const getStatusClass = (status: CommissionStatus) => {
        return cn('print:border-gray-400 print:text-black', {
            'border-green-500 text-green-500': status === 'Paga',
            'border-yellow-500 text-yellow-500': status === 'Pendente',
            'border-orange-500 text-orange-500': status === 'Parcial',
        });
    };
    
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="w-full justify-start p-0 h-auto font-normal">
                    <Badge variant="outline" className={getStatusClass(commissionStatus)}>
                        {commissionStatus}
                    </Badge>
                    <ChevronsUpDown className="h-4 w-4 ml-2 opacity-50 print:hidden" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
                <DropdownMenuItem onClick={() => onStatusUpdate(proposal, 'Paga')}>
                    Paga
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onEdit(proposal)}>
                    Parcial...
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onStatusUpdate(proposal, 'Pendente')}>
                    Pendente
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
};
