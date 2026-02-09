
'use client';

import * as React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Download, ExternalLink, FileText, Loader2, X } from 'lucide-react';
import type { Attachment } from '@/lib/types';

interface DocumentPreviewDialogProps {
  attachment: Attachment | null;
  onClose: () => void;
}

export function DocumentPreviewDialog({ attachment, onClose }: DocumentPreviewDialogProps) {
  const [isLoading, setIsLoading] = React.useState(true);

  if (!attachment) return null;

  const isImage = attachment.type.startsWith('image/');
  const isPdf = attachment.type === 'application/pdf';

  return (
    <Dialog open={!!attachment} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-5xl h-[90vh] flex flex-col p-0 overflow-hidden bg-zinc-950 border-zinc-800">
        <DialogHeader className="p-4 border-b border-zinc-800 bg-zinc-900 flex flex-row items-center justify-between space-y-0">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="p-2 bg-zinc-800 rounded">
                <FileText className="h-4 w-4 text-zinc-400" />
            </div>
            <div className="flex flex-col overflow-hidden">
                <DialogTitle className="text-sm font-bold text-zinc-100 truncate">
                    {attachment.name}
                </DialogTitle>
                <p className="text-[10px] text-zinc-500 uppercase font-black tracking-widest">
                    {attachment.type}
                </p>
            </div>
          </div>
          <div className="flex items-center gap-2 pr-8">
            <Button variant="ghost" size="sm" className="h-8 text-zinc-400 hover:text-white hover:bg-zinc-800" asChild>
                <a href={attachment.url} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Abrir em nova aba
                </a>
            </Button>
            <Button variant="outline" size="sm" className="h-8 border-zinc-700 bg-zinc-800 text-zinc-100 hover:bg-zinc-700" asChild>
                <a href={attachment.url} download={attachment.name}>
                    <Download className="h-4 w-4 mr-2" />
                    Baixar
                </a>
            </Button>
          </div>
        </DialogHeader>
        
        <div className="flex-1 relative bg-zinc-900/50 flex items-center justify-center overflow-auto">
            {isLoading && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 z-10 bg-zinc-950">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="text-xs text-zinc-500 animate-pulse font-bold uppercase">Carregando visualização segura...</p>
                </div>
            )}

            {isImage ? (
                <img 
                    src={attachment.url} 
                    alt={attachment.name} 
                    className="max-w-full max-h-full object-contain shadow-2xl"
                    onLoad={() => setIsLoading(false)}
                />
            ) : isPdf ? (
                <iframe 
                    src={`${attachment.url}#toolbar=0`} 
                    className="w-full h-full border-none"
                    onLoad={() => setIsLoading(false)}
                />
            ) : (
                <div className="text-center p-10 space-y-4">
                    <div className="h-20 w-20 bg-zinc-800 rounded-full flex items-center justify-center mx-auto">
                        <FileText className="h-10 w-10 text-zinc-500" />
                    </div>
                    <p className="text-zinc-400 text-sm">Visualização não disponível para este tipo de arquivo.</p>
                    <Button variant="secondary" asChild>
                        <a href={attachment.url} download={attachment.name}>Baixar Arquivo</a>
                    </Button>
                </div>
            )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
