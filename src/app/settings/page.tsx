
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
import { ListChecks, Palette, UserCog, Database, FileDown, Loader2 } from 'lucide-react';
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

  // State for each list, initialized with default values
  const [productTypes, setProductTypes] = useState([...initialProductTypes]);
  const [proposalStatuses, setProposalStatuses] = useState([...initialProposalStatuses]);
  const [commissionStatuses, setCommissionStatuses] = useState([...initialCommissionStatuses]);
  const [approvingBodies, setApprovingBodies] = useState([...initialApprovingBodies]);
  const [banks, setBanks] = useState([...initialBanks]);

  // When userSettings are fetched from Firestore, update the local state
  useEffect(() => {
    if (userSettings) {
      setProductTypes(userSettings.productTypes || [...initialProductTypes]);
      setProposalStatuses(userSettings.proposalStatuses || [...initialProposalStatuses]);
      setCommissionStatuses(userSettings.commissionStatuses || [...initialCommissionStatuses]);
      setApprovingBodies(userSettings.approvingBodies || [...initialApprovingBodies]);
      setBanks(userSettings.banks || [...initialBanks]);
    }
  }, [userSettings]);

  // Function to update the entire settings document in Firestore
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
        toast({
            title: "Configurações Salvas",
            description: "Suas alterações foram salvas com sucesso."
        });
      } catch (error) {
        console.error("Error updating settings:", error);
        toast({
            variant: "destructive",
            title: "Erro ao Salvar Configurações",
            description: "Suas alterações podem não ter sido salvas. Tente novamente."
        });
      }
    }
  };

  const handleGlobalBackup = async () => {
    if (!allCustomers || !allProposals) {
        toast({
            variant: "destructive",
            title: "Dados não carregados",
            description: "Aguarde o carregamento dos dados para gerar o backup."
        });
        return;
    }

    setIsExporting(true);
    try {
        const { utils, writeFile } = await import('xlsx');

        // 1. Prepare Customers Sheet
        const customerData = allCustomers.map(c => ({
            ID: c.numericId,
            Nome: c.name,
            CPF: c.cpf,
            Telefone: c.phone,
            'Telefone 2': c.phone2 || '-',
            Email: c.email || '-',
            Nascimento: c.birthDate,
            CEP: c.cep || '-',
            Rua: c.street || '-',
            Numero: c.number || '-',
            Bairro: c.neighborhood || '-',
            Cidade: c.city || '-',
            Estado: c.state || '-',
            Observacoes: c.observations || '-'
        }));

        // 2. Prepare Proposals Sheet
        const proposalData = allProposals.map(p => ({
            'Nº Proposta': p.proposalNumber,
            Produto: p.product,
            Status: p.status,
            Cliente_ID: p.customerId,
            Banco: p.bank,
            Promotora: p.promoter,
            'Valor Bruto': p.grossAmount,
            'Valor Liquido': p.netAmount,
            Parcela: p.installmentAmount,
            Prazo: p.term,
            'Taxa Juros': p.interestRate || '-',
            'Data Digitacao': p.dateDigitized ? format(new Date(p.dateDigitized), 'dd/MM/yyyy') : '-',
            'Status Comissao': p.commissionStatus,
            'Vlr Comissao': p.commissionValue,
            'Vlr Pago': p.amountPaid,
            'Operador': p.operator || '-'
        }));

        const wb = utils.book_new();
        
        const wsCustomers = utils.json_to_sheet(customerData);
        const wsProposals = utils.json_to_sheet(proposalData);

        utils.book_append_sheet(wb, wsCustomers, 'Clientes');
        utils.book_append_sheet(wb, wsProposals, 'Propostas');

        writeFile(wb, `BACKUP_GERAL_LK_RAMOS_${format(new Date(), 'dd_MM_yyyy')}.xlsx`);

        toast({
            title: "Backup Concluído!",
            description: "O arquivo Excel multi-abas foi gerado com sucesso."
        });
    } catch (error) {
        console.error("Backup error:", error);
        toast({
            variant: "destructive",
            title: "Erro no Backup",
            description: "Não foi possível gerar o arquivo de backup."
        });
    } finally {
        setIsExporting(false);
    }
  };
  
  const isLoading = isUserLoading || isSettingsLoading;

  return (
    <AppLayout>
      <PageHeader title="Configurações" />
        <Tabs defaultValue="lists">
            <TabsList className="mb-4">
                <TabsTrigger value="lists"><ListChecks className="mr-2 h-4 w-4" /> Opções de Listas</TabsTrigger>
                <TabsTrigger value="appearance"><Palette className="mr-2 h-4 w-4" /> Aparência</TabsTrigger>
                <TabsTrigger value="data"><Database className="mr-2 h-4 w-4" /> Dados & Backup</TabsTrigger>
                <TabsTrigger value="account"><UserCog className="mr-2 h-4 w-4" /> Conta</TabsTrigger>
            </TabsList>
            <TabsContent value="lists">
                <Card>
                    <CardHeader>
                        <CardTitle>Gerenciamento de Opções</CardTitle>
                        <CardDescription>
                            Adicione, edite ou remova as opções usadas nos formulários de cadastro do sistema. As alterações são salvas automaticamente.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                    {isLoading ? (
                        <div className="space-y-4">
                            <Skeleton className="h-12 w-full" />
                            <Skeleton className="h-12 w-full" />
                            <Skeleton className="h-12 w-full" />
                            <Skeleton className="h-12 w-full" />
                            <Skeleton className="h-12 w-full" />
                        </div>
                    ) : (
                        <Accordion type="multiple" className="w-full space-y-4">
                        <EditableList 
                            title="Tipos de Produto" 
                            items={productTypes} 
                            setItems={(newItems) => {
                                setProductTypes(newItems);
                                updateSettings({ productTypes: newItems });
                            }} 
                        />
                        <EditableList 
                            title="Status da Proposta" 
                            items={proposalStatuses} 
                            setItems={(newItems) => {
                                setProposalStatuses(newItems);
                                updateSettings({ proposalStatuses: newItems });
                            }} 
                        />
                        <EditableList 
                            title="Status da Comissão" 
                            items={commissionStatuses} 
                            setItems={(newItems) => {
                                setCommissionStatuses(newItems);
                                updateSettings({ commissionStatuses: newItems });
                            }} 
                        />
                        <EditableList 
                            title="Órgãos Aprovadores" 
                            items={approvingBodies} 
                            setItems={(newItems) => {
                                setApprovingBodies(newItems);
                                updateSettings({ approvingBodies: newItems });
                            }} 
                        />
                        <EditableList 
                            title="Bancos" 
                            items={banks} 
                            setItems={(newItems) => {
                                setBanks(newItems);
                                updateSettings({ banks: newItems });
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
                        <CardTitle>Aparência</CardTitle>
                        <CardDescription>
                           Personalize a aparência do sistema.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-8">
                        <ThemeColors />
                    </CardContent>
                </Card>
            </TabsContent>
            <TabsContent value="data">
                <Card>
                    <CardHeader>
                        <CardTitle>Backup e Exportação Geral</CardTitle>
                        <CardDescription>
                            Baixe todos os seus dados em um único arquivo Excel organizado por abas. Útil para backup offline ou auditoria externa.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/30">
                            <div className="space-y-1">
                                <p className="text-sm font-medium">Backup Completo do Sistema</p>
                                <p className="text-xs text-muted-foreground">Inclui todos os clientes e todas as propostas cadastradas.</p>
                            </div>
                            <Button 
                                onClick={handleGlobalBackup} 
                                disabled={isExporting || isLoading}
                                className="min-w-[200px]"
                            >
                                {isExporting ? (
                                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Gerando...</>
                                ) : (
                                    <><FileDown className="mr-2 h-4 w-4" /> Gerar Backup (Excel)</>
                                )}
                            </Button>
                        </div>
                        <div className="text-[10px] text-muted-foreground bg-secondary/50 p-3 rounded italic">
                            Aviso: O arquivo gerado conterá dados sensíveis de clientes e valores financeiros. Mantenha este arquivo em local seguro.
                        </div>
                    </CardContent>
                </Card>
            </TabsContent>
            <TabsContent value="account">
                 <Card>
                    <CardHeader>
                        <CardTitle>Minha Conta</CardTitle>
                        <CardDescription>
                           Gerencie suas informações pessoais e de login.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Link href="/profile">
                            <Button>Ir para Meu Perfil</Button>
                        </Link>
                    </CardContent>
                </Card>
            </TabsContent>
        </Tabs>
    </AppLayout>
  );
}
