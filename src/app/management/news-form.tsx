
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
import { Loader2, Save, ImageIcon, ScrollText, Link as LinkIcon, FileType } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

const newsSchema = z.object({
  title: z.string().min(5, 'O título deve ter pelo menos 5 caracteres.'),
  subtitle: z.string().optional(),
  content: z.string().min(10, 'O conteúdo deve ser mais detalhado.'),
  coverUrl: z.string().optional(),
  externalLink: z.string().url('URL inválida.').or(z.literal('')).optional(),
  status: z.enum(['Draft', 'Published']),
  date: z.string(),
});

type NewsFormValues = z.infer<typeof newsSchema>;

interface NewsFormProps {
  initialData?: any;
  onSubmit: (data: NewsFormValues) => void;
  isSaving?: boolean;
}

export function NewsForm({ initialData, onSubmit, isSaving = false }: NewsFormProps) {
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
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-0">
        <ScrollArea className="h-[65vh] pr-4">
            <div className="space-y-6 py-2">
                <div className="grid grid-cols-1 gap-6">
                    <FormField
                        control={form.control}
                        name="title"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel className="font-bold uppercase text-[10px] tracking-widest text-primary/60">Título da Notícia *</FormLabel>
                            <FormControl><Input placeholder="Ex: Novo reajuste do INSS para 2025" {...field} className="font-bold h-11 rounded-xl" /></FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="subtitle"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel className="font-bold uppercase text-[10px] tracking-widest text-primary/60">Subtítulo ou Resumo</FormLabel>
                            <FormControl><Input placeholder="Breve frase de destaque para o card" {...field} className="h-11 rounded-xl" /></FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                                <FormControl><Input type="date" {...field} className="h-11 rounded-xl" /></FormControl>
                            </FormItem>
                            )}
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField
                            control={form.control}
                            name="coverUrl"
                            render={({ field }) => (
                            <FormItem>
                                <FormLabel className="font-bold uppercase text-[10px] tracking-widest text-primary/60 flex items-center gap-2">
                                    <ImageIcon className="h-3 w-3" /> Imagem Informativa (URL)
                                </FormLabel>
                                <FormControl>
                                    <div className="flex items-center gap-3">
                                        <Input placeholder="Link da imagem/print..." {...field} className="h-11 rounded-xl" />
                                        <div className="h-11 w-11 rounded-xl border-2 border-dashed bg-muted flex items-center justify-center shrink-0 overflow-hidden shadow-inner">
                                            {field.value ? <img src={field.value} className="h-full w-full object-cover" /> : <ImageIcon className="h-5 w-5 opacity-20" />}
                                        </div>
                                    </div>
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="externalLink"
                            render={({ field }) => (
                            <FormItem>
                                <FormLabel className="font-bold uppercase text-[10px] tracking-widest text-primary/60 flex items-center gap-2">
                                    <LinkIcon className="h-3 w-3" /> Link Externo / PDF (URL)
                                </FormLabel>
                                <FormControl>
                                    <div className="relative">
                                        <Input placeholder="https://..." {...field} className="h-11 rounded-xl pr-10" />
                                        <FileType className="absolute right-3 top-3 h-5 w-5 text-muted-foreground opacity-30" />
                                    </div>
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                    </div>

                    <FormField
                        control={form.control}
                        name="content"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel className="font-bold uppercase text-[10px] tracking-widest text-primary/60 flex items-center gap-2">
                                <ScrollText className="h-3 w-3" /> Conteúdo da Notícia *
                            </FormLabel>
                            <FormControl>
                                <Textarea 
                                    placeholder="Escreva os detalhes da atualização aqui..." 
                                    className="min-h-[250px] font-medium leading-relaxed text-sm p-5 rounded-2xl bg-muted/10 focus-visible:ring-primary/20 border-2" 
                                    {...field} 
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                </div>
            </div>
        </ScrollArea>

        <div className="flex justify-end pt-6 border-t mt-4">
          <Button type="submit" disabled={isSaving} className="rounded-full px-10 h-12 font-black uppercase text-[10px] tracking-[0.2em] shadow-xl bg-primary shadow-primary/20 transition-all border-none">
            {isSaving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Publicando...</> : <><Save className="mr-2 h-4 w-4" /> Salvar Publicação</>}
          </Button>
        </div>
      </form>
    </Form>
  );
}
