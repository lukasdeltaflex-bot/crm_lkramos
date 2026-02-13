'use client';
import React from 'react';
import { useParams } from 'next/navigation';
import { AppLayout } from '@/components/app-layout';
import { PageHeader } from '@/components/page-header';
import { useDoc, useCollection, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { doc, collection, query, where, updateDoc } from 'firebase/firestore';
import type { Customer, Proposal, Attachment, ProposalHistoryEntry } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { User, Phone, Mail, Calendar, FileText, CircleDollarSign, BadgePercent, MapPin, Hash, Copy, Printer, FileBadge, FolderLock, Sparkles, AlertTriangle, UserRound, UserX, UserCheck, ShieldCheck, History, MessageSquareQuote } from 'lucide-react';
import { format, parse, differenceInMonths, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { StatsCard } from '@/components/dashboard/stats-card';
import { formatCurrency, getAge } from '@/lib/utils';
import { SimpleProposalsTable } from '@/components/customers/simple-proposals-table';
import { Separator } from '@/components/ui/separator';
import { CustomerAiSummary } from '@/components/customers/customer-ai-summary';
import { isWhatsApp, getWhatsAppUrl } from '@/lib/utils';
import { WhatsAppIcon } from '@/components/icons/whatsapp-icon';
import { toast } from '@/hooks/use-toast';
import { CustomerAttachmentUploader } from '@/components/customers/customer-attachment-uploader';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ProposalsStatusTable } from '@/components/dashboard/proposals-status-table';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';


const CopyButton = ({ text, label }: { text: string; label: string }) => {
    if (!text) return null;
    const handleCopy = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        navigator.clipboard.writeText(text);
        toast({
            title: `${label} copiado!`,
            description: `O valor "${text}" foi copiado para a área de transferência.`,
        });
    };
    return (
        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleCopy}>
            <Copy className="h-3 w-3" />
            <span className="sr-only">Copiar {label}</span>
        </Button>
    );
}

const CustomerInfoCard = ({ 
    customer, 
    onExportDossier, 
    onToggleStatus 
}: { 
    customer: Customer; 
    onExportDossier: () => void;
    onToggleStatus: () => void;
}) => {
    const [age, setAge] = React.useState<number | null>(null);

    React.useEffect(() => {
        setAge(getAge(customer.birthDate));
    }, [customer.birthDate]);

    const isWhatsAppNumber1 = isWhatsApp(customer.phone);
    const isWhatsAppNumber2 = customer.phone2 ? isWhatsApp(customer.phone2) : false;
    const isInactive = customer.status === 'inactive';
    
    return (
        <Card className={isInactive ? "opacity-80 bg-zinc-50 dark:bg-zinc-900/40" : ""}>
            <CardHeader>
                <div className='flex items-center justify-between flex-wrap gap-4'>
                    <div className='flex items-center gap-4'>
                         <User className="h-8 w-8 text-muted-foreground" />
                        <div className="space-y-1">
                            <div className="flex items-center gap-3">
                                <CardTitle>{customer.name}</CardTitle>
                                <Badge variant={isInactive ? "secondary" : "default"} className={isInactive ? "bg-zinc-200 text-zinc-700" : "bg-green-500"}>
                                    {isInactive ? "Inativo" : "Ativo"}
                                </Badge>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 print:hidden">
                        <Button 
                            variant="outline" 
                            className={isInactive ? "text-green-600 border-green-200" : "text-destructive border-destructive/20"}
                            onClick={onToggleStatus}
                        >
                            {isInactive ? (
                                <><UserCheck className="mr-2 h-4 w-4" /> Reativar Cliente</>
                            ) : (
                                <><UserX className="mr-2 h-4 w-4" /> Tornar Inativo</>
                            )}
                        </Button>
                        <Button variant="outline" className="bg-primary/5 border-primary/20 text-primary hover:bg-primary/10" onClick={onExportDossier}>
                            <FileBadge className="mr-2 h-4 w-4" />
                            Dossiê Oficial (PDF)
                        </Button>
                        <Button variant="outline" onClick={() => window.print()}>
                            <Printer className="mr-2 h-4 w-4" />
                            Imprimir Ficha
                        </Button>
                        <Link href="/customers">
                            <Button variant="outline">Voltar</Button>
                        </Link>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-6">
                <div>
                    <h4 className="font-semibold mb-4 text-lg">Dados Pessoais</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                        <div className="flex items-center gap-2">
                            <Hash className="h-4 w-4 text-muted-foreground" />
                            <strong>ID Cliente:</strong> <span className='truncate'>{customer.numericId}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-muted-foreground" />
                            <strong>CPF:</strong>
                            <span>{customer.cpf}</span>
                            <CopyButton text={customer.cpf} label="CPF" />
                        </div>
                        <div className="flex items-center gap-2">
                            <UserRound className="h-4 w-4 text-muted-foreground" />
                            <strong>Gênero:</strong> {customer.gender || 'Não informado'}
                        </div>
                        <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <strong>Nascimento:</strong> {format(parse(customer.birthDate, 'yyyy-MM-dd', new Date()), 'dd/MM/yyyy', { locale: ptBR })} ({age !== null && age > 0 ? `${age} anos` : '...'})
                        </div>
                        <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4 text-muted-foreground" />
                            <strong>Telefone:</strong>
                            <div className="flex items-center gap-1">
                                <span>{customer.phone}</span>
                                <CopyButton text={customer.phone} label="Telefone" />
                                {isWhatsAppNumber1 && (
                                <a href={getWhatsAppUrl(customer.phone)} target="_blank" rel="noopener noreferrer" className="text-green-500 hover:text-green-600">
                                    <WhatsAppIcon />
                                </a>
                                )}
                            </div>
                        </div>
                         {customer.phone2 && (
                            <div className="flex items-center gap-2">
                                <Phone className="h-4 w-4 text-muted-foreground" />
                                <strong>Telefone 2:</strong>
                                <div className="flex items-center gap-1">
                                    <span>{customer.phone2}</span>
                                    <CopyButton text={customer.phone2} label="Telefone 2" />
                                    {isWhatsAppNumber2 && (
                                    <a href={getWhatsAppUrl(customer.phone2)} target="_blank" rel="noopener noreferrer" className="text-green-500 hover:text-green-600">
                                        <WhatsAppIcon />
                                    </a>
                                    )}
                                </div>
                            </div>
                        )}
                        <div className="flex items-center gap-2 col-span-1 md:col-span-2">
                            <Mail className="h-4 w-4 text-muted-foreground" />
                            <strong>Email:</strong> {customer.email || 'N/A'}
                            {customer.email && <CopyButton text={customer.email} label="E-mail" />}
                        </div>
                        {customer.benefits && customer.benefits.length > 0 ? (
                            customer.benefits.map((benefit, index) => (
                                <div key={index} className="flex items-center gap-2">
                                    <FileText className="h-4 w-4 text-muted-foreground" />
                                    <strong>Benefício {customer.benefits!.length > 1 ? index + 1 : ''}:</strong>
                                    <span>{benefit.number}</span>
                                    {benefit.species && <span className="text-muted-foreground text-sm">({benefit.species})</span>}
                                    <CopyButton text={benefit.number} label="Número do Benefício" />
                                </div>
                            ))
                        ) : (
                            <div className="flex items-center gap-2">
                                <FileText className="h-4 w-4 text-muted-foreground" />
                                <strong>Benefício:</strong> Nenhum cadastrado
                            </div>
                        )}
                    </div>
                </div>

                <Separator />

                <div>
                    <h4 className="font-semibold mb-4 text-lg">Endereço</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                         <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-muted-foreground" />
                            <strong>CEP:</strong> {customer.cep || 'N/A'}
                        </div>
                        <div className="flex items-center gap-2 col-span-1 md:col-span-2">
                            <MapPin className="h-4 w-4 text-muted-foreground" />
                            <strong>Logradouro:</strong> {customer.street}{customer.number ? `, ${customer.number}` : ''}
                        </div>
                         <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-muted-foreground" />
                            <strong>Complemento:</strong> {customer.complement || 'N/A'}
                        </div>
                        <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-muted-foreground" />
                            <strong>Bairro:</strong> {customer.neighborhood}
                        </div>
                        <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-muted-foreground" />
                            <strong>Cidade/UF:</strong> {customer.city} / {customer.state}
                        </div>
                    </div>
                </div>

                {customer.observations && (
                    <>
                        <Separator />
                        <div>
                            <h4 className="font-semibold mb-2 text-lg">Observações</h4>
                            <p className="text-muted-foreground bg-secondary/30 p-3 rounded-md whitespace-pre-wrap">{customer.observations}</p>
                        </div>
                    </>
                )}
            </CardContent>
        </Card>
    )
}

const CustomerFinancialSummary = ({ 
    proposals, 
    onShowDetails 
}: { 
    proposals: Proposal[]; 
    onShowDetails: (title: string, proposals: Proposal[]) => void;
}) => {
    const summary = React.useMemo(() => {
      let totalContracted = 0;
      let totalCommission = 0;
      const paidProposals: Proposal[] = [];
  
      proposals.forEach((proposal) => {
        if (proposal.status === 'Pago' || proposal.status === 'Saldo Pago') {
          totalContracted += proposal.grossAmount;
          paidProposals.push(proposal);
          if (proposal.commissionValue) {
            totalCommission += proposal.commissionValue;
          }
        }
      });
  
      return { totalContracted, totalCommission, proposalCount: proposals.length, paidProposals };
    }, [proposals]);
  
    return (
      <div className="grid gap-4 md:grid-cols-3">
        <div className="cursor-pointer" onClick={() => onShowDetails("Propostas Realizadas", proposals)}>
            <StatsCard
                title="Propostas Realizadas"
                value={String(summary.proposalCount)}
                icon={FileText}
            />
        </div>
        <div className="cursor-pointer" onClick={() => onShowDetails("Total Contratado (Pagos)", summary.paidProposals)}>
            <StatsCard
                title="Total Contratado"
                value={formatCurrency(summary.totalContracted)}
                icon={CircleDollarSign}
                valueClassName="text-green-500"
            />
        </div>
        <div className="cursor-pointer" onClick={() => onShowDetails("Comissão Gerada (Pagos)", summary.paidProposals)}>
            <StatsCard
                title="Comissão Gerada"
                value={formatCurrency(summary.totalCommission)}
                icon={BadgePercent}
                valueClassName="text-blue-500"
            />
        </div>
      </div>
    );
};

interface CustomerTimelineProps {
    proposals: Proposal[];
}

const CustomerTimeline = ({ proposals }: CustomerTimelineProps) => {
    const timelineEvents = React.useMemo(() => {
        const events: (ProposalHistoryEntry & { proposalNumber: string; product: string })[] = [];
        
        proposals.forEach(p => {
            if (p.history && Array.isArray(p.history)) {
                p.history.forEach(entry => {
                    events.push({
                        ...entry,
                        proposalNumber: p.proposalNumber,
                        product: p.product
                    });
                });
            }
        });

        // Ordena por data decrescente
        return events.sort((a, b) => b.date.localeCompare(a.date));
    }, [proposals]);

    return (
        <Card className="h-full">
            <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-lg font-bold flex items-center gap-2">
                        <History className="h-5 w-5 text-primary" />
                        Linha do Tempo Global
                    </CardTitle>
                    <Badge variant="outline" className="text-[10px] font-black uppercase tracking-widest">{timelineEvents.length} EVENTOS</Badge>
                </div>
            </CardHeader>
            <CardContent>
                {timelineEvents.length === 0 ? (
                    <div className="text-center py-12 border-2 border-dashed rounded-xl bg-muted/5">
                        <History className="h-8 w-8 mx-auto mb-2 opacity-10" />
                        <p className="text-xs text-muted-foreground">Nenhum histórico registrado para este cliente.</p>
                    </div>
                ) : (
                    <ScrollArea className="h-[500px] pr-4">
                        <div className="space-y-6 relative before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-muted/50">
                            {timelineEvents.map((event) => (
                                <div key={event.id} className="relative pl-8 group">
                                    <div className="absolute left-0 top-1 h-4 w-4 rounded-full border-2 border-background bg-primary shadow-sm group-hover:scale-125 transition-transform" />
                                    <div className="space-y-1">
                                        <div className="flex items-center justify-between">
                                            <span className="text-[10px] font-black uppercase text-primary/70">{event.userName || 'Sistema'}</span>
                                            <span className="text-[10px] text-muted-foreground font-bold">{format(parseISO(event.date), "dd/MM/yy HH:mm")}</span>
                                        </div>
                                        <div className="p-3 bg-muted/30 rounded-lg border border-border/50 group-hover:border-primary/20 transition-all">
                                            <div className="flex items-center gap-2 mb-1.5">
                                                <Badge variant="secondary" className="text-[9px] font-black bg-primary/10 text-primary uppercase">
                                                    Prop. {event.proposalNumber}
                                                </Badge>
                                                <span className="text-[9px] font-bold text-muted-foreground uppercase">{event.product}</span>
                                            </div>
                                            <p className="text-xs leading-relaxed text-foreground flex items-start gap-2">
                                                <MessageSquareQuote className="h-3 w-3 mt-0.5 text-muted-foreground shrink-0" />
                                                {event.message}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </ScrollArea>
                )}
            </CardContent>
        </Card>
    )
}
  

export default function CustomerDetailPage({ params }: { params: { id: string } }) {
  const { id: customerId } = useParams() as { id: string };
  const firestore = useFirestore();
  const { user } = useUser();

  const [dialogData, setDialogData] = React.useState<{ title: string; proposals: Proposal[] } | null>(null);

  const customerDocRef = useMemoFirebase(() => {
    if (!firestore || !customerId) return null;
    return doc(firestore, 'customers', customerId);
  }, [firestore, customerId]);

  const proposalsQuery = useMemoFirebase(() => {
    if (!firestore || !user || !customerId) return null;
    return query(collection(firestore, 'loanProposals'), where('ownerId', '==', user.uid), where('customerId', '==', customerId));
  }, [firestore, user, customerId]);

  const { data: customer, isLoading: isCustomerLoading } = useDoc<Customer>(customerDocRef);
  const { data: proposals, isLoading: areProposalsLoading } = useCollection<Proposal>(proposalsQuery);

  const retentionOpportunity = React.useMemo(() => {
    if (!proposals) return null;
    const now = new Date();
    // Procura por contratos Pagos com mais de 12 meses
    const oldPaidProposal = proposals.find(p => {
        if ((p.status === 'Pago' || p.status === 'Saldo Pago') && p.datePaidToClient) {
            const paidDate = new Date(p.datePaidToClient);
            return differenceInMonths(now, paidDate) >= 12;
        }
        return false;
    });

    return oldPaidProposal || null;
  }, [proposals]);

  const handleToggleStatus = async () => {
    if (!firestore || !customerId || !customer) return;
    const newStatus = customer.status === 'inactive' ? 'active' : 'inactive';
    try {
        await updateDoc(doc(firestore, 'customers', customerId), {
            status: newStatus
        });
        toast({ 
            title: newStatus === 'active' ? "Cliente Reativado" : "Cliente Inativado", 
            description: `O status de ${customer.name} foi alterado para ${newStatus === 'active' ? 'Ativo' : 'Inativo'}.` 
        });
    } catch (e) {
        toast({ variant: "destructive", title: "Erro ao atualizar status", description: "Tente novamente." });
    }
  };

  const handleDocumentsChange = async (docs: Attachment[]) => {
    if (!firestore || !customerId) return;
    try {
        await updateDoc(doc(firestore, 'customers', customerId), {
            documents: docs
        });
        toast({ title: "Central Atualizada", description: "O documento foi vinculado ao cliente com sucesso." });
    } catch (e) {
        console.error("Error updating customer documents:", e);
        toast({ variant: "destructive", title: "Erro ao atualizar", description: "Não foi possível salvar a alteração." });
    }
  };

  const handleShowDetails = (title: string, props: Proposal[]) => {
    setDialogData({ title, proposals: props });
  };

  const handleExportDossier = async () => {
    if (!customer || !proposals || !user) return;

    const { default: jsPDF } = await import('jspdf');
    const { default: autoTable } = await import('jspdf-autotable');

    const doc = new jsPDF();
    const primaryColor = [40, 74, 127];
    const accentColor = [212, 175, 55]; // Gold
    
    // Header
    doc.setFontSize(22);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.setFont("helvetica", "bold");
    doc.text("DOSSIÊ OFICIAL DO CLIENTE", 14, 20);
    
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.setFont("helvetica", "normal");
    doc.text(`Proprietário da Carteira: ${user.displayName || user.email}`, 14, 28);
    doc.text(`Gerado em: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, 14, 33);
    
    doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.setLineWidth(0.5);
    doc.line(14, 38, 196, 38);

    // Section: Personal Data
    doc.setFontSize(14);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.setFont("helvetica", "bold");
    doc.text("INFORMAÇÕES CADASTRAIS", 14, 48);
    
    autoTable(doc, {
        startY: 52,
        body: [
            ['Nome Completo', customer.name],
            ['CPF', customer.cpf],
            ['Status no Sistema', customer.status === 'inactive' ? 'Inativo' : 'Ativo'],
            ['Gênero', customer.gender || 'Não informado'],
            ['Data de Nascimento', format(parse(customer.birthDate, 'yyyy-MM-dd', new Date()), 'dd/MM/yyyy')],
            ['Telefone Principal', customer.phone],
            ['E-mail', customer.email || 'N/A'],
            ['Cidade/UF', `${customer.city || '-'} / ${customer.state || '-'}`],
            ['Logradouro', `${customer.street || '-'}, ${customer.number || '-'} ${customer.complement ? '(' + customer.complement + ')' : ''}`],
        ],
        theme: 'plain',
        styles: { fontSize: 10, cellPadding: 2 },
        columnStyles: { 0: { fontStyle: 'bold', width: 50, textColor: [80, 80, 80] } }
    });

    // Section: Benefits
    if (customer.benefits && customer.benefits.length > 0) {
        doc.text("BENEFÍCIOS ATIVOS", 14, (doc as any).lastAutoTable.finalY + 15);
        autoTable(doc, {
            startY: (doc as any).lastAutoTable.finalY + 18,
            head: [['Número do Benefício', 'Espécie / Categoria']],
            body: customer.benefits.map(b => [b.number, b.species || '-']),
            headStyles: { fillColor: primaryColor, fontSize: 10, fontStyle: 'bold' },
            styles: { fontSize: 10 }
        });
    }

    // Section: Proposal History
    doc.text("HISTÓRICO DE OPERAÇÕES BANCÁRIAS", 14, (doc as any).lastAutoTable.finalY + 15);
    autoTable(doc, {
        startY: (doc as any).lastAutoTable.finalY + 18,
        head: [['Nº Proposta', 'Produto', 'Status Final', 'Valor Bruto', 'Data']],
        body: proposals.map(p => [
            p.proposalNumber,
            p.product,
            p.status,
            formatCurrency(p.grossAmount),
            format(new Date(p.dateDigitized), 'dd/MM/yyyy')
        ]),
        headStyles: { fillColor: [70, 70, 70], fontSize: 9 },
        styles: { fontSize: 9 }
    });

    // Final Section: Declaration and Signature
    const finalY = (doc as any).lastAutoTable.finalY;
    const pageHeight = doc.internal.pageSize.height;

    // Check if we need a new page for signatures
    if (finalY > pageHeight - 80) {
        doc.addPage();
        doc.setFontSize(14);
        doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
        doc.setFont("helvetica", "bold");
        doc.text("DECLARAÇÃO E FORMALIZAÇÃO", 14, 25);
    } else {
        doc.text("DECLARAÇÃO E FORMALIZAÇÃO", 14, finalY + 20);
    }

    const startSignatureY = doc.lastAutoTable ? Math.max(finalY + 25, 25) : 50;
    
    doc.setFontSize(9);
    doc.setTextColor(80);
    doc.setFont("helvetica", "normal");
    const declarationText = `Eu, ${customer.name}, inscrito(a) no CPF ${customer.cpf}, declaro que as informações acima descritas são verdadeiras e estou ciente de que o processamento destes dados é realizado para fins exclusivos de operacionalização de propostas de crédito consignado e/ou produtos bancários correlatos, em conformidade com a Lei Geral de Proteção de Dados (LGPD).`;
    const splitText = doc.splitTextToSize(declarationText, 180);
    doc.text(splitText, 14, startSignatureY);

    // Signature lines
    const signatureY = startSignatureY + 35;
    doc.setDrawColor(150);
    doc.line(14, signatureY, 90, signatureY);
    doc.line(110, signatureY, 186, signatureY);
    
    doc.setFontSize(8);
    doc.text("ASSINATURA DO CLIENTE", 52, signatureY + 5, { align: 'center' });
    doc.text("AGENTE RESPONSÁVEL", 148, signatureY + 5, { align: 'center' });
    doc.text(`${customer.city || 'Local'}, ________ de ________________ de 20____`, 14, signatureY + 15);

    // Electronic Authentication Footer
    const footerY = pageHeight - 20;
    const authHash = Buffer.from(`${customer.id}-${Date.now()}`).toString('hex').substring(0, 16).toUpperCase();
    
    doc.setDrawColor(230);
    doc.line(14, footerY - 5, 196, footerY - 5);
    
    doc.setFontSize(7);
    doc.setTextColor(150);
    doc.text("DOCUMENTO GERADO PELO SISTEMA LK RAMOS - AUTENTICAÇÃO ELETRÔNICA", 105, footerY, { align: 'center' });
    doc.setFont("courier", "bold");
    doc.text(`CHAVE DE VALIDAÇÃO: ${authHash}`, 105, footerY + 4, { align: 'center' });

    doc.save(`Dossie_Oficial_${customer.name.replace(/\s+/g, '_')}.pdf`);
    toast({ 
        title: "Dossiê Gerado com Sucesso!", 
        description: "O documento oficial foi processado e baixado." 
    });
  };

  const isLoading = isCustomerLoading || areProposalsLoading;

  if (isLoading) {
    return (
        <AppLayout>
            <div className="space-y-4">
                <Skeleton className="h-48 w-full" />
                <Skeleton className="h-32 w-full" />
                <div className="grid gap-4 md:grid-cols-3">
                    <Skeleton className="h-24 w-full" />
                    <Skeleton className="h-24 w-full" />
                    <Skeleton className="h-24 w-full" />
                </div>
                <Skeleton className="h-96 w-full" />
            </div>
        </AppLayout>
    )
  }

  if (!customer) {
    return (
      <AppLayout>
        <PageHeader title="Cliente não encontrado" />
        <p>O cliente que você está procurando não foi encontrado.</p>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className='space-y-8'>
        <div className="hidden print:block mb-8">
            <h1 className="text-2xl font-bold">Ficha do Cliente: {customer.name}</h1>
            <p className="text-sm text-gray-500">
                LK RAMOS Gestão de Propostas - Gerado em: {format(new Date(), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
            </p>
        </div>

        {/* ALERTA DE RETENÇÃO (Idade de Ouro) */}
        {retentionOpportunity && customer.status !== 'inactive' && (
            <Alert className="bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-800 animate-in slide-in-from-top duration-500">
                <Sparkles className="h-5 w-5 text-amber-600" />
                <AlertTitle className="text-amber-800 dark:text-amber-400 font-bold">Oportunidade de Retenção Identificada!</AlertTitle>
                <AlertDescription className="text-amber-700 dark:text-amber-500 text-sm mt-1">
                    Este cliente possui contratos liquidados/pagos há mais de 12 meses (Ex: Proposta {retentionOpportunity.proposalNumber}). 
                    <strong> É o momento ideal para oferecer um Refinanciamento ou Portabilidade.</strong>
                </AlertDescription>
            </Alert>
        )}

        <CustomerInfoCard 
            customer={customer} 
            onExportDossier={handleExportDossier} 
            onToggleStatus={handleToggleStatus}
        />
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
                <div className="print:hidden">
                    <CustomerAiSummary customer={customer} proposals={proposals || []} />
                </div>
                <CustomerFinancialSummary 
                    proposals={proposals || []} 
                    onShowDetails={handleShowDetails}
                />
                
                <CustomerTimeline proposals={proposals || []} />

                <Card>
                    <CardHeader>
                        <CardTitle>Histórico de Propostas</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <SimpleProposalsTable proposals={proposals || []} />
                    </CardContent>
                </Card>
            </div>
            <div className="lg:col-span-1">
                <Card className="h-full">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <FolderLock className="h-5 w-5 text-primary" />
                            Documentos Permanentes
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <CustomerAttachmentUploader 
                            userId={user?.uid || ''}
                            customerId={customer.id}
                            initialAttachments={customer.documents || []}
                            onAttachmentsChange={handleDocumentsChange}
                        />
                    </CardContent>
                </Card>
            </div>
        </div>
      </div>

      <Dialog open={!!dialogData} onOpenChange={(isOpen) => !isOpen && setDialogData(null)}>
        <DialogContent className="max-w-4xl h-[90vh] flex flex-col">
            <DialogHeader>
                <DialogTitle>{dialogData?.title}</DialogTitle>
            </DialogHeader>
            <div className="flex-1 overflow-y-auto">
                <ProposalsStatusTable proposals={dialogData?.proposals || []} customers={customer ? [customer] : []} />
            </div>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
