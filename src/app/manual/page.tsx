'use client';

import React from 'react';
import { AppLayout } from '@/components/app-layout';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { 
    LayoutDashboard, 
    Palette, 
    Shapes, 
    Monitor, 
    Zap, 
    Wallet, 
    Eye, 
    TrendingUp, 
    ShieldCheck, 
    Sparkles, 
    Database, 
    CloudUpload,
    FileBadge,
    Bot,
    MousePointer2,
    Type,
    MoveHorizontal,
    Crown
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
                        Sistema de Gestão de Elite
                    </CardTitle>
                    <CardDescription>
                        Este guia foi projetado para transformar você em um mestre na operação do LK RAMOS. 
                        Domine cada funcionalidade de última geração e branding próprio.
                    </CardDescription>
                </CardHeader>
            </Card>

            <Accordion type="single" collapsible className="w-full space-y-4">
                <AccordionItem value="appearance" className="border rounded-xl bg-card px-4 shadow-sm">
                    <AccordionTrigger className="hover:no-underline">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-purple-100 text-purple-600"><Palette className="h-5 w-5" /></div>
                            <div className="text-left">
                                <p className="font-bold">1. Estúdio de Branding & Laboratório Visual</p>
                                <p className="text-xs text-muted-foreground">Logo próprio, estilos de aura, tipografia de elite e presets</p>
                            </div>
                        </div>
                    </AccordionTrigger>
                    <AccordionContent className="pt-2 pb-4 space-y-4 text-sm leading-relaxed">
                        <p>Personalize o sistema para que ele tenha a cara da sua marca.</p>
                        <ul className="list-disc pl-5 space-y-2">
                            <li><strong>Branding Próprio</strong>: Em Configurações, suba sua logomarca. Ela aparecerá no menu e em todos os relatórios PDF oficiais com Identidade Total.</li>
                            <li><strong>Presets de Grife</strong>: Use os botões de "Um Clique" para aplicar estilos como **Apple** (Clean), **Bloomberg** (Financeiro) ou **Gold** (Premium) instantaneamente.</li>
                            <li><strong>Identidade Total</strong>: Ao escolher uma fonte ou cor, ela é aplicada forçadamente em 100% do sistema, garantindo consistência absoluta.</li>
                            <li><strong>Laboratório de Visualização</strong>: O simulador interativo mostra como os botões e cards ficam com cada combinação. Use o botão <strong>"Testar Interação"</strong> para ver o ritmo das animações.</li>
                            <li><strong>Estúdio de Tipografia</strong>: Escolha entre 12 estilos de fontes, desde as Modernas e Arredondadas até a nova <strong>Business Pro</strong>.</li>
                            <li><strong>Motion Design</strong>: Ajuste o ritmo do sistema entre Estático (sem transições), Sutil ou Cinematográfico (luxo com efeito elástico).</li>
                        </ul>
                    </AccordionContent>
                </AccordionItem>

                <AccordionItem value="dashboard" className="border rounded-xl bg-card px-4 shadow-sm">
                    <AccordionTrigger className="hover:no-underline">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-blue-100 text-blue-600"><LayoutDashboard className="h-5 w-5" /></div>
                            <div className="text-left">
                                <p className="font-bold">2. Radar de Vendas & Inteligência Diária</p>
                                <p className="text-xs text-muted-foreground">Retenção de clientes e avisos estratégicos</p>
                            </div>
                        </div>
                    </AccordionTrigger>
                    <AccordionContent className="pt-2 pb-4 space-y-4 text-sm leading-relaxed">
                        <p>O Dashboard monitora oportunidades ocultas na sua base de dados.</p>
                        <ul className="list-disc pl-5 space-y-2">
                            <li><strong>Radar de Vendas</strong>: Identifica automaticamente clientes com contratos pagos há mais de 12 meses (momento ideal para refinanciamento).</li>
                            <li><strong>Inteligência Diária</strong>: Consolida retornos agendados, alertas de comissões atrasadas e clientes próximos de 75 anos.</li>
                            <li><strong>Resumo Estratégico</strong>: Use o botão "Resumo E-mail" para enviar um relatório completo das pendências para sua caixa de entrada.</li>
                        </ul>
                    </AccordionContent>
                </AccordionItem>

                <AccordionItem value="dre" className="border rounded-xl bg-card px-4 shadow-sm">
                    <AccordionTrigger className="hover:no-underline">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-red-100 text-red-600"><Wallet className="h-5 w-5" /></div>
                            <div className="text-left">
                                <p className="font-bold">3. Gestão Financeira & DRE</p>
                                <p className="text-xs text-muted-foreground">Controle de gastos, categorias e conciliação bancária</p>
                            </div>
                        </div>
                    </AccordionTrigger>
                    <AccordionContent className="pt-2 pb-4 space-y-4 text-sm leading-relaxed">
                        <p>Mantenha a saúde financeira da sua operação sob controle total.</p>
                        <ul className="list-disc pl-5 space-y-2">
                            <li><strong>Lançamento de Despesas</strong>: Registre custos operacionais e gerencie a situação (Pago/Pendente).</li>
                            <li><strong>Categorias de Elite</strong>: Crie categorias próprias (Ex: Marketing, Salários) em Configurações &gt; Opções.</li>
                            <li><strong>Conciliação com IA</strong>: Processe relatórios de pagamento colando apenas o texto do banco para baixar comissões automaticamente.</li>
                        </ul>
                    </AccordionContent>
                </AccordionItem>

                <AccordionItem value="preview" className="border rounded-xl bg-card px-4 shadow-sm">
                    <AccordionTrigger className="hover:no-underline">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-zinc-100 text-zinc-600"><Eye className="h-5 w-5" /></div>
                            <div className="text-left">
                                <p className="font-bold">4. Visualizador de Documentos & Central Fixa</p>
                                <p className="text-xs text-muted-foreground">Conferência instantânea e documentos permanentes</p>
                            </div>
                        </div>
                    </AccordionTrigger>
                    <AccordionContent className="pt-2 pb-4 space-y-4 text-sm leading-relaxed">
                        <p>Agilize sua conferência de propostas e mantenha a conformidade com a LGPD.</p>
                        <ul className="list-disc pl-5 space-y-2">
                            <li><strong>Visualização Segura</strong>: Use o ícone do Olho em qualquer anexo para ver imagens e PDFs sem precisar baixar arquivos.</li>
                            <li><strong>Documentos Permanentes</strong>: Salve o RG/CPF na ficha do cliente. Eles ficarão disponíveis automaticamente em todas as futuras propostas deste cliente.</li>
                        </ul>
                    </AccordionContent>
                </AccordionItem>
            </Accordion>
        </div>

        <div className="lg:col-span-1 space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="text-sm font-black uppercase tracking-widest text-muted-foreground">Atalhos de Elite</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                    <Button variant="outline" className="w-full justify-start text-xs h-8" asChild>
                        <a href="/settings?tab=appearance"><Crown className="mr-2 h-3 w-3 text-amber-500" /> Presets de Grife</a>
                    </Button>
                    <Button variant="outline" className="w-full justify-start text-xs h-8" asChild>
                        <a href="/settings?tab=appearance"><Type className="mr-2 h-3 w-3 text-blue-500" /> Estúdio de Fontes</a>
                    </Button>
                    <Button variant="outline" className="w-full justify-start text-xs h-8" asChild>
                        <a href="/settings?tab=appearance"><MoveHorizontal className="mr-2 h-3 w-3 text-purple-500" /> Motion Design</a>
                    </Button>
                    <Button variant="outline" className="w-full justify-start text-xs h-8" asChild>
                        <a href="/summary"><Bot className="mr-2 h-3 w-3 text-green-500" /> Relatório IA</a>
                    </Button>
                </CardContent>
            </Card>
        </div>
      </div>
    </AppLayout>
  );
}