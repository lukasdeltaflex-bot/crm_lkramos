'use client';

import React, { Suspense } from 'react';
import { AppLayout } from '@/components/app-layout';
import { PageHeader } from '@/components/page-header';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Settings2, Calculator, History } from 'lucide-react';
import { RulesManager } from './components/rules-manager';
import { SimulationEngine } from './components/simulation-engine';
import { SimulationHistory } from './components/simulation-history';

function PortabilitySimulatorContent() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <PageHeader title="Simulador de Portabilidade" />
      </div>

      <Tabs defaultValue="simulator" className="w-full">
        <TabsList className="bg-background/50 p-1 flex w-fit gap-2 border shadow-inner rounded-full h-11 mb-6">
          <TabsTrigger 
            value="rules" 
            className="gap-2 rounded-full font-bold px-6 h-9 transition-all text-xs data-[state=active]:bg-primary data-[state=active]:text-white shadow-none"
          >
            <Settings2 className="h-4 w-4" />
            Configurar Regras
          </TabsTrigger>
          <TabsTrigger 
            value="simulator" 
            className="gap-2 rounded-full font-bold px-6 h-9 transition-all text-xs data-[state=active]:bg-green-500 data-[state=active]:text-white shadow-none"
          >
            <Calculator className="h-4 w-4" />
            Motor de Simulação
          </TabsTrigger>
          <TabsTrigger 
            value="history" 
            className="gap-2 rounded-full font-bold px-6 h-9 transition-all text-xs data-[state=active]:bg-zinc-800 data-[state=active]:text-white shadow-none"
          >
            <History className="h-4 w-4" />
            Histórico Operacional
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="rules" className="mt-0 outline-none animate-in fade-in">
          <RulesManager />
        </TabsContent>
        
        <TabsContent value="simulator" className="mt-0 outline-none animate-in fade-in">
          <SimulationEngine />
        </TabsContent>

        <TabsContent value="history" className="mt-0 outline-none animate-in fade-in">
          <SimulationHistory />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default function PortabilitySimulatorPage() {
  return (
    <AppLayout>
      <Suspense fallback={<Skeleton className="h-64 w-full" />}>
        <PortabilitySimulatorContent />
      </Suspense>
    </AppLayout>
  );
}
