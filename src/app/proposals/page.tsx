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
import type { Proposal, Customer, ProposalStatus, UserSettings } from '@/lib/types';
import { toast } from '@/hooks/use-toast';
import { useUser, useFirestore, useCollection, useMemoFirebase, useDoc } from '@/firebase';
import { collection, doc, query, where, writeBatch, setDoc, deleteDoc, updateDoc } from 'firebase/firestore';
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

    if (!proposalsLoading && !customersLoading && !hasOpenedFromParam) {
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
  }, [searchParams, proposalsLoading, customersLoading, proposalsWithCustomerData, hasOpenedFromParam, handleNewProposal, handleEditProposal, router]);


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
        c => c.id !== 'select' && c.id !== 'actions'
    );

    const idMap: {[key: string]: string} = {
        promoter: 'Promotora',
        proposalNumber: 'Nº Proposta',
        customerName: 'Cliente',
        customerCpf: 'CPF',
        product: 'Produto',
        banco_digitado_v6: 'Banco Digitado',
        operator: 'Operador',
        grossAmount: 'Valor Bruto',
        status: 'Status',
        commissionValue: 'Comissão',
        dateDigitized: 'Data Digitação',
        dateApproved: 'Data Averbação',
        datePaidToClient: 'Data Pgto. Cliente',
        debtBalanceArrivalDate: 'Chegada Saldo',
    };

    const headers = visibleColumns.map(c => idMap[c.id] || c.id);

    const dataForSheet = [headers];
    rowsToExport.forEach(row => {
        const rowData: any[] = [];
        visibleColumns.forEach(col => {
            let value = row.getValue(col.id as any);
            if (['dateDigitized', 'dateApproved', 'datePaidToClient', 'debtBalanceArrivalDate'].includes(col.id)) {
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

  const handleExportToPdf = async () => {
    const table = tableRef.current?.table;
    if (!table) return;

    const { default: jsPDF } = await import('jspdf');
    const { default: autoTable } = await import('jspdf-autotable');

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
        c => c.id !== 'select' && c.id !== 'actions'
    );

    const idMap: {[key: string]: string} = {
        promoter: 'Promotora',
        proposalNumber: 'Nº Proposta',
        customerName: 'Cliente',
        customerCpf: 'CPF',
        product: 'Produto',
        banco_digitado_v6: 'Banco Digitado',
        operator: 'Operador',
        grossAmount: 'Valor Bruto',
        status: 'Status',
        commissionValue: 'Comissão',
        dateDigitized: 'Data Digitação',
        dateApproved: 'Data Averbação',
        datePaidToClient: 'Data Pgto. Cliente',
        debtBalanceArrivalDate: 'Chegada Saldo',
    };

    const head = [visibleColumns.map(c => idMap[c.id] || c.id)];

    const body = rowsToExport.map(row => {
        const rowData: any[] = [];
        visibleColumns.forEach(col => {
            let value = row.getValue(col.id as any);
             if (['dateDigitized', 'dateApproved', 'datePaidToClient', 'debtBalanceArrivalDate'].includes(col.id)) {
                if (value) {
                    try { value = format(new Date(value as string), "dd/MM/yyyy", { locale: ptBR }); } catch(e) {}
                }
            }
            if (['grossAmount', 'commissionValue'].includes(col.id)) {
                value = formatCurrency(Number(value));
            }
            rowData.push(value ?? '');
        });
        return rowData;
    });

    const doc = new jsPDF();
    doc.text("Relatório de Propostas", 14, 15);
    autoTable(doc, {
        head: head,
        body: body,
        startY: 20,
    });

    doc.save('propostas.pdf');
  };

  const handleDeleteProposal = React.useCallback(async (proposalId: string) => {
    if (!firestore) return;
    try {
      await deleteDoc(doc(firestore, 'loanProposals', proposalId));
      toast({
        title: 'Proposta Cancelada!',
        description: 'A proposta foi cancelada e removida com sucesso.',
      });
    } catch (error) {
        toast({
            variant: 'destructive',
            title: 'Erro ao cancelar',
            description: 'Não foi possível remover a proposta. Tente novamente.',
        });
        console.error('Error deleting proposal: ', error);
    }
  }, [firestore]);

  const handleStatusChange = React.useCallback(async (proposalId: string, newStatus: ProposalStatus) => {
    if (!firestore) return;
    
    const dataToUpdate: { status: ProposalStatus; dateApproved?: string; datePaidToClient?: string } = {
        status: newStatus,
    };

    if (newStatus === 'Pago' || newStatus === 'Saldo Pago') {
        const currentDate = new Date().toISOString();
        dataToUpdate.dateApproved = currentDate;
        dataToUpdate.datePaidToClient = currentDate;
    }

    try {
      await updateDoc(doc(firestore, 'loanProposals', proposalId), dataToUpdate);
      toast({
          title: 'Status Atualizado!',
          description: `O status da proposta foi alterado para "${newStatus}".`,
      });
    } catch (error) {
        console.error('Error updating status:', error);
        toast({
            variant: 'destructive',
            title: 'Erro ao Atualizar',
            description: 'Não foi possível alterar o status da proposta.',
        });
    }
  }, [firestore]);

  const handleBulkStatusChange = React.useCallback(async (newStatus: ProposalStatus) => {
    if (!firestore) return;
    const selectedIds = Object.keys(rowSelection);
    setRowSelection({});
    if (selectedIds.length === 0) return;
    
    const batch = writeBatch(firestore);
    
    const dataToUpdate: { status: ProposalStatus; dateApproved?: string; datePaidToClient?: string } = {
        status: newStatus,
    };

    if (newStatus === 'Pago' || newStatus === 'Saldo Pago') {
        const currentDate = new Date().toISOString();
        dataToUpdate.dateApproved = currentDate;
        dataToUpdate.datePaidToClient = currentDate;
    }

    selectedIds.forEach((id) => {
      const docRef = doc(firestore, 'loanProposals', id);
      batch.update(docRef, dataToUpdate);
    });

    try {
      await batch.commit()
      toast({
        title: 'Status Atualizado em Massa!',
        description: `${selectedIds.length} proposta(s) foram atualizadas para "${newStatus}".`,
      });
    } catch (error) {
      console.error('Error updating statuses in bulk:', error);
      toast({
        variant: 'destructive',
        title: 'Erro ao atualizar',
        description: 'Ocorreu um erro ao atualizar o status das propostas.',
      });
    }
  }, [firestore, rowSelection]);
  
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
      toast({
          title: 'Propostas Canceladas!',
          description: `${selectedIds.length} proposta(s) foram canceladas com sucesso.`,
      });
    } catch (error) {
      console.error('Error deleting proposals in bulk:', error);
      toast({
          variant: 'destructive',
          title: 'Erro ao cancelar',
          description: 'Ocorreu um erro ao cancelar as propostas selecionadas.',
      });
    }
  }, [firestore, rowSelection]);


  const handleFormSubmit = async (data: Omit<Proposal, 'id' | 'ownerId'>) => {
    if (!firestore || !user) return;
  
    const toValue = (dateString?: string): string | null => {
        if (!dateString || dateString.trim() === '') return null;
        try {
            const parsed = parse(dateString, 'dd/MM/yyyy', new Date());
            return !isNaN(parsed.getTime()) ? parsed.toISOString() : null;
        } catch {
            return null;
        }
    };
    
    try {
        const typedData = data as Proposal;
        const dateApproved = toValue(typedData.dateApproved);
        let commissionStatus = typedData.commissionStatus;

        const isEligibleForSaldoAReceber = 
            typedData.status === 'Pago' ||
            typedData.status === 'Saldo Pago' ||
            (typedData.status === 'Em Andamento' && !!dateApproved) ||
            (typedData.status === 'Pendente' && !!dateApproved);
        
        if (isEligibleForSaldoAReceber && !commissionStatus) {
            commissionStatus = 'Pendente';
        }

        const proposalData = {
            ...data,
            dateDigitized: toValue(typedData.dateDigitized) || new Date().toISOString(),
            dateApproved: dateApproved,
            datePaidToClient: toValue(typedData.datePaidToClient),
            debtBalanceArrivalDate: toValue(typedData.debtBalanceArrivalDate),
            commissionStatus: commissionStatus,
        };
        
        const cleanData = {
            ...proposalData,
            ownerId: user.uid
        };

      if (sheetMode === 'edit' && selectedProposal) {
        await setDoc(doc(firestore, 'loanProposals', selectedProposal.id), cleanData, { merge: true });
        toast({
          title: 'Proposta Atualizada!',
          description: `A proposta foi atualizada com sucesso.`,
        });
      } else {
        const newDocRef = doc(collection(firestore, 'loanProposals'));
        const newProposalWithId = {
          ...cleanData,
          id: newDocRef.id,
        };
    
        await setDoc(newDocRef, newProposalWithId);
        toast({
          title: 'Proposta Salva!',
          description: `A nova proposta foi criada com sucesso.`,
        });
      }
    } catch (error) {
      console.error('Error saving proposal:', error);
      toast({
        variant: 'destructive',
        title: 'Erro ao Salvar',
        description: 'Não foi possível salvar a proposta. Tente novamente.',
      });
    }

    setIsDialogOpen(false);
  };

  const getSheetTitle = () => {
    if (sheetMode === 'new') return 'Nova Proposta';
    if (sheetMode === 'edit') return 'Editar Proposta';
    return 'Detalhes da Proposta';
  };

  const isLoading = proposalsLoading || customersLoading || isUserLoading || settingsLoading;

  const columns = React.useMemo(() => getColumns(handleEditProposal, handleViewProposal, handleDeleteProposal, handleStatusChange, handleDuplicateProposal), [handleEditProposal, handleViewProposal, handleDeleteProposal, handleStatusChange, handleDuplicateProposal]);

  const selectedCount = Object.keys(rowSelection).length;

  return (
    <>
      <div className="flex items-center justify-between">
        <PageHeader title="Propostas" />
        <div className="flex items-center gap-2">
            {selectedCount > 0 && (
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button variant="destructive">
                            <Trash2 />
                            Cancelar ({selectedCount})
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                            <AlertDialogDescription>
                                Essa ação não pode ser desfeita. Isso irá cancelar permanentemente {selectedCount} proposta(s).
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Voltar</AlertDialogCancel>
                            <AlertDialogAction onClick={handleBulkDelete}>Cancelar Propostas</AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            )}
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="outline">
                        <FileDown />
                        Exportar
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuItem onSelect={handleExportToExcel}>
                        Exportar para Excel (.xlsx)
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={handleExportToPdf}>
                        Exportar para PDF (.pdf)
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
            <Button variant="outline" onClick={handlePrint}>
                <Printer />
                Imprimir Relatório
            </Button>
            <Button onClick={handleNewProposal}>
                <PlusCircle />
                Nova Proposta
            </Button>
        </div>
      </div>
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent
          className="max-w-3xl"
        >
          <DialogHeader className="print:hidden">
            <DialogTitle>{getSheetTitle()}</DialogTitle>
          </DialogHeader>
          <ProposalForm 
            proposal={selectedProposal} 
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
          />
        </DialogContent>
      </Dialog>

      <CustomerSearchDialog
        open={isCustomerSearchOpen}
        onOpenChange={setIsCustomerSearchOpen}
        customers={nonAnonymizedCustomers}
        onSelectCustomer={handleCustomerSelect}
       />

      {isLoading ? (
        <div className="rounded-md border border-border/50 p-4">
            <div className="space-y-2">
              <Skeleton className="h-10 w-full" />
              {Array.from({ length: 10 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
        </div>
      ) : (
        <ProposalsDataTable 
            ref={tableRef}
            columns={columns} 
            data={proposalsWithCustomerData}
            rowSelection={rowSelection}
            setRowSelection={setRowSelection}
            onBulkStatusChange={handleBulkStatusChange}
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
