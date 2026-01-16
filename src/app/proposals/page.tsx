'use client';
import React from 'react';
import { AppLayout } from '@/components/app-layout';
import { PageHeader } from '@/components/page-header';
import { ProposalsDataTable, type ProposalsDataTableHandle } from './data-table';
import { getColumns } from './columns';
import { Button } from '@/components/ui/button';
import { PlusCircle, Trash2, FileDown } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { ProposalForm } from './proposal-form';
import type { Proposal, Customer, ProposalStatus } from '@/lib/types';
import { toast } from '@/hooks/use-toast';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, doc, query, where, writeBatch, setDoc, deleteDoc } from 'firebase/firestore';
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


export type ProposalWithCustomer = Proposal & { customer: Customer | undefined };
type ProposalFormData = Partial<Omit<Proposal, 'id' | 'ownerId'>>;

export default function ProposalsPage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();

  const [isSheetOpen, setIsSheetOpen] = React.useState(false);
  const [selectedProposal, setSelectedProposal] = React.useState<ProposalWithCustomer | undefined>(undefined);
  const [sheetMode, setSheetMode] = React.useState<'new' | 'edit' | 'view'>('new');
  const [rowSelection, setRowSelection] = React.useState({});
  const [defaultValues, setDefaultValues] = React.useState<ProposalFormData | undefined>(undefined);
  const tableRef = React.useRef<ProposalsDataTableHandle>(null);
  
  const proposalsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, 'loanProposals'), where('ownerId', '==', user.uid));
  }, [firestore, user]);

  const customersQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, 'customers'), where('ownerId', '==', user.uid), where('name', '!=', 'Cliente Removido'));
  }, [firestore, user]);
  
  const { data: proposals, isLoading: proposalsLoading } = useCollection<Proposal>(proposalsQuery);
  const { data: customers, isLoading: customersLoading } = useCollection<Customer>(customersQuery);

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
    setIsSheetOpen(true);
  }, []);

  const handleEditProposal = React.useCallback((proposal: ProposalWithCustomer) => {
    setSelectedProposal(proposal);
    setDefaultValues(undefined);
    setSheetMode('edit');
    setIsSheetOpen(true);
  }, []);

  const handleViewProposal = React.useCallback((proposal: ProposalWithCustomer) => {
    setSelectedProposal(proposal);
    setDefaultValues(undefined);
    setSheetMode('view');
    setIsSheetOpen(true);
  }, []);
  
  const handleDuplicateProposal = React.useCallback((proposal: ProposalWithCustomer) => {
    const { id, proposalNumber, status, ...rest } = proposal;
    const duplicatedData: ProposalFormData = {
        ...rest,
        // Limpe campos que devem ser únicos ou redefinidos
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
    setIsSheetOpen(true);
}, []);

const handleExportToExcel = async () => {
    const table = tableRef.current?.table;
    if (!table) return;

    const { utils, writeFile } = await import('xlsx');
    const selectedRows = table.getFilteredSelectedRowModel().rows;

    if (selectedRows.length === 0) {
        toast({
            variant: "destructive",
            title: "Nenhuma proposta selecionada",
            description: "Selecione as propostas que deseja exportar.",
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
    selectedRows.forEach(row => {
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
    worksheet['!cols'] = visibleColumns.map(() => ({ wch: 20 }));

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

    if (selectedRows.length === 0) {
        toast({
            variant: "destructive",
            title: "Nenhuma proposta selecionada",
            description: "Selecione as propostas que deseja exportar.",
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

    const body = selectedRows.map(row => {
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
    try {
      const { updateDoc } = await import('firebase/firestore');
      await updateDoc(doc(firestore, 'loanProposals', proposalId), { status: newStatus });
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
    setRowSelection({}); // Immediate UI feedback
    if (selectedIds.length === 0) return;
    
    const batch = writeBatch(firestore);
    selectedIds.forEach((id) => {
      const docRef = doc(firestore, 'loanProposals', id);
      batch.update(docRef, { status: newStatus });
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
    setRowSelection({}); // Immediate UI feedback
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
  
    const toISOString = (dateString?: string) => {
        if (!dateString) return undefined;
        try {
            const parsed = parse(dateString, 'dd/MM/yyyy', new Date());
            return !isNaN(parsed.getTime()) ? parsed.toISOString() : undefined;
        } catch {
            return undefined;
        }
    };
    
    try {
      if (sheetMode === 'edit' && selectedProposal) {
        const proposalToUpdate: Partial<Proposal> = {
          ...data,
          dateDigitized: toISOString(data.dateDigitized),
          dateApproved: toISOString(data.dateApproved),
          datePaidToClient: toISOString(data.datePaidToClient),
          debtBalanceArrivalDate: toISOString(data.debtBalanceArrivalDate),
        };
        await setDoc(doc(firestore, 'loanProposals', selectedProposal.id), proposalToUpdate, { merge: true });
        toast({
          title: 'Proposta Atualizada!',
          description: `A proposta foi atualizada com sucesso.`,
        });
      } else {
        const newDocRef = doc(collection(firestore, 'loanProposals'));
        const newProposal: Omit<Proposal, 'id'> = {
          ...data,
          ownerId: user.uid,
          dateDigitized: toISOString(data.dateDigitized) || new Date().toISOString(),
          dateApproved: toISOString(data.dateApproved),
          datePaidToClient: toISOString(data.datePaidToClient),
          debtBalanceArrivalDate: toISOString(data.debtBalanceArrivalDate),
        };
        const newProposalWithId = { ...newProposal, id: newDocRef.id };
    
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

    setIsSheetOpen(false);
  };
  
  const getSheetTitle = () => {
    if (sheetMode === 'new') return 'Nova Proposta';
    if (sheetMode === 'edit') return 'Editar Proposta';
    return 'Detalhes da Proposta';
  };

  const isLoading = proposalsLoading || customersLoading || isUserLoading;

  const columns = React.useMemo(() => getColumns(handleEditProposal, handleViewProposal, handleDeleteProposal, handleStatusChange), [handleEditProposal, handleViewProposal, handleDeleteProposal, handleStatusChange]);

  const selectedCount = Object.keys(rowSelection).length;

  return (
    <AppLayout>
      <div className="flex items-center justify-between">
        <PageHeader title="Propostas" />
        <div className="flex items-center gap-2">
            {selectedCount > 0 && (
                <>
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
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline">
                                <FileDown />
                                Exportar ({selectedCount})
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={handleExportToExcel}>
                                Exportar para Excel (.xlsx)
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={handleExportToPdf}>
                                Exportar para PDF (.pdf)
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </>
            )}
            <Button onClick={handleNewProposal}>
                <PlusCircle />
                Nova Proposta
            </Button>
        </div>
      </div>
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent className="w-full max-w-3xl sm:max-w-3xl">
          <SheetHeader className="print:hidden">
            <SheetTitle>{getSheetTitle()}</SheetTitle>
          </SheetHeader>
          <ProposalForm 
            proposal={selectedProposal} 
            customers={customers || []}
            isReadOnly={sheetMode === 'view'}
            onSubmit={handleFormSubmit}
            onDuplicate={handleDuplicateProposal}
            defaultValues={defaultValues}
            sheetMode={sheetMode}
          />
        </SheetContent>
      </Sheet>
      {isLoading ? (
        <div className="rounded-md border p-4">
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
    </AppLayout>
  );
}
