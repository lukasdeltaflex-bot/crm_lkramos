'use client';

import React from 'react';
import { Loader2, Cloud, Check, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { DraftSaveStatus } from '@/lib/proposal-draft-service';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface DraftStatusIndicatorProps {
  status: DraftSaveStatus;
  lastSavedAt?: string | null;
  className?: string;
}

export function DraftStatusIndicator({ status, lastSavedAt, className }: DraftStatusIndicatorProps) {
  if (status === 'idle' && !lastSavedAt) {
    return null;
  }

  const formattedTime = lastSavedAt
    ? (() => {
        try {
          return format(new Date(lastSavedAt), "HH:mm", { locale: ptBR });
        } catch {
          return null;
        }
      })()
    : null;

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold transition-all select-none border",
        status === 'saving' && "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-300/40",
        status === 'saved' && "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-300/40",
        status === 'error' && "bg-destructive/10 text-destructive border-destructive/30",
        status === 'restoring' && "bg-primary/10 text-primary border-primary/30",
        status === 'idle' && lastSavedAt && "bg-muted/40 text-muted-foreground border-border/50",
        className
      )}
      title={lastSavedAt ? `Última sincronização do rascunho: ${new Date(lastSavedAt).toLocaleString('pt-BR')}` : undefined}
    >
      {status === 'saving' && (
        <>
          <Loader2 className="h-3 w-3 animate-spin text-amber-600 dark:text-amber-400" />
          <span>Salvando rascunho...</span>
        </>
      )}

      {status === 'restoring' && (
        <>
          <Loader2 className="h-3 w-3 animate-spin text-primary" />
          <span>Recuperando cadastro...</span>
        </>
      )}

      {status === 'saved' && (
        <>
          <Check className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
          <span>
            {formattedTime ? `Rascunho salvo automaticamente às ${formattedTime}` : 'Rascunho salvo'}
          </span>
        </>
      )}

      {status === 'error' && (
        <>
          <AlertCircle className="h-3 w-3 text-destructive" />
          <span>Falha ao salvar rascunho</span>
        </>
      )}

      {status === 'idle' && lastSavedAt && (
        <>
          <Cloud className="h-3 w-3 opacity-60" />
          <span>{formattedTime ? `Salvo às ${formattedTime}` : 'Rascunho preservado'}</span>
        </>
      )}
    </div>
  );
}
