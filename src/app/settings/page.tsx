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
    Layout,
    PanelLeft,
    Image as ImageIcon,
    Play,
    Bot,
    FileDown,
    Settings2
} from 'lucide-react';
import { EditableList } from '@/components/settings/editable-list';
import { BankEditableList } from '@/components/settings/bank-editable-list';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc, setDoc } from 'firebase/firestore';
import type { UserSettings } from '@/lib/types';
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
import { StatsCard } from '@/components/dashboard/stats-card';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

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
            {THEMES.slice(0, 36).map((theme) => {
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
  const { user } = useUser();
  const firestore = useFirestore();
  const theme = useTheme();
  
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const settingsDocRef = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return doc(firestore, 'userSettings', user.uid);
  }, [firestore, user]);

  const { data: userSettings } = useDoc<UserSettings>(settingsDocRef);

  // PREVIEW LOCAL: Todas as mudanças ficam aqui até clicar em Salvar
  const [preview, setPreview] = useState({
    radius: 'moderno',
    containerStyle: 'moderno',
    backgroundTexture: 'none',
    colorIntensity: 'equilibrada',
    animationStyle: 'sutil',
    fontStyle: 'moderno',
    sidebarStyle: 'padrão',
    colorTheme: 'padrão',
    statusColors: {} as Record<string, string>
  });

  const [previewStatus, setPreviewStatus] = useState("EM ANDAMENTO");
  const [hasLoadedSettings, setHasLoadedSettings] = useState(false);

  useEffect(() => {
    if (userSettings && !hasLoadedSettings) {
      setPreview({
        radius: userSettings.radius || 'moderno',
        containerStyle: userSettings.containerStyle || 'moderno',
        backgroundTexture: userSettings.backgroundTexture || 'none',
        colorIntensity: userSettings.colorIntensity || 'equilibrada',
        animationStyle: userSettings.animationStyle || 'sutil',
        fontStyle: userSettings.fontStyle || 'moderno',
        sidebarStyle: userSettings.sidebarStyle || 'padrão',
        colorTheme: userSettings.colorTheme || 'padrão',
        statusColors: userSettings.statusColors || {}
      });
      setHasLoadedSettings(true);
    }
  }, [userSettings, hasLoadedSettings]);

  const saveSettingsToFirebase = async (updated: Partial<UserSettings>) => {
    if (settingsDocRef) {
      try {
        await setDoc(settingsDocRef, updated, { merge: true });
        toast({ title: "Configurações Salvas com Sucesso!" });
      } catch (error) {
        toast({ variant: "destructive", title: "Erro ao Salvar no Firebase" });
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
      theme.setColorTheme(preview.colorTheme);
      theme.setStatusColors(preview.statusColors);
      
      saveSettingsToFirebase({
          radius: preview.radius,
          containerStyle: preview.containerStyle,
          backgroundTexture: preview.backgroundTexture,
          colorIntensity: preview.colorIntensity,
          animationStyle: preview.animationStyle,
          fontStyle: preview.fontStyle,
          sidebarStyle: preview.sidebarStyle,
          colorTheme: preview.colorTheme,
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
        await saveSettingsToFirebase({ customLogoURL: dataUrl });
        setIsUploadingLogo(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const colorableStatuses = [
    "EM ANDAMENTO", "AGUARDANDO SALDO", "PAGO", 
    "SALDO PAGO", "PENDENTE", "REPROVADO", 
    "PAGA", "PARCIAL", "COMISSÃO ESPERADA", 
    "SALDO A RECEBER"
  ];

  const FONT_LABELS: Record<string, string> = {
    "moderno": "Inter (Padrão)", "classico": "Playfair", "mono": "JetBrains", 
    "arredondado": "Lexend", "industrial": "Bebas Neue", "futurista": "Orbitron", 
    "elegante": "EB Garamond", "real": "Cinzel", "espacial": "Space Grotesk", 
    "minimalista": "Outfit", "editorial": "Lora (Editorial)", "geom-vivida": "Urbanist",
    "tecnica": "Fira Sans", "impacto": "Kanit", "clean": "Work Sans",
    "soft": "Quicksand", "neo-classico": "Spectral", "corp": "Manrope",
    "sharp": "Roboto Condensed", "script": "Cormorant"
  };

  const previewPrimaryColor = React.useMemo(() => {
    const selectedTheme = THEMES.find(t => t.name === preview.colorTheme) || THEMES[0];
    return theme.resolvedTheme === 'dark' ? selectedTheme.dark : selectedTheme.light;
  }, [preview.colorTheme, theme.resolvedTheme]);

  return (
    <AppLayout>
      <PageHeader title="Estúdio de Branding LK RAMOS" />
        <Tabs defaultValue="appearance" className="w-full">
            <TabsList className="mb-8 bg-muted/30 p-1.5 h-14 rounded-full border border-border/50 flex w-fit gap-2">
                <TabsTrigger 
                    value="lists" 
                    className="rounded-full px-6 gap-2 data-[state=active]:bg-blue-500 data-[state=active]:text-white transition-all shadow-none font-bold"
                >
                    <ListChecks className="h-4 w-4" /> 
                    Parâmetros
                </TabsTrigger>
                <TabsTrigger 
                    value="appearance" 
                    className="rounded-full px-6 gap-2 data-[state=active]:bg-primary data-[state=active]:text-white transition-all shadow-none font-bold"
                >
                    <Palette className="h-4 w-4" /> 
                    Aparência
                </TabsTrigger>
                <TabsTrigger 
                    value="data" 
                    className="rounded-full px-6 gap-2 data-[state=active]:bg-green-600 data-[state=active]:text-white transition-all shadow-none font-bold"
                >
                    <Database className="h-4 w-4" /> 
                    Dados & Backup
                </TabsTrigger>
                <TabsTrigger 
                    value="account" 
                    className="rounded-full px-6 gap-2 data-[state=active]:bg-purple-600 data-[state=active]:text-white transition-all shadow-none font-bold"
                >
                    <UserCog className="h-4 w-4" /> 
                    Conta
                </TabsTrigger>
            </TabsList>

            <TabsContent value="appearance">
                 <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-8">
                        <Card className="border-border/50 shadow-sm">
                            <CardHeader className="flex flex-row items-center justify-between">
                                <div>
                                    <CardTitle>Identidade Visual de Elite</CardTitle>
                                    <CardDescription>Personalize o motor visual e o brilho industrial da sua marca.</CardDescription>
                                </div>
                                <Button onClick={handleApplyAppearance} size="sm" className="bg-primary hover:bg-primary/90 font-bold">
                                    <Sparkles className="mr-2 h-4 w-4" /> Aplicar em Todo o Sistema
                                </Button>
                            </CardHeader>
                            <CardContent className="space-y-10">
                                <ThemeColors 
                                    activeThemeName={preview.colorTheme} 
                                    onSelect={(name) => setPreview(p => ({ ...p, colorTheme: name }))} 
                                />

                                <Separator />

                                <div className="space-y-4">
                                    <div className="flex items-center gap-2"><Monitor className="h-4 w-4 text-primary" /><h4 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Branding (Logomarca)</h4></div>
                                    <div className="flex items-center gap-6 p-6 border rounded-xl bg-muted/20">
                                        <div className="h-24 w-24 bg-white border flex items-center justify-center rounded-lg overflow-hidden shadow-inner">
                                            {userSettings?.customLogoURL ? <img src={userSettings.customLogoURL} className="max-h-full max-w-full object-contain" alt="Preview Logo" /> : <Monitor className="h-8 w-8 opacity-20" />}
                                        </div>
                                        <div className="space-y-3">
                                            <p className="text-xs font-medium text-muted-foreground">Sua logo será aplicada globalmente e em todos os PDFs oficiais.</p>
                                            <div className="flex gap-2">
                                                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleLogoUpload} />
                                                <Button size="sm" onClick={() => fileInputRef.current?.click()} disabled={isUploadingLogo}><Upload className="h-3 w-3 mr-2" /> Alterar Logo</Button>
                                                {userSettings?.customLogoURL && <Button size="sm" variant="ghost" className="text-destructive" onClick={() => saveSettingsToFirebase({ customLogoURL: '' })}><X className="h-3 w-3 mr-2" /> Remover</Button>}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <Separator />

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-2"><PanelLeft className="h-4 w-4 text-primary" /><h4 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Barra Lateral</h4></div>
                                        <RadioGroup value={preview.sidebarStyle} onValueChange={(val) => setPreview(p => ({ ...p, sidebarStyle: val }))} className="grid grid-cols-3 gap-2">
                                            {['padrão', 'dark', 'light'].map((s) => (
                                                <Label key={s} htmlFor={`sidebar-${s}`} className={cn("flex items-center justify-center rounded-md border-2 p-3 cursor-pointer capitalize text-xs font-bold", preview.sidebarStyle === s ? "border-primary bg-primary/5" : "border-muted")}>
                                                    <RadioGroupItem value={s} id={`sidebar-${s}`} className="sr-only" />{s}
                                                </Label>
                                            ))}
                                        </RadioGroup>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="flex items-center gap-2"><ImageIcon className="h-4 w-4 text-primary" /><h4 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Logotipos dos Bancos</h4></div>
                                        <div className="flex items-center justify-between p-4 border rounded-xl bg-muted/10">
                                            <div className="space-y-0.5">
                                                <Label className="text-sm font-bold">Exibir Ícones Oficiais</Label>
                                                <p className="text-[10px] text-muted-foreground">Mostra os logos dos bancos nas tabelas e propostas.</p>
                                            </div>
                                            <Switch 
                                                checked={userSettings?.showBankLogos ?? true} 
                                                onCheckedChange={(val) => saveSettingsToFirebase({ showBankLogos: val })}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <Separator />

                                <div className="space-y-6">
                                    <div className="flex items-center gap-2"><Pipette className="h-4 w-4 text-primary" /><h4 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Laboratório de Cores (Status & Financeiro)</h4></div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {colorableStatuses.map((status) => {
                                            const currentHsl = preview.statusColors[status] || "217 33% 25%";
                                            return (
                                                <div key={status} className="flex items-center justify-between p-3 border rounded-xl bg-muted/10">
                                                    <div className="flex items-center gap-2">
                                                        <div className="h-4 w-4 rounded-full border border-white/20" style={{ backgroundColor: `hsl(${currentHsl})` }} />
                                                        <span className="text-[10px] font-black uppercase tracking-tighter">{status}</span>
                                                    </div>
                                                    <Popover>
                                                        <PopoverTrigger asChild><Button variant="ghost" size="sm" className="h-8 bg-background shadow-sm border"><Pipette className="h-3 w-3 opacity-50" /></Button></PopoverTrigger>
                                                        <PopoverContent className="w-auto p-0" align="end">
                                                            <StatusColorPalette 
                                                                activeColor={currentHsl} 
                                                                onSelect={(color) => setPreview(p => ({ ...p, statusColors: { ...p.statusColors, [status]: color } }))} 
                                                                isDark={theme.resolvedTheme === 'dark'} 
                                                            />
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
                                        <div className="flex items-center gap-2"><Zap className="h-4 w-4 text-primary" /><h4 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Intensidade do Brilho</h4></div>
                                        <RadioGroup value={preview.colorIntensity} onValueChange={(val) => setPreview(p => ({ ...p, colorIntensity: val }))} className="grid grid-cols-2 gap-2">
                                            {['minima', 'equilibrada', 'impactante', 'neon'].map((i) => (
                                                <Label key={i} htmlFor={`i-${i}`} className={cn("flex items-center justify-center rounded-md border-2 p-3 cursor-pointer capitalize text-xs font-bold", preview.colorIntensity === i ? "border-primary bg-primary/5" : "border-muted")}>
                                                    <RadioGroupItem value={i} id={`i-${i}`} className="sr-only" />{i === 'minima' ? 'Mínima' : i === 'equilibrada' ? 'Equilibrada' : i === 'impactante' ? 'Impactante' : 'Industrial (Neon)'}
                                                </Label>
                                            ))}
                                        </RadioGroup>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="flex items-center gap-2"><Shapes className="h-4 w-4 text-primary" /><h4 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Estilo de Aura (Containers)</h4></div>
                                        <RadioGroup value={preview.containerStyle} onValueChange={(val) => setPreview(p => ({ ...p, containerStyle: val }))} className="grid grid-cols-2 gap-2">
                                            {['moderno', 'glass', 'deep', 'flat', 'glow', 'geometrico'].map((s) => (
                                                <Label key={s} htmlFor={`s-${s}`} className={cn("flex items-center justify-center rounded-md border-2 p-3 cursor-pointer capitalize text-xs font-bold", preview.containerStyle === s ? "border-primary bg-primary/5" : "border-muted")}>
                                                    <RadioGroupItem value={s} id={`s-${s}`} className="sr-only" />{s === 'glow' ? 'Neon Glow' : s}
                                                </Label>
                                            ))}
                                        </RadioGroup>
                                    </div>
                                </div>

                                <Separator />

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-2"><MousePointer2 className="h-4 w-4 text-primary" /><h4 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Arredondamento de Precisão</h4></div>
                                        <RadioGroup value={preview.radius} onValueChange={(val) => setPreview(p => ({ ...p, radius: val }))} className="grid grid-cols-4 gap-2">
                                            {['reto', 'extra-discreto', 'discreto', 'suave', 'moderno', 'amigavel', 'organico', 'capsula'].map((r) => (
                                                <Label key={r} htmlFor={`r-${r}`} className={cn("flex items-center justify-center rounded-md border-2 p-3 cursor-pointer capitalize text-[10px] font-bold text-center h-12", preview.radius === r ? "border-primary bg-primary/5" : "border-muted")}>
                                                    <RadioGroupItem value={r} id={`r-${r}`} className="sr-only" />{r === 'extra-discreto' ? '2px' : r === 'discreto' ? '4px' : r === 'suave' ? '8px' : r === 'moderno' ? '12px' : r}
                                                </Label>
                                            ))}
                                        </RadioGroup>
                                    </div>
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-2"><Type className="h-4 w-4 text-primary" /><h4 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Tipografia Expandida</h4></div>
                                        <div className="grid grid-cols-2 gap-2">
                                            {Object.keys(FONT_LABELS).map((f) => (
                                                <Button 
                                                    key={f}
                                                    variant="outline"
                                                    size="sm"
                                                    className={cn(
                                                        "justify-start text-[10px] h-9 px-3 font-bold border-2 transition-all",
                                                        `font-${f}`,
                                                        preview.fontStyle === f ? "border-primary bg-primary/5 text-primary" : "border-muted hover:border-primary/30"
                                                    )}
                                                    onClick={() => setPreview(p => ({ ...p, fontStyle: f }))}
                                                >
                                                    {FONT_LABELS[f]}
                                                </Button>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <Separator />

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-2"><MoveHorizontal className="h-4 w-4 text-primary" /><h4 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Ritmo (Motion Design)</h4></div>
                                        <RadioGroup value={preview.animationStyle} onValueChange={(val) => setPreview(p => ({ ...p, animationStyle: val }))} className="grid grid-cols-2 gap-2">
                                            {['instantaneo', 'sutil', 'atmosferico', 'cinematografico'].map((a) => (
                                                <Label key={a} htmlFor={`a-${a}`} className={cn("flex items-center justify-center rounded-md border-2 p-3 cursor-pointer capitalize text-xs font-bold", preview.animationStyle === a ? "border-primary bg-primary/5" : "border-muted")}>
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
                                                    <RadioGroupItem value={t} id={`t-${t}`} className="sr-only" />{t === 'none' ? 'Liso' : t === 'dots' ? 'Pontos' : t === 'grid' ? 'Grade' : 'Linhas'}
                                                </Label>
                                            ))}
                                        </RadioGroup>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="lg:col-span-1">
                        <Card className="sticky top-20 border-primary/20 bg-primary/[0.02] shadow-xl overflow-hidden">
                            <CardHeader className="bg-primary/5 border-b border-primary/10">
                                <CardTitle className="text-lg font-bold flex items-center gap-2">
                                    <Eye className="h-5 w-5 text-primary" />
                                    Laboratório 360°
                                </CardTitle>
                                <CardDescription>Valide cada detalhe antes da aplicação global.</CardDescription>
                            </CardHeader>
                            <CardContent className="p-0">
                                <div 
                                    className={cn(
                                        "p-8 min-h-[500px] flex flex-col gap-8 items-center justify-center transition-all",
                                        `texture-${preview.backgroundTexture}`,
                                        `radius-${preview.radius}`,
                                        `font-${preview.fontStyle}`,
                                        `anim-${preview.animationStyle}`
                                    )}
                                    style={{ '--primary': previewPrimaryColor } as any}
                                >
                                    {/* Teste de Barra Lateral (Miniatura) */}
                                    <div className="w-full max-w-sm space-y-2">
                                        <p className="text-[9px] font-black uppercase text-center text-muted-foreground tracking-[0.2em]">Preview de Interface</p>
                                        <div className={cn(
                                            "flex gap-3 p-3 border-2 rounded-xl shadow-sm transition-colors duration-500",
                                            preview.sidebarStyle === 'dark' ? "bg-zinc-900 border-zinc-800 text-white" : 
                                            preview.sidebarStyle === 'light' ? "bg-white border-zinc-200 text-zinc-900" :
                                            "bg-muted/50 border-border text-foreground"
                                        )}>
                                            <div className="flex flex-col gap-2 flex-1">
                                                <div className="h-2 w-12 rounded bg-primary/40" />
                                                <div className="h-2 w-full rounded bg-primary/20" />
                                                <div className="h-2 w-full rounded bg-primary/20" />
                                            </div>
                                            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                                                <PanelLeft className="h-5 w-5 text-primary" />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Teste de Card de Status Dinâmico */}
                                    <div className="w-full max-w-sm space-y-4">
                                        <div className="flex items-center gap-2 bg-background/80 backdrop-blur p-2 rounded-lg border shadow-sm">
                                            <Settings2 className="h-3 w-3 text-muted-foreground" />
                                            <Select value={previewStatus} onValueChange={setPreviewStatus}>
                                                <SelectTrigger className="h-7 text-[10px] font-bold uppercase border-none bg-transparent focus:ring-0">
                                                    <SelectValue placeholder="Escolher Status para Teste" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {colorableStatuses.map(s => (
                                                        <SelectItem key={s} value={s} className="text-[10px] font-bold uppercase">{s}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <StatsCard 
                                            title={previewStatus} 
                                            value="R$ 150.000,00" 
                                            icon={Zap} 
                                            description={`SIMULAÇÃO: ${previewStatus}`}
                                            isHot={preview.containerStyle === 'glow' || preview.colorIntensity === 'neon'}
                                            sparklineData={[10, 40, 20, 80, 50, 90, 70]}
                                            overrideStatusColors={preview.statusColors}
                                            overrideContainerStyle={preview.containerStyle}
                                            overrideIntensity={preview.colorIntensity}
                                            overrideRadius={preview.radius}
                                            overrideAnimationStyle={preview.animationStyle}
                                        />
                                    </div>

                                    {/* Teste de Botões e Ritmo */}
                                    <div className="w-full max-w-sm space-y-4">
                                        <p className="text-[9px] font-black uppercase text-center text-muted-foreground tracking-[0.2em] mb-4">Painel de Teste de Ritmo</p>
                                        <div className="grid grid-cols-2 gap-3">
                                            <Button 
                                                className={cn(
                                                    "group relative overflow-hidden transition-all border-2 h-12 font-bold",
                                                    `radius-${preview.radius}`,
                                                    `anim-${preview.animationStyle}`
                                                )}
                                            >
                                                <Play className="mr-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                                                TESTAR RITMO
                                            </Button>
                                            <Button 
                                                variant="outline"
                                                className={cn(
                                                    "border-2 h-12 font-bold hover:bg-primary hover:text-white transition-all",
                                                    `radius-${preview.radius}`,
                                                    `anim-${preview.animationStyle}`
                                                )}
                                            >
                                                INTERAÇÃO
                                            </Button>
                                        </div>
                                        <div className="flex items-center justify-center gap-2 py-4">
                                            <div className={cn(
                                                "h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center animate-bounce",
                                                `anim-${preview.animationStyle}`
                                            )}>
                                                <Bot className="h-5 w-5 text-primary" />
                                            </div>
                                            <p className="text-[10px] font-bold text-muted-foreground uppercase">Animação: {preview.animationStyle}</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="p-4 bg-muted/30 border-t border-primary/10">
                                    <p className="text-[10px] font-black uppercase text-center text-primary tracking-widest animate-pulse">Laboratório de Visualização Ativo</p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                 </div>
            </TabsContent>

            <TabsContent value="lists">
                <Card className="border-border/50 shadow-sm">
                    <CardHeader>
                        <CardTitle>Configuração de Listas</CardTitle>
                        <CardDescription>Ajuste os itens disponíveis nos menus de seleção do sistema.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Accordion type="multiple" className="w-full space-y-4">
                        <EditableList title="Tipos de Produto" items={userSettings?.productTypes || initialProductTypes} setItems={(n) => saveSettingsToFirebase({ productTypes: n as string[] })} />
                        <EditableList title="Status da Proposta" items={userSettings?.proposalStatuses || initialProposalStatuses} setItems={(n) => saveSettingsToFirebase({ proposalStatuses: n as string[] })} />
                        <EditableList title="Status da Comissão" items={userSettings?.commissionStatuses || initialCommissionStatuses} setItems={(n) => saveSettingsToFirebase({ commissionStatuses: n as string[] })} />
                        <EditableList title="Órgãos Aprovadores" items={userSettings?.approvingBodies || initialApprovingBodies} setItems={(n) => saveSettingsToFirebase({ approvingBodies: n as string[] })} />
                        <EditableList title="Categorias de Despesas" items={userSettings?.expenseCategories || initialExpenseCategories} setItems={(n) => saveSettingsToFirebase({ expenseCategories: n as string[] })} />
                        <BankEditableList banks={userSettings?.banks || initialBanks} bankDomains={userSettings?.bankDomains || {}} onUpdate={(b, d) => saveSettingsToFirebase({ banks: b, bankDomains: d })} />
                        </Accordion>
                    </CardContent>
                </Card>
            </TabsContent>

            <TabsContent value="data">
                <Card className="border-border/50 shadow-sm">
                    <CardHeader><CardTitle>Backup & Segurança</CardTitle></CardHeader>
                    <CardContent>
                        <Button className="w-full" variant="outline">
                            <FileDown className="mr-2 h-4 w-4" /> Exportar Banco de Dados (Excel)
                        </Button>
                    </CardContent>
                </Card>
            </TabsContent>

            <TabsContent value="account">
                 <Card className="border-border/50 shadow-sm">
                    <CardHeader><CardTitle>Minha Conta</CardTitle></CardHeader>
                    <CardContent>
                        <Link href="/profile">
                            <Button>Gerenciar Perfil</Button>
                        </Link>
                    </CardContent>
                </Card>
            </TabsContent>
        </Tabs>
    </AppLayout>
  );
}
