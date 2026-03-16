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
} from '@/components/ui/command';
import { useUser, useFirestore } from '@/firebase';
import { collection, query, where, limit, orderBy, getDocs } from 'firebase/firestore';
import type { Customer, Proposal } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { normalizeString, cleanBankName } from '@/lib/utils';

/**
 * 🚀 BUSCA GLOBAL REATIVA LK RAMOS V6
 * Navegação inteligente: ao clicar em uma proposta, ela aplica filtro automático.
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

  React.useEffect(() => {
    if (!open || !user || !firestore || searchTerm.length < 2) {
        setResults({ customers: [], proposals: [] });
        return;
    }

    const timer = setTimeout(async () => {
        setIsSearching(true);
        try {
            const normalized = normalizeString(searchTerm);
            const cleanDigits = searchTerm.replace(/\D/g, '');
            const isPotentialId = cleanDigits.length >= 2;

            // 🔍 BUSCA DE CLIENTES
            const qCust = query(
                collection(firestore, 'customers'), 
                where('ownerId', '==', user.uid),
                limit(500) 
            );
            const snapCust = await getDocs(qCust);
            
            const filteredCustomers = snapCust.docs
                .map(d => ({ ...d.data(), id: d.id } as Customer))
                .filter(c => {
                    if (c.deleted === true) return false;
                    const cpfNumeric = (c.cpf || '').replace(/\D/g, '');
                    const nameMatch = normalizeString(c.name || '').includes(normalized);
                    const idMatch = isPotentialId && (String(c.numericId).includes(cleanDigits) || cpfNumeric.includes(cleanDigits));
                    return nameMatch || idMatch;
                })
                .slice(0, 10);

            // 🔍 BUSCA DE PROPOSTAS
            const qProp = query(
                collection(firestore, 'loanProposals'), 
                where('ownerId', '==', user.uid),
                orderBy('dateDigitized', 'desc'),
                limit(500)
            );
            const snapProp = await getDocs(qProp);
            
            const filteredProposals = snapProp.docs
                .map(d => ({ ...d.data(), id: d.id } as Proposal))
                .filter(p => {
                    if (p.deleted === true) return false;
                    const pNum = (p.proposalNumber || '').replace(/\D/g, '');
                    const numMatch = isPotentialId && pNum.includes(cleanDigits);
                    const textMatch = normalizeString(p.product || '').includes(normalized) || normalizeString(p.bank || '').includes(normalized);
                    return numMatch || textMatch;
                })
                .slice(0, 10);

            setResults({ customers: filteredCustomers, proposals: filteredProposals });
        } catch (error) {
            console.error("Search Error:", error);
        } finally {
            setIsSearching(false);
        }
    }, 300);

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
        shouldFilter={false} 
      >
        <CommandInput 
            placeholder="Digite Nome, CPF, ID ou Proposta..." 
            value={searchTerm}
            onValueChange={setSearchTerm}
            autoFocus 
        />
        <CommandList>
          {isSearching ? (
            <div className="flex items-center justify-center py-10 text-sm text-muted-foreground gap-3">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
              <span className="font-black uppercase text-[10px] tracking-widest animate-pulse">Consultando base...</span>
            </div>
          ) : searchTerm.length >= 2 && results.customers.length === 0 && results.proposals.length === 0 ? (
            <CommandEmpty className="py-10 text-center text-xs font-bold uppercase text-muted-foreground opacity-50">Nenhum registro localizado.</CommandEmpty>
          ) : null}

          {searchTerm.length < 2 && (
              <CommandGroup heading="Ações Rápidas">
                <CommandItem onSelect={() => runCommand(() => router.push('/customers?action=new'))} value="novo-cliente-action">
                    <PlusCircle className="mr-2 h-4 w-4 text-blue-500" />
                    <span>Novo Cliente</span>
                </CommandItem>
                <CommandItem onSelect={() => runCommand(() => router.push('/proposals?action=new'))} value="nova-proposta-action">
                    <PlusCircle className="mr-2 h-4 w-4 text-green-500" />
                    <span>Nova Proposta</span>
                </CommandItem>
              </CommandGroup>
          )}

          {results.customers.length > 0 && (
            <CommandGroup heading="Clientes Localizados">
                {results.customers.map((customer) => {
                    const searchIndex = `${customer.name} ${customer.cpf} ${customer.numericId}`.toLowerCase();
                    return (
                        <CommandItem
                            key={customer.id}
                            value={searchIndex}
                            onSelect={() => runCommand(() => router.push(`/customers/${customer.id}`))}
                        >
                            <div className="flex items-center justify-between w-full">
                                <div className='flex items-center'>
                                    <User className="mr-2 h-4 w-4 text-muted-foreground" />
                                    <div className="flex flex-col">
                                        <span className="font-bold text-sm uppercase">{customer.name}</span>
                                        <span className="text-[10px] text-muted-foreground uppercase font-black">ID: {customer.numericId} | CPF: {customer.cpf}</span>
                                    </div>
                                </div>
                                <ArrowRight className='h-3 w-3 opacity-40' />
                            </div>
                        </CommandItem>
                    );
                })}
            </CommandGroup>
          )}
          
          {results.proposals.length > 0 && (
            <CommandGroup heading="Propostas Localizadas">
                {results.proposals.map((proposal) => {
                    const searchIndex = `${proposal.proposalNumber} ${proposal.product} ${proposal.bank}`.toLowerCase();
                    return (
                        <CommandItem
                            key={proposal.id}
                            value={searchIndex}
                            onSelect={() => runCommand(() => router.push(`/proposals?open=${proposal.id}&search=${proposal.proposalNumber}`))}>
                            <div className="flex items-center justify-between w-full">
                                <div className='flex items-center'>
                                    <FileText className="mr-2 h-4 w-4 text-muted-foreground" />
                                    <div className="flex flex-col">
                                        <span className="font-bold uppercase text-xs">Prop. {proposal.proposalNumber}</span>
                                        <span className="text-[9px] text-muted-foreground uppercase font-bold">{proposal.product} • {cleanBankName(proposal.bank)}</span>
                                    </div>
                                </div>
                                <Zap className='h-3 w-3 text-orange-500 opacity-40' />
                            </div>
                        </CommandItem>
                    );
                })}
            </CommandGroup>
          )}
        </CommandList>
      </CommandDialog>
    </>
  );
}
