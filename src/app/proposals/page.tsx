
'use client';
import React, { Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { AppLayout } from '@/components/app-layout';
import { PageHeader } from '@/components/page-header';
import { ProposalsDataTable, type ProposalsDataTableHandle } from './data-table';
import { getColumns } from './columns';
import { Button } from '@/components/ui/button';
import { PlusCircle, Trash2, FileDown, Printer } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ProposalForm } from './proposal-form';
import type { Proposal, Customer, ProposalStatus, UserSettings, ProposalHistoryEntry } from '@/lib/types';
import { toast } from '@/hooks/use-toast';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { useUser, useFirestore, useCollection, useMemoFirebase, useDoc } from '@/firebase';
import { collection, doc, query, where, writeBatch, setDoc, deleteDoc, updateDoc, arrayUnion } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { format, parse } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { formatCurrency } from '@/lib/utils';
import { CustomerSearchDialog } from '@/components/proposals/customer-search-dialog';


export type ProposalWithCustomer = Proposal & { customer: Customer | undefined };
type ProposalFormData = Partial<Omit<Proposal, 'id' | 'ownerId'>>;

function ProposalsPageSkeleton() {
    return (
        <AppLayout>
            <div className="flex items-center justify-between">
                <PageHeader title="Propostas" />
                <div className="flex items-center gap-2">
                    <Skeleton className="h-10 w-32" />
                    <Skeleton className="h-10 w-32" />
                </div>
            </div>
            <div className="rounded-md border border-border/50 p-4">
                <div className="space-y-2">
                    <Skeleton className="h-10 w-full" />
                    {Array.from({ length: 10 }).map((_, i) => (
                        <Skeleton key={i} className="h-12 w-full" />
                    ))}
                </div>
            </div>
        </AppLayout>
    )
}

function ProposalsPageContent() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const searchParams = useSearchParams();
  const router = useRouter();

  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [isCustomerSearchOpen, setIsCustomerSearchOpen] = React.useState(false);
  const [newlySelectedCustomer, setNewlySelectedCustomer] = React.useState<Customer | null>(null);

  const [selectedProposal, setSelectedProposal] = React.useState<ProposalWithCustomer | undefined>(undefined);
  const [sheetMode, setSheetMode] = React.useState<'new' | 'edit' | 'view'>('new');
  const [rowSelection, setRowSelection] = React.useState({});
  const [defaultValues, setDefaultValues] = React.useState<ProposalFormData | undefined>(undefined);
  const [isSaving, setIsSaving] = React.useState(false);
  const tableRef = React.useRef<ProposalsDataTableHandle>(null);
  const [hasOpenedFromParam, setHasOpenedFromParam] = React.useState(false);
  
  const proposalsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, 'loanProposals'), where('ownerId', '==', user.uid));
  }, [firestore, user]);

  const customersQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, 'customers'), where('ownerId', '==', user.uid));
  }, [firestore, user]);

  const settingsDocRef = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return doc(firestore, 'userSettings', user.uid);
  }, [firestore, user]);
  
  const { data: proposals, isLoading: proposalsLoading } = useCollection<Proposal>(proposalsQuery);
  const { data: customers, isLoading: customersLoading } = useCollection<Customer>(customersQuery);
  const { data: userSettings, isLoading: settingsLoading } = useDoc<UserSettings>(settingsDocRef);

  const nonAnonymizedCustomers = React.useMemo(() => {
    if (!customers) return [];
    return customers.filter(c => c.name !== 'Cliente Removido');
  }, [customers]);

  const proposalsWithCustomerData: ProposalWithCustomer[] = React.useMemo(() => {
    if (!proposals || !customers) return [];
    const customersMap = new Map(customers.map(c => [c.id, c]));
    return proposals.map(p => ({
      ...p,
      customer: customersMap.get(p.customerId),
    }));
  }, [proposals, customers]);

  const handleNewProposal = React.useCallback(() => {
    setSelectedProposal(undefined);
    setDefaultValues(undefined);
    setSheetMode('new');
    setIsDialogOpen(true);
  }, []);

  const handleEditProposal = React.useCallback((proposal: ProposalWithCustomer) => {
    setSelectedProposal(proposal);
    setDefaultValues(undefined);
    setSheetMode('edit');
    setIsDialogOpen(true);
  }, []);

  const handleViewProposal = React.useCallback((proposal: ProposalWithCustomer) => {
    setSelectedProposal(proposal);
    setDefaultValues(undefined);
    setSheetMode('view');
    setIsDialogOpen(true);
  }, []);

  const handleCustomerSelect = (customer: Customer) => {
    setNewlySelectedCustomer(customer);
    setIsCustomerSearchOpen(false);
  };
  
  const handleDuplicateProposal = React.useCallback((proposal: ProposalWithCustomer) => {
    const { id, proposalNumber, status, ...rest } = proposal;
    const duplicatedData: ProposalFormData = {
        ...rest,
        proposalNumber: '',
        status: 'Em Andamento',
        dateDigitized: new Date().toISOString(),
        dateApproved: undefined,
        datePaidToClient: undefined,
        debtBalanceArrivalDate: undefined,
        attachments: [],
    };
    setSelectedProposal(undefined);
    setDefaultValues(duplicatedData);
    setSheetMode('new');
    setIsDialogOpen(true);
  }, []);

  React.useEffect(() => {
    const action = searchParams.get('action');
    const openId = searchParams.get('open');

    if (!proposalsLoading && !customersLoading && !isUserLoading && !hasOpenedFromParam) {
        if (action === 'new') {
            handleNewProposal();
            setHasOpenedFromParam(true);
            router.replace('/proposals', { scroll: false });
        } else if (openId && proposalsWithCustomerData.length > 0) {
            const proposalToOpen = proposalsWithCustomerData.find(p => p.id === openId);
            if (proposalToOpen) {
                handleEditProposal(proposalToOpen);
                setHasOpenedFromParam(true);
                setTimeout(() => {
                    router.replace('/proposals', { scroll: false });
                }, 100);
            }
        }
    }
  }, [searchParams, proposalsLoading, customersLoading, isUserLoading, proposalsWithCustomerData, hasOpenedFromParam, handleNewProposal, handleEditProposal, router]);


  const handlePrint = React.useCallback(() => {
    const hasSelection = Object.keys(rowSelection).length > 0;
    if (hasSelection) {
        document.body.classList.add('print-selection-proposals');
    }
    
    const handleAfterPrint = () => {
        if (hasSelection) {
            document.body.classList.remove('print-selection-proposals');
        }
        window.removeEventListener('afterprint', handleAfterPrint);
    };

    window.addEventListener('afterprint', handleAfterPrint);
    window.print();
  }, [rowSelection]);

  const handleExportToExcel = async () => {
    const table = tableRef.current?.table;
    if (!table) return;

    const { utils, writeFile } = await import('xlsx');
    const selectedRows = table.getFilteredSelectedRowModel().rows;
    let rowsToExport = selectedRows;

    if (rowsToExport.length === 0) {
        rowsToExport = table.getFilteredRowModel().rows;
    }

    if (rowsToExport.length === 0) {
        toast({
            variant: "destructive",
            title: "Nenhuma proposta para exportar",
            description: "A tabela está vazia ou os filtros não retornaram resultados.",
        });
        return;
    }

    const visibleColumns = table.getVisibleLeafColumns().filter(
        c => c.id !== 'Selecionar' && c.id !== 'Ações'
    );

    const headers = visibleColumns.map(c => c.id);

    const dataForSheet = [headers];
    rowsToExport.forEach(row => {
        const rowData: any[] = [];
        visibleColumns.forEach(col => {
            let value = row.getValue(col.id as any);
            if (['Data Digitação', 'Data Averbação', 'Data Pgto. Cliente', 'Chegada Saldo'].includes(col.id)) {
                if (value) {
                    try { value = format(new Date(value as string), "dd/MM/yyyy", { locale: ptBR }); } catch(e) {}
                }
            }
            rowData.push(value ?? '');
        });
        dataForSheet.push(rowData);
    });

    const worksheet = utils.aoa_to_sheet(dataForSheet);
    const workbook = utils.book_new();
    utils.book_append_sheet(workbook, worksheet, 'Propostas');
    writeFile(workbook, 'propostas.xlsx');
  };

  const handleDeleteProposal = React.useCallback(async (proposalId: string) => {
    if (!firestore) return;
    const docRef = doc(firestore, 'loanProposals', proposalId);
    
    // Non-blocking delete
    deleteDoc(docRef)
        .then(() => {
            toast({
                title: 'Proposta Cancelada!',
                description: 'A proposta foi cancelada e removida com sucesso.',
            });
        })
        .catch(async (error: any) => {
            if (error.code === 'permission-denied') {
                errorEmitter.emit('permission-error', new FirestorePermissionError({
                    path: docRef.path,
                    operation: 'delete'
                }));
            }
            toast({
                variant: 'destructive',
                title: 'Erro ao cancelar',
                description: 'Não foi possível remover a proposta. Tente novamente.',
            });
        });
  }, [firestore]);

  const handleStatusChange = React.useCallback(async (proposalId: string, newStatus: ProposalStatus, productType?: string) => {
    if (!firestore || !user) return;
    
    const proposal = proposals?.find(p => p.id === proposalId);
    if (!proposal || proposal.status === newStatus) return;

    const currentDate = new Date().toISOString();
    const dataToUpdate: any = {
        status: newStatus,
        statusUpdatedAt: currentDate
    };
    
    const isPortability = productType === 'Portabilidade';

    if (newStatus === 'Pago') {
        dataToUpdate.dateApproved = currentDate;
        dataToUpdate.datePaidToClient = currentDate;
    } 
    else if (newStatus === 'Saldo Pago') {
        if (isPortability) {
            dataToUpdate.debtBalanceArrivalDate = currentDate;
        }
    }

    // BLINDAGEM FINANCEIRA
    const willHaveApprovalDate = dataToUpdate.dateApproved || proposal.dateApproved;
    const isNotReprovado = newStatus !== 'Reprovado';
    
    if (isNotReprovado && willHaveApprovalDate) {
        if (!proposal.commissionStatus || proposal.commissionStatus === '') {
            dataToUpdate.commissionStatus = 'Pendente';
        }
    }

    // Linha do Tempo
    const historyEntry: ProposalHistoryEntry = {
        id: crypto.randomUUID(),
        date: currentDate,
        message: `Status alterado de "${proposal.status}" para "${newStatus}" (Automático)`,
        userName: user.displayName || user.email || 'Sistema'
    };
    dataToUpdate.history = arrayUnion(historyEntry);

    const docRef = doc(firestore, 'loanProposals', proposalId);
    
    updateDoc(docRef, dataToUpdate)
        .then(() => {
            toast({
                title: 'Status Atualizado!',
                description: `O status da proposta foi alterado para "${newStatus}".`,
            });
        })
        .catch(async (error) => {
            if (error.code === 'permission-denied') {
                errorEmitter.emit('permission-error', new FirestorePermissionError({
                    path: docRef.path,
                    operation: 'update',
                    requestResourceData: dataToUpdate
                }));
            }
        });
  }, [firestore, proposals, user]);

  const handleBulkStatusChange = React.useCallback(async (newStatus: ProposalStatus) => {
    if (!firestore || !user) return;
    const selectedIds = Object.keys(rowSelection);
    setRowSelection({});
    if (selectedIds.length === 0) return;
    
    const batch = writeBatch(firestore);
    const currentDate = new Date().toISOString();
    
    selectedIds.forEach((id) => {
      const docRef = doc(firestore, 'loanProposals', id);
      const proposal = proposals?.find(p => p.id === id);
      const isPortability = proposal?.product === 'Portabilidade';

      const dataToUpdate: any = { 
        status: newStatus,
        statusUpdatedAt: currentDate
      };

      if (newStatus === 'Pago') {
          dataToUpdate.dateApproved = currentDate;
          dataToUpdate.datePaidToClient = currentDate;
      } else if (newStatus === 'Saldo Pago' && isPortability) {
          dataToUpdate.debtBalanceArrivalDate = currentDate;
      }

      const willHaveApprovalDate = dataToUpdate.dateApproved || proposal?.dateApproved;
      const isNotReprovado = newStatus !== 'Reprovado';
      
      if (isNotReprovado && willHaveApprovalDate) {
          if (!proposal?.commissionStatus || proposal?.commissionStatus === '') {
              dataToUpdate.commissionStatus = 'Pendente';
          }
      }

      if (proposal && proposal.status !== newStatus) {
          dataToUpdate.history = arrayUnion({
              id: crypto.randomUUID(),
              date: currentDate,
              message: `Status alterado de "${proposal.status}" para "${newStatus}" (Massa/Automático)`,
              userName: user.displayName || user.email || 'Sistema'
          });
      }

      batch.update(docRef, dataToUpdate);
    });

    try {
      await batch.commit()
      toast({
        title: 'Status Atualizado em Massa!',
        description: `${selectedIds.length} proposta(s) foram atualizadas para "${newStatus}".`,
      });
    } catch (error: any) {
      console.error('Error updating statuses in bulk:', error);
    }
  }, [firestore, rowSelection, proposals, user]);
  
  const handleBulkDelete = React.useCallback(async () => {
    if (!firestore) return;
    const selectedIds = Object.keys(rowSelection);
    setRowSelection({});
    if (selectedIds.length === 0) return;

    const batch = writeBatch(firestore);
    selectedIds.forEach((id) => {
        const docRef = doc(firestore, 'loanProposals', id);
        batch.delete(docRef);
    });
    
    try {
      await batch.commit()
      toast({ title: 'Propostas Canceladas!', description: `${selectedIds.length} proposta(s) foram removidas.` });
    } catch (error: any) {
      console.error('Error deleting proposals in bulk:', error);
    }
  }, [firestore, rowSelection]);


  const handleFormSubmit = async (data: any) => {
    if (!firestore || !user) return;
  
    const toISO = (dateString?: string): string | null => {
        if (!dateString || dateString.trim() === '') return null;
        try {
            const parsed = parse(dateString, 'dd/MM/yyyy', new Date());
            return !isNaN(parsed.getTime()) ? parsed.toISOString() : null;
        } catch {
            return null;
        }
    };
    
    setIsSaving(true);
    try {
        const currentDate = new Date().toISOString();
        const dateApproved = toISO(data.dateApproved);
        let commissionStatus = data.commissionStatus;

        const isEligibleForFinancialFlow = 
            data.status !== 'Reprovado' && 
            (!!dateApproved || data.status === 'Pago' || data.status === 'Saldo Pago');
        
        if (isEligibleForFinancialFlow && (!commissionStatus || commissionStatus === '')) {
            commissionStatus = 'Pendente';
        }

        const proposalData: any = {
            ...data,
            ownerId: user.uid,
            dateDigitized: toISO(data.dateDigitized) || currentDate,
            dateApproved: dateApproved,
            datePaidToClient: toISO(data.datePaidToClient),
            debtBalanceArrivalDate: toISO(data.debtBalanceArrivalDate),
            commissionStatus: commissionStatus || '',
            amountPaid: Number(data.amountPaid) || 0,
            commissionValue: Number(data.commissionValue) || 0,
            grossAmount: Number(data.grossAmount) || 0,
            netAmount: Number(data.netAmount) || 0,
            installmentAmount: Number(data.installmentAmount) || 0,
            term: Number(data.term) || 0,
            interestRate: Number(data.interestRate) || 0,
            commissionPercentage: Number(data.commissionPercentage) || 0,
        };

      if (sheetMode === 'edit' && selectedProposal) {
        const docRef = doc(firestore, 'loanProposals', selectedProposal.id);
        
        if (data.status !== selectedProposal.status) {
            const historyEntry: ProposalHistoryEntry = {
                id: crypto.randomUUID(),
                date: currentDate,
                message: `Status alterado de "${selectedProposal.status}" para "${data.status}" (Formulário/Automático)`,
                userName: user.displayName || user.email || 'Sistema'
            };
            proposalData.history = arrayUnion(historyEntry);
            proposalData.statusUpdatedAt = currentDate;
        }

        setDoc(docRef, proposalData, { merge: true });
        toast({ title: 'Proposta Atualizada!' });
        setIsDialogOpen(false);
      } else {
        const newDocRef = doc(collection(firestore, 'loanProposals'));
        const finalData = { 
          ...proposalData, 
          id: newDocRef.id,
          statusUpdatedAt: currentDate 
        };
        setDoc(newDocRef, finalData);
        toast({ title: 'Proposta Salva!' });
        setIsDialogOpen(false);
      }
    } finally {
        setIsSaving(false);
    }
  };

  const columns = React.useMemo(() => getColumns(handleEditProposal, handleViewProposal, handleDeleteProposal, handleStatusChange, handleDuplicateProposal), [handleEditProposal, handleViewProposal, handleDeleteProposal, handleStatusChange, handleDuplicateProposal]);

  const selectedCount = Object.keys(rowSelection).length;

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <PageHeader title="Propostas" />
        <div className="flex items-center gap-3">
            {selectedCount > 0 && (
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="sm" className="rounded-full px-6 text-xs font-bold shadow-lg">
                            <Trash2 className="h-3.5 w-3.5 mr-2" /> Cancelar ({selectedCount})
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                            <AlertDialogDescription>Remover {selectedCount} proposta(s) permanentemente?</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogAction onClick={handleBulkDelete}>Sim, Remover</AlertDialogAction>
                            <AlertDialogCancel>Voltar</AlertDialogCancel>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            )}
            <Button variant="outline" className="h-10 px-6 rounded-full font-bold border-border/50 text-xs" onClick={handleExportToExcel}>
                <FileDown className="mr-2 h-4 w-4" /> Exportar
            </Button>
            <Button variant="outline" className="h-10 px-6 rounded-full font-bold border-border/50 text-xs" onClick={handlePrint}>
                <Printer className="mr-2 h-4 w-4" /> Imprimir
            </Button>
            <Button onClick={handleNewProposal} className="h-10 px-8 rounded-full font-bold bg-[#00AEEF] hover:bg-[#0096D1] text-white shadow-lg shadow-[#00AEEF]/20 transition-all border-none text-xs">
                <PlusCircle className="mr-2 h-4 w-4" /> Nova Proposta
            </Button>
        </div>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader><DialogTitle>{sheetMode === 'edit' ? 'Editar Proposta' : 'Nova Proposta'}</DialogTitle></DialogHeader>
          <ProposalForm 
            proposal={selectedProposal} 
            allProposals={proposals || []}
            customers={nonAnonymizedCustomers}
            userSettings={userSettings || null}
            isReadOnly={sheetMode === 'view'}
            onSubmit={handleFormSubmit}
            onDuplicate={handleDuplicateProposal}
            defaultValues={defaultValues}
            sheetMode={sheetMode}
            onOpenCustomerSearch={() => setIsCustomerSearchOpen(true)}
            selectedCustomerFromSearch={newlySelectedCustomer}
            onCustomerSearchSelectionHandled={() => setNewlySelectedCustomer(null)}
            isSaving={isSaving}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={isCustomerSearchOpen} onOpenChange={setIsCustomerSearchOpen}>
        <CustomerSearchDialog
            open={isCustomerSearchOpen}
            onOpenChange={setIsCustomerSearchOpen}
            customers={nonAnonymizedCustomers}
            onSelectCustomer={handleCustomerSelect}
        />
      </Dialog>

      {isLoading ? (
        <div className="rounded-md border border-border/50 p-4"><Skeleton className="h-64 w-full" /></div>
      ) : (
        <ProposalsDataTable 
            ref={tableRef}
            columns={columns} 
            data={proposalsWithCustomerData}
            rowSelection={rowSelection}
            setRowSelection={setRowSelection}
            onBulkStatusChange={handleBulkStatusChange}
            userSettings={userSettings || null}
        />
      )}
    </>
  );
}

export default function ProposalsPage() {
    return (
        <AppLayout>
            <Suspense fallback={<ProposalsPageSkeleton />}>
                <ProposalsPageContent />
            </Suspense>
        </AppLayout>
    )
}
