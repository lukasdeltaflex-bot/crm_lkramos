"use client"

import React from 'react';
import { AppLayout } from '@/components/app-layout';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { 
    Palette, 
    ShieldCheck, 
    Wallet, 
    Timer,
    Bot,
    History,
    Move,
    Shield,
    Camera,
    Sparkles
} from 'lucide-react';

export default function ManualPage() {
  return (
    <AppLayout>
      <PageHeader title="Manual de Operação LK RAMOS" />
      
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-3 space-y-6">
            <Accordion type="single" collapsible className="w-full space-y-4">
                <AccordionItem value="ocr" className="border rounded-xl bg-card px-4 shadow-sm border-primary/20">
                    <AccordionTrigger className="hover:no-underline">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-orange-100 text-orange-600"><Camera className="h-5 w-5" /></div>
                            <div className="text-left">
                                <p className="font-bold">8. Inteligência Visual (OCR)</p>
                                <p className="text-xs text-muted-foreground">Cadastro ultra-rápido via foto de documento</p>
                            </div>
                        </div>
                    </AccordionTrigger>
                    <AccordionContent className="pt-2 pb-4 space-y-4 text-sm leading-relaxed">
                        <p>O LK RAMOS agora possui visão computacional para automatizar o preenchimento de cadastros.</p>
                        <ul className="list-disc pl-5 space-y-2">
                            <li><strong>Como Usar</strong>: Clique em "Cadastrar via IA / Foto" na tela de clientes.</li>
                            <li><strong>Modo Foto</strong>: Tire uma foto nítida do RG, CNH ou Extrato de Empréstimos. A IA extrairá Nome, CPF, Data de Nascimento e Benefícios instantaneamente.</li>
                            <li><strong>Vantagem</strong>: Reduz em 90% o tempo de digitação e elimina erros humanos de transcrição.</li>
                        </ul>
                    </AccordionContent>
                </AccordionItem>

                <AccordionItem value="deadlines" className="border rounded-xl bg-card px-4 shadow-sm">
                    <AccordionTrigger>
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-red-100 text-red-600"><Timer className="h-5 w-5" /></div>
                            <div className="text-left"><p className="font-bold">1. Monitor de Prazo Crítico</p></div>
                        </div>
                    </AccordionTrigger>
                    <AccordionContent>O sistema alerta visualmente propostas paradas há mais de 2-5 dias úteis na esteira.</AccordionContent>
                </AccordionItem>

                <AccordionItem value="safety" className="border rounded-xl bg-card px-4 shadow-sm">
                    <AccordionTrigger>
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-zinc-100 text-zinc-600"><Shield className="h-5 w-5" /></div>
                            <div className="text-left"><p className="font-bold">6. Estabilização de Dados</p></div>
                        </div>
                    </AccordionTrigger>
                    <AccordionContent>O sistema agora bloqueia o reset indesejado do campo de **Gênero** e limpa dados invisíveis que causavam erros de servidor.</AccordionContent>
                </AccordionItem>
            </Accordion>
        </div>
      </div>
    </AppLayout>
  );
}
