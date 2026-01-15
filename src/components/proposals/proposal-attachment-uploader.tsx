'use client';

import React, { useState } from 'react';
import { useFirebase } from '@/firebase';
import { getStorage, ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent } from '@/components/ui/card';
import { UploadCloud, File, Trash2, Download } from 'lucide-react';
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
  const [attachments, setAttachments] = useState<Attachment[]>(initialAttachments);
  const [uploadingFiles, setUploadingFiles] = useState<Record<string, number>>({});
  const storage = getStorage();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      Array.from(event.target.files).forEach(handleUpload);
    }
  };

  const handleUpload = (file: File) => {
    if (isReadOnly) return;
    const filePath = `proposals/${userId}/${proposalId}/${file.name}`;
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
        toast({ variant: 'destructive', title: 'Falha no Upload', description: `Não foi possível enviar o arquivo ${file.name}.` });
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
          toast({ title: 'Upload Concluído', description: `O arquivo ${file.name} foi enviado.` });
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
    if (isReadOnly) return;
    const storageRef = ref(storage, attachmentToDelete.url);
    deleteObject(storageRef)
      .then(() => {
        const updatedAttachments = attachments.filter(att => att.url !== attachmentToDelete.url);
        setAttachments(updatedAttachments);
        onAttachmentsChange(updatedAttachments);
        toast({ title: 'Anexo Removido', description: `O arquivo ${attachmentToDelete.name} foi removido.` });
      })
      .catch((error) => {
        // If the object does not exist, we can still remove it from the list
        if (error.code === 'storage/object-not-found') {
            const updatedAttachments = attachments.filter(att => att.url !== attachmentToDelete.url);
            setAttachments(updatedAttachments);
            onAttachmentsChange(updatedAttachments);
            toast({ title: 'Anexo Removido', description: `O arquivo ${attachmentToDelete.name} foi removido da lista.` });
        } else {
            console.error('Delete failed:', error);
            toast({ variant: 'destructive', title: 'Falha ao Remover', description: `Não foi possível remover o anexo ${attachmentToDelete.name}.` });
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
            "relative border-2 border-dashed border-muted-foreground/50 rounded-lg p-8 flex flex-col items-center justify-center text-center",
            isReadOnly && "cursor-not-allowed opacity-50"
            )}>
            <UploadCloud className="h-12 w-12 text-muted-foreground" />
            <p className="mt-4 text-sm text-muted-foreground">Arraste e solte arquivos aqui, ou clique para selecionar</p>
            <Input
              type="file"
              multiple
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              onChange={handleFileSelect}
              disabled={isReadOnly}
            />
          </div>
        )}
        
        <div className="space-y-2">
            {Object.entries(uploadingFiles).map(([name, progress]) => (
                 <div key={name} className="space-y-1">
                    <div className='flex justify-between items-center text-sm'>
                        <span className='truncate max-w-[200px]'>{name}</span>
                        <span>{Math.round(progress)}%</span>
                    </div>
                    <Progress value={progress} />
                </div>
            ))}
        </div>

        <div className="space-y-2">
          {attachments.map((attachment, index) => (
            <div key={index} className="flex items-center justify-between p-2 bg-secondary rounded-md">
              <div className="flex items-center gap-3">
                <File className="h-5 w-5 text-muted-foreground" />
                <div className="flex flex-col">
                  <span className="font-medium text-sm">{attachment.name}</span>
                  <span className="text-xs text-muted-foreground">{formatFileSize(attachment.size)}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                 <a href={attachment.url} target="_blank" rel="noopener noreferrer">
                    <Button variant="ghost" size="icon">
                        <Download className="h-4 w-4" />
                    </Button>
                </a>
                {!isReadOnly && (
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(attachment)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                )}
              </div>
            </div>
          ))}
          {attachments.length === 0 && Object.keys(uploadingFiles).length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">Nenhum anexo adicionado a esta proposta.</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
