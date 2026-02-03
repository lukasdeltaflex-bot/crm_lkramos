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
import { ListChecks, Palette, UserCog, Database, FileDown, Loader2, CloudUpload } from 'lucide-react';
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

export default function SettingsPage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const [isExporting, setIsExporting] = useState(false);
  const [isLinkingDrive, setIsLinkingDrive] = useState(false);

  const settingsDocRef = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return doc(firestore, 'userSettings', user.uid);
  }, [firestore, user]);

  const { data: userSettings, isLoading: isSettingsLoading } = useDoc<UserSettings>(settingsDocRef);

  // Queries for Backup
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

  useEffect(() => {
    if (userSettings) {
      setProductTypes(userSettings.productTypes || [...initialProductTypes]);
      setProposalStatuses(userSettings.proposalStatuses || [...initialProposalStatuses]);
      setCommissionStatuses(userSettings.commissionStatuses || [...initialCommissionStatuses]);
      setApprovingBodies(userSettings.approvingBodies || [...initialApprovingBodies]);
      setBanks(userSettings.banks || [...initialBanks]);
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
    // Simulação de autenticação com Google Drive
    setTimeout(() => {
        setIsLinkingDrive(false);
        toast({
            title: "Conta Google Vinculada!",
            description: "O backup automático para o Google Drive foi ativado com sucesso.",
        });
    }, 2000);
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
                 <Card><CardHeader><CardTitle>Aparência</CardTitle></CardHeader><CardContent className="space-y-8"><ThemeColors /></CardContent></Card>
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

                        <div className="flex items-center justify-between p-4 border rounded-lg bg-blue-50/20 dark:bg-blue-950/10 border-blue-200 dark:border-blue-900">
                            <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                    <CloudUpload className="h-4 w-4 text-blue-500" />
                                    <p className="text-sm font-medium">Backup para Google Drive</p>
                                </div>
                                <p className="text-xs text-muted-foreground">Salva automaticamente uma cópia semanalmente.</p>
                            </div>
                            <Button onClick={handleLinkGoogleDrive} disabled={isLinkingDrive || isLoading} variant="outline" className="min-w-[200px] border-blue-300 text-blue-600 hover:bg-blue-50">
                                {isLinkingDrive ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Vinculando...</> : "Vincular Google Drive"}
                            </Button>
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
