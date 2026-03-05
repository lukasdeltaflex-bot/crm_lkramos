
'use client';

import React, { useState, useMemo } from 'react';
import { AppLayout } from '@/components/app-layout';
import { PageHeader } from '@/components/page-header';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle, Calendar as CalendarIcon, History, Search, User, CheckCircle2, RefreshCw, XCircle, Loader2, FilterX, Clock, Sparkles, AlertTriangle } from 'lucide-react';
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
  }, [firestore, user, isSaving]); // Re-memoize on save to ensure fresh data

  const customersQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, 'customers'), where('ownerId', '==', user.uid));
  }, [firestore, user]);

  const { data: followUps, isLoading } = useCollection<FollowUp>(followUpsQuery);
  const { data: customers } = useCollection<Customer>(customersQuery);

  const filteredFollowUps = useMemo(() => {
    if (!followUps) return [];
    let list = followUps.filter(f => tab === 'history' ? f.status !== 'pending' : f.status === 'pending');
    
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

  const handleSummarizeAction = async () => {
    if (!actionNotes || actionNotes.trim().length < 10) {
        toast({ variant: 'destructive', title: 'Texto muito curto', description: 'Digite mais detalhes para a IA resumir.' });
        return;
    }
    setIsSummarizingAction(true);
    try {
        const summary = await summarizeNotes(actionNotes);
        setActionNotes(summary);
        toast({ title: 'Conversa resumida com IA!' });
    } catch (e) {
        toast({ variant: 'destructive', title: 'Erro na IA' });
    } finally {
        setIsSummarizingAction(false);
    }
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
        console.error("❌ CRM ERROR:", e);
        toast({ variant: 'destructive', title: 'Erro ao salvar', description: 'Não foi possível atualizar o status.' });
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
        await setDoc(oldRef, {
            status: 'rescheduled',
            completedAt: new Date().toISOString(),
            notes: actionNotes
        }, { merge: true });

        await setDoc(newRef, newFollowUp);
        
        toast({ title: 'Reagendamento Concluído' });
        setIsRescheduleOpen(false);
        setIsActionDialogOpen(false);
    } catch (e: any) {
        console.error("❌ CRM ERROR:", e);
        toast({ variant: 'destructive', title: 'Falha no reagendamento', description: 'Ocorreu um erro ao salvar.' });
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
    
    const finalData = cleanFirestoreData({
        ...data,
        customerId,
        id,
        ownerId: user.uid,
        createdAt: selectedFollowUp?.createdAt || new Date().toISOString(),
        status: 'pending'
    });

    try {
        await setDoc(docRef, finalData, { merge: true });
        toast({ title: 'Agendado com sucesso!' });
        setIsFormOpen(false);
    } catch (e: any) {
        console.error("❌ CRM ERROR:", e);
        toast({ variant: 'destructive', title: 'Falha ao Salvar', description: 'Verifique sua conexão ou permissões.' });
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
          <PlusCircle className="mr-2 h-4 w-4" />
          Novo Retorno
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
            <Tabs value={tab} onValueChange={setTab} className="space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <TabsList className="bg-muted/50 p-1">
                        <TabsTrigger 
                            value="pending"
                            className={cn(
                                "gap-2 border border-transparent transition-all",
                                tab === 'pending' && "status-custom"
                            )}
                            style={statusColors['PENDENTE'] ? { '--status-color': statusColors['PENDENTE'] } as any : {}}
                        >
                            <CalendarIcon className="h-4 w-4" />
                            Pendentes
                        </TabsTrigger>
                        <TabsTrigger 
                            value="calendar"
                            className={cn(
                                "gap-2 border border-transparent transition-all",
                                tab === 'calendar' && "status-custom"
                            )}
                            style={statusColors['EM ANDAMENTO'] ? { '--status-color': statusColors['EM ANDAMENTO'] } as any : {}}
                        >
                            <CalendarIcon className="h-4 w-4" />
                            Calendário
                        </TabsTrigger>
                        <TabsTrigger 
                            value="history"
                            className={cn(
                                "gap-2 border border-transparent transition-all",
                                tab === 'history' && "status-custom"
                            )}
                            style={statusColors['PAGO'] ? { '--status-color': statusColors['PAGO'] } as any : {}}
                        >
                            <History className="h-4 w-4" />
                            Histórico
                        </TabsTrigger>
                    </TabsList>
                    <div className="flex items-center gap-2 w-full max-w-sm">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input 
                                placeholder="Pesquisar contatos..." 
                                className="pl-9"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        {dateFilter && tab === 'pending' && (
                            <Button variant="ghost" size="icon" onClick={() => setDateFilter(null)} title="Limpar filtro de data">
                                <FilterX className="h-4 w-4 text-destructive" />
                            </Button>
                        )}
                    </div>
                </div>

                <TabsContent value="pending" className="mt-0">
                    {dateFilter && (
                        <div className="mb-4 flex items-center justify-between bg-primary/5 p-3 rounded-lg border border-primary/20">
                            <div className="flex items-center gap-2">
                                <CalendarIcon className="h-4 w-4 text-primary" />
                                <span className="text-sm font-bold">Mostrando apenas: {format(dateFilter, "dd 'de' MMMM", { locale: ptBR })}</span>
                            </div>
                            <Button variant="ghost" size="sm" onClick={() => setDateFilter(null)} className="h-7 text-xs">Ver Todos</Button>
                        </div>
                    )}
                    <div className="grid gap-4">
                        {isLoading ? (
                            Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24 w-full" />)
                        ) : filteredFollowUps.length === 0 ? (
                            <div className="py-20 text-center border-2 border-dashed rounded-xl bg-muted/10 border-border/50">
                                <CalendarIcon className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-20" />
                                <p className="text-muted-foreground">Nenhum retorno pendente{dateFilter ? ' para esta data' : ''}.</p>
                            </div>
                        ) : (
                            filteredFollowUps.map((f) => (
                                <Card key={f.id} className="group border-border/50 hover:border-primary/50 transition-all cursor-pointer overflow-hidden" onClick={() => handleOpenAction(f)}>
                                    <div className="p-4 flex items-center gap-4">
                                        <div className="h-12 w-12 rounded-full bg-primary/5 flex items-center justify-center shrink-0">
                                            <User className="h-6 w-6 text-primary/60" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <h4 className="font-semibold truncate">{f.contactName}</h4>
                                                {getStatusBadge(f)}
                                            </div>
                                            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
                                                <span className="flex items-center gap-1">
                                                    <CalendarIcon className="h-3 w-3" />
                                                    {format(new Date(f.dueDate.replace(/-/g, '/')), "dd 'de' MMMM", { locale: ptBR })}
                                                </span>
                                                {f.dueTime && (
                                                    <span className="flex items-center gap-1 font-bold text-primary">
                                                        <Clock className="h-3 w-3" />
                                                        {f.dueTime}
                                                    </span>
                                                )}
                                                {f.contactPhone && (
                                                    <span className="flex items-center gap-1">
                                                        <User className="h-3 w-3" />
                                                        {f.contactPhone}
                                                    </span>
                                                )}
                                                {f.referralInfo && (
                                                    <span className="px-2.5 py-0.5 bg-primary/5 text-primary border border-primary/20 rounded-md text-[10px] font-black uppercase tracking-tight truncate max-w-[250px] shadow-sm">
                                                        {f.referralInfo}
                                                    </span>
                                                )}
                                            </div>
                                            <p className="mt-2 text-sm line-clamp-1 opacity-80 italic">"{f.description}"</p>
                                        </div>
                                        <Button variant="ghost" size="icon" className="shrink-0 group-hover:bg-primary group-hover:text-white transition-colors" disabled={isSaving}>
                                            <CheckCircle2 className="h-5 w-5" />
                                        </Button>
                                    </div>
                                </Card>
                            ))
                        )}
                    </div>
                </TabsContent>

                <TabsContent value="calendar" className="mt-0">
                    <FollowUpCalendar 
                        followUps={followUps || []} 
                        onSelectDate={handleCalendarDateSelect} 
                    />
                </TabsContent>

                <TabsContent value="history" className="mt-0">
                    <div className="grid gap-4">
                        {filteredFollowUps.map((f) => (
                            <Card key={f.id} className="opacity-80 grayscale-[0.5] hover:grayscale-0 transition-all border-border/50">
                                <div className="p-4">
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <h4 className="font-medium truncate">{f.contactName}</h4>
                                                {getStatusBadge(f)}
                                            </div>
                                            <p className="text-xs text-muted-foreground mb-2">
                                                Tratado em: {f.completedAt ? format(parseISO(f.completedAt), "dd/MM/yyyy HH:mm") : '-'}
                                            </p>
                                            <div className="p-2 bg-muted/30 rounded text-sm italic">
                                                &quot;{f.notes || 'Nenhuma observação registrada.'}&quot;
                                            </div>
                                        </div>
                                        <div className="text-right text-[10px] text-muted-foreground shrink-0">
                                            Criação: {format(parseISO(f.createdAt), "dd/MM/yy")}
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                </TabsContent>
            </Tabs>
        </div>
        <div className="lg:col-span-1">
            <FollowUpsWidget key={followUps?.length} />
        </div>
      </div>

      {/* MODAL DE AÇÃO NO RETORNO */}
      <Dialog open={isActionDialogOpen} onOpenChange={setIsActionDialogOpen}>
        <DialogContent className="max-w-md" onPointerDownOutside={(e) => e.preventDefault()} onInteractOutside={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle>Realizar Retorno: {selectedFollowUp?.contactName}</DialogTitle>
            <DialogDescription>O que foi conversado com o contato?</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="p-3 bg-secondary/30 rounded-md text-sm border border-border/50">
                <div className="flex items-center justify-between mb-1">
                    <strong>Motivo agendado:</strong>
                    {selectedFollowUp?.dueTime && (
                        <Badge variant="outline" className="h-5 gap-1 font-bold border-primary/20 text-primary">
                            <Clock className="h-3 w-3" /> {selectedFollowUp.dueTime}
                        </Badge>
                    )}
                </div>
                {selectedFollowUp?.description}
            </div>
            <div className="space-y-2">
                <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Anotações da Conversa</span>
                    <Button 
                        type="button" 
                        variant="outline" 
                        size="sm" 
                        className="h-7 rounded-full text-[10px] font-bold px-3 border-primary/20 bg-primary/5 text-primary hover:bg-primary/10"
                        onClick={handleSummarizeAction}
                        disabled={isSummarizingAction || !actionNotes}
                    >
                        {isSummarizingAction ? <Loader2 className="h-3 w-3 animate-spin mr-1.5" /> : <Sparkles className="h-3 w-3 mr-1.5" />}
                        Resumir com IA
                    </Button>
                </div>
                <textarea 
                    className="w-full min-h-[100px] p-3 rounded-md border border-border/50 text-sm focus:ring-2 focus:ring-primary outline-none bg-background"
                    placeholder="Ex: Liguei e ele pediu para retornar semana que vem..."
                    value={actionNotes}
                    onChange={(e) => setActionNotes(e.target.value)}
                    disabled={isSaving || isSummarizingAction}
                />
            </div>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="ghost" className="text-destructive hover:bg-destructive/10" onClick={() => setIsCancelConfirmOpen(true)} disabled={isSaving || isSummarizingAction}>
                <XCircle className="mr-2 h-4 w-4" /> Cancelar
            </Button>
            <Button variant="outline" onClick={() => setIsRescheduleOpen(true)} disabled={isSaving || isSummarizingAction}>
                <RefreshCw className="mr-2 h-4 w-4" /> Reagendar
            </Button>
            <Button onClick={() => handleUpdateStatus('completed')} disabled={isSaving || isSummarizingAction}>
                {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
                Concluído
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* CONFIRMAÇÃO DE CANCELAMENTO */}
      <AlertDialog open={isCancelConfirmOpen} onOpenChange={setIsCancelConfirmOpen}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center text-red-600 mb-2">
                    <AlertTriangle className="h-6 w-6" />
                </div>
                <AlertDialogTitle>Cancelar Agendamento?</AlertDialogTitle>
                <AlertDialogDescription>
                    Você tem certeza que deseja cancelar o retorno de <strong>{selectedFollowUp?.contactName}</strong>? Esta ação não pode ser desfeita e o item sairá da sua lista de pendências.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel disabled={isSaving}>Voltar</AlertDialogCancel>
                <AlertDialogAction 
                    onClick={() => handleUpdateStatus('cancelled')} 
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    disabled={isSaving}
                >
                    {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Confirmar Cancelamento
                </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* REAGENDAMENTO */}
      <Dialog open={isRescheduleOpen} onOpenChange={setIsRescheduleOpen}>
        <DialogContent className="max-w-xs" onPointerDownOutside={(e) => e.preventDefault()} onInteractOutside={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle>Nova Data</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Input 
                type="date" 
                value={newDueDate} 
                onChange={(e) => setNewDueDate(e.target.value)} 
                disabled={isSaving}
            />
          </div>
          <DialogFooter>
            <Button className="w-full" onClick={handleReschedule} disabled={isSaving}>
                {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin mr-2" /> : null}
                Confirmar Reagendamento
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-lg" onPointerDownOutside={(e) => e.preventDefault()} onInteractOutside={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle>{selectedFollowUp ? 'Editar Retorno' : 'Agendar Novo Retorno'}</DialogTitle>
          </DialogHeader>
          <FollowUpForm 
            customers={customers || []} 
            initialData={selectedFollowUp}
            onSubmit={handleFormSubmit}
            isSaving={isSaving}
          />
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
