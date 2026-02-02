'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Search, User, FileText, Loader2, PlusCircle, ArrowRight } from 'lucide-react';
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
import { collection, query, where } from 'firebase/firestore';
import type { Customer, Proposal } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { normalizeString } from '@/lib/utils';

export function GlobalSearch() {
  const [open, setOpen] = React.useState(false);
  const router = useRouter();
  const { user } = useUser();
  const firestore = useFirestore();

  const customersQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, 'customers'), where('ownerId', '==', user.uid));
  }, [firestore, user]);

  const proposalsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, 'loanProposals'), where('ownerId', '==', user.uid));
  }, [firestore, user]);

  const { data: customers, isLoading: loadingCustomers } = useCollection<Customer>(customersQuery);
  const { data: proposals, isLoading: loadingProposals } = useCollection<Proposal>(proposalsQuery);

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

  const runCommand = React.useCallback((command: () => void) => {
    setOpen(false);
    command();
  }, []);

  const validCustomers = React.useMemo(() => {
    return customers?.filter(c => c.name !== 'Cliente Removido') || [];
  }, [customers]);

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
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput 
            placeholder="Encontre clientes (nome/cpf) ou propostas..." 
        />
        <CommandList>
          <CommandEmpty>Nenhum resultado encontrado.</CommandEmpty>
          
          {(loadingCustomers || loadingProposals) && (
            <div className="flex items-center justify-center py-6 text-sm text-muted-foreground">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Buscando na base de dados...
            </div>
          )}

          <CommandGroup heading="Ações Rápidas">
            <CommandItem onSelect={() => runCommand(() => router.push('/customers?action=new'))}>
                <PlusCircle className="mr-2 h-4 w-4 text-blue-500" />
                <span>Cadastrar Novo Cliente</span>
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => router.push('/proposals?action=new'))}>
                <PlusCircle className="mr-2 h-4 w-4 text-green-500" />
                <span>Criar Nova Proposta</span>
            </CommandItem>
          </CommandGroup>

          <CommandSeparator />

          <CommandGroup heading="Clientes">
            {validCustomers.map((customer) => (
              <CommandItem
                key={customer.id}
                value={normalizeString(`${customer.name} ${customer.cpf}`)}
                onSelect={() => {
                  runCommand(() => router.push(`/customers/${customer.id}`));
                }}
              >
                <div className="flex items-center justify-between w-full">
                    <div className='flex items-center'>
                        <User className="mr-2 h-4 w-4 text-muted-foreground" />
                        <div className="flex flex-col">
                            <span className="font-medium">{customer.name}</span>
                            <span className="text-[10px] text-muted-foreground">{customer.cpf}</span>
                        </div>
                    </div>
                    <ArrowRight className='h-3 w-3 opacity-0 group-aria-selected:opacity-100 transition-opacity' />
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
          
          <CommandSeparator />
          
          <CommandGroup heading="Propostas">
            {proposals?.map((proposal) => (
              <CommandItem
                key={proposal.id}
                value={normalizeString(`${proposal.proposalNumber} ${proposal.product}`)}
                onSelect={() => {
                  runCommand(() => router.push(`/proposals?open=${proposal.id}`));
                }}
              >
                <div className="flex items-center justify-between w-full">
                    <div className='flex items-center'>
                        <FileText className="mr-2 h-4 w-4 text-muted-foreground" />
                        <div className="flex flex-col">
                            <span className="font-medium">Prop. {proposal.proposalNumber}</span>
                            <span className="text-[10px] text-muted-foreground">{proposal.product} • {proposal.bank}</span>
                        </div>
                    </div>
                    <ArrowRight className='h-3 w-3 opacity-0 group-aria-selected:opacity-100 transition-opacity' />
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  );
}
