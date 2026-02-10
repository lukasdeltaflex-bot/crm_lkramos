"use client"

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
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
    Type,
    MoveHorizontal,
    Shapes,
    Pipette,
    Check,
    Zap,
    MousePointer2,
    Eye,
    Landmark,
    Bot,
    LayoutDashboard,
    Layout
} from 'lucide-react';
import { EditableList } from '@/components/settings/editable-list';
import { BankEditableList } from '@/components/settings/bank-editable-list';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc, setDoc } from 'firebase/firestore';
import type { UserSettings } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { ThemeColors } from '@/components/settings/theme-colors';
import { cn } from '@/lib/utils';
import { useTheme } from '@/components/theme-provider';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { THEMES } from '@/lib/themes';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { StatsCard } from '@/components/dashboard/stats-card';
import { Badge } from '@/components/ui/badge';

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
  const theme = useTheme();
  
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const settingsDocRef = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return doc(firestore, 'userSettings', user.uid);
  }, [firestore, user]);

  const { data: userSettings, isLoading: isSettingsLoading } = useDoc<UserSettings>(settingsDocRef);

  // PREVIEW LOCAL (Simulador vivo)
  const [preview, setPreview] = useState({
    radius: theme.radius,
    containerStyle: theme.containerStyle,
    backgroundTexture: theme.backgroundTexture,
    colorIntensity: theme.colorIntensity,
    animationStyle: theme.animationStyle,
    fontStyle: theme.fontStyle,
    sidebarStyle: theme.sidebarStyle,
    statusColors: theme.statusColors
  });

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
      
      setPreview({
        radius: userSettings.radius || theme.radius,
        containerStyle: userSettings.containerStyle || theme.containerStyle,
        backgroundTexture: userSettings.backgroundTexture || theme.backgroundTexture,
        colorIntensity: userSettings.colorIntensity || theme.colorIntensity,
        animationStyle: userSettings.animationStyle || theme.animationStyle,
        fontStyle: userSettings.fontStyle || theme.fontStyle,
        sidebarStyle: userSettings.sidebarStyle || theme.sidebarStyle,
        statusColors: userSettings.statusColors || theme.statusColors
      });
    }
  }, [userSettings, theme.radius, theme.containerStyle, theme.backgroundTexture, theme.colorIntensity, theme.animationStyle, theme.fontStyle, theme.sidebarStyle, theme.statusColors]);

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

  const handleApplyAppearance = () => {
      theme.setRadius(preview.radius);
      theme.setContainerStyle(preview.containerStyle);
      theme.setBackgroundTexture(preview.backgroundTexture);
      theme.setColorIntensity(preview.colorIntensity);
      theme.setAnimationStyle(preview.animationStyle);
      theme.setFontStyle(preview.fontStyle);
      theme.setSidebarStyle(preview.sidebarStyle);
      theme.setStatusColors(preview.statusColors);
      
      updateSettings({
          radius: preview.radius,
          containerStyle: preview.containerStyle,
          backgroundTexture: preview.backgroundTexture,
          colorIntensity: preview.colorIntensity,
          animationStyle: preview.animationStyle,
          fontStyle: preview.fontStyle,
          sidebarStyle: preview.sidebarStyle,
          statusColors: preview.statusColors
      });
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

  const isLoading = isUserLoading || isSettingsLoading;

  const colorableStatuses = Array.from(new Set([
    ...proposalStatuses, 
    "Paga", "Pendente", "Parcial",
    "COMISSÃO ESPERADA",
    "TOTAL DIGITADO",
    "SALDO A RECEBER"
  ]));

  const fontOptions = [
    "moderno", "classico", "mono", "arredondado", "condensado", 
    "business", "elegante", "geometrico", "tecnico", "minimalista", 
    "futurista", "robusto", "editorial", "suico", "academico",
    "industrial", "digital", "real", "suave", "sharp"
  ];

  return (
    <AppLayout>
      <PageHeader title="Configurações de Elite" />
        <Tabs defaultValue="lists">
            <TabsList className="mb-4 bg-muted/50 p-1">
                <TabsTrigger value="lists"><ListChecks className="mr-2 h-4 w-4" /> Opções</TabsTrigger>
                <TabsTrigger value="appearance"><Palette className="mr-2 h-4 w-4" /> Aparência</TabsTrigger>
                <TabsTrigger value="data"><Database className="mr-2 h-4 w-4" /> Dados</TabsTrigger>
                <TabsTrigger value="account"><UserCog className="mr-2 h-4 w-4" /> Conta</TabsTrigger>
            </TabsList>

            <TabsContent value="lists">
                <Card className="border-border/50 shadow-sm">
                    <CardHeader>
                        <CardTitle>Gerenciamento de Listas</CardTitle>
                        <CardDescription>Configure os parâmetros operacionais do seu sistema.</CardDescription>
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
                 <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-8">
                        <Card className="border-border/50 shadow-sm">
                            <CardHeader className="flex flex-row items-center justify-between">
                                <div>
                                    <CardTitle>Identidade Visual & Branding</CardTitle>
                                    <CardDescription>Configure a estética industrial da sua plataforma.</CardDescription>
                                </div>
                                <Button onClick={handleApplyAppearance} size="sm" className="bg-primary hover:bg-primary/90">
                                    <Sparkles className="mr-2 h-4 w-4" /> Salvar Identidade Visual
                                </Button>
                            </CardHeader>
                            <CardContent className="space-y-10">
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2"><Monitor className="h-4 w-4 text-primary" /><h4 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Logomarca Oficial</h4></div>
                                    <div className="flex items-center gap-6 p-6 border rounded-xl bg-muted/20">
                                        <div className="h-24 w-24 bg-white border flex items-center justify-center rounded-lg overflow-hidden shadow-inner">
                                            {userSettings?.customLogoURL ? <img src={userSettings.customLogoURL} className="max-h-full max-w-full object-contain" alt="Preview Logo" /> : <Monitor className="h-8 w-8 opacity-20" />}
                                        </div>
                                        <div className="space-y-3">
                                            <p className="text-sm font-medium">Sua logo aparecerá no menu lateral e em todos os relatórios PDF oficiais.</p>
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
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                        <div className="space-y-4">
                                            <div className="flex items-center gap-2"><Pipette className="h-4 w-4 text-primary" /><h4 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Intensidade das Cores</h4></div>
                                            <RadioGroup value={preview.colorIntensity} onValueChange={(val) => setPreview(p => ({ ...p, colorIntensity: val }))} className="grid grid-cols-2 gap-2">
                                                {['sobrio', 'vibrante'].map((i) => (
                                                    <Label key={i} htmlFor={`i-${i}`} className={cn("flex items-center justify-center rounded-md border-2 p-3 cursor-pointer capitalize text-xs font-bold", preview.colorIntensity === i ? "border-primary bg-primary/5" : "border-muted")}>
                                                        <RadioGroupItem value={i} id={`i-${i}`} className="sr-only" />{i === 'sobrio' ? 'Sóbrio' : 'Vibrante'}
                                                    </Label>
                                                ))}
                                            </RadioGroup>
                                        </div>
                                        <div className="space-y-4">
                                            <div className="flex items-center gap-2"><Landmark className="h-4 w-4 text-primary" /><h4 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Logotipos dos Bancos</h4></div>
                                            <div className="flex items-center space-x-2 p-3 border rounded-lg bg-muted/10">
                                                <Switch 
                                                    id="show-bank-logos" 
                                                    checked={showBankLogos} 
                                                    onCheckedChange={(val) => {
                                                        setShowBankLogos(val);
                                                        updateSettings({ showBankLogos: val });
                                                    }}
                                                />
                                                <Label htmlFor="show-bank-logos" className="text-xs font-bold cursor-pointer">Exibe o ícone visual de cada banco nas tabelas e formulários.</Label>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                
                                <Separator />

                                <div className="space-y-4">
                                    <div className="flex items-center gap-2"><Pipette className="h-4 w-4 text-primary" /><h4 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Laboratório de Cores (Status & Financeiro)</h4></div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {colorableStatuses.map((status, index) => {
                                            const currentHsl = preview.statusColors[status] || THEMES[0].light;
                                            return (
                                                <div key={`color-status-${status}-${index}`} className="flex items-center justify-between p-3 border rounded-xl bg-muted/10">
                                                    <div className="flex items-center gap-2">
                                                        <div className="h-4 w-4 rounded-full border border-white/20" style={{ backgroundColor: `hsl(${currentHsl})` }} />
                                                        <span className="text-[10px] font-black uppercase tracking-tighter">{status}</span>
                                                    </div>
                                                    <Popover>
                                                        <PopoverTrigger asChild><Button variant="ghost" size="sm" className="h-8 bg-background shadow-sm border"><Pipette className="h-3 w-3 opacity-50" /></Button></PopoverTrigger>
                                                        <PopoverContent className="w-auto p-0" align="end">
                                                            <StatusColorPalette activeColor={currentHsl} onSelect={(color) => setPreview(p => ({ ...p, statusColors: { ...p.statusColors, [status]: color } }))} isDark={theme.resolvedTheme === 'dark'} />
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
                                        <RadioGroup value={preview.containerStyle} onValueChange={(val) => setPreview(p => ({ ...p, containerStyle: val }))} className="grid grid-cols-2 gap-2">
                                            {['moderno', 'glass', 'deep', 'flat', 'glow', 'soft', 'bordado', 'geometrico'].map((s) => (
                                                <Label key={s} htmlFor={`s-${s}`} className={cn("flex items-center justify-center rounded-md border-2 p-3 cursor-pointer capitalize text-xs font-bold", preview.containerStyle === s ? "border-primary bg-primary/5" : "border-muted")}>
                                                    <RadioGroupItem value={s} id={`s-${s}`} className="sr-only" />{s === 'glow' ? 'Neon Glow' : s}
                                                </Label>
                                            ))}
                                        </RadioGroup>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="flex items-center gap-2"><MousePointer2 className="h-4 w-4 text-primary" /><h4 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Arredondamento</h4></div>
                                        <RadioGroup value={preview.radius} onValueChange={(val) => setPreview(p => ({ ...p, radius: val }))} className="grid grid-cols-3 gap-2">
                                            {['reto', 'extra-discreto', 'discreto', 'moderno', 'amigavel', 'organico', 'capsula'].map((r) => (
                                                <Label key={r} htmlFor={`r-${r}`} className={cn("flex items-center justify-center rounded-md border-2 p-3 cursor-pointer capitalize text-[10px] font-bold text-center", preview.radius === r ? "border-primary bg-primary/5" : "border-muted")}>
                                                    <RadioGroupItem value={r} id={`r-${r}`} className="sr-only" />
                                                    {r === 'extra-discreto' ? 'X-Discreto' : r === 'organico' ? 'Orgânico' : r}
                                                </Label>
                                            ))}
                                        </RadioGroup>
                                    </div>
                                </div>

                                <Separator />

                                <div className="space-y-6">
                                    <div className="flex items-center gap-2"><Type className="h-4 w-4 text-primary" /><h4 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Estúdio de Tipografia (20 Estilos Premium)</h4></div>
                                    <RadioGroup value={preview.fontStyle} onValueChange={(val) => setPreview(p => ({ ...p, fontStyle: val }))} className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                                        {fontOptions.map((f) => (
                                            <Label key={f} htmlFor={`f-${f}`} className={cn("flex items-center justify-center rounded-md border-2 p-4 cursor-pointer text-xs font-bold h-20 text-center group transition-all", preview.fontStyle === f ? "border-primary bg-primary/5 scale-105" : "border-muted hover:border-primary/30")}>
                                                <RadioGroupItem value={f} id={`f-${f}`} className="sr-only" />
                                                <div className="flex flex-col gap-1 items-center">
                                                    <span className={cn("text-2xl", `font-${f}`)}>Aa</span>
                                                    <span className="opacity-60">{f}</span>
                                                </div>
                                            </Label>
                                        ))}
                                    </RadioGroup>
                                </div>

                                <Separator />

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-2"><MoveHorizontal className="h-4 w-4 text-primary" /><h4 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Motion Design (Animações)</h4></div>
                                        <RadioGroup value={preview.animationStyle} onValueChange={(val) => setPreview(p => ({ ...p, animationStyle: val }))} className="grid grid-cols-2 gap-2">
                                            {['estatico', 'instantaneo', 'rapido', 'sutil', 'cinematografico', 'elastico', 'dramatico', 'atmosferico'].map((a) => (
                                                <Label key={a} htmlFor={`a-${a}`} className={cn("flex items-center justify-center rounded-md border-2 p-3 cursor-pointer capitalize text-[10px] font-bold", preview.animationStyle === a ? "border-primary bg-primary/5" : "border-muted")}>
                                                    <RadioGroupItem value={a} id={`a-${a}`} className="sr-only" />{a}
                                                </Label>
                                            ))}
                                        </RadioGroup>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="flex items-center gap-2"><Layout className="h-4 w-4 text-primary" /><h4 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Textura de Fundo</h4></div>
                                        <RadioGroup value={preview.backgroundTexture} onValueChange={(val) => setPreview(p => ({ ...p, backgroundTexture: val }))} className="grid grid-cols-2 gap-2">
                                            {['none', 'dots', 'grid', 'lines'].map((t) => (
                                                <Label key={t} htmlFor={`t-${t}`} className={cn("flex items-center justify-center rounded-md border-2 p-3 cursor-pointer capitalize text-xs font-bold", preview.backgroundTexture === t ? "border-primary bg-primary/5" : "border-muted")}>
                                                    <RadioGroupItem value={t} id={`t-${t}`} className="sr-only" />{t === 'none' ? 'Limpo' : t}
                                                </Label>
                                            ))}
                                        </RadioGroup>
                                    </div>
                                </div>

                                <Separator />

                                <div className="space-y-4">
                                    <div className="flex items-center gap-2"><Shapes className="h-4 w-4 text-primary" /><h4 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Barra Lateral</h4></div>
                                    <RadioGroup value={preview.sidebarStyle} onValueChange={(val) => setPreview(p => ({ ...p, sidebarStyle: val }))} className="grid grid-cols-3 gap-2">
                                        {['default', 'dark', 'light'].map((s) => (
                                            <Label key={s} htmlFor={`s-${s}`} className={cn("flex items-center justify-center rounded-md border-2 p-3 cursor-pointer capitalize text-xs font-bold", preview.sidebarStyle === s ? "border-primary bg-primary/5" : "border-muted")}>
                                                <RadioGroupItem value={s} id={`s-${s}`} className="sr-only" />{s === 'default' ? 'Auto' : s === 'dark' ? 'Escura' : 'Clara'}
                                            </Label>
                                        ))}
                                    </RadioGroup>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="lg:col-span-1 space-y-8">
                        <Card className="sticky top-20 border-primary/20 bg-primary/[0.02]">
                            <CardHeader>
                                <CardTitle className="text-lg font-bold flex items-center gap-2">
                                    <Eye className="h-5 w-5 text-primary" />
                                    Laboratório de Visualização
                                </CardTitle>
                                <CardDescription>Teste sua configuração aqui antes de salvar.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className={cn(
                                    "p-6 rounded-2xl transition-all border shadow-sm group/preview",
                                    `texture-${preview.backgroundTexture}`,
                                    `radius-${preview.radius}`,
                                    `font-${preview.fontStyle}`,
                                    `anim-${preview.animationStyle}`,
                                    `style-${preview.containerStyle}`,
                                    `intensity-${preview.colorIntensity}`
                                )}>
                                    <div className="space-y-4">
                                        <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Preview de KPI & Aura</p>
                                        <StatsCard 
                                            title="COMISSÃO ESPERADA" 
                                            value="R$ 15.420,00" 
                                            icon={Zap} 
                                            description="VALOR EM TRÂMITE"
                                            isHot={true}
                                            className="hover:scale-105 transition-transform"
                                            overrideStatusColors={preview.statusColors}
                                            overrideContainerStyle={preview.containerStyle}
                                            overrideIntensity={preview.colorIntensity}
                                            overrideRadius={preview.radius}
                                            overrideAnimationStyle={preview.animationStyle}
                                        />

                                        <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest mt-6">Preview de Barra Lateral</p>
                                        <div className={cn(
                                            "border rounded-[var(--radius)] p-4 flex gap-3 transition-all shadow-sm",
                                            preview.sidebarStyle === 'dark' ? "bg-black text-white" : preview.sidebarStyle === 'light' ? "bg-white text-black" : "bg-muted text-foreground"
                                        )}>
                                            <div className="flex flex-col gap-2">
                                                <div className="h-2 w-12 bg-current opacity-20 rounded" />
                                                <div className="h-2 w-10 bg-current opacity-40 rounded" />
                                            </div>
                                            <Separator orientation="vertical" className="h-8" />
                                            <LayoutDashboard className="h-5 w-5" />
                                        </div>

                                        <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest mt-6">Preview de Badge & Botão</p>
                                        <div className="flex flex-wrap gap-2 p-4 border rounded-[var(--radius)] bg-background shadow-inner">
                                            <Badge className={cn("status-custom", preview.containerStyle === 'glow' && "shadow-[0_0_10px_hsla(var(--status-color),0.4)]")} style={{ '--status-color': preview.statusColors['Paga'] || '142 76% 36%' } as any}>Paga</Badge>
                                            <Badge className={cn("status-custom")} style={{ '--status-color': preview.statusColors['Pendente'] || '45 93% 47%' } as any}>Pendente</Badge>
                                            <Button size="sm" className="status-custom h-8" style={{ '--status-color': THEMES[0].light } as any}>Botão de Ação</Button>
                                        </div>
                                    </div>
                                </div>
                                <p className="text-[10px] text-center text-muted-foreground italic">Passe o mouse sobre o card para testar a animação.</p>
                            </CardContent>
                        </Card>
                    </div>
                 </div>
            </TabsContent>

            <TabsContent value="data">
                <Card className="border-border/50 shadow-sm">
                    <CardHeader><CardTitle>Segurança & Backup</CardTitle></CardHeader>
                    <CardContent>
                        <Button className="w-full" variant="outline">
                            <FileDown className="mr-2 h-4 w-4" /> Baixar Backup Geral (Excel)
                        </Button>
                    </CardContent>
                </Card>
            </TabsContent>

            <TabsContent value="account">
                 <Card className="border-border/50 shadow-sm">
                    <CardHeader><CardTitle>Minha Conta</CardTitle></CardHeader>
                    <CardContent>
                        <Link href="/profile">
                            <Button>Ir para Gerenciamento de Perfil</Button>
                        </Link>
                    </CardContent>
                </Card>
            </TabsContent>
        </Tabs>
    </AppLayout>
  );
}