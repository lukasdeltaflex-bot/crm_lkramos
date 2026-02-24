'use client';

import { useState, useRef } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Sparkles, Loader2, Camera, Upload, Image as ImageIcon, FileText, X, Info, FileSearch } from 'lucide-react';
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
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleTextExtract = async () => {
    if (!text.trim()) {
      toast({ variant: 'destructive', title: 'Texto vazio' });
      return;
    }
    setIsLoading(true);
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
  };

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleImageExtract = async () => {
    if (!selectedImage) return;
    setIsLoading(true);
    try {
      const extractedData = await extractDataFromImage(selectedImage);
      if (!extractedData || !extractedData.name) {
          toast({ variant: 'destructive', title: 'IA não reconheceu dados', description: 'Tente uma foto mais nítida ou use o modo texto.' });
          setIsLoading(false);
          return;
      }
      
      toast({ title: 'Documento processado com IA!' });
      onSubmit(extractedData);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Erro no processamento da imagem' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4 py-4">
        <Tabs defaultValue="image" className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-muted/50 mb-4 h-12 rounded-full p-1">
                <TabsTrigger value="image" className="gap-2 rounded-full font-bold data-[state=active]:bg-primary data-[state=active]:text-white transition-all">
                    <ImageIcon className="h-4 w-4" />
                    Extrair de Foto/PDF
                </TabsTrigger>
                <TabsTrigger value="text" className="gap-2 rounded-full font-bold data-[state=active]:bg-primary data-[state=active]:text-white transition-all">
                    <FileText className="h-4 w-4" />
                    Colar Texto
                </TabsTrigger>
            </TabsList>

            <TabsContent value="image" className="space-y-4">
                <div className="flex flex-col items-center justify-center border-2 border-dashed rounded-[2rem] p-8 bg-muted/10 hover:bg-muted/20 transition-all group relative min-h-[350px]">
                    {selectedImage ? (
                        <div className="relative w-full max-w-sm aspect-[4/3] rounded-3xl overflow-hidden border-4 border-white shadow-2xl">
                            <img src={selectedImage} alt="Preview" className="w-full h-full object-cover" />
                            <Button 
                                variant="destructive" 
                                size="icon" 
                                className="absolute top-4 right-4 h-10 w-10 rounded-full shadow-lg"
                                onClick={() => setSelectedImage(null)}
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
                                <p className="font-black text-lg uppercase tracking-tight">Análise Visual Inteligente</p>
                                <p className="text-[10px] text-muted-foreground uppercase font-black tracking-[0.2em] max-w-[200px]">Suba extratos, RGs ou fotos de telas para mapear benefícios e cartões.</p>
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
                        accept="image/*" 
                        onChange={handleImageSelect}
                        capture="environment" 
                    />
                </div>

                {selectedImage && (
                    <Button 
                        className="w-full h-14 text-sm font-black uppercase tracking-widest bg-primary shadow-xl rounded-full" 
                        onClick={handleImageExtract} 
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Mapeando Benefícios...</>
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
                    disabled={isLoading}
                    className="resize-none border-2 rounded-3xl p-6 focus-visible:ring-primary/20 font-medium"
                />
                <Button 
                    className="w-full h-14 font-black uppercase tracking-widest rounded-full" 
                    onClick={handleTextExtract} 
                    disabled={isLoading}
                >
                    {isLoading ? (
                        <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Interpretando Dados...</>
                    ) : (
                        <><Sparkles className="mr-2 h-5 w-5" /> Analisar e Preencher</>
                    )}
                </Button>
            </TabsContent>
        </Tabs>

        <Alert className="bg-orange-500/[0.03] border-orange-500/20 rounded-2xl">
            <Info className="h-4 w-4 text-orange-600" />
            <AlertTitle className="text-xs font-black uppercase tracking-widest text-orange-700">Dica de Performance</AlertTitle>
            <AlertDescription className="text-[10px] leading-tight text-orange-600/80 font-bold uppercase">
                A IA agora identifica automaticamente bancos de reserva RMC e RCC diretamente de extratos de empréstimos e documentos oficiais.
            </AlertDescription>
        </Alert>
    </div>
  );
}
