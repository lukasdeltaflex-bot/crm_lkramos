
'use client';

import React, { useState, useEffect } from 'react';
import { useFirebase } from '@/firebase';
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent } from '@/components/ui/card';
import { UploadCloud, File, Trash2, Download, Loader2, FolderLock, Eye } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import type { Attachment } from '@/lib/types';
import { cn } from '@/lib/utils';
import { DocumentPreviewDialog } from '@/components/ui/document-preview-dialog';

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
  const [previewAttachment, setPreviewAttachment] = useState<Attachment | null>(null);
  const { storage } = useFirebase();

  useEffect(() => {
    setAttachments(initialAttachments || []);
  }, [initialAttachments]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      Array.from(event.target.files).forEach(handleUpload);
    }
  };

  const handleUpload = (file: File) => {
    if (isReadOnly || !customerId || !userId) return;

    if (!storage) {
        toast({ 
            variant: "destructive", 
            title: "Configuração Pendente", 
            description: "O Storage não foi detectado. Certifique-se de habilitá-lo no Console do Firebase." 
        });
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
      (error: any) => {
        console.error('Upload Error:', error);
        toast({ 
            variant: 'destructive', 
            title: 'Falha no Armazenamento', 
            description: `Erro ao enviar ${file.name}. Verifique as permissões de acesso.` 
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
          
          toast({ title: 'Documento Permanente Salvo', description: `O arquivo ${file.name} foi arquivado na central do cliente.` });
          
          setUploadingFiles(prev => {
            const newUploading = { ...prev };
            delete newUploading[file.name];
            return newUploading;
          });
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
        toast({ title: 'Documento Excluído' });
      })
      .catch((error) => {
        if (error.code === 'storage/object-not-found') {
            const updatedAttachments = attachments.filter(att => att.url !== attachmentToDelete.url);
            setAttachments(updatedAttachments);
            onAttachmentsChange(updatedAttachments);
        } else {
            toast({ variant: 'destructive', title: 'Erro ao remover do servidor' });
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
    <Card className={cn("border-dashed", isReadOnly && "bg-muted/50")}>
      <CardContent className="p-4 space-y-4">
        {!isReadOnly && (
          <div className={cn(
            "relative border-2 border-dashed border-muted-foreground/30 rounded-lg p-6 flex flex-col items-center justify-center text-center hover:border-primary transition-all cursor-pointer",
            !customerId && "cursor-not-allowed opacity-50"
            )}>
            <UploadCloud className="h-8 w-8 text-muted-foreground" />
            <p className="mt-2 text-sm font-bold">Documentos Fixos (RG, CPF, CNH...)</p>
            <p className="text-[10px] text-muted-foreground">Arraste para cá ou clique para escolher</p>
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
                    <div className='flex justify-between items-center text-[10px]'>
                        <span className='truncate max-w-[180px] flex items-center gap-2 font-bold'>
                            <Loader2 className="h-2.5 w-2.5 animate-spin" />
                            {name}
                        </span>
                        <span className="font-mono">{Math.round(progress)}%</span>
                    </div>
                    <Progress value={progress} className="h-1" />
                </div>
            ))}
        </div>

        <div className="grid grid-cols-1 gap-2">
          {attachments.map((attachment, index) => (
            <div key={index} className="flex items-center justify-between p-2.5 bg-secondary/40 rounded-md border group">
              <div className="flex items-center gap-2 overflow-hidden">
                <File className="h-4 w-4 shrink-0 text-primary/60" />
                <div className="flex flex-col overflow-hidden">
                  <span className="font-bold text-[11px] truncate" title={attachment.name}>{attachment.name}</span>
                  <span className="text-[9px] text-muted-foreground uppercase">{formatFileSize(attachment.size)}</span>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-7 w-7 text-primary" 
                    onClick={() => setPreviewAttachment(attachment)}
                    title="Visualizar documento"
                >
                    <Eye className="h-3.5 w-3.5" />
                </Button>
                 <a href={attachment.url} target="_blank" rel="noopener noreferrer">
                    <Button variant="ghost" size="icon" className="h-7 w-7 hover:text-primary">
                        <Download className="h-3.5 w-3.5" />
                    </Button>
                </a>
                {!isReadOnly && (
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => handleDelete(attachment)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            </div>
          ))}
          {attachments.length === 0 && Object.keys(uploadingFiles).length === 0 && (
            <div className="py-6 text-center border border-dashed rounded-md bg-muted/5">
                <FolderLock className="h-6 w-6 mx-auto mb-2 opacity-20" />
                <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-tighter">Nenhum documento arquivado.</p>
            </div>
          )}
        </div>
      </CardContent>

      <DocumentPreviewDialog 
        attachment={previewAttachment} 
        onClose={() => setPreviewAttachment(null)} 
      />
    </Card>
  );
}
