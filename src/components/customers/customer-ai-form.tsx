'use client';

import { useState, useRef, useTransition } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Sparkles, Loader2, Upload, Image as ImageIcon, FileText, X, Info, FileSearch, FileType, AlertTriangle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { extractCustomerData } from '@/ai/flows/extract-customer-data-flow';
import { extractDataFromImage } from '@/ai/flows/extract-data-from-image-flow';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface CustomerAiFormProps {
  onSubmit: (data: any) => void;
}

export function CustomerAiForm({ onSubmit }: CustomerAiFormProps) {
  const [text, setText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [fileType, setFileType] = useState<'image' | 'pdf' | null>(null);
  const [isPending, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleTextExtract = () => {
    if (!text.trim()) {
      toast({ variant: 'destructive', title: 'Texto vazio' });
      return;
    }
    
    setIsLoading(true);
    startTransition(async () => {
        try {
          const extractedData = await extractCustomerData(text);
          if (!extractedData || !extractedData.name) {
              toast({ variant: 'destructive', title: 'Falha na Extração', description: 'A IA não conseguiu identificar os dados no texto.' });
              setIsLoading(false);
              return;
          }
          toast({ title: 'Dados extraídos com sucesso!' });
          onSubmit(extractedData);
        } catch (error) {
          toast({ variant: 'destructive', title: 'Erro ao extrair dados' });
        } finally {
          setIsLoading(false);
        }
    });
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const MAX_SIZE_MB = 4;
      const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;

      if (file.size > MAX_SIZE_BYTES) {
          toast({ 
              variant: 'destructive', 
              title: 'Arquivo muito pesado', 
              description: `O limite para análise via IA é de ${MAX_SIZE_MB}MB.` 
          });
          if (event.target) event.target.value = '';
          return;
      }

      const type = file.type.startsWith('image/') ? 'image' : file.type === 'application/pdf' ? 'pdf' : null;
      if (!type) {
          toast({ variant: 'destructive', title: 'Formato não suportado', description: 'Envie apenas imagens ou PDFs.' });
          return;
      }
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedFile(reader.result as string);
        setFileType(type);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFileExtract = () => {
    if (!selectedFile) return;
    
    setIsLoading(true);
    startTransition(async () => {
        try {
          const extractedData = await extractDataFromImage(selectedFile);
          if (!extractedData || !extractedData.name) {
              toast({ variant: 'destructive', title: 'IA não reconheceu dados', description: 'Certifique-se de que o documento está legível e sem senhas.' });
              setIsLoading(false);
              return;
          }
          
          toast({ title: 'Documento processado com IA!' });
          onSubmit(extractedData);
        } catch (error: any) {
          console.error("Extraction failed:", error);
          toast({ 
              variant: 'destructive', 
              title: 'Erro no processamento', 
              description: 'A ação do servidor não pôde ser concluída. Verifique sua conexão.' 
          });
        } finally {
          setIsLoading(false);
        }
    });
  };

  return (
    <div className="space-y-4 py-4">
        <Tabs defaultValue="image" className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-muted/50 mb-4 h-12 rounded-full p-1">
                <TabsTrigger value="image" className="gap-2 rounded-full font-bold data-[state=active]:bg-primary data-[state=active]:text-white transition-all">
                    <ImageIcon className="h-4 w-4" />
                    Arquivo (Foto/PDF)
                </TabsTrigger>
                <TabsTrigger value="text" className="gap-2 rounded-full font-bold data-[state=active]:bg-primary data-[state=active]:text-white transition-all">
                    <FileText className="h-4 w-4" />
                    Colar Texto
                </TabsTrigger>
            </TabsList>

            <TabsContent value="image" className="space-y-4">
                <div className="flex flex-col items-center justify-center border-2 border-dashed rounded-[2rem] p-8 bg-muted/10 hover:bg-muted/20 transition-all group relative min-h-[350px]">
                    {selectedFile ? (
                        <div className="relative w-full max-w-sm aspect-[4/3] rounded-3xl overflow-hidden border-4 border-white shadow-2xl flex items-center justify-center bg-background">
                            {fileType === 'image' ? (
                                <img src={selectedFile} alt="Preview" className="w-full h-full object-cover" />
                            ) : (
                                <div className="flex flex-col items-center gap-4 animate-in zoom-in">
                                    <div className="h-20 w-20 bg-red-500/10 rounded-2xl flex items-center justify-center border-2 border-red-500/20">
                                        <FileType className="h-10 w-10 text-red-600" />
                                    </div>
                                    <p className="text-sm font-black uppercase text-red-600">Documento PDF Selecionado</p>
                                </div>
                            )}
                            <Button 
                                variant="destructive" 
                                size="icon" 
                                className="absolute top-4 right-4 h-10 w-10 rounded-full shadow-lg"
                                onClick={() => { setSelectedFile(null); setFileType(null); }}
                            >
                                <X className="h-5 w-5" />
                            </Button>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center text-center space-y-6">
                            <div className="h-20 w-20 rounded-3xl bg-primary/10 flex items-center justify-center border-2 border-primary/20 rotate-3 group-hover:rotate-0 transition-transform">
                                <FileSearch className="h-10 w-10 text-primary" />
                            </div>
                            <div className="space-y-2">
                                <p className="font-black text-lg uppercase tracking-tight">Leitor de Documentos IA</p>
                                <p className="text-[10px] text-muted-foreground uppercase font-black tracking-[0.2em] max-w-[200px]">Aceita extratos em PDF, fotos de RG ou telas de consulta bancária.</p>
                            </div>
                            <Button variant="outline" onClick={() => fileInputRef.current?.click()} className="rounded-full px-8 h-12 font-black border-2 border-primary/20 bg-background hover:bg-primary hover:text-white transition-all">
                                <Upload className="mr-2 h-4 w-4" />
                                Carregar Documento
                            </Button>
                        </div>
                    )}
                    <input 
                        type="file" 
                        ref={fileInputRef} 
                        className="hidden" 
                        accept="image/*,application/pdf" 
                        onChange={handleFileSelect}
                    />
                </div>

                {selectedFile && (
                    <Button 
                        className="w-full h-14 text-sm font-black uppercase tracking-widest bg-primary shadow-xl rounded-full" 
                        onClick={handleFileExtract} 
                        disabled={isLoading || isPending}
                    >
                        {isLoading || isPending ? (
                            <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Mapeando Dados com IA...</>
                        ) : (
                            <><Sparkles className="mr-2 h-5 w-5 fill-current" /> Sincronizar com IA</>
                        )}
                    </Button>
                )}
            </TabsContent>

            <TabsContent value="text" className="space-y-4">
                <Textarea
                    placeholder="Cole aqui o texto do extrato ou ficha do cliente..."
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    rows={12}
                    disabled={isLoading || isPending}
                    className="resize-none border-2 rounded-3xl p-6 focus-visible:ring-primary/20 font-medium"
                />
                <Button 
                    className="w-full h-14 font-black uppercase tracking-widest rounded-full" 
                    onClick={handleTextExtract} 
                    disabled={isLoading || isPending}
                >
                    {isLoading || isPending ? (
                        <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Interpretando Dados...</>
                    ) : (
                        <><Sparkles className="mr-2 h-5 w-5" /> Analisar e Preencher</>
                    )}
                </Button>
            </TabsContent>
        </Tabs>

        <Alert className="bg-orange-500/[0.03] border-orange-500/20 rounded-2xl">
            <Info className="h-4 w-4 text-orange-600" />
            <AlertTitle className="text-xs font-black uppercase tracking-widest text-orange-700">Blindagem de Performance</AlertTitle>
            <AlertDescription className="text-[10px] leading-tight text-orange-600/80 font-bold uppercase">
                A IA processa documentos via Server Action estabilizada. Se o erro persistir, recarregue a página (F5) para sincronizar o manifesto de ações.
            </AlertDescription>
        </Alert>
    </div>
  );
}