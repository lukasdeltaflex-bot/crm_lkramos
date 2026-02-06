
'use client';

import React, { useState, useEffect } from 'react';
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
} from '@/lib/config-data';
import { ListChecks, Palette, UserCog, Database, FileDown, Loader2, CloudUpload, CheckCircle2, XCircle } from 'lucide-react';
import { EditableList } from '@/components/settings/editable-list';
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

const DRIVE_LINKED_KEY = 'lk-ramos-google-drive-linked-v1';

export default function SettingsPage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const [isExporting, setIsExporting] = useState(false);
  const [isLinkingDrive, setIsLinkingDrive] = useState(false);
  const [isDriveLinked, setIsDriveLinked] = useState(false);

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
  const [banks, setBanks] = useState([...initialBanks]);
  const [showBankLogos, setShowBankLogos] = useState(true);

  useEffect(() => {
    if (userSettings) {
      setProductTypes(userSettings.productTypes || [...initialProductTypes]);
      setProposalStatuses(userSettings.proposalStatuses || [...initialProposalStatuses]);
      setCommissionStatuses(userSettings.commissionStatuses || [...initialCommissionStatuses]);
      setApprovingBodies(userSettings.approvingBodies || [...initialApprovingBodies]);
      setBanks(userSettings.banks || [...initialBanks]);
      setShowBankLogos(userSettings.showBankLogos ?? true);
    }
  }, [userSettings]);

  const updateSettings = async (updatedLists: Partial<UserSettings>) => {
    if (settingsDocRef) {
        const currentSettings = {
            productTypes,
            proposalStatuses,
            commissionStatuses,
            approvingBodies,
            banks,
            showBankLogos,
        };
      try {
        await setDoc(settingsDocRef, { ...currentSettings, ...updatedLists }, { merge: true });
        toast({ title: "Configurações Salvas", description: "Suas alterações foram salvas com sucesso." });
      } catch (error) {
        console.error("Error updating settings:", error);
        toast({ variant: "destructive", title: "Erro ao Salvar", description: "Tente novamente." });
      }
    }
  };

  const handleGlobalBackup = async () => {
    if (!allCustomers || !allProposals) {
        toast({ variant: "destructive", title: "Dados não carregados", description: "Aguarde o carregamento." });
        return;
    }

    setIsExporting(true);
    try {
        const { utils, writeFile } = await import('xlsx');
        const customerData = allCustomers.map(c => ({
            ID: c.numericId, Nome: c.name, CPF: c.cpf, Telefone: c.phone, Nascimento: c.birthDate,
            Email: c.email || '-', Cidade: c.city || '-', Estado: c.state || '-'
        }));
        const proposalData = allProposals.map(p => ({
            Proposta: p.proposalNumber, Produto: p.product, Status: p.status, 
            Banco: p.bank, Valor: p.grossAmount, Comissao: p.commissionValue
        }));

        const wb = utils.book_new();
        utils.book_append_sheet(wb, utils.json_to_sheet(customerData), 'Clientes');
        utils.book_append_sheet(wb, utils.json_to_sheet(proposalData), 'Propostas');
        writeFile(wb, `BACKUP_LK_RAMOS_${format(new Date(), 'dd_MM_yyyy')}.xlsx`);
        toast({ title: "Backup Concluído!", description: "Arquivo baixado com sucesso." });
    } catch (error) {
        toast({ variant: "destructive", title: "Erro no Backup", description: "Falha ao gerar arquivo." });
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
        toast({
            title: "Simulação: Conta Google Vinculada!",
            description: "O sistema agora simula o backup automático semanal.",
        });
    }, 1500);
  };

  const handleUnlinkDrive = () => {
    setIsDriveLinked(false);
    localStorage.removeItem(DRIVE_LINKED_KEY);
    toast({ title: "Google Drive Desvinculado" });
  };
  
  const isLoading = isUserLoading || isSettingsLoading;

  return (
    <AppLayout>
      <PageHeader title="Configurações" />
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
                        <EditableList title="Bancos" items={banks} setItems={(n) => { setBanks(n); updateSettings({ banks: n }); }} />
                        </Accordion>
                    )}
                    </CardContent>
                </Card>
            </TabsContent>
            <TabsContent value="appearance">
                 <Card>
                    <CardHeader>
                        <CardTitle>Aparência</CardTitle>
                        <CardDescription>Personalize o visual do seu ambiente de trabalho.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-8">
                        <ThemeColors />
                        
                        <Separator />

                        <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/30">
                            <div className="space-y-1">
                                <p className="text-sm font-medium">Logotipos dos Bancos</p>
                                <p className="text-xs text-muted-foreground">Exibe o ícone visual de cada banco nas tabelas e formulários.</p>
                            </div>
                            <Switch 
                                checked={showBankLogos} 
                                onCheckedChange={(val) => { 
                                    setShowBankLogos(val); 
                                    updateSettings({ showBankLogos: val }); 
                                }} 
                            />
                        </div>
                    </CardContent>
                </Card>
            </TabsContent>
            <TabsContent value="data">
                <Card>
                    <CardHeader>
                        <CardTitle>Dados & Segurança</CardTitle>
                        <CardDescription>Gerencie seus backups manuais e automáticos.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/30">
                            <div className="space-y-1">
                                <p className="text-sm font-medium">Backup Manual (Excel)</p>
                                <p className="text-xs text-muted-foreground">Baixe todos os dados agora.</p>
                            </div>
                            <Button onClick={handleGlobalBackup} disabled={isExporting || isLoading} className="min-w-[200px]">
                                {isExporting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Gerando...</> : <><FileDown className="mr-2 h-4 w-4" /> Baixar Excel</>}
                            </Button>
                        </div>

                        <div className={cn(
                            "flex flex-col gap-4 p-4 border rounded-lg transition-colors",
                            isDriveLinked ? "bg-green-50/20 border-green-200" : "bg-blue-50/20 border-blue-200"
                        )}>
                            <div className="flex items-center justify-between">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <CloudUpload className={cn("h-4 w-4", isDriveLinked ? "text-green-500" : "text-blue-500")} />
                                        <p className="text-sm font-medium">Backup para Google Drive</p>
                                        {isDriveLinked && <Badge variant="secondary" className="bg-green-100 text-green-700 hover:bg-green-100">ATIVO (Simulação)</Badge>}
                                    </div>
                                    <p className="text-xs text-muted-foreground">Cria uma cópia de segurança semanalmente no seu Drive.</p>
                                </div>
                                {isDriveLinked ? (
                                    <Button onClick={handleUnlinkDrive} variant="outline" className="text-destructive hover:bg-destructive/10">
                                        <XCircle className="mr-2 h-4 w-4" /> Desvincular Conta
                                    </Button>
                                ) : (
                                    <Button onClick={handleLinkGoogleDrive} disabled={isLinkingDrive || isLoading} variant="outline" className="min-w-[200px] border-blue-300 text-blue-600 hover:bg-blue-50">
                                        {isLinkingDrive ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Conectando...</> : "Vincular Conta Google"}
                                    </Button>
                                )}
                            </div>
                            {isDriveLinked && (
                                <div className="flex items-center gap-2 text-[11px] text-green-600 font-medium bg-green-50 p-2 rounded border border-green-100">
                                    <CheckCircle2 className="h-3 w-3" />
                                    <span>Vínculo simulado ativo com: {user?.email || 'sua-conta@gmail.com'}</span>
                                </div>
                            )}
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
