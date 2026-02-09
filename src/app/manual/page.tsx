
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
                                <p className="text-xs text-muted-foreground">Volume de produção e Radar de Vendas</p>
                            </div>
                        </div>
                    </AccordionTrigger>
                    <AccordionContent className="pt-2 pb-4 space-y-4 text-sm leading-relaxed">
                        <p>O Dashboard é sua ferramenta de decisão rápida, agora com layout otimizado.</p>
                        <ul className="list-disc pl-5 space-y-2">
                            <li><strong>Radar de Vendas (<Zap className="inline h-3 w-3 text-orange-500" />)</strong>: Localizado em destaque no Dashboard, mostra clientes com contratos pagos há mais de 12 meses. É sua principal lista de prospecção diária de Refinanciamento.</li>
                            <li><strong>Inteligência Diária</strong>: Localizada ao lado do Radar, avisa sobre aniversários, retornos e pendências estratégicas do dia.</li>
                            <li><strong>Rankings de Performance</strong>: Agora em área expandida para facilitar a análise de quais bancos, promotoras e operadores trazem mais rentabilidade.</li>
                            <li><strong>Esteira de Propostas</strong>: Tabela em largura total no final da página para um monitoramento confortável dos últimos registros.</li>
                        </ul>
                    </AccordionContent>
                </AccordionItem>

                <AccordionItem value="customers" className="border rounded-xl bg-card px-4 shadow-sm">
                    <AccordionTrigger className="hover:no-underline">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-green-100 text-green-600"><Users className="h-5 w-5" /></div>
                            <div className="text-left">
                                <p className="font-bold">2. Gestão de Clientes & Ciclo de Vida</p>
                                <p className="text-xs text-muted-foreground">Foco na base produtiva</p>
                            </div>
                        </div>
                    </AccordionTrigger>
                    <AccordionContent className="pt-2 pb-4 space-y-4 text-sm leading-relaxed">
                        <p>Gerencie sua base com agilidade e precisão técnica.</p>
                        <ul className="list-disc pl-5 space-y-2">
                            <li><strong>Aba Inativos</strong>: Unifica clientes que foram desativados manualmente e clientes que atingiram a idade limite (75 anos ou mais). Clientes nesta aba não geram alertas de cobrança, aniversário ou radar de vendas.</li>
                            <li><strong>Cadastro via IA</strong>: Use o botão "Novo Cliente com IA" para extrair dados de textos do WhatsApp em segundos.</li>
                            <li><strong>Identificação de Gênero</strong>: Campo específico para tratamento personalizado no atendimento.</li>
                            <li><strong>Botão Copiar</strong>: Facilite o uso do CPF, Telefone e E-mail em outros sites com os ícones de cópia rápida.</li>
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
                            <li><strong>Automação de Datas</strong>: Ao marcar como **Pago** (incluindo Portabilidade), o sistema preenche a Averbação e Pagamento automaticamente.</li>
                            <li><strong>Histórico de Trâmites</strong>: Cada mudança de status gera um log automático. Você também pode registrar chamadas e pendências manualmente.</li>
                            <li><strong>Capa de Proposta (PDF)</strong>: Gere o documento oficial da operação com visual executivo para impressão.</li>
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
                        <ul className="list-disc pl-5 space-y-2">
                            <li><strong>Conciliação com IA</strong>: Cole o texto do relatório de pagamento e a IA identifica os CPFs pagos automaticamente.</li>
                            <li><strong>Eficiência Parceiros</strong>: Analise qual promotora paga mais rápido e qual tem o melhor ticket médio.</li>
                        </ul>
                    </AccordionContent>
                </AccordionItem>

                <AccordionItem value="visual" className="border rounded-xl bg-card px-4 shadow-sm">
                    <AccordionTrigger className="hover:no-underline">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-zinc-100 text-zinc-600"><Landmark className="h-5 w-5" /></div>
                            <div className="text-left">
                                <p className="font-bold">6. Identidade Visual & IA de Bancos</p>
                                <p className="text-xs text-muted-foreground">Logotipos inteligentes e temas</p>
                            </div>
                        </div>
                    </AccordionTrigger>
                    <AccordionContent className="pt-2 pb-4 space-y-4 text-sm leading-relaxed">
                        <ul className="list-disc pl-5 space-y-2">
                            <li><strong>Logotipos Inteligentes</strong>: O sistema exibe o ícone oficial do banco automaticamente. Se você adicionar um banco novo, a IA pesquisa o site dele para encontrar o logo.</li>
                            <li><strong>Limpeza de Nomes</strong>: O sistema limpa os nomes dos bancos para deixar apenas o texto comercial, removendo códigos numéricos.</li>
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
                                <p className="text-xs text-muted-foreground">Infraestrutura Profissional</p>
                            </div>
                        </div>
                    </AccordionTrigger>
                    <AccordionContent className="pt-2 pb-4 space-y-4 text-sm leading-relaxed">
                        <p>O seu sistema utiliza infraestrutura de nuvem profissional do Google (Firebase).</p>
                        <ul className="list-disc pl-5 space-y-2">
                            <li><strong>Publicação</strong>: Não há limite de atualizações do sistema.</li>
                            <li><strong>Banco de Dados</strong>: Suporta até 50.000 leituras diárias gratuitamente.</li>
                            <li><strong>Anexos</strong>: Você possui 5 GB de armazenamento gratuito para documentos de clientes.</li>
                        </ul>
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
        </div>
      </div>
    </AppLayout>
  );
}
