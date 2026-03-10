
'use client';

import * as React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import type { Customer } from '@/lib/types';
import { ScrollArea } from '../ui/scroll-area';
import { normalizeString } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

interface CustomerSearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customers: Customer[];
  onSelectCustomer: (customer: Customer) => void;
}

export function CustomerSearchDialog({
  open,
  onOpenChange,
  customers,
  onSelectCustomer,
}: CustomerSearchDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl" onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>Buscar Cliente</DialogTitle>
        </DialogHeader>
        <Command filter={(value, search) => {
            const normalizedSearch = normalizeString(search);
            const isPureNumber = /^\d+$/.test(search);
            if (!normalizedSearch) return 1;
            
            // 🛡️ FILTRO V11 (Aprovado #2): Prioridade absoluta para ID Exato e CPF inicial
            if (isPureNumber) {
                // 1. ID exato (âncora id_) - Espaço no final para evitar ID 10 match id_1
                if (value.includes(`id_${search} `)) return 1;
                // 2. CPF começando com (âncora cpf_)
                if (value.includes(`cpf_${search}`)) return 0.9;
                
                return 0;
            }
            
            return value.includes(normalizedSearch) ? 1 : 0;
        }}>
          <CommandInput placeholder="Digite ID exato, Nome ou CPF..." autoFocus />
          <ScrollArea className="h-[50vh]">
            <CommandList>
              <CommandEmpty>Nenhum cliente encontrado.</CommandEmpty>
              <CommandGroup>
                {customers.map((customer) => {
                  const cpfNumeric = (customer.cpf || '').replace(/\D/g, '');
                  // 🛡️ INDEXAÇÃO V11: Espaço após numericId para garantir match de ID Exato no filter
                  const searchIndex = normalizeString(`id_${customer.numericId}  cpf_${cpfNumeric} ${customer.name} ${customer.cpf}`);
                  
                  return (
                    <CommandItem
                      value={searchIndex}
                      key={customer.id}
                      onSelect={() => {
                        onSelectCustomer(customer);
                      }}
                    >
                      <div className="flex items-center justify-between w-full">
                        <div className="flex flex-col">
                            <p className="font-bold text-sm uppercase">{customer.name}</p>
                            <p className="text-[10px] text-muted-foreground font-black uppercase">CPF: {customer.cpf} | ID: {customer.numericId}</p>
                        </div>
                        <Badge variant="outline" className="text-[10px] font-black bg-primary/5 border-primary/20 text-primary">ID {customer.numericId}</Badge>
                      </div>
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            </CommandList>
          </ScrollArea>
        </Command>
      </DialogContent>
    </Dialog>
  );
}
