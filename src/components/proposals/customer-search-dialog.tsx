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
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Buscar Cliente</DialogTitle>
        </DialogHeader>
        <Command>
          <CommandInput placeholder="Pesquisar por nome ou CPF..." />
          <ScrollArea className="h-[50vh]">
            <CommandList>
              <CommandEmpty>Nenhum cliente encontrado.</CommandEmpty>
              <CommandGroup>
                {customers.map((customer) => {
                  // 🛡️ BUSCA ROBUSTA V9: Inclui todas as variações de documento no índice de busca
                  const cpfNumeric = customer.cpf?.replace(/\D/g, '') || '';
                  const searchIndex = normalizeString(`${customer.name} ${customer.cpf} ${cpfNumeric} ID${customer.numericId}`);
                  
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