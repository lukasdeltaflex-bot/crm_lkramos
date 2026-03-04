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
import { MessageSquareText, Loader2, Zap, Timer } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface StatusCellProps {
  proposalId: string;
  currentStatus: ProposalStatus;
  product?: string;
  onStatusChange?: (proposalId: string, newStatus: ProposalStatus, product?: string) => void;
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

  const handleUpdateConfirm = async () => {
    if (!pendingStatus || !firestore) return;

    if (pendingStatus === 'Reprovado' && !rejectionReason) {
        toast({ variant: 'destructive', title: 'Motivo Obrigatório', description: 'Selecione uma justificativa para a reprova.' });
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
    } 
    else if (pendingStatus === 'Saldo Pago' && isPortability) {
        dataToUpdate.debtBalanceArrivalDate = now;
    }
    else if (pendingStatus === 'Aguardando Saldo' && isPortability) {
        dataToUpdate.statusAwaitingBalanceAt = now;
    }

    if (pendingStatus === 'Reprovado') {
        dataToUpdate.rejectionReason = rejectionReason;
    } else {
        dataToUpdate.rejectionReason = "";
    }

    const historyMessage = pendingStatus === 'Reprovado'
        ? `⚙️ Status para "${pendingStatus}". MOTIVO: ${rejectionReason}${quickNote ? ` | NOTA: ${quickNote}` : ''}`
        : quickNote.trim() 
            ? `⚙️ Status para "${pendingStatus}". Nota: ${quickNote.trim()}`
            : `⚙️ Status alterado rapidamente para "${pendingStatus}"`;

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
        
        toast({
            title: 'Status Atualizado!',
            description: `Alterado para "${pendingStatus}".`,
        });
        setIsNoteModalOpen(false);
        if (onStatusChange) {
            onStatusChange(proposalId, pendingStatus, product);
        }
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
                    "w-full justify-center text-[10px] font-black uppercase tracking-tighter py-1.5 px-4 border-2 transition-all status-custom rounded-full",
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
          <SelectItem key={status} value={status} className="text-[10px] font-black uppercase">
            {status}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>

    <Dialog open={isNoteModalOpen} onOpenChange={setIsNoteModalOpen}>
        <DialogContent className="max-w-md p-0 overflow-hidden rounded-[2rem]">
            <DialogHeader className="p-6 pb-2">
                <DialogTitle className="flex items-center gap-2 text-lg font-black uppercase tracking-tight">
                    <MessageSquareText className="h-5 w-5 text-primary" /> 
                    {pendingStatus === 'Reprovado' ? 'Justificativa de Reprova' : 'Nota de Trâmite'}
                </DialogTitle>
            </DialogHeader>
            <ScrollArea className="max-h-[70vh]">
                <div className="p-6 space-y-6">
                    <div className="p-3 bg-muted/30 rounded-xl border border-dashed text-[10px] font-bold uppercase text-muted-foreground text-center">
                        Alterando para: <span className={cn("font-black", pendingStatus === 'Reprovado' ? "text-red-600" : "text-primary")}>{pendingStatus}</span>
                    </div>

                    {pendingStatus === 'Reprovado' && (
                        <div className="space-y-2 animate-in slide-in-from-top-2">
                            <Label className="text-[9px] font-black uppercase tracking-widest text-red-600">Motivo da Reprova *</Label>
                            <Select value={rejectionReason} onValueChange={setRejectionReason}>
                                <SelectTrigger className="border-red-200 bg-red-50/50 font-bold h-11 rounded-xl">
                                    <SelectValue placeholder="Selecione por que foi reprovado" />
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
                            <Label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Tópicos Rápidos (Sub-status)</Label>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {historyTopics.map((topic) => (
                                <Button
                                    key={topic}
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="h-8 rounded-full text-[9px] font-bold px-3 border-primary/20 hover:bg-primary/5 hover:border-primary transition-all"
                                    onClick={() => setQuickNote(topic)}
                                >
                                    {topic}
                                </Button>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Comentário Adicional</Label>
                        <Textarea 
                            placeholder={pendingStatus === 'Reprovado' ? "Detalhes da negativa do banco..." : "Algo importante a registrar?"}
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
                        disabled={isUpdating || (pendingStatus === 'Reprovado' && !rejectionReason)}
                        className={cn(
                            "flex-[2] rounded-full font-black uppercase text-[10px] tracking-widest h-11 shadow-lg transition-all",
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