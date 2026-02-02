'use client';

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle, Calendar as CalendarIcon, CheckCircle2, Circle, Trash2, User, Loader2 } from 'lucide-react';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, doc, setDoc, deleteDoc } from 'firebase/firestore';
import type { Reminder, Customer } from '@/lib/types';
import { format, isBefore, isToday, parseISO, startOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ReminderForm } from '@/app/agenda/reminder-form';
import { CustomerSearchDialog } from '@/components/proposals/customer-search-dialog';

export function AgendaSection() {
  const { user } = useUser();
  const firestore = useFirestore();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isCustomerSearchOpen, setIsCustomerSearchOpen] = useState(false);
  const [newlySelectedCustomer, setNewlySelectedCustomer] = useState<Customer | null>(null);
  const [selectedReminder, setSelectedReminder] = useState<Reminder | undefined>(undefined);
  const [isSaving, setIsSaving] = useState(false);

  const remindersQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return collection(firestore, 'users', user.uid, 'reminders');
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

  const reminders = useMemo(() => {
    if (!rawReminders) return [];
    return [...rawReminders]
      .filter(r => r.status === 'pending')
      .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
      .slice(0, 5);
  }, [rawReminders]);

  const customerMap = useMemo(() => new Map(customers?.map(c => [c.id, c])), [customers]);

  const handleAddReminder = () => {
    setSelectedReminder(undefined);
    setNewlySelectedCustomer(null);
    setIsDialogOpen(true);
  };

  const handleToggleStatus = async (reminder: Reminder) => {
    if (!firestore || !user) return;
    try {
      await setDoc(doc(firestore, 'users', user.uid, 'reminders', reminder.id), { 
        status: 'completed'
      }, { merge: true });
      toast({ title: 'Lembrete Concluído' });
    } catch (e) {
      toast({ variant: 'destructive', title: 'Erro ao atualizar' });
    }
  };

  const handleFormSubmit = async (data: any) => {
    if (!firestore || !user) return;
    setIsSaving(true);
    try {
      const reminderId = selectedReminder?.id || doc(collection(firestore, 'users', user.uid, 'reminders')).id;
      const reminderData = {
        ...data,
        id: reminderId,
        ownerId: user.uid,
        createdAt: selectedReminder?.createdAt || new Date().toISOString(),
      };
      await setDoc(doc(firestore, 'users', user.uid, 'reminders', reminderId), reminderData);
      toast({ title: 'Salvo com sucesso' });
      setIsDialogOpen(false);
    } catch (err) {
      console.error(err);
      toast({ variant: 'destructive', title: 'Acesso Negado', description: 'Você precisa estar logado para salvar lembretes.' });
    } finally {
      setIsSaving(false);
    }
  };

  const getStatusBadge = (dueDate: string) => {
    const date = parseISO(dueDate);
    const now = new Date();
    if (isToday(date)) return <Badge variant="default" className="bg-yellow-500 text-black border-none">Hoje</Badge>;
    if (isBefore(date, startOfDay(now))) return <Badge variant="destructive" className="border-none">Atrasado</Badge>;
    return <Badge variant="secondary" className="border-none">Futuro</Badge>;
  };

  return (
    <Card className="h-full border-border/50">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="space-y-1">
          <CardTitle className="text-xl font-headline flex items-center gap-2">
            <CalendarIcon className="h-5 w-5 text-primary" />
            Agenda LK
          </CardTitle>
          <CardDescription>Seus próximos retornos e tarefas</CardDescription>
        </div>
        <Button size="sm" onClick={handleAddReminder}>
          <PlusCircle className="h-4 w-4 mr-1" />
          Novo
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)
          ) : reminders.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground border-2 border-dashed rounded-lg">
              <CalendarIcon className="h-8 w-8 mx-auto mb-2 opacity-20" />
              <p className="text-sm">Nada agendado para agora.</p>
            </div>
          ) : (
            reminders.map((reminder) => {
              const customer = reminder.customerId ? customerMap.get(reminder.customerId) : null;
              return (
                <div key={reminder.id} className="group flex items-center gap-3 p-3 rounded-lg border border-border/50 bg-card hover:shadow-sm transition-all">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 shrink-0"
                    onClick={() => handleToggleStatus(reminder)}
                  >
                    <Circle className="h-5 w-5 text-muted-foreground group-hover:text-primary" />
                  </Button>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="text-sm font-semibold truncate">{reminder.title}</p>
                      {getStatusBadge(reminder.dueDate)}
                    </div>
                    <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <CalendarIcon className="h-3 w-3" />
                        {format(parseISO(reminder.dueDate), "dd 'de' MMM", { locale: ptBR })}
                      </span>
                      {customer && (
                        <Link href={`/customers/${customer.id}`} className="flex items-center gap-1 text-primary hover:underline truncate">
                          <User className="h-3 w-3" />
                          {customer.name}
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </CardContent>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Novo Lembrete na Agenda</DialogTitle>
          </DialogHeader>
          <ReminderForm 
            customers={customers?.filter(c => c.name !== 'Cliente Removido') || []} 
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
        customers={customers?.filter(c => c.name !== 'Cliente Removido') || []}
        onSelectCustomer={(c) => {
          setNewlySelectedCustomer(c);
          setIsCustomerSearchOpen(false);
        }}
      />
    </Card>
  );
}