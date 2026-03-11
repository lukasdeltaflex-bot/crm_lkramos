
'use client';

import * as React from 'react';
import { DialogHeader, DialogTitle } from '@/components/ui/dialog';
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
  customers: Customer[];
  onSelectCustomer: (customer: Customer) => void;
}

/**
 * 🔍 CustomerSearchContent
 * Componente que renderiza o interior da busca. 
 * Removido o Dialog interno para evitar aninhamento redundante.
 */
export function CustomerSearchDialog({
  customers,
  onSelectCustomer,
}: CustomerSearchDialogProps) {
  return (
    <div className="flex flex-col h-full">
        <DialogHeader className="px-1 pb-4">
          <DialogTitle className="text-xl font-black uppercase tracking-tight text-primary">Buscar Cliente na Base</DialogTitle>
        </DialogHeader>
        
        <Command 
            className="rounded-xl border-2 overflow-hidden"
            filter={(value, search) => {
                const normalizedSearch = normalizeString(search);
                const isPureNumber = /^\d+$/.test(search);
                if (!normalizedSearch) return 1;
                
                if (isPureNumber) {
                    if (value.includes(`id_${search} `)) return 1;
                    if (value.includes(`cpf_${search}`)) return 0.9;
                    return 0;
                }
                
                return value.includes(normalizedSearch) ? 1 : 0;
            }}
        >
          <CommandInput placeholder="Digite ID exato, Nome ou CPF..." autoFocus />
          <ScrollArea className="h-[50vh]">
            <CommandList>
              <CommandEmpty className="py-10 text-center text-xs font-bold uppercase text-muted-foreground opacity-50">Nenhum cliente localizado.</CommandEmpty>
              <CommandGroup>
                {customers.map((customer) => {
                  const cpfNumeric = (customer.cpf || '').replace(/\D/g, '');
                  const searchIndex = normalizeString(`id_${customer.numericId}  cpf_${cpfNumeric} ${customer.name} ${customer.cpf}`);
                  
                  return (
                    <CommandItem
                      value={searchIndex}
                      key={customer.id}
                      onSelect={() => {
                        onSelectCustomer(customer);
                      }}
                      className="cursor-pointer py-3"
                    >
                      <div className="flex items-center justify-between w-full">
                        <div className="flex flex-col">
                            <p className="font-bold text-sm uppercase">{customer.name}</p>
                            <p className="text-[10px] text-muted-foreground font-black uppercase">CPF: {customer.cpf} | ID: {customer.numericId}</p>
                        </div>
                        <Badge variant="outline" className="text-[10px] font-black bg-primary/5 border-primary/20 text-primary shadow-sm">ID {customer.numericId}</Badge>
                      </div>
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            </CommandList>
          </ScrollArea>
        </Command>
    </div>
  );
}
