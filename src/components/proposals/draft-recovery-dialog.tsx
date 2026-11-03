'use client';

import React from 'react';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { FileText, Layers, AlertCircle, Clock, User, ArrowRight, Trash2 } from 'lucide-react';
import type { ProposalDraft } from '@/lib/proposal-draft-service';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface DraftRecoveryDialogProps {
  open: boolean;
  draft: ProposalDraft | null;
  onRecover: () => void;
  onDiscard: () => void;
}

export function DraftRecoveryDialog({
  open,
  draft,
  onRecover,
  onDiscard,
}: DraftRecoveryDialogProps) {
  if (!draft) return null;

  const formattedDate = draft.updatedAt
    ? (() => {
        try {
          return format(new Date(draft.updatedAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
        } catch {
          return draft.updatedAt;
        }
      })()
    : null;

  const isGrouped = draft.mode === 'grouped';
  const isJunction = draft.groupedData?.operationMode === 'junction';

  return (
    <AlertDialog open={open}>
      <AlertDialogContent
        onPointerDownOutside={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
        className="max-w-md w-[95vw] rounded-[2rem] border-2 border-primary/20 p-6 shadow-2xl animate-in zoom-in-95 duration-200"
      >
        <AlertDialogHeader className="space-y-3">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            {isGrouped ? <Layers className="h-7 w-7 text-primary" /> : <FileText className="h-7 w-7 text-primary" />}
          </div>
          <AlertDialogTitle className="text-center text-lg font-black uppercase text-foreground">
            Encontramos um cadastro não finalizado
          </AlertDialogTitle>
          <AlertDialogDescription className="text-center text-xs font-medium leading-relaxed text-muted-foreground">
            Deseja continuar de onde parou? Seus dados preenchidos foram preservados com segurança.
          </AlertDialogDescription>
        </AlertDialogHeader>

        {/* Card Resumo do Rascunho */}
        <div className="p-3.5 my-2 rounded-2xl bg-muted/40 border border-border/50 space-y-2 text-xs">
          <div className="flex items-center justify-between font-bold text-foreground">
            <span className="flex items-center gap-1.5 text-primary">
              {isGrouped ? <Layers className="h-3.5 w-3.5" /> : <FileText className="h-3.5 w-3.5" />}
              {draft.summary?.operationTypeLabel || (isJunction ? 'Junção de Parcelas' : isGrouped ? 'Portabilidade + Refin' : 'Proposta')}
            </span>
            {isGrouped && draft.summary?.contractsCount && (
              <span className="bg-primary/10 text-primary font-black px-2 py-0.5 rounded-full text-[10px]">
                {draft.summary.contractsCount} Contrato(s)
              </span>
            )}
          </div>

          {draft.summary?.customerName && (
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <User className="h-3.5 w-3.5 shrink-0 opacity-70" />
              <span className="truncate font-semibold text-foreground">
                Cliente: {draft.summary.customerName}
              </span>
            </div>
          )}

          {formattedDate && (
            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <Clock className="h-3 w-3 shrink-0 opacity-70" />
              <span>Salvo automaticamente em: {formattedDate}</span>
            </div>
          )}
        </div>

        <AlertDialogFooter className="flex flex-col sm:flex-row gap-2 mt-4 sm:justify-end">
          <Button
            type="button"
            variant="ghost"
            onClick={onDiscard}
            className="w-full sm:w-auto font-bold uppercase text-xs rounded-xl h-11 px-4 text-destructive hover:bg-destructive/10"
          >
            <Trash2 className="mr-2 h-4 w-4" /> Descartar Rascunho
          </Button>
          <Button
            type="button"
            onClick={onRecover}
            className="w-full sm:w-auto font-black uppercase text-xs rounded-xl h-11 px-6 bg-primary hover:bg-primary/90 text-white shadow-lg"
          >
            Recuperar Cadastro <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
