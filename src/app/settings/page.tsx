
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { AppLayout } from '@/components/app-layout';
import { PageHeader } from '@/components/page-header';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Accordion } from '@/components/ui/accordion';
import {
  productTypes as initialProductTypes,
  proposalStatuses as initialProposalStatuses,
  approvingBodies as initialApprovingBodies,
  banks as initialBanks,
  commissionStatuses as initialCommissionStatuses,
  expenseCategories as initialExpenseCategories,
} from '@/lib/config-data';
import { 
    ListChecks, 
    Palette, 
    UserCog, 
    Database, 
    FileDown, 
    Loader2, 
    CloudUpload, 
    Monitor, 
    Upload, 
    X, 
    Sparkles,
    Eye,
    Zap,
    Layout,
    Type,
    MoveHorizontal,
    MousePointer2,
    Shapes
} from 'lucide-react';
import { EditableList } from '@/components/settings/editable-list';
import { BankEditableList } from '@/components/settings/bank-editable-list';
import { useUser, useFirestore, useDoc, useMemoFirebase, useCollection } from '@/firebase';
import { doc, setDoc, collection, query, where } from 'firebase/firestore';
import type { UserSettings, Customer, Proposal } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ThemeColors } from '@/components/settings/theme-colors';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { useTheme } from '@/components/theme-provider';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';

const DRIVE_LINKED_KEY = 'lk-ramos-google-drive-linked-v1';

export default function SettingsPage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const { 
    radius, setRadius, 
    sidebarStyle, setSidebarStyle,
    containerStyle, setContainerStyle,
    backgroundTexture, setBackgroundTexture,
    colorIntensity, setColorIntensity,
    animationStyle, setAnimationStyle,
    fontStyle, setFontStyle,
    setColorTheme,
    colorTheme
  } = useTheme();
  
  const [isExporting, setIsExporting] = useState(false);
  const [isLinkingDrive, setIsLinkingDrive] = useState(false);
  const [isDriveLinked, setIsDriveLinked] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [isMotionTestActive, setIsMotionTestActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem(DRIVE_LINKED_KEY);
    if (saved === 'true') setIsDriveLinked(true);
  }, []);

  const settingsDocRef = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return doc(firestore, 'userSettings', user.uid);
  }, [firestore, user]);

  const { data: userSettings, isLoading: isSettingsLoading } = useDoc<UserSettings>(settingsDocRef);

  const customersQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, 'customers'), where('ownerId', '==', user.uid));
  }, [firestore, user]);

  const proposalsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, 'loanProposals'), where('ownerId', '==', user.uid));
  }, [firestore, user]);

  const { data: allCustomers } = useCollection<Customer>(customersQuery);
  const { data: allProposals } = useCollection<Proposal>(proposalsQuery);

  const [productTypes, setProductTypes] = useState([...initialProductTypes]);
  const [proposalStatuses, setProposalStatuses] = useState([...initialProposalStatuses]);
  const [commissionStatuses, setCommissionStatuses] = useState([...initialCommissionStatuses]);
  const [approvingBodies, setApprovingBodies] = useState([...initialApprovingBodies]);
  const [expenseCategories, setExpenseCategories] = useState([...initialExpenseCategories]);
  const [banks, setBanks] = useState([...initialBanks]);
  const [bankDomains, setBankDomains] = useState<Record<string, string>>({});
  const [showBankLogos, setShowBankLogos] = useState(true);

  useEffect(() => {
    if (userSettings) {
      setProductTypes(userSettings.productTypes || [...initialProductTypes]);
      setProposalStatuses(userSettings.proposalStatuses || [...initialProposalStatuses]);
      setCommissionStatuses(userSettings.commissionStatuses || [...initialCommissionStatuses]);
      setApprovingBodies(userSettings.approvingBodies || [...initialApprovingBodies]);
      setExpenseCategories(userSettings.expenseCategories || [...initialExpenseCategories]);
      setBanks(userSettings.banks || [...initialBanks]);
      setBankDomains(userSettings.bankDomains || {});
      setShowBankLogos(userSettings.showBankLogos ?? true);
    }
  }, [userSettings]);

  const updateSettings = async (updatedLists: Partial<UserSettings>) => {
    if (settingsDocRef) {
      try {
        await setDoc(settingsDocRef, updatedLists, { merge: true });
        toast({ title: "Configurações Salvas", description: "Suas alterações foram salvas com sucesso." });
      } catch (error) {
        toast({ variant: "destructive", title: "Erro ao Salvar" });
      }
    }
  };

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setIsUploadingLogo(true);
      const reader = new FileReader();
      reader.onloadend = async () => {
        const dataUrl = reader.result as string;
        await updateSettings({ customLogoURL: dataUrl });
        setIsUploadingLogo(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveLogo = async () => {
    await updateSettings({ customLogoURL: '' });
  };

  const handleMotionTest = () => {
    setIsMotionTestActive(true);
    setTimeout(() => setIsMotionTestActive(false), 1500);
  };

  const handleGlobalBackup = async () => {
    if (!allCustomers || !allProposals) return;
    setIsExporting(true);
    try {
        const { utils, writeFile } = await import('xlsx');
        const customerData = allCustomers.map(c => ({
            ID: c.numericId, Nome: c.name, CPF: c.cpf, Telefone: c.phone, Nascimento: c.birthDate
        }));
        const proposalData = allProposals.map(p => ({
            Proposta: p.proposalNumber, Produto: p.product, Status: p.status, Valor: p.grossAmount
        }));
        const wb = utils.book_new();
        utils.book_append_sheet(wb, utils.json_to_sheet(customerData), 'Clientes');
        utils.book_append_sheet(wb, utils.json_to_sheet(proposalData), 'Propostas');
        writeFile(wb, `BACKUP_LK_RAMOS_${format(new Date(), 'dd_MM_yyyy')}.xlsx`);
        toast({ title: "Backup Concluído!" });
    } catch (error) {
        toast({ variant: "destructive", title: "Erro no Backup" });
    } finally {
        setIsExporting(false);
    }
  };

  const handleLinkGoogleDrive = () => {
    setIsLinkingDrive(true);
    setTimeout(() => {
        setIsLinkingDrive(false);
        setIsDriveLinked(true);
        localStorage.setItem(DRIVE_LINKED_KEY, 'true');
        toast({ title: "Simulação: Google Drive Vinculado!" });
    }, 1500);
  };

  const isLoading = isUserLoading || isSettingsLoading;

  const fontOptions = [
    { id: 'moderno', label: 'Moderna (Sans)' },
    { id: 'classico', label: 'Clássica (Serif)' },
    { id: 'mono', label: 'Técnica (Mono)' },
    { id: 'arredondado', label: 'Suave (Rounded)' },
    { id: 'condensado', label: 'Focada (Narrow)' },
    { id: 'business', label: 'Business (Clean)' },
    { id: 'elegante', label: 'Elegante' },
    { id: 'geometrico', label: 'Geométrica' },
    { id: 'tecnico', label: 'Técnico' },
    { id: 'minimalista', label: 'Minimalista' },
    { id: 'futurista', label: 'Futurista' },
    { id: 'robusto', label: 'Robusta (Bold)' },
    { id: 'editorial', label: 'Editorial' },
    { id: 'suico', label: 'Suíço (Swiss)' },
    { id: 'academico', label: 'Acadêmico' },
    { id: 'industrial', label: 'Industrial' },
    { id: 'digital', label: 'Digital' },
    { id: 'real', label: 'Real (Times)' },
    { id: 'suave', label: 'Suave (Ubuntu)' },
    { id: 'sharp', label: 'Sharp (Sharp Sans)' }
  ];

  return (
    <AppLayout>
      <PageHeader title="Configurações de Elite" />
        <Tabs defaultValue="lists">
            <TabsList className="mb-4">
                <TabsTrigger value="lists"><ListChecks className="mr-2 h-4 w-4" /> Opções</TabsTrigger>
                <TabsTrigger value="appearance"><Palette className="mr-2 h-4 w-4" /> Aparência</TabsTrigger>
                <TabsTrigger value="data"><Database className="mr-2 h-4 w-4" /> Dados & Backup</TabsTrigger>
                <TabsTrigger value="account"><UserCog className="mr-2 h-4 w-4" /> Conta</TabsTrigger>
            </TabsList>
            <TabsContent value="lists">
                <Card>
                    <CardHeader>
                        <CardTitle>Gerenciamento de Opções</CardTitle>
                        <CardDescription>Ajuste as listas de produtos, bancos e status.</CardDescription>
                    </CardHeader>
                    <CardContent>
                    {isLoading ? <div className="space-y-4"><Skeleton className="h-12 w-full" /><Skeleton className="h-12 w-full" /></div> : (
                        <Accordion type="multiple" className="w-full space-y-4">
                        <EditableList title="Tipos de Produto" items={productTypes} setItems={(n) => { setProductTypes(n); updateSettings({ productTypes: n }); }} />
                        <EditableList title="Status da Proposta" items={proposalStatuses} setItems={(n) => { setProposalStatuses(n); updateSettings({ proposalStatuses: n }); }} />
                        <EditableList title="Status da Comissão" items={commissionStatuses} setItems={(n) => { setCommissionStatuses(n); updateSettings({ commissionStatuses: n }); }} />
                        <EditableList title="Órgãos Aprovadores" items={approvingBodies} setItems={(n) => { setApprovingBodies(n); updateSettings({ approvingBodies: n }); }} />
                        <EditableList title="Categorias de Despesas (DRE)" items={expenseCategories} setItems={(n) => { setExpenseCategories(n); updateSettings({ expenseCategories: n }); }} />
                        
                        <BankEditableList 
                            banks={banks} 
                            bankDomains={bankDomains} 
                            onUpdate={(newBanks, newDomains) => {
                                setBanks(newBanks);
                                setBankDomains(newDomains);
                                updateSettings({ banks: newBanks, bankDomains: newDomains });
                            }} 
                        />
                        </Accordion>
                    )}
                    </CardContent>
                </Card>
            </TabsContent>
            <TabsContent value="appearance">
                 <Card>
                    <CardHeader>
                        <CardTitle>Estúdio de Branding & Aura</CardTitle>
                        <CardDescription>Personalize cada detalhe visual do seu ambiente de trabalho.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-10">
                        <div className="space-y-4">
                            <div className="flex items-center gap-2">
                                <Monitor className="h-4 w-4 text-primary" />
                                <h4 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Branding Próprio</h4>
                            </div>
                            <div className="flex items-center gap-6 p-6 border rounded-xl bg-muted/20">
                                <div className="h-24 w-24 bg-white border flex items-center justify-center rounded-lg overflow-hidden shadow-inner">
                                    {userSettings?.customLogoURL ? (
                                        <img src={userSettings.customLogoURL} alt="Logo" className="max-h-full max-w-full object-contain" />
                                    ) : (
                                        <Monitor className="h-8 w-8 text-muted-foreground opacity-20" />
                                    )}
                                </div>
                                <div className="space-y-3">
                                    <p className="text-xs text-muted-foreground max-w-xs">Sua logo aparecerá no menu lateral e em todos os relatórios PDF oficiais.</p>
                                    <div className="flex gap-2">
                                        <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleLogoUpload} />
                                        <Button size="sm" onClick={() => fileInputRef.current?.click()} disabled={isUploadingLogo}>
                                            <Upload className="h-3 w-3 mr-2" /> {userSettings?.customLogoURL ? 'Trocar Logo' : 'Subir Logo'}
                                        </Button>
                                        {userSettings?.customLogoURL && (
                                            <Button size="sm" variant="ghost" className="text-destructive" onClick={handleRemoveLogo}>
                                                <X className="h-3 w-3 mr-2" /> Remover
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <Separator />

                        <div className="space-y-6">
                            <ThemeColors />
                            <div className="space-y-4">
                                <div className="flex items-center gap-2">
                                    <Sparkles className="h-4 w-4 text-primary" />
                                    <h4 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Intensidade das Cores</h4>
                                </div>
                                <RadioGroup value={colorIntensity} onValueChange={(val) => { setColorIntensity(val); updateSettings({ colorIntensity: val as any }); }} className="grid grid-cols-2 gap-2 max-w-sm">
                                    <Label htmlFor="i-sobrio" className={cn("flex items-center justify-center rounded-md border-2 p-3 cursor-pointer transition-all", colorIntensity === 'sobrio' ? "border-primary bg-primary/5" : "border-muted hover:border-primary/30")}>
                                        <RadioGroupItem value="sobrio" id="i-sobrio" className="sr-only" />
                                        <span className="text-xs font-bold">Sóbria (Executiva)</span>
                                    </Label>
                                    <Label htmlFor="i-vibrante" className={cn("flex items-center justify-center rounded-md border-2 p-3 cursor-pointer transition-all", colorIntensity === 'vibrante' ? "border-primary bg-primary/5" : "border-muted hover:border-primary/30")}>
                                        <RadioGroupItem value="vibrante" id="i-vibrante" className="sr-only" />
                                        <span className="text-xs font-bold">Vibrante (Moderna)</span>
                                    </Label>
                                </RadioGroup>
                            </div>
                        </div>
                        
                        <Separator />

                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Eye className="h-4 w-4 text-primary" />
                                    <h4 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Laboratório de Visualização</h4>
                                </div>
                                <Button size="sm" variant="outline" className="h-8 font-bold text-[10px] uppercase" onClick={handleMotionTest}>
                                    <MousePointer2 className="mr-2 h-3 w-3" /> Testar Interação & Ritmo
                                </Button>
                            </div>
                            
                            <div className={cn(
                                "relative p-8 rounded-2xl border bg-background overflow-hidden min-h-[350px] flex items-center justify-center transition-all",
                                `texture-${backgroundTexture} texture-preview-bg`,
                                `anim-${animationStyle}`,
                                `font-${fontStyle}`,
                                `theme-${colorTheme}`
                            )}>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-2xl relative z-10">
                                    <Card className={cn(
                                        "shadow-lg transition-all texture-preview-box",
                                        `style-${containerStyle}`,
                                        isMotionTestActive && "translate-y-[-20px] scale-[1.05] opacity-50 rotate-1"
                                    )}>
                                        <CardHeader className="pb-2">
                                            <CardTitle className="text-sm font-bold flex items-center gap-2">
                                                <Zap className="h-4 w-4 text-primary" /> Demonstração de Design
                                            </CardTitle>
                                            <CardDescription className="text-[10px] uppercase tracking-wider">Aura & Ritmo Operacional</CardDescription>
                                        </CardHeader>
                                        <CardContent className="space-y-4">
                                            <p className="text-xs text-muted-foreground leading-relaxed">Este simulador reflete instantaneamente suas escolhas de Aura, Tipografia, Motion e Cores.</p>
                                            <div className="flex flex-wrap gap-2">
                                                <Badge className="font-bold">Badge Principal</Badge>
                                                {isMotionTestActive && (
                                                    <Badge variant="outline" className="border-primary text-primary font-bold animate-in zoom-in slide-in-from-bottom-2 duration-500">
                                                        Novo Trâmite!
                                                    </Badge>
                                                )}
                                            </div>
                                            <Progress value={isMotionTestActive ? 100 : 65} className="h-1.5 transition-all" />
                                        </CardContent>
                                    </Card>

                                    <div className="space-y-4 flex flex-col justify-center">
                                        <div className="space-y-2">
                                            <Label className="text-[10px] uppercase font-black tracking-widest text-muted-foreground">Interação Dinâmica</Label>
                                            <div className="flex gap-2">
                                                <Button size="sm" className={cn("font-bold transition-all", isMotionTestActive && "scale-110")}>Primário</Button>
                                                <Button size="sm" variant="outline" className="font-bold">Contorno</Button>
                                            </div>
                                        </div>
                                        <div className={cn(
                                            "p-4 bg-primary/5 border border-primary/10 rounded-xl transition-all",
                                            isMotionTestActive && "translate-x-4 shadow-xl"
                                        )}>
                                            <div className="flex items-center gap-3">
                                                <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-white font-bold text-xs shadow-sm">LK</div>
                                                <div>
                                                    <p className="text-xs font-bold">Interface Premium</p>
                                                    <p className="text-[9px] text-muted-foreground uppercase font-black">Performance Industrial</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <p className="text-[10px] text-center text-muted-foreground italic">Use o botão "Testar Interação" acima para sentir o ritmo das animações escolhidas.</p>
                        </div>

                        <Separator />

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                            <div className="space-y-4">
                                <div className="flex items-center gap-2">
                                    <Shapes className="h-4 w-4 text-primary" />
                                    <h4 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Aura Visual (Containers)</h4>
                                </div>
                                <RadioGroup value={containerStyle} onValueChange={(val) => { setContainerStyle(val as any); updateSettings({ containerStyle: val as any }); }} className="grid grid-cols-2 gap-2">
                                    {[
                                        { id: 'moderno', label: 'Padrão' },
                                        { id: 'glass', label: 'Glassmorphism' },
                                        { id: 'deep', label: 'Profundo' },
                                        { id: 'flat', label: 'Minimalista' }
                                    ].map((s) => (
                                        <Label key={s.id} htmlFor={`s-${s.id}`} className={cn("flex items-center justify-center rounded-md border-2 p-3 cursor-pointer capitalize text-xs font-bold transition-all", containerStyle === s.id ? "border-primary bg-primary/5" : "border-muted hover:border-primary/30")}>
                                            <RadioGroupItem value={s.id} id={`s-${s.id}`} className="sr-only" />
                                            {s.label}
                                        </Label>
                                    ))}
                                </RadioGroup>
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-center gap-2">
                                    <Monitor className="h-4 w-4 text-primary" />
                                    <h4 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Arredondamento</h4>
                                </div>
                                <RadioGroup value={radius} onValueChange={(val) => { setRadius(val as any); updateSettings({ radius: val as any } as any); }} className="grid grid-cols-3 gap-2">
                                    {['executivo', 'moderno', 'suave'].map((r) => (
                                        <Label key={r} htmlFor={`r-${r}`} className={cn("flex items-center justify-center rounded-md border-2 p-3 cursor-pointer capitalize text-xs font-bold transition-all", radius === r ? "border-primary bg-primary/5" : "border-muted hover:border-primary/30")}>
                                            <RadioGroupItem value={r} id={`r-${r}`} className="sr-only" />
                                            {r}
                                        </Label>
                                    ))}
                                </RadioGroup>
                            </div>
                        </div>

                        <Separator />

                        <div className="space-y-6">
                            <div className="flex items-center gap-2">
                                <Type className="h-4 w-4 text-primary" />
                                <h4 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Estúdio de Tipografia (20 Estilos Premium)</h4>
                            </div>
                            <RadioGroup value={fontStyle} onValueChange={(val) => { setFontStyle(val); updateSettings({ fontStyle: val }); }} className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3">
                                {fontOptions.map((f) => (
                                    <Label key={f.id} htmlFor={`f-${f.id}`} className={cn("flex items-center justify-center rounded-md border-2 p-4 cursor-pointer text-xs font-bold transition-all text-center h-24", fontStyle === f.id ? "border-primary bg-primary/5" : "border-muted hover:border-primary/30")}>
                                        <RadioGroupItem value={f.id} id={`f-${f.id}`} className="sr-only" />
                                        <div className="flex flex-col gap-1">
                                            <span className={cn("text-xl", `font-${f.id}`)}>Aa</span>
                                            <span className="leading-tight">{f.label}</span>
                                        </div>
                                    </Label>
                                ))}
                            </RadioGroup>
                        </div>

                        <Separator />

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                            <div className="space-y-4">
                                <div className="flex items-center gap-2">
                                    <MoveHorizontal className="h-4 w-4 text-primary" />
                                    <h4 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Motion Design (Animações)</h4>
                                </div>
                                <RadioGroup value={animationStyle} onValueChange={(val) => { setAnimationStyle(val as any); updateSettings({ animationStyle: val as any }); }} className="grid grid-cols-3 gap-2">
                                    {[
                                        { id: 'estatico', label: 'Estático' },
                                        { id: 'sutil', label: 'Sutil' },
                                        { id: 'cinematografico', label: 'Cine' }
                                    ].map((a) => (
                                        <Label key={a.id} htmlFor={`a-${a.id}`} className={cn("flex items-center justify-center rounded-md border-2 p-3 cursor-pointer capitalize text-xs font-bold transition-all", animationStyle === a.id ? "border-primary bg-primary/5" : "border-muted hover:border-primary/30")}>
                                            <RadioGroupItem value={a.id} id={`a-${a.id}`} className="sr-only" />
                                            {a.label}
                                        </Label>
                                    ))}
                                </RadioGroup>
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-center gap-2">
                                    <Database className="h-4 w-4 text-primary" />
                                    <h4 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Textura de Fundo</h4>
                                </div>
                                <RadioGroup value={backgroundTexture} onValueChange={(val) => { setBackgroundTexture(val as any); updateSettings({ backgroundTexture: val as any }); }} className="grid grid-cols-2 gap-2">
                                    {[
                                        { id: 'none', label: 'Liso' },
                                        { id: 'dots', label: 'Pontos' },
                                        { id: 'grid', label: 'Grelha' },
                                        { id: 'lines', label: 'Linhas' }
                                    ].map((t) => (
                                        <Label key={t.id} htmlFor={`t-${t.id}`} className={cn("flex items-center justify-center rounded-md border-2 p-3 cursor-pointer capitalize text-xs font-bold transition-all", backgroundTexture === t.id ? "border-primary bg-primary/5" : "border-muted hover:border-primary/30")}>
                                            <RadioGroupItem value={t.id} id={`t-${t.id}`} className="sr-only" />
                                            {t.label}
                                        </Label>
                                    ))}
                                </RadioGroup>
                            </div>
                        </div>

                        <Separator />

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                            <div className="space-y-4">
                                <div className="flex items-center gap-2">
                                    <Layout className="h-4 w-4 text-primary" />
                                    <h4 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Barra Lateral</h4>
                                </div>
                                <RadioGroup value={sidebarStyle} onValueChange={(val) => { setSidebarStyle(val as any); updateSettings({ sidebarStyle: val as any } as any); }} className="grid grid-cols-3 gap-2">
                                    {['default', 'dark', 'light'].map((s) => (
                                        <Label key={s} htmlFor={`sid-${s}`} className={cn("flex items-center justify-center rounded-md border-2 p-3 cursor-pointer capitalize text-xs font-bold transition-all", sidebarStyle === s ? "border-primary bg-primary/5" : "border-muted hover:border-primary/30")}>
                                            <RadioGroupItem value={s} id={`sid-${s}`} className="sr-only" />
                                            {s === 'default' ? 'Padrão' : s}
                                        </Label>
                                    ))}
                                </RadioGroup>
                            </div>

                            <div className="flex items-center justify-between p-4 border rounded-xl bg-muted/30">
                                <div className="space-y-1">
                                    <p className="text-sm font-bold">Logotipos dos Bancos</p>
                                    <p className="text-xs text-muted-foreground">Exibe o ícone visual de cada banco nas tabelas e formulários.</p>
                                </div>
                                <Switch checked={showBankLogos} onCheckedChange={(val) => { setShowBankLogos(val); updateSettings({ showBankLogos: val }); }} />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </TabsContent>
            <TabsContent value="data">
                <Card>
                    <CardHeader><CardTitle>Dados & Segurança</CardTitle></CardHeader>
                    <CardContent className="space-y-6">
                        <Button onClick={handleGlobalBackup} disabled={isExporting || isLoading} className="w-full">
                            {isExporting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <FileDown className="h-4 w-4 mr-2" />} Baixar Backup (Excel)
                        </Button>
                        <div className={cn("p-4 border rounded-lg", isDriveLinked ? "bg-green-50" : "bg-blue-50")}>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2"><CloudUpload className="h-4 w-4" /><p className="text-sm font-bold">Backup Google Drive</p></div>
                                <Button onClick={handleLinkGoogleDrive} disabled={isLinkingDrive || isDriveLinked} variant="outline">{isDriveLinked ? 'Vinculado' : 'Vincular'}</Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </TabsContent>
            <TabsContent value="account">
                 <Card><CardHeader><CardTitle>Minha Conta</CardTitle></CardHeader><CardContent><Link href="/profile"><Button>Ir para Meu Perfil</Button></Link></CardContent></Card>
            </TabsContent>
        </Tabs>
    </AppLayout>
  );
}
