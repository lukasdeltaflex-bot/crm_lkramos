
'use client';
import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { AppLayout } from '@/components/app-layout';
import { PageHeader } from '@/components/page-header';
import { useDoc, useCollection, useFirestore, useMemoFirebase, useUser, errorEmitter, FirestorePermissionError } from '@/firebase';
import { doc, collection, query, where, updateDoc, setDoc } from 'firebase/firestore';
import type { Customer, Proposal, UserSettings } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
    User, 
    Phone, 
    Calendar, 
    FileText, 
    Hash, 
    Copy, 
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
    CreditCard,
    CircleDollarSign,
    Tag,
    Pencil,
    Star,
    CreditCard as CardIcon,
    SeparatorVertical,
    IdCard
} from 'lucide-react';
import { format, parse, differenceInMonths, isValid as isValidDate } from 'date-fns';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { formatCurrency, getAge, cn, getWhatsAppUrl, isWhatsApp, formatDateSafe, cleanBankName, cleanFirestoreData, getSmartTags, normalizeStatuses, getStatusBehavior } from '@/lib/utils';
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
    DialogDescription,
} from '@/components/ui/dialog';
import { generateSalesPitch } from '@/ai/flows/generate-sales-pitch-flow';
import { StatsCard } from '@/components/dashboard/stats-card';
import { ProposalsStatusTable } from '@/components/dashboard/proposals-status-table';
import { BankIcon } from '@/components/bank-icon';
import { CustomerForm } from '../customer-form';
import { Separator } from '@/components/ui/separator';

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

const CustomerInfoCard = ({ customer, proposals, onExportDossier, onToggleStatus, onGeneratePitch, onEdit, userSettings, totalCommission }: any) => {
    const [hasMounted, setHasMounted] = useState(false);
    useEffect(() => setHasMounted(true), []);

    const age = hasMounted ? getAge(customer.birthDate) : null;
    const isInactive = customer.status === 'inactive';
    const showLogos = userSettings?.showBankLogos ?? true;

    const getFidelityScore = (comm: number) => {
        if (comm <= 0) return 0;
        if (comm <= 500) return 1;
        if (comm <= 1500) return 2;
        if (comm <= 5000) return 3;
        if (comm <= 10000) return 4;
        return 5;
    };

    const score = getFidelityScore(totalCommission || 0);
    const smartTags = getSmartTags(customer, proposals);

    return (
        <Card className={cn("transition-all overflow-hidden border-none shadow-none", isInactive ? "opacity-80 grayscale-[0.5]" : "bg-card")}>
            <CardHeader className="px-0 pb-8">
                <div className='flex items-center justify-between flex-wrap gap-4'>
                    <div className='flex items-center gap-4'>
                         <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center border-2 border-primary/20"><User className="h-7 w-7 text-primary" /></div>
                        <div className="space-y-1">
                            <div className="flex items-center gap-3 flex-wrap">
                                <div className="flex items-center gap-2">
                                    <CardTitle className="text-2xl font-black uppercase tracking-tight">{customer.name || 'Cliente Sem Nome'}</CardTitle>
                                    <CopyButton text={customer.name} label="Nome" />
                                </div>
                                <div className="flex items-center gap-2">
                                    <Badge 
                                        className={cn(
                                            "rounded-full px-3 py-0.5 font-black uppercase text-[10px] tracking-widest border-2 transition-all",
                                            isInactive 
                                                ? "bg-zinc-500 text-white border-zinc-600 shadow-sm" 
                                                : "bg-emerald-500 text-white border-emerald-600 shadow-sm hover:bg-emerald-600"
                                        )}
                                    >
                                        {isInactive ? "Inativo" : "Ativo"}
                                    </Badge>

                                    {hasMounted && smartTags.map(tag => (
                                        <Badge 
                                            key={tag.label} 
                                            className={cn(
                                                "rounded-full px-2.5 py-0.5 font-black uppercase text-[9px] tracking-widest border-none text-white shadow-sm animate-in zoom-in-95 transition-all", 
                                                tag.color,
                                                tag.label === 'ALERTA 75 ANOS' && "animate-pulse ring-2 ring-white/30"
                                            )}
                                        >
                                            {tag.label}
                                        </Badge>
                                    ))}
                                </div>
                            </div>
                            <div className="flex flex-col gap-2">
                                <div className="flex items-center flex-wrap gap-2">
                                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">Registro Oficial</p>
                                    
                                    {customer.tags && customer.tags.length > 0 && (
                                        <div className="flex items-center gap-1.5 border-l pl-2 border-border/50">
                                            {customer.tags.map((tag: string) => (
                                                <Badge key={tag} variant="outline" className="h-4 text-[7px] font-black px-1.5 py-0 bg-primary/5 text-primary border-primary/20">{tag}</Badge>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                
                                <div className="flex items-center gap-1">
                                    {hasMounted && Array.from({ length: 5 }).map((_, i) => (
                                        <Star 
                                            key={i} 
                                            className={cn(
                                                "h-3.5 w-3.5", 
                                                i < score ? "text-amber-500 fill-amber-500" : "text-zinc-200 dark:text-zinc-800"
                                            )} 
                                        />
                                    ))}
                                    <span className="text-[9px] font-black text-amber-600 uppercase ml-1 tracking-tighter">
                                        {score === 5 ? "Diamante VIP" : score >= 3 ? "Cliente Fiel" : score > 0 ? "Fidelidade" : "Novo Cliente"}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 print:hidden">
                        <Button variant="outline" size="sm" className="h-9 px-3.5 rounded-full text-[11px] font-bold bg-orange-500/10 border-orange-500/20 text-orange-600" onClick={onGeneratePitch}><Zap className="mr-1.5 h-3.5 w-3.5 fill-current" />Smart Pitch IA</Button>
                        <Button variant="outline" size="sm" className="h-9 px-3.5 rounded-full text-[11px] font-bold border-primary/20 bg-primary/5 text-primary" onClick={onEdit}><Pencil className="mr-1.5 h-3.5 w-3.5" /> Editar Cadastro</Button>
                        <Button variant="outline" size="sm" className={cn("h-9 px-3.5 rounded-full text-[11px] font-bold", isInactive ? "text-green-600 border-green-200 bg-green-50/50" : "text-destructive border-red-200 bg-red-50/50")} onClick={onToggleStatus}>{isInactive ? <><UserCheck className="mr-1.5 h-3.5 w-3.5" /> Reativar</> : <><UserX className="mr-1.5 h-3.5 w-3.5" /> Inativar</>}</Button>
                        <Button variant="outline" size="sm" className="h-9 px-3.5 rounded-full text-[11px] bg-primary/5 border-primary/20 text-primary font-bold" onClick={onExportDossier}><FileBadge className="mr-1.5 h-3.5 w-3.5" />Dossiê (PDF)</Button>
                        <Link href="/customers"><Button variant="secondary" size="sm" className="h-9 px-5 rounded-full text-[10px] font-black uppercase tracking-widest bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-400 border-none shadow-sm">Voltar</Button></Link>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-12 px-0">
                <div className="space-y-6">
                    <h4 className="font-black text-[11px] uppercase tracking-[0.25em] text-primary/60 flex items-center gap-2">
                        <UserRound className="h-4 w-4" /> Informações Cadastrais
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-10">
                        <div className="flex flex-col gap-1.5"><span className="text-[9px] font-black uppercase text-muted-foreground tracking-widest">ID do Cliente</span><div className="flex items-center gap-2 font-black text-foreground"><Hash className="h-3.5 w-3.5 text-primary/40" /><span>{customer.numericId || '---'}</span></div></div>
                        <div className="flex flex-col gap-1.5"><span className="text-[9px] font-black uppercase text-muted-foreground tracking-widest">Documento (CPF)</span><div className="flex items-center gap-2 font-black text-foreground"><FileText className="h-3.5 w-3.5 text-primary/40" /><span>{customer.cpf || '---'}</span><CopyButton text={customer.cpf} label="CPF" /></div></div>
                        <div className="flex items-center gap-2 font-bold text-foreground">
                            <User className="h-3.5 w-3.5 text-primary/40" />
                            <span>{customer.gender || '-'}</span>
                        </div>
                        <div className="flex flex-col gap-1.5"><span className="text-[9px] font-black uppercase text-muted-foreground tracking-widest">Data de Nascimento</span><div className="flex items-center gap-2 font-bold text-foreground"><Calendar className="h-3.5 w-3.5 text-primary/40" /><span>{customer.birthDate ? formatDateSafe(customer.birthDate) : '-'}</span>{hasMounted && <Badge variant="secondary" className="text-[9px] bg-primary/10 text-primary border-none font-black">{age || 0} ANOS</Badge>}</div></div>
                        <div className="flex flex-col gap-1.5 lg:col-span-2"><span className="text-[9px] font-black uppercase text-muted-foreground tracking-widest">E-mail</span><div className="flex items-center gap-2 font-bold text-foreground"><Mail className="h-3.5 w-3.5 text-primary/40" /><span>{customer.email || '-'}</span><CopyButton text={customer.email} label="E-mail" /></div></div>
                        <div className="flex flex-col gap-1.5"><span className="text-[9px] font-black uppercase text-muted-foreground tracking-widest">Contato Principal</span><div className="flex items-center gap-2 font-black text-foreground"><Phone className="h-3.5 w-3.5 text-primary/40" /><span>{customer.phone || '---'}</span><div className="flex items-center gap-1"><CopyButton text={customer.phone} label="Telefone" />{customer.phone && isWhatsApp(customer.phone) && <a href={getWhatsAppUrl(customer.phone)} target="_blank" rel="noopener noreferrer" className="text-green-500 hover:scale-110 transition-transform"><WhatsAppIcon className="h-4 w-4" /></a>}</div></div></div>
                        <div className="flex flex-col gap-1.5">
                          <span className="text-[9px] font-black uppercase text-muted-foreground tracking-widest">
                            Telefone 2
                          </span>

                          <div className="flex items-center gap-2 font-bold text-foreground">
                            <Phone className="h-3.5 w-3.5 text-primary/40" />
                            <span>{customer.phone2 || '-'}</span>

                            <div className="flex items-center gap-1">
                              <CopyButton text={customer.phone2} label="Telefone 2" />

                              {customer.phone2 && isWhatsApp(customer.phone2) && (
                                <a
                                  href={getWhatsAppUrl(customer.phone2)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-green-500 hover:scale-110 transition-transform"
                                >
                                  <WhatsAppIcon className="h-4 w-4" />
                                </a>
                              )}
                            </div>
                          </div>
                        </div>
                    </div>
                </div>

                <div className="space-y-6 pt-8 border-t border-border/40">
                    <h4 className="font-black text-[11px] uppercase tracking-[0.25em] text-primary/60 flex items-center gap-2">
                        <CreditCard className="h-4 w-4" /> Benefícios e Reservas de Cartão
                    </h4>
                    <div className="space-y-6">
                        {customer.benefits && Array.isArray(customer.benefits) && customer.benefits.length > 0 ? (
                            customer.benefits.map((benefit: any, idx: number) => (
                                <div key={idx} className="p-6 rounded-3xl bg-muted/10 border border-border/40 space-y-6 transition-all hover:bg-muted/20">
                                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                                        
                                        <div className="flex items-center bg-background/60 border border-border/50 rounded-2xl p-1.5 shadow-sm h-16 md:min-w-[440px]">
                                            <div className="flex-1 flex items-center gap-4 px-4 py-2 border-r border-border/30">
                                                <div className="flex items-center justify-center h-9 w-9 rounded-full bg-emerald-500/10 text-emerald-600 font-black text-[10px] uppercase shadow-sm">NB</div>
                                                <div className="flex flex-col overflow-hidden">
                                                    <span className="text-[8px] font-black text-emerald-600/60 uppercase tracking-widest leading-none mb-1">Nº do Benefício</span>
                                                    <div className="flex items-center gap-1">
                                                        <span className="font-black text-sm text-foreground tracking-tight">{benefit.number || '---'}</span>
                                                        <CopyButton text={benefit.number} label="Benefício" />
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex-1 flex items-center gap-4 px-4 py-2">
                                                <div className="flex items-center justify-center h-9 w-9 rounded-full bg-green-500/10 text-green-600 font-black text-[10px] uppercase shadow-sm">R$</div>
                                                <div className="flex flex-col overflow-hidden">
                                                    <span className="text-[8px] font-black text-green-600/60 uppercase tracking-widest leading-none mb-1">Valor Mensal</span>
                                                    <div className="flex items-center gap-1">
                                                        <p className="text-sm font-black text-green-600 truncate tracking-tight">
                                                            {benefit.salary ? formatCurrency(Number(benefit.salary)) : "Não Inf."}
                                                        </p>
                                                        {benefit.salary && <CopyButton text={formatCurrency(Number(benefit.salary)).replace(/\D/g, '')} label="Salário" />}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center bg-background/60 border border-border/50 rounded-2xl p-1.5 shadow-sm h-16 md:min-w-[440px]">
                                            <div className="flex-1 flex items-center gap-4 px-4 py-2 border-r border-border/30">
                                                <div className="flex items-center justify-center h-9 w-9 rounded-full bg-orange-50/10 text-orange-600 font-black text-[10px] uppercase shadow-sm">RMC</div>
                                                <div className="flex items-center gap-2.5 overflow-hidden">
                                                    <BankIcon bankName={benefit.rmcBank} domain={userSettings?.bankDomains?.[benefit.rmcBank]} showLogo={showLogos} className="h-5 w-5" />
                                                    <p className="text-[11px] font-black text-foreground truncate max-w-[140px] uppercase tracking-tight">
                                                        {benefit.rmcBank && benefit.rmcBank !== 'none' ? cleanBankName(benefit.rmcBank) : "Livre"}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex-1 flex items-center gap-4 px-4 py-2">
                                                <div className="flex items-center justify-center h-9 w-9 rounded-full bg-blue-500/10 text-blue-600 font-black text-[10px] uppercase shadow-sm">RCC</div>
                                                <div className="flex items-center gap-2.5 overflow-hidden">
                                                    <BankIcon bankName={benefit.rccBank} domain={userSettings?.bankDomains?.[benefit.rccBank]} showLogo={showLogos} className="h-5 w-5" />
                                                    <p className="text-[11px] font-black text-foreground truncate max-w-[140px] uppercase tracking-tight">
                                                        {benefit.rccBank && benefit.rccBank !== 'none' ? cleanBankName(benefit.rccBank) : "Livre"}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    {benefit.species && (
                                        <div className="pl-4 border-l-4 border-emerald-500/20 py-1">
                                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{benefit.species}</p>
                                        </div>
                                    )}
                                </div>
                            ))
                        ) : (
                            <div className="p-12 text-center border-2 border-dashed rounded-3xl opacity-30 text-[10px] font-black uppercase tracking-[0.3em]">Nenhum benefício vinculado ao registro</div>
                        )}
                    </div>
                </div>

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

export default function CustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: customerId } = React.use(params);
  const firestore = useFirestore();
  const { user } = useUser();
  const [hasMounted, setHasMounted] = useState(false);
  const [isPitchModalOpen, setIsPitchModalOpen] = useState(false);
  const [isGeneratingPitch, setIsGeneratingPitch] = useState(false);
  const [generatedPitch, setGeneratedPitch] = useState('');
  const [dialogData, setDialogData] = React.useState<{ title: string; proposals: Proposal[] } | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => setHasMounted(true), []);

  const customerDocRef = useMemoFirebase(() => customerId && firestore ? doc(firestore, 'customers', customerId) : null, [firestore, customerId]);
  const proposalsQuery = useMemoFirebase(() => user && firestore && customerId ? query(collection(firestore, 'loanProposals'), where('ownerId', '==', user.uid), where('customerId', '==', customerId)) : null, [firestore, user, customerId]);
  const settingsDocRef = useMemoFirebase(() => user && firestore ? doc(firestore, 'userSettings', user.uid) : null, [firestore, user]);
  const allCustomersQuery = useMemoFirebase(() => user && firestore ? query(collection(firestore, 'customers'), where('ownerId', '==', user.uid)) : null, [firestore, user]);

  const { data: customer, isLoading: isCustomerLoading } = useDoc<Customer>(customerDocRef);
  const { data: proposals, isLoading: areProposalsLoading } = useCollection<Proposal>(proposalsQuery);
  const { data: userSettings } = useDoc<UserSettings>(settingsDocRef);
  const { data: allCustomers } = useCollection<Customer>(allCustomersQuery);

  const activeConfigs = React.useMemo(() => normalizeStatuses(userSettings?.proposalStatuses || []), [userSettings]);

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
    if (!proposals || !hasMounted) return null;
    const now = new Date();
    return proposals.find(p => {
        const behavior = getStatusBehavior(p.status, activeConfigs);
        if (behavior === 'success' && p.datePaidToClient) {
            try {
                const paidDate = new Date(p.datePaidToClient);
                if (!isValidDate(paidDate)) return false;
                return differenceInMonths(now, paidDate) >= 12;
            } catch (e) { return false; }
        }
        return false;
    });
  }, [proposals, hasMounted, activeConfigs]);

  const handleExportDossier = async () => {
    if (!customer || !proposals || !user) return;
    const { default: jsPDF } = await import('jspdf');
    const { default: autoTable } = await import('jspdf-autotable');
    const doc = new jsPDF();
    const primaryColor = [40, 74, 127];
    const pageHeight = doc.internal.pageSize.height;
    
    // 🛡️ EXPORTAÇÃO RESILIENTE: Try-catch para evitar crash se a logo falhar
    if (userSettings?.customLogoURL) {
        try {
            doc.addImage(userSettings.customLogoURL, 'PNG', 14, 10, 40, 20, undefined, 'FAST');
        } catch (e) { 
            console.warn("🛡️ LK RAMOS: Falha ao carregar logo no PDF. Prosseguindo sem imagem."); 
        }
    }

    doc.setFontSize(22); doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]); doc.setFont("helvetica", "bold"); 
    doc.text("DOSSIÊ OFICIAL DO CLIENTE", 60, 20);
    doc.setFontSize(10); doc.setTextColor(100); doc.setFont("helvetica", "normal");
    doc.text(`Responsável: ${user.displayName || user.email}`, 60, 28);
    doc.text(`Gerado em: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, 60, 33);
    doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]); doc.setLineWidth(0.5); doc.line(14, 38, 196, 38);
    
    autoTable(doc, { 
        startY: 45, 
        body: [
            ['Nome', customer.name], 
            ['CPF', customer.cpf], 
            ['Nascimento', formatDateSafe(customer.birthDate)], 
            ['Idade Atual', `${getAge(customer.birthDate)} anos`],
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
        doc.setFontSize(12); doc.setFont("helvetica", "bold"); doc.setTextColor(0); doc.text("BENEFÍCIOS E RESERVAS DE CARTÃO", 14, getFinalY() + 15);
        autoTable(doc, { 
            startY: getFinalY() + 18, 
            head: [['Número', 'Espécie', 'Salário', 'Cartão RMC', 'Cartão RCC']], 
            body: customer.benefits.map(b => [
                b.number, 
                b.species || '-',
                b.salary > 0 ? formatCurrency(b.salary) : '-',
                cleanBankName(b.rmcBank) || '-',
                cleanBankName(b.rccBank) || '-'
            ]), 
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

    const decText = `Eu, ${customer.name}, portador do CPF ${customer.cpf}, declaro verdadeiras as informações acima e autorizo expressamente o processamento dos meus dados para fins de simulação e contratação bancária, conforme as diretrizes da LGPD (Lei Geral de Proteção de Dados).`;
    const wrappedDecText = doc.splitTextToSize(decText, 180);
    const textHeight = (wrappedDecText.length * 6);
    
    // 🛡️ LÓGICA DE QUEBRA INTELIGENTE (Aprovado #1)
    let currentY = getFinalY() + 20;
    if (currentY + textHeight + 60 > pageHeight) { 
        doc.addPage(); 
        currentY = 25;
    }

    doc.setFontSize(12); doc.setFont("helvetica", "bold"); doc.setTextColor(0); doc.text("DECLARAÇÃO E FORMALIZAÇÃO", 14, currentY); 
    doc.setFontSize(9); doc.setTextColor(80); doc.setFont("helvetica", "normal");
    doc.text(wrappedDecText, 14, currentY + 10);
    
    const signatureY = currentY + 10 + textHeight + 25;
    
    if (signatureY + 15 > pageHeight) {
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
    setIsSaving(true);
    const newStatus = customer.status === 'inactive' ? 'active' : 'inactive';
    try {
        await updateDoc(doc(firestore, 'customers', customerId), { status: newStatus });
        toast({ title: `Cliente ${newStatus === 'active' ? 'Ativado' : 'Inativado'}` });
    } catch (error: any) {
        if (error.code === 'permission-denied') {
            errorEmitter.emit('permission-error', new FirestorePermissionError({
                path: `customers/${customerId}`,
                operation: 'update',
                requestResourceData: { status: newStatus }
            }));
        }
    } finally {
        setIsSaving(false);
    }
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

  const handleEditSubmit = async (formData: any) => {
    if (!firestore || !user || !customer) return;
    setIsSaving(true);
    try {
        const docRef = doc(firestore, 'customers', customer.id);
        const finalData = cleanFirestoreData({
            ...formData,
            id: customer.id,
            ownerId: user.uid,
            numericId: customer.numericId
        });

        await setDoc(docRef, finalData, { merge: true });
        toast({ title: 'Cadastro Atualizado!' });
        setIsEditDialogOpen(false);
    } catch (error: any) {
        if (error.code === 'permission-denied') {
            errorEmitter.emit('permission-error', new FirestorePermissionError({
                path: `customers/${customer.id}`,
                operation: 'update',
                requestResourceData: formData
            }));
        }
        toast({ variant: 'destructive', title: 'Erro ao salvar' });
    } finally {
        setIsSaving(false);
    }
  };

  if (!hasMounted || isCustomerLoading || areProposalsLoading) return <AppLayout><div className="space-y-4"><div className="h-48 w-full bg-muted animate-pulse rounded-lg" /><div className="h-96 w-full bg-muted animate-pulse rounded-lg" /></div></AppLayout>;
  if (!customer) return <AppLayout><PageHeader title="Não encontrado" /></AppLayout>;

  return (
    <AppLayout>
      <div className='space-y-8 pb-20'>
        {retentionOpportunity && customer.status !== 'inactive' && (
            <Alert className="bg-amber-50 border-amber-200 animate-in slide-in-from-top duration-500 rounded-2xl"><Sparkles className="h-5 w-5 text-amber-600" /><AlertTitle className="text-amber-800 font-bold uppercase">Oportunidade Identificada!</AlertTitle><AlertDescription className="text-amber-700 text-sm">Contratos pagos há mais de 12 meses. Momento ideal para Refinanciamento.</AlertDescription></Alert>
        )}
        
        <CustomerInfoCard 
            customer={customer} 
            proposals={proposals || []}
            onExportDossier={handleExportDossier} 
            onToggleStatus={handleToggleStatus} 
            onGeneratePitch={handleGeneratePitch} 
            onEdit={() => setIsEditDialogOpen(true)} 
            userSettings={userSettings} 
            totalCommission={businessStats.commission} 
        />

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
                <Card className="border-border/50 shadow-lg rounded-2xl overflow-hidden">
                    <CardHeader className="bg-muted/5">
                        <CardTitle className="text-lg font-black uppercase text-primary/80">Histórico de Propostas</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <SimpleProposalsTable 
                            proposals={proposals || []} 
                            userSettings={userSettings || null}
                        />
                    </CardContent>
                </Card>
            </div>
            <div className="lg:col-span-1">
                <Card className="h-full border-border/50 shadow-lg rounded-2xl overflow-hidden sticky top-24">
                    <CardHeader className="bg-muted/10">
                        <CardTitle className="text-lg font-black uppercase flex items-center gap-3">
                            <FolderLock className="h-5 w-5 text-primary opacity-60" />Arquivos
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <CustomerAttachmentUploader 
                            userId={user?.uid || ''} 
                            customerId={customer.id} 
                            initialAttachments={customer.documents || []} 
                            onAttachmentsChange={async (docs) => {
                                const docRef = doc(firestore!, 'customers', customer.id);
                                const data = cleanFirestoreData({ documents: docs });
                                try {
                                    await updateDoc(docRef, data);
                                } catch (error: any) {
                                    if (error.code === 'permission-denied') {
                                        errorEmitter.emit('permission-error', new FirestorePermissionError({
                                            path: docRef.path,
                                            operation: 'update',
                                            requestResourceData: data
                                        }));
                                    }
                                }
                            }} 
                        />
                    </CardContent>
                </Card>
            </div>
        </div>
      </div>

      <Dialog open={isPitchModalOpen} onOpenChange={setIsPitchModalOpen}>
        <DialogContent className="max-w-md rounded-[2rem]" onPointerDownOutside={(e) => e.preventDefault()} onInteractOutside={(e) => e.preventDefault()}>
            <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-xl font-black uppercase">
                    <MessageSquareText className="h-5 w-5 text-orange-500" /> Smart Pitch IA
                </DialogTitle>
                <DialogDescription>Gerador de scripts magnéticos para abordagem comercial via WhatsApp.</DialogDescription>
            </DialogHeader>
            <div className="py-4">
                {isGeneratingPitch ? (
                    <div className="flex flex-col items-center justify-center py-10 gap-4">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        <p className="text-xs text-muted-foreground animate-pulse font-black uppercase">Criando script magnético...</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <textarea className="w-full min-h-[200px] p-4 rounded-2xl border-2 bg-muted/30 text-sm focus:ring-2 focus:ring-primary outline-none" value={generatedPitch} onChange={(e) => setGeneratedPitch(e.target.value)} />
                        <p className="text-[10px] text-muted-foreground text-center font-bold uppercase">Edite o texto antes de enviar.</p>
                    </div>
                )}
            </div>
            <DialogFooter className="flex gap-2">
                <Button variant="ghost" className="rounded-full font-bold" onClick={() => setIsPitchModalOpen(false)}>Cancelar</Button>
                <Button className="flex-1 rounded-full font-bold bg-[#25D366] text-white gap-2" onClick={() => { window.open(`${getWhatsAppUrl(customer.phone)}&text=${encodeURIComponent(generatedPitch)}`, '_blank'); setIsPitchModalOpen(false); }} disabled={isGeneratingPitch || !generatedPitch}>
                    <WhatsAppIcon className="h-4 w-4" />Enviar para WhatsApp
                </Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!dialogData} onOpenChange={(isOpen) => !isOpen && setDialogData(null)}>
            <DialogContent className="max-w-4xl h-[90vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 font-black uppercase"><ArrowRight className="h-5 w-5 text-primary" /> {dialogData?.title}</DialogTitle>
                    <DialogDescription>Listagem técnica das operações selecionadas no histórico do cliente.</DialogDescription>
                </DialogHeader>
                <div className="flex-1 overflow-y-auto">
                    <ProposalsStatusTable proposals={dialogData?.proposals || []} customers={[customer]} />
                </div>
            </DialogContent>
      </Dialog>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent 
            className="max-w-4xl w-[95vw] h-[90vh] flex flex-col p-0 overflow-hidden rounded-[2rem] border-none shadow-2xl" 
            onPointerDownOutside={(e) => e.preventDefault()} 
            onInteractOutside={(e) => e.preventDefault()}
        >
            <DialogHeader className="px-8 pt-8 pb-4 shrink-0 bg-muted/5 border-b">
                <DialogTitle className="text-xl font-black uppercase tracking-tight text-primary">Editar Cadastro do Cliente</DialogTitle>
                <DialogDescription>Atualize as informações cadastrais, benefícios e endereços deste registro.</DialogDescription>
            </DialogHeader>
            <div className="flex-1 overflow-hidden">
                <CustomerForm 
                    customer={customer} 
                    allCustomers={allCustomers || []} 
                    userSettings={userSettings} 
                    onSubmit={handleEditSubmit}
                    isSaving={isSaving}
                />
            </div>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
