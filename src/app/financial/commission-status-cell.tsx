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
import { useTheme } from '@/components/theme-provider';

type ProposalWithCustomer = Proposal & { customer?: Customer };

interface CommissionStatusCellProps {
  proposal: ProposalWithCustomer;
  onStatusUpdate: (proposal: ProposalWithCustomer, newStatus: CommissionStatus) => void;
  onEdit: (proposal: ProposalWithCustomer) => void;
}

export function CommissionStatusCell({ proposal, onStatusUpdate, onEdit }: CommissionStatusCellProps) {
    const { statusColors } = useTheme();
    const { commissionStatus } = proposal;

    const colorValue = commissionStatus ? (statusColors[commissionStatus.toUpperCase()] || statusColors[commissionStatus]) : undefined;
    
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="group w-full justify-start p-0 h-auto font-normal hover:bg-transparent">
                    <Badge 
                        variant="outline" 
                        className={cn(
                            "min-w-[80px] h-6 justify-center transition-all text-[10px] font-black uppercase tracking-tighter border-2 rounded-full", 
                            !commissionStatus ? 'border-dashed border-muted-foreground/20 text-transparent group-hover:text-muted-foreground/40 bg-transparent' : 'status-custom'
                        )}
                        style={colorValue ? { '--status-color': colorValue } as any : {}}
                    >
                        {commissionStatus || 'Definir'}
                    </Badge>
                    <ChevronsUpDown className="h-3 w-3 ml-1 opacity-0 group-hover:opacity-40 transition-opacity print:hidden" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="rounded-xl border-2 shadow-xl">
                <DropdownMenuItem className="font-bold text-xs uppercase" onClick={() => onStatusUpdate(proposal, 'Paga')}>
                    Marcar como Paga
                </DropdownMenuItem>
                <DropdownMenuItem className="font-bold text-xs uppercase" onClick={() => onEdit(proposal)}>
                    Lançar Parcial...
                </DropdownMenuItem>
                <DropdownMenuItem className="font-bold text-xs uppercase text-destructive focus:text-destructive" onClick={() => onStatusUpdate(proposal, 'Pendente')}>
                    Marcar como Pendente
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
};
