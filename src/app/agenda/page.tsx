
'use client';

import React, { useState, useMemo } from 'react';
import { AppLayout } from '@/components/app-layout';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle, Calendar as CalendarIcon, CheckCircle2, Circle, Trash2, User, Search } from 'lucide-react';
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
import { ReminderForm } from './reminder-form';
import { CustomerSearchDialog } from '@/components/proposals/customer-search-dialog';
import { Input } from '@/components/ui/input';

export default function AgendaPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isCustomerSearchOpen, setIsCustomerSearchOpen] = useState(false);
  const [newlySelectedCustomer, setNewlySelectedCustomer] = useState<Customer | null>(null);
  const [selectedReminder, setSelectedReminder] = useState<Reminder | undefined>(undefined);
  const [isSaving, setIsSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

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

  const customerMap = useMemo(() => new Map(customers?.map(c => [c.id, c])), [customers]);

  const filteredReminders = useMemo(() => {
    if (!rawReminders) return [];
    let list = [...rawReminders].sort((a, b) => a.dueDate.localeCompare(b.dueDate));
    
    if (searchTerm) {
        const lowerSearch = searchTerm.toLowerCase();
        list = list.filter(r => 
            r.title.toLowerCase().includes(lowerSearch) || 
            r.description?.toLowerCase().includes(lowerSearch)
        );
    }
    return list;
  }, [rawReminders, searchTerm]);

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

  const handleToggleStatus = async (e: React.MouseEvent, reminder: Reminder) => {
    e.stopPropagation();
    if (!firestore || !user) return;
    const newStatus = reminder.status === 'pending' ? 'completed' : 'pending';
    try {
      await setDoc(doc(firestore, 'reminders', reminder.id), { 
        status: newStatus 
      }, { merge: true });
      toast({ title: newStatus === 'completed' ? 'Lembrete Concluído!' : 'Lembrete Reaberto!' });
    } catch (e) {
      toast({ variant: 'destructive', title: 'Erro ao atualizar status' });
    }
  };

  const handleDeleteReminder = async (e: React.MouseEvent, reminderId: string) => {
    e.stopPropagation();
    if (!firestore) return;
    try {
      await deleteDoc(doc(firestore, 'reminders', reminderId));
      toast({ title: 'Lembrete removido com sucesso.' });
    } catch (e) {
      toast({ variant: 'destructive', title: 'Erro ao remover' });
    }
  };

  const handleFormSubmit = async (data: any) => {
    if (!firestore || !user) return;
    setIsSaving(true);
    
    try {
      const reminderId = selectedReminder?.id || doc(collection(firestore, 'reminders')).id;
      
      // Garante que campos vazios não quebrem o Firestore e o ownerId esteja presente
      const reminderData = {
        ...data,
        id: reminderId,
        ownerId: user.uid,
        createdAt: selectedReminder?.createdAt || new Date().toISOString(),
      };

      // Remove undefined de forma segura
      const cleanData = Object.fromEntries(
        Object.entries(reminderData).filter(([_, v]) => v !== undefined)
      );

      await setDoc(doc(firestore, 'reminders', reminderId), cleanData);
      
      toast({ title: 'Lembrete salvo com sucesso!' });
      setIsDialogOpen(false);
    } catch (err) {
      console.error("Erro ao salvar lembrete:", err);
      toast({ 
        variant: 'destructive', 
        title: 'Erro de Permissão ou Conexão', 
        description: 'Não foi possível salvar. Verifique se você está logado.' 
      });
    } finally {
      setIsSaving(false);
    }
  };

  const getStatusBadge = (dueDate: string, status: string) => {
    if (status === 'completed') return <Badge variant="secondary" className="bg-green-100 text-green-700 border-green-200">Concluído</Badge>;
    const date = parseISO(dueDate);
    const now = new Date();
    if (isToday(date)) return <Badge variant="default" className="bg-yellow-500 text-black">Hoje</Badge>;
    if (isBefore(date, startOfDay(now))) return <Badge variant="destructive">Atrasado</Badge>;
    return <Badge variant="outline">Pendente</Badge>;
  };

  return (
    <AppLayout>
      <div className="flex items-center justify-between mb-8">
        <PageHeader title="Agenda LK" />
        <Button onClick={handleAddReminder}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Novo Lembrete
        </Button>
      </div>

      <div className="grid gap-6">
        <Card>
            <CardHeader className="pb-3">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <CardTitle>Meus Retornos</CardTitle>
                        <CardDescription>Gerencie seus contatos e tarefas agendadas.</CardDescription>
                    </div>
                    <div className="relative w-full max-w-sm">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input 
                            placeholder="Pesquisar na agenda..." 
                            className="pl-9"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {isLoading ? (
                        Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-20 w-full" />)
                    ) : filteredReminders.length === 0 ? (
                        <div className="py-12 text-center border-2 border-dashed rounded-lg">
                            <CalendarIcon className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-20" />
                            <p className="text-muted-foreground">Nenhum lembrete encontrado.</p>
                        </div>
                    ) : (
                        filteredReminders.map((reminder) => {
                            const customer = reminder.customerId ? customerMap.get(reminder.customerId) : null;
                            const isCompleted = reminder.status === 'completed';

                            return (
                                <div 
                                    key={reminder.id} 
                                    className={cn(
                                        "group flex items-center gap-4 p-4 rounded-xl border bg-card hover:shadow-md transition-all cursor-pointer",
                                        isCompleted && "opacity-60 bg-muted/30"
                                    )}
                                    onClick={() => handleEditReminder(reminder)}
                                >
                                    <Button 
                                        variant="ghost" 
                                        size="icon" 
                                        className="h-10 w-10 shrink-0"
                                        onClick={(e) => handleToggleStatus(e, reminder)}
                                    >
                                        {isCompleted ? (
                                            <CheckCircle2 className="h-6 w-6 text-green-500" />
                                        ) : (
                                            <Circle className="h-6 w-6 text-muted-foreground group-hover:text-primary" />
                                        )}
                                    </Button>
                                    
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <h4 className={cn("font-bold text-lg truncate", isCompleted && "line-through")}>
                                                {reminder.title}
                                            </h4>
                                            {getStatusBadge(reminder.dueDate, reminder.status)}
                                        </div>
                                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                                            <span className="flex items-center gap-1.5">
                                                <CalendarIcon className="h-4 w-4" />
                                                {format(parseISO(reminder.dueDate), "dd 'de' MMMM", { locale: ptBR })}
                                            </span>
                                            {customer && (
                                                <Link 
                                                    href={`/customers/${customer.id}`} 
                                                    className="flex items-center gap-1.5 text-primary hover:underline font-medium"
                                                    onClick={(e) => e.stopPropagation()}
                                                >
                                                    <User className="h-4 w-4" />
                                                    {customer.name}
                                                </Link>
                                            )}
                                        </div>
                                        {reminder.description && (
                                            <p className="mt-2 text-sm text-muted-foreground line-clamp-1">{reminder.description}</p>
                                        )}
                                    </div>

                                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Button 
                                            variant="ghost" 
                                            size="icon" 
                                            className="text-destructive hover:bg-destructive/10"
                                            onClick={(e) => handleDeleteReminder(e, reminder.id)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </CardContent>
        </Card>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{selectedReminder ? 'Editar Lembrete' : 'Novo Lembrete'}</DialogTitle>
          </DialogHeader>
          <ReminderForm 
            reminder={selectedReminder}
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
    </AppLayout>
  );
}
