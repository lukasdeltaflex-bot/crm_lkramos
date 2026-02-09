
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
    Eye,
    Settings2,
    Palette,
    Shapes,
    Monitor
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
                        Siga os passos abaixo para dominar cada funcionalidade de última geração.
                    </CardDescription>
                </CardHeader>
            </Card>

            <Accordion type="single" collapsible className="w-full space-y-4">
                <AccordionItem value="dashboard" className="border rounded-xl bg-card px-4 shadow-sm">
                    <AccordionTrigger className="hover:no-underline">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-blue-100 text-blue-600"><LayoutDashboard className="h-5 w-5" /></div>
                            <div className="text-left">
                                <p className="font-bold">1. Dashboard Harmonizado & Simétrico</p>
                                <p className="text-xs text-muted-foreground">Radar de Vendas e Inteligência Diária</p>
                            </div>
                        </div>
                    </AccordionTrigger>
                    <AccordionContent className="pt-2 pb-4 space-y-4 text-sm leading-relaxed">
                        <p>O Dashboard foi desenhado para ser sua torre de controle com simetria absoluta.</p>
                        <ul className="list-disc pl-5 space-y-2">
                            <li><strong>Radar de Vendas (<Zap className="inline h-3 w-3 text-orange-500" />)</strong>: Monitora automaticamente clientes com contratos pagos há mais de 12 meses. O card é fixo para manter a harmonia visual, mostrando "Radar Limpo" quando não há retenções.</li>
                            <li><strong>Inteligência Diária</strong>: Localizado ao lado do Radar, consolida aniversários e retornos agendados para que você nunca perca uma oportunidade de contato.</li>
                            <li><strong>Monitoramento de Esteira</strong>: A tabela de últimas propostas ocupa toda a largura para proporcionar uma leitura confortável e executiva dos status.</li>
                        </ul>
                    </AccordionContent>
                </AccordionItem>

                <AccordionItem value="dre" className="border rounded-xl bg-card px-4 shadow-sm">
                    <AccordionTrigger className="hover:no-underline">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-red-100 text-red-600"><Wallet className="h-5 w-5" /></div>
                            <div className="text-left">
                                <p className="font-bold">2. Controle Financeiro & DRE (Lucro Real)</p>
                                <p className="text-xs text-muted-foreground">Gestão de gastos e apuração de lucro líquido</p>
                            </div>
                        </div>
                    </AccordionTrigger>
                    <AccordionContent className="pt-2 pb-4 space-y-4 text-sm leading-relaxed">
                        <p>Saiba exatamente quanto sobra no seu bolso após pagar todas as despesas operacionais.</p>
                        <ul className="list-disc pl-5 space-y-2">
                            <li><strong>Lançamento de Despesas</strong>: Na aba "Despesas" do Financeiro, registre seus custos (Tráfego Pago, Aluguel, Sistema, etc.). Marque como "Paga" ou "Pendente" para controle de fluxo.</li>
                            <li><strong>Cálculo Automático</strong>: O sistema subtrai as despesas das comissões recebidas e exibe o <strong>Total de Despesas</strong> em destaque na aba específica.</li>
                            <li><strong>Customização de Categorias</strong>: Em Configurações, você pode criar suas próprias categorias de gastos para adaptar o DRE ao seu modelo de negócio.</li>
                        </ul>
                    </AccordionContent>
                </AccordionItem>

                <AccordionItem value="appearance" className="border rounded-xl bg-card px-4 shadow-sm">
                    <AccordionTrigger className="hover:no-underline">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-purple-100 text-purple-600"><Palette className="h-5 w-5" /></div>
                            <div className="text-left">
                                <p className="font-bold">3. Personalização de Aparência Premium</p>
                                <p className="text-xs text-muted-foreground">60+ Cores, arredondamento e estilo de barra lateral</p>
                            </div>
                        </div>
                    </AccordionTrigger>
                    <AccordionContent className="pt-2 pb-4 space-y-4 text-sm leading-relaxed">
                        <p>Adapte o sistema LK RAMOS à identidade visual da sua empresa.</p>
                        <ul className="list-disc pl-5 space-y-2">
                            <li><strong>Paleta de Elite</strong>: Mais de 60 opções de cores, incluindo tons executivos como <em>Midnight</em>, <em>Obsidian</em>, <em>Wine</em> e <em>Titanium</em>.</li>
                            <li><strong>Arredondamento (Radius)</strong>: Escolha entre o estilo <strong>Executivo</strong> (bordas retas), <strong>Moderno</strong> (padrão) ou <strong>Suave</strong> (bem arredondado).</li>
                            <li><strong>Contraste de Sidebar</strong>: Defina se o menu lateral deve ser sempre Escuro, sempre Claro ou acompanhar o tema geral. O sistema garante legibilidade máxima em qualquer modo.</li>
                        </ul>
                    </AccordionContent>
                </AccordionItem>

                <AccordionItem value="preview" className="border rounded-xl bg-card px-4 shadow-sm">
                    <AccordionTrigger className="hover:no-underline">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-zinc-100 text-zinc-600"><Eye className="h-5 w-5" /></div>
                            <div className="text-left">
                                <p className="font-bold">4. Visualizador de Documentos Inteligente</p>
                                <p className="text-xs text-muted-foreground">Conferência instantânea sem downloads</p>
                            </div>
                        </div>
                    </AccordionTrigger>
                    <AccordionContent className="pt-2 pb-4 space-y-4 text-sm leading-relaxed">
                        <p>Agilize sua conferência de propostas e mantenha seu computador limpo e seguro.</p>
                        <ul className="list-disc pl-5 space-y-2">
                            <li><strong>Acesso Rápido</strong>: Em qualquer anexo de cliente ou proposta, clique no ícone de "Olho".</li>
                            <li><strong>Visualização Segura</strong>: O documento abre em um modal flutuante dentro do sistema. Você confere o RG, CPF ou Contrato sem precisar baixar o arquivo.</li>
                            <li><strong>Privacidade</strong>: Ideal para manter a conformidade com a LGPD, evitando que dados sensíveis fiquem salvos em pastas de download.</li>
                        </ul>
                    </AccordionContent>
                </AccordionItem>

                <AccordionItem value="proposals" className="border rounded-xl bg-card px-4 shadow-sm">
                    <AccordionTrigger className="hover:no-underline">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-orange-100 text-orange-600"><TrendingUp className="h-5 w-5" /></div>
                            <div className="text-left">
                                <p className="font-bold">5. Esteira de Propostas & Automação</p>
                                <p className="text-xs text-muted-foreground">Linha do tempo e preenchimento inteligente</p>
                            </div>
                        </div>
                    </AccordionTrigger>
                    <AccordionContent className="pt-2 pb-4 space-y-4 text-sm leading-relaxed">
                        <p>Controle absoluto sobre o dinheiro em movimento com zero esforço repetitivo.</p>
                        <ul className="list-disc pl-5 space-y-2">
                            <li><strong>Automação de Datas</strong>: Ao marcar uma proposta como <strong>Pago</strong>, o sistema preenche as datas de Averbação e Pagamento automaticamente para você.</li>
                            <li><strong>Logs de Trâmite</strong>: Cada mudança de status ou anotação gera um registro histórico com data e usuário, criando uma trilha de auditoria completa.</li>
                            <li><strong>Capa de Proposta (PDF)</strong>: Gere um documento oficial da operação com visual executivo, pronto para impressão ou envio.</li>
                        </ul>
                    </AccordionContent>
                </AccordionItem>
            </Accordion>
        </div>

        <div className="lg:col-span-1 space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="text-sm font-black uppercase tracking-widest text-muted-foreground">Ações de Elite</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                    <Button variant="outline" className="w-full justify-start text-xs h-8" asChild>
                        <a href="/settings?tab=appearance"><Palette className="mr-2 h-3 w-3 text-purple-500" /> Trocar Estética</a>
                    </Button>
                    <Button variant="outline" className="w-full justify-start text-xs h-8" asChild>
                        <a href="/financial?tab=expenses"><Wallet className="mr-2 h-3 w-3 text-red-500" /> Lançar Despesa</a>
                    </Button>
                    <Button variant="outline" className="w-full justify-start text-xs h-8" asChild>
                        <a href="/customers?action=new"><Bot className="mr-2 h-3 w-3 text-blue-500" /> Cadastro via IA</a>
                    </Button>
                    <Button variant="outline" className="w-full justify-start text-xs h-8" asChild>
                        <a href="/financial"><CircleDollarSign className="mr-2 h-3 w-3 text-green-500" /> Controle de Caixa</a>
                    </Button>
                </CardContent>
            </Card>
        </div>
      </div>
    </AppLayout>
  );
}
