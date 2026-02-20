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
    Sparkles,
    Search,
    ListChecks,
    Copy,
    Zap,
    Layout,
    FileDown,
    UserCheck,
    CloudSun
} from 'lucide-react';

export default function ManualPage() {
  return (
    <AppLayout>
      <PageHeader title="Guia de Operação LK RAMOS" />
      
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 pb-20">
        <div className="lg:col-span-3 space-y-6">
            <Accordion type="single" collapsible className="w-full space-y-4">
                
                {/* 1. INTELIGÊNCIA ARTIFICIAL */}
                <AccordionItem value="ai-features" className="border-2 rounded-2xl bg-card px-4 shadow-sm border-primary/10">
                    <AccordionTrigger className="hover:no-underline">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-xl bg-primary/10 text-primary"><Bot className="h-5 w-5" /></div>
                            <div className="text-left">
                                <p className="font-bold text-sm">1. Ecossistema de Inteligência Artificial</p>
                                <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">Extração, Visão e Resumos</p>
                            </div>
                        </div>
                    </AccordionTrigger>
                    <AccordionContent className="pt-2 pb-6 space-y-4 text-sm leading-relaxed">
                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="p-4 rounded-xl bg-muted/30 border">
                                <div className="flex items-center gap-2 mb-2">
                                    <Camera className="h-4 w-4 text-orange-500" />
                                    <h4 className="font-bold">Visão Computacional (OCR)</h4>
                                </div>
                                <p className="text-xs text-muted-foreground">No cadastro de clientes, use "Novo Cliente com IA" para processar fotos de RG, CNH ou Extratos. A IA extrai Nome, CPF e Benefícios instantaneamente.</p>
                            </div>
                            <div className="p-4 rounded-xl bg-muted/30 border">
                                <div className="flex items-center gap-2 mb-2">
                                    <Sparkles className="h-4 w-4 text-blue-500" />
                                    <h4 className="font-bold">Resumo de Notas com IA</h4>
                                </div>
                                <p className="text-xs text-muted-foreground">Dentro da ficha do cliente, o botão "Resumir com IA" organiza anotações bagunçadas em um histórico limpo e estratégico.</p>
                            </div>
                        </div>
                    </AccordionContent>
                </AccordionItem>

                {/* 2. AGILIDADE E BUSCA */}
                <AccordionItem value="search-agility" className="border-2 rounded-2xl bg-card px-4 shadow-sm border-primary/10">
                    <AccordionTrigger className="hover:no-underline">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-xl bg-blue-100 text-blue-600"><Search className="h-5 w-5" /></div>
                            <div className="text-left">
                                <p className="font-bold text-sm">2. Busca Nuclear e Agilidade</p>
                                <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">Precisão absoluta na localização</p>
                            </div>
                        </div>
                    </AccordionTrigger>
                    <AccordionContent className="pt-2 pb-6 space-y-4 text-sm leading-relaxed">
                        <ul className="space-y-3">
                            <li className="flex gap-3">
                                <div className="h-5 w-5 rounded-full bg-blue-500 text-white flex items-center justify-center text-[10px] font-black shrink-0">ID</div>
                                <p><strong>Busca Nuclear por ID</strong>: Ao digitar apenas números na busca (ex: "40"), o sistema isola exclusivamente o registro com aquele ID Numérico, ignorando ruídos de nomes ou CPFs.</p>
                            </li>
                            <li className="flex gap-3">
                                <div className="h-5 w-5 rounded-full bg-green-500 text-white flex items-center justify-center text-[10px] font-black shrink-0"><Copy className="h-3 w-3" /></div>
                                <p><strong>Cópia de Segurança</strong>: Clique no ícone de cópia ao lado de CPFs, Telefones, E-mails e CEPs para capturar os dados instantaneamente para colagem em sites bancários.</p>
                            </li>
                        </ul>
                    </AccordionContent>
                </AccordionItem>

                {/* 3. MEMÓRIA DE INTERFACE */}
                <AccordionItem value="interface-memory" className="border-2 rounded-2xl bg-card px-4 shadow-sm border-primary/10">
                    <AccordionTrigger className="hover:no-underline">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-xl bg-purple-100 text-purple-600"><Layout className="h-5 w-5" /></div>
                            <div className="text-left">
                                <p className="font-bold text-sm">3. Memória Operacional (Persistência)</p>
                                <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">Sua visão, sempre salva</p>
                            </div>
                        </div>
                    </AccordionTrigger>
                    <AccordionContent className="pt-2 pb-6 space-y-4 text-sm leading-relaxed">
                        <p>O LK RAMOS agora lembra das suas preferências mesmo após atualizar a página ou fechar o navegador:</p>
                        <div className="grid gap-3 md:grid-cols-2">
                            <div className="p-3 rounded-lg bg-muted/20 border-dashed border-2">
                                <h4 className="text-[10px] font-black uppercase mb-1">Colunas Customizadas</h4>
                                <p className="text-xs text-muted-foreground">A seleção de colunas visíveis e a ordem em que você as arrasta são salvas automaticamente.</p>
                            </div>
                            <div className="p-3 rounded-lg bg-muted/20 border-dashed border-2">
                                <h4 className="text-[10px] font-black uppercase mb-1">Paginação Inteligente</h4>
                                <p className="text-xs text-muted-foreground">Se você escolher visualizar 50 ou 100 linhas, o sistema manterá essa configuração na próxima sessão.</p>
                            </div>
                        </div>
                    </AccordionContent>
                </AccordionItem>

                {/* 4. BRANDING E APARÊNCIA */}
                <AccordionItem value="branding-studio" className="border-2 rounded-2xl bg-card px-4 shadow-sm border-primary/10">
                    <AccordionTrigger className="hover:no-underline">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-xl bg-amber-100 text-amber-600"><Palette className="h-5 w-5" /></div>
                            <div className="text-left">
                                <p className="font-bold text-sm">4. Estúdio de Branding Elite</p>
                                <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">Identidade Visual Industrial</p>
                            </div>
                        </div>
                    </AccordionTrigger>
                    <AccordionContent className="pt-2 pb-6 space-y-4 text-sm leading-relaxed">
                        <p>Personalize a experiência total da sua marca através da aba <strong>Configurações > Aparência</strong>:</p>
                        <ul className="list-disc pl-5 space-y-2 text-xs">
                            <li><strong>Fundos Atmosféricos (Aura)</strong>: Ative gradientes de profundidade como Nebula ou Ocean que brilham sob a interface.</li>
                            <li><strong>Motores de Tipografia</strong>: Escolha entre fontes Modernas, Clássicas ou Industriais com aplicação global.</li>
                            <li><strong>Ritmo (Motion)</strong>: Ajuste a velocidade das transições para um feeling Atmosférico ou Instantâneo.</li>
                            <li><strong>Laboratório 360°</strong>: Valide suas mudanças no simulador lateral que acompanha a rolagem da tela.</li>
                        </ul>
                    </AccordionContent>
                </AccordionItem>

                {/* 5. SEGURANÇA E BLINDAGEM */}
                <AccordionItem value="security-blind" className="border-2 rounded-2xl bg-card px-4 shadow-sm border-primary/10">
                    <AccordionTrigger className="hover:no-underline">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-xl bg-green-100 text-green-600"><ShieldCheck className="h-5 w-5" /></div>
                            <div className="text-left">
                                <p className="font-bold text-sm">5. Blindagem Nuclear de Dados</p>
                                <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">Integridade absoluta dos registros</p>
                            </div>
                        </div>
                    </AccordionTrigger>
                    <AccordionContent className="pt-2 pb-6 space-y-4 text-sm leading-relaxed">
                        <ul className="space-y-3">
                            <li className="flex items-start gap-2">
                                <UserCheck className="h-4 w-4 text-green-600 shrink-0" />
                                <div>
                                    <p className="font-bold">Correção de Gênero</p>
                                    <p className="text-xs text-muted-foreground">Blindagem aplicada para garantir que o campo de Gênero nunca resete ou venha vazio durante a edição de clientes.</p>
                                </div>
                            </li>
                            <li className="flex items-start gap-2">
                                <FileDown className="h-4 w-4 text-blue-600 shrink-0" />
                                <div>
                                    <p className="font-bold">Backup Total em 1-Clique</p>
                                    <p className="text-xs text-muted-foreground">Na aba "Dados", você pode exportar toda a sua base de Clientes e Propostas para Excel instantaneamente para segurança offline.</p>
                                </div>
                            </li>
                        </ul>
                    </AccordionContent>
                </AccordionItem>

            </Accordion>
        </div>

        {/* BARRA LATERAL DE RESUMO RÁPIDO */}
        <div className="lg:col-span-1 space-y-6">
            <Card className="border-2 border-primary/20 bg-primary/5">
                <CardHeader className="pb-2">
                    <CardTitle className="text-xs font-black uppercase tracking-widest flex items-center gap-2">
                        <Zap className="h-3 w-3 fill-current" /> Atalhos de Elite
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-1">
                        <p className="text-[10px] font-black text-muted-foreground uppercase">Busca</p>
                        <p className="text-xs font-bold">CTRL + K</p>
                    </div>
                    <div className="space-y-1">
                        <p className="text-[10px] font-black text-muted-foreground uppercase">Alternar Menu</p>
                        <p className="text-xs font-bold">CTRL + B</p>
                    </div>
                    <div className="space-y-1">
                        <p className="text-[10px] font-black text-muted-foreground uppercase">Imprimir Seleção</p>
                        <p className="text-xs font-bold">Botão na aba Propostas</p>
                    </div>
                </CardContent>
            </Card>

            <Card className="border-2 border-dashed border-muted-foreground/20 bg-muted/5">
                <CardHeader className="pb-2">
                    <CardTitle className="text-xs font-black uppercase tracking-widest text-muted-foreground">Estado do Sistema</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center gap-2 text-green-600">
                        <div className="h-2 w-2 rounded-full bg-current animate-pulse" />
                        <span className="text-[10px] font-black uppercase">Blindagem Nuclear Ativa</span>
                    </div>
                    <p className="text-[9px] text-muted-foreground mt-2 leading-tight">
                        Versão 2.5.0 - Motor visual e lógico 100% estabilizados.
                    </p>
                </CardContent>
            </Card>
        </div>
      </div>
    </AppLayout>
  );
}
