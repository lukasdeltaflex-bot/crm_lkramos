
'use client';

import React, { useState, useMemo } from 'react';
import { AppLayout } from '@/components/app-layout';
import { PageHeader } from '@/components/page-header';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle, Calendar as CalendarIcon, History, Search, User, CheckCircle2, RefreshCw, XCircle, Loader2, FilterX, Clock, Sparkles, AlertTriangle, Trash2 } from 'lucide-react';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, doc, setDoc, orderBy } from 'firebase/firestore';
import type { FollowUp, Customer } from '@/lib/types';
import { format, isBefore, isToday, parseISO, startOfDay, addDays, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { FollowUpForm } from './follow-up-form';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { FollowUpsWidget } from '@/components/dashboard/follow-ups-widget';
import { FollowUpCalendar } from '@/components/follow-ups/follow-up-calendar';
import { useTheme } from '@/components/theme-provider';
import { cn, cleanFirestoreData } from '@/lib/utils';
import { summarizeNotes } from '@/ai/flows/summarize-notes-flow';

export default function FollowUpsPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { statusColors } = useTheme();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedFollowUp, setSelectedFollowUp] = useState<FollowUp | undefined>(undefined);
  const [isActionDialogOpen, setIsActionDialogOpen] = useState(false);
  const [isRescheduleOpen, setIsRescheduleOpen] = useState(false);
  const [isCancelConfirmOpen, setIsCancelConfirmOpen] = useState(false);
  const [isTrashConfirmOpen, setIsTrashConfirmOpen] = useState(false);
  const [actionNotes, setActionNotes] = useState('');
  const [isSummarizingAction, setIsSummarizingAction] = useState(false);
  const [newDueDate, setNewDueDate] = useState(format(addDays(new Date(), 7), 'yyyy-MM-dd'));
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState<Date | null>(null);
  const [tab, setTab] = useState('pending');
  const [isSaving, setIsSaving] = useState(false);

  const followUpsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(
      collection(firestore, 'users', user.uid, 'followUps'),
      orderBy('dueDate', 'asc')
    );
  }, [firestore, user]);

  const customersQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, 'customers'), where('ownerId', '==', user.uid));
  }, [firestore, user]);

  const { data: followUps, isLoading } = useCollection<FollowUp>(followUpsQuery);
  const { data: customers } = useCollection<Customer>(customersQuery);

  const filteredFollowUps = useMemo(() => {
    if (!followUps) return [];
    let list = followUps
        .filter(f => f.deleted !== true) // Filtro de Lixeira
        .filter(f => tab === 'history' ? f.status !== 'pending' : f.status === 'pending');
    
    if (dateFilter && tab === 'pending') {
        const dateStr = format(dateFilter, 'yyyy-MM-dd');
        list = list.filter(f => f.dueDate === dateStr);
    }

    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      list = list.filter(f => 
        f.contactName.toLowerCase().includes(lower) || 
        f.description.toLowerCase().includes(lower) ||
        f.referralInfo?.toLowerCase().includes(lower)
      );
    }
    
    if (tab === 'history') {
        return list.sort((a, b) => (b.completedAt || '').localeCompare(a.completedAt || ''));
    }
    return list;
  }, [followUps, searchTerm, tab, dateFilter]);

  const handleOpenAction = (followUp: FollowUp) => {
    setSelectedFollowUp(followUp);
    setActionNotes('');
    setIsActionDialogOpen(true);
  };

  const handleUpdateStatus = async (status: FollowUp['status'], extraData: any = {}) => {
    if (!firestore || !selectedFollowUp || !user) return;
    setIsSaving(true);
    const docRef = doc(firestore, 'users', user.uid, 'followUps', selectedFollowUp.id);
    const updateData = cleanFirestoreData({
        ...extraData,
        status,
        completedAt: new Date().toISOString(),
        notes: actionNotes
    });

    try {
        await setDoc(docRef, updateData, { merge: true });
        toast({ title: status === 'cancelled' ? 'Agendamento Cancelado' : 'Ação realizada com sucesso' });
        setIsActionDialogOpen(false);
        setIsCancelConfirmOpen(false);
    } catch (e: any) {
        toast({ variant: 'destructive', title: 'Erro ao salvar' });
    } finally {
        setIsSaving(false);
    }
  };

  const handleMoveToTrash = async () => {
    if (!firestore || !selectedFollowUp || !user) return;
    setIsSaving(true);
    const docRef = doc(firestore, 'users', user.uid, 'followUps', selectedFollowUp.id);
    try {
        await setDoc(docRef, {
            deleted: true,
            deletedAt: new Date().toISOString(),
            deletedBy: user.uid
        }, { merge: true });
        toast({ title: 'Movido para a Lixeira' });
        setIsTrashConfirmOpen(false);
        setIsActionDialogOpen(false);
    } catch (e) {
        toast({ variant: 'destructive', title: 'Erro ao excluir' });
    } finally {
        setIsSaving(false);
    }
  };

  const handleReschedule = async () => {
    if (!firestore || !selectedFollowUp || !user) return;
    setIsSaving(true);
    const oldRef = doc(firestore, 'users', user.uid, 'followUps', selectedFollowUp.id);
    const newRef = doc(collection(firestore, 'users', user.uid, 'followUps'));
    const newFollowUp = cleanFirestoreData({
        ...selectedFollowUp,
        id: newRef.id,
        ownerId: user.uid,
        dueDate: newDueDate,
        status: 'pending',
        createdAt: new Date().toISOString(),
        completedAt: null,
        notes: null,
        description: `(Reagendado) ${selectedFollowUp.description}`
    });
    try {
        await setDoc(oldRef, { status: 'rescheduled', completedAt: new Date().toISOString(), notes: actionNotes }, { merge: true });
        await setDoc(newRef, newFollowUp);
        toast({ title: 'Reagendamento Concluído' });
        setIsRescheduleOpen(false);
        setIsActionDialogOpen(false);
    } catch (e) {
        toast({ variant: 'destructive', title: 'Falha no reagendamento' });
    } finally {
        setIsSaving(false);
    }
  };

  const handleFormSubmit = async (data: any) => {
    if (!firestore || !user) return;
    setIsSaving(true);
    const id = selectedFollowUp?.id || doc(collection(firestore, 'users', user.uid, 'followUps')).id;
    const customerId = data.customerId === 'none' || !data.customerId ? null : data.customerId;
    const docRef = doc(firestore, 'users', user.uid, 'followUps', id);
    const finalData = cleanFirestoreData({ ...data, customerId, id, ownerId: user.uid, createdAt: selectedFollowUp?.createdAt || new Date().toISOString(), status: 'pending' });
    try {
        await setDoc(docRef, finalData, { merge: true });
        toast({ title: 'Agendado com sucesso!' });
        setIsFormOpen(false);
    } catch (e) {
        toast({ variant: 'destructive', title: 'Falha ao Salvar' });
    } finally {
        setIsSaving(false);
    }
  };

  const handleCalendarDateSelect = (date: Date) => {
    setDateFilter(date);
    setTab('pending');
  };

  const getStatusBadge = (followUp: FollowUp) => {
    if (followUp.status === 'completed') return <Badge variant="secondary" className="bg-green-100 text-green-700 border-green-200">Concluído</Badge>;
    if (followUp.status === 'cancelled') return <Badge variant="secondary" className="bg-slate-100 text-slate-500">Cancelado</Badge>;
    if (followUp.status === 'rescheduled') return <Badge variant="secondary" className="bg-blue-100 text-blue-700">Reagendado</Badge>;
    const [year, month, day] = followUp.dueDate.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    const today = startOfDay(new Date());
    if (isSameDay(date, today)) return <Badge className="bg-yellow-500 text-black border-none">Hoje</Badge>;
    if (isBefore(date, today)) return <Badge variant="destructive">Atrasado</Badge>;
    return <Badge variant="outline">Pendente</Badge>;
  };

  return (
    <AppLayout>
      <div className="flex items-center justify-between mb-8">
        <PageHeader title="Mecanismo de Retornos" />
        <Button onClick={() => { setSelectedFollowUp(undefined); setIsFormOpen(true); }} disabled={isSaving}>
          <PlusCircle className="mr-2 h-4 w-4" /> Novo Retorno
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
            <Tabs value={tab} onValueChange={setTab} className="space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <TabsList className="bg-muted/50 p-1">
                        <TabsTrigger value="pending" className={cn("gap-2 border border-transparent transition-all", tab === 'pending' && "status-custom")} style={statusColors['PENDENTE'] ? { '--status-color': statusColors['PENDENTE'] } as any : {}}><CalendarIcon className="h-4 w-4" /> Pendentes</TabsTrigger>
                        <TabsTrigger value="calendar" className={cn("gap-2 border border-transparent transition-all", tab === 'calendar' && "status-custom")} style={statusColors['EM ANDAMENTO'] ? { '--status-color': statusColors['EM ANDAMENTO'] } as any : {}}><CalendarIcon className="h-4 w-4" /> Calendário</TabsTrigger>
                        <TabsTrigger value="history" className={cn("gap-2 border border-transparent transition-all", tab === 'history' && "status-custom")} style={statusColors['PAGO'] ? { '--status-color': statusColors['PAGO'] } as any : {}}><History className="h-4 w-4" /> Histórico</TabsTrigger>
                    </TabsList>
                    <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input placeholder="Pesquisar contatos..." className="pl-9" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                    </div>
                </div>

                <TabsContent value="pending" className="mt-0">
                    <div className="grid gap-4">
                        {isLoading ? (
                            Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24 w-full" />)
                        ) : filteredFollowUps.length === 0 ? (
                            <div className="py-20 text-center border-2 border-dashed rounded-xl bg-muted/10">
                                <CalendarIcon className="h-12 w-12 mx-auto mb-4 opacity-20" />
                                <p className="text-muted-foreground">Nenhum retorno pendente.</p>
                            </div>
                        ) : (
                            filteredFollowUps.map((f) => (
                                <Card key={f.id} className="group border-border/50 hover:border-primary/50 transition-all cursor-pointer overflow-hidden" onClick={() => handleOpenAction(f)}>
                                    <div className="p-4 flex items-center gap-4">
                                        <div className="h-12 w-12 rounded-full bg-primary/5 flex items-center justify-center shrink-0"><User className="h-6 w-6 text-primary/60" /></div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1"><h4 className="font-semibold truncate">{f.contactName}</h4>{getStatusBadge(f)}</div>
                                            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground"><span className="flex items-center gap-1"><CalendarIcon className="h-3 w-3" />{format(new Date(f.dueDate.replace(/-/g, '/')), "dd 'de' MMMM", { locale: ptBR })}</span>{f.dueTime && <span className="font-bold text-primary">{f.dueTime}</span>}</div>
                                            <p className="mt-2 text-sm line-clamp-1 opacity-80 italic">"{f.description}"</p>
                                        </div>
                                        <Button variant="ghost" size="icon" className="shrink-0 group-hover:bg-primary group-hover:text-white transition-colors" disabled={isSaving}><CheckCircle2 className="h-5 w-5" /></Button>
                                    </div>
                                </Card>
                            ))
                        )}
                    </div>
                </TabsContent>

                <TabsContent value="calendar" className="mt-0"><FollowUpCalendar followUps={followUps || []} onSelectDate={handleCalendarDateSelect} /></TabsContent>
                <TabsContent value="history" className="mt-0">
                    <div className="grid gap-4">
                        {filteredFollowUps.map((f) => (
                            <Card key={f.id} className="opacity-80 grayscale-[0.5] hover:grayscale-0 transition-all">
                                <div className="p-4"><div className="flex items-center justify-between mb-2"><h4>{f.contactName}</h4>{getStatusBadge(f)}</div><p className="text-xs text-muted-foreground italic">"{f.notes || 'Sem observações.'}"</p></div>
                            </Card>
                        ))}
                    </div>
                </TabsContent>
            </Tabs>
        </div>
        <div className="lg:col-span-1"><FollowUpsWidget key={followUps?.length} /></div>
      </div>

      {/* MODAL DE AÇÃO NO RETORNO */}
      <Dialog open={isActionDialogOpen} onOpenChange={setIsActionDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Realizar Retorno: {selectedFollowUp?.contactName}</DialogTitle>
            <DialogDescription>Registre o resultado do contato realizado com o cliente.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="p-3 bg-secondary/30 rounded-md text-sm border">{selectedFollowUp?.description}</div>
            <textarea className="w-full min-h-[100px] p-3 rounded-md border text-sm focus:ring-2 focus:ring-primary outline-none" placeholder="O que foi conversado..." value={actionNotes} onChange={(e) => setActionNotes(e.target.value)} disabled={isSaving} />
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="ghost" className="text-destructive hover:bg-destructive/10" onClick={() => setIsTrashConfirmOpen(true)} disabled={isSaving}><Trash2 className="mr-2 h-4 w-4" /> Lixeira</Button>
            <Button variant="outline" onClick={() => setIsRescheduleOpen(true)} disabled={isSaving}><RefreshCw className="mr-2 h-4 w-4" /> Reagendar</Button>
            <Button onClick={() => handleUpdateStatus('completed')} disabled={isSaving}>{isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle2 className="mr-2 h-4 w-4" />} Concluído</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* CONFIRMAÇÃO DE LIXEIRA */}
      <AlertDialog open={isTrashConfirmOpen} onOpenChange={setIsTrashConfirmOpen}>
        <AlertDialogContent>
            <AlertDialogHeader><AlertDialogTitle>Mover para a Lixeira?</AlertDialogTitle><AlertDialogDescription>O retorno de <strong>{selectedFollowUp?.contactName}</strong> será movido para a aba Lixeira.</AlertDialogDescription></AlertDialogHeader>
            <AlertDialogFooter><AlertDialogCancel disabled={isSaving}>Voltar</AlertDialogCancel><AlertDialogAction onClick={handleMoveToTrash} className="bg-destructive text-destructive-foreground hover:bg-destructive/90" disabled={isSaving}>Confirmar</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={isRescheduleOpen} onOpenChange={setIsRescheduleOpen}>
        <DialogContent className="max-w-xs">
          <DialogHeader>
            <DialogTitle>Nova Data</DialogTitle>
            <DialogDescription>Escolha um novo dia para este retorno.</DialogDescription>
          </DialogHeader>
          <div className="py-4"><Input type="date" value={newDueDate} onChange={(e) => setNewDueDate(e.target.value)} disabled={isSaving} /></div><DialogFooter><Button className="w-full" onClick={handleReschedule} disabled={isSaving}>Confirmar Reagendamento</Button></DialogFooter></DialogContent>
      </Dialog>

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{selectedFollowUp ? 'Editar Retorno' : 'Agendar Novo Retorno'}</DialogTitle>
            <DialogDescription>Defina os detalhes do contato que precisa ser realizado.</DialogDescription>
          </DialogHeader>
          <FollowUpForm customers={customers || []} initialData={selectedFollowUp} onSubmit={handleFormSubmit} isSaving={isSaving} />
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
