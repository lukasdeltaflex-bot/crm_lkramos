'use client';

import React, { useState } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { cn, cleanFirestoreData } from '@/lib/utils';
import { proposalStatuses, defaultRejectionReasons, defaultHistoryTopics } from '@/lib/config-data';
import type { ProposalStatus, ProposalHistoryEntry, UserSettings } from '@/lib/types';
import { useFirestore, auth, useUser, useDoc, useMemoFirebase } from '@/firebase';
import { doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { toast } from '@/hooks/use-toast';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { useTheme } from '@/components/theme-provider';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { MessageSquareText, Loader2, Zap, Timer, ChevronDown, Sparkles } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { summarizeNotes } from '@/ai/flows/summarize-notes-flow';

interface StatusCellProps {
  proposalId: string;
  currentStatus: ProposalStatus;
  product?: string;
  onStatusChange?: (proposalId: string, payload: { status: ProposalStatus; rejectionReason?: string; quickNote?: string; product?: string }) => void;
}

export function StatusCell({ proposalId, currentStatus, product, onStatusChange }: StatusCellProps) {
  const { user } = useUser();
  const firestore = useFirestore();
  const { statusColors, containerStyle } = useTheme();
  
  const [pendingStatus, setPendingStatus] = useState<ProposalStatus | null>(null);
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [quickNote, setQuickNote] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [isSummarizing, setIsSummarizing] = useState(false);

  const settingsDocRef = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return doc(firestore, 'userSettings', user.uid);
  }, [firestore, user]);

  const { data: userSettings } = useDoc<UserSettings>(settingsDocRef);
  const finalRejectionReasons = userSettings?.rejectionReasons || defaultRejectionReasons;
  const historyTopics = userSettings?.historyTopics || defaultHistoryTopics;

  const handleUpdateInitiate = (newStatus: ProposalStatus) => {
    if (newStatus === currentStatus) return;
    
    setPendingStatus(newStatus);
    setQuickNote('');
    setRejectionReason('');
    setIsNoteModalOpen(true);
  };

  const handleSummarize = async () => {
    if (!quickNote || quickNote.trim().length < 5) {
        toast({ variant: 'destructive', title: 'Texto insuficiente', description: 'Escreva um pouco mais para a IA resumir.' });
        return;
    }
    
    setIsSummarizing(true);
    try {
        // Se for reprova, envia o motivo selecionado para dar contexto à IA
        const contextPrefix = pendingStatus === 'Reprovado' && rejectionReason 
            ? `MOTIVO DE REPROVA: ${rejectionReason}. NOTA ADICIONAL: ` 
            : "";
            
        const summary = await summarizeNotes(`${contextPrefix}${quickNote}`);
        setQuickNote(summary);
        toast({ title: 'Nota resumida com IA!' });
    } catch (e) {
        console.error("Summarize failure:", e);
        toast({ variant: 'destructive', title: 'Erro na IA', description: 'Não foi possível processar o resumo agora.' });
    } finally {
        setIsSummarizing(false);
    }
  };

  const handleUpdateConfirm = async () => {
    if (!pendingStatus || !firestore) return;

    if (pendingStatus === 'Reprovado' && !rejectionReason) {
        toast({ variant: 'destructive', title: 'Motivo Obrigatório', description: 'Selecione uma justificativa para a reprova.' });
        return;
    }

    if (onStatusChange) {
        onStatusChange(proposalId, {
            status: pendingStatus,
            rejectionReason,
            quickNote,
            product
        });
        setIsNoteModalOpen(false);
        setPendingStatus(null);
        return;
    }

    setIsUpdating(true);
    const now = new Date().toISOString();
    const currentUser = auth?.currentUser;
    const userName = currentUser?.displayName || currentUser?.email || 'Sistema';

    const dataToUpdate: any = { 
      status: pendingStatus,
      statusUpdatedAt: now
    };
    
    const isPortability = product === 'Portabilidade';

    if (pendingStatus === 'Pago') {
        dataToUpdate.dateApproved = now;
        dataToUpdate.datePaidToClient = now;
    } else if (pendingStatus === 'Saldo Pago' && isPortability) {
        dataToUpdate.debtBalanceArrivalDate = now;
    } else if (pendingStatus === 'Aguardando Saldo' && isPortability) {
        dataToUpdate.statusAwaitingBalanceAt = now;
    }

    dataToUpdate.rejectionReason = pendingStatus === 'Reprovado' ? rejectionReason : "";

    const historyMessage = pendingStatus === 'Reprovado'
        ? `⚙️ Status para "${pendingStatus}". MOTIVO: ${rejectionReason}${quickNote ? ` | NOTA: ${quickNote}` : ''}`
        : quickNote.trim() 
            ? `⚙️ Status para "${pendingStatus}". Nota: ${quickNote.trim()}`
            : `⚙️ Status alterado para "${pendingStatus}"`;

    const historyEntry: ProposalHistoryEntry = {
        id: crypto.randomUUID(),
        date: now,
        message: historyMessage,
        userName: userName
    };
    dataToUpdate.history = arrayUnion(historyEntry);

    try {
        const docRef = doc(firestore, 'loanProposals', proposalId);
        await updateDoc(docRef, cleanFirestoreData(dataToUpdate));
        toast({ title: 'Status Atualizado!' });
        setIsNoteModalOpen(false);
    } catch (error: any) {
        if (error.code === 'permission-denied') {
            errorEmitter.emit('permission-error', new FirestorePermissionError({
                path: `loanProposals/${proposalId}`,
                operation: 'update',
                requestResourceData: dataToUpdate
            }));
        }
    } finally {
        setIsUpdating(false);
        setPendingStatus(null);
    }
  };

  const statusKey = currentStatus.toUpperCase();
  const colorValue = statusColors[statusKey] || statusColors[currentStatus];

  return (
    <>
    <Select
      value={currentStatus}
      onValueChange={(newStatus: ProposalStatus) => handleUpdateInitiate(newStatus)}
    >
      <SelectTrigger className="p-0 border-0 focus:ring-0 focus:ring-offset-0 shadow-none bg-transparent h-auto w-full group">
        <SelectValue asChild>
            <Badge 
                variant="outline" 
                className={cn(
                    "w-full justify-center text-[10px] font-bold uppercase tracking-tighter py-1.5 px-4 border-2 transition-all status-custom rounded-full",
                    containerStyle === 'glow' && "shadow-[0_0_10px_hsla(var(--status-color),0.3)]"
                )}
                style={colorValue ? { 
                    '--status-color': colorValue 
                } as any : {}}
            >
                {currentStatus}
            </Badge>
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {proposalStatuses.map((status) => (
          <SelectItem key={status} value={status} className="text-[10px] font-bold uppercase">
            {status}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>

    <Dialog open={isNoteModalOpen} onOpenChange={setIsNoteModalOpen}>
        <DialogContent className="max-w-md p-0 overflow-hidden rounded-[2rem]">
            <DialogHeader className="p-6 pb-2">
                <DialogTitle className="flex items-center gap-2 text-lg font-bold uppercase tracking-tight text-primary">
                    <MessageSquareText className="h-5 w-5" /> 
                    {pendingStatus === 'Reprovado' ? 'Justificativa de Reprova' : 'Nota de Trâmite'}
                </DialogTitle>
            </DialogHeader>
            <ScrollArea className="max-h-[70vh]">
                <div className="p-6 space-y-6">
                    <div className="p-3 bg-muted/30 rounded-xl border border-dashed text-[10px] font-bold uppercase text-muted-foreground text-center">
                        Alterando para: <span className={cn("font-bold", pendingStatus === 'Reprovado' ? "text-red-600" : "text-primary")}>{pendingStatus}</span>
                    </div>

                    {pendingStatus === 'Reprovado' && (
                        <div className="space-y-2">
                            <Label className="text-[9px] font-bold uppercase tracking-widest text-red-600">Motivo da Reprova *</Label>
                            <Select value={rejectionReason} onValueChange={setRejectionReason}>
                                <SelectTrigger className="border-red-200 bg-red-50/50 font-bold h-11 rounded-xl">
                                    <SelectValue placeholder="Selecione o motivo..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {finalRejectionReasons.map(r => (
                                        <SelectItem key={r} value={r} className="text-xs font-medium">{r}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}

                    <div className="space-y-4">
                        <div className="flex items-center gap-2">
                            <Zap className="h-3.5 w-3.5 text-primary" />
                            <Label className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Tópicos Rápidos (Sub-status)</Label>
                        </div>
                        <Select value={quickNote} onValueChange={setQuickNote}>
                            <SelectTrigger className="rounded-xl border-2 bg-background font-bold text-xs">
                                <SelectValue placeholder="Selecione um trâmite..." />
                            </SelectTrigger>
                            <SelectContent>
                                {historyTopics.map((topic) => (
                                    <SelectItem key={topic} value={topic} className="text-xs font-medium">{topic}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <Label className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Comentário Adicional</Label>
                            <Button 
                                type="button" 
                                variant="outline" 
                                size="sm" 
                                className="h-7 rounded-full text-[10px] font-bold px-3 border-primary/20 bg-primary/5 text-primary hover:bg-primary/10"
                                onClick={handleSummarize}
                                disabled={isSummarizing || !quickNote}
                            >
                                {isSummarizing ? <Loader2 className="h-3 w-3 animate-spin mr-1.5" /> : <Sparkles className="h-3 w-3 mr-1.5" />}
                                Resumir com IA
                            </Button>
                        </div>
                        <Textarea 
                            placeholder={pendingStatus === 'Reprovado' ? "Detalhes da negativa..." : "Algo importante a registrar?"}
                            value={quickNote}
                            onChange={(e) => setQuickNote(e.target.value)}
                            className="min-h-[100px] rounded-2xl text-xs font-medium resize-none border-2"
                        />
                    </div>
                </div>
            </ScrollArea>
            <DialogFooter className="p-6 bg-muted/5 border-t">
                <div className="flex flex-col sm:flex-row gap-2 w-full">
                    <Button variant="ghost" onClick={() => setIsNoteModalOpen(false)} className="rounded-full font-bold text-[10px] uppercase flex-1 h-11">Cancelar</Button>
                    <Button 
                        onClick={handleUpdateConfirm} 
                        disabled={isUpdating || (pendingStatus === 'Reprovado' && !rejectionReason) || isSummarizing}
                        className={cn(
                            "flex-[2] rounded-full font-bold uppercase text-[10px] tracking-widest h-11 shadow-lg transition-all",
                            pendingStatus === 'Reprovado' ? "bg-red-600 hover:bg-red-700 text-white" : "bg-primary text-white"
                        )}
                    >
                        {isUpdating ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirmar Mudança"}
                    </Button>
                </div>
            </DialogFooter>
        </DialogContent>
    </Dialog>
    </>
  );
}
