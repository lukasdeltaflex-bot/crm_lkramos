
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
    Bot
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
import { StatsCard } from '@/components/dashboard/stats-card';

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
  const { user } = useUser();
  const firestore = useFirestore();
  const theme = useTheme();
  
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const settingsDocRef = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return doc(firestore, 'userSettings', user.uid);
  }, [firestore, user]);

  const { data: userSettings, isLoading: isSettingsLoading } = useDoc<UserSettings>(settingsDocRef);

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

  useEffect(() => {
    if (userSettings) {
      setPreview(prev => ({
        ...prev,
        radius: userSettings.radius || theme.radius,
        containerStyle: userSettings.containerStyle || theme.containerStyle,
        backgroundTexture: userSettings.backgroundTexture || theme.backgroundTexture,
        colorIntensity: userSettings.colorIntensity || theme.colorIntensity,
        animationStyle: userSettings.animationStyle || theme.animationStyle,
        fontStyle: userSettings.fontStyle || theme.fontStyle,
        sidebarStyle: userSettings.sidebarStyle || theme.sidebarStyle,
        statusColors: userSettings.statusColors || theme.statusColors
      }));
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

  const isLoading = isSettingsLoading;

  const colorableStatuses = [
    "EM ANDAMENTO", "AGUARDANDO SALDO", "PAGO", 
    "SALDO PAGO", "PENDENTE", "REPROVADO", 
    "PAGA", "PARCIAL", "COMISSÃO ESPERADA", 
    "SALDO A RECEBER"
  ];

  return (
    <AppLayout>
      <PageHeader title="Estúdio de Branding LK RAMOS" />
        <Tabs defaultValue="appearance" className="w-full">
            <TabsList className="mb-8 bg-muted/30 p-1.5 h-14 rounded-full border border-border/50 flex w-fit gap-2">
                <TabsTrigger 
                    value="lists" 
                    className="rounded-full px-6 gap-2 data-[state=active]:bg-blue-500 data-[state=active]:text-white transition-all shadow-none"
                >
                    <ListChecks className="h-4 w-4" /> 
                    Parâmetros
                </TabsTrigger>
                <TabsTrigger 
                    value="appearance" 
                    className="rounded-full px-6 gap-2 data-[state=active]:bg-primary data-[state=active]:text-white transition-all shadow-none"
                >
                    <Palette className="h-4 w-4" /> 
                    Aparência
                </TabsTrigger>
                <TabsTrigger 
                    value="data" 
                    className="rounded-full px-6 gap-2 data-[state=active]:bg-green-600 data-[state=active]:text-white transition-all shadow-none"
                >
                    <Database className="h-4 w-4" /> 
                    Dados & Backup
                </TabsTrigger>
                <TabsTrigger 
                    value="account" 
                    className="rounded-full px-6 gap-2 data-[state=active]:bg-purple-600 data-[state=active]:text-white transition-all shadow-none"
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
                                    <CardDescription>Customize a estética industrial e o brilho da sua marca.</CardDescription>
                                </div>
                                <Button onClick={handleApplyAppearance} size="sm" className="bg-primary hover:bg-primary/90">
                                    <Sparkles className="mr-2 h-4 w-4" /> Aplicar Mudanças
                                </Button>
                            </CardHeader>
                            <CardContent className="space-y-10">
                                <ThemeColors />

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
                                                {userSettings?.customLogoURL && <Button size="sm" variant="ghost" className="text-destructive" onClick={() => updateSettings({ customLogoURL: '' })}><X className="h-3 w-3 mr-2" /> Remover</Button>}
                                            </div>
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
                                        <div className="flex items-center gap-2"><MousePointer2 className="h-4 w-4 text-primary" /><h4 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Arredondamento</h4></div>
                                        <RadioGroup value={preview.radius} onValueChange={(val) => setPreview(p => ({ ...p, radius: val }))} className="grid grid-cols-3 gap-2">
                                            {['reto', 'extra-discreto', 'discreto', 'moderno', 'amigavel', 'organico', 'capsula'].map((r) => (
                                                <Label key={r} htmlFor={`r-${r}`} className={cn("flex items-center justify-center rounded-md border-2 p-3 cursor-pointer capitalize text-[10px] font-bold text-center", preview.radius === r ? "border-primary bg-primary/5" : "border-muted")}>
                                                    <RadioGroupItem value={r} id={`r-${r}`} className="sr-only" />{r}
                                                </Label>
                                            ))}
                                        </RadioGroup>
                                    </div>
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-2"><Type className="h-4 w-4 text-primary" /><h4 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Tipografia</h4></div>
                                        <RadioGroup value={preview.fontStyle} onValueChange={(val) => setPreview(p => ({ ...p, fontStyle: val }))} className="grid grid-cols-2 gap-2">
                                            {['moderno', 'classico', 'mono', 'arredondado', 'industrial', 'futurista'].map((f) => (
                                                <Label key={f} htmlFor={`f-${f}`} className={cn("flex items-center justify-center rounded-md border-2 p-3 cursor-pointer capitalize text-xs font-bold", preview.fontStyle === f ? "border-primary bg-primary/5" : "border-muted")}>
                                                    <RadioGroupItem value={f} id={`f-${f}`} className="sr-only" />{f}
                                                </Label>
                                            ))}
                                        </RadioGroup>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="lg:col-span-1">
                        <Card className="sticky top-20 border-primary/20 bg-primary/[0.02]">
                            <CardHeader>
                                <CardTitle className="text-lg font-bold flex items-center gap-2">
                                    <Eye className="h-5 w-5 text-primary" />
                                    Laboratório de Visualização
                                </CardTitle>
                                <CardDescription>Simulação do card de status em tempo real.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className={cn(
                                    "p-6 rounded-2xl transition-all border shadow-sm",
                                    `texture-${preview.backgroundTexture}`,
                                    `radius-${preview.radius}`,
                                    `font-${preview.fontStyle}`,
                                    `style-${preview.containerStyle}`,
                                    `intensity-${preview.colorIntensity}`
                                )}>
                                    <StatsCard 
                                        title="EM ANDAMENTO" 
                                        value="R$ 45.000,00" 
                                        icon={Zap} 
                                        description="EXEMPLO DE STATUS"
                                        isHot={preview.containerStyle === 'glow' || preview.colorIntensity === 'neon'}
                                        overrideStatusColors={preview.statusColors}
                                        overrideContainerStyle={preview.containerStyle}
                                        overrideIntensity={preview.colorIntensity}
                                        overrideRadius={preview.radius}
                                    />
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
                    {isLoading ? <div className="space-y-4"><Skeleton className="h-12 w-full" /></div> : (
                        <Accordion type="multiple" className="w-full space-y-4">
                        <EditableList title="Tipos de Produto" items={userSettings?.productTypes || initialProductTypes} setItems={(n) => updateSettings({ productTypes: n as string[] })} />
                        <EditableList title="Status da Proposta" items={userSettings?.proposalStatuses || initialProposalStatuses} setItems={(n) => updateSettings({ proposalStatuses: n as string[] })} />
                        <EditableList title="Status da Comissão" items={userSettings?.commissionStatuses || initialCommissionStatuses} setItems={(n) => updateSettings({ commissionStatuses: n as string[] })} />
                        <EditableList title="Órgãos Aprovadores" items={userSettings?.approvingBodies || initialApprovingBodies} setItems={(n) => updateSettings({ approvingBodies: n as string[] })} />
                        <EditableList title="Categorias de Despesas" items={userSettings?.expenseCategories || initialExpenseCategories} setItems={(n) => updateSettings({ expenseCategories: n as string[] })} />
                        <BankEditableList banks={userSettings?.banks || initialBanks} bankDomains={userSettings?.bankDomains || {}} onUpdate={(b, d) => updateSettings({ banks: b, bankDomains: d })} />
                        </Accordion>
                    )}
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
