
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
import { collection, doc, writeBatch } from 'firebase/firestore';
import { toast } from '@/hooks/use-toast';
import {
  addDocumentNonBlocking,
  setDocumentNonBlocking,
  deleteDocumentNonBlocking,
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

  const customersCollectionRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'customers');
  }, [firestore]);

  const { data: customers, isLoading } = useCollection<Customer>(customersCollectionRef);

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

  const handleDeleteCustomer = (customerId: string) => {
    if (!firestore) return;
    deleteDocumentNonBlocking(doc(firestore, 'customers', customerId));
    toast({
      title: 'Cliente deletado',
      description: 'O cliente foi removido com sucesso.',
    });
  };

  const handleDeleteSelected = async () => {
    if (!firestore) return;
    const selectedIds = Object.keys(rowSelection);
    if (selectedIds.length === 0) return;

    const batch = writeBatch(firestore);
    selectedIds.forEach((id) => {
      batch.delete(doc(firestore, 'customers', id));
    });

    try {
      await batch.commit();
      toast({
        title: 'Clientes deletados',
        description: `${selectedIds.length} cliente(s) foram removidos com sucesso.`,
      });
      setRowSelection({});
    } catch (error) {
      console.error('Error deleting customers:', error);
      toast({
        variant: 'destructive',
        title: 'Erro ao deletar',
        description: 'Ocorreu um erro ao deletar os clientes selecionados.',
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
      const newCustomer: Omit<Customer, 'id'> = {
        ...data,
        userId: user.uid,
      };
      addDocumentNonBlocking(collection(firestore, 'customers'), newCustomer);
      toast({
        title: 'Cliente Salvo!',
        description: `O cliente ${data.name} foi salvo com sucesso.`,
      });
    }
    setIsSheetOpen(false);
  };

  const columns = React.useMemo(() => getColumns({ onEdit: handleEditCustomer, onDelete: handleDeleteCustomer }), []);

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
                            Deletar ({selectedCount})
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                            <AlertDialogDescription>
                                Essa ação não pode ser desfeita. Isso irá remover permanentemente {selectedCount} cliente(s).
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={handleDeleteSelected}>Deletar</AlertDialogAction>
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
