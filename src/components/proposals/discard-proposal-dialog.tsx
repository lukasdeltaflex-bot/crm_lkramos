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
import { AlertTriangle, ArrowLeft, Trash2 } from 'lucide-react';

interface DiscardProposalDialogProps {
  open: boolean;
  onContinue: () => void;
  onDiscard: () => void;
}

export function DiscardProposalDialog({
  open,
  onContinue,
  onDiscard,
}: DiscardProposalDialogProps) {
  return (
    <AlertDialog open={open}>
      <AlertDialogContent
        onPointerDownOutside={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
        className="max-w-md w-[95vw] rounded-[2rem] border-2 border-amber-500/20 p-6 shadow-2xl animate-in zoom-in-95 duration-200"
      >
        <AlertDialogHeader className="space-y-3">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
            <AlertTriangle className="h-7 w-7" />
          </div>
          <AlertDialogTitle className="text-center text-lg font-black uppercase text-foreground">
            Você tem um cadastro em andamento!
          </AlertDialogTitle>
          <AlertDialogDescription className="text-center text-xs font-medium leading-relaxed text-muted-foreground">
            Existem informações preenchidas que ainda não foram salvas. Se você sair agora, poderá perder todo o trabalho realizado. Deseja realmente descartar este cadastro?
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter className="flex flex-col sm:flex-row gap-2 mt-4 sm:justify-center">
          <Button
            type="button"
            variant="outline"
            onClick={onContinue}
            className="w-full sm:w-auto font-bold uppercase text-xs rounded-xl h-11 px-5 border-2 hover:bg-muted/50"
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> CONTINUAR CADASTRANDO
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={onDiscard}
            className="w-full sm:w-auto font-bold uppercase text-xs rounded-xl h-11 px-5 shadow-lg shadow-destructive/20"
          >
            <Trash2 className="mr-2 h-4 w-4" /> DESCARTAR CADASTRO
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
