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
    SmilePlus
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
                                <p className="text-xs text-muted-foreground">Na ficha do cliente, use o botão "Smart Pitch" para gerar scripts magnéticos. O sistema agora usa links oficiais (api.whatsapp.com) garantindo compatibilidade total com PC e Celular.</p>
                            </div>
                            <div className="p-4 rounded-xl bg-blue-500/5 border border-blue-500/20">
                                <div className="flex items-center gap-2 mb-2">
                                    <Camera className="h-4 w-4 text-blue-600" />
                                    <h4 className="font-bold">OCR Multimodal (Fotos e PDFs)</h4>
                                </div>
                                <p className="text-xs text-muted-foreground">O cadastro via IA agora suporta **PDFs Oficiais**. Você pode subir extratos bancários ou fotos de documentos e a IA extrairá Nome, CPF e Benefícios instantaneamente.</p>
                            </div>
                        </div>
                    </AccordionContent>
                </AccordionItem>

                {/* 2. BUSCA NUCLEAR V12 */}
                <AccordionItem value="search-v12" className="border-2 rounded-2xl bg-card px-4 shadow-sm border-primary/10">
                    <AccordionTrigger className="hover:no-underline">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-xl bg-blue-100 text-blue-600"><Binary className="h-5 w-5" /></div>
                            <div className="text-left">
                                <p className="font-bold text-sm">2. Busca Nuclear V12 (Precisão)</p>
                                <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">Localização Instantânea de Registros</p>
                            </div>
                        </div>
                    </AccordionTrigger>
                    <AccordionContent className="pt-2 pb-6 space-y-4 text-sm leading-relaxed">
                        <ul className="space-y-3">
                            <li className="flex gap-3">
                                <div className="h-5 w-5 rounded-full bg-blue-500 text-white flex items-center justify-center text-[10px] font-black shrink-0">ID</div>
                                <p><strong>Correspondência Estrita</strong>: Buscas numéricas curtas (ex: "10") agora isolam exclusivamente o ID exato, eliminando resultados de telefones ou CPFs que apenas contenham esses números.</p>
                            </li>
                            <li className="flex gap-3">
                                <div className="h-5 w-5 rounded-full bg-orange-500 text-white flex items-center justify-center shrink-0"><Search className="h-3 w-3" /></div>
                                <p><strong>CPF Inteligente</strong>: O motor de busca agora ignora pontuações. Você pode pesquisar por `123.456.789-01` ou apenas `12345678901` para encontrar o cliente.</p>
                            </li>
                            <li className="flex gap-3">
                                <div className="h-5 w-5 rounded-full bg-green-500 text-white flex items-center justify-center shrink-0"><Binary className="h-3 w-3" /></div>
                                <p><strong>Threshold de Segurança</strong>: Para números acima de 4 dígitos, o sistema libera a busca por fragmentos (útil para localizar partes de um documento).</p>
                            </li>
                        </ul>
                    </AccordionContent>
                </AccordionItem>

                {/* 3. CONCILIAÇÃO IA V2 */}
                <AccordionItem value="finance-v2" className="border-2 rounded-2xl bg-card px-4 shadow-sm border-primary/10">
                    <AccordionTrigger className="hover:no-underline">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-xl bg-green-100 text-green-600"><FileCheck2 className="h-5 w-5" /></div>
                            <div className="text-left">
                                <p className="font-bold text-sm">3. Conciliação Financeira IA V2</p>
                                <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">Conferência de Comissões por Arquivo</p>
                            </div>
                        </div>
                    </AccordionTrigger>
                    <AccordionContent className="pt-2 pb-6 space-y-4 text-sm leading-relaxed">
                        <p>O novo motor de conciliação elimina o trabalho manual de conferir pagamentos:</p>
                        <div className="grid gap-3 md:grid-cols-2">
                            <div className="p-3 rounded-xl bg-muted/20 border-2 border-dashed">
                                <h4 className="text-[10px] font-black uppercase mb-1">Leitura de PDF de Promotora</h4>
                                <p className="text-xs text-muted-foreground">Suba o relatório original da promotora. A IA cruza CPF e Nº da Proposta simultaneamente para achar o contrato na sua base.</p>
                            </div>
                            <div className="p-3 rounded-xl bg-muted/20 border-2 border-dashed">
                                <h4 className="text-[10px] font-black uppercase mb-1">Destaque de Divergências</h4>
                                <p className="text-xs text-muted-foreground">Se o valor pago for menor que o esperado, o sistema sinaliza em vermelho e sugere a "Baixa Parcial" automaticamente.</p>
                            </div>
                        </div>
                    </AccordionContent>
                </AccordionItem>

                {/* 4. CLASSIFICAÇÃO INTELIGENTE (TAGS) */}
                <AccordionItem value="tags-management" className="border-2 rounded-2xl bg-card px-4 shadow-sm border-primary/10">
                    <AccordionTrigger className="hover:no-underline">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-xl bg-pink-100 text-pink-600"><Tags className="h-5 w-5" /></div>
                            <div className="text-left">
                                <p className="font-bold text-sm">4. Gestão de Relacionamento (Tags)</p>
                                <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">Segmentação e Símbolos Visuais</p>
                            </div>
                        </div>
                    </AccordionTrigger>
                    <AccordionContent className="pt-2 pb-6 space-y-4 text-sm leading-relaxed">
                        <p>Organize sua base de clientes com etiquetas coloridas e símbolos:</p>
                        <ul className="space-y-3">
                            <li className="flex gap-3">
                                <div className="h-5 w-5 rounded-full bg-pink-500 text-white flex items-center justify-center shrink-0"><SmilePlus className="h-3 w-3" /></div>
                                <p><strong>Atalho de Símbolos</strong>: Ao criar tags em "Configurações", use <kbd className="bg-muted px-1 rounded border">Win + .</kbd> (Windows) ou <kbd className="bg-muted px-1 rounded border">Cmd+Ctrl+Espaço</kbd> (Mac) para adicionar emojis como 💎, ✅ ou ⚠️.</p>
                            </li>
                            <li className="flex gap-3">
                                <div className="h-5 w-5 rounded-full bg-blue-500 text-white flex items-center justify-center shrink-0"><Check className="h-3 w-3" /></div>
                                <p><strong>Filtros Cirúrgicos</strong>: Na tela de Clientes, você pode filtrar instantaneamente por etiquetas para focar suas campanhas apenas no perfil desejado (ex: apenas Clientes VIP).</p>
                            </li>
                        </ul>
                    </AccordionContent>
                </AccordionItem>

                {/* 5. MARKETING PESSOAL E PERFORMANCE */}
                <AccordionItem value="personal-branding" className="border-2 rounded-2xl bg-card px-4 shadow-sm border-primary/10">
                    <AccordionTrigger className="hover:no-underline">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-xl bg-purple-100 text-purple-600"><UserCheck className="h-5 w-5" /></div>
                            <div className="text-left">
                                <p className="font-bold text-sm">5. Perfil de Elite e Autoridade</p>
                                <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">Recordes e Identidade Profissional</p>
                            </div>
                        </div>
                    </AccordionTrigger>
                    <AccordionContent className="pt-2 pb-6 space-y-4 text-sm leading-relaxed">
                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/20">
                                <div className="flex items-center gap-2 mb-2">
                                    <Trophy className="h-4 w-4 text-amber-600" />
                                    <h4 className="font-bold">Hall da Fama Profissional</h4>
                                </div>
                                <p className="text-xs text-muted-foreground">O menu "Meu Perfil" agora destaca seus maiores recordes: Maior Contrato Pago, Melhor Mês de Produção e Comissões Acumuladas.</p>
                            </div>
                            <div className="p-4 rounded-xl bg-purple-500/5 border border-purple-500/20">
                                <div className="flex items-center gap-2 mb-2">
                                    <Share2 className="h-4 w-4 text-purple-600" />
                                    <h4 className="font-bold">Assinatura Profissional</h4>
                                </div>
                                <p className="text-xs text-muted-foreground">Gere assinaturas automáticas para E-mail e WhatsApp com seus dados e a marca da LK RAMOS com um único clique.</p>
                            </div>
                        </div>
                    </AccordionContent>
                </AccordionItem>

                {/* 6. AUTOMATIZAÇÕES DE ESTEIRA */}
                <AccordionItem value="automations" className="border-2 rounded-2xl bg-card px-4 shadow-sm border-primary/10">
                    <AccordionTrigger className="hover:no-underline">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-xl bg-purple-100 text-purple-600"><Bot className="h-5 w-5" /></div>
                            <div className="text-left">
                                <p className="font-bold text-sm">6. Automatizações de Esteira</p>
                                <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">Redução de Cliques e Digitação</p>
                            </div>
                        </div>
                    </AccordionTrigger>
                    <AccordionContent className="pt-2 pb-6 space-y-4 text-sm leading-relaxed">
                        <ul className="space-y-3">
                            <li className="flex gap-3">
                                <div className="h-5 w-5 rounded-full bg-purple-500 text-white flex items-center justify-center shrink-0"><Check className="h-3 w-3" /></div>
                                <p><strong>Data de Digitação Automática</strong>: Toda nova proposta já nasce preenchida com a data de hoje.</p>
                            </li>
                            <li className="flex gap-3">
                                <div className="h-5 w-5 rounded-full bg-blue-500 text-white flex items-center justify-center shrink-0"><Binary className="h-3 w-3" /></div>
                                <p><strong>Seleção Inteligente de NB</strong>: Se o seu cliente tiver apenas um benefício cadastrado, o sistema o selecionará automaticamente ao iniciar a proposta.</p>
                            </li>
                            <li className="flex gap-3">
                                <div className="h-5 w-5 rounded-full bg-green-500 text-white flex items-center justify-center shrink-0"><Wallet className="h-3 w-3" /></div>
                                <p><strong>Baixa Coletiva</strong>: No financeiro, selecione várias propostas e dê baixa total em segundos com o botão de ação em massa.</p>
                            </li>
                        </ul>
                    </AccordionContent>
                </AccordionItem>

                {/* 7. SEGURANÇA E BRANDING */}
                <AccordionItem value="branding-security" className="border-2 rounded-2xl bg-card px-4 shadow-sm border-primary/10">
                    <AccordionTrigger className="hover:no-underline">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-xl bg-zinc-100 text-zinc-600"><ShieldCheck className="h-5 w-5" /></div>
                            <div className="text-left">
                                <p className="font-bold text-sm">7. Branding e Segurança V8</p>
                                <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">Identidade Visual e Blindagem de Dados</p>
                            </div>
                        </div>
                    </AccordionTrigger>
                    <AccordionContent className="pt-2 pb-6 space-y-4 text-sm leading-relaxed">
                        <ul className="list-disc pl-5 space-y-2 text-xs">
                            <li><strong>Blindagem Nuclear V8</strong>: Motor de proteção que impede erros de salvamento e garante integridade total dos dados na nuvem.</li>
                            <li><strong>Auras Atmosféricas</strong>: Personalize o fundo do sistema com gradientes industriais premium em "Configurações".</li>
                            <li><strong>Backup Total</strong>: Em "Dados & Backup", exporte toda a sua base de clientes e propostas para Excel a qualquer momento.</li>
                        </ul>
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
                        <span className="text-[10px] font-black uppercase">Blindagem Nuclear V8 Ativa</span>
                    </div>
                    <p className="text-[9px] text-muted-foreground mt-2 leading-tight">
                        Versão 3.5.0 - Motor de Tags e Marketing Pessoal integrados.
                    </p>
                </CardContent>
            </Card>
        </div>
      </div>
    </AppLayout>
  );
}
