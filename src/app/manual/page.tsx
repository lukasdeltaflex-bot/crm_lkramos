"use client"

import React from 'react';
import { AppLayout } from '@/components/app-layout';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { 
    Palette, 
    ShieldCheck, 
    Wallet, 
    Bot,
    Camera,
    Sparkles,
    Search,
    ListChecks,
    Copy,
    Zap,
    Layout,
    FileDown,
    UserCheck,
    CloudSun,
    MessageSquareText,
    History,
    Printer,
    Timer,
    Check,
    CreditCard,
    Landmark,
    FileBadge
} from 'lucide-react';

export default function ManualPage() {
  return (
    <AppLayout>
      <PageHeader title="Guia de Operação LK RAMOS" />
      
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 pb-20">
        <div className="lg:col-span-3 space-y-6">
            <Accordion type="single" collapsible className="w-full space-y-4">
                
                {/* 1. INTELIGÊNCIA ARTIFICIAL E VENDAS */}
                <AccordionItem value="ai-features" className="border-2 rounded-2xl bg-card px-4 shadow-sm border-primary/10">
                    <AccordionTrigger className="hover:no-underline">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-xl bg-orange-100 text-orange-600"><Zap className="h-5 w-5" /></div>
                            <div className="text-left">
                                <p className="font-bold text-sm">1. Ecossistema de IA e Vendas</p>
                                <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">Persuasão, Visão e Resumos</p>
                            </div>
                        </div>
                    </AccordionTrigger>
                    <AccordionContent className="pt-2 pb-6 space-y-4 text-sm leading-relaxed">
                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="p-4 rounded-xl bg-orange-500/5 border border-orange-500/20">
                                <div className="flex items-center gap-2 mb-2">
                                    <MessageSquareText className="h-4 w-4 text-orange-600" />
                                    <h4 className="font-bold">Smart Sales Pitch IA</h4>
                                </div>
                                <p className="text-xs text-muted-foreground">Na ficha do cliente, use o botão "Smart Pitch" para gerar scripts de abordagem magnéticos. A IA analisa o histórico do cliente e cria o texto perfeito para enviar via WhatsApp.</p>
                            </div>
                            <div className="p-4 rounded-xl bg-blue-500/5 border border-blue-500/20">
                                <div className="flex items-center gap-2 mb-2">
                                    <Camera className="h-4 w-4 text-blue-600" />
                                    <h4 className="font-bold">Visão Computacional (OCR)</h4>
                                </div>
                                <p className="text-xs text-muted-foreground">O cadastro de clientes via foto extrai instantaneamente Nome, CPF e Benefícios de documentos oficiais (RG, CNH, Extratos).</p>
                            </div>
                        </div>
                    </AccordionContent>
                </AccordionItem>

                {/* 2. GESTÃO DE CARTÕES E PROSPECÇÃO */}
                <AccordionItem value="card-management" className="border-2 rounded-2xl bg-card px-4 shadow-sm border-primary/10">
                    <AccordionTrigger className="hover:no-underline">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-xl bg-blue-100 text-blue-600"><CreditCard className="h-5 w-5" /></div>
                            <div className="text-left">
                                <p className="font-bold text-sm">2. Gestão de Cartões (RMC/RCC)</p>
                                <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">Saque Complementar e Campanhas</p>
                            </div>
                        </div>
                    </AccordionTrigger>
                    <AccordionContent className="pt-2 pb-6 space-y-4 text-sm leading-relaxed">
                        <div className="space-y-4">
                            <p>O sistema agora permite um mapeamento cirúrgico para campanhas de saque complementar:</p>
                            <ul className="space-y-3">
                                <li className="flex gap-3">
                                    <div className="h-5 w-5 rounded-full bg-blue-500 text-white flex items-center justify-center shrink-0"><Check className="h-3 w-3" /></div>
                                    <p><strong>Vínculo por Benefício</strong>: Cada Número de Benefício (NB) pode ter seus bancos de RMC e RCC cadastrados individualmente.</p>
                                </li>
                                <li className="flex gap-3">
                                    <div className="h-5 w-5 rounded-full bg-orange-500 text-white flex items-center justify-center shrink-0"><Landmark className="h-3 w-3" /></div>
                                    <p><strong>Filtros Estratégicos</strong>: Na tela de Clientes, use os novos filtros de Banco RMC e RCC para listar apenas o público-alvo de um banco específico.</p>
                                </li>
                                <li className="flex gap-3">
                                    <div className="h-5 w-5 rounded-full bg-green-500 text-white flex items-center justify-center shrink-0"><FileBadge className="h-3 w-3" /></div>
                                    <p><strong>Dossiê Premium</strong>: O PDF oficial agora inclui a <strong>Idade Atual</strong> do cliente e o <strong>Mapa de Reservas</strong> completo dos cartões.</p>
                                </li>
                            </ul>
                        </div>
                    </AccordionContent>
                </AccordionItem>

                {/* 3. AGILIDADE OPERACIONAL */}
                <AccordionItem value="operational-agility" className="border-2 rounded-2xl bg-card px-4 shadow-sm border-primary/10">
                    <AccordionTrigger className="hover:no-underline">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-xl bg-purple-100 text-purple-600"><ListChecks className="h-5 w-5" /></div>
                            <div className="text-left">
                                <p className="font-bold text-sm">3. Agilidade Operacional</p>
                                <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">Ações em Massa e Busca Nuclear</p>
                            </div>
                        </div>
                    </AccordionTrigger>
                    <AccordionContent className="pt-2 pb-6 space-y-4 text-sm leading-relaxed">
                        <ul className="space-y-3">
                            <li className="flex gap-3">
                                <div className="h-5 w-5 rounded-full bg-blue-500 text-white flex items-center justify-center text-[10px] font-black shrink-0">ID</div>
                                <p><strong>Busca Nuclear Prioridade Zero</strong>: Digitar apenas números isola exclusivamente o registro por ID Numérico ou Número de Proposta, eliminando ruídos de texto.</p>
                            </li>
                            <li className="flex gap-3">
                                <div className="h-5 w-5 rounded-full bg-green-500 text-white flex items-center justify-center shrink-0"><Check className="h-3 w-3" /></div>
                                <p><strong>Baixa Coletiva (Financeiro)</strong>: Selecione múltiplos contratos e dê baixa total em comissões com um único clique.</p>
                            </li>
                            <li className="flex gap-3">
                                <div className="h-5 w-5 rounded-full bg-red-500 text-white flex items-center justify-center shrink-0"><Timer className="h-3 w-3" /></div>
                                <p><strong>Monitoramento de Ociosidade</strong>: O sistema identifica contratos sem atualização há mais de 48 horas, disparando alertas visuais de prazo crítico.</p>
                            </li>
                        </ul>
                    </AccordionContent>
                </AccordionItem>

                {/* 4. FLUXO FINANCEIRO INTELIGENTE */}
                <AccordionItem value="financial-logic" className="border-2 rounded-2xl bg-card px-4 shadow-sm border-primary/10">
                    <AccordionTrigger className="hover:no-underline">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-xl bg-green-100 text-green-600"><Wallet className="h-5 w-5" /></div>
                            <div className="text-left">
                                <p className="font-bold text-sm">4. Fluxo Financeiro Inteligente</p>
                                <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">Gatilhos Automáticos e Visibilidade</p>
                            </div>
                        </div>
                    </AccordionTrigger>
                    <AccordionContent className="pt-2 pb-6 space-y-4 text-sm leading-relaxed">
                        <p>O módulo financeiro opera com gatilhos automáticos para precisão de caixa:</p>
                        <div className="grid gap-3 md:grid-cols-2">
                            <div className="p-3 rounded-lg bg-muted/20 border-dashed border-2">
                                <h4 className="text-[10px] font-black uppercase mb-1">Gatilho de Averbação</h4>
                                <p className="text-xs text-muted-foreground">Ao preencher a <strong>Data de Averbação</strong>, o sistema marca a comissão como "Pendente" automaticamente, alimentando seu saldo a receber.</p>
                            </div>
                            <div className="p-3 rounded-lg bg-muted/20 border-dashed border-2">
                                <h4 className="text-[10px] font-black uppercase mb-1">Radar de Busca Retroativa</h4>
                                <p className="text-xs text-muted-foreground">Ao pesquisar na barra de busca do Financeiro, o sistema libera automaticamente a visão de todos os meses, ignorando a trava do mês vigente.</p>
                            </div>
                        </div>
                    </AccordionContent>
                </AccordionItem>

                {/* 5. BRANDING E APARÊNCIA PREMIUM */}
                <AccordionItem value="branding-studio" className="border-2 rounded-2xl bg-card px-4 shadow-sm border-primary/10">
                    <AccordionTrigger className="hover:no-underline">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-xl bg-primary/10 text-primary"><Palette className="h-5 w-5" /></div>
                            <div className="text-left">
                                <p className="font-bold text-sm">5. Branding e Estética Industrial</p>
                                <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">Auras Atmosféricas e Transparência</p>
                            </div>
                        </div>
                    </AccordionTrigger>
                    <AccordionContent className="pt-2 pb-6 space-y-4 text-sm leading-relaxed">
                        <ul className="list-disc pl-5 space-y-2 text-xs">
                            <li><strong>Fundos Atmosféricos (Aura)</strong>: Ative gradientes de profundidade que brilham sob a interface (Nebula, Ocean, etc.).</li>
                            <li><strong>Transparência Industrial (0.70)</strong>: A interface agora utiliza opacidade estratégica com desfoque de fundo, permitindo que as Auras brilhem através dos componentes.</li>
                            <li><strong>Logotipos Inteligentes</strong>: Promotoras e Bancos exibem ícones oficiais buscados via IA para agilizar a leitura visual da esteira.</li>
                        </ul>
                    </AccordionContent>
                </AccordionItem>

                {/* 6. SEGURANÇA E BLINDAGEM NUCLEAR */}
                <AccordionItem value="security-blind" className="border-2 rounded-2xl bg-card px-4 shadow-sm border-primary/10">
                    <AccordionTrigger className="hover:no-underline">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-xl bg-zinc-100 text-zinc-600"><ShieldCheck className="h-5 w-5" /></div>
                            <div className="text-left">
                                <p className="font-bold text-sm">6. Blindagem Nuclear de Dados</p>
                                <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">Integridade V8 e Persistência</p>
                            </div>
                        </div>
                    </AccordionTrigger>
                    <AccordionContent className="pt-2 pb-6 space-y-4 text-sm leading-relaxed">
                        <ul className="space-y-3">
                            <li className="flex items-start gap-2">
                                <UserCheck className="h-4 w-4 text-emerald-600 shrink-0" />
                                <div>
                                    <p className="font-bold">Validação Semântica de Status</p>
                                    <p className="text-xs text-muted-foreground">Selos de status Ativo/Inativo otimizados para alto contraste em temas claros e escuros.</p>
                                </div>
                            </li>
                            <li className="flex items-start gap-2">
                                <Layout className="h-4 w-4 text-blue-600 shrink-0" />
                                <div>
                                    <p className="font-bold">Persistência de Visão (DataTable)</p>
                                    <p className="text-xs text-muted-foreground">Sua configuração de colunas, ordem e paginação é salva automaticamente com proteção total contra erros de hidratação.</p>
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
                        <Zap className="h-3 w-3 fill-current" /> Atalhos Rápidos
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-1">
                        <p className="text-[10px] font-black text-muted-foreground uppercase">Busca Global</p>
                        <p className="text-xs font-bold">CTRL + K</p>
                    </div>
                    <div className="space-y-1">
                        <p className="text-[10px] font-black text-muted-foreground uppercase">Recolher Menu</p>
                        <p className="text-xs font-bold">CTRL + B</p>
                    </div>
                    <div className="space-y-1">
                        <p className="text-[10px] font-black text-muted-foreground uppercase">Imprimir Seleção</p>
                        <p className="text-xs font-bold">Borderô Coletivo</p>
                    </div>
                </CardContent>
            </Card>

            <Card className="border-2 border-dashed border-green-500/20 bg-green-500/5">
                <CardHeader className="pb-2">
                    <CardTitle className="text-xs font-black uppercase tracking-widest text-green-600">Estado do Sistema</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center gap-2 text-green-600">
                        <div className="h-2 w-2 rounded-full bg-current animate-pulse" />
                        <span className="text-[10px] font-black uppercase">Blindagem Nuclear V8 Ativa</span>
                    </div>
                    <p className="text-[9px] text-muted-foreground mt-2 leading-tight">
                        Versão 3.1.0 - Motor de prospecção e gestão de cartões otimizado.
                    </p>
                </CardContent>
            </Card>
        </div>
      </div>
    </AppLayout>
  );
}