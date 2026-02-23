'use client';
import React from 'react';
import { useParams } from 'next/navigation';
import { AppLayout } from '@/components/app-layout';
import { PageHeader } from '@/components/page-header';
import { useDoc, useCollection, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { doc, collection, query, where, updateDoc } from 'firebase/firestore';
import type { Customer, Proposal } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
    User, 
    Phone, 
    Calendar, 
    FileText, 
    Hash, 
    Copy, 
    Printer, 
    FileBadge, 
    FolderLock, 
    Sparkles, 
    UserRound, 
    UserX, 
    UserCheck, 
    Zap, 
    Loader2, 
    MessageSquareText,
    TrendingUp,
    BadgePercent,
    ArrowRight,
    MapPin,
    Home,
    Map,
    Mail,
    CreditCard
} from 'lucide-react';
import { format, parse, differenceInMonths, isValid as isValidDate } from 'date-fns';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { formatCurrency, getAge, cn, getWhatsAppUrl, isWhatsApp, formatDateSafe } from '@/lib/utils';
import { SimpleProposalsTable } from '@/components/customers/simple-proposals-table';
import { CustomerAiSummary } from '@/components/customers/customer-ai-summary';
import { WhatsAppIcon } from '@/components/icons/whatsapp-icon';
import { toast } from '@/hooks/use-toast';
import { CustomerAttachmentUploader } from '@/components/customers/customer-attachment-uploader';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import { generateSalesPitch } from '@/ai/flows/generate-sales-pitch-flow';
import { StatsCard } from '@/components/dashboard/stats-card';
import { ProposalsStatusTable } from '@/components/dashboard/proposals-status-table';

const CopyButton = ({ text, label }: { text: string | undefined; label: string }) => {
    if (!text) return null;
    const handleCopy = (e: React.MouseEvent) => {
        e.preventDefault(); e.stopPropagation();
        navigator.clipboard.writeText(text);
        toast({ title: `${label} copiado!` });
    };
    return (
        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleCopy}>
            <Copy className="h-3.5 w-3.5" />
        </Button>
    );
}

const CustomerInfoCard = ({ customer, onExportDossier, onToggleStatus, onGeneratePitch }: any) => {
    const age = getAge(customer.birthDate);
    const isInactive = customer.status === 'inactive';
    return (
        <Card className={cn("transition-all overflow-hidden border-none shadow-none", isInactive ? "opacity-80 grayscale-[0.5]" : "bg-card")}>
            <CardHeader className="px-0 pb-8">
                <div className='flex items-center justify-between flex-wrap gap-4'>
                    <div className='flex items-center gap-4'>
                         <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center border-2 border-primary/20"><User className="h-7 w-7 text-primary" /></div>
                        <div className="space-y-1">
                            <div className="flex items-center gap-3">
                                <div className="flex items-center gap-2">
                                    <CardTitle className="text-2xl font-black uppercase tracking-tight">{customer.name}</CardTitle>
                                    <CopyButton text={customer.name} label="Nome" />
                                </div>
                                <Badge variant={isInactive ? "secondary" : "default"} className={isInactive ? "bg-zinc-200 text-zinc-700" : "bg-green-50 text-white"}>{isInactive ? "Inativo" : "Ativo"}</Badge>
                            </div>
                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">Registro Oficial do Cliente</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 print:hidden">
                        <Button variant="outline" size="sm" className="h-10 px-4 rounded-full font-bold bg-orange-500/10 border-orange-500/20 text-orange-600" onClick={onGeneratePitch}><Zap className="mr-2 h-4 w-4 fill-current" />Smart Pitch IA</Button>
                        <Button variant="outline" size="sm" className={cn("h-10 px-4 rounded-full font-bold", isInactive ? "text-green-600" : "text-destructive")} onClick={onToggleStatus}>{isInactive ? <><UserCheck className="mr-2 h-4 w-4" /> Reativar</> : <><UserX className="mr-2 h-4 w-4" /> Inativar</>}</Button>
                        <Button variant="outline" size="sm" className="h-10 px-4 rounded-full bg-primary/5 border-primary/20 text-primary font-bold" onClick={onExportDossier}><FileBadge className="mr-2 h-4 w-4" />Dossiê (PDF)</Button>
                        <Button variant="outline" size="sm" className="h-10 px-4 rounded-full font-bold" onClick={() => window.print()}><Printer className="mr-2 h-4 w-4" />Imprimir</Button>
                        <Link href="/customers"><Button variant="ghost" size="sm" className="h-10 px-4 rounded-full font-bold">Voltar</Button></Link>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-12 px-0">
                {/* SEÇÃO 1: CADASTRO */}
                <div className="space-y-6">
                    <h4 className="font-black text-[11px] uppercase tracking-[0.25em] text-primary/60 flex items-center gap-2">
                        <UserRound className="h-4 w-4" /> Informações Cadastrais
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-10">
                        <div className="flex flex-col gap-1.5"><span className="text-[9px] font-black uppercase text-muted-foreground tracking-widest">ID do Cliente</span><div className="flex items-center gap-2 font-black text-foreground"><Hash className="h-3.5 w-3.5 text-primary/40" /><span>{customer.numericId}</span></div></div>
                        <div className="flex flex-col gap-1.5"><span className="text-[9px] font-black uppercase text-muted-foreground tracking-widest">Documento (CPF)</span><div className="flex items-center gap-2 font-black text-foreground"><FileText className="h-3.5 w-3.5 text-primary/40" /><span>{customer.cpf}</span><CopyButton text={customer.cpf} label="CPF" /></div></div>
                        <div className="flex flex-col gap-1.5"><span className="text-[9px] font-black uppercase text-muted-foreground tracking-widest">Gênero</span><div className="flex items-center gap-2 font-bold text-foreground"><User className="h-3.5 w-3.5 text-primary/40" /><span>{customer.gender || '-'}</span></div></div>
                        <div className="flex flex-col gap-1.5"><span className="text-[9px] font-black uppercase text-muted-foreground tracking-widest">Data de Nascimento</span><div className="flex items-center gap-2 font-bold text-foreground"><Calendar className="h-3.5 w-3.5 text-primary/40" /><span>{customer.birthDate ? format(parse(customer.birthDate, 'yyyy-MM-dd', new Date()), 'dd/MM/yyyy') : '-'}</span><Badge variant="secondary" className="text-[9px] bg-primary/10 text-primary border-none font-black">{age} ANOS</Badge></div></div>
                        <div className="flex flex-col gap-1.5 lg:col-span-2"><span className="text-[9px] font-black uppercase text-muted-foreground tracking-widest">E-mail</span><div className="flex items-center gap-2 font-bold text-foreground"><Mail className="h-3.5 w-3.5 text-primary/40" /><span>{customer.email || '-'}</span><CopyButton text={customer.email} label="E-mail" /></div></div>
                        <div className="flex flex-col gap-1.5"><span className="text-[9px] font-black uppercase text-muted-foreground tracking-widest">Contato Principal</span><div className="flex items-center gap-2 font-black text-foreground"><Phone className="h-3.5 w-3.5 text-primary/40" /><span>{customer.phone}</span><div className="flex items-center gap-1"><CopyButton text={customer.phone} label="Telefone" />{isWhatsApp(customer.phone) && <a href={getWhatsAppUrl(customer.phone)} target="_blank" rel="noopener noreferrer" className="text-green-500 hover:scale-110 transition-transform"><WhatsAppIcon className="h-4 w-4" /></a>}</div></div></div>
                        <div className="flex flex-col gap-1.5"><span className="text-[9px] font-black uppercase text-muted-foreground tracking-widest">Telefone 2</span><div className="flex items-center gap-2 font-bold text-foreground"><Phone className="h-3.5 w-3.5 text-primary/40" /><span>{customer.phone2 || '-'}</span><div className="flex items-center gap-1"><CopyButton text={customer.phone2} label="Telefone 2" />{isWhatsApp(customer.phone2 || '') && <a href={getWhatsAppUrl(customer.phone2!)} target="_blank" rel="noopener noreferrer" className="text-green-500 hover:scale-110 transition-transform"><WhatsAppIcon className="h-4 w-4" /></a>}</div></div></div>
                    </div>
                </div>

                {/* SEÇÃO 1.1: BENEFÍCIOS */}
                <div className="space-y-6 pt-8 border-t border-border/40">
                    <h4 className="font-black text-[11px] uppercase tracking-[0.25em] text-primary/60 flex items-center gap-2">
                        <CreditCard className="h-4 w-4" /> Benefícios Previdenciários
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {customer.benefits && customer.benefits.length > 0 ? (
                            customer.benefits.map((benefit: any, idx: number) => (
                                <div key={idx} className="p-4 rounded-2xl bg-muted/20 border border-border/50 flex flex-col gap-1.5 transition-all hover:bg-muted/30">
                                    <span className="text-[8px] font-black text-primary/60 uppercase tracking-widest">Nº do Benefício</span>
                                    <div className="flex items-center gap-2">
                                        <span className="font-black text-sm text-foreground">{benefit.number}</span>
                                        <CopyButton text={benefit.number} label="Benefício" />
                                    </div>
                                    {benefit.species && <span className="text-[10px] text-muted-foreground font-bold uppercase">{benefit.species}</span>}
                                </div>
                            ))
                        ) : (
                            <div className="col-span-full p-8 text-center border-2 border-dashed rounded-2xl opacity-30 text-[10px] font-black uppercase tracking-[0.3em]">Nenhum benefício vinculado</div>
                        )}
                    </div>
                </div>

                {/* SEÇÃO 2: ENDEREÇO */}
                <div className="space-y-6 pt-8 border-t border-border/40">
                    <h4 className="font-black text-[11px] uppercase tracking-[0.25em] text-primary/60 flex items-center gap-2">
                        <MapPin className="h-4 w-4" /> Endereço Residencial
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-10">
                        <div className="flex flex-col gap-1.5 lg:col-span-2">
                            <span className="text-[9px] font-black uppercase text-muted-foreground tracking-widest">Logradouro</span>
                            <div className="flex items-center gap-2 font-bold text-foreground">
                                <Home className="h-3.5 w-3.5 text-primary/40" />
                                <span className="truncate">{customer.street || '-'} {customer.number && `, ${customer.number}`}</span>
                            </div>
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <span className="text-[9px] font-black uppercase text-muted-foreground tracking-widest">Complemento</span>
                            <div className="flex items-center gap-2 font-bold text-foreground truncate">
                                <span>{customer.complement || '-'}</span>
                            </div>
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <span className="text-[9px] font-black uppercase text-muted-foreground tracking-widest">Bairro</span>
                            <div className="flex items-center gap-2 font-bold text-foreground truncate">
                                <span>{customer.neighborhood || '-'}</span>
                            </div>
                        </div>
                        <div className="flex flex-col gap-1.5 lg:col-span-2">
                            <span className="text-[9px] font-black uppercase text-muted-foreground tracking-widest">Localização (Cidade/UF)</span>
                            <div className="flex items-center gap-2 font-black text-foreground">
                                <Map className="h-3.5 w-3.5 text-primary/40" />
                                <span className="truncate">{customer.city || '-'} / {customer.state || '-'}</span>
                            </div>
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <span className="text-[9px] font-black uppercase text-muted-foreground tracking-widest">CEP</span>
                            <div className="flex items-center gap-2 font-bold text-foreground">
                                <span>{customer.cep || '-'}</span>
                                <CopyButton text={customer.cep} label="CEP" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* SEÇÃO 3: OBSERVAÇÕES */}
                <div className="space-y-6 pt-8 border-t border-border/40">
                    <h4 className="font-black text-[11px] uppercase tracking-[0.25em] text-primary/60 flex items-center gap-2">
                        <MessageSquareText className="h-4 w-4" /> Observações Internas
                    </h4>
                    <div className="p-6 bg-muted/10 rounded-2xl border border-border/40 text-xs text-muted-foreground leading-relaxed italic relative overflow-hidden shadow-inner min-h-[80px] flex items-center">
                        <div className="absolute top-0 left-0 w-1.5 h-full bg-primary/20" />
                        {customer.observations ? `"${customer.observations}"` : "Nenhuma anotação estratégica registrada para este cliente."}
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}

export default function CustomerDetailPage({ params }: { params: { id: string } }) {
  const { id: customerId } = useParams() as { id: string };
  const firestore = useFirestore();
  const { user } = useUser();
  const [isPitchModalOpen, setIsPitchModalOpen] = React.useState(false);
  const [isGeneratingPitch, setIsGeneratingPitch] = React.useState(false);
  const [generatedPitch, setGeneratedPitch] = React.useState('');
  const [dialogData, setDialogData] = React.useState<{ title: string; proposals: Proposal[] } | null>(null);

  const customerDocRef = useMemoFirebase(() => customerId && firestore ? doc(firestore, 'customers', customerId) : null, [firestore, customerId]);
  const proposalsQuery = useMemoFirebase(() => user && firestore && customerId ? query(collection(firestore, 'loanProposals'), where('ownerId', '==', user.uid), where('customerId', '==', customerId)) : null, [firestore, user, customerId]);

  const { data: customer, isLoading: isCustomerLoading } = useDoc<Customer>(customerDocRef);
  const { data: proposals, isLoading: areProposalsLoading } = useCollection<Proposal>(proposalsQuery);

  const businessStats = React.useMemo(() => {
    if (!proposals) return { count: 0, volume: 0, commission: 0, proposalsByCommission: [] };
    
    const count = proposals.length;
    const volume = proposals.reduce((s, p) => s + (p.grossAmount || 0), 0);
    const validCommissionProposals = proposals.filter(p => (p.commissionStatus === 'Paga' || p.commissionStatus === 'Parcial') && p.status !== 'Reprovado');
    const commission = validCommissionProposals.reduce((s, p) => s + (p.amountPaid || 0), 0);

    return {
        count,
        volume,
        commission,
        proposalsByCommission: validCommissionProposals
    };
  }, [proposals]);

  const retentionOpportunity = React.useMemo(() => {
    if (!proposals) return null;
    const now = new Date();
    return proposals.find(p => {
        if ((p.status === 'Pago' || p.status === 'Saldo Pago') && p.datePaidToClient) {
            try {
                const paidDate = new Date(p.datePaidToClient);
                if (!isValidDate(paidDate)) return false;
                return differenceInMonths(now, paidDate) >= 12;
            } catch (e) { return false; }
        }
        return false;
    });
  }, [proposals]);

  const handleExportDossier = async () => {
    if (!customer || !proposals || !user) return;
    const { default: jsPDF } = await import('jspdf');
    const { default: autoTable } = await import('jspdf-autotable');
    const doc = new jsPDF();
    const primaryColor = [40, 74, 127];
    
    doc.setFontSize(22); doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]); doc.setFont("helvetica", "bold"); doc.text("DOSSIÊ OFICIAL DO CLIENTE", 14, 20);
    doc.setFontSize(10); doc.setTextColor(100); doc.setFont("helvetica", "normal");
    doc.text(`Responsável: ${user.displayName || user.email}`, 14, 28);
    doc.text(`Gerado em: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, 14, 33);
    doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]); doc.setLineWidth(0.5); doc.line(14, 38, 196, 38);
    
    autoTable(doc, { 
        startY: 45, 
        body: [
            ['Nome', customer.name], 
            ['CPF', customer.cpf], 
            ['Nascimento', formatDateSafe(customer.birthDate)], 
            ['Telefone', customer.phone], 
            ['Endereço', `${customer.street || ''}, ${customer.number || ''} ${customer.complement || ''}`],
            ['Bairro', customer.neighborhood || '-'],
            ['Cidade/UF', `${customer.city || '-'} / ${customer.state || '-'}`],
            ['CEP', customer.cep || '-']
        ], 
        theme: 'plain', 
        styles: { fontSize: 10 }, 
        columnStyles: { 0: { fontStyle: 'bold', width: 40 } } 
    });
    
    const getFinalY = () => {
        const last = (doc as any).lastAutoTable;
        return last ? last.finalY : 50;
    };
    
    if (customer.benefits && customer.benefits.length > 0) {
        doc.setFontSize(12); doc.setFont("helvetica", "bold"); doc.setTextColor(0); doc.text("BENEFÍCIOS ATIVOS", 14, getFinalY() + 15);
        autoTable(doc, { 
            startY: getFinalY() + 18, 
            head: [['Número', 'Espécie']], 
            body: customer.benefits.map(b => [b.number, b.species || '-']), 
            headStyles: { fillColor: primaryColor } 
        });
    }

    doc.setFontSize(12); doc.setFont("helvetica", "bold"); doc.setTextColor(0); doc.text("HISTÓRICO DE OPERAÇÕES", 14, getFinalY() + 15);
    autoTable(doc, { 
        startY: getFinalY() + 18, 
        head: [['Nº Proposta', 'Produto', 'Status', 'Valor Bruto']], 
        body: proposals.map(p => [p.proposalNumber, p.product, p.status, formatCurrency(p.grossAmount)]), 
        headStyles: { fillColor: [70, 70, 70] }, 
        styles: { fontSize: 9 } 
    });

    const pageHeight = doc.internal.pageSize.height;
    const decText = `Eu, ${customer.name}, portador do CPF ${customer.cpf}, declaro verdadeiras as informações acima e autorizo expressamente o processamento dos meus dados para fins de simulação e contratação bancária, conforme as diretrizes da LGPD (Lei Geral de Proteção de Dados).`;
    const wrappedDecText = doc.splitTextToSize(decText, 180);
    const textHeight = (wrappedDecText.length * 6);
    
    let currentY = getFinalY() + 20;
    
    if (currentY + textHeight + 50 > pageHeight) { 
        doc.addPage(); 
        currentY = 25;
    }

    doc.setFontSize(12); doc.setFont("helvetica", "bold"); doc.setTextColor(0); doc.text("DECLARAÇÃO E FORMALIZAÇÃO", 14, currentY); 
    doc.setFontSize(9); doc.setTextColor(80); doc.setFont("helvetica", "normal");
    doc.text(wrappedDecText, 14, currentY + 10);
    
    const signatureY = currentY + 10 + textHeight + 25;
    
    if (signatureY + 10 > pageHeight) {
        doc.addPage();
        const newSigY = 40;
        doc.setDrawColor(150); doc.line(14, newSigY, 90, newSigY); doc.line(110, newSigY, 186, newSigY);
        doc.setFontSize(8); doc.text("ASSINATURA DO CLIENTE", 52, newSigY + 5, { align: 'center' }); doc.text("AGENTE RESPONSÁVEL", 148, newSigY + 5, { align: 'center' });
    } else {
        doc.setDrawColor(150); doc.line(14, signatureY, 90, signatureY); doc.line(110, signatureY, 186, signatureY);
        doc.setFontSize(8); doc.text("ASSINATURA DO CLIENTE", 52, signatureY + 5, { align: 'center' }); doc.text("AGENTE RESPONSÁVEL", 148, signatureY + 5, { align: 'center' });
    }
    
    doc.save(`Dossie_${customer.name.replace(/\s+/g, '_')}.pdf`);
    toast({ title: "Dossiê Gerado!" });
  };

  const handleToggleStatus = async () => {
    if (!firestore || !customerId || !customer) return;
    const newStatus = customer.status === 'inactive' ? 'active' : 'inactive';
    updateDoc(doc(firestore, 'customers', customerId), { status: newStatus });
    toast({ title: `Cliente ${newStatus === 'active' ? 'Ativado' : 'Inativado'}` });
  };

  const handleGeneratePitch = async () => {
    setIsGeneratingPitch(true); setGeneratedPitch(''); setIsPitchModalOpen(true);
    try {
        const { pitch } = await generateSalesPitch({ 
            customerName: customer!.name, 
            lastProduct: proposals?.[0]?.product, 
            totalVolume: proposals?.reduce((s, p) => s + (p.grossAmount || 0), 0), 
            observations: customer!.observations 
        });
        setGeneratedPitch(pitch);
    } catch (e) { setIsPitchModalOpen(false); } finally { setIsGeneratingPitch(false); }
  };

  if (isCustomerLoading || areProposalsLoading) return <AppLayout><div className="space-y-4"><div className="h-48 w-full bg-muted animate-pulse rounded-lg" /><div className="h-96 w-full bg-muted animate-pulse rounded-lg" /></div></AppLayout>;
  if (!customer) return <AppLayout><PageHeader title="Não encontrado" /></AppLayout>;

  return (
    <AppLayout>
      <div className='space-y-8 pb-20'>
        {retentionOpportunity && customer.status !== 'inactive' && (
            <Alert className="bg-amber-50 border-amber-200 animate-in slide-in-from-top duration-500 rounded-2xl"><Sparkles className="h-5 w-5 text-amber-600" /><AlertTitle className="text-amber-800 font-bold uppercase">Oportunidade Identificada!</AlertTitle><AlertDescription className="text-amber-700 text-sm">Contratos pagos há mais de 12 meses. Momento ideal para Refinanciamento.</AlertDescription></Alert>
        )}
        
        <CustomerInfoCard customer={customer} onExportDossier={handleExportDossier} onToggleStatus={handleToggleStatus} onGeneratePitch={handleGeneratePitch} />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="cursor-pointer" onClick={() => setDialogData({ title: "Histórico Total de Contratos", proposals: proposals || [] })}>
                <StatsCard 
                    title="CONTRATOS TOTAIS" 
                    value={String(businessStats.count)} 
                    icon={FileText} 
                    description="PROPOSTAS NO HISTÓRICO"
                    className="bg-blue-50/10 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800"
                    overrideStatusColors={{ 'CONTRATOS TOTAIS': '217 91% 60%' }}
                />
            </div>
            <div className="cursor-pointer" onClick={() => setDialogData({ title: "Detalhamento de Volume Bruto", proposals: proposals || [] })}>
                <StatsCard 
                    title="VOLUME BRUTO" 
                    value={formatCurrency(businessStats.volume)} 
                    icon={TrendingUp} 
                    description="TOTAL EM OPERAÇÕES"
                    className="bg-emerald-50/10 dark:bg-emerald-900/10 border-emerald-200 dark:border-emerald-800"
                    overrideStatusColors={{ 'VOLUME BRUTO': '142 76% 36%' }}
                />
            </div>
            <div className="cursor-pointer" onClick={() => setDialogData({ title: "Comissões Recebidas (Líquidas)", proposals: businessStats.proposalsByCommission })}>
                <StatsCard 
                    title="COMISSÃO LÍQUIDA" 
                    value={formatCurrency(businessStats.commission)} 
                    icon={BadgePercent} 
                    description="VALOR TOTAL RECEBIDO"
                    isHot={businessStats.commission > 1000}
                    className="bg-amber-50/10 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800"
                    overrideStatusColors={{ 'COMISSÃO LÍQUIDA': '24 95% 53%' }}
                />
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
                <CustomerAiSummary customer={customer} proposals={proposals || []} />
                <Card className="border-border/50 shadow-lg rounded-2xl overflow-hidden"><CardHeader className="bg-muted/5"><CardTitle className="text-lg font-black uppercase text-primary/80">Histórico de Propostas</CardTitle></CardHeader><CardContent className="p-0"><SimpleProposalsTable proposals={proposals || []} /></CardContent></Card>
            </div>
            <div className="lg:col-span-1"><Card className="h-full border-border/50 shadow-lg rounded-2xl overflow-hidden sticky top-24"><CardHeader className="bg-muted/10"><CardTitle className="text-lg font-black uppercase flex items-center gap-3"><FolderLock className="h-5 w-5 text-primary opacity-60" />Arquivos</CardTitle></CardHeader><CardContent className="pt-6"><CustomerAttachmentUploader userId={user?.uid || ''} customerId={customer.id} initialAttachments={customer.documents || []} onAttachmentsChange={(docs) => updateDoc(doc(firestore!, 'customers', customer.id), { documents: docs })} /></CardContent></Card></div>
        </div>
      </div>

      <Dialog open={isPitchModalOpen} onOpenChange={setIsPitchModalOpen}><DialogContent className="max-w-md rounded-[2rem]"><DialogHeader><DialogTitle className="flex items-center gap-2 text-xl font-black uppercase"><MessageSquareText className="h-5 w-5 text-orange-500" />Smart Pitch IA</DialogTitle></DialogHeader><div className="py-4">{isGeneratingPitch ? <div className="flex flex-col items-center justify-center py-10 gap-4"><Loader2 className="h-8 w-8 animate-spin text-primary" /><p className="text-xs text-muted-foreground animate-pulse font-black uppercase">Criando script magnético...</p></div> : <div className="space-y-4"><textarea className="w-full min-h-[200px] p-4 rounded-2xl border-2 bg-muted/30 text-sm focus:ring-2 focus:ring-primary outline-none" value={generatedPitch} onChange={(e) => setGeneratedPitch(e.target.value)} /><p className="text-[10px] text-muted-foreground text-center font-bold uppercase">Edite o texto antes de enviar.</p></div>}</div><DialogFooter className="flex gap-2"><Button variant="ghost" className="rounded-full font-bold" onClick={() => setIsPitchModalOpen(false)}>Cancelar</Button><Button className="flex-1 rounded-full font-bold bg-[#25D366] text-white gap-2" onClick={() => { window.open(`${getWhatsAppUrl(customer.phone)}&text=${encodeURIComponent(generatedPitch)}`, '_blank'); setIsPitchModalOpen(false); }} disabled={isGeneratingPitch || !generatedPitch}><WhatsAppIcon className="h-4 w-4" />Enviar para WhatsApp</Button></DialogFooter></DialogContent></Dialog>

      <Dialog open={!!dialogData} onOpenChange={(isOpen) => !isOpen && setDialogData(null)}>
            <DialogContent className="max-w-4xl h-[90vh] flex flex-col">
                <DialogHeader><DialogTitle className="flex items-center gap-2 font-black uppercase"><ArrowRight className="h-5 w-5 text-primary" /> {dialogData?.title}</DialogTitle></DialogHeader>
                <div className="flex-1 overflow-y-auto">
                    <ProposalsStatusTable proposals={dialogData?.proposals || []} customers={[customer]} />
                </div>
            </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
