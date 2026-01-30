
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
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { CustomerSearchDialog } from '@/components/proposals/customer-search-dialog';

export default function AgendaPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [isCustomerSearchOpen, setIsCustomerSearchOpen] = React.useState(false);
  const [newlySelectedCustomer, setNewlySelectedCustomer] = React.useState<Customer | null>(null);
  const [selectedReminder, setSelectedReminder] = React.useState<Reminder | undefined>(undefined);
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  const remindersQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(
      collection(firestore, 'reminders'),
      where('userId', '==', user.uid)
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

  const handleToggleStatus = (reminder: Reminder) => {
    if (!firestore || !user) return;
    const newStatus = reminder.status === 'pending' ? 'completed' : 'pending';
    
    setDoc(doc(firestore, 'reminders', reminder.id), { 
      status: newStatus,
      userId: user.uid 
    }, { merge: true })
      .catch(async () => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: `reminders/${reminder.id}`,
          operation: 'update',
          requestResourceData: { status: newStatus, userId: user.uid }
        }));
      });
  };

  const handleDeleteReminder = (id: string) => {
    if (!firestore) return;
    deleteDoc(doc(firestore, 'reminders', id))
      .catch(async () => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: `reminders/${id}`,
          operation: 'delete'
        }));
      });
  };

  const handleCustomerSelect = (customer: Customer) => {
    setNewlySelectedCustomer(customer);
    setIsCustomerSearchOpen(false);
  };

  const handleFormSubmit = (data: any) => {
    if (!firestore || !user) return;
    
    const reminderId = selectedReminder?.id || doc(collection(firestore, 'reminders')).id;
    
    const reminderData: Reminder = {
      ...data,
      id: reminderId,
      userId: user.uid,
      createdAt: selectedReminder?.createdAt || new Date().toISOString(),
    };

    // Gravação otimizada: fecha o modal imediatamente
    setIsDialogOpen(false);

    setDoc(doc(firestore, 'reminders', reminderId), reminderData, { merge: true })
      .then(() => {
        toast({ title: 'Agenda Atualizada', description: 'O lembrete foi salvo com sucesso.' });
      })
      .catch(async (err) => {
        console.warn("Permissão negada ao salvar lembrete:", err);
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: `reminders/${reminderId}`,
          operation: 'write',
          requestResourceData: reminderData
        }));
      });
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
