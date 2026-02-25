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
    Zap,
    Layout,
    UserCheck,
    CloudSun,
    MessageSquareText,
    Printer,
    Timer,
    Check,
    CreditCard,
    Landmark,
    FileBadge,
    FileCheck2,
    Database,
    Binary,
    Tags,
    Trophy,
    Share2,
    SmilePlus,
    Pencil,
    Star,
    Cake
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';

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
                                <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">Consultoria, Visão e Persuasão</p>
                            </div>
                        </div>
                    </AccordionTrigger>
                    <AccordionContent className="pt-2 pb-6 space-y-4 text-sm leading-relaxed">
                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="p-4 rounded-xl bg-orange-500/5 border border-orange-500/20">
                                <div className="flex items-center gap-2 mb-2">
                                    <Sparkles className="h-4 w-4 text-orange-600" />
                                    <h4 className="font-bold">Análise Estratégica IA</h4>
                                </div>
                                <p className="text-xs text-muted-foreground">Dentro da ficha do cliente, o botão "Gerar Consultoria" entrega uma análise profunda. A IA cruza datas de contratos para sugerir o momento exato de um refinanciamento.</p>
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

                {/* 2. FIDELIDADE E SMART TAGS */}
                <AccordionItem value="fidelity-score" className="border-2 rounded-2xl bg-card px-4 shadow-sm border-primary/10">
                    <AccordionTrigger className="hover:no-underline">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-xl bg-amber-100 text-amber-600"><Star className="h-5 w-5 fill-amber-500" /></div>
                            <div className="text-left">
                                <p className="font-bold text-sm">2. Fidelidade e Smart Tags (Automáticas)</p>
                                <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">Inteligência de Comportamento do Cliente</p>
                            </div>
                        </div>
                    </AccordionTrigger>
                    <AccordionContent className="pt-2 pb-6 space-y-4 text-sm leading-relaxed">
                        <div className="space-y-4">
                            <div>
                                <h4 className="font-bold mb-1">Score de Estrelas (Lucratividade)</h4>
                                <p className="text-xs text-muted-foreground">Atribuído de 1 a 5 estrelas baseadas no **Lucro Líquido** gerado. Clientes 5 Estrelas são Diamante VIP (Mais de R$ 5.000 em comissões).</p>
                            </div>
                            <div className="p-4 rounded-xl bg-muted/20 border-2 border-dashed">
                                <h4 className="font-bold mb-2">Smart Tags (Etiquetas de IA)</h4>
                                <ul className="grid gap-2 md:grid-cols-2">
                                    <li className="flex items-center gap-2 text-xs"><Badge className="bg-amber-500 h-4 text-[8px]">💎 ELITE</Badge> Comissões &gt; R$ 5.000</li>
                                    <li className="flex items-center gap-2 text-xs"><Badge className="bg-orange-600 h-4 text-[8px]">🔥 ATIVO</Badge> Proposta nos últimos 30 dias</li>
                                    <li className="flex items-center gap-2 text-xs"><Badge className="bg-blue-400 h-4 text-[8px]">🧊 REATIVAR</Badge> Sem produção há 180 dias</li>
                                    <li className="flex items-center gap-2 text-xs"><Badge className="bg-purple-500 h-4 text-[8px]">⚖️ EM ESTEIRA</Badge> Contrato em andamento</li>
                                </ul>
                            </div>
                        </div>
                    </AccordionContent>
                </AccordionItem>

                {/* 3. BUSCA NUCLEAR V12 */}
                <AccordionItem value="search-v12" className="border-2 rounded-2xl bg-card px-4 shadow-sm border-primary/10">
                    <AccordionTrigger className="hover:no-underline">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-xl bg-blue-100 text-blue-600"><Binary className="h-5 w-5" /></div>
                            <div className="text-left">
                                <p className="font-bold text-sm">3. Busca Nuclear V12 (Precisão)</p>
                                <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">Localização Instantânea de Registros</p>
                            </div>
                        </div>
                    </AccordionTrigger>
                    <AccordionContent className="pt-2 pb-6 space-y-4 text-sm leading-relaxed">
                        <ul className="space-y-3">
                            <li className="flex gap-3">
                                <div className="h-5 w-5 rounded-full bg-blue-500 text-white flex items-center justify-center text-[10px] font-black shrink-0">ID</div>
                                <p><strong>Correspondência Estrita</strong>: Buscas numéricas curtas (ex: "10") isolam exclusivamente o ID exato ou o número da Proposta.</p>
                            </li>
                            <li className="flex gap-3">
                                <div className="h-5 w-5 rounded-full bg-orange-500 text-white flex items-center justify-center shrink-0"><Search className="h-3 w-3" /></div>
                                <p><strong>CPF Inteligente</strong>: O motor de busca ignora pontuações. Pesquise `123.456.789-01` ou apenas `12345678901` para encontrar o cliente.</p>
                            </li>
                        </ul>
                    </AccordionContent>
                </AccordionItem>

                {/* 4. NAVEGAÇÃO E EDIÇÃO ÁGIL */}
                <AccordionItem value="agile-editing" className="border-2 rounded-2xl bg-card px-4 shadow-sm border-primary/10">
                    <AccordionTrigger className="hover:no-underline">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-xl bg-purple-100 text-purple-600"><Pencil className="h-5 w-5" /></div>
                            <div className="text-left">
                                <p className="font-bold text-sm">4. Edição Contextual Direta</p>
                                <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">Velocidade em Atualização de Dados</p>
                            </div>
                        </div>
                    </AccordionTrigger>
                    <AccordionContent className="pt-2 pb-6 space-y-4 text-sm leading-relaxed">
                        <div className="p-4 rounded-xl bg-purple-500/5 border border-purple-500/20">
                            <h4 className="font-bold mb-2">Editar de Qualquer Lugar</h4>
                            <p className="text-xs text-muted-foreground">Ao abrir a ficha de um cliente, o botão <strong>"Editar Cadastro"</strong> está disponível no topo. Isso permite corrigir dados instantaneamente sem sair do contexto do atendimento.</p>
                        </div>
                    </AccordionContent>
                </AccordionItem>

                {/* 5. CONCILIAÇÃO IA V2 */}
                <AccordionItem value="finance-v2" className="border-2 rounded-2xl bg-card px-4 shadow-sm border-primary/10">
                    <AccordionTrigger className="hover:no-underline">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-xl bg-green-100 text-green-600"><FileCheck2 className="h-5 w-5" /></div>
                            <div className="text-left">
                                <p className="font-bold text-sm">5. Conciliação Financeira IA V2</p>
                                <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">Conferência de Comissões por Arquivo</p>
                            </div>
                        </div>
                    </AccordionTrigger>
                    <AccordionContent className="pt-2 pb-6 space-y-4 text-sm leading-relaxed">
                        <p>O novo motor de conciliação elimina o trabalho manual de conferir pagamentos:</p>
                        <div className="grid gap-3 md:grid-cols-2">
                            <div className="p-3 rounded-xl bg-muted/20 border-2 border-dashed">
                                <h4 className="text-[10px] font-black uppercase mb-1">Leitura de PDF de Promotora</h4>
                                <p className="text-xs text-muted-foreground">Suba o relatório original da promotora. A IA cruza CPF e Nº da Proposta simultaneamente.</p>
                            </div>
                            <div className="p-3 rounded-xl bg-muted/20 border-2 border-dashed">
                                <h4 className="text-[10px] font-black uppercase mb-1">Destaque de Divergências</h4>
                                <p className="text-xs text-muted-foreground">Se o valor pago for menor que o esperado, o sistema sinaliza em vermelho automaticamente.</p>
                            </div>
                        </div>
                    </AccordionContent>
                </AccordionItem>

                {/* 6. AGENDA DE ANIVERSÁRIOS */}
                <AccordionItem value="birthday-calendar" className="border-2 rounded-2xl bg-card px-4 shadow-sm border-primary/10">
                    <AccordionTrigger className="hover:no-underline">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-xl bg-pink-100 text-pink-600"><Cake className="h-5 w-5" /></div>
                            <div className="text-left">
                                <p className="font-bold text-sm">6. Agenda de Aniversários Consolidada</p>
                                <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">Planejamento Mensal de Relacionamento</p>
                            </div>
                        </div>
                    </AccordionTrigger>
                    <AccordionContent className="pt-2 pb-6 space-y-4 text-sm leading-relaxed">
                        <div className="p-4 rounded-xl bg-pink-500/5 border border-pink-500/20">
                            <h4 className="font-bold mb-2">Visão Mensal de Parabéns</h4>
                            <p className="text-xs text-muted-foreground">Acesse o menu <strong>"Aniversariantes"</strong> para ver o calendário completo do mês. Clique em qualquer nome para gerar uma mensagem personalizada com IA e enviar direto pelo WhatsApp.</p>
                        </div>
                    </AccordionContent>
                </AccordionItem>

                {/* 7. CLASSIFICAÇÃO INTELIGENTE (TAGS) */}
                <AccordionItem value="tags-management" className="border-2 rounded-2xl bg-card px-4 shadow-sm border-primary/10">
                    <AccordionTrigger className="hover:no-underline">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-xl bg-pink-100 text-pink-600"><Tags className="h-5 w-5" /></div>
                            <div className="text-left">
                                <p className="font-bold text-sm">7. Gestão de Relacionamento (Tags)</p>
                                <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">Segmentação e Símbolos Visuais</p>
                            </div>
                        </div>
                    </AccordionTrigger>
                    <AccordionContent className="pt-2 pb-6 space-y-4 text-sm leading-relaxed">
                        <p>Organize sua base de clientes com etiquetas coloridas e símbolos:</p>
                        <ul className="space-y-3">
                            <li className="flex gap-3">
                                <div className="h-5 w-5 rounded-full bg-pink-500 text-white flex items-center justify-center shrink-0"><SmilePlus className="h-3 w-3" /></div>
                                <p><strong>Atalho de Símbolos</strong>: Use <kbd className="bg-muted px-1 rounded border">Win + .</kbd> (Windows) para adicionar emojis às suas tags.</p>
                            </li>
                            <li className="flex gap-3">
                                <div className="h-5 w-5 rounded-full bg-blue-500 text-white flex items-center justify-center shrink-0"><Check className="h-3 w-3" /></div>
                                <p><strong>Filtros Cirúrgicos</strong>: Na tela de Clientes, filtre por etiquetas para focar suas campanhas (ex: Clientes VIP).</p>
                            </li>
                        </ul>
                    </AccordionContent>
                </AccordionItem>

                {/* 8. MARKETING PESSOAL E PERFORMANCE */}
                <AccordionItem value="personal-branding" className="border-2 rounded-2xl bg-card px-4 shadow-sm border-primary/10">
                    <AccordionTrigger className="hover:no-underline">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-xl bg-purple-100 text-purple-600"><UserCheck className="h-5 w-5" /></div>
                            <div className="text-left">
                                <p className="font-bold text-sm">8. Perfil de Elite e Autoridade</p>
                                <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">Recordes e Identidade Profissional</p>
                            </div>
                        </div>
                    </AccordionTrigger>
                    <AccordionContent className="pt-2 pb-6 space-y-4 text-sm leading-relaxed">
                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/20">
                                <div className="flex items-center gap-2 mb-2">
                                    <Trophy className="h-4 w-4 text-amber-600" />
                                    <h4 className="font-bold">Hall da Fama</h4>
                                </div>
                                <p className="text-xs text-muted-foreground">O menu "Meu Perfil" destaca seus recordes: Maior Contrato Pago, Melhor Mês e Comissões Acumuladas.</p>
                            </div>
                            <div className="p-4 rounded-xl bg-purple-500/5 border border-purple-500/20">
                                <div className="flex items-center gap-2 mb-2">
                                    <Share2 className="h-4 w-4 text-purple-600" />
                                    <h4 className="font-bold">Assinatura Profissional</h4>
                                </div>
                                <p className="text-xs text-muted-foreground">Gere assinaturas automáticas para WhatsApp com seus dados e a marca da LK RAMOS com um clique.</p>
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
                <CardHeader className="pb-2">
                    <CardTitle className="text-xs font-black uppercase tracking-widest text-green-600">Integridade</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center gap-2 text-green-600">
                        <div className="h-2 w-2 rounded-full bg-current animate-pulse" />
                        <span className="text-[10px] font-black uppercase">Blindagem Nuclear Ativa</span>
                    </div>
                    <p className="text-[9px] text-muted-foreground mt-2 leading-tight">
                        Versão 3.8.0 - Smart Tags e Análise Comportamental Ativa.
                    </p>
                </CardContent>
            </Card>
        </div>
      </div>
    </AppLayout>
  );
}
