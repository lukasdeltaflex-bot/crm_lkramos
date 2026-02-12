
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
    Eye, 
    Filter,
    Pipette,
    BookOpen,
    Zap,
    Type,
    MoveHorizontal,
    Bot,
    Shapes,
    TrendingUp,
    Layout,
    PanelLeft,
    Search,
    AlertTriangle,
    Coins,
    FileCheck2,
    CalendarClock,
    FileBadge,
    Fingerprint,
    CloudSun
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
                        Plataforma de Gestão Industrial de Elite
                    </CardTitle>
                    <CardDescription>
                        Este guia foi projetado para transformar você em um mestre na operação do LK RAMOS. 
                        Domine cada funcionalidade de última geração, inteligência preventiva e branding próprio.
                    </CardDescription>
                </CardHeader>
            </Card>

            <Accordion type="single" collapsible className="w-full space-y-4">
                {/* BRANDING */}
                <AccordionItem value="branding" className="border rounded-xl bg-card px-4 shadow-sm">
                    <AccordionTrigger className="hover:no-underline">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-blue-100 text-blue-600"><Palette className="h-5 w-5" /></div>
                            <div className="text-left">
                                <p className="font-bold">1. Estúdio de Branding & Atmosferas</p>
                                <p className="text-xs text-muted-foreground">Logo própria, paletas premium e fundos animados suaves</p>
                            </div>
                        </div>
                    </AccordionTrigger>
                    <AccordionContent className="pt-2 pb-4 space-y-4 text-sm leading-relaxed">
                        <p>O LK RAMOS permite que o sistema tenha a alma da sua marca através de ferramentas de customização avançada.</p>
                        <ul className="list-disc pl-5 space-y-2">
                            <li><strong>Laboratório 360°</strong>: Experimente cores, fontes e ritmos em tempo real antes de aplicar globalmente.</li>
                            <li><strong>Atmosferas Claras & Equilibradas</strong>: Ative fundos animados sutis (Nebulosa Suave, Aurora Boreal, Sunset Pastel) otimizados para máxima legibilidade e conforto visual.</li>
                            <li><strong>Branding Próprio</strong>: Upload de logomarca própria, exibida no menu lateral e em todos os relatórios PDF oficiais.</li>
                        </ul>
                    </AccordionContent>
                </AccordionItem>

                {/* IDENTIDADE IA */}
                <AccordionItem value="ai-branding" className="border rounded-xl bg-card px-4 shadow-sm">
                    <AccordionTrigger className="hover:no-underline">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-purple-100 text-purple-600"><Bot className="h-5 w-5" /></div>
                            <div className="text-left">
                                <p className="font-bold">2. Identidade Visual Inteligente (Parceiros)</p>
                                <p className="text-xs text-muted-foreground">Logotipos automáticos de Bancos e Promotoras via IA</p>
                            </div>
                        </div>
                    </AccordionTrigger>
                    <AccordionContent className="pt-2 pb-4 space-y-4 text-sm leading-relaxed">
                        <p>O sistema organiza visualmente sua rede de parceiros automaticamente.</p>
                        <ul className="list-disc pl-5 space-y-2">
                            <li><strong>Detecção Automática</strong>: Ao cadastrar um Banco ou Promotora, a IA busca o logotipo oficial e o domínio da empresa.</li>
                            <li><strong>Reconhecimento nas Tabelas</strong>: Propostas e extratos financeiros exibem ícones coloridos, permitindo identificar o parceiro em milissegundos sem ler o texto.</li>
                            <li><strong>Gestão de Domínios</strong>: Nas configurações, você pode ajustar manualmente o site do parceiro para forçar o carregamento de uma marca específica.</li>
                        </ul>
                    </AccordionContent>
                </AccordionItem>

                {/* MONITORAMENTO & PULSAÇÃO */}
                <AccordionItem value="alerts" className="border rounded-xl bg-card px-4 shadow-sm">
                    <AccordionTrigger className="hover:no-underline">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-red-100 text-red-600"><Zap className="h-5 w-5" /></div>
                            <div className="text-left">
                                <p className="font-bold">3. Monitoramento Industrial & Big Wins</p>
                                <p className="text-xs text-muted-foreground">Alertas de saldo, pulsação de urgência e auras de performance</p>
                            </div>
                        </div>
                    </AccordionTrigger>
                    <AccordionContent className="pt-2 pb-4 space-y-4 text-sm leading-relaxed">
                        <p>O sistema atua como um vigia constante da sua esteira de produção.</p>
                        <ul className="list-disc pl-5 space-y-2">
                            <li><strong>Monitoramento de Saldo</strong>: Portabilidades em "Aguardando Saldo" exibem pulsação vermelha ao atingir 5 dias úteis de espera.</li>
                            <li><strong>Aura Big Win (Dourada)</strong>: Propostas com comissão superior a <strong>R$ 3.000,00</strong> ganham destaque dourado exclusivo.</li>
                            <li><strong>Navegação Inteligente por Alerta</strong>: Ao clicar em um alerta no Dashboard, o sistema leva você direto para a Proposta ou Cliente, aplicando filtros automaticamente.</li>
                        </ul>
                    </AccordionContent>
                </AccordionItem>

                {/* FINANCEIRO & BALANÇO */}
                <AccordionItem value="financial" className="border rounded-xl bg-card px-4 shadow-sm">
                    <AccordionTrigger className="hover:no-underline">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-emerald-100 text-emerald-600"><Coins className="h-5 w-5" /></div>
                            <div className="text-left">
                                <p className="font-bold">4. Fluxo de Caixa & Balanço Empresarial</p>
                                <p className="text-xs text-muted-foreground">Lucro líquido, filtros rápidos e fechamento mensal unificado</p>
                            </div>
                        </div>
                    </AccordionTrigger>
                    <AccordionContent className="pt-2 pb-4 space-y-4 text-sm leading-relaxed">
                        <p>Controle financeiro de nível contábil para sua operação.</p>
                        <ul className="list-disc pl-5 space-y-2">
                            <li><strong>Blindagem de Pendências</strong>: Comissões "Pendente" ou "Parcial" nunca saem da vista até serem baixadas.</li>
                            <li><strong>Balanço Mensal (PDF)</strong>: Relatório que subtrai despesas de comissões, apresentando o <strong>Lucro Líquido Real</strong>.</li>
                            <li><strong>Eficiência de Parceiros</strong>: Gráficos que mostram qual promotora paga mais rápido e gera maior ticket médio.</li>
                        </ul>
                    </AccordionContent>
                </AccordionItem>

                {/* CRM & LINHA DO TEMPO */}
                <AccordionItem value="crm" className="border rounded-xl bg-card px-4 shadow-sm">
                    <AccordionTrigger className="hover:no-underline">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-blue-100 text-blue-600"><CalendarClock className="h-5 w-5" /></div>
                            <div className="text-left">
                                <p className="font-bold">5. CRM de Retornos & Linha do Tempo Global</p>
                                <p className="text-xs text-muted-foreground">Histórico unificado do cliente e agenda estratégica</p>
                            </div>
                        </div>
                    </AccordionTrigger>
                    <AccordionContent className="pt-2 pb-4 space-y-4 text-sm leading-relaxed">
                        <p>Nunca perca uma oportunidade de refinanciamento.</p>
                        <ul className="list-disc pl-5 space-y-2">
                            <li><strong>Linha do Tempo Global</strong>: Na ficha do cliente, veja todos os trâmites de todas as propostas dele em ordem cronológica.</li>
                            <li><strong>Radar de Retenção</strong>: Alertas automáticos para clientes com contratos pagos há mais de 12 meses.</li>
                            <li><strong>WhatsApp de Um Clique</strong>: Inicie conversas direto das listas de propostas ou clientes.</li>
                        </ul>
                    </AccordionContent>
                </AccordionItem>
            </Accordion>
        </div>

        {/* SIDEBAR RIGHT */}
        <div className="lg:col-span-1 space-y-6">
            <Card className="border-primary/20 bg-primary/[0.02]">
                <CardHeader>
                    <CardTitle className="text-xs font-black uppercase tracking-widest text-primary/70">Dica de Elite</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-start gap-2">
                        <CloudSun className="h-4 w-4 text-orange-500 shrink-0" />
                        <p className="text-[10px] text-muted-foreground leading-tight">As novas <strong>Atmosferas Claras</strong> foram projetadas para reduzir o cansaço visual em longas jornadas de digitação.</p>
                    </div>
                    <Button variant="outline" className="w-full justify-start text-xs h-8" asChild>
                        <a href="/settings?tab=appearance"><Palette className="mr-2 h-3 w-3 text-blue-500" /> Estúdio de Branding</a>
                    </Button>
                </CardContent>
            </Card>

            <Card className="bg-muted/30 border-dashed">
                <CardHeader>
                    <CardTitle className="text-xs font-bold uppercase flex items-center gap-2">
                        <Fingerprint className="h-3 w-3" /> Segurança de Dados
                    </CardTitle>
                </CardHeader>
                <CardContent className="text-[10px] text-muted-foreground leading-relaxed">
                    Sua conta está blindada com regras de acesso por proprietário. Somente você pode visualizar e editar os dados da sua carteira. O backup total está disponível na aba de Configurações.
                </CardContent>
            </Card>
        </div>
      </div>
    </AppLayout>
  );
}
