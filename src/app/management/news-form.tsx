'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { format } from 'date-fns';
import { Loader2, Save, ImageIcon, ScrollText, Link as LinkIcon, Upload, X, FileText, Trash2 } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useState, useRef } from 'react';
import { useFirebase } from '@/firebase';
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import { toast } from '@/hooks/use-toast';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

const attachmentSchema = z.object({
  name: z.string(),
  url: z.string(),
  type: z.string(),
  size: z.number(),
});

const newsSchema = z.object({
  title: z.string().min(5, 'O título deve ter pelo menos 5 caracteres.'),
  subtitle: z.string().optional(),
  content: z.string().min(10, 'O conteúdo deve ser mais detalhado.'),
  coverUrl: z.string().optional(),
  externalLink: z.string().url('URL inválida.').or(z.literal('')).optional(),
  status: z.enum(['Draft', 'Published']),
  date: z.string(),
  attachments: z.array(attachmentSchema).optional(),
});

type NewsFormValues = z.infer<typeof newsSchema>;

interface NewsFormProps {
  initialData?: any;
  onSubmit: (data: NewsFormValues) => void;
  isSaving?: boolean;
}

export function NewsForm({ initialData, onSubmit, isSaving = false }: NewsFormProps) {
  const { storage, user } = useFirebase();
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<NewsFormValues>({
    resolver: zodResolver(newsSchema),
    defaultValues: initialData || {
      title: '',
      subtitle: '',
      content: '',
      coverUrl: '',
      externalLink: '',
      status: 'Draft',
      date: format(new Date(), 'yyyy-MM-dd'),
      attachments: [],
    },
  });

  const attachments = form.watch('attachments') || [];

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !storage || !user) return;

    if (file.size > 10 * 1024 * 1024) {
        toast({ variant: 'destructive', title: 'Arquivo muito grande', description: 'O limite é 10MB.' });
        return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    const filePath = `management/news/${user.uid}/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
    const storageRef = ref(storage, filePath);
    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on(
        'state_changed',
        (snapshot) => {
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            setUploadProgress(progress);
        },
        (error) => {
            setIsUploading(false);
            setUploadProgress(null);
            toast({ variant: 'destructive', title: 'Falha no upload', description: 'Tente novamente.' });
        },
        async () => {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            const newAttachment = {
                name: file.name,
                url: downloadURL,
                type: file.type,
                size: file.size,
            };

            const current = form.getValues('attachments') || [];
            form.setValue('attachments', [...current, newAttachment]);
            
            if (file.type.startsWith('image/') && !form.getValues('coverUrl')) {
                form.setValue('coverUrl', downloadURL);
            }

            setIsUploading(false);
            setUploadProgress(null);
            toast({ title: 'Arquivo anexado!' });
        }
    );
  };

  const removeAttachment = async (index: number) => {
    const current = form.getValues('attachments') || [];
    const fileToRemove = current[index];
    
    if (!fileToRemove) return;

    try {
        // Tenta excluir do Storage para liberar espaço real
        if (storage && fileToRemove.url.includes('firebasestorage')) {
            const fileRef = ref(storage, fileToRemove.url);
            await deleteObject(fileRef);
        }
        
        const newList = current.filter((_, i) => i !== index);
        form.setValue('attachments', newList);
        
        if (fileToRemove.url === form.getValues('coverUrl')) {
            form.setValue('coverUrl', '');
        }
        
        toast({ title: 'Arquivo removido e espaço liberado!' });
    } catch (e) {
        // Se falhar no storage (ex: arquivo já não existe), removemos apenas da lista
        const newList = current.filter((_, i) => i !== index);
        form.setValue('attachments', newList);
        toast({ title: 'Anexo removido da lista.' });
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col h-full">
        <ScrollArea className="flex-1 pr-4">
            <div className="space-y-8 py-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                        control={form.control}
                        name="status"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel className="font-bold uppercase text-[10px] tracking-widest text-primary/60">Situação</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                                <SelectTrigger className="font-bold h-11 rounded-xl">
                                    <SelectValue />
                                </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                <SelectItem value="Draft">Rascunho (Privado)</SelectItem>
                                <SelectItem value="Published">Publicado (Todos veem)</SelectItem>
                            </SelectContent>
                            </Select>
                        </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="date"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel className="font-bold uppercase text-[10px] tracking-widest text-primary/60">Data de Publicação</FormLabel>
                            <FormControl><Input type="date" {...field} className="h-11 rounded-xl font-bold" /></FormControl>
                        </FormItem>
                        )}
                    />
                </div>

                <div className="grid grid-cols-1 gap-6">
                    <FormField
                        control={form.control}
                        name="title"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel className="font-bold uppercase text-[10px] tracking-widest text-primary/60">Título da Notícia *</FormLabel>
                            <FormControl><Input placeholder="Ex: Novo reajuste do INSS para 2025" {...field} className="font-black text-lg h-12 rounded-xl" /></FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="subtitle"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel className="font-bold uppercase text-[10px] tracking-widest text-primary/60">Subtítulo ou Resumo Curto</FormLabel>
                            <FormControl><Input placeholder="Breve frase de destaque" {...field} className="h-11 rounded-xl font-medium" /></FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                </div>

                <div className="space-y-4">
                    <h4 className="font-bold uppercase text-[10px] tracking-widest text-primary/60 flex items-center gap-2">
                        <Upload className="h-3 w-3" /> Anexos e Mídias (PNG, JPEG ou PDF)
                    </h4>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div 
                            className={cn(
                                "border-2 border-dashed rounded-2xl p-6 flex flex-col items-center justify-center text-center gap-3 transition-all cursor-pointer bg-muted/10 hover:bg-muted/20",
                                isUploading && "opacity-50 pointer-events-none"
                            )}
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                {isUploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Upload className="h-5 w-5" />}
                            </div>
                            <div className="space-y-1">
                                <p className="font-black uppercase text-[10px] tracking-tight">Carregar Arquivo</p>
                                <p className="text-[9px] text-muted-foreground uppercase opacity-60">PNG, JPEG ou PDF (Máx 10MB)</p>
                            </div>
                            {uploadProgress !== null && (
                                <div className="w-full mt-2">
                                    <Progress value={uploadProgress} className="h-1" />
                                </div>
                            )}
                        </div>
                        <input type="file" ref={fileInputRef} className="hidden" accept="image/*,application/pdf" onChange={handleFileUpload} />

                        <FormField
                            control={form.control}
                            name="externalLink"
                            render={({ field }) => (
                            <FormItem>
                                <FormLabel className="font-bold uppercase text-[10px] tracking-widest text-primary/60 flex items-center gap-2">
                                    <LinkIcon className="h-3 w-3" /> Link Externo Adicional
                                </FormLabel>
                                <FormControl>
                                    <Input placeholder="https://..." {...field} className="h-11 rounded-xl" />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {attachments.map((file, idx) => (
                            <div key={idx} className="p-3 bg-card border rounded-xl flex items-center justify-between gap-3 group relative hover:border-red-200 transition-colors">
                                <div className="flex items-center gap-2 overflow-hidden">
                                    {file.type.startsWith('image/') ? <ImageIcon className="h-4 w-4 text-blue-500 shrink-0" /> : <FileText className="h-4 w-4 text-red-500 shrink-0" />}
                                    <span className="text-[10px] font-bold truncate uppercase">{file.name}</span>
                                </div>
                                <Button 
                                    type="button" 
                                    variant="ghost" 
                                    size="icon" 
                                    onClick={() => removeAttachment(idx)} 
                                    className="h-7 w-7 text-muted-foreground hover:text-red-600 hover:bg-red-50"
                                    title="Excluir arquivo e liberar espaço"
                                >
                                    <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                            </div>
                        ))}
                    </div>
                </div>

                <FormField
                    control={form.control}
                    name="content"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel className="font-bold uppercase text-[10px] tracking-widest text-primary/60 flex items-center gap-2">
                            <ScrollText className="h-3 w-3" /> Conteúdo Detalhado da Notícia *
                        </FormLabel>
                        <FormControl>
                            <Textarea 
                                placeholder="Escreva os detalhes da atualização aqui..." 
                                className="min-h-[300px] font-medium leading-relaxed text-sm p-6 rounded-3xl bg-muted/5 focus-visible:ring-primary/20 border-2" 
                                {...field} 
                            />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
            </div>
        </ScrollArea>

        <div className="flex justify-end pt-6 border-t mt-4 shrink-0">
          <Button type="submit" disabled={isSaving || isUploading} className="rounded-full px-12 h-12 font-black uppercase text-[11px] tracking-[0.2em] shadow-xl bg-primary shadow-primary/20 transition-all border-none">
            {isSaving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Publicando...</> : <><Save className="mr-2 h-4 w-4" /> Salvar Publicação</>}
          </Button>
        </div>
      </form>
    </Form>
  );
}
