'use client';

import React, { useState, useEffect } from 'react';
import { useFirebase } from '@/firebase';
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent } from '@/components/ui/card';
import { UploadCloud, File, Trash2, Download, Loader2, AlertTriangle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import type { Attachment } from '@/lib/types';
import { cn } from '@/lib/utils';

interface ProposalAttachmentUploaderProps {
  userId: string;
  proposalId: string;
  initialAttachments: Attachment[];
  onAttachmentsChange: (attachments: Attachment[]) => void;
  isReadOnly?: boolean;
}

export function ProposalAttachmentUploader({
  userId,
  proposalId,
  initialAttachments,
  onAttachmentsChange,
  isReadOnly,
}: ProposalAttachmentUploaderProps) {
  const [attachments, setAttachments] = useState<Attachment[]>(initialAttachments || []);
  const [uploadingFiles, setUploadingFiles] = useState<Record<string, number>>({});
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
    if (isReadOnly || !proposalId || !userId) return;

    if (!storage) {
        toast({ 
            variant: "destructive", 
            title: "Erro de Armazenamento", 
            description: "O serviço de arquivos não está configurado. Verifique se o Firebase Storage foi ativado no console." 
        });
        return;
    }

    // Pasta organizada: proposals/ID_USUARIO/ID_PROPOSTA/timestamp_nome
    const filePath = `proposals/${userId}/${proposalId}/${Date.now()}_${file.name}`;
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
        let errorMessage = "Erro ao enviar arquivo.";
        
        if (error.code === 'storage/unauthorized') {
            errorMessage = "Sem permissão. Verifique as 'Security Rules' do Storage no console do Firebase.";
        } else if (error.code === 'storage/canceled') {
            errorMessage = "Upload cancelado.";
        }

        toast({ 
            variant: 'destructive', 
            title: 'Falha no Anexo', 
            description: errorMessage 
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
          
          toast({ title: 'Arquivo Anexado', description: `${file.name} foi salvo com sucesso.` });
          
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
        toast({ title: 'Anexo Removido' });
      })
      .catch((error) => {
        // Se o arquivo já não existir fisicamente, apenas removemos da lista
        if (error.code === 'storage/object-not-found') {
            const updatedAttachments = attachments.filter(att => att.url !== attachmentToDelete.url);
            setAttachments(updatedAttachments);
            onAttachmentsChange(updatedAttachments);
        } else {
            toast({ variant: 'destructive', title: 'Erro ao remover arquivo' });
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
    <Card className={cn("border-dashed border-2", isReadOnly && "bg-muted/50")}>
      <CardContent className="p-4 space-y-4">
        {!isReadOnly && (
          <div className="relative border-2 border-dashed border-muted-foreground/30 rounded-xl p-8 flex flex-col items-center justify-center text-center hover:border-primary/50 hover:bg-primary/5 transition-all cursor-pointer group">
            <UploadCloud className="h-10 w-10 text-muted-foreground group-hover:text-primary transition-colors" />
            <p className="mt-4 text-sm font-semibold">Anexar Documentos da Proposta</p>
            <p className="text-xs text-muted-foreground mt-1">Clique para selecionar ou arraste os arquivos</p>
            <Input
              type="file"
              multiple
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              onChange={handleFileSelect}
              disabled={isReadOnly}
            />
          </div>
        )}
        
        <div className="space-y-3">
            {Object.entries(uploadingFiles).map(([name, progress]) => (
                 <div key={name} className="space-y-1.5 p-3 bg-primary/5 rounded-lg border border-primary/10">
                    <div className='flex justify-between items-center text-xs'>
                        <span className='truncate font-bold flex items-center gap-2'>
                            <Loader2 className="h-3 w-3 animate-spin text-primary" />
                            Subindo: {name}
                        </span>
                        <span className="font-mono text-primary">{Math.round(progress)}%</span>
                    </div>
                    <Progress value={progress} className="h-1.5 bg-primary/10" />
                </div>
            ))}
        </div>

        <div className="grid grid-cols-1 gap-2">
          {attachments.map((attachment, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg border group hover:border-primary/30 transition-colors">
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="p-2 bg-background rounded border">
                    <File className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="flex flex-col overflow-hidden">
                  <span className="font-bold text-xs truncate" title={attachment.name}>{attachment.name}</span>
                  <span className="text-[10px] text-muted-foreground uppercase font-medium">{formatFileSize(attachment.size)}</span>
                </div>
              </div>
              <div className="flex items-center gap-1">
                 <a href={attachment.url} target="_blank" rel="noopener noreferrer">
                    <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-primary">
                        <Download className="h-4 w-4" />
                    </Button>
                </a>
                {!isReadOnly && (
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => handleDelete(attachment)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          ))}
          {attachments.length === 0 && Object.keys(uploadingFiles).length === 0 && (
            <div className="py-10 text-center border-2 border-dashed rounded-xl bg-muted/5">
                <AlertTriangle className="h-8 w-8 mx-auto mb-2 text-muted-foreground/30" />
                <p className="text-xs text-muted-foreground font-medium">Nenhum documento anexado a esta proposta.</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
