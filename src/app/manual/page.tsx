
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
    Search,
    Download,
    Copy,
    ArrowRightCircle,
    BadgePercent
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
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
                {/* Dashboard */}
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
                        <p>O Dashboard não é apenas uma tela de visualização, é uma ferramenta de decisão rápida.</p>
                        <ul className="list-disc pl-5 space-y-2">
                            <li><strong>Cards de Status</strong>: Mostram o volume financeiro em cada etapa. Note os <strong>Sparklines</strong> (gráficos de linha) que indicam se a produção subiu ou desceu nos últimos 7 dias.</li>
                            <li><strong>Indicador de Calor (<Zap className="inline h-3 w-3 text-orange-500" />)</strong>: Se um card brilhar em laranja, significa que aquele setor está com volume 20% acima da média. Foco total ali!</li>
                            <li><strong>Líder de Produção</strong>: No rodapé de cada card, o sistema reconhece automaticamente qual operador trouxe mais volume para aquele status.</li>
                            <li><strong>Meta Mensal</strong>: Clique no ícone de lápis para ajustar sua meta. A barra de progresso e a taxa de conversão são atualizadas em tempo real conforme os contratos são marcados como "Pagos".</li>
                        </ul>
                    </AccordionContent>
                </AccordionItem>

                {/* Clientes */}
                <AccordionItem value="customers" className="border rounded-xl bg-card px-4 shadow-sm">
                    <AccordionTrigger className="hover:no-underline">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-green-100 text-green-600"><Users className="h-5 w-5" /></div>
                            <div className="text-left">
                                <p className="font-bold">2. Gestão de Clientes & IA</p>
                                <p className="text-xs text-muted-foreground">Cadastros ultra-rápidos e dossiês</p>
                            </div>
                        </div>
                    </AccordionTrigger>
                    <AccordionContent className="pt-2 pb-4 space-y-4 text-sm leading-relaxed">
                        <p>Gerencie sua base de dados com o poder da Inteligência Artificial.</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="p-3 bg-muted/30 rounded-lg border">
                                <p className="font-bold flex items-center gap-2 mb-2"><Bot className="h-4 w-4 text-primary" /> Novo Cliente com IA</p>
                                <p className="text-xs">Não perca tempo digitando. Copie o texto que recebeu do cliente (ou da promotora) e cole no botão "Novo Cliente com IA". O sistema extrai Nome, CPF, Data de Nascimento e Endereço automaticamente.</p>
                            </div>
                            <div className="p-3 bg-muted/30 rounded-lg border">
                                <p className="font-bold flex items-center gap-2 mb-2"><FileText className="h-4 w-4 text-primary" /> Documentos Permanentes</p>
                                <p className="text-xs">Dentro do cadastro do cliente, existe a "Central de Documentos Fixos". Salve RG e CPF aqui uma única vez; eles estarão disponíveis em todas as propostas futuras deste cliente.</p>
                            </div>
                        </div>
                        <p className="mt-2 text-xs italic">Dica: O sistema alerta automaticamente se o cliente tiver 75 anos ou mais, para você conferir as regras de idade do banco.</p>
                    </AccordionContent>
                </AccordionItem>

                {/* Retornos */}
                <AccordionItem value="followups" className="border rounded-xl bg-card px-4 shadow-sm">
                    <AccordionTrigger className="hover:no-underline">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-purple-100 text-purple-600"><CalendarClock className="h-5 w-5" /></div>
                            <div className="text-left">
                                <p className="font-bold">3. Mecanismo de Retornos (CRM)</p>
                                <p className="text-xs text-muted-foreground">Nunca mais esqueça de ligar para um cliente</p>
                            </div>
                        </div>
                    </AccordionTrigger>
                    <AccordionContent className="pt-2 pb-4 space-y-4 text-sm leading-relaxed">
                        <p>O coração das vendas é o retorno. Use esta tela para organizar seu dia.</p>
                        <ul className="list-disc pl-5 space-y-2">
                            <li><strong>Agendamento</strong>: Vincule um retorno a um cliente cadastrado ou crie um "Novo Contato" (Lead).</li>
                            <li><strong>Notificações</strong>: O sino no topo do sistema avisa quando um retorno está atrasado ou é para hoje.</li>
                            <li><strong>Ações Rápidas</strong>: Ao realizar o contato, você pode marcar como "Concluído" ou "Reagendar". O sistema mantém o histórico de tudo o que foi conversado nas observações.</li>
                        </ul>
                    </AccordionContent>
                </AccordionItem>

                {/* Propostas */}
                <AccordionItem value="proposals" className="border rounded-xl bg-card px-4 shadow-sm">
                    <AccordionTrigger className="hover:no-underline">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-orange-100 text-orange-600"><TrendingUp className="h-5 w-5" /></div>
                            <div className="text-left">
                                <p className="font-bold">4. Esteira de Propostas (Workflow)</p>
                                <p className="text-xs text-muted-foreground">Do registro ao pagamento final</p>
                            </div>
                        </div>
                    </AccordionTrigger>
                    <AccordionContent className="pt-2 pb-4 space-y-4 text-sm leading-relaxed">
                        <p>Acompanhe o dinheiro em movimento com precisão cirúrgica.</p>
                        <ul className="list-disc pl-5 space-y-2">
                            <li><strong>Status de Cor</strong>: Verde (Pago), Azul (Aguardando Saldo), Amarelo (Em Andamento).</li>
                            <li><strong>Monitoramento de Saldo</strong>: Em propostas de Portabilidade, o sistema conta os dias úteis. Se chegar a 5 dias sem saldo, a linha brilhará em vermelho para alertar sobre o risco de cancelamento.</li>
                            <li><strong>Duplicação</strong>: Para clientes que fazem vários produtos (ex: Margem + Cartão), use o botão "Duplicar Proposta" para não ter que digitar os dados bancários novamente.</li>
                        </ul>
                    </AccordionContent>
                </AccordionItem>

                {/* Financeiro */}
                <AccordionItem value="financial" className="border rounded-xl bg-card px-4 shadow-sm">
                    <AccordionTrigger className="hover:no-underline">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-yellow-100 text-yellow-600"><CircleDollarSign className="h-5 w-5" /></div>
                            <div className="text-left">
                                <p className="font-bold">5. Controle Financeiro & Conciliação</p>
                                <p className="text-xs text-muted-foreground">Baixas automáticas e análise de parceiros</p>
                            </div>
                        </div>
                    </AccordionTrigger>
                    <AccordionContent className="pt-2 pb-4 space-y-4 text-sm leading-relaxed">
                        <p>Onde o lucro é consolidado. Utilize as ferramentas exclusivas de inteligência financeira.</p>
                        <div className="space-y-4">
                            <div className="p-3 bg-muted/30 rounded-lg border-l-4 border-l-primary">
                                <p className="font-bold flex items-center gap-2"><Bot className="h-4 w-4" /> Conciliação com IA</p>
                                <p className="text-xs mt-1 text-muted-foreground">Recebeu um relatório de pagamento longo em PDF ou Excel? Copie o texto, cole na ferramenta de Conciliação e a IA dirá quais CPFs batem com o esperado e quais têm divergência de valor.</p>
                            </div>
                            <div className="p-3 bg-muted/30 rounded-lg border-l-4 border-l-green-500">
                                <p className="font-bold flex items-center gap-2"><BadgePercent className="h-4 w-4" /> Relatório de Eficiência</p>
                                <p className="text-xs mt-1 text-muted-foreground">Descubra qual promotora paga mais rápido e qual tem o melhor ticket médio. O sistema calcula o "D+ Médio" (dias para pagar) automaticamente.</p>
                            </div>
                        </div>
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
                    <Button variant="outline" className="w-full justify-start text-xs h-8" asChild>
                        <a href="/settings"><Download className="mr-2 h-3 w-3" /> Fazer Backup Excel</a>
                    </Button>
                </CardContent>
            </Card>

            <Card className="bg-muted/20 border-dashed">
                <CardHeader>
                    <CardTitle className="text-sm font-bold">Dica de Produtividade</CardTitle>
                </CardHeader>
                <CardContent className="text-xs text-muted-foreground space-y-3">
                    <p>Use o atalho <strong>⌘ + K</strong> (ou Ctrl+K) em qualquer tela para abrir a Pesquisa Global. Você pode encontrar clientes e propostas em segundos sem usar o mouse.</p>
                    <p>O <strong>Resumo Diário</strong> no Dashboard (Inteligência Diária) analisa toda a sua base e sugere as 3 ações mais importantes para o seu lucro no dia de hoje.</p>
                </CardContent>
            </Card>
        </div>
      </div>
    </AppLayout>
  );
}
