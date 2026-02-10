"use client"

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
    Shapes,
    Pipette,
    Check
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
import { Input } from '@/components/ui/input';
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
import { Slider } from '@/components/ui/slider';
import { THEMES } from '@/lib/themes';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

function StatusColorPalette({ 
    activeColor, 
    onSelect, 
    isDark 
}: { 
    activeColor: string; 
    onSelect: (color: string) => void;
    isDark: boolean;
}) {
    return (
        <div className="grid grid-cols-6 gap-2 p-2 w-[280px]">
            {THEMES.map((theme) => {
                const colorValue = isDark ? theme.dark : theme.light;
                const isActive = activeColor === colorValue;
                return (
                    <button
                        key={theme.name}
                        onClick={() => onSelect(colorValue)}
                        className={cn(
                            "h-8 w-8 rounded-md border transition-all hover:scale-110 flex items-center justify-center",
                            isActive ? "border-foreground ring-2 ring-primary/30" : "border-transparent"
                        )}
                        style={{ backgroundColor: `hsl(${colorValue})` }}
                        title={theme.label}
                    >
                        {isActive && <Check className="h-4 w-4 text-white drop-shadow-sm" />}
                    </button>
                )
            })}
        </div>
    );
}

export default function SettingsPage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const { 
    radius, setRadius, 
    sidebarStyle, setSidebarStyle,
    containerStyle, setContainerStyle,
    backgroundTexture, setBackgroundTexture,
    animationStyle, setAnimationStyle,
    fontStyle, setFontStyle,
    colorTheme,
    glassIntensity, setGlassIntensity,
    statusColors, setStatusColors,
    resolvedTheme
  } = useTheme();
  
  const [isExporting, setIsExporting] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [isMotionTestActive, setIsMotionTestActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
        toast({ title: "Configurações Salvas" });
      } catch (error) {
        toast({ variant: "destructive", title: "Erro ao Salvar" });
      }
    }
  };

  const handleStatusColorChange = (status: string, color: string) => {
      const newColors = { ...statusColors, [status]: color };
      setStatusColors(newColors);
      updateSettings({ statusColors: newColors });
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

  const handleGlobalBackup = async () => {
    if (!allCustomers || !allProposals) return;
    setIsExporting(true);
    try {
        const { utils, writeFile } = await import('xlsx');
        const customerData = allCustomers.map(c => ({ Nome: c.name, CPF: c.cpf, Telefone: c.phone }));
        const wb = utils.book_new();
        utils.book_append_sheet(wb, utils.json_to_sheet(customerData), 'Clientes');
        writeFile(wb, `BACKUP_LK_RAMOS_${format(new Date(), 'dd_MM_yyyy')}.xlsx`);
        toast({ title: "Backup Concluído!" });
    } catch (error) {
        toast({ variant: "destructive", title: "Erro no Backup" });
    } finally {
        setIsExporting(false);
    }
  };

  const isLoading = isUserLoading || isSettingsLoading;

  const colorableStatuses = [
    ...proposalStatuses, 
    "Paga", "Pendente", "Parcial", // Status de Comissão
    "TOTAL DIGITADO", 
    "PRODUÇÃO DIGITADA", 
    "COMISSÃO RECEBIDA", 
    "SALDO A RECEBER", 
    "COMISSÃO ESPERADA"
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
                    {isLoading ? <div className="space-y-4"><Skeleton className="h-12 w-full" /></div> : (
                        <Accordion type="multiple" className="w-full space-y-4">
                        <EditableList title="Tipos de Produto" items={productTypes} setItems={(n) => { setProductTypes(n); updateSettings({ productTypes: n }); }} />
                        <EditableList title="Status da Proposta" items={proposalStatuses} setItems={(n) => { setProposalStatuses(n); updateSettings({ proposalStatuses: n }); }} />
                        <EditableList title="Status da Comissão" items={commissionStatuses} setItems={(n) => { setCommissionStatuses(n); updateSettings({ commissionStatuses: n }); }} />
                        <EditableList title="Órgãos Aprovadores" items={approvingBodies} setItems={(n) => { setApprovingBodies(n); updateSettings({ approvingBodies: n }); }} />
                        <EditableList title="Categorias de Despesas" items={expenseCategories} setItems={(n) => { setExpenseCategories(n); updateSettings({ expenseCategories: n }); }} />
                        <BankEditableList banks={banks} bankDomains={bankDomains} onUpdate={(b, d) => updateSettings({ banks: b, bankDomains: d })} />
                        </Accordion>
                    )}
                    </CardContent>
                </Card>
            </TabsContent>
            <TabsContent value="appearance">
                 <Card>
                    <CardHeader>
                        <CardTitle>Estúdio de Branding & Aura</CardTitle>
                        <CardDescription>Personalize cada detalhe visual do seu ambiente.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-10">
                        <div className="space-y-4">
                            <div className="flex items-center gap-2"><Monitor className="h-4 w-4 text-primary" /><h4 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Branding Próprio</h4></div>
                            <div className="flex items-center gap-6 p-6 border rounded-xl bg-muted/20">
                                <div className="h-24 w-24 bg-white border flex items-center justify-center rounded-lg overflow-hidden shadow-inner">
                                    {userSettings?.customLogoURL ? <img src={userSettings.customLogoURL} className="max-h-full max-w-full object-contain" /> : <Monitor className="h-8 w-8 opacity-20" />}
                                </div>
                                <div className="space-y-3">
                                    <div className="flex gap-2">
                                        <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleLogoUpload} />
                                        <Button size="sm" onClick={() => fileInputRef.current?.click()} disabled={isUploadingLogo}><Upload className="h-3 w-3 mr-2" /> Subir Logo</Button>
                                        {userSettings?.customLogoURL && <Button size="sm" variant="ghost" className="text-destructive" onClick={() => updateSettings({ customLogoURL: '' })}><X className="h-3 w-3 mr-2" /> Remover</Button>}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <Separator />

                        <div className="space-y-6">
                            <ThemeColors />
                            {containerStyle === 'glass' && (
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2"><Pipette className="h-4 w-4 text-primary" /><h4 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Intensidade do Vidro</h4></div>
                                    <Slider value={[glassIntensity]} min={10} max={95} step={5} onValueChange={(val) => updateSettings({ glassIntensity: val[0] })} />
                                </div>
                            )}
                        </div>
                        
                        <Separator />

                        <div className="space-y-4">
                            <div className="flex items-center gap-2"><ListChecks className="h-4 w-4 text-primary" /><h4 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Laboratório de Cores (Status & Financeiro)</h4></div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                {colorableStatuses.map((status) => {
                                    const currentHsl = statusColors[status] || THEMES[0].light;
                                    return (
                                        <div key={status} className="flex items-center justify-between p-3 border rounded-xl bg-muted/10">
                                            <div className="flex items-center gap-2">
                                                <div className="h-4 w-4 rounded-full border border-white/20" style={{ backgroundColor: `hsl(${currentHsl})` }} />
                                                <span className="text-xs font-bold uppercase tracking-tighter">{status}</span>
                                            </div>
                                            <Popover>
                                                <PopoverTrigger asChild><Button variant="ghost" size="sm" className="h-8 bg-background shadow-sm border"><Pipette className="h-3 w-3 opacity-50" /></Button></PopoverTrigger>
                                                <PopoverContent className="w-auto p-0" align="end">
                                                    <StatusColorPalette activeColor={currentHsl} onSelect={(color) => handleStatusColorChange(status, color)} isDark={resolvedTheme === 'dark'} />
                                                </PopoverContent>
                                            </Popover>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        <Separator />

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                            <div className="space-y-4">
                                <div className="flex items-center gap-2"><Shapes className="h-4 w-4 text-primary" /><h4 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Aura Visual (Containers)</h4></div>
                                <RadioGroup value={containerStyle} onValueChange={(val) => updateSettings({ containerStyle: val as any })} className="grid grid-cols-2 gap-2">
                                    {['moderno', 'glass', 'deep', 'flat', 'glow', 'soft', 'bordado', 'geometrico'].map((s) => (
                                        <Label key={s} htmlFor={`s-${s}`} className={cn("flex items-center justify-center rounded-md border-2 p-3 cursor-pointer capitalize text-xs font-bold", containerStyle === s ? "border-primary bg-primary/5" : "border-muted")}>
                                            <RadioGroupItem value={s} id={`s-${s}`} className="sr-only" />{s === 'glow' ? 'Neon Glow' : s}
                                        </Label>
                                    ))}
                                </RadioGroup>
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-center gap-2"><Monitor className="h-4 w-4 text-primary" /><h4 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Arredondamento</h4></div>
                                <RadioGroup value={radius} onValueChange={(val) => updateSettings({ radius: val as any } as any)} className="grid grid-cols-3 gap-2">
                                    {['reto', 'extra-discreto', 'discreto', 'moderno', 'amigavel', 'suave', 'capsula'].map((r) => (
                                        <Label key={r} htmlFor={`r-${r}`} className={cn("flex items-center justify-center rounded-md border-2 p-3 cursor-pointer capitalize text-[10px] font-bold", radius === r ? "border-primary bg-primary/5" : "border-muted")}>
                                            <RadioGroupItem value={r} id={`r-${r}`} className="sr-only" />{r}
                                        </Label>
                                    ))}
                                </RadioGroup>
                            </div>
                        </div>

                        <Separator />

                        <div className="space-y-6">
                            <div className="flex items-center gap-2"><Type className="h-4 w-4 text-primary" /><h4 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Estúdio de Tipografia</h4></div>
                            <RadioGroup value={fontStyle} onValueChange={(val) => updateSettings({ fontStyle: val })} className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3">
                                {['moderno', 'classico', 'mono', 'arredondado', 'industrial', 'futurista', 'elegante', 'real'].map((f) => (
                                    <Label key={f} htmlFor={`f-${f}`} className={cn("flex items-center justify-center rounded-md border-2 p-4 cursor-pointer text-xs font-bold h-24 text-center", fontStyle === f ? "border-primary bg-primary/5" : "border-muted")}>
                                        <RadioGroupItem value={f} id={`f-${f}`} className="sr-only" />
                                        <div className="flex flex-col gap-1"><span className={cn("text-xl", `font-${f}`)}>Aa</span><span>{f}</span></div>
                                    </Label>
                                ))}
                            </RadioGroup>
                        </div>
                    </CardContent>
                 </Card>
            </TabsContent>
            <TabsContent value="data">
                <Card><CardHeader><CardTitle>Segurança</CardTitle></CardHeader><CardContent><Button onClick={handleGlobalBackup} disabled={isExporting || isLoading} className="w-full">{isExporting ? <Loader2 className="animate-spin mr-2" /> : <FileDown className="mr-2 h-4 w-4" />} Baixar Backup (Excel)</Button></CardContent></Card>
            </TabsContent>
            <TabsContent value="account">
                 <Card><CardHeader><CardTitle>Minha Conta</CardTitle></CardHeader><CardContent><Link href="/profile"><Button>Ir para Meu Perfil</Button></Link></CardContent></Card>
            </TabsContent>
        </Tabs>
    </AppLayout>
  );
}