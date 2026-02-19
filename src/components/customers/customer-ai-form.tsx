'use client';

import { useState, useRef } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Sparkles, Loader2, Camera, Upload, Image as ImageIcon, FileText, X } from 'lucide-react';
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
      
      // Adaptando formato da imagem para o formulário de cliente
      const finalData = {
          ...extractedData,
          benefits: extractedData.benefitNumber ? [{ number: extractedData.benefitNumber }] : []
      };

      toast({ title: 'Documento processado com IA!' });
      onSubmit(finalData);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Erro no processamento da imagem' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4 py-4">
        <Tabs defaultValue="image" className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-muted/50 mb-4">
                <TabsTrigger value="image" className="gap-2">
                    <ImageIcon className="h-4 w-4" />
                    Foto do Documento (OCR)
                </TabsTrigger>
                <TabsTrigger value="text" className="gap-2">
                    <FileText className="h-4 w-4" />
                    Colar Texto
                </TabsTrigger>
            </TabsList>

            <TabsContent value="image" className="space-y-4">
                <div className="flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-8 bg-muted/10 hover:bg-muted/20 transition-all group relative min-h-[300px]">
                    {selectedImage ? (
                        <div className="relative w-full max-w-sm aspect-[4/3] rounded-lg overflow-hidden border shadow-lg">
                            <img src={selectedImage} alt="Preview" className="w-full h-full object-cover" />
                            <Button 
                                variant="destructive" 
                                size="icon" 
                                className="absolute top-2 right-2 h-8 w-8 rounded-full shadow-lg"
                                onClick={() => setSelectedImage(null)}
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center text-center space-y-4">
                            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                                <Camera className="h-8 w-8 text-primary" />
                            </div>
                            <div className="space-y-1">
                                <p className="font-bold text-sm">Tire uma foto ou suba um documento</p>
                                <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">RG, CNH, Extratos ou Fichas</p>
                            </div>
                            <Button variant="outline" onClick={() => fileInputRef.current?.click()} className="rounded-full px-6">
                                <Upload className="mr-2 h-4 w-4" />
                                Escolher Arquivo
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
                        className="w-full h-12 text-sm font-bold bg-primary shadow-xl" 
                        onClick={handleImageExtract} 
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Processando Documento...</>
                        ) : (
                            <><Sparkles className="mr-2 h-5 w-5" /> Extrair Dados com Visão IA</>
                        )}
                    </Button>
                )}
            </TabsContent>

            <TabsContent value="text" className="space-y-4">
                <Textarea
                    placeholder="Cole aqui o texto copiado do WhatsApp ou e-mail..."
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    rows={10}
                    disabled={isLoading}
                    className="resize-none border-2 focus-visible:ring-primary/20"
                />
                <Button 
                    className="w-full h-12 font-bold" 
                    onClick={handleTextExtract} 
                    disabled={isLoading}
                >
                    {isLoading ? (
                        <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Analisando Texto...</>
                    ) : (
                        <><Sparkles className="mr-2 h-5 w-5" /> Analisar e Preencher</>
                    )}
                </Button>
            </TabsContent>
        </Tabs>

        <Alert className="bg-primary/5 border-primary/10">
            <Info className="h-4 w-4 text-primary" />
            <AlertTitle className="text-xs font-bold uppercase">Como Funciona?</AlertTitle>
            <AlertDescription className="text-[10px] leading-tight text-muted-foreground">
                A IA analisa a imagem ou o texto, identifica padrões de nomes, CPFs e benefícios, preenchendo o formulário automaticamente para você revisar.
            </AlertDescription>
        </Alert>
    </div>
  );
}
