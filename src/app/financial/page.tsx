'use client';
import React from 'react';
import { AppLayout } from '@/components/app-layout';
import { PageHeader } from '@/components/page-header';
import { FinancialDataTable, type FinancialDataTableHandle } from './data-table';
import { getColumns } from './columns';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, doc, setDoc } from 'firebase/firestore';
import type { Proposal, Customer, CommissionStatus } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Eye, EyeOff, Printer, FileCheck2, FileDown } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
  } from '@/components/ui/dialog';
import { CommissionForm, type CommissionFormValues } from './commission-form';
import { toast } from '@/hooks/use-toast';
import { format, startOfMonth, endOfMonth, parse } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Logo } from '@/components/logo';
import { CommissionReconciliation } from '@/components/financial/commission-reconciliation';
import { formatCurrency } from '@/lib/utils';
import { FinancialSummary } from '@/components/financial/financial-summary';
import { ProposalsStatusTable } from '@/components/dashboard/proposals-status-table';


export type ProposalWithCustomer = Proposal & { customer: Customer | undefined };

export default function FinancialPage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const [isPrivacyMode, setIsPrivacyMode] = React.useState(false);
  const [isSheetOpen, setIsSheetOpen] = React.useState(false);
  const [isReconciliationOpen, setIsReconciliationOpen] = React.useState(false);
  const [selectedProposal, setSelectedProposal] = React.useState<ProposalWithCustomer | undefined>(undefined);
  const [isClient, setIsClient] = React.useState(false);
  const [rowSelection, setRowSelection] = React.useState({});
  const tableRef = React.useRef<FinancialDataTableHandle>(null);
  const [dialogData, setDialogData] = React.useState<{ title: string; proposals: ProposalWithCustomer[] } | null>(null);

  React.useEffect(() => {
    setIsClient(true);
  }, []);

  const proposalsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, 'loanProposals'), where('ownerId', '==', user.uid));
  }, [firestore, user]);

  const customersQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, 'customers'), where('ownerId', '==', user.uid));
  }, [firestore, user]);

  const { data: proposals, isLoading: proposalsLoading } = useCollection<Proposal>(proposalsQuery);
  const { data: customers, isLoading: customersLoading } = useCollection<Customer>(customersQuery);

  const { proposalsWithCustomerData, currentMonthProposals } = React.useMemo(() => {
    if (!proposals || !customers || !isClient) return { proposalsWithCustomerData: [], currentMonthProposals: [] };
    
    const customersMap = new Map(customers.map(c => [c.id, c]));
    
    const validProposals = proposals
      .filter(p => p.status !== 'Reprovado')
      .map(p => ({
        ...p,
        customer: customersMap.get(p.customerId),
      }))
      .filter(p => p.customer);

    const today = new Date();
    const start = startOfMonth(today);
    const end = endOfMonth(today);

    const currentMonthData = validProposals.filter(p => {
        const proposalDate = p.commissionPaymentDate ? new Date(p.commissionPaymentDate) : (p.dateDigitized ? new Date(p.dateDigitized) : null);
        if (!proposalDate) return false;
        return proposalDate >= start && proposalDate <= end;
    });

    return { proposalsWithCustomerData: validProposals as ProposalWithCustomer[], currentMonthProposals: currentMonthData as ProposalWithCustomer[] };
  }, [proposals, customers, isClient]);

  const isLoading = proposalsLoading || customersLoading || isUserLoading;

  const handleShowDetails = (title: string, proposals: ProposalWithCustomer[]) => {
    if (!proposals || proposals.length === 0) {
        toast({
            title: 'Nenhum dado para exibir',
            description: `Não há propostas correspondentes para "${title}".`
        });
        return;
    }
    setDialogData({ title, proposals });
  };


  const handleEditCommission = React.useCallback((proposal: ProposalWithCustomer) => {
    setSelectedProposal(proposal);
    setIsSheetOpen(true);
  }, []);
  
  const handleCommissionStatusUpdate = React.useCallback(async (proposal: ProposalWithCustomer, newStatus: CommissionStatus) => {
    if (!firestore || !proposal.customer) return;
  
    const proposalToUpdate: Partial<Proposal> = {
      commissionStatus: newStatus,
    };

    if (newStatus === 'Paga') {
        proposalToUpdate.amountPaid = proposal.commissionValue;
        proposalToUpdate.commissionPaymentDate = new Date().toISOString();
    } else if (newStatus === 'Pendente') {
        proposalToUpdate.amountPaid = 0;
        proposalToUpdate.commissionPaymentDate = undefined;
    }
  
    try {
      await setDoc(doc(firestore, 'loanProposals', proposal.id), proposalToUpdate, { merge: true });
      toast({
        title: 'Status da Comissão Atualizado!',
        description: `O status da proposta foi alterado para "${newStatus}".`,
      });
    } catch (error) {
      console.error('Error updating commission status:', error);
      toast({
        variant: 'destructive',
        title: 'Erro ao Atualizar',
        description: 'Não foi possível atualizar o status da comissão.',
      });
    }
  }, [firestore])


  const handleFormSubmit = async (data: CommissionFormValues) => {
    if (!firestore || !selectedProposal) return;
  
    const proposalToUpdate: Partial<Proposal> = {
      commissionStatus: data.commissionStatus as CommissionStatus,
      amountPaid: data.amountPaid,
      commissionPaymentDate: data.commissionPaymentDate
        ? parse(data.commissionPaymentDate, 'dd/MM/yyyy', new Date()).toISOString()
        : undefined,
    };
  
    try {
      await setDoc(doc(firestore, 'loanProposals', selectedProposal.id), proposalToUpdate, { merge: true });
      toast({
        title: 'Comissão Atualizada!',
        description: `Os dados financeiros da proposta foram atualizados.`,
      });
    } catch (error) {
      console.error('Error updating commission:', error);
      toast({
        variant: 'destructive',
        title: 'Erro ao Atualizar',
        description: 'Não foi possível atualizar os dados da comissão.',
      });
    }
  
    setIsSheetOpen(false);
  };

  const handleReconciliationComplete = () => {
    setIsReconciliationOpen(false);
    // Here you could trigger a re-fetch of the data or rely on the real-time updates
    toast({
      title: "Conciliação Finalizada",
      description: "O processo de conciliação foi concluído."
    })
  }

  const handlePrint = () => {
    const hasSelection = Object.keys(rowSelection).length > 0;
    if (hasSelection) {
        document.body.classList.add('print-selection');
    }
    
    const handleAfterPrint = () => {
        if (hasSelection) {
            document.body.classList.remove('print-selection');
        }
        window.removeEventListener('afterprint', handleAfterPrint);
    };

    window.addEventListener('afterprint', handleAfterPrint);
    window.print();
  }

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
        promotora: 'Promotora',
        customerName: 'Cliente',
        customerCpf: 'CPF',
        proposalNumber: 'Nº Proposta',
        produto: 'Produto',
        banco: 'Banco',
        grossAmount: 'Valor Bruto',
        commissionPercentage: 'Comissão (%)',
        commissionValue: 'Valor Comissão',
        amountPaid: 'Valor Pago',
        commissionStatus: 'Status Comissão',
        commissionPaymentDate: 'Data Pagamento',
      };

    const headers = visibleColumns.map(c => idMap[c.id] || c.id);

    const dataForSheet = [headers];
    selectedRows.forEach(row => {
        const rowData: any[] = [];
        const originalRow = row.original;
        visibleColumns.forEach(col => {
            let value: any;
            switch(col.id) {
                case 'customerName':
                    value = originalRow.customer?.name;
                    break;
                case 'customerCpf':
                    value = originalRow.customer?.cpf;
                    break;
                case 'commissionPaymentDate':
                    value = originalRow.commissionPaymentDate ? format(new Date(originalRow.commissionPaymentDate), "dd/MM/yyyy", { locale: ptBR }) : '-';
                    break;
                default:
                    value = row.getValue(col.id as any);
            }
            
            rowData.push(value ?? '');
        });
        dataForSheet.push(rowData);
    });

    const worksheet = utils.aoa_to_sheet(dataForSheet);

    worksheet['!cols'] = visibleColumns.map(() => ({ wch: 20 }));

    const workbook = utils.book_new();
    utils.book_append_sheet(workbook, worksheet, 'Financeiro');

    writeFile(workbook, 'financeiro.xlsx');
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
        promotora: 'Promotora',
        customerName: 'Cliente',
        customerCpf: 'CPF',
        proposalNumber: 'Nº Proposta',
        produto: 'Produto',
        banco: 'Banco',
        grossAmount: 'Valor Bruto',
        commissionPercentage: 'Comissão (%)',
        commissionValue: 'Valor Comissão',
        amountPaid: 'Valor Pago',
        commissionStatus: 'Status Comissão',
        commissionPaymentDate: 'Data Pagamento',
    };

    const head = [visibleColumns.map(c => idMap[c.id] || c.id)];

    const body = selectedRows.map(row => {
        const rowData: any[] = [];
        const originalRow = row.original;
        visibleColumns.forEach(col => {
            let value: any;
            switch(col.id) {
                case 'customerName':
                    value = originalRow.customer?.name;
                    break;
                case 'customerCpf':
                    value = originalRow.customer?.cpf;
                    break;
                case 'commissionPaymentDate':
                    value = originalRow.commissionPaymentDate ? format(new Date(originalRow.commissionPaymentDate), "dd/MM/yyyy", { locale: ptBR }) : '-';
                    break;
                case 'grossAmount':
                case 'commissionValue':
                case 'amountPaid':
                    value = formatCurrency(Number(row.getValue(col.id as any)));
                    break;
                default:
                    value = row.getValue(col.id as any);
            }
            rowData.push(value ?? '');
        });
        return rowData;
    });

    const doc = new jsPDF();
    doc.text("Relatório Financeiro", 14, 15);
    autoTable(doc, {
        head: head,
        body: body,
        startY: 20,
    });

    doc.save('financeiro.pdf');
  };


  const columns = React.useMemo(() => getColumns({ onEdit: handleEditCommission, onStatusUpdate: handleCommissionStatusUpdate }), [handleEditCommission, handleCommissionStatusUpdate]);

  const selectedCount = Object.keys(rowSelection).length;

  return (
    <AppLayout>
      <div className="flex items-center justify-between print:hidden">
        <PageHeader title="Controle Financeiro" />
        <div className="flex items-center gap-2">
            {selectedCount > 0 && (
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
            )}
            <Dialog open={isReconciliationOpen} onOpenChange={setIsReconciliationOpen}>
                <DialogTrigger asChild>
                    <Button variant="outline">
                        <FileCheck2 />
                        Conciliar Relatórios
                    </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl">
                    <DialogHeader>
                        <DialogTitle>Conciliação de Comissões com IA</DialogTitle>
                    </DialogHeader>
                    <CommissionReconciliation 
                        proposals={proposalsWithCustomerData} 
                        onFinished={handleReconciliationComplete}
                    />
                </DialogContent>
            </Dialog>
            <Button variant="ghost" size="icon" onClick={() => setIsPrivacyMode(!isPrivacyMode)}>
            {isPrivacyMode ? <EyeOff /> : <Eye />}
            <span className="sr-only">{isPrivacyMode ? 'Mostrar valores' : 'Ocultar valores'}</span>
            </Button>
            <Button onClick={handlePrint}><Printer /> Imprimir Relatório</Button>
        </div>
      </div>
      <div className="print:block hidden mb-8">
        <Logo forPrinting={true} />
        <p className="text-sm text-gray-500 mt-2">
            Relatório gerado em: {format(new Date(), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
        </p>
      </div>

       <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent className="w-full max-w-md">
          <SheetHeader>
            <SheetTitle>Editar Comissão</SheetTitle>
          </SheetHeader>
          <CommissionForm
            proposal={selectedProposal}
            onSubmit={handleFormSubmit}
          />
        </SheetContent>
      </Sheet>

      <Dialog open={!!dialogData} onOpenChange={(isOpen) => !isOpen && setDialogData(null)}>
        <DialogContent className="max-w-4xl h-[90vh] flex flex-col" onCloseAutoFocus={(e) => e.preventDefault()}>
            <DialogHeader>
                <DialogTitle>{dialogData?.title}</DialogTitle>
            </DialogHeader>
            <div className="flex-1 overflow-y-auto">
                <ProposalsStatusTable proposals={dialogData?.proposals || []} customers={customers || []} />
            </div>
        </DialogContent>
      </Dialog>

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
        <FinancialDataTable 
            ref={tableRef}
            columns={columns} 
            data={proposalsWithCustomerData}
            currentMonthData={currentMonthProposals}
            isPrivacyMode={isPrivacyMode} 
            rowSelection={rowSelection}
            setRowSelection={setRowSelection}
            onShowDetails={handleShowDetails}
        />
      )}
    </AppLayout>
  );
}
