'use client';

import React, { useState, useEffect } from 'react';
import { useFirebase } from '@/firebase';
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent } from '@/components/ui/card';
import { UploadCloud, File, Trash2, Download, Loader2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import type { Attachment } from '@/lib/types';
import { cn } from '@/lib/utils';

interface CustomerAttachmentUploaderProps {
  userId: string;
  customerId: string;
  initialAttachments: Attachment[];
  onAttachmentsChange: (attachments: Attachment[]) => void;
  isReadOnly?: boolean;
}

export function CustomerAttachmentUploader({
  userId,
  customerId,
  initialAttachments,
  onAttachmentsChange,
  isReadOnly,
}: CustomerAttachmentUploaderProps) {
  const [attachments, setAttachments] = useState<Attachment[]>(initialAttachments || []);
  const [uploadingFiles, setUploadingFiles] = useState<Record<string, number>>({});
  const { storage } = useFirebase();

  // Sincroniza estado interno quando os dados do pai mudarem (ex: após save)
  useEffect(() => {
    setAttachments(initialAttachments || []);
  }, [initialAttachments]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      Array.from(event.target.files).forEach(handleUpload);
    }
  };

  const handleUpload = (file: File) => {
    if (isReadOnly || !customerId || !userId || !storage) {
        if (!storage) toast({ variant: "destructive", title: "Erro de Configuração", description: "Firebase Storage não inicializado." });
        return;
    }

    const filePath = `customers/${userId}/${customerId}/${Date.now()}_${file.name}`;
    const storageRef = ref(storage, filePath);
    const uploadTask = uploadBytesResumable(storageRef, file);

    setUploadingFiles(prev => ({ ...prev, [file.name]: 0 }));

    uploadTask.on(
      'state_changed',
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        setUploadingFiles(prev => ({ ...prev, [file.name]: progress }));
      },
      (error) => {
        console.error('Upload failed:', error);
        toast({ 
            variant: 'destructive', 
            title: 'Falha no Upload', 
            description: `Erro ao enviar ${file.name}. Verifique sua conexão ou as permissões de armazenamento.` 
        });
        setUploadingFiles(prev => {
            const newUploading = { ...prev };
            delete newUploading[file.name];
            return newUploading;
        });
      },
      () => {
        getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
          const newAttachment: Attachment = {
            name: file.name,
            url: downloadURL,
            type: file.type,
            size: file.size,
          };
          const updatedAttachments = [...attachments, newAttachment];
          setAttachments(updatedAttachments);
          onAttachmentsChange(updatedAttachments);
          
          toast({ title: 'Documento Adicionado', description: `O arquivo ${file.name} foi salvo.` });
          
          setUploadingFiles(prev => {
            const newUploading = { ...prev };
            delete newUploading[file.name];
            return newUploading;
          });
        }).catch(err => {
            console.error("Error getting download URL", err);
            toast({ variant: "destructive", title: "Erro ao gerar link", description: "O arquivo subiu, mas não conseguimos gerar o link de acesso." });
        });
      }
    );
  };

  const handleDelete = (attachmentToDelete: Attachment) => {
    if (isReadOnly || !storage) return;
    
    const storageRef = ref(storage, attachmentToDelete.url);
    deleteObject(storageRef)
      .then(() => {
        const updatedAttachments = attachments.filter(att => att.url !== attachmentToDelete.url);
        setAttachments(updatedAttachments);
        onAttachmentsChange(updatedAttachments);
        toast({ title: 'Documento Removido', description: `O arquivo ${attachmentToDelete.name} foi excluído.` });
      })
      .catch((error) => {
        if (error.code === 'storage/object-not-found') {
            const updatedAttachments = attachments.filter(att => att.url !== attachmentToDelete.url);
            setAttachments(updatedAttachments);
            onAttachmentsChange(updatedAttachments);
        } else {
            console.error('Delete failed:', error);
            toast({ variant: 'destructive', title: 'Falha ao Remover', description: `Não foi possível remover o arquivo.` });
        }
      });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <Card className={cn(isReadOnly && "bg-muted/50")}>
      <CardContent className="p-4 space-y-4">
        {!isReadOnly && (
          <div className={cn(
            "relative border-2 border-dashed border-muted-foreground/50 rounded-lg p-6 flex flex-col items-center justify-center text-center hover:border-primary transition-colors cursor-pointer",
            (isReadOnly || !customerId) && "cursor-not-allowed opacity-50"
            )}>
            <UploadCloud className="h-8 w-8 text-muted-foreground" />
            <p className="mt-2 text-sm text-muted-foreground font-medium">Documentos Fixos (RG, CPF, CNH, Residência...)</p>
            <p className="text-xs text-muted-foreground/70">Clique ou arraste arquivos aqui</p>
            <Input
              type="file"
              multiple
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              onChange={handleFileSelect}
              disabled={isReadOnly || !customerId}
            />
          </div>
        )}
        
        <div className="space-y-2">
            {Object.entries(uploadingFiles).map(([name, progress]) => (
                 <div key={name} className="space-y-1">
                    <div className='flex justify-between items-center text-xs'>
                        <span className='truncate max-w-[200px] flex items-center gap-2'>
                            <Loader2 className="h-3 w-3 animate-spin" />
                            {name}
                        </span>
                        <span className="font-mono">{Math.round(progress)}%</span>
                    </div>
                    <Progress value={progress} className="h-1" />
                </div>
            ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {attachments.map((attachment, index) => (
            <div key={index} className="flex items-center justify-between p-2 bg-secondary/50 rounded-md border border-border/50 group">
              <div className="flex items-center gap-2 overflow-hidden">
                <File className="h-4 w-4 shrink-0 text-muted-foreground" />
                <div className="flex flex-col overflow-hidden">
                  <span className="font-medium text-xs truncate" title={attachment.name}>{attachment.name}</span>
                  <span className="text-[10px] text-muted-foreground">{formatFileSize(attachment.size)}</span>
                </div>
              </div>
              <div className="flex items-center gap-1">
                 <a href={attachment.url} target="_blank" rel="noopener noreferrer">
                    <Button variant="ghost" size="icon" className="h-7 w-7">
                        <Download className="h-3 w-3" />
                    </Button>
                </a>
                {!isReadOnly && (
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => handleDelete(attachment)}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                )}
              </div>
            </div>
          ))}
          {attachments.length === 0 && Object.keys(uploadingFiles).length === 0 && (
            <div className="col-span-full py-6 text-center border border-dashed rounded-md">
                <p className="text-xs text-muted-foreground">Nenhum documento permanente arquivado.</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
