
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
import { ListChecks, Palette, UserCog } from 'lucide-react';
import { EditableList } from '@/components/settings/editable-list';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import type { UserSettings } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { setDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ThemeColors } from '@/components/settings/theme-colors';


export default function SettingsPage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();

  const settingsDocRef = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return doc(firestore, 'userSettings', user.uid);
  }, [firestore, user]);

  const { data: userSettings, isLoading: isSettingsLoading } = useDoc<UserSettings>(settingsDocRef);

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
  const updateSettings = (updatedLists: Partial<UserSettings>) => {
    if (settingsDocRef) {
        const currentSettings = {
            productTypes,
            proposalStatuses,
            commissionStatuses,
            approvingBodies,
            banks,
        };
      setDocumentNonBlocking(settingsDocRef, { ...currentSettings, ...updatedLists }, { merge: true });
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
