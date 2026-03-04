"use client"

import React from 'react';
import { AppLayout } from '@/components/app-layout';
import { PageHeader } from '@/components/page-header';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { 
    Palette, 
    ShieldCheck, 
    Bot,
    Camera,
    Sparkles,
    Search,
    Zap,
    Layout,
    UserCheck,
    CloudSun,
    MessageSquareText,
    Check,
    Landmark,
    FileCheck2,
    Database,
    Binary,
    Tags,
    Trophy,
    Share2,
    SmilePlus,
    Pencil,
    Star,
    Cake,
    ListTodo,
    AlertTriangle,
    LinkIcon,
    ArrowRight,
    HardDrive,
    SearchX,
    Lock,
    NotebookTabs,
    UploadCloud,
    Wallet,
    Clock,
    Trash2,
    TrendingUp,
    Receipt,
    ListChecks,
    History,
    Timer,
    Send,
    FileCheck,
    PenTool
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function ManualPage() {
  return (
    <AppLayout>
      <PageHeader title="Guia de Operação LK RAMOS" />
      
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 pb-20">
        <div className="lg:col-span-3 space-y-6">
            <Accordion type="single" collapsible className="w-full space-y-4">
                
                {/* 1. INTELIGÊNCIA ARTIFICIAL E VENDAS */}
                <AccordionItem value="ai-features" className="border-2 rounded-2xl bg-card px-4 shadow-sm border-orange-500/10">
                    <AccordionTrigger className="hover:no-underline">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-xl bg-orange-100 text-orange-600"><Zap className="h-5 w-5" /></div>
                            <div className="text-left">
                                <p className="font-bold text-sm">1. Ecossistema de IA e Vendas</p>
                                <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">Consultoria, Visão e Persuasão</p>
                            </div>
                        </div>
                    </AccordionTrigger>
                    <AccordionContent className="pt-2 pb-6 space-y-4 text-sm leading-relaxed">
                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="p-4 rounded-xl bg-orange-50/5 border border-orange-500/20">
                                <div className="flex items-center gap-2 mb-2">
                                    <Sparkles className="h-4 w-4 text-orange-600" />
                                    <h4 className="font-bold">Análise Estratégica IA</h4>
                                </div>
                                <p className="text-xs text-muted-foreground">Dentro da ficha do cliente, o botão "Gerar Consultoria" entrega uma análise profunda. A IA cruza dicas de datas de contratos para sugerir o momento exato de um refinanciamento.</p>
                            </div>
                            <div className="p-4 rounded-xl bg-blue-500/5 border border-blue-500/20">
                                <div className="flex items-center gap-2 mb-2">
                                    <Camera className="h-4 w-4 text-blue-600" />
                                    <h4 className="font-bold">OCR Multimodal (Fotos e PDFs)</h4>
                                </div>
                                <p className="text-xs text-muted-foreground">O cadastro via IA suporta **PDFs Oficiais**. Você pode subir extratos bancários e a IA extrairá Nome, CPF e Benefícios instantaneamente.</p>
                            </div>
                        </div>
                    </AccordionContent>
                </AccordionItem>

                {/* 2. OPERAÇÃO DE ESTEIRA & CHECKLIST */}
                <AccordionItem value="ops-pipeline" className="border-2 rounded-2xl bg-card px-4 shadow-sm border-blue-500/20">
                    <AccordionTrigger className="hover:no-underline">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-xl bg-blue-100 text-blue-600"><ListChecks className="h-5 w-5" /></div>
                            <div className="text-left">
                                <p className="font-bold text-sm">2. Esteira de Produção & Checklist</p>
                                <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">Monitoramento Visual por Etapas</p>
                            </div>
                        </div>
                    </AccordionTrigger>
                    <AccordionContent className="pt-2 pb-6 space-y-4 text-sm leading-relaxed">
                        <p className="text-muted-foreground mb-4">Cada proposta possui 4 etapas fundamentais representadas por ícones na tabela principal:</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="flex items-center gap-3 p-3 bg-muted/20 rounded-xl border">
                                <Send className="h-4 w-4 text-blue-500" />
                                <div className="text-[11px]"><span className="font-bold uppercase">Formalização:</span> Link enviado ao cliente.</div>
                            </div>
                            <div className="flex items-center gap-3 p-3 bg-muted/20 rounded-xl border">
                                <FileCheck className="h-4 w-4 text-orange-500" />
                                <div className="text-[11px]"><span className="font-bold uppercase">Documentação:</span> Arquivos conferidos.</div>
                            </div>
                            <div className="flex items-center gap-3 p-3 bg-muted/20 rounded-xl border">
                                <PenTool className="h-4 w-4 text-purple-500" />
                                <div className="text-[11px]"><span className="font-bold uppercase">Checklist:</span> Assinatura e trâmite do banco.</div>
                            </div>
                            <div className="flex items-center gap-3 p-3 bg-muted/20 rounded-xl border">
                                <ShieldCheck className="h-4 w-4 text-green-500" />
                                <div className="text-[11px]"><span className="font-bold uppercase">Averbação:</span> Confirmação no órgão.</div>
                            </div>
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-4 italic">Dica: Você pode marcar essas etapas diretamente na tabela clicando nos ícones ou dentro do formulário da proposta.</p>
                    </AccordionContent>
                </AccordionItem>

                {/* 3. HISTÓRICO INTELIGENTE (TÓPICOS) */}
                <AccordionItem value="history-topics" className="border-2 rounded-2xl bg-card px-4 shadow-sm border-purple-500/20">
                    <AccordionTrigger className="hover:no-underline">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-xl bg-purple-100 text-purple-600"><History className="h-5 w-5" /></div>
                            <div className="text-left">
                                <p className="font-bold text-sm">3. Linha do Tempo & Tópicos Rápidos</p>
                                <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">Agilidade no Registro de Trâmites</p>
                            </div>
                        </div>
                    </AccordionTrigger>
                    <AccordionContent className="pt-2 pb-6 space-y-4 text-sm leading-relaxed">
                        <div className="p-4 rounded-xl bg-purple-500/5 border border-purple-200">
                            <h4 className="font-bold text-purple-700 flex items-center gap-2 mb-2"><Zap className="h-4 w-4" /> Registro com Um Clique</h4>
                            <p className="text-xs text-muted-foreground mb-4">Dentro de cada proposta, você encontrará o painel de **Tópicos Rápidos**. Ao clicar em um botão (ex: "Aguardando Selfie"), o sistema registra automaticamente o trâmite com data, hora e o nome do operador.</p>
                            <div className="bg-white p-3 rounded-lg border flex gap-2 overflow-x-auto">
                                <Badge variant="outline" className="text-[9px] font-black uppercase">Link Enviado</Badge>
                                <Badge variant="outline" className="text-[9px] font-black uppercase">Aguardando Selfie</Badge>
                                <Badge variant="outline" className="text-[9px] font-black uppercase">Saldo via CIP</Badge>
                            </div>
                            <p className="text-[11px] text-muted-foreground mt-4">Você pode personalizar esses botões em **Configurações > Parâmetros > Tópicos de Trâmite**.</p>
                        </div>
                    </AccordionContent>
                </AccordionItem>

                {/* 4. REGRAS DE PORTABILIDADE E AUDITORIA */}
                <AccordionItem value="portability-rules" className="border-2 rounded-2xl bg-card px-4 shadow-sm border-red-500/20">
                    <AccordionTrigger className="hover:no-underline">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-xl bg-red-100 text-red-600"><SearchX className="h-5 w-5" /></div>
                            <div className="text-left">
                                <p className="font-bold text-sm">4. Auditoria de Portabilidade & Saneamento</p>
                                <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">Blindagem contra Retrabalho e Dados Sujos</p>
                            </div>
                        </div>
                    </AccordionTrigger>
                    <AccordionContent className="pt-2 pb-6 space-y-4 text-sm leading-relaxed">
                        <div className="space-y-4">
                            <div className="p-4 rounded-xl bg-red-500/5 border border-red-500/20">
                                <h4 className="font-bold text-red-700 flex items-center gap-2 mb-2">
                                    <Check className="h-4 w-4" /> Nº de Contrato Obrigatório
                                </h4>
                                <p className="text-xs text-muted-foreground">Ao selecionar o produto **Portabilidade**, o campo "Nº Contrato Portado (Origem)" torna-se **obrigatório**. O sistema não permite salvar a proposta sem essa identificação única.</p>
                            </div>
                            
                            <div className="p-4 rounded-xl bg-green-500/5 border border-green-500/20">
                                <h4 className="font-bold text-green-700 flex items-center gap-2 mb-2">
                                    <ShieldCheck className="h-4 w-4" /> Saneamento Automático
                                </h4>
                                <p className="text-xs text-muted-foreground">Se você mudar o produto de uma proposta de "Portabilidade" para outro (ex: Margem), o sistema **limpa automaticamente** o número do contrato portado antigo para manter sua base 100% fiel e organizada.</p>
                            </div>
                        </div>
                    </AccordionContent>
                </AccordionItem>

                {/* 5. GESTÃO DE PARCEIROS & SEGURANÇA */}
                <AccordionItem value="management-secure" className="border-2 rounded-2xl bg-card px-4 shadow-sm border-blue-500/20">
                    <AccordionTrigger className="hover:no-underline">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-xl bg-blue-100 text-blue-600"><Lock className="h-5 w-5" /></div>
                            <div className="text-left">
                                <p className="font-bold text-sm">5. Gestão de Parceiros & Portal de Leads</p>
                                <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">Criptografia Militar e Automação de Entrada</p>
                            </div>
                        </div>
                    </AccordionTrigger>
                    <AccordionContent className="pt-2 pb-6 space-y-4 text-sm leading-relaxed">
                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="p-4 rounded-xl bg-blue-50/5 border border-blue-200">
                                <h4 className="font-bold text-blue-700 flex items-center gap-2 mb-2"><LinkIcon className="h-4 w-4" /> Portal de Leads</h4>
                                <p className="text-xs text-muted-foreground">Seu link exclusivo de auto-cadastro está disponível no **Dashboard** e também na sua página de **Meu Perfil**. Envie este link para os clientes para que eles mesmos preencham a ficha e anexem documentos.</p>
                            </div>
                            <div className="p-4 rounded-xl bg-green-50/5 border border-green-200">
                                <h4 className="font-bold text-green-700 flex items-center gap-2 mb-2"><NotebookTabs className="h-4 w-4" /> Mural Colaborativo</h4>
                                <p className="text-xs text-muted-foreground">A aba de **Notícias** e **Links Úteis** é pública para sua equipe. Tudo o que você publicar aparecerá para seus sócios instantaneamente.</p>
                            </div>
                        </div>
                    </AccordionContent>
                </AccordionItem>

            </Accordion>
        </div>

        {/* BARRA LATERAL DE ATALHOS */}
        <div className="lg:col-span-1 space-y-6">
            <Card className="border-2 border-primary/20 bg-primary/5">
                <CardHeader className="pb-2">
                    <CardTitle className="text-xs font-black uppercase tracking-widest flex items-center gap-2">
                        <Zap className="h-3 w-3 fill-current" /> Atalhos Mestres
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-1">
                        <p className="text-[10px] font-black text-muted-foreground uppercase">Busca Global</p>
                        <p className="text-xs font-bold">CTRL + K</p>
                    </div>
                    <div className="space-y-1">
                        <p className="text-[10px] font-black text-muted-foreground uppercase">Símbolos/Emojis</p>
                        <p className="text-xs font-bold">Win + .</p>
                    </div>
                    <div className="space-y-1">
                        <p className="text-[10px] font-black text-muted-foreground uppercase">Recolher Menu</p>
                        <p className="text-xs font-bold">CTRL + B</p>
                    </div>
                </CardContent>
            </Card>

            <Card className="border-2 border-dashed border-green-500/20 bg-green-500/5">
                <HardDrive className="absolute top-2 right-2 h-4 w-4 text-green-600/30" />
                <CardHeader className="pb-2">
                    <CardTitle className="text-xs font-black uppercase tracking-widest text-green-600">Armazenamento</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center gap-2 text-green-600">
                        <div className="h-2 w-2 rounded-full bg-current animate-pulse" />
                        <span className="text-[10px] font-black uppercase">5 GB Gratuitos</span>
                    </div>
                    <p className="text-[9px] text-muted-foreground mt-2 leading-tight">
                        Capacidade para milhares de dossiês. Excluir anexos libera espaço em tempo real.
                    </p>
                </CardContent>
            </Card>
        </div>
      </div>
    </AppLayout>
  );
}
