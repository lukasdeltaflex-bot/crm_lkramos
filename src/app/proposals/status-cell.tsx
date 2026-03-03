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
import { proposalStatuses, defaultRejectionReasons } from '@/lib/config-data';
import type { ProposalStatus, ProposalHistoryEntry } from '@/lib/types';
import { useFirestore, auth } from '@/firebase';
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
import { MessageSquareText, Loader2, AlertTriangle } from 'lucide-react';

interface StatusCellProps {
  proposalId: string;
  currentStatus: ProposalStatus;
  product?: string;
  onStatusChange?: (proposalId: string, newStatus: ProposalStatus, product?: string) => void;
}

export function StatusCell({ proposalId, currentStatus, product, onStatusChange }: StatusCellProps) {
  const firestore = useFirestore();
  const { statusColors, containerStyle } = useTheme();
  
  const [pendingStatus, setPendingStatus] = useState<ProposalStatus | null>(null);
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [quickNote, setQuickNote] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  const handleUpdateInitiate = (newStatus: ProposalStatus) => {
    if (newStatus === currentStatus) return;
    
    // Se tiver função de callback externa (ex: PropostasPage), delegamos a abertura do modal de reprova para lá se necessário
    // Mas para manter o StatusCell resiliente em qualquer widget, ele agora lida com o motivo se for Reprovado
    setPendingStatus(newStatus);
    setQuickNote('');
    setRejectionReason('');
    setIsNoteModalOpen(true);
  };

  const handleUpdateConfirm = async () => {
    if (!pendingStatus || !firestore) return;

    // Validação obrigatória de motivo para reprova
    if (pendingStatus === 'Reprovado' && !rejectionReason) {
        toast({ variant: 'destructive', title: 'Motivo Obrigatório', description: 'Selecione uma justificativa para a reprova.' });
        return;
    }

    setIsUpdating(true);
    const now = new Date().toISOString();
    const user = auth?.currentUser;
    const userName = user?.displayName || user?.email || 'Sistema';

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
    }

    // Registro na Linha do Tempo
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
        // Se houver callback, avisamos que mudou
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
        <DialogContent className="max-w-sm p-6 rounded-[2rem]">
            <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-base font-black uppercase tracking-tight">
                    <MessageSquareText className="h-4 w-4 text-primary" /> 
                    {pendingStatus === 'Reprovado' ? 'Justificativa de Reprova' : 'Nota de Trâmite'}
                </DialogTitle>
            </DialogHeader>
            <div className="py-4 space-y-5">
                <div className="p-3 bg-muted/30 rounded-xl border border-dashed text-[10px] font-bold uppercase text-muted-foreground text-center">
                    Alterando para: <span className={cn("font-black", pendingStatus === 'Reprovado' ? "text-red-600" : "text-primary")}>{pendingStatus}</span>
                </div>

                {pendingStatus === 'Reprovado' && (
                    <div className="space-y-2 animate-in slide-in-from-top-2">
                        <Label className="text-[9px] font-black uppercase tracking-widest text-red-600 flex items-center gap-1.5">
                            <AlertTriangle className="h-3 w-3" /> Motivo da Reprova *
                        </Label>
                        <Select value={rejectionReason} onValueChange={setRejectionReason}>
                            <SelectTrigger className="border-red-200 bg-red-50/50 font-bold h-11 rounded-xl">
                                <SelectValue placeholder="Selecione por que foi reprovado" />
                            </SelectTrigger>
                            <SelectContent>
                                {defaultRejectionReasons.map(r => (
                                    <SelectItem key={r} value={r} className="text-xs font-medium">{r}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                )}

                <div className="space-y-2">
                    <Label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Comentário Adicional (Opcional)</Label>
                    <Textarea 
                        placeholder={pendingStatus === 'Reprovado' ? "Detalhes da negativa do banco..." : "Algo importante a registrar?"}
                        value={quickNote}
                        onChange={(e) => setQuickNote(e.target.value)}
                        className="min-h-[80px] rounded-2xl text-xs font-medium resize-none"
                    />
                </div>
            </div>
            <DialogFooter className="flex flex-col gap-2">
                <Button 
                    onClick={handleUpdateConfirm} 
                    disabled={isUpdating || (pendingStatus === 'Reprovado' && !rejectionReason)}
                    className={cn(
                        "w-full rounded-full font-black uppercase text-[10px] tracking-widest h-11 shadow-lg transition-all",
                        pendingStatus === 'Reprovado' ? "bg-red-600 hover:bg-red-700 text-white" : "bg-primary text-white"
                    )}
                >
                    {isUpdating ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirmar Mudança"}
                </Button>
                <Button variant="ghost" onClick={() => setIsNoteModalOpen(false)} className="rounded-full font-bold text-[10px] uppercase">Cancelar</Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>
    </>
  );
}
