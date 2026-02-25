'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import { useFirestore, useDoc, useMemoFirebase, useFirebase } from '@/firebase';
import { doc, collection, setDoc } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import type { UserSettings, Attachment } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
    CheckCircle2, 
    Upload, 
    FileText, 
    User, 
    Phone, 
    Calendar, 
    ShieldCheck, 
    Loader2,
    Camera,
    Info,
    X
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { validateCPF, handlePhoneMask, cleanFirestoreData } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';

export default function LeadCapturePage() {
  const { uid } = useParams() as { uid: string };
  const firestore = useFirestore();
  const { storage } = useFirebase();
  
  const [formData, setFormData] = useState({
    name: '',
    cpf: '',
    phone: '',
    birthDate: '',
    email: ''
  });
  
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const settingsDocRef = useMemoFirebase(() => {
    if (!uid || !firestore) return null;
    return doc(firestore, 'userSettings', uid);
  }, [firestore, uid]);

  const { data: userSettings, isLoading: loadingSettings } = useDoc<UserSettings>(settingsDocRef);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let { name, value } = e.target;
    if (name === 'cpf') value = value.replace(/\D/g, "").replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4").substring(0, 14);
    if (name === 'phone') value = handlePhoneMask(value);
    if (name === 'birthDate') value = value.replace(/\D/g, "").replace(/(\d{2})(\d{2})(\d{4})/, "$1/$2/$3").substring(0, 10);
    
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || !storage || !uid) return;

    setIsUploading(true);
    const newAttachments: Attachment[] = [...attachments];

    for (const file of Array.from(files)) {
        if (file.size > 5 * 1024 * 1024) {
            toast({ variant: 'destructive', title: 'Arquivo muito grande', description: 'O limite é 5MB por arquivo.' });
            continue;
        }

        const filePath = `leads_temp/${uid}/${Date.now()}_${file.name}`;
        const storageRef = ref(storage, filePath);
        const uploadTask = uploadBytesResumable(storageRef, file);

        await new Promise((resolve, reject) => {
            uploadTask.on('state_changed', 
                (snap) => setUploadProgress((snap.bytesTransferred / snap.totalBytes) * 100),
                (err) => reject(err),
                async () => {
                    const url = await getDownloadURL(uploadTask.snapshot.ref);
                    newAttachments.push({
                        name: file.name,
                        url,
                        type: file.type,
                        size: file.size
                    });
                    resolve(true);
                }
            );
        });
    }

    setAttachments(newAttachments);
    setIsUploading(false);
    setUploadProgress(0);
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firestore || !uid) return;

    if (!validateCPF(formData.cpf)) {
        toast({ variant: 'destructive', title: 'CPF Inválido', description: 'Verifique os números digitados.' });
        return;
    }

    if (formData.name.split(' ').length < 2) {
        toast({ variant: 'destructive', title: 'Nome Incompleto', description: 'Por favor, digite seu nome e sobrenome.' });
        return;
    }

    setIsSubmitting(true);
    try {
        const leadId = doc(collection(firestore, 'leads')).id;
        
        // Formata data para ISO
        let birthIso = '';
        try {
            const [d, m, y] = formData.birthDate.split('/');
            birthIso = `${y}-${m}-${d}`;
        } catch (e) {}

        const leadData: any = {
            id: leadId,
            ownerId: uid,
            name: formData.name.toUpperCase(),
            cpf: formData.cpf,
            phone: formData.phone,
            birthDate: birthIso,
            email: formData.email,
            status: 'pending',
            createdAt: new Date().toISOString(),
            documents: attachments
        };

        await setDoc(doc(firestore, 'leads', leadId), cleanFirestoreData(leadData));
        setIsSuccess(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (e) {
        toast({ variant: 'destructive', title: 'Erro ao enviar', description: 'Tente novamente em alguns instantes.' });
    } finally {
        setIsSubmitting(false);
    }
  };

  if (loadingSettings) {
    return (
        <div className="min-h-screen flex items-center justify-center bg-zinc-50 p-6">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
    );
  }

  if (isSuccess) {
    return (
        <div className="min-h-screen flex items-center justify-center bg-zinc-50 p-6">
            <Card className="max-w-md w-full border-2 border-green-100 shadow-2xl rounded-[2.5rem] overflow-hidden text-center p-10 space-y-6">
                <div className="h-20 w-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                    <CheckCircle2 className="h-10 w-10 text-green-600" />
                </div>
                <div className="space-y-2">
                    <h2 className="text-2xl font-black uppercase tracking-tight text-zinc-900">Dados Enviados!</h2>
                    <p className="text-muted-foreground font-medium">Recebemos sua ficha com sucesso. Nossa equipe entrará em contato em breve.</p>
                </div>
                <div className="pt-4">
                    <p className="text-[10px] font-black uppercase text-zinc-400 tracking-widest">LK RAMOS INVESTIMENTOS</p>
                </div>
            </Card>
        </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 p-4 md:p-10 flex flex-col items-center">
        <div className="mb-10 text-center space-y-4">
            {userSettings?.customLogoURL ? (
                <img src={userSettings.customLogoURL} alt="Logo" className="h-16 mx-auto object-contain" />
            ) : (
                <div className="h-12 w-12 bg-primary/10 rounded-xl flex items-center justify-center mx-auto">
                    <ShieldCheck className="h-6 w-6 text-primary" />
                </div>
            )}
            <div>
                <h1 className="text-xl font-black uppercase tracking-tighter">Central de Envio de Dados</h1>
                <p className="text-xs text-muted-foreground uppercase font-bold tracking-widest opacity-60">Ambiente Seguro e Criptografado</p>
            </div>
        </div>

        <Card className="max-w-2xl w-full border-none shadow-2xl rounded-[2rem] overflow-hidden">
            <CardHeader className="bg-primary/5 border-b border-primary/10 p-8">
                <CardTitle className="text-lg font-black uppercase flex items-center gap-3 text-primary">
                    <FileText className="h-5 w-5" />
                    Ficha de Cadastro
                </CardTitle>
                <CardDescription className="text-xs font-medium">Preencha os campos abaixo para iniciarmos sua simulação.</CardDescription>
            </CardHeader>
            <CardContent className="p-8">
                <form onSubmit={handleSubmit} className="space-y-10">
                    <div className="space-y-6">
                        <div className="grid gap-6">
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase text-muted-foreground flex items-center gap-2">
                                    <User className="h-3 w-3" /> Nome Completo
                                </Label>
                                <Input 
                                    name="name" 
                                    required 
                                    placeholder="Como está no seu documento" 
                                    className="h-12 rounded-xl bg-zinc-100/50 border-zinc-200 font-bold focus:bg-white transition-all"
                                    value={formData.name}
                                    onChange={handleInputChange}
                                />
                            </div>
                            
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase text-muted-foreground flex items-center gap-2">
                                        <FileText className="h-3 w-3" /> CPF (Apenas números)
                                    </Label>
                                    <Input 
                                        name="cpf" 
                                        required 
                                        placeholder="000.000.000-00" 
                                        className="h-12 rounded-xl bg-zinc-100/50 border-zinc-200 font-bold focus:bg-white"
                                        value={formData.cpf}
                                        onChange={handleInputChange}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase text-muted-foreground flex items-center gap-2">
                                        <Calendar className="h-3 w-3" /> Data de Nascimento
                                    </Label>
                                    <Input 
                                        name="birthDate" 
                                        required 
                                        placeholder="DD/MM/AAAA" 
                                        className="h-12 rounded-xl bg-zinc-100/50 border-zinc-200 font-bold focus:bg-white"
                                        value={formData.birthDate}
                                        onChange={handleInputChange}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase text-muted-foreground flex items-center gap-2">
                                        <Phone className="h-3 w-3" /> WhatsApp de Contato
                                    </Label>
                                    <Input 
                                        name="phone" 
                                        required 
                                        placeholder="(00) 00000-0000" 
                                        className="h-12 rounded-xl bg-zinc-100/50 border-zinc-200 font-bold focus:bg-white"
                                        value={formData.phone}
                                        onChange={handleInputChange}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase text-muted-foreground flex items-center gap-2">
                                        E-mail (Opcional)
                                    </Label>
                                    <Input 
                                        name="email" 
                                        type="email"
                                        placeholder="exemplo@email.com" 
                                        className="h-12 rounded-xl bg-zinc-100/50 border-zinc-200 font-bold focus:bg-white"
                                        value={formData.email}
                                        onChange={handleInputChange}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <Separator />

                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm font-black uppercase tracking-tight text-primary flex items-center gap-2">
                                <Camera className="h-4 w-4" /> Fotos dos Documentos
                            </h3>
                            <Badge variant="outline" className="text-[9px] font-bold">LIMITE 5MB</Badge>
                        </div>
                        
                        <div 
                            className="border-2 border-dashed rounded-3xl p-10 flex flex-col items-center justify-center text-center gap-4 bg-muted/10 hover:bg-muted/20 transition-all cursor-pointer relative"
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <Upload className="h-10 w-10 text-muted-foreground opacity-40" />
                            <div>
                                <p className="font-bold text-sm">RG, CNH ou Extrato de Empréstimos</p>
                                <p className="text-[10px] text-muted-foreground uppercase mt-1">Toque para abrir a câmera ou galeria</p>
                            </div>
                            <input 
                                type="file" 
                                ref={fileInputRef} 
                                multiple 
                                className="hidden" 
                                accept="image/*,application/pdf"
                                onChange={handleFileUpload}
                            />
                        </div>

                        {isUploading && (
                            <div className="space-y-2">
                                <div className="flex justify-between text-[10px] font-black uppercase">
                                    <span>Enviando arquivos...</span>
                                    <span>{Math.round(uploadProgress)}%</span>
                                </div>
                                <Progress value={uploadProgress} className="h-1.5" />
                            </div>
                        )}

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {attachments.map((doc, idx) => (
                                <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-white border shadow-sm animate-in zoom-in-95">
                                    <div className="flex items-center gap-2 overflow-hidden">
                                        <div className="h-8 w-8 bg-zinc-100 rounded flex items-center justify-center shrink-0">
                                            <FileText className="h-4 w-4 text-zinc-400" />
                                        </div>
                                        <span className="text-[10px] font-bold truncate pr-2 uppercase">{doc.name}</span>
                                    </div>
                                    <Button 
                                        type="button" 
                                        variant="ghost" 
                                        size="icon" 
                                        className="h-8 w-8 text-red-500 hover:bg-red-50 rounded-full"
                                        onClick={() => removeAttachment(idx)}
                                    >
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="bg-orange-500/5 p-4 rounded-2xl border border-orange-500/10 flex items-start gap-3">
                        <Info className="h-4 w-4 text-orange-600 mt-0.5 shrink-0" />
                        <p className="text-[10px] text-orange-700 leading-relaxed font-medium">
                            <strong>Proteção de Dados:</strong> Suas informações são tratadas conforme a LGPD e enviadas diretamente para o nosso sistema seguro. Nunca compartilhamos seus dados com terceiros não autorizados.
                        </p>
                    </div>

                    <Button 
                        type="submit" 
                        disabled={isSubmitting || isUploading}
                        className="w-full h-14 rounded-full bg-primary hover:bg-primary/90 text-white font-black uppercase tracking-widest shadow-xl shadow-primary/20 transition-all text-sm"
                    >
                        {isSubmitting ? (
                            <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Processando Ficha...</>
                        ) : (
                            'Enviar Dados com Segurança'
                        )}
                    </Button>
                </form>
            </CardContent>
        </Card>
        
        <div className="mt-10 mb-20 text-center">
            <p className="text-[10px] font-black uppercase text-zinc-400 tracking-[0.3em]">Ambiente Protegido por LK RAMOS</p>
        </div>
    </div>
  );
}
