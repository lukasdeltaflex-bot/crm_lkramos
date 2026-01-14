
'use client';
import React from 'react';
import { AppLayout } from '@/components/app-layout';
import { PageHeader } from '@/components/page-header';
import { CustomerDataTable } from './data-table';
import { getColumns } from './columns';
import { Button } from '@/components/ui/button';
import { PlusCircle, Trash2 } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { CustomerForm } from './customer-form';
import type { Customer } from '@/lib/types';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, doc, writeBatch, query, where, getDocs } from 'firebase/firestore';
import { toast } from '@/hooks/use-toast';
import {
  addDocumentNonBlocking,
  setDocumentNonBlocking,
  updateDocumentNonBlocking,
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

export default function CustomersPage() {
  const { user } = useUser();
  const firestore = useFirestore();

  const [isSheetOpen, setIsSheetOpen] = React.useState(false);
  const [selectedCustomer, setSelectedCustomer] = React.useState<Customer | undefined>(undefined);
  const [sheetMode, setSheetMode] = React.useState<'new' | 'edit'>('new');
  const [rowSelection, setRowSelection] = React.useState({});

  // Query to get only non-anonymized customers for the current user
  const customersQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, 'customers'), where('userId', '==', user.uid), where('name', '!=', 'Cliente Removido'));
  }, [firestore, user]);

  const { data: customers, isLoading } = useCollection<Customer>(customersQuery);

  const handleNewCustomer = () => {
    setSelectedCustomer(undefined);
    setSheetMode('new');
    setIsSheetOpen(true);
  };

  const handleEditCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    setSheetMode('edit');
    setIsSheetOpen(true);
  };

  const handleAnonymizeCustomer = (customerId: string) => {
    if (!firestore) return;
    const customerRef = doc(firestore, 'customers', customerId);
    const anonymizedData = {
      name: 'Cliente Removido',
      cpf: '000.000.000-00',
      benefitNumber: '0000000000',
      phone: '(00) 00000-0000',
      email: 'removido@removido.com',
      observations: `Dados do cliente anonimizados em ${new Date().toISOString()}`
    };
    updateDocumentNonBlocking(customerRef, anonymizedData);
    toast({
      title: 'Cliente Removido',
      description: 'Os dados do cliente foram anonimizados com sucesso. O histórico de propostas foi mantido.',
    });
  };

  const handleAnonymizeSelected = async () => {
    if (!firestore) return;
    const selectedIds = Object.keys(rowSelection);
    if (selectedIds.length === 0) return;

    const batch = writeBatch(firestore);
    const anonymizedData = {
        name: 'Cliente Removido',
        cpf: '000.000.000-00',
        benefitNumber: '0000000000',
        phone: '(00) 00000-0000',
        email: 'removido@removido.com',
        observations: `Dados do cliente anonimizados em ${new Date().toISOString()}`
      };

    selectedIds.forEach((id) => {
      const docRef = doc(firestore, 'customers', id);
      batch.update(docRef, anonymizedData);
    });

    try {
      await batch.commit();
      toast({
        title: 'Clientes Removidos',
        description: `${selectedIds.length} cliente(s) foram anonimizados com sucesso.`,
      });
      setRowSelection({});
    } catch (error) {
      console.error('Error anonymizing customers:', error);
      toast({
        variant: 'destructive',
        title: 'Erro ao remover',
        description: 'Ocorreu um erro ao remover os clientes selecionados.',
      });
    }
  };

  const handleFormSubmit = (data: Omit<Customer, 'id' | 'userId'>) => {
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
            <Button onClick={handleNewCustomer}>
                <PlusCircle />
                Novo Cliente
            </Button>
        </div>
      </div>
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent className="w-full max-w-lg sm:w-3/4">
          <SheetHeader>
            <SheetTitle>{getSheetTitle()}</SheetTitle>
          </SheetHeader>
          <CustomerForm
            onSubmit={handleFormSubmit}
            customer={selectedCustomer}
          />
        </SheetContent>
      </Sheet>
      <CustomerDataTable 
        columns={columns} 
        data={customers || []} 
        isLoading={isLoading}
        rowSelection={rowSelection}
        setRowSelection={setRowSelection}
       />
    </AppLayout>
  );
}
