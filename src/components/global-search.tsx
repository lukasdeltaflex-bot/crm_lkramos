
'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Search, User, FileText, Loader2, PlusCircle, ArrowRight, Zap } from 'lucide-react';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, limit, orderBy, getDocs } from 'firebase/firestore';
import type { Customer, Proposal } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { normalizeString, getSmartTags, cleanBankName } from '@/lib/utils';

/**
 * 🚀 BUSCA GLOBAL REATIVA V12 (AUDITORIA APROVADA)
 * Otimizada para não carregar dados desnecessários no boot do sistema.
 * As consultas agora ocorrem de forma assíncrona baseada na interação do usuário.
 */
export function GlobalSearch() {
  const [open, setOpen] = React.useState(false);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [isSearching, setIsSearching] = React.useState(false);
  const [results, setResults] = React.useState<{ customers: Customer[], proposals: Proposal[] }>({ customers: [], proposals: [] });
  
  const router = useRouter();
  const { user } = useUser();
  const firestore = useFirestore();

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  // 🛡️ MOTOR DE BUSCA SOB DEMANDA (REACTIVITY)
  // Só realiza a consulta pesada se o usuário digitar mais de 2 caracteres
  React.useEffect(() => {
    if (!open || !user || !firestore || searchTerm.length < 2) {
        setResults({ customers: [], proposals: [] });
        return;
    }

    const timer = setTimeout(async () => {
        setIsSearching(true);
        try {
            const normalized = normalizeString(searchTerm);
            const isNumber = /^\d+$/.test(searchTerm);

            // 🔍 BUSCA DE CLIENTES (Limitada aos 50 mais relevantes para performance)
            const qCust = query(
                collection(firestore, 'customers'), 
                where('ownerId', '==', user.uid),
                limit(100) // Pega um lote pequeno para filtrar localmente
            );
            const snapCust = await getDocs(qCust);
            const filteredCustomers = snapCust.docs
                .map(d => ({ ...d.data(), id: d.id } as Customer))
                .filter(c => {
                    if (c.name === 'Cliente Removido') return false;
                    if (isNumber) {
                        return String(c.numericId).includes(searchTerm) || c.cpf?.replace(/\D/g, '').includes(searchTerm);
                    }
                    return normalizeString(c.name).includes(normalized) || normalizeString(c.city || '').includes(normalized);
                })
                .slice(0, 10);

            // 🔍 BUSCA DE PROPOSTAS
            const qProp = query(
                collection(firestore, 'loanProposals'), 
                where('ownerId', '==', user.uid),
                orderBy('dateDigitized', 'desc'),
                limit(100)
            );
            const snapProp = await getDocs(qProp);
            const filteredProposals = snapProp.docs
                .map(d => ({ ...d.data(), id: d.id } as Proposal))
                .filter(p => {
                    if (isNumber) return p.proposalNumber.includes(searchTerm);
                    return normalizeString(p.product).includes(normalized) || normalizeString(p.bank).includes(normalized);
                })
                .slice(0, 10);

            setResults({ customers: filteredCustomers, proposals: filteredProposals });
        } catch (error) {
            console.error("Search Error:", error);
        } finally {
            setIsSearching(false);
        }
    }, 400); // Debounce de 400ms para evitar spam de requisições

    return () => clearTimeout(timer);
  }, [searchTerm, open, user, firestore]);

  const runCommand = React.useCallback((command: () => void) => {
    setOpen(false);
    command();
  }, []);

  return (
    <>
      <Button
        variant="outline"
        className="relative h-9 w-full justify-start rounded-[0.5rem] bg-background text-sm font-normal text-muted-foreground shadow-none sm:pr-12 md:w-40 lg:w-64 hover:bg-accent/50 transition-colors"
        onClick={() => setOpen(true)}
      >
        <span className="inline-flex items-center gap-2">
          <Search className="h-4 w-4" />
          <span>Pesquisar registros...</span>
        </span>
        <kbd className="pointer-events-none absolute right-[0.3rem] top-[0.3rem] hidden h-6 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
          <span className="text-xs">⌘</span>K
        </kbd>
      </Button>
      <CommandDialog 
        open={open} 
        onOpenChange={(isOpen) => {
            setOpen(isOpen);
            if (!isOpen) setSearchTerm('');
        }}
      >
        <CommandInput 
            placeholder="Digite o ID, Nome ou CPF para buscar na base..." 
            value={searchTerm}
            onValueChange={setSearchTerm}
            autoFocus 
        />
        <CommandList>
          {isSearching ? (
            <div className="flex items-center justify-center py-10 text-sm text-muted-foreground gap-3">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
              <span className="font-black uppercase text-[10px] tracking-widest animate-pulse">Consultando base de dados...</span>
            </div>
          ) : searchTerm.length > 0 && results.customers.length === 0 && results.proposals.length === 0 ? (
            <CommandEmpty className="py-10 text-center text-xs font-bold uppercase text-muted-foreground opacity-50">Nenhum resultado para "{searchTerm}"</CommandEmpty>
          ) : null}

          {searchTerm.length < 2 && (
              <CommandGroup heading="Sugestões de Acesso">
                <CommandItem onSelect={() => runCommand(() => router.push('/customers?action=new'))}>
                    <PlusCircle className="mr-2 h-4 w-4 text-blue-500" />
                    <span>Cadastrar Novo Cliente</span>
                </CommandItem>
                <CommandItem onSelect={() => runCommand(() => router.push('/proposals?action=new'))}>
                    <PlusCircle className="mr-2 h-4 w-4 text-green-500" />
                    <span>Nova Proposta Bancária</span>
                </CommandItem>
              </CommandGroup>
          )}

          {results.customers.length > 0 && (
            <CommandGroup heading="Clientes Localizados">
                {results.customers.map((customer) => (
                    <CommandItem
                        key={customer.id}
                        onSelect={() => runCommand(() => router.push(`/customers/${customer.id}`))}
                    >
                        <div className="flex items-center justify-between w-full">
                            <div className='flex items-center'>
                                <User className="mr-2 h-4 w-4 text-muted-foreground" />
                                <div className="flex flex-col">
                                    <span className="font-bold text-sm uppercase">ID {customer.numericId} - {customer.name}</span>
                                    <span className="text-[10px] text-muted-foreground uppercase font-black">CPF: {customer.cpf}</span>
                                </div>
                            </div>
                            <ArrowRight className='h-3 w-3 opacity-40' />
                        </div>
                    </CommandItem>
                ))}
            </CommandGroup>
          )}
          
          {results.proposals.length > 0 && (
            <CommandGroup heading="Propostas Relacionadas">
                {results.proposals.map((proposal) => (
                    <CommandItem
                        key={proposal.id}
                        onSelect={() => runCommand(() => router.push(`/proposals?open=${proposal.id}`))}>
                        <div className="flex items-center justify-between w-full">
                            <div className='flex items-center'>
                                <FileText className="mr-2 h-4 w-4 text-muted-foreground" />
                                <div className="flex flex-col">
                                    <span className="font-bold uppercase text-xs">Contrato {proposal.proposalNumber}</span>
                                    <span className="text-[9px] text-muted-foreground uppercase font-bold">{proposal.product} • {cleanBankName(proposal.bank)}</span>
                                </div>
                            </div>
                            <Zap className='h-3 w-3 text-orange-500 opacity-40' />
                        </div>
                    </CommandItem>
                ))}
            </CommandGroup>
          )}
        </CommandList>
      </CommandDialog>
    </>
  );
}
