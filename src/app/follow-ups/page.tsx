'use client';

import React, { useState, useMemo } from 'react';
import { AppLayout } from '@/components/app-layout';
import { PageHeader } from '@/components/page-header';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle, Calendar as CalendarIcon, History, Search, User, CheckCircle2, RefreshCw, XCircle, Loader2, FilterX } from 'lucide-react';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, doc, setDoc, orderBy } from 'firebase/firestore';
import type { FollowUp, Customer } from '@/lib/types';
import { format, isBefore, isToday, parseISO, startOfDay, addDays, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { FollowUpForm } from './follow-up-form';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { FollowUpsWidget } from '@/components/dashboard/follow-ups-widget';
import { FollowUpCalendar } from '@/components/follow-ups/follow-up-calendar';
import { useTheme } from '@/components/theme-provider';
import { cn } from '@/lib/utils';

export default function FollowUpsPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { statusColors } = useTheme();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedFollowUp, setSelectedFollowUp] = useState<FollowUp | undefined>(undefined);
  const [isActionDialogOpen, setIsActionDialogOpen] = useState(false);
  const [isRescheduleOpen, setIsRescheduleOpen] = useState(false);
  const [actionNotes, setActionNotes] = useState('');
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
    let list = followUps.filter(f => tab === 'history' ? f.status !== 'pending' : f.status === 'pending');
    
    if (dateFilter && tab === 'pending') {
        list = list.filter(f => isSameDay(parseISO(f.dueDate), dateFilter));
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
    try {
      await setDoc(doc(firestore, 'users', user.uid, 'followUps', selectedFollowUp.id), {
        ...extraData,
        status,
        completedAt: new Date().toISOString(),
        notes: actionNotes
      }, { merge: true });
      
      toast({ title: 'Ação realizada com sucesso' });
      setIsActionDialogOpen(false);
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
    try {
      await setDoc(doc(firestore, 'users', user.uid, 'followUps', selectedFollowUp.id), {
        status: 'rescheduled',
        completedAt: new Date().toISOString(),
        notes: actionNotes
      }, { merge: true });

      const newRef = doc(collection(firestore, 'users', user.uid, 'followUps'));
      const newFollowUp: FollowUp = {
        ...selectedFollowUp,
        id: newRef.id,
        ownerId: user.uid,
        dueDate: newDueDate,
        status: 'pending',
        createdAt: new Date().toISOString(),
        completedAt: undefined,
        notes: undefined,
        description: `(Reagendado) ${selectedFollowUp.description}`
      };
      
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
    try {
        const id = selectedFollowUp?.id || doc(collection(firestore, 'users', user.uid, 'followUps')).id;
        const customerId = data.customerId === 'none' || !data.customerId ? null : data.customerId;

        await setDoc(doc(firestore, 'users', user.uid, 'followUps', id), {
            ...data,
            customerId,
            id,
            ownerId: user.uid,
            createdAt: selectedFollowUp?.createdAt || new Date().toISOString(),
            status: 'pending'
        }, { merge: true });

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
    
    const date = parseISO(followUp.dueDate);
    if (isToday(date)) return <Badge className="bg-yellow-500 text-black border-none">Hoje</Badge>;
    if (isBefore(date, startOfDay(new Date()))) return <Badge variant="destructive">Atrasado</Badge>;
    return <Badge variant="outline">Pendente</Badge>;
  };

  return (
    <AppLayout>
      <div className="flex items-center justify-between mb-8">
        <PageHeader title="Mecanismo de Retornos" />
        <Button onClick={() => { setSelectedFollowUp(undefined); setIsFormOpen(true); }}>
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
                            style={statusColors['Pendente'] ? { '--status-color': statusColors['Pendente'] } as any : {}}
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
                            style={statusColors['Em Andamento'] ? { '--status-color': statusColors['Em Andamento'] } as any : {}}
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
                            style={statusColors['Paga'] ? { '--status-color': statusColors['Paga'] } as any : {}}
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
                                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                                                <span className="flex items-center gap-1">
                                                    <CalendarIcon className="h-3 w-3" />
                                                    {format(parseISO(f.dueDate), "dd 'de' MMMM", { locale: ptBR })}
                                                </span>
                                                {f.contactPhone && (
                                                    <span className="flex items-center gap-1">
                                                        <User className="h-3 w-3" />
                                                        {f.contactPhone}
                                                    </span>
                                                )}
                                                {f.referralInfo && (
                                                    <span className="px-2 py-0.5 bg-secondary rounded text-[10px] truncate max-w-[200px]">
                                                        {f.referralInfo}
                                                    </span>
                                                )}
                                            </div>
                                            <p className="mt-2 text-sm line-clamp-1 opacity-80">{f.description}</p>
                                        </div>
                                        <Button variant="ghost" size="icon" className="shrink-0 group-hover:bg-primary group-hover:text-white transition-colors">
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
            <FollowUpsWidget />
        </div>
      </div>

      <Dialog open={isActionDialogOpen} onOpenChange={setIsActionDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Realizar Retorno: {selectedFollowUp?.contactName}</DialogTitle>
            <DialogDescription>O que foi conversado com o contato?</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="p-3 bg-secondary/30 rounded-md text-sm border border-border/50">
                <strong>Motivo agendado:</strong><br />
                {selectedFollowUp?.description}
            </div>
            <textarea 
                className="w-full min-h-[100px] p-3 rounded-md border border-border/50 text-sm focus:ring-2 focus:ring-primary outline-none bg-background"
                placeholder="Ex: Liguei e ele pediu para retornar semana que vem..."
                value={actionNotes}
                onChange={(e) => setActionNotes(e.target.value)}
                disabled={isSaving}
            />
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="ghost" className="text-destructive hover:bg-destructive/10" onClick={() => handleUpdateStatus('cancelled')} disabled={isSaving}>
                <XCircle className="mr-2 h-4 w-4" /> Cancelar
            </Button>
            <Button variant="outline" onClick={() => setIsRescheduleOpen(true)} disabled={isSaving}>
                <RefreshCw className="mr-2 h-4 w-4" /> Reagendar
            </Button>
            <Button onClick={() => handleUpdateStatus('completed')} disabled={isSaving}>
                {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
                Concluído
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isRescheduleOpen} onOpenChange={setIsRescheduleOpen}>
        <DialogContent className="max-w-xs">
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
                {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Confirmar Reagendamento
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-lg">
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