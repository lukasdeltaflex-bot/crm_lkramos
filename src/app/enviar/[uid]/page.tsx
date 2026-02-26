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
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
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
    X,
    MapPin,
    AlertTriangle
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { validateCPF, handlePhoneMask, cleanFirestoreData, cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

export default function LeadCapturePage() {
  const params = useParams();
  const uid = params?.uid as string;
  const firestore = useFirestore();
  const { storage } = useFirebase();
  
  const [formData, setFormData] = useState({
    name: '',
    cpf: '',
    phone: '',
    birthDate: '',
    email: '',
    motherName: '',
    benefitNumber: '',
    cep: '',
    street: '',
    number: '',
    complement: '',
    neighborhood: '',
    city: '',
    state: '',
    observations: ''
  });
  
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isFetchingCep, setIsFetchingCep] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [infraError, setInfraError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const settingsDocRef = useMemoFirebase(() => {
    if (!uid || !firestore) return null;
    return doc(firestore, 'userSettings', uid);
  }, [firestore, uid]);

  const { data: userSettings, isLoading: loadingSettings } = useDoc<UserSettings>(settingsDocRef);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    let { name, value } = e.target;
    if (name === 'cpf') value = value.replace(/\D/g, "").replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4").substring(0, 14);
    if (name === 'phone') value = handlePhoneMask(value);
    if (name === 'birthDate') value = value.replace(/\D/g, "").replace(/(\d{2})(\d{2})(\d{4})/, "$1/$2/$3").substring(0, 10);
    if (name === 'cep') {
        value = value.replace(/\D/g, "");
        if (value.length > 5) value = value.replace(/(\d{5})(\d)/, "$1-$2");
        value = value.substring(0, 9);
    }
    
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  useEffect(() => {
    const cleanCep = formData.cep.replace(/\D/g, '');
    if (cleanCep.length === 8) {
        const fetchCep = async () => {
            setIsFetchingCep(true);
            try {
                const response = await fetch(`/api/cep/${cleanCep}`);
                if (!response.ok) throw new Error('Falha no proxy');
                const data = await response.json();
                
                if (data && !data.erro) {
                    setFormData(prev => ({
                        ...prev,
                        street: data.logradouro || '',
                        neighborhood: data.bairro || '',
                        city: data.localidade || '',
                        state: data.uf || ''
                    }));
                    toast({ title: "Endereço localizado!" });
                }
            } catch (error) {
                console.warn("Busca de CEP indisponível.");
            } finally {
                setIsFetchingCep(false);
            }
        };
        fetchCep();
    }
  }, [formData.cep]);

  const uploadFile = async (file: File): Promise<Attachment | null> => {
    if (!storage) {
        setInfraError("STORAGE_NOT_READY");
        throw new Error('storage-not-ready');
    }

    const timestamp = Date.now();
    const cleanName = file.name.replace(/[^a-zA-Z0-9.]/g, '_');
    const filePath = `leads_temp/${uid}/${timestamp}_${cleanName}`;
    const storageRef = ref(storage, filePath);
    
    const uploadTask = uploadBytesResumable(storageRef, file);

    return new Promise((resolve, reject) => {
        uploadTask.on('state_changed', 
            (snapshot) => {
                const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                setUploadProgress(progress || 0);
            },
            (error) => {
                console.error("Upload error:", error);
                if (error.code === 'storage/retry-limit-exceeded' || error.code === 'storage/unauthorized') {
                    setInfraError("CORS_OR_PERMISSION");
                }
                reject(error);
            },
            async () => {
                try {
                    const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                    resolve({
                        name: file.name,
                        url: downloadURL,
                        type: file.type,
                        size: file.size
                    });
                } catch (err) {
                    reject(err);
                }
            }
        );
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    setUploadProgress(0);
    setInfraError(null);
    const MAX_SIZE = 4 * 1024 * 1024; // 4MB para garantir sucesso na transmissão

    for (const file of Array.from(files)) {
        if (file.size > MAX_SIZE) {
            toast({ variant: 'destructive', title: 'Arquivo Excedido', description: `${file.name} é maior que 4MB.` });
            continue;
        }

        try {
            const attachment = await uploadFile(file);
            if (attachment) {
                setAttachments(prev => [...prev, attachment]);
            }
        } catch (err: any) {
            toast({ variant: 'destructive', title: 'Erro de Conexão', description: "Não foi possível enviar o arquivo para o servidor." });
            break;
        }
    }
    setIsUploading(false);
    setUploadProgress(0);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firestore || !uid) return;

    if (!formData.name.trim() || formData.name.split(' ').length < 2) {
        toast({ variant: 'destructive', title: 'Nome Incompleto', description: 'Por favour, digite seu nome completo.' });
        return;
    }

    if (!validateCPF(formData.cpf)) {
        toast({ variant: 'destructive', title: 'CPF Inválido', description: 'Verifique o CPF informado.' });
        return;
    }

    setIsSubmitting(true);
    try {
        const leadId = doc(collection(firestore, 'leads')).id;
        
        let birthIso = '';
        try {
            const parts = formData.birthDate.split('/');
            if (parts.length === 3) birthIso = `${parts[2]}-${parts[1]}-${parts[0]}`;
        } catch (e) {}

        const leadData: any = {
            id: leadId,
            ownerId: uid,
            ...formData,
            name: formData.name.toUpperCase(),
            birthDate: birthIso || formData.birthDate,
            status: 'pending',
            createdAt: new Date().toISOString(),
            documents: attachments
        };

        await setDoc(doc(firestore, 'leads', leadId), cleanFirestoreData(leadData));
        setIsSuccess(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (e) {
        toast({ variant: 'destructive', title: 'Erro ao enviar', description: 'Tente novamente em instantes.' });
    } finally {
        setIsSubmitting(false);
    }
  };

  if (loadingSettings) {
    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-6">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
    );
  }

  if (isSuccess) {
    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-6">
            <Card className="max-w-md w-full border-2 border-green-100 shadow-2xl rounded-[2.5rem] overflow-hidden text-center p-10 space-y-6">
                <div className="h-20 w-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                    <CheckCircle2 className="h-10 w-10 text-green-600" />
                </div>
                <div className="space-y-2">
                    <h2 className="text-2xl font-black uppercase tracking-tight text-foreground">Sucesso!</h2>
                    <p className="text-muted-foreground font-medium">Seus dados e documentos foram enviados. Em breve entraremos em contato.</p>
                </div>
                <div className="pt-4">
                    <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">LK RAMOS INVESTIMENTOS</p>
                </div>
            </Card>
        </div>
    );
  }

  const isCpfInvalid = formData.cpf.length === 14 && !validateCPF(formData.cpf);

  return (
    <div className="min-h-screen bg-muted/30 p-4 md:p-10 flex flex-col items-center">
        <div className="mb-10 text-center space-y-4">
            {userSettings?.customLogoURL ? (
                <img src={userSettings.customLogoURL} alt="Logo" className="h-16 mx-auto object-contain" />
            ) : (
                <div className="h-12 w-12 bg-primary/10 rounded-xl flex items-center justify-center mx-auto border-2 border-primary/20">
                    <ShieldCheck className="h-6 w-6 text-primary" />
                </div>
            )}
            <div>
                <h1 className="text-xl font-black uppercase tracking-tighter">Ficha de Cadastro</h1>
                <p className="text-xs text-muted-foreground uppercase font-bold tracking-widest opacity-60">Seguro & Criptografado</p>
            </div>
        </div>

        <Card className="max-w-3xl w-full border-none shadow-2xl rounded-[2rem] overflow-hidden">
            <CardHeader className="bg-primary/5 border-b border-primary/10 p-8">
                <CardTitle className="text-lg font-black uppercase flex items-center gap-3 text-primary">
                    <FileText className="h-5 w-5" />
                    Envio de Documentos
                </CardTitle>
                <CardDescription className="text-xs font-medium">Preencha os campos abaixo para iniciar sua análise.</CardDescription>
            </CardHeader>
            <CardContent className="p-8">
                <form onSubmit={handleSubmit} className="space-y-10">
                    
                    {infraError && (
                        <Alert variant="destructive" className="border-2 animate-pulse rounded-xl">
                            <AlertTriangle className="h-5 w-5" />
                            <AlertTitle className="font-bold uppercase text-xs">Atenção: Erro de Conexão</AlertTitle>
                            <AlertDescription className="text-xs space-y-2 mt-2">
                                <p>O servidor está recusando a conexão segura (Erro CORS).</p>
                                <p className="font-bold">Rode estes comandos no terminal para liberar:</p>
                                <code className="block bg-black text-white p-3 rounded mt-2 text-[10px] break-all leading-relaxed font-mono">
                                    {"echo '[{\"origin\": [\"*\"],\"method\": [\"GET\", \"POST\", \"PUT\", \"DELETE\", \"OPTIONS\"],\"responseHeader\": [\"Content-Type\", \"Authorization\", \"x-goog-resumable\"],\"maxAgeSeconds\": 3600}]' > cors.json"}<br/><br/>
                                    {"gsutil cors set cors.json gs://studio-248448941-9c1c2.firebasestorage.app"}
                                </code>
                            </AlertDescription>
                        </Alert>
                    )}

                    <div className="space-y-6">
                        <h3 className="text-sm font-black uppercase text-primary flex items-center gap-2">
                            <User className="h-4 w-4" /> Informações do Cliente
                        </h3>
                        <div className="grid gap-6">
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase text-muted-foreground">Nome Completo *</Label>
                                <Input name="name" required placeholder="Digite conforme documento" className="h-12 rounded-xl font-bold" value={formData.name} onChange={handleInputChange} />
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase text-muted-foreground">CPF *</Label>
                                    <div className="relative">
                                        <Input 
                                            name="cpf" 
                                            required 
                                            placeholder="000.000.000-00" 
                                            className={cn("h-12 rounded-xl font-bold", isCpfInvalid && "border-red-500 bg-red-50")} 
                                            value={formData.cpf} 
                                            onChange={handleInputChange} 
                                        />
                                        {isCpfInvalid && <AlertTriangle className="absolute right-4 top-3.5 h-5 w-5 text-red-500" />}
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase text-muted-foreground">Nascimento *</Label>
                                    <Input name="birthDate" required placeholder="DD/MM/AAAA" className="h-12 rounded-xl font-bold" value={formData.birthDate} onChange={handleInputChange} />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase text-muted-foreground">WhatsApp *</Label>
                                <Input name="phone" required placeholder="(00) 00000-0000" className="h-12 rounded-xl font-bold" value={formData.phone} onChange={handleInputChange} />
                            </div>
                        </div>
                    </div>

                    <Separator />

                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm font-black uppercase text-primary flex items-center gap-2">
                                <Camera className="h-4 w-4" /> Fotos dos Documentos (RG ou CNH)
                            </h3>
                            <Badge variant="outline" className="text-[9px] font-bold">PDF, JPG ou PNG</Badge>
                        </div>
                        
                        <div 
                            className={cn(
                                "border-2 border-dashed rounded-3xl p-10 flex flex-col items-center justify-center text-center gap-4 bg-muted/10 hover:bg-muted/20 transition-all cursor-pointer relative",
                                isUploading && "pointer-events-none opacity-50"
                            )} 
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <Upload className="h-10 w-10 text-muted-foreground opacity-40" />
                            <div>
                                <p className="font-bold text-sm">Clique para anexar</p>
                                <p className="text-[10px] text-muted-foreground uppercase mt-1">Máximo de 4MB por arquivo</p>
                            </div>
                            <input 
                                type="file" 
                                ref={fileInputRef} 
                                multiple 
                                className="hidden" 
                                accept="image/*,application/pdf" 
                                onChange={handleFileUpload} 
                                disabled={isUploading}
                            />
                        </div>

                        {isUploading && (
                            <div className="space-y-2 animate-in fade-in">
                                <div className="flex justify-between text-[10px] font-black uppercase">
                                    <span className="flex items-center gap-2">
                                        <Loader2 className="h-3 w-3 animate-spin" />
                                        Enviando...
                                    </span>
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
                                    <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:bg-red-50 rounded-full" onClick={() => removeAttachment(idx)}>
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="bg-orange-50/5 p-4 rounded-2xl border border-orange-500/10 flex items-start gap-3">
                        <Info className="h-4 w-4 text-orange-600 mt-0.5 shrink-0" />
                        <p className="text-[10px] text-orange-700 leading-relaxed font-medium">
                            Seus dados estão protegidos por criptografia de ponta a ponta e serão usados exclusivamente para fins de análise de crédito.
                        </p>
                    </div>

                    <Button type="submit" disabled={isSubmitting || isUploading || isCpfInvalid} className="w-full h-14 rounded-full bg-primary hover:bg-primary/90 text-white font-black uppercase tracking-widest shadow-xl transition-all text-sm">
                        {isSubmitting ? <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Processando...</> : 'Finalizar e Enviar'}
                    </Button>
                </form>
            </CardContent>
        </Card>
    </div>
  );
}
