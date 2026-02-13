
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
    CloudSun,
    Timer,
    History
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
                {/* MONITORAMENTO DE PRAZOS */}
                <AccordionItem value="deadlines" className="border rounded-xl bg-card px-4 shadow-sm">
                    <AccordionTrigger className="hover:no-underline">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-red-100 text-red-600"><Timer className="h-5 w-5" /></div>
                            <div className="text-left">
                                <p className="font-bold">1. Monitor de Prazo Crítico (Industrial)</p>
                                <p className="text-xs text-muted-foreground">Alertas visuais para contratos parados na esteira</p>
                            </div>
                        </div>
                    </AccordionTrigger>
                    <AccordionContent className="pt-2 pb-4 space-y-4 text-sm leading-relaxed">
                        <p>O LK RAMOS vigia cada segundo do seu dinheiro. Se uma proposta ultrapassa o tempo saudável em um status, o sistema exibe um alerta piscante.</p>
                        <ul className="list-disc pl-5 space-y-2">
                            <li><strong>Regras de Alerta</strong>: 2 dias em "Pendente", 3 dias em "Em Andamento" ou 5 dias úteis em "Aguardando Saldo".</li>
                            <li><strong>Identificação</strong>: Um ícone de cronômetro vermelho pulsará ao lado do status na tabela de propostas.</li>
                            <li><strong>Ação Sugerida</strong>: Ao ver o alerta, entre em contato imediato com a promotora para destravar o contrato.</li>
                        </ul>
                    </AccordionContent>
                </AccordionItem>

                {/* BRANDING */}
                <AccordionItem value="branding" className="border rounded-xl bg-card px-4 shadow-sm">
                    <AccordionTrigger className="hover:no-underline">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-blue-100 text-blue-600"><Palette className="h-5 w-5" /></div>
                            <div className="text-left">
                                <p className="font-bold">2. Estúdio de Branding & Atmosferas</p>
                                <p className="text-xs text-muted-foreground">Logo própria, paletas premium e fundos animados suaves</p>
                            </div>
                        </div>
                    </AccordionTrigger>
                    <AccordionContent className="pt-2 pb-4 space-y-4 text-sm leading-relaxed">
                        <p>O LK RAMOS permite que o sistema tenha a alma da sua marca através de ferramentas de customização avançada.</p>
                        <ul className="list-disc pl-5 space-y-2">
                            <li><strong>Laboratório 360°</strong>: Experimente cores, fontes e ritmos em tempo real antes de aplicar globalmente.</li>
                            <li><strong>Atmosferas Claras & Equilibradas</strong>: Ative fundos animados sutis otimizados para máxima legibilidade. Agora com coleções exclusivas como <em>Lavanda Suave</em>, <em>Menta Fresca</em> e <em>Pérola Shimmer</em>.</li>
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
                                <p className="font-bold">3. Identidade Visual Inteligente (Parceiros)</p>
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
                            <li><strong>Automação de Entrada</strong>: Propostas com data de averbação que não estão reprovadas são automaticamente marcadas como "Pendente" no financeiro, evitando que você esqueça de cobrar qualquer contrato.</li>
                            <li><strong>Balanço Mensal (PDF)</strong>: Relatório que subtrai despesas de comissões, apresentando o <strong>Lucro Líquido Real</strong>.</li>
                            <li><strong>Eficiência de Parceiros</strong>: Gráficos que mostram qual promotora paga mais rápido e gera maior ticket médio.</li>
                        </ul>
                    </AccordionContent>
                </AccordionItem>

                {/* CRM & LINHA DO TEMPO */}
                <AccordionItem value="crm" className="border rounded-xl bg-card px-4 shadow-sm">
                    <AccordionTrigger className="hover:no-underline">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-blue-100 text-blue-600"><History className="h-5 w-5" /></div>
                            <div className="text-left">
                                <p className="font-bold">5. Linha do Tempo Global (Feed de Auditoria)</p>
                                <p className="text-xs text-muted-foreground">Histórico unificado do cliente e agenda estratégica</p>
                            </div>
                        </div>
                    </AccordionTrigger>
                    <AccordionContent className="pt-2 pb-4 space-y-4 text-sm leading-relaxed">
                        <p>Centralize o conhecimento sobre o seu cliente para aumentar a taxa de conversão.</p>
                        <ul className="list-disc pl-5 space-y-2">
                            <li><strong>Histórico Unificado</strong>: Na Ficha do Cliente, o sistema mescla todos os eventos de todas as propostas em uma única linha do tempo cronológica.</li>
                            <li><strong>Cards de Indicadores Clicáveis</strong>: No topo da ficha do cliente, clique nos cards de "Propostas", "Total Contratado" ou "Comissão" para abrir um detalhamento instantâneo dos contratos que formam esses valores.</li>
                            <li><strong>Dossiê Oficial (PDF)</strong>: Gere um documento completo com dados cadastrais e histórico para auditorias ou arquivos físicos diretamente na ficha do cliente.</li>
                            <li><strong>Capa de Proposta</strong>: Dentro de cada proposta, emita uma capa executiva profissional com o resumo da operação para o cliente assinar.</li>
                            <li><strong>Radar de Retenção</strong>: Alertas automáticos para clientes com contratos pagos há mais de 12 meses, ideal para oferecer portabilidade ou refinanciamento.</li>
                            <li><strong>Gestão de Documentos Fixos</strong>: Salve documentos que não mudam (RG, CPF) uma única vez e eles estarão disponíveis em todas as futuras propostas do cliente.</li>
                        </ul>
                    </AccordionContent>
                </AccordionItem>

                {/* ESTABILIDADE E SEGURANÇA */}
                <AccordionItem value="safety" className="border rounded-xl bg-card px-4 shadow-sm">
                    <AccordionTrigger className="hover:no-underline">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-zinc-100 text-zinc-600"><Fingerprint className="h-5 w-5" /></div>
                            <div className="text-left">
                                <p className="font-bold">6. Estabilização & Proteção de Dados</p>
                                <p className="text-xs text-muted-foreground">Edição segura e blindagem contra erros de servidor</p>
                            </div>
                        </div>
                    </AccordionTrigger>
                    <AccordionContent className="pt-2 pb-4 space-y-4 text-sm leading-relaxed">
                        <p>O LK RAMOS conta com um motor de validação industrial para garantir que nenhuma informação seja perdida ou digitada incorretamente.</p>
                        <ul className="list-disc pl-5 space-y-2">
                            <li><strong>Preservação de Campos</strong>: O sistema agora garante que campos sensíveis como "Gênero" não sejam resetados durante a edição de registros existentes.</li>
                            <li><strong>Validação de Data</strong>: Proteção contra formatos de data inválidos que antes causavam interrupções no salvamento.</li>
                            <li><strong>Limpeza Automática</strong>: Antes de enviar dados para o servidor, o sistema remove valores nulos ou indefinidos, garantindo 100% de compatibilidade com o banco de dados em nuvem.</li>
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
                    Sua conta está blindada com regras de acesso por proprietário. O sistema agora possui proteção contra campos vazios ou indefinidos durante a edição manual de registros.
                </CardContent>
            </Card>
        </div>
      </div>
    </AppLayout>
  );
}
