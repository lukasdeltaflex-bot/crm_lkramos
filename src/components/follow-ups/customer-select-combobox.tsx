'use client';

import * as React from 'react';
import { Customer } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Search, UserCheck, X, Phone, User, Check, Sparkles } from 'lucide-react';
import { normalizeString, normalizeCpf, formatCpf, matchCpf } from '@/lib/utils';

interface CustomerSelectComboboxProps {
  customers: Customer[];
  selectedCustomerId?: string;
  onSelectCustomer: (customer?: Customer) => void;
  disabled?: boolean;
}

export function CustomerSelectCombobox({
  customers,
  selectedCustomerId,
  onSelectCustomer,
  disabled = false,
}: CustomerSelectComboboxProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [searchTerm, setSearchTerm] = React.useState('');

  const selectedCustomer = React.useMemo(() => {
    if (!selectedCustomerId || selectedCustomerId === 'none') return null;
    return customers.find(c => c.id === selectedCustomerId) || null;
  }, [customers, selectedCustomerId]);

  const maskCpfDisplay = (cpf?: string) => {
    if (!cpf) return '';
    const clean = normalizeCpf(cpf);
    if (clean.length === 11) {
      return `${clean.substring(0, 3)}.***.***-${clean.substring(9, 11)}`;
    }
    return cpf;
  };

  const filteredCustomers = React.useMemo(() => {
    const rawSearch = searchTerm.trim();
    if (!rawSearch) {
      return customers.filter(c => c.name !== 'Cliente Removido' && c.deleted !== true).slice(0, 50);
    }

    const normSearch = normalizeString(rawSearch);
    const searchDigits = normalizeCpf(rawSearch);
    const isNumericSearch = searchDigits.length >= 2;

    return customers
      .filter(c => c.name !== 'Cliente Removido' && c.deleted !== true)
      .filter(c => {
        // 1. Busca por CPF normalizado (com ou sem pontuação)
        if (matchCpf(c.cpf, rawSearch)) return true;

        // 2. Busca por Nome parcial (sem acento, case-insensitive)
        if (normalizeString(c.name || '').includes(normSearch)) return true;

        // 3. Busca por Telefone ou ID se houver dígitos
        if (isNumericSearch) {
          const p1 = normalizeCpf(c.phone);
          const p2 = normalizeCpf(c.phone2);
          if (p1.includes(searchDigits) || p2.includes(searchDigits)) return true;
          if (String(c.numericId).includes(searchDigits)) return true;
        }

        return false;
      })
      .slice(0, 50);
  }, [customers, searchTerm]);

  return (
    <div className="space-y-2">
      {selectedCustomer ? (
        <div className="flex items-center justify-between p-3 rounded-xl border bg-primary/5 border-primary/20 transition-all">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold">
              <UserCheck className="h-4 w-4" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm">{selectedCustomer.name}</span>
                <Badge variant="outline" className="text-[10px] font-black uppercase bg-primary/10 text-primary border-primary/20">
                  ID {selectedCustomer.numericId}
                </Badge>
              </div>
              <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                <span>CPF: <strong className="font-mono text-foreground">{maskCpfDisplay(selectedCustomer.cpf)}</strong></span>
                {selectedCustomer.phone && (
                  <span className="flex items-center gap-1">
                    <Phone className="h-3 w-3 text-muted-foreground/60" /> {selectedCustomer.phone}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setIsOpen(true)}
              disabled={disabled}
              className="h-8 text-xs font-bold text-primary hover:text-primary/80"
            >
              Trocar
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => onSelectCustomer(undefined)}
              disabled={disabled}
              className="h-8 w-8 text-muted-foreground hover:text-destructive"
              title="Remover vínculo com este cliente"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => setIsOpen(true)}
            disabled={disabled}
            className="w-full justify-between rounded-xl h-11 border-dashed border-2 hover:bg-muted/50 font-medium text-xs text-muted-foreground"
          >
            <span className="flex items-center gap-2">
              <Search className="h-4 w-4 text-primary" />
              Clique para buscar e vincular um cliente...
            </span>
            <Badge variant="secondary" className="text-[10px] uppercase font-bold tracking-wider">Opcional</Badge>
          </Button>
        </div>
      )}

      {/* DIÁLOGO DE PESQUISA AVANÇADA DE CLIENTES */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-xl p-0 overflow-hidden rounded-2xl border-none shadow-2xl">
          <DialogHeader className="px-6 pt-6 pb-2">
            <DialogTitle className="text-lg font-black uppercase text-primary flex items-center gap-2">
              <User className="h-5 w-5" /> Localizar Cliente para Retorno
            </DialogTitle>
            <DialogDescription className="text-xs">
              Pesquise pelo Nome (parcial ou completo), CPF (com ou sem pontuação) ou Telefone.
            </DialogDescription>
          </DialogHeader>

          <div className="p-4 pt-0">
            <Command shouldFilter={false} className="border rounded-xl overflow-hidden">
              <CommandInput
                placeholder="Ex: João Silva, 123.456.789-00 ou 1199999..."
                value={searchTerm}
                onValueChange={setSearchTerm}
                autoFocus
              />
              <ScrollArea className="h-72">
                <CommandList>
                  {filteredCustomers.length === 0 ? (
                    <CommandEmpty className="py-12 text-center text-xs font-bold uppercase text-muted-foreground/60">
                      Nenhum cliente localizado com os termos informados.
                    </CommandEmpty>
                  ) : (
                    <CommandGroup heading={`Clientes Encontrados (${filteredCustomers.length})`}>
                      {filteredCustomers.map((c) => {
                        const isCurrent = c.id === selectedCustomerId;
                        return (
                          <CommandItem
                            key={c.id}
                            value={c.id}
                            onSelect={() => {
                              onSelectCustomer(c);
                              setIsOpen(false);
                            }}
                            className="cursor-pointer py-2.5 px-3 flex items-center justify-between hover:bg-muted/60 transition-colors"
                          >
                            <div className="flex flex-col gap-0.5">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-sm text-foreground">{c.name}</span>
                                {isCurrent && (
                                  <Badge variant="outline" className="text-[9px] bg-green-50 text-green-700 border-green-200 font-black">
                                    <Check className="h-2.5 w-2.5 mr-0.5" /> Atual
                                  </Badge>
                                )}
                              </div>
                              <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                                <span>CPF: <strong className="font-mono text-foreground/80">{maskCpfDisplay(c.cpf)}</strong></span>
                                {c.phone && <span>Tel: {c.phone}</span>}
                              </div>
                            </div>
                            <Badge variant="outline" className="text-[10px] font-black uppercase bg-primary/5 text-primary border-primary/20">
                              ID {c.numericId}
                            </Badge>
                          </CommandItem>
                        );
                      })}
                    </CommandGroup>
                  )}
                </CommandList>
              </ScrollArea>
            </Command>

            <div className="flex justify-between items-center mt-4 pt-3 border-t">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  onSelectCustomer(undefined);
                  setIsOpen(false);
                }}
                className="text-xs text-muted-foreground hover:text-destructive"
              >
                Limpar vínculo (Salvar sem cliente)
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsOpen(false)}
                className="text-xs font-bold rounded-lg"
              >
                Fechar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
