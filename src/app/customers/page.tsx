'use client';
import React, { Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { AppLayout } from '@/components/app-layout';
import { PageHeader } from '@/components/page-header';
import { CustomerDataTable, type CustomerDataTableHandle } from './data-table';
import { getColumns } from './columns';
import { Button } from '@/components/ui/button';
import { PlusCircle, FileDown, UserCheck, UserX, Trash2, Sparkles, Landmark, X, Tag, Cake, ChevronRight } from 'lucide-react';
import { CustomerForm } from './customer-form';
import type { Customer, UserSettings, Proposal, Lead } from '@/lib/types';
import { useUser, useFirestore, useCollection, useMemoFirebase, useDoc } from '@/firebase';
import { collection, doc, updateDoc, setDoc, query, where, writeBatch, limit, orderBy, getDocs } from 'firebase/firestore';
import { toast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
} from "@/components/ui/alert-dialog";
import { CustomerAiForm } from '@/components/customers/customer-ai-form';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getAge, cn, cleanBankName, cleanFirestoreData, getSmartTags, parseDateSafe } from '@/lib/utils';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { BankIcon } from '@/components/bank-icon';
import { BirthdayCalendar } from '@/components/customers/birthday-calendar';
import * as configData from '@/lib/config-data';

function CustomersPageContent() {
  const { user } = useUser();
  const firestore = useFirestore();
  const searchParams = useSearchParams();
  const router = useRouter();

  const [isDialog, setIsDialog] = React.useState(false);
  const [isAiModalOpen, setIsAiModalOpen] = React.useState(false);
  const [selectedCustomer, setSelectedCustomer] = React.useState<Customer | undefined>(undefined);
  const [defaultValues, setDefaultValues] = React.useState<any | undefined>(undefined);
  const [sheetMode, setSheetMode] = React.useState<'new' | 'edit'>('new');
  const [rowSelection, setRowSelection] = React.useState<Record<string, boolean>>({});
  const [isSaving, setIsSaving] = React.useState(false);
  const [formKey, setFormKey] = React.useState('initial');
  const tableRef = React.useRef<CustomerDataTableHandle>(null);
  
  // ⚡ PERFORMANCE: Limite de carregamento inicial
  const [staticCustomers, setStaticCustomers] = React.useState<Customer[]>([]);
  const [isLoadingMore, setIsLoadingMore] = React.useState(false);
  const [hasMoreCustomers, setHasMoreCustomers] = React.useState(true);
  const LOAD_CHUNK_SIZE = 150;
  
  const initialTab = searchParams.get('tab') || 'active';
  const [filter, setFilter] = React.useState(initialTab);
  
  const [rmcFilter, setRmcFilter] = React.useState('all');
  const [rccFilter, setRccFilter] = React.useState('all');
  const [tagFilter, setTagFilter] = React.useState('all');

  const customersQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(
        collection(firestore, 'customers'), 
        where('ownerId', '==', user.uid),
        orderBy('numericId', 'desc'),
        limit(LOAD_CHUNK_SIZE) // ⚡ Fixo em 150 para proteger o backend
    );
  }, [firestore, user]);

  const proposalsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(
        collection(firestore, 'loanProposals'), 
        where('ownerId', '==', user.uid),
        orderBy('dateDigitized', 'desc'),
        limit(300)
    );
  }, [firestore, user]);

  const leadsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(
        collection(firestore, 'leads'),
        where('ownerId', '==', user.uid)
    );
  }, [firestore, user]);

  const settingsDocRef = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return doc(firestore, 'userSettings', user.uid);
  }, [firestore, user]);

  const { data: realTimeCustomers, isLoading: isCustomersLoading } = useCollection<Customer>(customersQuery);
  const { data: proposals } = useCollection<Proposal>(proposalsQuery);
  const { data: leads } = useCollection<Lead>(leadsQuery);
  const { data: userSettings } = useDoc<UserSettings>(settingsDocRef);

  const customers = React.useMemo(() => {
      const map = new Map();
      if (staticCustomers.length) {
          staticCustomers.forEach(c => map.set(c.id, c));
      }
      if (realTimeCustomers) {
          realTimeCustomers.forEach(c => map.set(c.id, c));
      }
      if (leads) {
          leads.filter(l => l.status === 'pending').forEach(l => {
              // Converte visualmente o lead para o formato Customer
              const safeLeadDate = parseDateSafe(l.createdAt) || new Date();
              map.set(l.id, {
                  id: l.id,
                  numericId: Number.MAX_SAFE_INTEGER - safeLeadDate.getTime() % 1000000, 
                  name: l.name + ' (🔥 LEAD DO PORTAL)',
                  cpf: l.cpf,
                  phone: l.phone,
                  birthDate: l.birthDate,
                  ownerId: l.ownerId,
                  status: 'active',
                  tags: ['LEAD DO PORTAL'],
                  observations: `Lead gerado pelo portal em ${l.createdAt && parseDateSafe(l.createdAt) ? format(parseDateSafe(l.createdAt)!, 'dd/MM/yyyy HH:mm') : 'desconhecido'}.\nValor desejado: ${l.requestedAmount || 0}\n\n${l.observations || ''}`,
                  cep: l.cep,
                  street: l.street,
                  number: l.number,
                  complement: l.complement,
                  neighborhood: l.neighborhood,
                  city: l.city,
                  state: l.state
              } as unknown as Customer);
          });
      }
      const arr = Array.from(map.values()).sort((a: any,b: any) => (b.numericId || 0) - (a.numericId || 0));
      return arr.length ? arr : [];
  }, [realTimeCustomers, staticCustomers, leads]);

  const loadMoreCustomers = async () => {
      if (!firestore || !user || !customers.length) return;
      setIsLoadingMore(true);
      try {
          const lastCustomer = customers[customers.length - 1];
          // Fallback cirúrgico: se cliente muito velho não tem numericId, usamos 1 como margem de segurança
          const lastId = lastCustomer?.numericId || 1;

          const q = query(
              collection(firestore, 'customers'),
              where('ownerId', '==', user.uid),
              where('numericId', '<', lastId),
              orderBy('numericId', 'desc'),
              limit(LOAD_CHUNK_SIZE)
          );
          const snap = await getDocs(q);
          const newCustomers = snap.docs.map(d => ({ ...d.data(), id: d.id } as Customer));
          
          if (newCustomers.length > 0) {
              setStaticCustomers(prev => [...prev, ...newCustomers]);
              if (newCustomers.length < LOAD_CHUNK_SIZE) {
                  setHasMoreCustomers(false);
              }
          } else {
              setHasMoreCustomers(false);
              toast({ title: "Todos os registros carregados!", description: "Fim da lista alcançado." });
          }
      } catch (e) {
          console.error(e);
          toast({ variant: 'destructive', title: "Erro ao buscar mais dados" });
      } finally {
          setIsLoadingMore(false);
      }
  };

  const banks = userSettings?.banks || configData.banks;
  const availableTags = userSettings?.customerTags || configData.defaultCustomerTags;
  const showLogos = userSettings?.showBankLogos ?? true;

  const proposalsByCustomer = React.useMemo(() => {
      const map = new Map<string, Proposal[]>();
      if (proposals) {
          proposals.forEach(p => {
              if (!map.has(p.customerId)) map.set(p.customerId, []);
              map.get(p.customerId)!.push(p);
          });
      }
      return map;
  }, [proposals]);

  const processedCustomers = React.useMemo(() => {
    if (!customers) return [];
    
    return customers
        .filter(c => c.deleted !== true)
        .map(c => {
            const customerProposals = proposalsByCustomer.get(c.id) || [];
            const smartTags = getSmartTags(c, customerProposals);
            return {
                ...c,
                smartTags: smartTags.map(st => st.label),
                smartTagsFull: smartTags
            };
        });
  }, [customers, proposalsByCustomer]);

  const filteredCustomers = React.useMemo(() => {
    return processedCustomers.filter(c => {
        if (filter === 'birthdays') return false;
        if (c.name === 'Cliente Removido') return false;

        const age = getAge(c.birthDate);
        const isStatusMatch = filter === 'active' 
            ? (c.status !== 'inactive' && age < 75)
            : (c.status === 'inactive' || age >= 75);
        
        if (!isStatusMatch) return false;

        if (rmcFilter !== 'all') {
            const hasRmc = c.benefits?.some(b => b.rmcBank === rmcFilter);
            if (!hasRmc) return false;
        }

        if (rccFilter !== 'all') {
            const hasRcc = c.benefits?.some(b => b.rccBank === rccFilter);
            if (!hasRcc) return false;
        }

        if (tagFilter !== 'all') {
            const hasTag = c.tags?.includes(tagFilter) || c.smartTags?.includes(tagFilter);
            if (!hasTag) return false;
        }

        return true;
    });
  }, [processedCustomers, filter, rmcFilter, rccFilter, tagFilter]);

  const handleEditCustomer = React.useCallback((customer: Customer) => {
    setSelectedCustomer(customer);
    setDefaultValues(undefined);
    setSheetMode('edit');
    setFormKey(`edit-${customer.id}`);
    setIsDialog(true);
  }, []);

  React.useEffect(() => {
      const editLeadId = searchParams.get('editLead');
      if (editLeadId && processedCustomers.length > 0) {
          const lead = processedCustomers.find(c => c.id === editLeadId && c.tags?.includes('LEAD DO PORTAL'));
          if (lead && !isDialog) {
              handleEditCustomer(lead);
              const url = new URL(window.location.href);
              url.searchParams.delete('editLead');
              window.history.replaceState({}, '', url.toString());
          }
      }
  }, [searchParams, processedCustomers, handleEditCustomer, isDialog]);

  const handleMoveToTrash = React.useCallback(async (customerId: string) => {
    if (!firestore || !user) return;
    setIsSaving(true);
    
    // Identifica dinamicamente a qual coleção a ID pertencia (customers ou leads)
    const activeItem = processedCustomers?.find(c => c.id === customerId);
    const isLead = activeItem?.tags?.includes('LEAD DO PORTAL');
    const targetCollection = isLead ? 'leads' : 'customers';
    
    const docRef = doc(firestore, targetCollection, customerId);
    
    const dataToUpdate: any = { 
        deleted: true,
        deletedAt: new Date().toISOString(),
        deletedBy: user.uid
    };

    if (isLead) {
        dataToUpdate.status = 'refused';
    }
    
    try {
        await updateDoc(docRef, dataToUpdate);
        toast({ title: isLead ? 'Lead deletado' : 'Movido para a Lixeira' });
    } catch (error: any) {
        toast({ variant: 'destructive', title: 'Erro ao excluir' });
    } finally {
        setIsSaving(false);
    }
  }, [firestore, user, processedCustomers]);

  const columns = React.useMemo(() => getColumns({ 
    onEdit: handleEditCustomer, 
    onDelete: handleMoveToTrash 
  }), [handleEditCustomer, handleMoveToTrash]);

  const handleNewCustomer = React.useCallback(() => {
    setSelectedCustomer(undefined);
    setDefaultValues(undefined);
    setSheetMode('new');
    setFormKey(`new-${Date.now()}`); 
    setIsDialog(true);
  }, []);

  const selectedCount = React.useMemo(() => Object.keys(rowSelection).filter(id => rowSelection[id]).length, [rowSelection]);

  const handleBulkMoveToTrash = async () => {
    if (!firestore || !user || selectedCount === 0) return;
    setIsSaving(true);
    try {
        const batch = writeBatch(firestore);
        const selectedIds = Object.keys(rowSelection).filter(id => rowSelection[id]);
        const now = new Date().toISOString();
        
        selectedIds.forEach(id => {
            const activeItem = processedCustomers?.find(c => c.id === id);
            const isLead = activeItem?.tags?.includes('LEAD DO PORTAL');
            const targetCollection = isLead ? 'leads' : 'customers';

            const docRef = doc(firestore, targetCollection, id);
            const dataToUpdate: any = { 
                deleted: true,
                deletedAt: now,
                deletedBy: user.uid
            };

            if (isLead) {
                dataToUpdate.status = 'refused';
            }

            batch.update(docRef, dataToUpdate);
        });

        await batch.commit();
        toast({ title: 'Enviados para a Lixeira', description: `${selectedIds.length} registros movidos.` });
        setRowSelection({});
    } catch (e: any) {
        toast({ variant: 'destructive', title: 'Erro na operação' });
    } finally {
        setIsSaving(false);
    }
  };

  const handleFormSubmit = async (formData: any) => {
    if (!firestore || !user) return;
    setIsSaving(true);
    try {
        const isLead = sheetMode === 'edit' && selectedCustomer?.tags?.includes('LEAD DO PORTAL');
        
        const docId = (sheetMode === 'edit' && selectedCustomer && !isLead) ? selectedCustomer.id : (defaultValues?.id || doc(collection(firestore, 'customers')).id);
        const docRef = doc(firestore, 'customers', docId);
        
        let targetNumericId = formData.numericId;
        if (sheetMode === 'edit' && selectedCustomer && !isLead) {
            targetNumericId = selectedCustomer.numericId;
        } else {
            const realCustomers = processedCustomers?.filter(c => !c.tags?.includes('LEAD DO PORTAL')) || [];
            targetNumericId = realCustomers.length > 0 ? Math.max(...realCustomers.map(c => c.numericId || 0)) + 1 : 1;
        }

        const cleanTags = formData.tags?.filter((t: string) => t !== 'LEAD DO PORTAL') || [];

        const finalData = cleanFirestoreData({
            ...formData,
            id: docId,
            ownerId: user.uid,
            numericId: targetNumericId,
            tags: cleanTags
        });

        const batch = writeBatch(firestore);
        batch.set(docRef, finalData, { merge: true });

        if (isLead && selectedCustomer) {
            const leadRef = doc(firestore, 'leads', selectedCustomer.id);
            batch.update(leadRef, { status: 'approved', customerId: docId });
        }

        await batch.commit();

        toast({ title: isLead ? 'Lead convertido em Cliente!' : 'Cliente Salvo!' });
        setIsDialog(false);
    } catch (error: any) {
        toast({ variant: 'destructive', title: 'Erro ao salvar' });
    } finally {
        setIsSaving(false);
    }
  };

  const handleAiFormSubmit = (aiData: any) => {
    const newId = doc(collection(firestore!, 'customers')).id;
    setSelectedCustomer(undefined);
    setDefaultValues({ ...aiData, id: newId });
    setSheetMode('new');
    setFormKey(`ai-${newId}`);
    setIsAiModalOpen(false);
    setIsDialog(true);
  }

  const handleExportToExcel = async () => {
    const table = tableRef.current?.table;
    if (!table) return;
    const { utils, writeFile } = await import('xlsx');
    const rows = table.getFilteredRowModel().rows;
    const worksheet = utils.json_to_sheet(rows.map(r => r.original));
    const workbook = utils.book_new();
    utils.book_append_sheet(workbook, worksheet, 'Clientes');
    writeFile(workbook, 'clientes.xlsx');
  };

  const handleClearFilters = () => {
      setRmcFilter('all');
      setRccFilter('all');
      setTagFilter('all');
  };

  const hasActiveFilters = rmcFilter !== 'all' || rccFilter !== 'all' || tagFilter !== 'all';

  React.useEffect(() => {
    const action = searchParams.get('action');
    if (action === 'new' && !isDialog && !isCustomersLoading) {
      handleNewCustomer();
      router.replace('/customers', { scroll: false });
    }
  }, [searchParams, router, isCustomersLoading, isDialog, handleNewCustomer]);

  return (
    <>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
        <PageHeader title="Central de Clientes" />
        <div className="flex items-center gap-3 flex-wrap">
             <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="h-10 px-6 rounded-full font-bold border-border/50 hover:bg-muted/50 transition-all text-xs">
                        <FileDown className="mr-2 h-4 w-4" /> Exportar
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuItem onSelect={handleExportToExcel}>Excel (.xlsx)</DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
            
            {selectedCount > 0 && filter !== 'birthdays' && (
                <div className="flex items-center gap-2 animate-in slide-in-from-right-2 duration-300">
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button 
                                variant="destructive" 
                                className="h-10 px-6 rounded-full font-bold shadow-lg"
                                disabled={isSaving}
                            >
                                <Trash2 className="mr-2 h-4 w-4" /> Mover para Lixeira ({selectedCount})
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Mover {selectedCount} Clientes para a Lixeira?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    Os registros sumirão desta tela mas poderão ser restaurados na aba Lixeira se necessário.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Voltar</AlertDialogCancel>
                                <AlertDialogAction onClick={handleBulkMoveToTrash} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Mover para Lixeira</AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </div>
            )}

            <Button 
                variant="outline" 
                className="h-10 px-6 rounded-full font-bold bg-background text-foreground border-border/50 hover:bg-muted/50 transition-all text-xs"
                onClick={() => setIsAiModalOpen(true)}
            >
                <Sparkles className="h-4 w-4 mr-2" /> Novo Cliente com IA
            </Button>

            <Button 
                onClick={handleNewCustomer} 
                className="h-10 px-8 rounded-full font-bold bg-[#00AEEF] hover:bg-[#0096D1] text-white shadow-lg shadow-[#00AEEF]/20 transition-all border-none text-xs"
            >
                <PlusCircle className="mr-2 h-4 w-4" /> Novo Cliente
            </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4 mb-6 bg-muted/10 p-3 rounded-2xl border border-border/50 shadow-sm">
        <Tabs value={filter} onValueChange={setFilter} className="shrink-0">
            <TabsList className="bg-background/50 p-1 flex w-fit gap-2 border shadow-inner rounded-full h-11">
            <TabsTrigger 
                value="active" 
                className={cn(
                    "gap-2 rounded-full font-bold px-6 h-9 transition-all text-xs",
                    "data-[state=active]:bg-green-500 data-[state=active]:text-white shadow-none"
                )}
            >
                <UserCheck className="h-3.5 w-3.5" />
                Ativos
            </TabsTrigger>
            <TabsTrigger 
                value="inactive" 
                className={cn(
                    "gap-2 rounded-full font-bold px-6 h-9 transition-all text-xs",
                    "data-[state=active]:bg-zinc-600 data-[state=active]:text-white shadow-none"
                )}
            >
                <UserX className="h-3.5 w-3.5" />
                Inativos
            </TabsTrigger>
            <TabsTrigger 
                value="birthdays" 
                className={cn(
                    "gap-2 rounded-full font-bold px-6 h-9 transition-all text-xs",
                    "data-[state=active]:bg-pink-500 data-[state=active]:text-white shadow-none"
                )}
            >
                <Cake className="h-3.5 w-3.5" />
                Aniversariantes
            </TabsTrigger>
            </TabsList>
        </Tabs>

        {filter !== 'birthdays' && (
            <div className="flex items-center gap-3 flex-1 justify-end flex-wrap">
                {hasActiveFilters && (
                    <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={handleClearFilters}
                        className="h-9 px-4 text-red-600 hover:text-red-700 hover:bg-red-50 font-black text-[10px] uppercase gap-1.5 rounded-full animate-in fade-in zoom-in-95"
                    >
                        <X className="h-3.5 w-3.5" /> Limpar Filtros
                    </Button>
                )}

                <div className="flex items-center gap-2">
                    <Select value={tagFilter} onValueChange={setTagFilter}>
                        <SelectTrigger className="h-10 min-w-[160px] bg-background rounded-full text-[10px] font-black uppercase px-5 border-primary/20 text-primary shadow-sm hover:bg-primary/5 transition-colors">
                            <div className="flex items-center gap-2">
                                <Tag className="h-3.5 w-3.5 opacity-50" />
                                <SelectValue placeholder="FILTRAR POR TAG" />
                            </div>
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border-2">
                            <SelectItem value="all" className="font-black text-[10px] uppercase">Todas as Tags</SelectItem>
                            {availableTags.map(tag => (
                                <SelectItem key={tag} value={tag} className="font-bold text-[11px] uppercase">{tag}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="flex items-center gap-2">
                    <Select value={rmcFilter} onValueChange={setRmcFilter}>
                        <SelectTrigger className="h-10 min-w-[180px] bg-background rounded-full text-[10px] font-black uppercase px-5 border-orange-200 text-orange-600 shadow-sm hover:bg-orange-50 transition-colors">
                            <div className="flex items-center gap-2">
                                <Landmark className="h-3.5 w-3.5 opacity-50" />
                                <SelectValue placeholder="BANCO RMC" />
                            </div>
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border-2">
                            <SelectItem value="all" className="font-black text-[10px] uppercase">Todos os Bancos RMC</SelectItem>
                            {banks.map(b => (
                                <SelectItem key={b} value={b} className="font-bold text-[11px] uppercase">
                                    <div className="flex items-center gap-3">
                                        <BankIcon bankName={b} domain={userSettings?.bankDomains?.[b]} showLogo={showLogos} className="h-4 w-4" />
                                        <span>{cleanBankName(b)}</span>
                                    </div>
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="flex items-center gap-2">
                    <Select value={rccFilter} onValueChange={setRccFilter}>
                        <SelectTrigger className="h-10 min-w-[180px] bg-background rounded-full text-[10px] font-black uppercase px-5 border-blue-200 text-blue-600 shadow-sm hover:bg-blue-50 transition-colors">
                            <div className="flex items-center gap-2">
                                <Landmark className="h-3.5 w-3.5 opacity-50" />
                                <SelectValue placeholder="BANCO RCC" />
                            </div>
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border-2">
                            <SelectItem value="all" className="font-black text-[10px] uppercase">Todos os Bancos RCC</SelectItem>
                            {banks.map(b => (
                                <SelectItem key={b} value={b} className="font-bold text-[11px] uppercase">
                                    <div className="flex items-center gap-3">
                                        <BankIcon bankName={b} domain={userSettings?.bankDomains?.[b]} showLogo={showLogos} className="h-4 w-4" />
                                        <span>{cleanBankName(b)}</span>
                                    </div>
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>
        )}
      </div>

      <Dialog open={isDialog} onOpenChange={setIsDialog}>
        <DialogContent 
            className="max-w-4xl w-[95vw] h-[90vh] flex flex-col p-0 overflow-hidden rounded-[2rem] border-none shadow-2xl"
            onPointerDownOutside={(e) => e.preventDefault()}
            onInteractOutside={(e) => e.preventDefault()}
        >
          <DialogHeader className="px-8 pt-8 pb-4 shrink-0 bg-muted/5 border-b">
            <DialogTitle className="text-xl font-black uppercase tracking-tight text-primary">
                {sheetMode === 'edit' ? 'Editar Cadastro' : 'Novo Registro de Cliente'}
            </DialogTitle>
            <DialogDescription className="sr-only">Formulário de cadastro e edição de clientes</DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-hidden">
            <CustomerForm
                key={formKey}
                onSubmit={handleFormSubmit}
                customer={selectedCustomer}
                allCustomers={processedCustomers || []}
                userSettings={userSettings}
                defaultValues={defaultValues}
                isSaving={isSaving}
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* 🤖 MODAL DE IA CONSOLIDADO */}
      <Dialog open={isAiModalOpen} onOpenChange={setIsAiModalOpen}>
        <DialogContent className="max-w-xl">
            <DialogHeader>
                <DialogTitle>Cadastro Inteligente com IA</DialogTitle>
                <DialogDescription>Extraia dados de fotos de documentos ou extratos bancários para preencher o formulário.</DialogDescription>
            </DialogHeader>
            <CustomerAiForm onSubmit={handleAiFormSubmit} />
        </DialogContent>
      </Dialog>

      {filter === 'birthdays' ? (
          isCustomersLoading ? (
              <div className="space-y-6">
                  <Skeleton className="h-24 w-full rounded-2xl" />
                  <Skeleton className="h-[600px] w-full rounded-[2rem]" />
              </div>
          ) : (
              <div className="animate-in fade-in duration-500">
                  <BirthdayCalendar customers={processedCustomers || []} />
              </div>
          )
      ) : (
          <div className="space-y-6">
            <CustomerDataTable 
                columns={columns} 
                data={filteredCustomers} 
                isLoading={isCustomersLoading}
                rowSelection={rowSelection}
                setRowSelection={setRowSelection}
            />
            {/* ⚡ PERFORMANCE: Botão para carregar mais registros (Manual) */}
            {hasMoreCustomers && processedCustomers.length >= LOAD_CHUNK_SIZE && !isCustomersLoading && (
                <div className="flex justify-center pb-10 animate-in fade-in slide-in-from-bottom-2">
                    <Button 
                        variant="outline" 
                        onClick={loadMoreCustomers}
                        disabled={isLoadingMore}
                        className="rounded-full h-12 px-10 font-black uppercase text-[10px] tracking-[0.2em] border-2 border-primary/20 bg-background hover:bg-primary hover:text-white transition-all shadow-xl"
                    >
                        {isLoadingMore ? "Carregando..." : "Carregar Próximos Registros"} <ChevronRight className="ml-2 h-4 w-4" />
                    </Button>
                </div>
            )}
          </div>
      )}
    </>
  );
}

export default function CustomersPage() {
  return (
    <AppLayout>
      <Suspense fallback={<Skeleton className="h-64 w-full" />}><CustomersPageContent /></Suspense>
    </AppLayout>
  );
}
