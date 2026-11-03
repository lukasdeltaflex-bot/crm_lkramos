'use client';

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle, Calendar as CalendarIcon, CheckCircle2, Circle, User, Loader2, FileText, ExternalLink, Pencil } from 'lucide-react';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, doc, setDoc } from 'firebase/firestore';
import type { Reminder, Customer } from '@/lib/types';
import { format, isBefore, isToday, parseISO, startOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { ReminderForm } from '@/app/agenda/reminder-form';
import { CustomerSearchDialog } from '@/components/proposals/customer-search-dialog';

export function AgendaSection() {
  const { user } = useUser();
  const firestore = useFirestore();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isCustomerSearchOpen, setIsCustomerSearchOpen] = useState(false);
  const [newlySelectedCustomer, setNewlySelectedCustomer] = useState<Customer | null>(null);
  const [selectedReminder, setSelectedReminder] = useState<Reminder | undefined>(undefined);
  const [viewingReminder, setViewingReminder] = useState<Reminder | null>(null);
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

  const handleEditReminder = (reminder: Reminder) => {
    setSelectedReminder(reminder);
    setNewlySelectedCustomer(reminder.customerId ? customerMap.get(reminder.customerId) || null : null);
    setViewingReminder(null);
    setIsDialogOpen(true);
  };

  const handleToggleStatus = async (reminder: Reminder) => {
    if (!firestore || !user) return;
    try {
      await setDoc(doc(firestore, 'users', user.uid, 'reminders', reminder.id), { 
        status: 'completed'
      }, { merge: true });
      toast({ title: 'Retorno Concluído com sucesso!' });
      if (viewingReminder?.id === reminder.id) {
        setViewingReminder(null);
      }
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
      await setDoc(doc(firestore, 'users', user.uid, 'reminders', reminderId), reminderData, { merge: true });
      toast({ title: selectedReminder ? 'Retorno atualizado!' : 'Salvo com sucesso' });
      setIsDialogOpen(false);
      setSelectedReminder(undefined);
    } catch (err) {
      console.error(err);
      toast({ variant: 'destructive', title: 'Falha ao salvar', description: 'Ocorreu um erro de permissão ou conexão.' });
    } finally {
      setIsSaving(false);
    }
  };

  const getStatusBadge = (dueDate: string) => {
    try {
      const date = parseISO(dueDate);
      const now = new Date();
      if (isToday(date)) return <Badge variant="default" className="bg-yellow-500 text-black border-none text-[10px]">Hoje</Badge>;
      if (isBefore(date, startOfDay(now))) return <Badge variant="destructive" className="border-none text-[10px]">Atrasado</Badge>;
      return <Badge variant="secondary" className="border-none text-[10px]">Futuro</Badge>;
    } catch {
      return <Badge variant="outline" className="text-[10px]">Pendente</Badge>;
    }
  };

  const viewingCustomer = viewingReminder?.customerId ? customerMap.get(viewingReminder.customerId) : null;

  return (
    <Card className="h-full border-border/50 shadow-sm flex flex-col">
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
      <CardContent className="flex-1">
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
                <div 
                  key={reminder.id} 
                  onClick={() => setViewingReminder(reminder)}
                  className="group flex items-start gap-3 p-3 rounded-lg border border-border/50 bg-card hover:border-primary/40 hover:bg-muted/20 transition-all cursor-pointer shadow-xs select-none"
                  title="Clique para ver os detalhes completos deste retorno"
                >
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 shrink-0 mt-0.5"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleStatus(reminder);
                    }}
                    title="Marcar como concluído"
                  >
                    <Circle className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                  </Button>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="text-sm font-semibold truncate group-hover:text-primary transition-colors">{reminder.title}</p>
                      {getStatusBadge(reminder.dueDate)}
                    </div>
                    <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <CalendarIcon className="h-3 w-3" />
                        {format(parseISO(reminder.dueDate), "dd 'de' MMM", { locale: ptBR })}
                      </span>
                      {customer && (
                        <span 
                          onClick={(e) => e.stopPropagation()} 
                          className="truncate"
                        >
                          <Link href={`/customers/${customer.id}`} className="flex items-center gap-1 text-primary hover:underline truncate">
                            <User className="h-3 w-3" />
                            {customer.name}
                          </Link>
                        </span>
                      )}
                    </div>
                    {reminder.description && (
                      <p className="mt-1 text-xs text-muted-foreground line-clamp-1 italic font-normal">
                        "{reminder.description}"
                      </p>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </CardContent>

      {/* MODAL DE CONSULTA COMPLETA DOS DETALHES DO RETORNO */}
      <Dialog open={!!viewingReminder} onOpenChange={(open) => !open && setViewingReminder(null)}>
        <DialogContent className="sm:max-w-md w-[95vw] p-6">
          <DialogHeader className="space-y-1">
            <div className="flex items-center gap-2">
              <DialogTitle className="text-xl font-bold break-words">
                {viewingReminder?.title || 'Detalhes do Retorno'}
              </DialogTitle>
              {viewingReminder && getStatusBadge(viewingReminder.dueDate)}
            </div>
            <DialogDescription>
              Consulta completa das informações registradas na agenda.
            </DialogDescription>
          </DialogHeader>

          {viewingReminder && (
            <div className="space-y-4 py-2">
              {/* Cliente Vinculado */}
              {viewingCustomer ? (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-primary/5 border border-primary/20 text-xs">
                  <User className="h-4 w-4 text-primary shrink-0" />
                  <div className="min-w-0 flex-1 flex flex-wrap items-center gap-x-2 gap-y-0.5">
                    <span className="text-muted-foreground font-semibold">Cliente Vinculado:</span>
                    <Link 
                      href={`/customers/${viewingCustomer.id}`} 
                      className="font-bold text-primary hover:underline flex items-center gap-1 truncate"
                      title="Acessar ficha do cliente"
                    >
                      {viewingCustomer.name}
                      <ExternalLink className="h-3 w-3 inline ml-0.5" />
                    </Link>
                  </div>
                </div>
              ) : viewingReminder.customerId ? (
                <div className="flex items-center gap-2 p-2.5 rounded-xl bg-muted/20 border border-border/30 text-xs text-muted-foreground">
                  <User className="h-4 w-4 shrink-0 opacity-60" />
                  <span>Cliente vinculado (ID: {viewingReminder.customerId})</span>
                </div>
              ) : null}

              {/* Data do Retorno */}
              <div className="flex items-center gap-2.5 p-3 rounded-xl bg-muted/20 border border-border/40 text-xs">
                <CalendarIcon className="h-4 w-4 text-primary shrink-0" />
                <div>
                  <p className="text-[10px] uppercase font-black tracking-wider text-muted-foreground">Data Agendada</p>
                  <p className="font-semibold text-foreground mt-0.5">
                    {format(parseISO(viewingReminder.dueDate), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                  </p>
                </div>
              </div>

              {/* DESCRIÇÃO COMPLETA */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest flex items-center gap-1.5">
                    <FileText className="h-3.5 w-3.5 text-primary" /> Descrição do Retorno (Cadastro)
                  </label>
                  {viewingReminder.description && (
                    <span className="text-[10px] text-muted-foreground font-medium">
                      {viewingReminder.description.length} caracteres
                    </span>
                  )}
                </div>
                <div className="p-3.5 bg-muted/40 dark:bg-muted/10 rounded-xl border border-border/50 text-sm leading-relaxed whitespace-pre-wrap break-words max-h-56 overflow-y-auto font-medium text-foreground selection:bg-primary/20">
                  {viewingReminder.description && viewingReminder.description.trim().length > 0 ? (
                    viewingReminder.description
                  ) : (
                    <span className="text-muted-foreground italic text-xs block py-1">
                      Nenhuma anotação registrada para este retorno.
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="flex flex-col sm:flex-row items-center gap-2 justify-between pt-2">
            <Button 
              variant="outline" 
              className="w-full sm:w-auto" 
              onClick={() => setViewingReminder(null)}
            >
              Fechar
            </Button>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Button 
                variant="outline" 
                className="w-full sm:w-auto text-primary hover:bg-primary/10 border-primary/20" 
                onClick={() => viewingReminder && handleEditReminder(viewingReminder)}
              >
                <Pencil className="mr-1.5 h-3.5 w-3.5" /> Editar
              </Button>
              <Button 
                className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white" 
                onClick={() => viewingReminder && handleToggleStatus(viewingReminder)}
              >
                <CheckCircle2 className="mr-1.5 h-4 w-4" /> Concluir
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL DE CADASTRO / EDIÇÃO */}
      <Dialog open={isDialogOpen} onOpenChange={(open) => {
        setIsDialogOpen(open);
        if (!open) setSelectedReminder(undefined);
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {selectedReminder ? 'Editar Lembrete na Agenda' : 'Novo Lembrete na Agenda'}
            </DialogTitle>
            <DialogDescription>
              {selectedReminder 
                ? 'Altere as informações deste retorno ou anotações adicionais.' 
                : 'Defina a data, cliente e detalhes do que precisa ser realizado.'}
            </DialogDescription>
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
    </Card>
  );
}
