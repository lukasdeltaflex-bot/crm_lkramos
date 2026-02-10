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
    MousePointer2,
    Shapes
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
                                <p className="text-xs text-muted-foreground">Logo próprio, estilos de aura, tipografia de elite e movimento</p>
                            </div>
                        </div>
                    </AccordionTrigger>
                    <AccordionContent className="pt-2 pb-4 space-y-4 text-sm leading-relaxed">
                        <p>Personalize o sistema para que ele tenha a cara da sua marca.</p>
                        <ul className="list-disc pl-5 space-y-2">
                            <li><strong>Branding Próprio</strong>: Em Configurações, suba sua logomarca. Ela aparecerá no menu e em todos os relatórios PDF oficiais com Identidade Total.</li>
                            <li><strong>Identidade Total</strong>: Ao escolher uma fonte ou cor, ela é aplicada forçadamente em 100% do sistema, garantindo consistência absoluta.</li>
                            <li><strong>Estúdio de Arredondamento</strong>: Níveis como Reto, Extra-Discreto (2px), Discreto (8px) ou Moderno (12px).</li>
                            <li><strong>Estúdio de Tipografia</strong>: 20 estilos de fontes profissionais como Industrial, Futurista, Real ou Elegante.</li>
                            <li><strong>Motion Design (Ritmo)</strong>: Ajuste a velocidade de resposta. Use o modo <strong>Instantâneo</strong> para rapidez extrema ou <strong>Atmosférico</strong> para luxo.</li>
                        </ul>
                    </AccordionContent>
                </AccordionItem>

                <AccordionItem value="advanced-custom" className="border rounded-xl bg-card px-4 shadow-sm">
                    <AccordionTrigger className="hover:no-underline">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-blue-100 text-blue-600"><Pipette className="h-5 w-5" /></div>
                            <div className="text-left">
                                <p className="font-bold">2. Customização Avançada & Aura</p>
                                <p className="text-xs text-muted-foreground">Controle de vidro dinâmico, cores de status e novos estilos de aura</p>
                            </div>
                        </div>
                    </AccordionTrigger>
                    <AccordionContent className="pt-2 pb-4 space-y-4 text-sm leading-relaxed">
                        <p>Ferramentas de ajuste fino para sua interface de trabalho.</p>
                        <ul className="list-disc pl-5 space-y-2">
                            <li><strong>Auras de Próxima Geração</strong>: Experimente os modos <strong>Glow (Neon)</strong>, <strong>Geométrico (Heavy Border)</strong> ou <strong>Glassmorphism</strong>.</li>
                            <li><strong>Intensidade do Vidro</strong>: No estilo "Glassmorphism", utilize o slider para ajustar a opacidade e o nível de desfoque (blur).</li>
                            <li><strong>Laboratório de Cores de Status</strong>: Defina cores personalizadas para cada status. As cores são aplicadas automaticamente em cards (com 12% de aura de fundo) e tabelas.</li>
                        </ul>
                    </AccordionContent>
                </AccordionItem>

                <AccordionItem value="navigation" className="border rounded-xl bg-card px-4 shadow-sm">
                    <AccordionTrigger className="hover:no-underline">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-orange-100 text-orange-600"><Filter className="h-5 w-5" /></div>
                            <div className="text-left">
                                <p className="font-bold">3. Navegação Cromática & Filtros Inteligentes</p>
                                <p className="text-xs text-muted-foreground">Filtros coloridos e busca inteligente por ID ou CPF</p>
                            </div>
                        </div>
                    </AccordionTrigger>
                    <AccordionContent className="pt-2 pb-4 space-y-4 text-sm leading-relaxed">
                        <p>Agilize sua produtividade com a sinalização visual do sistema.</p>
                        <ul className="list-disc pl-5 space-y-2">
                            <li><strong>Abas Coloridas</strong>: Botões de filtro com cores representativas que casam com o status da proposta.</li>
                            <li><strong>Dashboard Inteligente</strong>: A ordem dos cards segue rigorosamente o fluxo: Digitado &rarr; Pendente &rarr; Em Andamento &rarr; Aguardando Saldo &rarr; Saldo Pago &rarr; Reprovado.</li>
                            <li><strong>Visão de Esteira</strong>: Os cards de Pendente, Em Andamento, Aguardando Saldo e Saldo Pago mostram sempre o acumulado do mês atual e do anterior.</li>
                        </ul>
                    </AccordionContent>
                </AccordionItem>

                <AccordionItem value="dre" className="border rounded-xl bg-card px-4 shadow-sm">
                    <AccordionTrigger className="hover:no-underline">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-red-100 text-red-600"><Wallet className="h-5 w-5" /></div>
                            <div className="text-left">
                                <p className="font-bold">4. Gestão Financeira & DRE</p>
                                <p className="text-xs text-muted-foreground">Saldo a receber, comissão esperada e livro de despesas</p>
                            </div>
                        </div>
                    </AccordionTrigger>
                    <AccordionContent className="pt-2 pb-4 space-y-4 text-sm leading-relaxed">
                        <p>Mantenha a saúde financeira da sua operação sob controle total.</p>
                        <ul className="list-disc pl-5 space-y-2">
                            <li><strong>Lançamento de Despesas</strong>: Registre custos operacionais e gerencie a situação (Pago/Pendente).</li>
                            <li><strong>Categorias de Elite</strong>: Crie categorias próprias em Configurações &gt; Opções.</li>
                            <li><strong>Conciliação com IA</strong>: Processe relatórios de pagamento colando apenas o texto do banco para baixar comissões automaticamente.</li>
                        </ul>
                    </AccordionContent>
                </AccordionItem>

                <AccordionItem value="preview" className="border rounded-xl bg-card px-4 shadow-sm">
                    <AccordionTrigger className="hover:no-underline">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-zinc-100 text-zinc-600"><Eye className="h-5 w-5" /></div>
                            <div className="text-left">
                                <p className="font-bold">5. Visualizador de Documentos & Central Fixa</p>
                                <p className="text-xs text-muted-foreground">Conferência instantânea e documentos permanentes</p>
                            </div>
                        </div>
                    </AccordionTrigger>
                    <AccordionContent className="pt-2 pb-4 space-y-4 text-sm leading-relaxed">
                        <p>Agilize sua conferência de propostas e mantenha a conformidade com a LGPD.</p>
                        <ul className="list-disc pl-5 space-y-2">
                            <li><strong>Visualização Segura</strong>: Veja imagens e PDFs sem precisar baixar arquivos usando o ícone do Olho (Eye).</li>
                            <li><strong>Documentos Permanentes</strong>: Salve o RG/CPF na ficha do cliente para acesso em todas as propostas futuras automaticamente.</li>
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
                        <a href="/settings?tab=appearance"><Type className="mr-2 h-3 w-3 text-blue-500" /> Estúdio de Fontes</a>
                    </Button>
                    <Button variant="outline" className="w-full justify-start text-xs h-8" asChild>
                        <a href="/settings?tab=appearance"><Pipette className="mr-2 h-3 w-3 text-pink-500" /> Cores de Status</a>
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