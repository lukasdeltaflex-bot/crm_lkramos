'use client';

import React, { useState } from 'react';
import { AppLayout } from '@/components/app-layout';
import { PageHeader } from '@/components/page-header';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, doc, updateDoc, deleteDoc, query, where } from 'firebase/firestore';
import type { Customer, Proposal, FollowUp } from '@/lib/types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RotateCcw, Trash2, Users, FileText, CalendarClock, AlertTriangle, Loader2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { format, parseISO } from 'date-fns';
import { cn, formatCurrency } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
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

export default function TrashPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const [isProcessing, setIsProcessing] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{ collection: string, id: string, type: 'customer' | 'proposal' | 'followup', path?: string } | null>(null);

  // Consultas de itens excluídos
  const customersQuery = useMemoFirebase(() => user && firestore ? query(collection(firestore, 'customers'), where('ownerId', '==', user.uid), where('deleted', '==', true)) : null, [user, firestore]);
  const proposalsQuery = useMemoFirebase(() => user && firestore ? query(collection(firestore, 'loanProposals'), where('ownerId', '==', user.uid), where('deleted', '==', true)) : null, [user, firestore]);
  const followUpsQuery = useMemoFirebase(() => user && firestore ? query(collection(firestore, 'users', user.uid, 'followUps'), where('deleted', '==', true)) : null, [user, firestore]);

  const { data: deletedCustomers, isLoading: loadingCustomers } = useCollection<Customer>(customersQuery);
  const { data: deletedProposals, isLoading: loadingProposals } = useCollection<Proposal>(proposalsQuery);
  const { data: deletedFollowUps, isLoading: loadingFollowUps } = useCollection<FollowUp>(followUpsQuery);

  const handleRestore = async (type: 'customer' | 'proposal' | 'followup', id: string, path?: string) => {
    if (!firestore || !user) return;
    setIsProcessing(true);
    
    const docRef = path ? doc(firestore, path) : doc(firestore, type === 'customer' ? 'customers' : 'loanProposals', id);
    
    try {
        await updateDoc(docRef, { 
            deleted: false,
            deletedAt: null,
            deletedBy: null
        });
        toast({ title: 'Registro Restaurado!', description: 'O item voltou para sua tela de origem.' });
    } catch (e) {
        toast({ variant: 'destructive', title: 'Erro ao restaurar' });
    } finally {
        setIsProcessing(false);
    }
  };

  const handlePermanentDelete = async () => {
    if (!firestore || !itemToDelete) return;
    setIsProcessing(true);
    
    const path = itemToDelete.path || (itemToDelete.type === 'customer' ? 'customers' : 'loanProposals');
    const docRef = doc(firestore, path, itemToDelete.id);
    
    try {
        await deleteDoc(docRef);
        toast({ title: 'Excluído Permanente', description: 'O registro foi removido definitivamente do banco de dados.' });
        setDeleteConfirmOpen(false);
        setItemToDelete(null);
    } catch (e) {
        toast({ variant: 'destructive', title: 'Erro na exclusão definitiva' });
    } finally {
        setIsProcessing(false);
    }
  };

  const EmptyTrash = ({ title }: { title: string }) => (
    <div className="py-20 text-center border-2 border-dashed rounded-[2rem] bg-muted/5 opacity-40 w-full">
        <Trash2 className="h-12 w-12 mx-auto mb-4" />
        <p className="font-black uppercase tracking-widest text-xs">Nenhum {title} na lixeira.</p>
    </div>
  );

  return (
    <AppLayout>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
        <div>
            <PageHeader title="Lixeira do Sistema" />
            <p className="text-sm text-muted-foreground -mt-6">Itens excluídos permanecem aqui por segurança e podem ser restaurados.</p>
        </div>
        <div className="bg-orange-500/10 p-3 rounded-xl border border-orange-500/20 flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-orange-600" />
            <span className="text-[10px] font-black uppercase text-orange-700 tracking-widest leading-none">Atenção: Exclusão definitiva não pode ser desfeita.</span>
        </div>
      </div>

      <Tabs defaultValue="customers" className="space-y-8">
        <TabsList className="bg-muted/30 p-1.5 h-14 rounded-full border border-border/50 flex w-fit gap-2">
            <TabsTrigger value="customers" className="rounded-full px-8 gap-2 data-[state=active]:bg-primary data-[state=active]:text-white font-black uppercase text-[10px] tracking-widest"><Users className="h-4 w-4" /> Clientes</TabsTrigger>
            <TabsTrigger value="proposals" className="rounded-full px-8 gap-2 data-[state=active]:bg-primary data-[state=active]:text-white font-black uppercase text-[10px] tracking-widest"><FileText className="h-4 w-4" /> Propostas</TabsTrigger>
            <TabsTrigger value="followups" className="rounded-full px-8 gap-2 data-[state=active]:bg-primary data-[state=active]:text-white font-black uppercase text-[10px] tracking-widest"><CalendarClock className="h-4 w-4" /> Retornos</TabsTrigger>
        </TabsList>

        <TabsContent value="customers" className="animate-in fade-in duration-500">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {loadingCustomers ? (
                    Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-48 w-full rounded-2xl" />)
                ) : !deletedCustomers || deletedCustomers.length === 0 ? (
                    <EmptyTrash title="cliente" />
                ) : (
                    deletedCustomers.map((c) => (
                        <Card key={c.id} className="border-2 hover:border-primary/20 transition-all overflow-hidden group">
                            <CardHeader className="p-5 bg-muted/10 border-b">
                                <CardTitle className="text-sm font-black uppercase truncate">{c.name}</CardTitle>
                                <CardDescription className="text-[10px] font-bold">CPF: {c.cpf}</CardDescription>
                            </CardHeader>
                            <CardContent className="p-5 space-y-4">
                                <div className="text-[10px] font-medium text-muted-foreground uppercase">
                                    <p>Excluído em: {c.deletedAt ? format(parseISO(c.deletedAt), 'dd/MM/yyyy HH:mm') : '---'}</p>
                                </div>
                                <div className="flex gap-2 pt-2">
                                    <Button variant="outline" size="sm" className="flex-1 rounded-full font-bold h-9 text-[10px] uppercase gap-2" onClick={() => handleRestore('customer', c.id)} disabled={isProcessing}>
                                        <RotateCcw className="h-3.5 w-3.5" /> Restaurar
                                    </Button>
                                    <Button variant="destructive" size="sm" className="h-9 w-10 rounded-full px-0" onClick={() => { setItemToDelete({ collection: 'customers', id: c.id, type: 'customer' }); setDeleteConfirmOpen(true); }} disabled={isProcessing}>
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>
        </TabsContent>

        <TabsContent value="proposals" className="animate-in fade-in duration-500">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {loadingProposals ? (
                    Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-48 w-full rounded-2xl" />)
                ) : !deletedProposals || deletedProposals.length === 0 ? (
                    <EmptyTrash title="proposta" />
                ) : (
                    deletedProposals.map((p) => (
                        <Card key={p.id} className="border-2 hover:border-primary/20 transition-all overflow-hidden">
                            <CardHeader className="p-5 bg-muted/10 border-b">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <CardTitle className="text-sm font-black uppercase truncate">Prop. {p.proposalNumber}</CardTitle>
                                        <CardDescription className="text-[10px] font-bold uppercase">{p.product} • {p.bank}</CardDescription>
                                    </div>
                                    <Badge className="bg-primary text-[8px]">{formatCurrency(p.grossAmount)}</Badge>
                                </div>
                            </CardHeader>
                            <CardContent className="p-5 space-y-4">
                                <div className="text-[10px] font-medium text-muted-foreground uppercase">
                                    <p>Excluído em: {p.deletedAt ? format(parseISO(p.deletedAt), 'dd/MM/yyyy HH:mm') : '---'}</p>
                                </div>
                                <div className="flex gap-2 pt-2">
                                    <Button variant="outline" size="sm" className="flex-1 rounded-full font-bold h-9 text-[10px] uppercase gap-2" onClick={() => handleRestore('proposal', p.id)} disabled={isProcessing}>
                                        <RotateCcw className="h-3.5 w-3.5" /> Restaurar
                                    </Button>
                                    <Button variant="destructive" size="sm" className="h-9 w-10 rounded-full px-0" onClick={() => { setItemToDelete({ collection: 'loanProposals', id: p.id, type: 'proposal' }); setDeleteConfirmOpen(true); }} disabled={isProcessing}>
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>
        </TabsContent>

        <TabsContent value="followups" className="animate-in fade-in duration-500">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {loadingFollowUps ? (
                    Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-48 w-full rounded-2xl" />)
                ) : !deletedFollowUps || deletedFollowUps.length === 0 ? (
                    <EmptyTrash title="retorno" />
                ) : (
                    deletedFollowUps.map((f) => (
                        <Card key={f.id} className="border-2 hover:border-primary/20 transition-all overflow-hidden">
                            <CardHeader className="p-5 bg-muted/10 border-b">
                                <CardTitle className="text-sm font-black uppercase truncate">{f.contactName}</CardTitle>
                                <CardDescription className="text-[10px] font-bold">Vencimento: {f.dueDate}</CardDescription>
                            </CardHeader>
                            <CardContent className="p-5 space-y-4">
                                <p className="text-xs text-muted-foreground italic line-clamp-2">"{f.description}"</p>
                                <div className="text-[10px] font-medium text-muted-foreground uppercase pt-2">
                                    <p>Excluído em: {f.deletedAt ? format(parseISO(f.deletedAt), 'dd/MM/yyyy HH:mm') : '---'}</p>
                                </div>
                                <div className="flex gap-2 pt-2">
                                    <Button variant="outline" size="sm" className="flex-1 rounded-full font-bold h-9 text-[10px] uppercase gap-2" onClick={() => handleRestore('followup', f.id, `users/${user.uid}/followUps/${f.id}`)} disabled={isProcessing}>
                                        <RotateCcw className="h-3.5 w-3.5" /> Restaurar
                                    </Button>
                                    <Button variant="destructive" size="sm" className="h-9 w-10 rounded-full px-0" onClick={() => { setItemToDelete({ collection: 'followUps', id: f.id, type: 'followup', path: `users/${user.uid}/followUps/${f.id}` }); setDeleteConfirmOpen(true); }} disabled={isProcessing}>
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>
        </TabsContent>
      </Tabs>

      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent className="rounded-[2rem]">
            <AlertDialogHeader>
                <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center text-red-600 mb-2">
                    <AlertTriangle className="h-6 w-6" />
                </div>
                <AlertDialogTitle className="font-black uppercase text-lg">Excluir Permanentemente?</AlertDialogTitle>
                <AlertDialogDescription className="font-medium text-sm">
                    Esta ação é irreversível. O registro e todos os seus vínculos serão apagados definitivamente do servidor do Google Cloud.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="pt-4">
                <AlertDialogCancel disabled={isProcessing} className="rounded-full font-bold">Voltar</AlertDialogCancel>
                <AlertDialogAction onClick={handlePermanentDelete} className="bg-destructive text-white hover:bg-red-700 rounded-full font-black uppercase text-xs px-8" disabled={isProcessing}>
                    {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : "Sim, Excluir para Sempre"}
                </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
}
