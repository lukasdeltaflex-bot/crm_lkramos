
'use client';

import React from 'react';
import { AppLayout } from '@/components/app-layout';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { 
    LayoutDashboard, 
    Users, 
    FileText, 
    CircleDollarSign, 
    CalendarClock, 
    Bot, 
    Zap, 
    TrendingUp, 
    ShieldCheck, 
    Landmark,
    FileBadge,
    Cloud,
    Wallet,
    Eye
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function ManualPage() {
  return (
    <AppLayout>
      <PageHeader title="Manual de Operação LK RAMOS" />
      
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-3 space-y-6">
            <Card className="border-primary/20 bg-primary/5">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <ShieldCheck className="text-primary" />
                        Bem-vindo ao Sistema de Elite
                    </CardTitle>
                    <CardDescription>
                        Este guia foi projetado para transformar você em um mestre na operação do LK RAMOS. 
                        Siga os passos abaixo para dominar cada funcionalidade.
                    </CardDescription>
                </CardHeader>
            </Card>

            <Accordion type="single" collapsible className="w-full space-y-4">
                <AccordionItem value="dashboard" className="border rounded-xl bg-card px-4 shadow-sm">
                    <AccordionTrigger className="hover:no-underline">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-blue-100 text-blue-600"><LayoutDashboard className="h-5 w-5" /></div>
                            <div className="text-left">
                                <p className="font-bold">1. Dashboard: A Torre de Comando</p>
                                <p className="text-xs text-muted-foreground">Volume de produção e Radar de Vendas</p>
                            </div>
                        </div>
                    </AccordionTrigger>
                    <AccordionContent className="pt-2 pb-4 space-y-4 text-sm leading-relaxed">
                        <p>O Dashboard é sua ferramenta de decisão rápida, organizado em uma hierarquia estratégica.</p>
                        <ul className="list-disc pl-5 space-y-2">
                            <li><strong>Radar de Vendas (<Zap className="inline h-3 w-3 text-orange-500" />)</strong>: Mostra clientes com contratos pagos há mais de 12 meses. Mesmo vazio, o card mantém a simetria do layout.</li>
                            <li><strong>Inteligência Diária</strong>: Consolida aniversários, retornos e pendências críticas do dia.</li>
                            <li><strong>Rankings de Performance</strong>: Área central expandida para análise de rentabilidade por banco, promotora e operador.</li>
                        </ul>
                    </AccordionContent>
                </AccordionItem>

                <AccordionItem value="dre" className="border rounded-xl bg-card px-4 shadow-sm">
                    <AccordionTrigger className="hover:no-underline">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-red-100 text-red-600"><Wallet className="h-5 w-5" /></div>
                            <div className="text-left">
                                <p className="font-bold">2. Controle de Despesas & Lucro Real (DRE)</p>
                                <p className="text-xs text-muted-foreground">Saiba quanto sobra no seu bolso</p>
                            </div>
                        </div>
                    </AccordionTrigger>
                    <AccordionContent className="pt-2 pb-4 space-y-4 text-sm leading-relaxed">
                        <p>Não basta faturar, é preciso ter lucro. O LK RAMOS ajuda você a enxergar a saúde real da sua empresa.</p>
                        <ul className="list-disc pl-5 space-y-2">
                            <li><strong>Lançamento de Gastos</strong>: Na aba "Despesas" do Financeiro, registre aluguel, luz, internet e principalmente o investimento em Tráfego Pago.</li>
                            <li><strong>Cálculo Automático</strong>: O sistema subtrai as despesas das comissões recebidas e exibe o **Lucro Líquido Real** em destaque.</li>
                            <li><strong>Visão Mensal</strong>: Os cálculos respeitam o filtro de período selecionado no topo da página.</li>
                        </ul>
                    </AccordionContent>
                </AccordionItem>

                <AccordionItem value="preview" className="border rounded-xl bg-card px-4 shadow-sm">
                    <AccordionTrigger className="hover:no-underline">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-zinc-100 text-zinc-600"><Eye className="h-5 w-5" /></div>
                            <div className="text-left">
                                <p className="font-bold">3. Visualizador de Documentos Inteligente</p>
                                <p className="text-xs text-muted-foreground">Conferência rápida sem downloads</p>
                            </div>
                        </div>
                    </AccordionTrigger>
                    <AccordionContent className="pt-2 pb-4 space-y-4 text-sm leading-relaxed">
                        <p>Agilize sua conferência de propostas e mantenha seu computador limpo.</p>
                        <ul className="list-disc pl-5 space-y-2">
                            <li><strong>Ícone de Visualização</strong>: Em qualquer anexo (ficha do cliente ou proposta), clique no ícone de "Olho".</li>
                            <li><strong>Modo Flutuante</strong>: O documento abre em uma janela segura sobreposta ao sistema.</li>
                            <li><strong>Privacidade</strong>: Evite baixar documentos confidenciais de clientes no seu disco rígido pessoal.</li>
                        </ul>
                    </AccordionContent>
                </AccordionItem>

                <AccordionItem value="proposals" className="border rounded-xl bg-card px-4 shadow-sm">
                    <AccordionTrigger className="hover:no-underline">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-orange-100 text-orange-600"><TrendingUp className="h-5 w-5" /></div>
                            <div className="text-left">
                                <p className="font-bold">4. Esteira de Propostas & Automação</p>
                                <p className="text-xs text-muted-foreground">Linha do tempo e preenchimento inteligente</p>
                            </div>
                        </div>
                    </AccordionTrigger>
                    <AccordionContent className="pt-2 pb-4 space-y-4 text-sm leading-relaxed">
                        <p>Controle absoluto sobre o dinheiro em movimento.</p>
                        <ul className="list-disc pl-5 space-y-2">
                            <li><strong>Automação de Datas</strong>: Ao marcar como **Pago**, o sistema preenche a Averbação e Pagamento automaticamente.</li>
                            <li><strong>Histórico de Trâmites</strong>: Cada mudança de status gera um log automático.</li>
                            <li><strong>Capa de Proposta (PDF)</strong>: Gere o documento oficial da operação com visual executivo para impressão.</li>
                        </ul>
                    </AccordionContent>
                </AccordionItem>

                <AccordionItem value="limits" className="border rounded-xl bg-card px-4 shadow-sm">
                    <AccordionTrigger className="hover:no-underline">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-orange-100 text-orange-600"><Cloud className="h-5 w-5" /></div>
                            <div className="text-left">
                                <p className="font-bold">5. Infraestrutura Profissional</p>
                                <p className="text-xs text-muted-foreground">Segurança Google Cloud</p>
                            </div>
                        </div>
                    </AccordionTrigger>
                    <AccordionContent className="pt-2 pb-4 space-y-4 text-sm leading-relaxed">
                        <p>O seu sistema utiliza infraestrutura de nuvem profissional (Firebase).</p>
                        <ul className="list-disc pl-5 space-y-2">
                            <li><strong>Banco de Dados</strong>: Suporta até 50.000 leituras diárias gratuitamente.</li>
                            <li><strong>Anexos</strong>: Você possui 5 GB de armazenamento gratuito para documentos de clientes.</li>
                        </ul>
                    </AccordionContent>
                </AccordionItem>
            </Accordion>
        </div>

        <div className="lg:col-span-1 space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="text-sm font-black uppercase tracking-widest text-muted-foreground">Links Rápidos</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                    <Button variant="outline" className="w-full justify-start text-xs h-8" asChild>
                        <a href="/customers?action=new"><Bot className="mr-2 h-3 w-3" /> Cadastro via IA</a>
                    </Button>
                    <Button variant="outline" className="w-full justify-start text-xs h-8" asChild>
                        <a href="/financial"><CircleDollarSign className="mr-2 h-3 w-3" /> Controle de Caixa</a>
                    </Button>
                </CardContent>
            </Card>
        </div>
      </div>
    </AppLayout>
  );
}
