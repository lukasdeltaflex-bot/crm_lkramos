
'use client';
import React from 'react';
import { AppLayout } from '@/components/app-layout';
import { PageHeader } from '@/components/page-header';
import { CustomerDataTable } from './data-table';
import { getColumns } from './columns';
import { Button } from '@/components/ui/button';
import { PlusCircle, Sparkles, Trash2 } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { CustomerForm } from './customer-form';
import type { Customer } from '@/lib/types';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, doc, writeBatch, query, where, updateDoc } from 'firebase/firestore';
import { toast } from '@/hooks/use-toast';
import {
  updateDocumentNonBlocking,
  setDocumentNonBlocking
} from '@/firebase/non-blocking-updates';
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
} from '@/components/ui/alert-dialog';
import { customers as sampleCustomers, proposals as sampleProposals } from '@/lib/data';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { CustomerAiForm } from '@/components/customers/customer-ai-form';
import type { ExtractCustomerDataOutput } from '@/ai/flows/extract-customer-data-flow';
import { parse } from 'date-fns';

type CustomerFormData = Partial<Omit<Customer, 'id' | 'userId' | 'numericId'>>;

export default function CustomersPage() {
  const { user } = useUser();
  const firestore = useFirestore();

  const [isSheetOpen, setIsSheetOpen] = React.useState(false);
  const [isAiModalOpen, setIsAiModalOpen] = React.useState(false);
  const [selectedCustomer, setSelectedCustomer] = React.useState<Customer | undefined>(undefined);
  const [defaultValues, setDefaultValues] = React.useState<CustomerFormData | undefined>(undefined);
  const [sheetMode, setSheetMode] = React.useState<'new' | 'edit'>('new');
  const [rowSelection, setRowSelection] = React.useState({});

  const customersQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, 'customers'), where('userId', '==', user.uid));
  }, [firestore, user]);

  const { data: customers, isLoading, error } = useCollection<Customer>(customersQuery);

  React.useEffect(() => {
    const seedData = async () => {
      if (firestore && user && customers?.length === 0) {
        console.log("Seeding initial data...");
        const batch = writeBatch(firestore);
        
        const customerRefs = new Map<string, string>();
        
        sampleCustomers.forEach((customerData, index) => {
            const docRef = doc(collection(firestore, 'customers'));
            const newCustomer: Customer = {
              ...customerData,
              id: docRef.id,
              numericId: Date.now() + index,
              userId: user.uid,
            };
            batch.set(docRef, newCustomer);
            customerRefs.set(`customer_${index}`, docRef.id);
        });

        sampleProposals.forEach((proposalData, index) => {
            const docRef = doc(collection(firestore, 'loanProposals'));
            const customerId = customerRefs.get(`customer_${index % sampleCustomers.length}`);
            if (customerId) {
              const newProposal = {
                  ...proposalData,
                  id: docRef.id,
                  userId: user.uid,
                  proposalNumber: `PRO${Date.now() + index}`,
                  customerId: customerId,
              };
              batch.set(docRef, newProposal);
            }
        });

        try {
          await batch.commit();
          toast({
            title: "Dados de exemplo criados!",
            description: "Clientes e propostas de exemplo foram adicionados.",
          });
        } catch (error) {
          console.error("Error seeding data: ", error);
        }
      }
    };
    if (!isLoading && customers) {
        seedData();
    }
  }, [firestore, user, customers, isLoading]);


  const handleNewCustomer = () => {
    setSelectedCustomer(undefined);
    setDefaultValues(undefined);
    setSheetMode('new');
    setIsSheetOpen(true);
  };

  const handleEditCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    setDefaultValues(undefined);
    setSheetMode('edit');
    setIsSheetOpen(true);
  };

  const handleAiFormSubmit = (aiData: ExtractCustomerDataOutput) => {
    const prefilledData: CustomerFormData = {
        ...aiData,
        birthDate: aiData.birthDate, // Keep as YYYY-MM-DD string
    };
    setSelectedCustomer(undefined);
    setDefaultValues(prefilledData);
    setSheetMode('new');
    setIsAiModalOpen(false);
    setIsSheetOpen(true);
  }

  const handleAnonymizeCustomer = (customerId: string) => {
    if (!firestore) return;
    const customerRef = doc(firestore, 'customers', customerId);
    const anonymizedData: Partial<Customer> = {
      name: 'Cliente Removido',
      numericId: 0,
      cpf: '000.000.000-00',
      benefitNumber: '0000000000',
      phone: '(00) 00000-0000',
      phone2: '',
      email: 'removido@removido.com',
      observations: `Dados do cliente anonimizados em ${new Date().toISOString()}`,
      cep: '',
      street: '',
      number: '',
      complement: '',
      neighborhood: '',
      city: '',
      state: '',
    };
    // Use non-blocking update here
    updateDocumentNonBlocking(customerRef, anonymizedData);
    toast({
      title: 'Cliente Removido',
      description: 'Os dados do cliente foram anonimizados com sucesso. O histórico de propostas foi mantido.',
    });
    // Optimistically update UI if needed or let real-time listener handle it
    setRowSelection({});
  };

  const handleAnonymizeSelected = () => {
    if (!firestore) return;
    const selectedIds = Object.keys(rowSelection);
    if (selectedIds.length === 0) return;

    // Clear selection immediately for instant UI feedback
    setRowSelection({});

    const batch = writeBatch(firestore);
    const anonymizedData: Partial<Customer> = {
        name: 'Cliente Removido',
        numericId: 0,
        cpf: '000.000.000-00',
        benefitNumber: '0000000000',
        phone: '(00) 00000-0000',
        phone2: '',
        email: 'removido@removido.com',
        observations: `Dados do cliente anonimizados em ${new Date().toISOString()}`,
        cep: '',
        street: '',
        number: '',
        complement: '',
        neighborhood: '',
        city: '',
        state: '',
      };

    selectedIds.forEach((id) => {
      const docRef = doc(firestore, 'customers', id);
      batch.update(docRef, anonymizedData);
    });

    batch.commit().then(() => {
      toast({
        title: 'Clientes Removidos',
        description: `${selectedIds.length} cliente(s) foram anonimizados com sucesso.`,
      });
    }).catch((error) => {
      console.error('Error anonymizing customers:', error);
      toast({
        variant: 'destructive',
        title: 'Erro ao remover',
        description: 'Ocorreu um erro ao remover os clientes selecionados.',
      });
    });
  };

  const handleFormSubmit = (data: Omit<Customer, 'id' | 'userId' | 'numericId'>) => {
    if (!firestore || !user) return;

    if (sheetMode === 'edit' && selectedCustomer) {
      const customerToUpdate: Customer = {
        ...selectedCustomer,
        ...data,
      };
      setDocumentNonBlocking(doc(firestore, 'customers', selectedCustomer.id), customerToUpdate, { merge: true });
      toast({
        title: 'Cliente Atualizado!',
        description: `O cliente ${data.name} foi atualizado com sucesso.`,
      });
    } else {
      const newDocRef = doc(collection(firestore, 'customers'));
      const newCustomerWithId: Customer = {
        ...data,
        id: newDocRef.id,
        numericId: Date.now(),
        userId: user.uid,
      };
      setDocumentNonBlocking(newDocRef, newCustomerWithId, {});
      
      toast({
        title: 'Cliente Salvo!',
        description: `O cliente ${data.name} foi salvo com sucesso.`,
      });
    }
    setIsSheetOpen(false);
  };

  const columns = React.useMemo(() => getColumns({ onEdit: handleEditCustomer, onDelete: handleAnonymizeCustomer }), []);

  const getSheetTitle = () => {
    if (sheetMode === 'edit') return 'Editar Cliente';
    return 'Novo Cliente';
  };
  
  const selectedCount = Object.keys(rowSelection).length;
  const nonAnonymizedCustomers = customers?.filter(c => c.name !== 'Cliente Removido') || [];

  return (
    <AppLayout>
      <div className="flex items-center justify-between">
        <PageHeader title="Clientes" />
        <div className="flex items-center gap-2">
            {selectedCount > 0 && (
                 <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button variant="destructive">
                            <Trash2 />
                            Remover ({selectedCount})
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                            <AlertDialogDescription>
                                Essa ação não pode ser desfeita. Isso irá anonimizar permanentemente {selectedCount} cliente(s). O histórico de propostas será mantido.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={handleAnonymizeSelected}>Remover</AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                 </AlertDialog>
            )}
            <Dialog open={isAiModalOpen} onOpenChange={setIsAiModalOpen}>
                <DialogTrigger asChild>
                    <Button variant="outline">
                        <Sparkles />
                        Novo Cliente com IA
                    </Button>
                </DialogTrigger>
                <DialogContent className="max-w-xl">
                    <DialogHeader>
                        <DialogTitle>Assistente de Cadastro de Cliente</DialogTitle>
                    </DialogHeader>
                    <CustomerAiForm onSubmit={handleAiFormSubmit} />
                </DialogContent>
            </Dialog>
            <Button onClick={handleNewCustomer}>
                <PlusCircle />
                Novo Cliente
            </Button>
        </div>
      </div>
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent className="w-full max-w-3xl sm:max-w-3xl">
          <SheetHeader>
            <SheetTitle>{getSheetTitle()}</SheetTitle>
          </SheetHeader>
          <CustomerForm
            onSubmit={handleFormSubmit}
            customer={selectedCustomer}
            defaultValues={defaultValues}
          />
        </SheetContent>
      </Sheet>
      <CustomerDataTable 
        columns={columns} 
        data={nonAnonymizedCustomers} 
        isLoading={isLoading}
        rowSelection={rowSelection}
        setRowSelection={setRowSelection}
       />
    </AppLayout>
  );
}
