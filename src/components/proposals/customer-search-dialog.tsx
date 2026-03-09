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
            
            // 🛡️ LÓGICA DE FILTRO AVANÇADA V3: Prioriza ID exato isolando o termo
            // O prefixo 'id_' no value ajuda a ancorar a busca numérica curta
            if (searchOnlyNumbers !== '') {
                // Se o termo de busca for exatamente o ID prefixado no value
                if (value.includes(`id_${searchOnlyNumbers} `)) return 1;
                // Se o valor contiver os números digitados (para CPF)
                if (value.includes(searchOnlyNumbers)) return 1;
            }
            
            return value.includes(normalizedSearch) ? 1 : 0;
        }}>
          <CommandInput placeholder="Digite ID exato, Nome ou CPF..." autoFocus />
          <ScrollArea className="h-[50vh]">
            <CommandList>
              <CommandEmpty>Nenhum cliente encontrado.</CommandEmpty>
              <CommandGroup>
                {customers.map((customer) => {
                  const cpfNumeric = customer.cpf?.replace(/\D/g, '') || '';
                  // 🛡️ INDEXAÇÃO DE ALTA PRECISÃO V3: Prefixamos o ID para busca estrita
                  const searchIndex = normalizeString(`id_${customer.numericId} ${customer.numericId} ${customer.name} ${customer.cpf} ${cpfNumeric}`);
                  
                  return (
                    <CommandItem
                      value={searchIndex}
                      key={customer.id}
                      onSelect={() => {
                        onSelectCustomer(customer);
                      }}
                    >
                      <div className="flex flex-col">
                        <p className="font-bold text-sm uppercase">{customer.name}</p>
                        <p className="text-xs text-muted-foreground">CPF: {customer.cpf} | ID: {customer.numericId}</p>
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