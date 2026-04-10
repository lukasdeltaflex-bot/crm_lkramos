
"use client"

import React from 'react';
import { AppLayout } from '@/components/app-layout';
import { PageHeader } from '@/components/page-header';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { 
    Palette, 
    ShieldCheck, 
    Bot,
    Camera,
    Sparkles,
    Building2,
    Search,
    Zap,
    Layout,
    UserCheck,
    CloudSun,
    MessageSquareText,
    Check,
    Landmark,
    FileCheck2,
    Database,
    Binary,
    Tags,
    Trophy,
    Share2,
    SmilePlus,
    Pencil,
    Star,
    Cake,
    ListTodo,
    AlertTriangle,
    LinkIcon,
    ArrowRight,
    HardDrive,
    SearchX,
    Lock,
    NotebookTabs,
    UploadCloud,
    Wallet,
    Clock,
    Trash2,
    TrendingUp,
    Receipt,
    ListChecks,
    History,
    Timer,
    Send,
    FileCheck,
    PenTool,
    FilterX,
    CalendarClock,
    Bell,
    Copy,
    DollarSign,
    CreditCard,
    GripVertical,
    CopyPlus,
    Snowflake,
    FileBadge,
    Printer,
    CheckCircle2,
    MousePointer2,
    KeyRound,
    UserRoundCheck,
    RefreshCcw,
    ShieldAlert,
    RotateCcw,
    WifiOff,
    EyeOff,
    Calculator,
    Settings2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function ManualPage() {
  return (
    <AppLayout>
      <PageHeader title="Guia de Operação LK RAMOS" />
      
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 pb-20">
        <div className="lg:col-span-3 space-y-6">
            <Accordion type="single" collapsible className="w-full space-y-4">
                
                {/* 1. INTELIGÊNCIA ARTIFICIAL E VENDAS */}
                <AccordionItem value="ai-features" className="border-2 rounded-2xl bg-card px-4 shadow-sm border-orange-500/10">
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
                            <div className="p-4 rounded-xl bg-orange-50/5 border border-orange-500/20">
                                <div className="flex items-center gap-2 mb-2">
                                    <Sparkles className="h-4 w-4 text-orange-600" />
                                    <h4 className="font-bold">Análise Estratégica IA</h4>
                                </div>
                                <p className="text-xs text-muted-foreground">Dentro da ficha do cliente, o botão "Gerar Consultoria" entrega uma análise profunda. A IA cruza datas de contratos para sugerir o momento exato de um refinanciamento.</p>
                            </div>
                            <div className="p-4 rounded-xl bg-blue-500/5 border border-blue-500/20">
                                <div className="flex items-center gap-2 mb-2">
                                    <Camera className="h-4 w-4 text-blue-600" />
                                    <h4 className="font-bold">OCR e Separação de Contatos</h4>
                                </div>
                                <p className="text-xs text-muted-foreground">O cadastro via IA agora identifica e **separa automaticamente múltiplos telefones** encontrados no documento, preenchendo os campos "Principal" e "Telefone 2" de forma organizada.</p>
                            </div>
                        </div>
                    </AccordionContent>
                </AccordionItem>

                {/* 2. MECANISMO DE RETORNOS (CRM) */}
                <AccordionItem value="crm-ai" className="border-2 rounded-2xl bg-card px-4 shadow-sm border-purple-500/20">
                    <AccordionTrigger className="hover:no-underline">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-xl bg-purple-100 text-purple-600"><CalendarClock className="h-5 w-5" /></div>
                            <div className="text-left">
                                <p className="font-bold text-sm">2. Mecanismo de Retornos (CRM)</p>
                                <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">Agenda e Resumos de Conversa</p>
                            </div>
                        </div>
                    </AccordionTrigger>
                    <AccordionContent className="pt-2 pb-6 space-y-4 text-sm leading-relaxed">
                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="p-4 rounded-xl bg-purple-50/5 border border-purple-500/20">
                                <h4 className="font-bold text-purple-700 flex items-center gap-2 mb-2">
                                    <Sparkles className="h-4 w-4" /> Resumo de Fechamento
                                </h4>
                                <p className="text-xs text-muted-foreground">
                                    Ao concluir um retorno, utilize o botão **"Resumir com IA"** para organizar suas anotações da conversa em um histórico profissional.
                                </p>
                            </div>
                            <div className="p-4 rounded-xl bg-muted/20 border">
                                <h4 className="font-bold text-foreground flex items-center gap-2 mb-2">
                                    <Clock className="h-4 w-4 text-primary" /> Calendário de Pauta
                                </h4>
                                <p className="text-xs text-muted-foreground">
                                    O horário agendado aparece diretamente na visão mensal (ex: 14:00 - João), facilitando a gestão do seu dia sem cliques extras.
                                </p>
                            </div>
                        </div>
                        <div className="p-4 rounded-xl bg-blue-50/5 border border-blue-500/20 mt-4">
                            <h4 className="font-bold text-blue-700 flex items-center gap-2 mb-2">
                                <RefreshCcw className="h-4 w-4" /> Gestão e Recuperação de Retornos
                            </h4>
                            <p className="text-xs text-muted-foreground mb-2">
                                <strong>Reabertura:</strong> Acesse a aba "Histórico" e clique em "Reabrir" em qualquer retorno concluído para trazê-lo de volta aos pendentes e ao calendário.
                            </p>
                            <p className="text-xs text-muted-foreground">
                                <strong>Segurança e Controle Visual:</strong> Acompanhe o status rapidamente pelas novas etiquetas (Amarelo para Pendentes e Verde para Concluídos). Adicionalmente, ações críticas como Excluir, Concluir e Reagendar agora solicitam confirmação prévia para evitar cliques acidentais.
                            </p>
                        </div>
                        <div className="p-4 rounded-xl bg-green-50/5 border border-green-500/20 mt-4">
                            <h4 className="font-bold text-green-700 flex items-center gap-2 mb-2">
                                <MessageSquareText className="h-4 w-4" /> Ações Rápidas nos Cards
                            </h4>
                            <p className="text-xs text-muted-foreground mb-2">
                                Os cards externos de retornos (pendentes e histórico) agora exibem o <strong>telefone do cliente</strong> diretamente na listagem, economizando tempo e cliques. Ao lado do telefone, você encontra dois atalhos úteis:
                            </p>
                            <ul className="mt-2 space-y-2 list-disc pl-5 text-xs font-medium text-muted-foreground">
                                <li><strong>Botão Oficial do WhatsApp:</strong> Ao clicar no ícone do WhatsApp, o sistema formata o número automaticamente e abre a conversa pronta com o cliente no seu aplicativo ou WhatsApp Web.</li>
                                <li><strong>Botão de Copiar:</strong> Um ícone dedicado ao lado do WhatsApp permite copiar instantaneamente o número para a área de transferência.</li>
                            </ul>
                        </div>
                    </AccordionContent>
                </AccordionItem>

                {/* 3. OPERAÇÃO DE ESTEIRA & CAPAS */}
                <AccordionItem value="ops-pipeline" className="border-2 rounded-2xl bg-card px-4 shadow-sm border-blue-500/20">
                    <AccordionTrigger className="hover:no-underline">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-xl bg-blue-100 text-blue-600"><FileBadge className="h-5 w-5" /></div>
                            <div className="text-left">
                                <p className="font-bold text-sm">3. Esteira & Documentação Técnica</p>
                                <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">Capa de Lote e Checklist Visual</p>
                            </div>
                        </div>
                    </AccordionTrigger>
                    <AccordionContent className="pt-2 pb-6 space-y-4 text-sm leading-relaxed">
                        <div className="p-4 rounded-xl bg-blue-50/5 border border-blue-500/20 mb-4">
                            <h4 className="font-bold text-blue-700 flex items-center gap-2 mb-2">
                                <Printer className="h-4 w-4" /> Capas de Proposta em PDF
                            </h4>
                            <p className="text-xs text-muted-foreground">
                                Na aba Propostas, selecione um ou mais registros para gerar a **Capa de Lote**. O sistema cria um PDF profissional com os dados do cliente, detalhes financeiros e campos para assinatura, pronto para impressão.
                            </p>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="flex items-center gap-3 p-3 bg-muted/20 rounded-xl border">
                                <Send className="h-4 w-4 text-blue-500" />
                                <div className="text-[11px] font-bold uppercase">Formalização</div>
                            </div>
                            <div className="flex items-center gap-3 p-3 bg-muted/20 rounded-xl border">
                                <FileCheck className="h-4 w-4 text-orange-500" />
                                <div className="text-[11px] font-bold uppercase">Documentação</div>
                            </div>
                        </div>
                    </AccordionContent>
                </AccordionItem>

                {/* 4. PRECISÃO E REGRAS DE NEGÓCIO */}
                <AccordionItem value="precision-rules" className="border-2 rounded-2xl bg-card px-4 shadow-sm border-emerald-500/20">
                    <AccordionTrigger className="hover:no-underline">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-xl bg-emerald-100 text-emerald-600"><CheckCircle2 className="h-5 w-5" /></div>
                            <div className="text-left">
                                <p className="font-bold text-sm">4. Precisão e Validação de Dados</p>
                                <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">Regras de Bloqueio e Cálculo</p>
                            </div>
                        </div>
                    </AccordionTrigger>
                    <AccordionContent className="pt-2 pb-6 space-y-4 text-sm leading-relaxed">
                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="p-4 rounded-xl bg-emerald-50/5 border border-emerald-200">
                                <h4 className="font-bold text-emerald-700 flex items-center gap-2 mb-2">
                                    <UserRoundCheck className="h-4 w-4" /> Validação Silenciosa V3
                                </h4>
                                <p className="text-xs text-muted-foreground">
                                    O cadastro de clientes realiza uma **consulta em tempo real** para CPF e Telefone. O sistema bloqueia duplicidades instantaneamente. Ao converter um Lead em Cliente, um **novo modal de confirmação** permite revisar e salvar os dados sem sair da tela atual.
                                </p>
                            </div>
                            <div className="p-4 rounded-xl bg-blue-50/5 border border-blue-200">
                                <h4 className="font-bold text-blue-700 flex items-center gap-2 mb-2">
                                    <Wallet className="h-4 w-4" /> Cards Financeiros Mestres
                                </h4>
                                <p className="text-xs text-muted-foreground">
                                    No Financeiro, os cards superiores são independentes de filtros. Eles refletem a realidade total do faturamento do mês atual, servindo como uma bússola absoluta para o seu negócio.
                                </p>
                            </div>
                        </div>
                    </AccordionContent>
                </AccordionItem>

                {/* 5. GESTÃO DE DADOS E LIXEIRA */}
                <AccordionItem value="data-trash" className="border-2 rounded-2xl bg-card px-4 shadow-sm border-primary/20">
                    <AccordionTrigger className="hover:no-underline">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-xl bg-primary/10 text-primary"><Trash2 className="h-5 w-5" /></div>
                            <div className="text-left">
                                <p className="font-bold text-sm">5. Gestão de Dados & Lixeira</p>
                                <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">Segurança contra Exclusões Acidentais</p>
                            </div>
                        </div>
                    </AccordionTrigger>
                    <AccordionContent className="pt-2 pb-6 space-y-4 text-sm leading-relaxed">
                        <div className="p-4 rounded-xl bg-muted/20 border-2 border-dashed">
                            <h4 className="font-bold text-primary flex items-center gap-2 mb-2">
                                <RotateCcw className="h-4 w-4" /> Sistema de Soft Delete
                            </h4>
                            <p className="text-xs text-muted-foreground">
                                Ao clicar em excluir, o registro não é apagado do banco imediatamente. Ele é movido para a **Lixeira**, onde pode ser:
                            </p>
                            <ul className="mt-3 space-y-2 list-disc pl-5 text-xs font-medium">
                                <li><strong className="text-green-600">Restaurado:</strong> Volta instantaneamente para sua tela de origem com todo o histórico e anexos intactos.</li>
                                <li><strong className="text-orange-600">Contagem Regressiva:</strong> Um contador visual exibe quantos dias restam para a exclusão automática definitiva.</li>
                                <li><strong className="text-red-600">Excluído Permanente:</strong> Removido definitivamente do servidor após confirmação de segurança ou término do prazo.</li>
                            </ul>
                        </div>
                    </AccordionContent>
                </AccordionItem>

                {/* 6. OPERAÇÃO OFFLINE (NOVO) */}
                <AccordionItem value="offline-mode" className="border-2 rounded-2xl bg-card px-4 shadow-sm border-zinc-500/20">
                    <AccordionTrigger className="hover:no-underline">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-xl bg-zinc-100 text-zinc-600"><WifiOff className="h-5 w-5" /></div>
                            <div className="text-left">
                                <p className="font-bold text-sm">6. Operação Offline (PWA)</p>
                                <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">Trabalhe mesmo sem internet</p>
                            </div>
                        </div>
                    </AccordionTrigger>
                    <AccordionContent className="pt-2 pb-6 space-y-4 text-sm leading-relaxed">
                        <div className="p-4 rounded-xl bg-muted/20 border">
                            <h4 className="font-bold text-foreground flex items-center gap-2 mb-2">
                                <ShieldCheck className="h-4 w-4 text-green-600" /> Sincronização Automática
                            </h4>
                            <p className="text-xs text-muted-foreground">
                                O sistema possui o **Modo Avião Inteligente**. Se sua conexão cair enquanto você estiver operando:
                            </p>
                            <ul className="mt-3 space-y-2 list-disc pl-5 text-xs font-medium">
                                <li>Você pode continuar visualizando clientes e propostas já carregados.</li>
                                <li>Alterações feitas offline são salvas localmente no seu dispositivo.</li>
                                <li>O sistema agora possui **versionamento automatizado**, garantindo que você receba um aviso imediato sempre que uma nova atualização estiver disponível no servidor.</li>
                                <li>Assim que o sinal de internet voltar, o sistema sincroniza tudo com o servidor automaticamente.</li>
                            </ul>
                        </div>
                    </AccordionContent>
                </AccordionItem>

                {/* 7. SEGURANÇA E ACESSO */}
                <AccordionItem value="security-access" className="border-2 rounded-2xl bg-card px-4 shadow-sm border-red-500/20">
                    <AccordionTrigger className="hover:no-underline">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-xl bg-red-100 text-red-600"><ShieldCheck className="h-5 w-5" /></div>
                            <div className="text-left">
                                <p className="font-bold text-sm">7. Segurança e Proteção de Dados</p>
                                <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">Blindagem AES-256 e Anti-SPAM</p>
                            </div>
                        </div>
                    </AccordionTrigger>
                    <AccordionContent className="pt-2 pb-6 space-y-4 text-sm leading-relaxed">
                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="p-4 rounded-xl bg-red-50/5 border border-red-200">
                                <h4 className="font-bold text-red-700 flex items-center gap-2 mb-2">
                                    <ShieldAlert className="h-4 w-4" /> Proteção Honeypot
                                </h4>
                                <p className="text-xs text-muted-foreground">
                                    O portal de captura de leads possui um campo invisível "armadilha" que identifica e bloqueia submissões automáticas de robôs de spam, garantindo que você receba apenas clientes reais.
                                </p>
                            </div>
                            <div className="p-4 rounded-xl bg-zinc-50/5 border border-zinc-300">
                                <h4 className="font-bold text-zinc-700 flex items-center gap-2 mb-2">
                                    <Lock className="h-4 w-4" /> Storage Protegido
                                    <Badge variant="outline" className="text-[8px] border-zinc-400">Requester Pays</Badge>
                                </h4>
                                <p className="text-xs text-muted-foreground">
                                    Seus arquivos e anexos são servidos via URL protegida. O sistema injeta automaticamente o token do projeto para evitar erros de acesso e garantir downloads seguros em qualquer navegador.
                                </p>
                            </div>
                        </div>
                    </AccordionContent>
                </AccordionItem>

                {/* 8. PERFORMANCE E METAS */}
                <AccordionItem value="perf-goals" className="border-2 rounded-2xl bg-card px-4 shadow-sm border-teal-500/20">
                    <AccordionTrigger className="hover:no-underline">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-xl bg-teal-100 text-teal-600"><TrendingUp className="h-5 w-5" /></div>
                            <div className="text-left">
                                <p className="font-bold text-sm">8. Novidades: Performance e Metas</p>
                                <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">Painel de Metas e Velocidade</p>
                            </div>
                        </div>
                    </AccordionTrigger>
                    <AccordionContent className="pt-2 pb-6 space-y-4 text-sm leading-relaxed">
                        <div className="p-4 rounded-xl bg-teal-50/5 border border-teal-500/20 mb-4">
                            <h4 className="font-bold text-teal-700 flex items-center gap-2 mb-2">
                                <Trophy className="h-4 w-4" /> Gestão de Metas Separadas
                            </h4>
                            <p className="text-xs text-muted-foreground mt-2">
                                <strong>Meta Diária (Comissão):</strong> O progresso do dia agora mede apenas o valor de repasse (sua comissão real) das vendas digitadas no dia. O restante reflete exatamente o quanto falta para bater a meta de lucro diária.
                            </p>
                            <p className="text-xs text-muted-foreground mt-2">
                                <strong>Calendário Visual:</strong> Um novo mini-calendário do mês foi adicionado logo abaixo da meta diária. Ele mostra as comissões e valores do dia (basta passar o mouse) e sinaliza automaticamente os dias em que você bateu a sua meta.
                            </p>
                            <p className="text-xs text-muted-foreground mt-2">
                                <strong>Sininho Inteligente:</strong> As notificações do sininho no topo passaram a ter 100% de precisão e paridade com as notificações da aba "Inteligência Diária" no seu dashboard, nunca perdendo aniversariantes.
                            </p>
                            <p className="text-xs text-muted-foreground mt-2">
                                <strong>Meta Mensal (Contrato):</strong> Continua operando tradicionalmente via "Valor Bruto" dos contratos pagos, ditando o ritmo macro do mês.
                            </p>
                            <p className="text-xs text-muted-foreground mt-2">
                                <strong>Modo Privacidade:</strong> Utilize o novo botão de "Olhinho" <EyeOff className="inline h-3 w-3 relative top-0.5" /> no topo do painel de metas para ocultar instantaneamente todos os valores financeiros da tela, incluindo os valores do mini-calendário, garantindo privacidade em público.
                            </p>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="flex items-center gap-3 p-3 bg-muted/20 rounded-xl border">
                                <Zap className="h-4 w-4 text-amber-500" />
                                <div>
                                    <div className="text-[11px] font-bold uppercase">Turbo na Criação de Propostas</div>
                                    <div className="text-[9px] text-muted-foreground mt-1">O seletor de Bancos agora memoriza as imagens usando IA, o que elimina totalmente qualquer lentidão durante a digitação de propostas longas.</div>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 p-3 bg-muted/20 rounded-xl border">
                                <Search className="h-4 w-4 text-indigo-500" />
                                <div>
                                    <div className="text-[11px] font-bold uppercase">Buscas Fluidas</div>
                                    <div className="text-[9px] text-muted-foreground mt-1">As barras de busca rápida e de filtros agora respondem sem travar a tela.</div>
                                </div>
                            </div>
                        </div>
                    </AccordionContent>
                </AccordionItem>

                {/* 9. GESTÃO DE PARCEIROS E CREDENCIAIS (NOVO) */}
                <AccordionItem value="partner-mgmt" className="border-2 rounded-2xl bg-card px-4 shadow-sm border-blue-600/20">
                    <AccordionTrigger className="hover:no-underline">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-xl bg-blue-50 text-blue-600"><Building2 className="h-5 w-5" /></div>
                            <div className="text-left">
                                <p className="font-bold text-sm">9. Gestão de Parceiros & Credenciais</p>
                                <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">Acesso Rápido e Segurança Blindada</p>
                            </div>
                        </div>
                    </AccordionTrigger>
                    <AccordionContent className="pt-2 pb-6 space-y-4 text-sm leading-relaxed">
                        <div className="p-4 rounded-xl bg-blue-50/5 border border-blue-600/20 mb-4">
                            <h4 className="font-bold text-blue-700 flex items-center gap-2 mb-2">
                                <ShieldCheck className="h-4 w-4" /> Credenciais do Portal da Promotora
                            </h4>
                            <p className="text-xs text-muted-foreground">
                                Agora você pode salvar as credenciais de acesso ao portal de cada promotora diretamente no cadastro dela.
                            </p>
                            <ul className="mt-3 space-y-2 list-disc pl-5 text-xs font-medium">
                                <li><strong>Usuário, Senha e Contrasenha:</strong> Armazenamento seguro de todas as chaves de acesso necessárias.</li>
                                <li><strong>Criptografia AES-256:</strong> As senhas são blindadas e só podem ser visualizadas por quem tem permissão, através do ícone de "olhinho".</li>
                                <li><strong>Botões de Cópia:</strong> Ícones dedicados para copiar usuário e senhas instantaneamente, agilizando o login em sites externos.</li>
                                <li><strong>Abrir Sistema:</strong> Botão direto que abre o portal da promotora em uma nova aba, usando o link cadastrado.</li>
                            </ul>
                        </div>
                    </AccordionContent>
                </AccordionItem>

                {/* 10. SIMULADOR DE PORTABILIDADE (NOVO) */}
                <AccordionItem value="portability-simulator" className="border-2 rounded-2xl bg-card px-4 shadow-sm border-emerald-500/20">
                    <AccordionTrigger className="hover:no-underline">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600"><Calculator className="h-5 w-5" /></div>
                            <div className="text-left">
                                <p className="font-bold text-sm">10. Simulador de Portabilidade</p>
                                <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">Motor Autônomo e Editável</p>
                            </div>
                        </div>
                    </AccordionTrigger>
                    <AccordionContent className="pt-2 pb-6 space-y-4 text-sm leading-relaxed">
                        <div className="p-4 rounded-xl bg-emerald-50/5 border border-emerald-600/20 mb-4">
                            <h4 className="font-bold text-emerald-700 flex items-center gap-2 mb-2">
                                <Settings2 className="h-4 w-4" /> Cadastro Manual de Regras
                            </h4>
                            <p className="text-xs text-muted-foreground mb-3">
                                O Simulador de Portabilidade foi estruturado sob uma <strong>regra absoluta</strong>: A Inteligência Artificial nunca inventa ou assume regras. Todas as decisões vêm estritamente do banco de dados que você alimenta.
                            </p>
                            <ul className="mt-3 space-y-2 list-disc pl-5 text-xs font-medium">
                                <li><strong>Como cadastrar:</strong> Acesse "Simul. Portabilidade" no menu lateral. Clique em "Nova Regra" e preencha as abas (Identificação, Ações, Origem, Valores e Taxas).</li>
                                <li><strong>Bancos Específicos:</strong> Na aba "Bancos Específicos", adicione regras exclusivas para cada banco que será portado (ex: Daycoval não é permitido).</li>
                                <li><strong>Atualização Mensal:</strong> As regras possuem versionamento automático. Basta clicar em "Editar" para atualizar a política do mês, e o simulador passará a respeitá-la imediatamente.</li>
                            </ul>
                        </div>
                        <div className="p-4 rounded-xl bg-blue-50/5 border border-blue-600/20 mb-4">
                            <h4 className="font-bold text-blue-700 flex items-center gap-2 mb-2">
                                <Zap className="h-4 w-4" /> Fase 2: Motor de Simulação
                            </h4>
                            <p className="text-xs text-muted-foreground mb-3">
                                O Simulador agora é autônomo. Ele lê HISCON / Extratos em PDF e cruza com suas regras estritas em um passe de mágica.
                            </p>
                            <ul className="mt-3 space-y-2 list-disc pl-5 text-xs font-medium">
                                <li><strong>Upload:</strong> Acesse "Simul. Portabilidade", mude para a aba "Motor de Simulação" e suba o PDF do cliente.</li>
                                <li><strong>Leitura Burra (Ocular):</strong> A IA fará uma leitura crua. Ela extrairá apenas os Contratos, Bancos, Parcelas e Margem. Ela não infere negócio, apenas copia os números que enxerga.</li>
                                <li><strong>Revisão de Dados (OBRIGATÓRIO):</strong> Antes de rodar, o sistema colocará os dados extraídos numa grade. Você preenche o que faltou, corrige algum banco digitado errado e clica em Simular.</li>
                                <li><strong>Cartões de Veredito:</strong> O Motor processa e joga os blocos de Cada Regra sob Cada Contrato. Você verá instantaneamente o "Cabe", "Não Cabe" ou "Atenção (Requer análise manual)".</li>
                                <li><strong>Auditoria Automática:</strong> Tudo o que você simulou foi salvo numa aba de auditorias para segurança da operação, gravando os dados extraídos contra as regras daquele exato momento.</li>
                            </ul>
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
                        <p className="text-[10px] font-black text-muted-foreground uppercase">Busca Global (Reativa)</p>
                        <p className="text-xs font-bold">CTRL + K</p>
                    </div>
                    <div className="space-y-1">
                        <p className="text-[10px] font-black text-muted-foreground uppercase">Recolher Menu</p>
                        <p className="text-xs font-bold">CTRL + B</p>
                    </div>
                </CardContent>
            </Card>

            <Card className="border-2 border-dashed border-orange-500/20 bg-orange-500/5">
                <HardDrive className="absolute top-2 right-2 h-4 w-4 text-orange-600/30" />
                <CardHeader className="pb-2">
                    <CardTitle className="text-xs font-black uppercase tracking-widest text-orange-600">PWA Instalado</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center gap-2 text-orange-600">
                        <div className="h-2 w-2 rounded-full bg-current animate-pulse" />
                        <span className="text-[10px] font-black uppercase">App Nativo</span>
                    </div>
                    <p className="text-[9px] text-muted-foreground mt-2 leading-tight font-medium">
                        O App instalado recebe atualizações silenciosas. Sempre que um aviso de "Nova Versão" aparecer, clique para atualizar instantaneamente.
                    </p>
                </CardContent>
            </Card>
        </div>
      </div>
    </AppLayout>
  );
}
