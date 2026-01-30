
'use client';

import React, { useEffect, useState } from 'react';
import { AppLayout } from '@/components/app-layout';
import { PageHeader } from '@/components/page-header';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, doc, setDoc, deleteDoc } from 'firebase/firestore';
import type { Reminder, Customer } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { PlusCircle, Calendar as CalendarIcon, CheckCircle2, Circle, Trash2, User } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ReminderForm } from './reminder-form';
import { format, isBefore, isToday, parseISO, startOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';
import { CustomerSearchDialog } from '@/components/proposals/customer-search-dialog';

export default function AgendaPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [isCustomerSearchOpen, setIsCustomerSearchOpen] = React.useState(false);
  const [newlySelectedCustomer, setNewlySelectedCustomer] = React.useState<Customer | null>(null);
  const [selectedReminder, setSelectedReminder] = React.useState<Reminder | undefined>(undefined);
  const [isSaving, setIsSaving] = React.useState(false);
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  const remindersQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(
      collection(firestore, 'reminders'),
      where('ownerId', '==', user.uid)
    );
  }, [firestore, user]);

  const customersQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(
      collection(firestore, 'customers'), 
      where('ownerId', '==', user.uid)
    );
  }, [firestore, user]);

  const { data: rawReminders, isLoading } = useCollection<Reminder>(remindersQuery);
  const { data: customers } = useCollection<Customer>(customersQuery);

  const reminders = React.useMemo(() => {
    if (!rawReminders) return null;
    return [...rawReminders].sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  }, [rawReminders]);

  const handleAddReminder = () => {
    setSelectedReminder(undefined);
    setNewlySelectedCustomer(null);
    setIsDialogOpen(true);
  };

  const handleEditReminder = (reminder: Reminder) => {
    setSelectedReminder(reminder);
    setNewlySelectedCustomer(null);
    setIsDialogOpen(true);
  };

  const handleToggleStatus = async (reminder: Reminder) => {
    if (!firestore || !user) return;
    const newStatus = reminder.status === 'pending' ? 'completed' : 'pending';
    
    try {
      await setDoc(doc(firestore, 'reminders', reminder.id), { 
        status: newStatus,
        ownerId: user.uid
      }, { merge: true });
    } catch (e) {
      console.error("Erro ao atualizar status:", e);
    }
  };

  const handleDeleteReminder = async (id: string) => {
    if (!firestore) return;
    try {
      await deleteDoc(doc(firestore, 'reminders', id));
      toast({ title: 'Removido', description: 'O lembrete foi excluído.' });
    } catch (e) {
      console.error("Erro ao excluir lembrete:", e);
    }
  };

  const handleCustomerSelect = (customer: Customer) => {
    setNewlySelectedCustomer(customer);
    setIsCustomerSearchOpen(false);
  };

  const handleFormSubmit = async (data: any) => {
    if (!firestore || !user) return;
    
    setIsSaving(true);
    try {
      const reminderId = selectedReminder?.id || doc(collection(firestore, 'reminders')).id;
      
      const cleanFields = Object.fromEntries(
        Object.entries(data).filter(([_, v]) => v !== undefined && v !== "")
      );

      const reminderData = {
        ...cleanFields,
        id: reminderId,
        ownerId: user.uid,
        createdAt: selectedReminder?.createdAt || new Date().toISOString(),
      };

      // Gravação explícita para garantir permissão
      await setDoc(doc(firestore, 'reminders', reminderId), reminderData, { merge: true });
      
      toast({ 
        title: 'Agenda LK', 
        description: 'Lembrete salvo com sucesso.' 
      });
      
      setIsDialogOpen(false);
    } catch (err) {
      console.error("Erro ao salvar lembrete:", err);
      toast({ 
        variant: 'destructive', 
        title: 'Erro de Permissão', 
        description: 'Não foi possível salvar. Tente novamente em alguns segundos.' 
      });
    } finally {
      setIsSaving(false);
    }
  };

  const getStatusBadge = (dueDate: string, status: string) => {
    if (!hasMounted) return null; 
    
    if (status === 'completed') return <Badge variant="outline" className="border-green-500 text-green-500">Concluído</Badge>;
    
    const date = parseISO(dueDate);
    const now = new Date();
    
    if (isToday(date)) return <Badge variant="default" className="bg-yellow-500 text-black hover:bg-yellow-600">Para Hoje</Badge>;
    if (isBefore(date, startOfDay(now))) return <Badge variant="destructive">Atrasado</Badge>;
    
    return <Badge variant="secondary">Futuro</Badge>;
  };

  const customerMap = React.useMemo(() => new Map(customers?.map(c => [c.id, c])), [customers]);

  const nonAnonymizedCustomers = React.useMemo(() => {
    if (!customers) return [];
    return customers.filter(c => c.name !== 'Cliente Removido');
  }, [customers]);

  return (
    <AppLayout>
      <div className="flex items-center justify-between mb-8">
        <PageHeader title="Agenda LK (CRM)" />
        <Button onClick={handleAddReminder}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Novo Lembrete
        </Button>
      </div>

      <div className="grid gap-4">
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        ) : !reminders || reminders.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center h-40 text-muted-foreground">
              <CalendarIcon className="h-8 w-8 mb-2 opacity-20" />
              <p>Sua agenda está limpa. Adicione lembretes para não perder retornos!</p>
            </CardContent>
          </Card>
        ) : (
          reminders.map((reminder) => {
            const customer = reminder.customerId ? customerMap.get(reminder.customerId) : null;
            return (
              <Card 
                key={reminder.id} 
                className={cn(
                  "transition-all hover:shadow-md",
                  reminder.status === 'completed' && "opacity-60 grayscale"
                )}
              >
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-4 flex-1">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="shrink-0"
                      onClick={() => handleToggleStatus(reminder)}
                    >
                      {reminder.status === 'completed' ? (
                        <CheckCircle2 className="h-6 w-6 text-green-500" />
                      ) : (
                        <Circle className="h-6 w-6 text-muted-foreground" />
                      )}
                    </Button>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className={cn("font-semibold", reminder.status === 'completed' && "line-through")}>
                          {reminder.title}
                        </h3>
                        {getStatusBadge(reminder.dueDate, reminder.status)}
                      </div>
                      {reminder.description && (
                        <p className="text-sm text-muted-foreground">{reminder.description}</p>
                      )}
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <CalendarIcon className="h-3 w-3" />
                          {format(parseISO(reminder.dueDate), "dd 'de' MMMM", { locale: ptBR })}
                        </span>
                        {customer && (
                          <Link href={`/customers/${customer.id}`} className="flex items-center gap-1 text-primary hover:underline">
                            <User className="h-3 w-3" />
                            {customer.name}
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" onClick={() => handleEditReminder(reminder)}>Editar</Button>
                    <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDeleteReminder(reminder.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })
        )}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{selectedReminder ? 'Editar Lembrete' : 'Novo Lembrete'}</DialogTitle>
          </DialogHeader>
          <ReminderForm 
            reminder={selectedReminder} 
            customers={nonAnonymizedCustomers} 
            onSubmit={handleFormSubmit}
            onOpenCustomerSearch={() => setIsCustomerSearchOpen(true)}
            selectedCustomerFromSearch={newlySelectedCustomer}
            onCustomerSearchSelectionHandled={() => setNewlySelectedCustomer(null)}
            isSaving={isSaving}
          />
        </DialogContent>
      </Dialog>

      <CustomerSearchDialog
        open={isCustomerSearchOpen}
        onOpenChange={setIsCustomerSearchOpen}
        customers={nonAnonymizedCustomers}
        onSelectCustomer={handleCustomerSelect}
      />
    </AppLayout>
  );
}
