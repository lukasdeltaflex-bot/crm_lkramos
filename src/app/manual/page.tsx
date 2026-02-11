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
    Fingerprint
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
                                <p className="font-bold">1. Estúdio de Branding & Laboratório 360°</p>
                                <p className="text-xs text-muted-foreground">Logo própria, paletas premium e identidade visual total</p>
                            </div>
                        </div>
                    </AccordionTrigger>
                    <AccordionContent className="pt-2 pb-4 space-y-4 text-sm leading-relaxed">
                        <p>O LK RAMOS permite que o sistema tenha a alma da sua marca através de ferramentas de customização avançada.</p>
                        <ul className="list-disc pl-5 space-y-2">
                            <li><strong>Laboratório Sandbox</strong>: Experimente cores e fontes em tempo real. As mudanças só afetam o sistema quando você clica em "Aplicar Globalmente".</li>
                            <li><strong>Branding Próprio</strong>: Upload de logomarca própria, exibida no menu lateral e em todos os relatórios PDF oficiais (Dossiês e Fechamentos).</li>
                            <li><strong>Barra Lateral Independente</strong>: Modos <strong>Dark</strong>, <strong>Light</strong> ou <strong>Padrão</strong> para o menu de navegação.</li>
                        </ul>
                    </AccordionContent>
                </AccordionItem>

                {/* MONITORAMENTO & PULSAÇÃO */}
                <AccordionItem value="alerts" className="border rounded-xl bg-card px-4 shadow-sm">
                    <AccordionTrigger className="hover:no-underline">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-red-100 text-red-600"><Zap className="h-5 w-5" /></div>
                            <div className="text-left">
                                <p className="font-bold">2. Monitoramento Industrial & Big Wins</p>
                                <p className="text-xs text-muted-foreground">Alertas de saldo, pulsação de urgência e auras de performance</p>
                            </div>
                        </div>
                    </AccordionTrigger>
                    <AccordionContent className="pt-2 pb-4 space-y-4 text-sm leading-relaxed">
                        <p>O sistema atua como um vigia constante da sua esteira de produção.</p>
                        <ul className="list-disc pl-5 space-y-2">
                            <li><strong>Monitoramento de Saldo</strong>: Portabilidades em "Aguardando Saldo" exibem um ícone de exclamação. A contagem de dias úteis inicia no <strong>próximo dia útil</strong> após a mudança de status.</li>
                            <li><strong>Pulsação de Urgência</strong>: Ao atingir 5 dias úteis de espera, o ícone torna-se vermelho e pulsante, sinalizando retenção indevida pelo banco.</li>
                            <li><strong>Aura Big Win (Dourada)</strong>: Propostas com comissão igual ou superior a <strong>R$ 3.000,00</strong> brilham com uma aura dourada exclusiva, destacando os negócios de maior impacto.</li>
                        </ul>
                    </AccordionContent>
                </AccordionItem>

                {/* INTELIGÊNCIA PREVENTIVA */}
                <AccordionItem value="preventive" className="border rounded-xl bg-card px-4 shadow-sm">
                    <AccordionTrigger className="hover:no-underline">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-amber-100 text-amber-600"><AlertTriangle className="h-5 w-5" /></div>
                            <div className="text-left">
                                <p className="font-bold">3. Inteligência Preventiva (Anti-Erro)</p>
                                <p className="text-xs text-muted-foreground">Verificadores de CPF e Proposta em tempo real</p>
                            </div>
                        </div>
                    </AccordionTrigger>
                    <AccordionContent className="pt-2 pb-4 space-y-4 text-sm leading-relaxed">
                        <p>Blindagem contra duplicidade e erros de digitação.</p>
                        <ul className="list-disc pl-5 space-y-2">
                            <li><strong>Verificador de CPF</strong>: Ao digitar um CPF já cadastrado, o sistema emite um alerta imediato com o nome do cliente proprietário, evitando cadastros repetidos.</li>
                            <li><strong>Trava de Proposta</strong>: Validação instantânea do número do contrato. Se o número já existir na base, o sistema bloqueia o salvamento e identifica o cliente vinculado.</li>
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
                            <li><strong>Blindagem de Pendências</strong>: Comissões nos status "Pendente" ou "Parcial" nunca somem do Financeiro, permanecendo visíveis até que o pagamento seja integralizado.</li>
                            <li><strong>Balanço Mensal (PDF)</strong>: Relatório unificado que subtrai suas <strong>Despesas</strong> das <strong>Comissões Recebidas</strong>, apresentando o <strong>Lucro Líquido Real</strong> do período.</li>
                            <li><strong>Filtros de Parceiro</strong>: Seletores rápidos no topo para filtrar saldos a receber por Banco ou Promotora específica.</li>
                        </ul>
                    </AccordionContent>
                </AccordionItem>

                {/* INTELIGÊNCIA ARTIFICIAL */}
                <AccordionItem value="ai-features" className="border rounded-xl bg-card px-4 shadow-sm">
                    <AccordionTrigger className="hover:no-underline">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-purple-100 text-purple-600"><Bot className="h-5 w-5" /></div>
                            <div className="text-left">
                                <p className="font-bold">5. Assistente de Inteligência Artificial</p>
                                <p className="text-xs text-muted-foreground">Extração de dados, resumos estratégicos e parabéns automatizado</p>
                            </div>
                        </div>
                    </AccordionTrigger>
                    <AccordionContent className="pt-2 pb-4 space-y-4 text-sm leading-relaxed">
                        <p>O cérebro do LK RAMOS processando dados para você.</p>
                        <ul className="list-disc pl-5 space-y-2">
                            <li><strong>Cadastro via IA</strong>: Cole um texto bruto do WhatsApp ou e-mail e a IA preencherá o formulário do cliente automaticamente.</li>
                            <li><strong>Análise Estratégica</strong>: Resumo automático do perfil do cliente baseado em seu histórico financeiro e anotações.</li>
                            <li><strong>Parabéns no WhatsApp</strong>: Gere mensagens de aniversário personalizadas e profissionais com um clique a partir do sino de notificações.</li>
                            <li><strong>Conciliação IA</strong>: Cole seu extrato de pagamento da promotora e a IA identificará quais propostas devem ser baixadas como "Pagas".</li>
                        </ul>
                    </AccordionContent>
                </AccordionItem>

                {/* CRM & RETORNOS */}
                <AccordionItem value="crm" className="border rounded-xl bg-card px-4 shadow-sm">
                    <AccordionTrigger className="hover:no-underline">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-blue-100 text-blue-600"><CalendarClock className="h-5 w-5" /></div>
                            <div className="text-left">
                                <p className="font-bold">6. Mecanismo de Retornos (CRM)</p>
                                <p className="text-xs text-muted-foreground">Gestão de oportunidades, agendamentos e histórico de contatos</p>
                            </div>
                        </div>
                    </AccordionTrigger>
                    <AccordionContent className="pt-2 pb-4 space-y-4 text-sm leading-relaxed">
                        <p>Nunca perca um agendamento ou uma indicação.</p>
                        <ul className="list-disc pl-5 space-y-2">
                            <li><strong>Agenda Integrada</strong>: Visualize retornos pendentes em lista ou formato de calendário mensal.</li>
                            <li><strong>Vínculo de Clientes</strong>: Relacione contatos a clientes já existentes para manter o histórico de prospecção unificado.</li>
                            <li><strong>Alertas de Atraso</strong>: Notificações automáticas para retornos não realizados na data prevista.</li>
                        </ul>
                    </AccordionContent>
                </AccordionItem>

                {/* DOSSIÊ E FORMALIZAÇÃO */}
                <AccordionItem value="documents" className="border rounded-xl bg-card px-4 shadow-sm">
                    <AccordionTrigger className="hover:no-underline">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-zinc-100 text-zinc-600"><FileBadge className="h-5 w-5" /></div>
                            <div className="text-left">
                                <p className="font-bold">7. Dossiê Oficial & Formalização</p>
                                <p className="text-xs text-muted-foreground">Autenticação eletrônica, LGPD e central de documentos fixos</p>
                            </div>
                        </div>
                    </AccordionTrigger>
                    <AccordionContent className="pt-2 pb-4 space-y-4 text-sm leading-relaxed">
                        <p>Segurança jurídica e apresentação de alto impacto.</p>
                        <ul className="list-disc pl-5 space-y-2">
                            <li><strong>Dossiê Autenticado</strong>: Geração de PDF com **Chave de Validação Eletrônica** (Hash único) e declaração de conformidade com a LGPD.</li>
                            <li><strong>Central de Documentos Fixos</strong>: Salve RG, CPF e CNH na ficha do cliente uma única vez. Eles estarão disponíveis em todas as propostas futuras deste CPF.</li>
                            <li><strong>Capa de Proposta</strong>: Gere capas profissionais para processos físicos ou digitais em um clique.</li>
                        </ul>
                    </AccordionContent>
                </AccordionItem>

                {/* PRODUTIVIDADE */}
                <AccordionItem value="productivity" className="border rounded-xl bg-card px-4 shadow-sm">
                    <AccordionTrigger className="hover:no-underline">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-zinc-100 text-zinc-600"><Search className="h-5 w-5" /></div>
                            <div className="text-left">
                                <p className="font-bold">8. Produtividade & Comandos Rápidos</p>
                                <p className="text-xs text-muted-foreground">Busca global, comandos de teclado e visualização segura</p>
                            </div>
                        </div>
                    </AccordionTrigger>
                    <AccordionContent className="pt-2 pb-4 space-y-4 text-sm leading-relaxed">
                        <p>Agilize seu fluxo de trabalho com ferramentas de acesso rápido.</p>
                        <ul className="list-disc pl-5 space-y-2">
                            <li><strong>Busca Inteligente (⌘K / Ctrl+K)</strong>: Atalho para abrir a busca global. Encontre clientes, CPFs, benefícios ou propostas instantaneamente.</li>
                            <li><strong>Visualizador Seguro</strong>: Ícone do <strong>Olho (Eye)</strong> para conferir documentos e comprovantes no navegador sem precisar baixá-los para o computador.</li>
                            <li><strong>Modo Privacidade</strong>: Oculte valores financeiros da tela com um clique, ideal para atendimentos presenciais com o cliente ao lado.</li>
                        </ul>
                    </AccordionContent>
                </AccordionItem>
            </Accordion>
        </div>

        {/* SIDEBAR RIGHT */}
        <div className="lg:col-span-1 space-y-6">
            <Card className="border-primary/20 bg-primary/[0.02]">
                <CardHeader>
                    <CardTitle className="text-xs font-black uppercase tracking-widest text-primary/70">Atalhos de Elite</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                    <Button variant="outline" className="w-full justify-start text-xs h-8" asChild>
                        <a href="/settings?tab=appearance"><Palette className="mr-2 h-3 w-3 text-blue-500" /> Estúdio de Branding</a>
                    </Button>
                    <Button variant="outline" className="w-full justify-start text-xs h-8" asChild>
                        <a href="/financial?tab=expenses"><Wallet className="mr-2 h-3 w-3 text-orange-500" /> Balanço & DRE</a>
                    </Button>
                    <Button variant="outline" className="w-full justify-start text-xs h-8" asChild>
                        <a href="/summary"><Bot className="mr-2 h-3 w-3 text-green-500" /> Inteligência IA</a>
                    </Button>
                    <Button variant="outline" className="w-full justify-start text-xs h-8" asChild>
                        <a href="/follow-ups"><CalendarClock className="mr-2 h-3 w-3 text-purple-500" /> CRM de Retornos</a>
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
