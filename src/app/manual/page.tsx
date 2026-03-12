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
    PenTool,
    FilterX,
    CalendarClock,
    Bell,
    Copy,
    DollarSign,
    CreditCard,
    GripVertical,
    CopyPlus,
    Snowflake,
    FileBadge,
    Printer,
    CheckCircle2,
    MousePointer2,
    KeyRound,
    UserRoundCheck
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
                                <p className="text-xs text-muted-foreground">Dentro da ficha do cliente, o botão "Gerar Consultoria" entrega uma análise profunda. A IA cruza datas de contratos para sugerir o momento exato de um refinanciamento.</p>
                            </div>
                            <div className="p-4 rounded-xl bg-blue-500/5 border border-blue-500/20">
                                <div className="flex items-center gap-2 mb-2">
                                    <Camera className="h-4 w-4 text-blue-600" />
                                    <h4 className="font-bold">OCR e Separação de Contatos</h4>
                                </div>
                                <p className="text-xs text-muted-foreground">O cadastro via IA agora identifica e **separa automaticamente múltiplos telefones** encontrados no documento, preenchendo os campos "Principal" e "Telefone 2" de forma organizada.</p>
                            </div>
                        </div>
                    </AccordionContent>
                </AccordionItem>

                {/* 2. MECANISMO DE RETORNOS (CRM) */}
                <AccordionItem value="crm-ai" className="border-2 rounded-2xl bg-card px-4 shadow-sm border-purple-500/20">
                    <AccordionTrigger className="hover:no-underline">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-xl bg-purple-100 text-purple-600"><CalendarClock className="h-5 w-5" /></div>
                            <div className="text-left">
                                <p className="font-bold text-sm">2. Mecanismo de Retornos (CRM)</p>
                                <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">Agenda e Resumos de Conversa</p>
                            </div>
                        </div>
                    </AccordionTrigger>
                    <AccordionContent className="pt-2 pb-6 space-y-4 text-sm leading-relaxed">
                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="p-4 rounded-xl bg-purple-50/5 border border-purple-500/20">
                                <h4 className="font-bold text-purple-700 flex items-center gap-2 mb-2">
                                    <Sparkles className="h-4 w-4" /> Resumo de Fechamento
                                </h4>
                                <p className="text-xs text-muted-foreground">
                                    Ao concluir um retorno, utilize o botão **"Resumir com IA"** para organizar suas anotações da conversa em um histórico profissional.
                                </p>
                            </div>
                            <div className="p-4 rounded-xl bg-muted/20 border">
                                <h4 className="font-bold text-foreground flex items-center gap-2 mb-2">
                                    <Clock className="h-4 w-4 text-primary" /> Calendário de Pauta
                                </h4>
                                <p className="text-xs text-muted-foreground">
                                    O horário agendado aparece diretamente na visão mensal (ex: 14:00 - João), facilitando a gestão do seu dia sem cliques extras.
                                </p>
                            </div>
                        </div>
                    </AccordionContent>
                </AccordionItem>

                {/* 3. OPERAÇÃO DE ESTEIRA & CAPAS */}
                <AccordionItem value="ops-pipeline" className="border-2 rounded-2xl bg-card px-4 shadow-sm border-blue-500/20">
                    <AccordionTrigger className="hover:no-underline">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-xl bg-blue-100 text-blue-600"><FileBadge className="h-5 w-5" /></div>
                            <div className="text-left">
                                <p className="font-bold text-sm">3. Esteira & Documentação Técnica</p>
                                <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">Capa de Lote e Checklist Visual</p>
                            </div>
                        </div>
                    </AccordionTrigger>
                    <AccordionContent className="pt-2 pb-6 space-y-4 text-sm leading-relaxed">
                        <div className="p-4 rounded-xl bg-blue-50/5 border border-blue-500/20 mb-4">
                            <h4 className="font-bold text-blue-700 flex items-center gap-2 mb-2">
                                <Printer className="h-4 w-4" /> Capas de Proposta em PDF
                            </h4>
                            <p className="text-xs text-muted-foreground">
                                Na aba Propostas, selecione um ou mais registros para gerar a **Capa de Lote**. O sistema cria um PDF profissional com os dados do cliente, detalhes financeiros e campos para assinatura, pronto para impressão.
                            </p>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="flex items-center gap-3 p-3 bg-muted/20 rounded-xl border">
                                <Send className="h-4 w-4 text-blue-500" />
                                <div className="text-[11px] font-bold uppercase">Formalização</div>
                            </div>
                            <div className="flex items-center gap-3 p-3 bg-muted/20 rounded-xl border">
                                <FileCheck className="h-4 w-4 text-orange-500" />
                                <div className="text-[11px] font-bold uppercase">Documentação</div>
                            </div>
                        </div>
                    </AccordionContent>
                </AccordionItem>

                {/* 4. PRECISÃO E REGRAS DE NEGÓCIO */}
                <AccordionItem value="precision-rules" className="border-2 rounded-2xl bg-card px-4 shadow-sm border-emerald-500/20">
                    <AccordionTrigger className="hover:no-underline">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-xl bg-emerald-100 text-emerald-600"><CheckCircle2 className="h-5 w-5" /></div>
                            <div className="text-left">
                                <p className="font-bold text-sm">4. Precisão e Validação de Dados</p>
                                <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">Regras de Bloqueio e Cálculo</p>
                            </div>
                        </div>
                    </AccordionTrigger>
                    <AccordionContent className="pt-2 pb-6 space-y-4 text-sm leading-relaxed">
                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="p-4 rounded-xl bg-emerald-50/5 border border-emerald-200">
                                <h4 className="font-bold text-emerald-700 flex items-center gap-2 mb-2">
                                    <UserRoundCheck className="h-4 w-4" /> Validação Silenciosa V2
                                </h4>
                                <p className="text-xs text-muted-foreground">
                                    O cadastro de clientes agora realiza uma **consulta direta ao banco de dados** para CPF e Telefone. O sistema bloqueia duplicidades instantaneamente, mesmo que o registro original não esteja visível na lista atual.
                                </p>
                            </div>
                            <div className="p-4 rounded-xl bg-blue-50/5 border border-blue-200">
                                <h4 className="font-bold text-blue-700 flex items-center gap-2 mb-2">
                                    <Wallet className="h-4 w-4" /> Comissões Fixas
                                </h4>
                                <p className="text-xs text-muted-foreground">
                                    No Financeiro, os cards superiores (Resumo) são **fixos no mês atual**. Eles não são alterados por filtros de busca ou operador, servindo como uma âncora real do seu faturamento mensal.
                                </p>
                            </div>
                        </div>
                    </AccordionContent>
                </AccordionItem>

                {/* 5. SEGURANÇA E ACESSO */}
                <AccordionItem value="security-access" className="border-2 rounded-2xl bg-card px-4 shadow-sm border-red-500/20">
                    <AccordionTrigger className="hover:no-underline">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-xl bg-red-100 text-red-600"><ShieldCheck className="h-5 w-5" /></div>
                            <div className="text-left">
                                <p className="font-bold text-sm">5. Segurança e Proteção de Dados</p>
                                <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">Acesso Seguro e Anti-SPAM</p>
                            </div>
                        </div>
                    </AccordionTrigger>
                    <AccordionContent className="pt-2 pb-6 space-y-4 text-sm leading-relaxed">
                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="p-4 rounded-xl bg-red-50/5 border border-red-200">
                                <h4 className="font-bold text-red-700 flex items-center gap-2 mb-2">
                                    <KeyRound className="h-4 w-4" /> Recuperação de Senha
                                </h4>
                                <p className="text-xs text-muted-foreground">
                                    Implementado fluxo oficial via Firebase. Caso esqueça sua senha, utilize o link **"Esqueci minha senha"** na tela de login para receber um link de redefinição seguro no seu e-mail.
                                </p>
                            </div>
                            <div className="p-4 rounded-xl bg-zinc-50/5 border border-zinc-300">
                                <h4 className="font-bold text-zinc-700 flex items-center gap-2 mb-2">
                                    <Lock className="h-4 w-4" /> Firebase App Check
                                </h4>
                                <p className="text-xs text-muted-foreground">
                                    O sistema utiliza **reCAPTCHA v3** de forma invisível. Isso garante que apenas agentes reais acessem o sistema, bloqueando automaticamente tentativas de ataque por robôs e scripts externos.
                                </p>
                            </div>
                        </div>
                    </AccordionContent>
                </AccordionItem>

                {/* 6. INTERFACE E USABILIDADE */}
                <AccordionItem value="ui-usability" className="border-2 rounded-2xl bg-card px-4 shadow-sm border-zinc-500/20">
                    <AccordionTrigger className="hover:no-underline">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-xl bg-zinc-100 text-zinc-600"><Layout className="h-5 w-5" /></div>
                            <div className="text-left">
                                <p className="font-bold text-sm">6. Navegação em Formatos Elite</p>
                                <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">Modais de Alta Performance</p>
                            </div>
                        </div>
                    </AccordionTrigger>
                    <AccordionContent className="pt-2 pb-6 space-y-4 text-sm leading-relaxed">
                        <div className="p-4 rounded-xl bg-muted/20 border">
                            <h4 className="font-bold text-foreground flex items-center gap-2 mb-2">
                                <Search className="h-4 w-4 text-primary" /> Busca Global 10x
                            </h4>
                            <p className="text-xs text-muted-foreground">
                                O motor de busca global (CTRL + K) foi otimizado. Ele agora carrega instantaneamente os 50 registros mais recentes, priorizando a velocidade sem comprometer a precisão.
                            </p>
                        </div>
                        <div className="p-4 rounded-xl bg-blue-50/5 border border-blue-200 mt-4">
                            <h4 className="font-bold text-blue-700 flex items-center gap-2 mb-2">
                                <Snowflake className="h-4 w-4" /> Congelamento V2
                            </h4>
                            <p className="text-xs text-muted-foreground">
                                As tabelas utilizam calibração milimétrica para fixar colunas. Use o seletor **"Congelar"** para manter nomes e IDs visíveis mesmo em telas ultra-largas.
                            </p>
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
                        <p className="text-[10px] font-black text-muted-foreground uppercase">Recolher Menu</p>
                        <p className="text-xs font-bold">CTRL + B</p>
                    </div>
                </CardContent>
            </Card>

            <Card className="border-2 border-dashed border-orange-500/20 bg-orange-500/5">
                <HardDrive className="absolute top-2 right-2 h-4 w-4 text-orange-600/30" />
                <CardHeader className="pb-2">
                    <CardTitle className="text-xs font-black uppercase tracking-widest text-orange-600">Armazenamento</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center gap-2 text-orange-600">
                        <div className="h-2 w-2 rounded-full bg-current animate-pulse" />
                        <span className="text-[10px] font-black uppercase">Segurança Cloud</span>
                    </div>
                    <p className="text-[9px] text-muted-foreground mt-2 leading-tight font-medium">
                        Seus documentos e anexos estão protegidos por criptografia de ponta a ponta e backups diários automáticos.
                    </p>
                </CardContent>
            </Card>
        </div>
      </div>
    </AppLayout>
  );
}
