
'use client';

import React from 'react';
import { AppLayout } from '@/components/app-layout';
import { PageHeader } from '@/components/page-header';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, doc, setDoc, deleteDoc, orderBy } from 'firebase/firestore';
import type { Reminder, Customer } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { PlusCircle, Calendar as CalendarIcon, CheckCircle2, Circle, Trash2, User } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ReminderForm } from './reminder-form';
import { format, isBefore, isToday, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';
import Link from 'next/link';

export default function AgendaPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [selectedReminder, setSelectedReminder] = React.useState<Reminder | undefined>(undefined);

  const remindersQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(
      collection(firestore, 'reminders'),
      where('ownerId', '==', user.uid),
      orderBy('dueDate', 'asc')
    );
  }, [firestore, user]);

  const customersQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, 'customers'), where('ownerId', '==', user.uid));
  }, [firestore, user]);

  const { data: reminders, isLoading } = useCollection<Reminder>(remindersQuery);
  const { data: customers } = useCollection<Customer>(customersQuery);

  const handleAddReminder = () => {
    setSelectedReminder(undefined);
    setIsDialogOpen(true);
  };

  const handleEditReminder = (reminder: Reminder) => {
    setSelectedReminder(reminder);
    setIsDialogOpen(true);
  };

  const handleToggleStatus = async (reminder: Reminder) => {
    if (!firestore) return;
    const newStatus = reminder.status === 'pending' ? 'completed' : 'pending';
    try {
      await setDoc(doc(firestore, 'reminders', reminder.id), { status: newStatus }, { merge: true });
      toast({
        title: newStatus === 'completed' ? 'Lembrete concluído!' : 'Lembrete reativado.',
      });
    } catch (e) {
      toast({ variant: 'destructive', title: 'Erro ao atualizar status' });
    }
  };

  const handleDeleteReminder = async (id: string) => {
    if (!firestore) return;
    try {
      await deleteDoc(doc(firestore, 'reminders', id));
      toast({ title: 'Lembrete removido.' });
    } catch (e) {
      toast({ variant: 'destructive', title: 'Erro ao remover lembrete' });
    }
  };

  const handleFormSubmit = async (data: any) => {
    if (!firestore || !user) return;
    
    const reminderId = selectedReminder?.id || doc(collection(firestore, 'reminders')).id;
    const reminderData: Reminder = {
      ...data,
      id: reminderId,
      ownerId: user.uid,
      createdAt: selectedReminder?.createdAt || new Date().toISOString(),
    };

    try {
      await setDoc(doc(firestore, 'reminders', reminderId), reminderData);
      setIsDialogOpen(false);
      toast({ title: 'Lembrete salvo com sucesso!' });
    } catch (e) {
      toast({ variant: 'destructive', title: 'Erro ao salvar lembrete' });
    }
  };

  const getStatusBadge = (dueDate: string, status: string) => {
    if (status === 'completed') return <Badge variant="outline" className="border-green-500 text-green-500">Concluído</Badge>;
    
    const date = parseISO(dueDate);
    if (isBefore(date, new Date()) && !isToday(date)) return <Badge variant="destructive">Atrasado</Badge>;
    if (isToday(date)) return <Badge variant="default" className="bg-yellow-500 text-black hover:bg-yellow-600">Para Hoje</Badge>;
    return <Badge variant="secondary">Futuro</Badge>;
  };

  const customerMap = React.useMemo(() => new Map(customers?.map(c => [c.id, c])), [customers]);

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
          <p>Carregando lembretes...</p>
        ) : reminders?.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center h-40 text-muted-foreground">
              <CalendarIcon className="h-8 w-8 mb-2 opacity-20" />
              <p>Sua agenda está limpa. Adicione lembretes para não perder retornos!</p>
            </CardContent>
          </Card>
        ) : (
          reminders?.map((reminder) => {
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
            <DialogTitle>{selectedReminder ? 'Editar Lembrete' : 'Novo Lembrete de Retorno'}</DialogTitle>
          </DialogHeader>
          <ReminderForm 
            reminder={selectedReminder} 
            customers={customers || []} 
            onSubmit={handleFormSubmit} 
          />
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
