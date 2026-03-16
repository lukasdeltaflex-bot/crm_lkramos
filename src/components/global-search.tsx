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
import { collection, query, where, limit, getDocs } from 'firebase/firestore';
import type { Customer, Proposal } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { normalizeString, cleanBankName } from '@/lib/utils';

/**
 * 🚀 BUSCA GLOBAL REATIVA LK RAMOS V15
 * Correção: Implementada estratégia de busca por igualdade (ID-friendly) + Fetch Amplo.
 * Isso garante que propostas e CPFs específicos sejam localizados mesmo em bases gigantes.
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
        const normalized = normalizeString(searchTerm);
        const cleanDigits = searchTerm.replace(/\D/g, '');
        const isPotentialId = cleanDigits.length >= 2;
        const term = searchTerm.trim();

        console.log(`[DEBUG-GLOBAL] Buscando por: "${term}"`);

        try {
            // --- 🔍 BUSCA DE CLIENTES ---
            const customerMap = new Map<string, Customer>();
            
            // 1. Busca por CPF exato (Eficiente e Sem Índice Composto)
            if (isPotentialId) {
                const qExactCpf = query(
                    collection(firestore, 'customers'),
                    where('ownerId', '==', user.uid),
                    where('cpf', '==', term),
                    limit(5)
                );
                const snapCpf = await getDocs(qExactCpf);
                snapCpf.docs.forEach(d => customerMap.set(d.id, { ...d.data(), id: d.id } as Customer));
            }

            // 2. Busca Ampla (Filtro Local para Nome/Cidade/Tags)
            const qCustRecent = query(
                collection(firestore, 'customers'), 
                where('ownerId', '==', user.uid),
                limit(200)
            );
            const snapRecent = await getDocs(qCustRecent);
            snapRecent.docs.forEach(d => {
                const c = { ...d.data(), id: d.id } as Customer;
                if (c.deleted !== true && (
                    normalizeString(c.name || '').includes(normalized) ||
                    (isPotentialId && (c.cpf || '').replace(/\D/g, '').includes(cleanDigits)) ||
                    (isPotentialId && String(c.numericId).includes(cleanDigits))
                )) {
                    customerMap.set(d.id, c);
                }
            });

            // --- 🔍 BUSCA DE PROPOSTAS ---
            const proposalMap = new Map<string, Proposal>();

            // 1. Busca por Número de Proposta Exato (Eficiente e Sem Índice Composto)
            if (isPotentialId) {
                const qExactProp = query(
                    collection(firestore, 'loanProposals'),
                    where('ownerId', '==', user.uid),
                    where('proposalNumber', '==', term),
                    limit(5)
                );
                const snapPropExact = await getDocs(qExactProp);
                snapPropExact.docs.forEach(d => proposalMap.set(d.id, { ...d.data(), id: d.id } as Proposal));
            }

            // 2. Busca Ampla (Filtro Local para Bank/Product/Partial Num)
            const qPropRecent = query(
                collection(firestore, 'loanProposals'), 
                where('ownerId', '==', user.uid),
                limit(500) // Limite aumentado para cobrir base maior
            );
            const snapPropRecent = await getDocs(qPropRecent);
            snapPropRecent.docs.forEach(d => {
                const p = { ...d.data(), id: d.id } as Proposal;
                if (p.deleted !== true) {
                    const pNumStr = normalizeString(p.proposalNumber || '');
                    const matchesPNum = pNumStr.includes(normalized);
                    const matchesPNumDigits = isPotentialId && pNumStr.replace(/\D/g, '').includes(cleanDigits);
                    const textMatch = normalizeString(p.bank || '').includes(normalized) || 
                                     normalizeString(p.product || '').includes(normalized);
                    
                    if (matchesPNum || matchesPNumDigits || textMatch) {
                        proposalMap.set(d.id, p);
                    }
                }
            });

            const finalCustomers = Array.from(customerMap.values()).slice(0, 8);
            const finalProposals = Array.from(proposalMap.values()).slice(0, 8);

            console.log(`[DEBUG-GLOBAL] Encontrados: ${finalCustomers.length} clientes, ${finalProposals.length} propostas`);
            setResults({ customers: finalCustomers, proposals: finalProposals });
        } catch (error) {
            console.error("[DEBUG-GLOBAL] Erro na busca:", error);
        } finally {
            setIsSearching(false);
        }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm, open, user, firestore]);

  const runCommand = React.useCallback((command: () => void) => {
    setOpen(false);
    setSearchTerm('');
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
            placeholder="Nome, CPF ou Proposta nº..." 
            value={searchTerm}
            onValueChange={setSearchTerm}
            autoFocus 
        />
        <CommandList>
          {isSearching ? (
            <div className="flex items-center justify-center py-10 text-sm text-muted-foreground gap-3">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
              <span className="font-black uppercase text-[10px] tracking-widest animate-pulse">Buscando...</span>
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
            <CommandGroup heading="Clientes">
                {results.customers.map((customer) => (
                    <CommandItem
                        key={customer.id}
                        value={`cust-${customer.id}`}
                        onSelect={() => {
                            runCommand(() => router.push(`/customers/${customer.id}`));
                        }}
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
                ))}
            </CommandGroup>
          )}
          
          {results.proposals.length > 0 && (
            <CommandGroup heading="Propostas">
                {results.proposals.map((proposal) => (
                    <CommandItem
                        key={proposal.id}
                        value={`prop-${proposal.id}-${proposal.proposalNumber}`}
                        onSelect={() => {
                            console.log(`[DEBUG-GLOBAL] Navegando para Proposta: ${proposal.proposalNumber}`);
                            runCommand(() => router.push(`/proposals?open=${proposal.id}&search=${proposal.proposalNumber}`));
                        }}
                    >
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
                ))}
            </CommandGroup>
          )}
        </CommandList>
      </CommandDialog>
    </>
  );
}
