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
            const searchOnlyNumbers = search.replace(/\D/g, '');
            if (!normalizedSearch) return 1;
            
            // 🛡️ LÓGICA DE FILTRO AVANÇADA V7: Isola o ID para busca exata
            if (searchOnlyNumbers !== '') {
                // Prioridade 1: ID exato (âncora id_)
                if (value.includes(`id_${searchOnlyNumbers} `)) return 1;
                
                // Prioridade 2: CPF parcial (números contidos)
                if (value.includes(searchOnlyNumbers)) return 1;
                
                // Se é busca puramente numérica e não bateu ID exato nem CPF, esconde
                if (/^\d+$/.test(search)) return 0;
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
                  // 🛡️ INDEXAÇÃO DE ALTA PRECISÃO V7: Espaço após id_ para ancoragem exata
                  const searchIndex = normalizeString(`id_${customer.numericId} ${customer.numericId} ${customer.name} ${customer.cpf} ${cpfNumeric}`);
                  
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