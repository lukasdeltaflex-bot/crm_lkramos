
'use client';

import React, { useState } from 'react';
import { AppLayout } from '@/components/app-layout';
import { PageHeader } from '@/components/page-header';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Accordion,
} from '@/components/ui/accordion';
import {
  productTypes as initialProductTypes,
  proposalStatuses as initialProposalStatuses,
  approvingBodies as initialApprovingBodies,
  banks as initialBanks,
  commissionStatuses as initialCommissionStatuses,
} from '@/lib/config-data';
import { ListChecks } from 'lucide-react';
import { EditableList } from '@/components/settings/editable-list';

export default function SettingsPage() {
  const [productTypes, setProductTypes] = useState([...initialProductTypes]);
  const [proposalStatuses, setProposalStatuses] = useState([...initialProposalStatuses]);
  const [commissionStatuses, setCommissionStatuses] = useState([...initialCommissionStatuses]);
  const [approvingBodies, setApprovingBodies] = useState([...initialApprovingBodies]);
  const [banks, setBanks] = useState([...initialBanks]);

  return (
    <AppLayout>
      <PageHeader title="Configurações" />
      <Card>
        <CardHeader>
          <div className="flex items-start gap-4">
            <ListChecks className="h-8 w-8 text-muted-foreground mt-1" />
            <div>
              <CardTitle>Gerenciamento de Opções</CardTitle>
              <CardDescription>
                Visualize e edite as listas de opções usadas em todo o sistema.
                As alterações serão salvas para uso futuro.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Accordion type="multiple" className="w-full space-y-4">
            <EditableList title="Tipos de Produto" items={productTypes} setItems={setProductTypes} />
            <EditableList title="Status da Proposta" items={proposalStatuses} setItems={setProposalStatuses} />
            <EditableList title="Status da Comissão" items={commissionStatuses} setItems={setCommissionStatuses} />
            <EditableList title="Órgãos Aprovadores" items={approvingBodies} setItems={setApprovingBodies} />
            <EditableList title="Bancos" items={banks} setItems={setBanks} />
          </Accordion>
        </CardContent>
      </Card>
    </AppLayout>
  );
}
