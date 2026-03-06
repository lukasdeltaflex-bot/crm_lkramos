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
    CopyPlus
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
                                    <h4 className="font-bold">OCR e Separação Inteligente</h4>
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
                                    Ao concluir um retorno, utilize o botão **"Resumir com IA"** para organizar suas anotações da conversa. A IA transformará seus rascunhos em um histórico profissional e limpo.
                                </p>
                            </div>
                            <div className="p-4 rounded-xl bg-muted/20 border">
                                <h4 className="font-bold text-foreground flex items-center gap-2 mb-2">
                                    <Clock className="h-4 w-4 text-primary" /> Visibilidade de Horários
                                </h4>
                                <p className="text-xs text-muted-foreground">
                                    A visão de **Calendário** agora exibe o horário agendado diretamente no quadrado do dia (ex: 14:00 - Cliente), permitindo gerir sua pauta sem precisar abrir cada registro.
                                </p>
                            </div>
                        </div>
                        <div className="p-4 rounded-xl bg-primary/5 border border-primary/10 mt-4">
                            <p className="text-xs text-muted-foreground font-medium">
                                <span className="font-black text-primary uppercase">Dica:</span> O título do retorno (Vínculo/Origem) agora aparece em destaque como uma etiqueta de botão, facilitando a triagem visual rápida.
                            </p>
                        </div>
                    </AccordionContent>
                </AccordionItem>

                {/* 3. OPERAÇÃO DE ESTEIRA & CHECKLIST */}
                <AccordionItem value="ops-pipeline" className="border-2 rounded-2xl bg-card px-4 shadow-sm border-blue-500/20">
                    <AccordionTrigger className="hover:no-underline">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-xl bg-blue-100 text-blue-600"><ListChecks className="h-5 w-5" /></div>
                            <div className="text-left">
                                <p className="font-bold text-sm">3. Esteira de Produção & Checklist</p>
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
                                <div className="text-[11px]"><span className="font-bold uppercase">Checklist:</span> Asssignature e trâmite do banco.</div>
                            </div>
                            <div className="flex items-center gap-3 p-3 bg-muted/20 rounded-xl border">
                                <ShieldCheck className="h-4 w-4 text-green-500" />
                                <div className="text-[11px]"><span className="font-bold uppercase">Averbação:</span> Confirmação no órgão.</div>
                            </div>
                        </div>
                    </AccordionContent>
                </AccordionItem>

                {/* 4. ALERTAS E CENTRAL DE NOTIFICAÇÕES */}
                <AccordionItem value="notifications-manual" className="border-2 rounded-2xl bg-card px-4 shadow-sm border-pink-500/20">
                    <AccordionTrigger className="hover:no-underline">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-xl bg-pink-100 text-pink-600"><Bell className="h-5 w-5" /></div>
                            <div className="text-left">
                                <p className="font-bold text-sm">4. Central de Alertas Unificada</p>
                                <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">Sincronização entre Sininho e Dashboard</p>
                            </div>
                        </div>
                    </AccordionTrigger>
                    <AccordionContent className="pt-2 pb-6 space-y-4 text-sm leading-relaxed">
                        <div className="p-4 rounded-xl bg-pink-50/5 border border-pink-200">
                            <h4 className="font-bold text-pink-700 flex items-center gap-2 mb-2"><Bot className="h-4 w-4" /> Inteligência de Sincronização</h4>
                            <p className="text-xs text-muted-foreground">Os alertas de aniversários, comissões pendentes e retornos estão unificados. Ao clicar no **"X" (Dispensar)** de uma notificação no menu superior, ela será automaticamente removida também do card de **"Inteligência Diária"** no Dashboard.</p>
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
                                <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">Criptografia e Automação de Entrada</p>
                            </div>
                        </div>
                    </AccordionTrigger>
                    <AccordionContent className="pt-2 pb-6 space-y-4 text-sm leading-relaxed">
                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="p-4 rounded-xl bg-blue-50/5 border border-blue-200">
                                <h4 className="font-bold text-blue-700 flex items-center gap-2 mb-2"><LinkIcon className="h-4 w-4" /> Portal de Leads</h4>
                                <p className="text-xs text-muted-foreground">Seu link exclusivo de auto-cadastro permite que o cliente preencha a ficha e anexe documentos diretamente do celular dele para o seu sistema.</p>
                            </div>
                            <div className="p-4 rounded-xl bg-green-50/5 border border-green-200">
                                <h4 className="font-bold text-green-700 flex items-center gap-2 mb-2"><GripVertical className="h-4 w-4" /> Ordenação de Tópicos</h4>
                                <p className="text-xs text-muted-foreground">Nas **Configurações**, você pode arrastar e soltar os Tópicos Rápidos e Status para a ordem que preferir, deixando os mais usados sempre no topo.</p>
                            </div>
                        </div>
                    </AccordionContent>
                </AccordionItem>

                {/* 6. PRODUTIVIDADE & ATALHOS */}
                <AccordionItem value="ux-productivity" className="border-2 rounded-2xl bg-card px-4 shadow-sm border-emerald-500/20">
                    <AccordionTrigger className="hover:no-underline">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-xl bg-emerald-100 text-emerald-600"><Copy className="h-5 w-5" /></div>
                            <div className="text-left">
                                <p className="font-bold text-sm">6. Produtividade & Atalhos de Elite</p>
                                <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">Precisão Financeira e Agilidade</p>
                            </div>
                        </div>
                    </AccordionTrigger>
                    <AccordionContent className="pt-2 pb-6 space-y-4 text-sm leading-relaxed">
                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="p-4 rounded-xl bg-blue-50/5 border border-blue-500/20">
                                <h4 className="font-bold text-blue-700 flex items-center gap-2 mb-2">
                                    <CopyPlus className="h-4 w-4" /> Duplicação em 1-Clique
                                </h4>
                                <p className="text-xs text-muted-foreground">
                                    Na tabela de propostas, utilize o ícone de **Duplicar** diretamente na linha. Isso clonará os dados do cliente e do banco, permitindo lançar um novo contrato em segundos.
                                </p>
                            </div>
                            <div className="p-4 rounded-xl bg-emerald-50/5 border border-emerald-500/20">
                                <h4 className="font-bold text-emerald-700 flex items-center gap-2 mb-2">
                                    <DollarSign className="h-4 w-4" /> Máscaras de Moeda
                                </h4>
                                <p className="text-xs text-muted-foreground">
                                    Todos os campos de valor possuem formatação em tempo real, garantindo precisão total nos cálculos de comissão e volume bruto.
                                </p>
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
                    <p className="text-[9px] text-muted-foreground mt-2 leading-tight font-medium">
                        Capacidade para milhares de dossiês. Excluir anexos libera espaço em tempo real.
                    </p>
                </CardContent>
            </Card>
        </div>
      </div>
    </AppLayout>
  );
}
