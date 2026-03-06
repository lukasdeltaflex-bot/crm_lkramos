'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
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
    AlertTriangle,
    CircleDollarSign,
    Target,
    FileCheck,
    Home,
    MapPin,
    Mail,
    Hash,
    Zap
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { validateCPF, handlePhoneMask, cleanFirestoreData, cn, formatCurrencyInput } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { parse, isValid as isValidDate, isBefore, startOfToday, differenceInYears } from 'date-fns';

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
    grossSalary: 0,
    requestedAmount: 0,
    maxInstallment: 0,
    intentType: '',
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
  const [uploadingCategory, setUploadingCategory] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isFetchingCep, setIsFetchingCep] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const settingsDocRef = useMemoFirebase(() => {
    if (!uid || !firestore) return null;
    return doc(firestore, 'userSettings', uid);
  }, [firestore, uid]);

  const { data: userSettings, isLoading: loadingSettings } = useDoc<UserSettings>(settingsDocRef);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    let { name, value } = e.target;
    
    // 💰 LÓGICA DE MOEDA (IGUAL AO CADASTRO DE CLIENTES)
    if (['grossSalary', 'requestedAmount', 'maxInstallment'].includes(name)) {
        const val = value.replace(/\D/g, "");
        const num = val ? parseInt(val) / 100 : 0;
        setFormData(prev => ({ ...prev, [name]: num }));
        return;
    }

    if (name === 'cpf') {
        let v = value.replace(/\D/g, "");
        if (v.length > 11) v = v.substring(0, 11);
        if (v.length > 9) v = v.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
        else if (v.length > 6) v = v.replace(/(\d{3})(\d{3})(\d{0,3})/, "$1.$2.$3");
        else if (v.length > 3) v = v.replace(/(\d{3})(\d{0,3})/, "$1.$2");
        value = v;
    }
    
    if (name === 'phone') {
        value = handlePhoneMask(value);
    }
    
    if (name === 'birthDate') {
        let v = value.replace(/\D/g, "");
        if (v.length > 8) v = v.substring(0, 8);
        if (v.length > 4) v = v.replace(/(\d{2})(\d{2})(\d{0,4})/, "$1/$2/$3");
        else if (v.length > 2) v = v.replace(/(\d{2})(\d{0,2})/, "$1/$2");
        value = v;
    }
    
    if (name === 'cep') {
        let v = value.replace(/\D/g, "");
        if (v.length > 8) v = v.substring(0, 8);
        if (v.length > 5) v = v.replace(/(\d{5})(\d{0,3})/, "$1-$2");
        value = v;
    }
    
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const isCpfValid = useMemo(() => {
    if (formData.cpf.length < 14) return null;
    return validateCPF(formData.cpf);
  }, [formData.cpf]);

  const isBirthDateValid = useMemo(() => {
    if (formData.birthDate.length < 10) return null;
    try {
        const parsed = parse(formData.birthDate, 'dd/MM/yyyy', new Date());
        return isValidDate(parsed) && isBefore(parsed, startOfToday());
    } catch { return false; }
  }, [formData.birthDate]);

  const calculatedAge = useMemo(() => {
    if (formData.birthDate.length < 10) return null;
    try {
        const parsed = parse(formData.birthDate, 'dd/MM/yyyy', new Date());
        if (isValidDate(parsed) && isBefore(parsed, startOfToday())) {
            return differenceInYears(new Date(), parsed);
        }
    } catch { return null; }
    return null;
  }, [formData.birthDate]);

  const isFormValid = formData.name.split(' ').length >= 2 && 
                      isCpfValid === true && 
                      isBirthDateValid === true && 
                      formData.phone.length >= 14;

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

  const uploadFile = async (file: File, category: string): Promise<Attachment | null> => {
    if (!storage) throw new Error('O serviço de armazenamento não está disponível.');

    const timestamp = Date.now();
    const cleanName = file.name.replace(/[^a-zA-Z0-9.]/g, '_');
    const filePath = `leads_temp/${uid}/${category}/${timestamp}_${cleanName}`;
    const storageRef = ref(storage, filePath);
    
    const uploadTask = uploadBytesResumable(storageRef, file);

    return new Promise((resolve, reject) => {
        uploadTask.on('state_changed', 
            (snapshot) => {
                const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                setUploadProgress(progress || 0);
            },
            (error) => reject(error),
            async () => {
                try {
                    const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                    resolve({
                        name: file.name,
                        url: downloadURL,
                        type: file.type,
                        size: file.size,
                        category: category
                    });
                } catch (err) { reject(err); }
            }
        );
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, category: string) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadingCategory(category);
    setUploadProgress(0);
    const MAX_SIZE = 5 * 1024 * 1024;

    for (const file of Array.from(files)) {
        if (file.size > MAX_SIZE) {
            toast({ variant: 'destructive', title: 'Arquivo muito grande', description: `${file.name} excede 5MB.` });
            continue;
        }

        try {
            const attachment = await uploadFile(file, category);
            if (attachment) {
                setAttachments(prev => [...prev, attachment]);
            }
        } catch (err: any) {
            toast({ variant: 'destructive', title: 'Falha no envio', description: "Erro ao salvar arquivo. Tente novamente." });
            break;
        }
    }
    setUploadingCategory(null);
    setUploadProgress(0);
    if (e.target) e.target.value = '';
  };

  const removeAttachment = (url: string) => {
    setAttachments(prev => prev.filter(att => att.url !== url));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firestore || !uid) return;

    if (!isFormValid) {
        toast({ variant: 'destructive', title: 'Dados Inválidos', description: 'Por favor, revise os campos marcados em vermelho.' });
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
            ...formData,
            id: leadId,
            ownerId: uid,
            name: formData.name.toUpperCase(),
            birthDate: birthIso || formData.birthDate,
            grossSalary: Number(formData.grossSalary) || 0,
            requestedAmount: Number(formData.requestedAmount) || 0,
            maxInstallment: Number(formData.maxInstallment) || 0,
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
    return <div className="min-h-screen flex items-center justify-center bg-background p-6"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  if (isSuccess) {
    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-6">
            <Card className="max-w-md w-full border-2 border-green-100 shadow-2xl rounded-[2.5rem] overflow-hidden text-center p-10 space-y-6">
                <div className="h-20 w-20 bg-green-100 rounded-full flex items-center justify-center mx-auto"><CheckCircle2 className="h-10 w-10 text-green-600" /></div>
                <div className="space-y-2">
                    <h2 className="text-2xl font-black uppercase tracking-tight text-foreground">Recebido!</h2>
                    <p className="text-muted-foreground font-medium">Seus dados foram enviados com sucesso. Nossa equipe entrará em contato em breve.</p>
                </div>
                <div className="pt-4"><p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">LK RAMOS INVESTIMENTOS</p></div>
            </Card>
        </div>
    );
  }

  const getAttachmentsByCategory = (cat: string) => attachments.filter(a => a.category === cat);

  return (
    <div className="min-h-screen bg-muted/30 p-4 md:p-10 flex flex-col items-center">
        <div className="mb-10 text-center space-y-6 w-full max-w-sm">
            {userSettings?.customLogoURL ? (
                <div className="h-24 flex items-center justify-center animate-in fade-in zoom-in duration-700">
                    <img src={userSettings.customLogoURL} alt="Logo" className="max-h-full max-w-full object-contain drop-shadow-xl" />
                </div>
            ) : (
                <div className="h-16 w-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto border-2 border-primary/20"><ShieldCheck className="h-8 w-8 text-primary" /></div>
            )}
            <div className="space-y-1">
                <h1 className="text-2xl font-black uppercase tracking-tighter">Portal do Cliente</h1>
                <p className="text-[10px] text-muted-foreground uppercase font-black tracking-[0.25em] opacity-60">Ambiente Seguro e Criptografado</p>
            </div>
        </div>

        <Card className="max-w-3xl w-full border-none shadow-2xl rounded-[2rem] overflow-hidden">
            <CardHeader className="bg-primary/5 border-b border-primary/10 p-8">
                <CardTitle className="text-lg font-black uppercase flex items-center gap-3 text-primary"><FileText className="h-5 w-5" />Ficha Cadastral Online</CardTitle>
                <CardDescription className="text-xs font-medium">Preencha os campos abaixo para iniciar sua simulação de crédito.</CardDescription>
            </CardHeader>
            <CardContent className="p-8">
                <form onSubmit={handleSubmit} className="space-y-12">
                    
                    <div className="space-y-6">
                        <h3 className="text-sm font-black uppercase text-primary flex items-center gap-2"><User className="h-4 w-4" /> Dados Pessoais</h3>
                        <div className="grid gap-6">
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase text-muted-foreground">Nome Completo *</Label>
                                <Input name="name" required placeholder="Conforme seu documento de identidade" className="h-12 rounded-xl font-bold" value={formData.name} onChange={handleInputChange} />
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase text-muted-foreground">CPF *</Label>
                                    <div className="relative">
                                        <Input 
                                            name="cpf" 
                                            required 
                                            placeholder="000.000.000-00" 
                                            className={cn(
                                                "h-12 rounded-xl font-bold transition-all", 
                                                isCpfValid === false && "border-red-500 bg-red-50 ring-2 ring-red-200",
                                                isCpfValid === true && "border-green-500 bg-green-50"
                                            )} 
                                            value={formData.cpf} 
                                            onChange={handleInputChange} 
                                        />
                                        {isCpfValid === false && <AlertTriangle className="absolute right-4 top-3.5 h-5 w-5 text-red-500 animate-pulse" />}
                                        {isCpfValid === true && <CheckCircle2 className="absolute right-4 top-3.5 h-5 w-5 text-green-500" />}
                                    </div>
                                    {isCpfValid === false && <p className="text-[10px] font-bold text-red-600 uppercase mt-1">CPF Inválido. Verifique os dígitos.</p>}
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase text-muted-foreground flex items-center justify-between">
                                        Data de Nascimento *
                                        {calculatedAge !== null && (
                                            <Badge variant="outline" className="h-5 text-[9px] font-black border-primary/30 text-primary">
                                                {calculatedAge} ANOS
                                            </Badge>
                                        )}
                                    </Label>
                                    <div className="relative">
                                        <Input 
                                            name="birthDate" 
                                            required 
                                            placeholder="DD/MM/AAAA" 
                                            className={cn(
                                                "h-12 rounded-xl font-bold transition-all", 
                                                isBirthDateValid === false && "border-red-500 bg-red-50",
                                                isBirthDateValid === true && "border-green-500 bg-green-50"
                                            )} 
                                            value={formData.birthDate} 
                                            onChange={handleInputChange} 
                                        />
                                        {isBirthDateValid === false && <AlertTriangle className="absolute right-4 top-3.5 h-5 w-5 text-red-500" />}
                                    </div>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase text-muted-foreground">WhatsApp de Contato *</Label>
                                    <Input name="phone" required placeholder="(00) 00000-0000" className="h-12 rounded-xl font-bold" value={formData.phone} onChange={handleInputChange} />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase text-muted-foreground">E-mail (Opcional)</Label>
                                    <div className="relative">
                                        <Input name="email" type="email" placeholder="seu@email.com" className="h-12 rounded-xl font-bold pl-10" value={formData.email} onChange={handleInputChange} />
                                        <Mail className="absolute left-3 top-3.5 h-5 w-5 text-muted-foreground opacity-40" />
                                    </div>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase text-muted-foreground">Nº Benefício INSS (Opcional)</Label>
                                    <Input name="benefitNumber" placeholder="000.000.000-0" className="h-12 rounded-xl font-bold" value={formData.benefitNumber} onChange={handleInputChange} />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase text-muted-foreground">Salário Bruto (R$)</Label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-3.5 text-[10px] font-black opacity-30">R$</span>
                                        <Input 
                                            name="grossSalary" 
                                            type="text" 
                                            placeholder="0,00" 
                                            className="h-12 rounded-xl font-bold pl-10 text-green-600" 
                                            value={formatCurrencyInput(Number(formData.grossSalary))} 
                                            onChange={handleInputChange} 
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <Separator />

                    <div className="space-y-6">
                        <h3 className="text-sm font-black uppercase text-primary flex items-center gap-2"><MapPin className="h-4 w-4" /> Endereço Residencial</h3>
                        <div className="grid gap-6">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase text-muted-foreground">CEP *</Label>
                                    <div className="relative">
                                        <Input 
                                            name="cep" 
                                            placeholder="00000-000" 
                                            className="h-12 rounded-xl font-bold" 
                                            value={formData.cep} 
                                            onChange={handleInputChange} 
                                            maxLength={9} 
                                        />
                                        {isFetchingCep && <Loader2 className="absolute right-4 top-3.5 h-5 w-5 animate-spin text-primary" />}
                                    </div>
                                    <p className="text-[9px] font-bold text-primary uppercase flex items-center gap-1.5 mt-1 opacity-70">
                                        <Zap className="h-3 w-3 fill-current" /> Digite o CEP para preencher o endereço automaticamente.
                                    </p>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase text-muted-foreground">Bairro</Label>
                                    <Input name="neighborhood" placeholder="Seu Bairro" className="h-12 rounded-xl font-bold" value={formData.neighborhood} onChange={handleInputChange} />
                                </div>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-4 gap-6">
                                <div className="sm:col-span-3 space-y-2">
                                    <Label className="text-[10px] font-black uppercase text-muted-foreground">Rua / Logradouro</Label>
                                    <Input name="street" placeholder="Avenida, Rua, Travessa..." className="h-12 rounded-xl font-bold" value={formData.street} onChange={handleInputChange} />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase text-muted-foreground">Número</Label>
                                    <Input name="number" placeholder="123" className="h-12 rounded-xl font-bold" value={formData.number} onChange={handleInputChange} />
                                </div>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase text-muted-foreground">Complemento</Label>
                                    <Input name="complement" placeholder="Apto, Bloco, Casa..." className="h-12 rounded-xl font-bold" value={formData.complement} onChange={handleInputChange} />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase text-muted-foreground">Cidade</Label>
                                    <Input name="city" placeholder="Sua Cidade" className="h-12 rounded-xl font-bold" value={formData.city} onChange={handleInputChange} />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase text-muted-foreground">Estado (UF)</Label>
                                    <Input name="state" placeholder="SP" className="h-12 rounded-xl font-bold uppercase" value={formData.state} onChange={handleInputChange} maxLength={2} />
                                </div>
                            </div>
                        </div>
                    </div>

                    <Separator />

                    <div className="space-y-6">
                        <h3 className="text-sm font-black uppercase text-primary flex items-center gap-2"><Target className="h-4 w-4" /> O que você precisa hoje?</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                            <div className="space-y-2 sm:col-span-1">
                                <Label className="text-[10px] font-black uppercase text-muted-foreground">Tipo de Operação</Label>
                                <Select onValueChange={(val) => setFormData(p => ({...p, intentType: val}))} value={formData.intentType}>
                                    <SelectTrigger className="h-12 rounded-xl font-bold">
                                        <SelectValue placeholder="Selecione..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Antecipação FGTS">Antecipação FGTS</SelectItem>
                                        <SelectItem value="Refinanciamento">Refinanciamento</SelectItem>
                                        <SelectItem value="Portabilidade">Portabilidade</SelectItem>
                                        <SelectItem value="Margem Livre">Margem Livre (Novo)</SelectItem>
                                        <SelectItem value="Redução de Parcela">Reduzir Parcelas</SelectItem>
                                        <SelectItem value="Cartão">Cartão de Crédito</SelectItem>
                                        <SelectItem value="Outro">Apenas Simulação</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase text-muted-foreground">Valor que deseja (R$)</Label>
                                <div className="relative">
                                    <span className="absolute left-3 top-3.5 text-[10px] font-black opacity-30">R$</span>
                                    <Input 
                                        name="requestedAmount" 
                                        type="text" 
                                        placeholder="Ex: 5.000,00" 
                                        className="h-12 rounded-xl font-bold pl-10" 
                                        value={formatCurrencyInput(Number(formData.requestedAmount))} 
                                        onChange={handleInputChange} 
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase text-muted-foreground">Parcela Máxima (R$)</Label>
                                <div className="relative">
                                    <span className="absolute left-3 top-3.5 text-[10px] font-black opacity-30">R$</span>
                                    <Input 
                                        name="maxInstallment" 
                                        type="text" 
                                        placeholder="Ex: 200,00" 
                                        className="h-12 rounded-xl font-bold pl-10" 
                                        value={formatCurrencyInput(Number(formData.maxInstallment))} 
                                        onChange={handleInputChange} 
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <Separator />

                    <div className="space-y-8">
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm font-black uppercase text-primary flex items-center gap-2"><Camera className="h-4 w-4" /> Anexar Documentos (Opcional)</h3>
                            <Badge variant="outline" className="text-[9px] font-bold">Fotos ou PDF</Badge>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {[
                                { id: 'RG', label: 'RG ou CNH', icon: Camera, desc: 'Frente e Verso' },
                                { id: 'EXTRATO', label: 'Extrato Banco', icon: FileCheck, desc: 'HISCON / Meu INSS' },
                                { id: 'ENDERECO', label: 'Residência', icon: Home, desc: 'Luz, Água ou Telefone' }
                            ].map((cat) => {
                                const files = getAttachmentsByCategory(cat.id);
                                const isUploading = uploadingCategory === cat.id;

                                return (
                                    <div key={cat.id} className="space-y-3">
                                        <div 
                                            className={cn(
                                                "border-2 border-dashed rounded-2xl p-6 flex flex-col items-center justify-center text-center gap-2 transition-all cursor-pointer bg-muted/5 hover:bg-primary/[0.03] group",
                                                files.length > 0 && "border-green-500 bg-green-50/30",
                                                isUploading && "opacity-50 pointer-events-none"
                                            )}
                                            onClick={() => {
                                                setActiveCategory(cat.id);
                                                fileInputRef.current?.click();
                                            }}
                                        >
                                            <cat.icon className={cn("h-6 w-6 text-muted-foreground group-hover:text-primary transition-colors", files.length > 0 && "text-green-600")} />
                                            <div className="space-y-0.5">
                                                <p className="font-bold text-[11px] uppercase tracking-tight">{cat.label}</p>
                                                <p className="text-[9px] text-muted-foreground uppercase opacity-60 font-medium">{cat.desc}</p>
                                            </div>
                                            {isUploading && (
                                                <div className="w-full mt-2">
                                                    <Progress value={uploadProgress} className="h-1" />
                                                </div>
                                            )}
                                            {files.length > 0 && <Badge className="bg-green-600 text-white border-none text-[8px] h-4 mt-1">{files.length} OK</Badge>}
                                        </div>
                                        <div className="space-y-1">
                                            {files.map((f, i) => (
                                                <div key={i} className="flex items-center justify-between px-2 py-1 bg-white border rounded-lg text-[9px] font-bold">
                                                    <span className="truncate max-w-[100px] uppercase">{f.name}</span>
                                                    <button type="button" onClick={() => removeAttachment(f.url)} className="text-red-500"><X className="h-3 w-3" /></button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                        <input 
                            type="file" 
                            ref={fileInputRef} 
                            className="hidden" 
                            multiple
                            accept="image/*,application/pdf" 
                            onChange={(e) => activeCategory && handleFileUpload(e, activeCategory)}
                        />
                    </div>

                    <Separator />

                    <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase text-muted-foreground">Algo mais que gostaria de nos contar?</Label>
                        <textarea name="observations" className="w-full min-h-[100px] p-4 rounded-xl border-2 bg-muted/5 text-sm focus:ring-2 focus:ring-primary outline-none font-medium" placeholder="Ex: Tenho pressa para pagar uma conta..." value={formData.observations} onChange={handleInputChange} />
                    </div>

                    <div className="bg-orange-50/5 p-4 rounded-2xl border border-orange-500/10 flex items-start gap-3">
                        <Info className="h-4 w-4 text-orange-600 mt-0.5 shrink-0" />
                        <p className="text-[10px] text-orange-700 leading-relaxed font-medium">
                            Seus dados estão protegidos conforme as diretrizes da LGPD. Ao enviar, você autoriza o processamento exclusivo para fins de análise bancária.
                        </p>
                    </div>

                    <Button type="submit" disabled={isSubmitting || uploadingCategory !== null || !isFormValid} className="w-full h-14 rounded-full bg-primary hover:bg-primary/90 text-white font-black uppercase tracking-widest shadow-xl transition-all text-sm disabled:opacity-50 disabled:grayscale">
                        {isSubmitting ? <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Processando Ficha...</> : 'Finalizar e Enviar Dados'}
                    </Button>
                </form>
            </CardContent>
        </Card>
    </div>
  );
}
