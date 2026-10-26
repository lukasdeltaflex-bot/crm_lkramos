'use client';

import React, { useState, useMemo } from 'react';
import { AppLayout } from '@/components/app-layout';
import { PageHeader } from '@/components/page-header';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle, Calendar as CalendarIcon, History, Search, User, CheckCircle2, RefreshCw, XCircle, Loader2, FilterX, Clock, Sparkles, AlertTriangle, Trash2, Phone, Copy, FileText, Pencil, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { WhatsAppIcon } from '@/components/icons/whatsapp-icon';
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
  const [isFinishConfirmOpen, setIsFinishConfirmOpen] = useState(false);
  const [isRescheduleConfirmOpen, setIsRescheduleConfirmOpen] = useState(false);
  const [isReopenConfirmOpen, setIsReopenConfirmOpen] = useState(false);
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
        .filter(f => f.deleted !== true)
        .filter(f => tab === 'history' ? (f.status !== 'pending' && f.status !== 'pendente') : (f.status === 'pending' || f.status === 'pendente'));
    
    if (dateFilter && tab === 'pending') {
        const dateStr = format(dateFilter, 'yyyy-MM-dd');
        list = list.filter(f => (f.dueDate || f.date) === dateStr);
    }

    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      list = list.filter(f => {
        const name = (f.contactName || f.title || '').toLowerCase();
        const desc = (f.description || f.notes || f.observation || f.observations || f.details || '').toLowerCase();
        const ref = (f.referralInfo || '').toLowerCase();
        const phone = (f.contactPhone || '').toLowerCase();
        return name.includes(lower) || desc.includes(lower) || ref.includes(lower) || phone.includes(lower);
      });
    }
    
    if (tab === 'history') {
        return list.sort((a, b) => (b.completedAt || '').localeCompare(a.completedAt || ''));
    }
    return list;
  }, [followUps, searchTerm, tab, dateFilter]);

  const linkedCustomer = useMemo(() => {
    if (!selectedFollowUp?.customerId || !customers) return null;
    return customers.find(c => c.id === selectedFollowUp.customerId) || null;
  }, [selectedFollowUp, customers]);

  const selectedDescription = useMemo(() => {
    if (!selectedFollowUp) return '';
    return (
      selectedFollowUp.description ||
      (selectedFollowUp as any).notes ||
      (selectedFollowUp as any).observation ||
      (selectedFollowUp as any).observations ||
      (selectedFollowUp as any).details ||
      ''
    );
  }, [selectedFollowUp]);

  const formattedDueDate = useMemo(() => {
    const rawDate = selectedFollowUp?.dueDate || (selectedFollowUp as any)?.date;
    if (!rawDate) return null;
    try {
      return format(new Date(rawDate.replace(/-/g, '/')), "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
    } catch {
      return rawDate;
    }
  }, [selectedFollowUp]);

  const handleOpenAction = (followUp: FollowUp) => {
    setSelectedFollowUp(followUp);
    setActionNotes(followUp.notes || '');
    setIsActionDialogOpen(true);
  };

  const handleSummarizeAction = async () => {
    if (!actionNotes || actionNotes.trim().length < 5) {
        toast({ variant: 'destructive', title: 'Texto curto', description: 'Escreva um pouco para a IA resumir.' });
        return;
    }
    setIsSummarizingAction(true);
    try {
        const summary = await summarizeNotes(actionNotes);
        setActionNotes(summary);
        toast({ title: 'Resultado resumido com IA!' });
    } catch (e) {
        toast({ variant: 'destructive', title: 'Falha na IA' });
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
    const finalData = cleanFirestoreData({ 
        ...data, 
        customerId, 
        id, 
        ownerId: user.uid, 
        createdAt: selectedFollowUp?.createdAt || new Date().toISOString(), 
        status: selectedFollowUp?.status || 'pending',
        title: data.contactName, // Padronização Firestore
        date: data.dueDate // Padronização Firestore
    });
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
    if (followUp.status === 'completed' || followUp.status === 'concluido') return <Badge variant="secondary" className="bg-green-100 text-green-700 border-green-200">Concluído</Badge>;
    if (followUp.status === 'cancelled') return <Badge variant="secondary" className="bg-slate-100 text-slate-500">Cancelado</Badge>;
    if (followUp.status === 'rescheduled') return <Badge variant="secondary" className="bg-blue-100 text-blue-700">Reagendado</Badge>;
    const rawDate = followUp.dueDate || (followUp as any)?.date;
    if (!rawDate) return <Badge variant="outline">Pendente</Badge>;
    try {
      const parts = rawDate.split('-');
      if (parts.length >= 3) {
        const [year, month, day] = parts.map(Number);
        const date = new Date(year, month - 1, day);
        const today = startOfDay(new Date());
        if (isSameDay(date, today)) return <Badge className="bg-yellow-500 text-black border-none">Hoje</Badge>;
        if (isBefore(date, today)) return <Badge variant="destructive">Atrasado</Badge>;
      }
    } catch {
      // fallback
    }
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
                                            <div className="flex items-center gap-2 mb-1">
                                                <h4 className="font-semibold truncate">{f.contactName || f.title || 'Retorno'}</h4>
                                                {getStatusBadge(f)}
                                            </div>
                                            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
                                                <span className="flex items-center gap-1">
                                                    <CalendarIcon className="h-3 w-3" />
                                                    {f.dueDate || f.date ? format(new Date((f.dueDate || f.date)!.replace(/-/g, '/')), "dd 'de' MMMM", { locale: ptBR }) : 'Data não informada'}
                                                </span>
                                                {f.dueTime && <span className="font-bold text-primary">{f.dueTime}</span>}
                                                {f.contactPhone && (
                                                    <span className="flex items-center gap-1 bg-muted/40 px-2 py-0.5 rounded-full border border-border/50">
                                                        <span className="flex items-center gap-1 font-medium text-foreground/80"><Phone className="h-3 w-3" />{f.contactPhone}</span>
                                                        <span className="h-3 w-px bg-border mx-1"></span>
                                                        <Button variant="ghost" size="icon" className="h-5 w-5 rounded-full hover:bg-green-100 hover:text-green-600 text-muted-foreground flex items-center justify-center pt-[1px]" onClick={(e) => { e.stopPropagation(); const p = f.contactPhone!.replace(/\D/g, ''); window.open(`https://wa.me/${p.startsWith('55') ? p : '55'+p}`, '_blank'); }} title="Abrir WhatsApp"><WhatsAppIcon className="h-3 w-3" /></Button>
                                                        <Button variant="ghost" size="icon" className="h-5 w-5 rounded-full hover:bg-primary/20 text-muted-foreground" onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(f.contactPhone!); toast({ title: 'Telefone copiado!' }); }} title="Copiar"><Copy className="h-3 w-3" /></Button>
                                                    </span>
                                                )}
                                            </div>
                                            {f.description ? (
                                                <p className="mt-2 text-sm line-clamp-2 opacity-85 text-foreground/90 font-normal">
                                                    "{f.description}"
                                                </p>
                                            ) : (
                                                <p className="mt-2 text-xs text-muted-foreground italic">
                                                    Sem descrição cadastrada. Clique para ver detalhes.
                                                </p>
                                            )}
                                        </div>
                                        <Button variant="ghost" size="icon" className="shrink-0 group-hover:bg-primary group-hover:text-white transition-colors" disabled={isSaving} onClick={(e) => { e.stopPropagation(); setSelectedFollowUp(f); setIsFinishConfirmOpen(true); }} title="Concluir Retorno"><CheckCircle2 className="h-5 w-5" /></Button>
                                    </div>
                                </Card>
                            ))
                        )}
                    </div>
                </TabsContent>

                <TabsContent value="calendar" className="mt-0">
                    <FollowUpCalendar followUps={followUps || []} onSelectDate={handleCalendarDateSelect} onSelectFollowUp={handleOpenAction} />
                </TabsContent>

                <TabsContent value="history" className="mt-0">
                    <div className="grid gap-4">
                        {filteredFollowUps.map((f) => (
                            <Card key={f.id} className="opacity-90 hover:opacity-100 border-border/50 hover:border-primary/50 transition-all cursor-pointer" onClick={() => handleOpenAction(f)}>
                                <div className="p-4">
                                    <div className="flex items-center justify-between mb-2">
                                        <h4 className="font-semibold truncate">{f.contactName || f.title || 'Retorno'}</h4>
                                        <div className="flex items-center gap-2">
                                            {getStatusBadge(f)}
                                            {(f.status === 'concluido' || f.status === 'completed') && (
                                                <Button size="sm" variant="outline" className="h-7 text-xs" onClick={(e) => { e.stopPropagation(); setSelectedFollowUp(f); setIsReopenConfirmOpen(true); }}>
                                                    <RefreshCw className="w-3 h-3 mr-1" /> Reabrir
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground mb-2">
                                        <span className="flex items-center gap-1">
                                            <CalendarIcon className="h-3 w-3" />
                                            {f.dueDate || f.date ? format(new Date((f.dueDate || f.date)!.replace(/-/g, '/')), "dd 'de' MMMM", { locale: ptBR }) : 'Data não informada'}
                                        </span>
                                        {f.dueTime && <span className="font-bold text-primary">{f.dueTime}</span>}
                                    </div>
                                    {f.contactPhone && (
                                        <div className="flex items-center gap-2 mb-3 mt-1 text-xs text-muted-foreground bg-muted/20 p-2 rounded-md border border-border/40" onClick={(e) => e.stopPropagation()}>
                                            <span className="flex items-center gap-1 font-medium"><Phone className="h-3 w-3" />{f.contactPhone}</span>
                                            <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full hover:bg-green-100 hover:text-green-600 text-muted-foreground ml-auto flex items-center justify-center pt-[1px]" onClick={(e) => { e.stopPropagation(); const p = f.contactPhone!.replace(/\D/g, ''); window.open(`https://wa.me/${p.startsWith('55') ? p : '55'+p}`, '_blank'); }} title="Abrir WhatsApp"><WhatsAppIcon className="h-[14px] w-[14px]" /></Button>
                                            <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full hover:bg-primary/20 text-muted-foreground" onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(f.contactPhone!); toast({ title: 'Telefone copiado!' }); }} title="Copiar"><Copy className="h-3 w-3" /></Button>
                                        </div>
                                    )}
                                    {f.description && (
                                        <p className="text-xs text-foreground/85 line-clamp-2 mb-1.5 font-normal">
                                            <strong className="text-muted-foreground font-semibold">Descrição:</strong> {f.description}
                                        </p>
                                    )}
                                    {f.notes && (
                                        <p className="text-xs text-muted-foreground italic line-clamp-2">
                                            <strong className="font-semibold text-muted-foreground">Histórico da Conversa:</strong> "{f.notes}"
                                        </p>
                                    )}
                                    {!f.description && !f.notes && (
                                        <p className="text-xs text-muted-foreground italic">Sem observações adicionais. Clique para detalhes.</p>
                                    )}
                                </div>
                            </Card>
                        ))}
                    </div>
                </TabsContent>
            </Tabs>
        </div>
        <div className="lg:col-span-1"><FollowUpsWidget key={followUps?.length} /></div>
      </div>

      {/* MODAL DE DETALHES E AÇÃO NO RETORNO */}
      <Dialog open={isActionDialogOpen} onOpenChange={setIsActionDialogOpen}>
        <DialogContent className="sm:max-w-xl w-[95vw] max-w-[95vw] sm:w-full flex flex-col p-6 overflow-hidden max-h-[90vh]">
          <DialogHeader className="flex-shrink-0 mb-3">
            <div className="flex flex-wrap items-center gap-2 pr-6 mb-1">
              <DialogTitle className="text-xl font-bold break-words">
                {selectedFollowUp?.contactName || (selectedFollowUp as any)?.title || 'Detalhes do Retorno'}
              </DialogTitle>
              {selectedFollowUp && getStatusBadge(selectedFollowUp)}
            </div>
            <DialogDescription>
              Consulta completa e histórico do agendamento com o cliente.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col space-y-4 w-full overflow-y-auto overflow-x-hidden flex-1 pb-4 pr-1">
            {/* Bloco Cliente Vinculado */}
            {linkedCustomer ? (
              <div className="flex items-center gap-2.5 p-3 rounded-xl bg-primary/5 border border-primary/20 text-xs">
                <User className="h-4 w-4 text-primary shrink-0" />
                <div className="min-w-0 flex-1 flex flex-wrap items-center gap-x-2 gap-y-0.5">
                  <span className="text-muted-foreground font-semibold">Cliente Vinculado:</span>
                  <Link 
                    href={`/customers/${linkedCustomer.id}`} 
                    className="font-bold text-primary hover:underline flex items-center gap-1 truncate"
                    title="Acessar cadastro do cliente"
                  >
                    {linkedCustomer.name}
                    {linkedCustomer.cpf && <span className="opacity-75 font-normal">({linkedCustomer.cpf})</span>}
                    <ExternalLink className="h-3 w-3 inline ml-0.5" />
                  </Link>
                </div>
              </div>
            ) : selectedFollowUp?.customerId ? (
              <div className="flex items-center gap-2.5 p-3 rounded-xl bg-muted/30 border border-border/40 text-xs text-muted-foreground">
                <User className="h-4 w-4 shrink-0 opacity-60" />
                <span>Cliente vinculado (ID: {selectedFollowUp.customerId})</span>
              </div>
            ) : (
              <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-muted/20 border border-border/30 text-xs text-muted-foreground">
                <User className="h-4 w-4 shrink-0 opacity-50" />
                <span>Contato avulso (sem cliente vinculado no CRM)</span>
              </div>
            )}

            {/* Metadados: Data, Horário e Telefone */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="flex items-center gap-2.5 p-3 rounded-xl bg-muted/20 border border-border/40">
                <CalendarIcon className="h-4 w-4 text-primary shrink-0" />
                <div>
                  <p className="text-[10px] uppercase font-black tracking-wider text-muted-foreground">Data Agendada</p>
                  <p className="font-semibold text-foreground mt-0.5">
                    {formattedDueDate || 'Data não informada'}
                    {selectedFollowUp?.dueTime && (
                      <span className="ml-1.5 font-bold text-primary">às {selectedFollowUp.dueTime}</span>
                    )}
                  </p>
                </div>
              </div>

              {selectedFollowUp?.contactPhone ? (
                <div className="flex items-center justify-between p-3 rounded-xl bg-muted/20 border border-border/40">
                  <div className="flex items-center gap-2 min-w-0">
                    <Phone className="h-4 w-4 text-primary shrink-0" />
                    <div className="min-w-0">
                      <p className="text-[10px] uppercase font-black tracking-wider text-muted-foreground">Telefone</p>
                      <p className="font-semibold text-foreground truncate mt-0.5">{selectedFollowUp.contactPhone}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0 ml-2">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-7 w-7 rounded-full hover:bg-green-100 hover:text-green-600 text-muted-foreground flex items-center justify-center pt-[1px]" 
                      onClick={() => { 
                        const p = selectedFollowUp.contactPhone!.replace(/\D/g, ''); 
                        window.open(`https://wa.me/${p.startsWith('55') ? p : '55'+p}`, '_blank'); 
                      }} 
                      title="Abrir WhatsApp"
                    >
                      <WhatsAppIcon className="h-3.5 w-3.5" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-7 w-7 rounded-full hover:bg-primary/20 text-muted-foreground" 
                      onClick={() => { 
                        navigator.clipboard.writeText(selectedFollowUp.contactPhone!); 
                        toast({ title: 'Telefone copiado!' }); 
                      }} 
                      title="Copiar Telefone"
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2.5 p-3 rounded-xl bg-muted/20 border border-border/40">
                  <Phone className="h-4 w-4 text-muted-foreground/40 shrink-0" />
                  <div>
                    <p className="text-[10px] uppercase font-black tracking-wider text-muted-foreground">Telefone</p>
                    <p className="text-muted-foreground italic mt-0.5">Não informado</p>
                  </div>
                </div>
              )}
            </div>

            {/* Vínculo / Origem */}
            {selectedFollowUp?.referralInfo && (
              <div className="p-3 rounded-xl bg-muted/20 border border-border/40 text-xs">
                <p className="text-[10px] uppercase font-black tracking-wider text-muted-foreground">Vínculo / Origem</p>
                <p className="font-medium text-foreground mt-0.5">{selectedFollowUp.referralInfo}</p>
              </div>
            )}

            {/* DESCRIÇÃO COMPLETA DO RETORNO */}
            <div className="space-y-1.5 w-full">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest flex items-center gap-1.5">
                  <FileText className="h-3.5 w-3.5 text-primary" /> Descrição do Retorno (Cadastro)
                </label>
                {selectedDescription && (
                  <span className="text-[10px] text-muted-foreground font-medium">
                    {selectedDescription.length} caracteres
                  </span>
                )}
              </div>
              <div className="p-4 bg-muted/40 dark:bg-muted/10 rounded-2xl border-2 border-border/50 text-sm leading-relaxed whitespace-pre-wrap break-words max-h-56 overflow-y-auto font-medium text-foreground selection:bg-primary/20">
                {selectedDescription && selectedDescription.trim().length > 0 ? (
                  selectedDescription
                ) : (
                  <span className="text-muted-foreground italic text-xs block py-1">
                    Nenhuma descrição registrada para este retorno.
                  </span>
                )}
              </div>
            </div>

            {/* Resultado do Contato (se já concluído ou se houver anotações anteriores) */}
            {selectedFollowUp?.notes && selectedFollowUp.notes !== selectedDescription && (
              <div className="space-y-1.5 w-full">
                <label className="text-[10px] font-black uppercase text-green-700 dark:text-green-400 tracking-widest flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-green-600" /> Resultado / Anotações do Contato
                </label>
                <div className="p-3.5 bg-green-500/5 rounded-2xl border border-green-500/20 text-sm leading-relaxed whitespace-pre-wrap break-words max-h-40 overflow-y-auto text-foreground">
                  {selectedFollowUp.notes}
                </div>
                {selectedFollowUp.completedAt && (
                  <p className="text-[10px] text-muted-foreground text-right">
                    Concluído em: {format(new Date(selectedFollowUp.completedAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                  </p>
                )}
              </div>
            )}

            {/* Seção de anotações e IA ao realizar contato (para retornos pendentes) */}
            {(selectedFollowUp?.status === 'pending' || selectedFollowUp?.status === 'pendente') && (
              <div className="flex flex-col space-y-2 w-full max-w-full box-border pt-2 border-t border-border/40">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest min-w-0 break-words flex-1">
                    Anotações da Conversa (Ao Realizar Retorno)
                  </label>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="h-7 px-3 rounded-full text-[10px] font-bold border-primary/20 bg-primary/5 text-primary hover:bg-primary/10 transition-all flex-shrink-0"
                    onClick={handleSummarizeAction}
                    disabled={isSummarizingAction || !actionNotes}
                  >
                    {isSummarizingAction ? <Loader2 className="h-3 w-3 animate-spin mr-1.5" /> : <Sparkles className="h-3 w-3 mr-1.5" />}
                    Resumir com IA
                  </Button>
                </div>
                <textarea 
                  className="flex w-full max-w-full box-border min-h-[90px] p-3 rounded-xl border-2 bg-muted/5 text-sm focus:ring-2 focus:ring-primary outline-none font-medium resize-y" 
                  placeholder="O que foi conversado..." 
                  value={actionNotes} 
                  onChange={(e) => setActionNotes(e.target.value)} 
                  disabled={isSaving || isSummarizingAction} 
                />
              </div>
            )}
          </div>

          <DialogFooter className="flex flex-col sm:flex-row flex-wrap items-center gap-2 justify-between w-full mt-4 flex-shrink-0">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Button 
                variant="ghost" 
                className="text-destructive hover:bg-destructive/10 w-full sm:w-auto" 
                onClick={() => setIsTrashConfirmOpen(true)} 
                disabled={isSaving}
              >
                <Trash2 className="mr-2 h-4 w-4" /> Lixeira
              </Button>
              <Button 
                variant="outline" 
                className="w-full sm:w-auto" 
                onClick={() => setIsActionDialogOpen(false)} 
                disabled={isSaving}
              >
                Fechar
              </Button>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
              <Button 
                variant="outline" 
                className="text-primary hover:bg-primary/10 border-primary/20 w-full sm:w-auto" 
                onClick={() => { setIsActionDialogOpen(false); setIsFormOpen(true); }} 
                disabled={isSaving}
              >
                <Pencil className="mr-2 h-4 w-4" /> Editar Dados
              </Button>
              <Button 
                variant="outline" 
                className="w-full sm:w-auto" 
                onClick={() => setIsRescheduleOpen(true)} 
                disabled={isSaving}
              >
                <RefreshCw className="mr-2 h-4 w-4" /> Reagendar
              </Button>
              {(selectedFollowUp?.status === 'pending' || selectedFollowUp?.status === 'pendente') && (
                <Button 
                  className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white" 
                  onClick={() => setIsFinishConfirmOpen(true)} 
                  disabled={isSaving || isSummarizingAction}
                >
                  {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle2 className="mr-2 h-4 w-4" />} Concluir
                </Button>
              )}
              {(selectedFollowUp?.status === 'completed' || selectedFollowUp?.status === 'concluido') && (
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="w-full sm:w-auto" 
                  onClick={() => { setIsActionDialogOpen(false); setIsReopenConfirmOpen(true); }}
                >
                  <RefreshCw className="w-3 h-3 mr-1" /> Reabrir Retorno
                </Button>
              )}
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* CONFIRMAÇÃO DE FINALIZAÇÃO */}
      <AlertDialog open={isFinishConfirmOpen} onOpenChange={setIsFinishConfirmOpen}>
        <AlertDialogContent>
            <AlertDialogHeader><AlertDialogTitle>Concluir Retorno?</AlertDialogTitle><AlertDialogDescription>Tem certeza que deseja finalizar e marcar este retorno como concluído?</AlertDialogDescription></AlertDialogHeader>
            <AlertDialogFooter><AlertDialogCancel disabled={isSaving}>Voltar</AlertDialogCancel><AlertDialogAction onClick={() => handleUpdateStatus('concluido')} className="bg-green-600 text-white hover:bg-green-700" disabled={isSaving}>Confirmar Conclusão</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* CONFIRMAÇÃO DE REAGENDAMENTO (Secundária) */}
      <AlertDialog open={isRescheduleConfirmOpen} onOpenChange={setIsRescheduleConfirmOpen}>
        <AlertDialogContent>
            <AlertDialogHeader><AlertDialogTitle>Confirmar Reagendamento?</AlertDialogTitle><AlertDialogDescription>Tem certeza que deseja reagendar este retorno para a nova data escolhida?</AlertDialogDescription></AlertDialogHeader>
            <AlertDialogFooter><AlertDialogCancel disabled={isSaving}>Cancelar</AlertDialogCancel><AlertDialogAction onClick={handleReschedule} disabled={isSaving}>Sim, Reagendar</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* CONFIRMAÇÃO PARA REABRIR */}
      <AlertDialog open={isReopenConfirmOpen} onOpenChange={setIsReopenConfirmOpen}>
        <AlertDialogContent>
            <AlertDialogHeader><AlertDialogTitle>Reabrir Retorno?</AlertDialogTitle><AlertDialogDescription>Tem certeza que deseja reabrir este retorno? O status voltará a ser "Pendente" e ele aparecerá no seu calendário e lista de pendências.</AlertDialogDescription></AlertDialogHeader>
            <AlertDialogFooter><AlertDialogCancel disabled={isSaving}>Cancelar</AlertDialogCancel><AlertDialogAction onClick={() => { handleUpdateStatus('pending'); setTab('pending'); }} disabled={isSaving}>Sim, Reabrir</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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
          <div className="py-4"><Input type="date" value={newDueDate} onChange={(e) => setNewDueDate(e.target.value)} disabled={isSaving} /></div><DialogFooter><Button className="w-full" onClick={() => setIsRescheduleConfirmOpen(true)} disabled={isSaving}>Confirmar Nova Data</Button></DialogFooter></DialogContent>
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
