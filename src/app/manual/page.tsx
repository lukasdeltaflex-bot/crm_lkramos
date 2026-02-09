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
    History,
    UserX,
    Copy,
    CalendarCheck,
    Cloud
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
                                <p className="text-xs text-muted-foreground">Visão geral de produção e tendências</p>
                            </div>
                        </div>
                    </AccordionTrigger>
                    <AccordionContent className="pt-2 pb-4 space-y-4 text-sm leading-relaxed">
                        <p>O Dashboard é sua ferramenta de decisão rápida.</p>
                        <ul className="list-disc pl-5 space-y-2">
                            <li><strong>Cards de Status</strong>: Mostram o volume financeiro. Note os <strong>Sparklines</strong> que indicam a tendência dos últimos 7 dias.</li>
                            <li><strong>Indicador de Calor (<Zap className="inline h-3 w-3 text-orange-500" />)</strong>: Se um card brilhar em laranja, o setor está com volume 20% acima da média.</li>
                            <li><strong>Meta Mensal</strong>: Clique no ícone de lápis para ajustar sua meta. O progresso é atualizado em tempo real com contratos "Pagos".</li>
                        </ul>
                    </AccordionContent>
                </AccordionItem>

                <AccordionItem value="customers" className="border rounded-xl bg-card px-4 shadow-sm">
                    <AccordionTrigger className="hover:no-underline">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-green-100 text-green-600"><Users className="h-5 w-5" /></div>
                            <div className="text-left">
                                <p className="font-bold">2. Gestão de Clientes & Ciclo de Vida</p>
                                <p className="text-xs text-muted-foreground">Cadastros via IA e controle de inativos</p>
                            </div>
                        </div>
                    </AccordionTrigger>
                    <AccordionContent className="pt-2 pb-4 space-y-4 text-sm leading-relaxed">
                        <p>Gerencie sua base com agilidade e precisão técnica.</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="p-3 bg-muted/30 rounded-lg border">
                                <p className="font-bold flex items-center gap-2 mb-2"><Bot className="h-4 w-4 text-primary" /> Novo Cliente com IA</p>
                                <p className="text-xs">Cole o texto do WhatsApp e a IA extrai Nome, CPF, Endereço e Gênero automaticamente.</p>
                            </div>
                            <div className="p-3 bg-muted/30 rounded-lg border">
                                <p className="font-bold flex items-center gap-2 mb-2"><UserX className="h-4 w-4 text-destructive" /> Gestão de Inativos</p>
                                <p className="text-xs">Clientes falecidos ou que não podem mais operar podem ser marcados como "Inativos". Eles são movidos para uma aba separada e não geram alertas.</p>
                            </div>
                        </div>
                        <ul className="list-disc pl-5 mt-4 space-y-2">
                            <li><strong>Tabs de Organização</strong>: A listagem é dividida entre <strong>Ativos</strong>, <strong>75+ Anos</strong> (atenção especial) e <strong>Inativos</strong>.</li>
                            <li><strong>Atalhos de Cópia (<Copy className="inline h-3 w-3" />)</strong>: Copie CPF, Telefone ou E-mail com um único clique na ficha do cliente.</li>
                            <li><strong>Dossiê PDF</strong>: Gere um relatório completo do cliente incluindo todo o histórico de propostas realizadas.</li>
                        </ul>
                    </AccordionContent>
                </AccordionItem>

                <AccordionItem value="followups" className="border rounded-xl bg-card px-4 shadow-sm">
                    <AccordionTrigger className="hover:no-underline">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-purple-100 text-purple-600"><CalendarClock className="h-5 w-5" /></div>
                            <div className="text-left">
                                <p className="font-bold">3. Mecanismo de Retornos (CRM)</p>
                                <p className="text-xs text-muted-foreground">Calendário mensal e agendamentos</p>
                            </div>
                        </div>
                    </AccordionTrigger>
                    <AccordionContent className="pt-2 pb-4 space-y-4 text-sm leading-relaxed">
                        <p>Organize seu dia de vendas com precisão.</p>
                        <ul className="list-disc pl-5 space-y-2">
                            <li><strong>Calendário Mensal</strong>: Use a aba "Calendário" para visualizar picos de agendamento e organizar seu fluxo de chamadas.</li>
                            <li><strong>Filtro de Data</strong>: Ao clicar em um dia no calendário, o sistema isola automaticamente os retornos daquela data.</li>
                            <li><strong>Notificações Inteligentes</strong>: O sino avisa sobre retornos atrasados, aniversários e comissões pendentes em tempo real.</li>
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
                            <li><strong>Automação de Datas (<CalendarCheck className="inline h-3 w-3" />)</strong>: Ao marcar qualquer proposta como <strong>Pago</strong> (incluindo Portabilidade), o sistema preenche automaticamente a Data de Averbação e Pagamento.</li>
                            <li><strong>Linha do Tempo (<History className="inline h-3 w-3" />)</strong>: Registros automáticos de mudanças de status e campo para "Trâmites" manuais (pendências, ligações).</li>
                            <li><strong>Capa de Proposta (<FileBadge className="inline h-3 w-3" />)</strong>: Gere o documento oficial da operação em PDF com visual executivo para impressão.</li>
                            <li><strong>Monitoramento de Saldo</strong>: Portabilidades aguardando saldo há mais de 5 dias brilham em vermelho na tabela.</li>
                        </ul>
                    </AccordionContent>
                </AccordionItem>

                <AccordionItem value="financial" className="border rounded-xl bg-card px-4 shadow-sm">
                    <AccordionTrigger className="hover:no-underline">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-yellow-100 text-yellow-600"><CircleDollarSign className="h-5 w-5" /></div>
                            <div className="text-left">
                                <p className="font-bold">5. Controle Financeiro & Conciliação</p>
                                <p className="text-xs text-muted-foreground">Baixas rápidas e análise de parceiros</p>
                            </div>
                        </div>
                    </AccordionTrigger>
                    <AccordionContent className="pt-2 pb-4 space-y-4 text-sm leading-relaxed">
                        <p>Inteligência financeira aplicada ao caixa.</p>
                        <div className="space-y-4">
                            <div className="p-3 bg-muted/30 rounded-lg border-l-4 border-l-primary">
                                <p className="font-bold flex items-center gap-2"><Bot className="h-4 w-4" /> Conciliação com IA</p>
                                <p className="text-xs mt-1">Cole o texto do relatório de pagamento da promotora. A IA identifica os CPFs pagos e aponta divergências de centavos automaticamente.</p>
                            </div>
                            <div className="p-3 bg-muted/30 rounded-lg border-l-4 border-l-green-500">
                                <p className="font-bold flex items-center gap-2"><Zap className="h-4 w-4" /> Eficiência por Parceiro</p>
                                <p className="text-xs mt-1">Descubra qual promotora é a "Mais Ágil" no repasse e qual possui o melhor Ticket Médio por contrato.</p>
                            </div>
                        </div>
                    </AccordionContent>
                </AccordionItem>

                <AccordionItem value="visual" className="border rounded-xl bg-card px-4 shadow-sm">
                    <AccordionTrigger className="hover:no-underline">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-zinc-100 text-zinc-600"><Landmark className="h-5 w-5" /></div>
                            <div className="text-left">
                                <p className="font-bold">6. Identidade Visual & IA de Bancos</p>
                                <p className="text-xs text-muted-foreground">Logotipos inteligentes e nomes limpos</p>
                            </div>
                        </div>
                    </AccordionTrigger>
                    <AccordionContent className="pt-2 pb-4 space-y-4 text-sm leading-relaxed">
                        <p>Um ambiente profissional e focado na marca.</p>
                        <ul className="list-disc pl-5 space-y-2">
                            <li><strong>Logotipos Inteligentes</strong>: O sistema exibe o ícone oficial do banco automaticamente. Se você adicionar um banco novo, a IA pesquisa o site dele para encontrar o logo.</li>
                            <li><strong>Limpeza de Nomes</strong>: Esqueça os códigos chatos (001, 104). O sistema limpa os nomes dos bancos para deixar apenas o texto comercial.</li>
                            <li><strong>Temas de Cor</strong>: Em <strong>Configurações &gt; Aparência</strong>, você pode trocar a cor principal do sistema para combinar com sua marca.</li>
                        </ul>
                    </AccordionContent>
                </AccordionItem>

                <AccordionItem value="limits" className="border rounded-xl bg-card px-4 shadow-sm">
                    <AccordionTrigger className="hover:no-underline">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-orange-100 text-orange-600"><Cloud className="h-5 w-5" /></div>
                            <div className="text-left">
                                <p className="font-bold">7. Limites Técnicos & Escalabilidade</p>
                                <p className="text-xs text-muted-foreground">Entenda as capacidades do seu sistema</p>
                            </div>
                        </div>
                    </AccordionTrigger>
                    <AccordionContent className="pt-2 pb-4 space-y-4 text-sm leading-relaxed">
                        <p>Seu sistema opera no <strong>Firebase Spark Plan (Gratuito)</strong>. Estes são os limites diários para que você possa operar com tranquilidade:</p>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="p-3 bg-muted/30 rounded-lg border">
                                <p className="font-bold text-xs mb-1 uppercase">Banco de Dados</p>
                                <p className="text-xl font-bold">50.000</p>
                                <p className="text-[10px] text-muted-foreground">Leituras por dia</p>
                            </div>
                            <div className="p-3 bg-muted/30 rounded-lg border">
                                <p className="font-bold text-xs mb-1 uppercase">Arquivos (Anexos)</p>
                                <p className="text-xl font-bold">5 GB</p>
                                <p className="text-[10px] text-muted-foreground">Total de armazenamento</p>
                            </div>
                            <div className="p-3 bg-muted/30 rounded-lg border">
                                <p className="font-bold text-xs mb-1 uppercase">Escalabilidade</p>
                                <p className="text-xl font-bold">Ilimitada</p>
                                <p className="text-[10px] text-muted-foreground">Alterações de código</p>
                            </div>
                        </div>
                        <p className="text-xs text-muted-foreground mt-2 italic">Nota: Para um correspondente bancário típico, estes limites são suficientes para gerenciar milhares de clientes sem custo.</p>
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
                        <a href="/financial"><CircleDollarSign className="mr-2 h-3 w-3" /> Conciliar Relatório</a>
                    </Button>
                </CardContent>
            </Card>

            <Card className="bg-muted/20 border-dashed">
                <CardHeader>
                    <CardTitle className="text-sm font-bold">Atalho de Produtividade</CardTitle>
                </CardHeader>
                <CardContent className="text-xs text-muted-foreground">
                    <p>Use <strong>⌘ + K</strong> (ou Ctrl+K) para abrir a Pesquisa Global e encontrar Clientes ou Propostas em segundos.</p>
                </CardContent>
            </Card>
        </div>
      </div>
    </AppLayout>
  );
}
