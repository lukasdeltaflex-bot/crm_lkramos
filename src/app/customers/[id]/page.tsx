'use client';
import React from 'react';
import { useParams } from 'next/navigation';
import { AppLayout } from '@/components/app-layout';
import { PageHeader } from '@/components/page-header';
import { useDoc, useCollection, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { doc, collection, query, where } from 'firebase/firestore';
import type { Customer, Proposal } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { User, Phone, Mail, Calendar, FileText, CircleDollarSign, BadgePercent, MapPin, Hash, Copy, Printer } from 'lucide-react';
import { format, parse } from 'date-fns';
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

const CustomerInfoCard = ({ customer }: { customer: Customer }) => {
    const [age, setAge] = React.useState<number | null>(null);

    React.useEffect(() => {
        setAge(getAge(customer.birthDate));
    }, [customer.birthDate]);

    const isWhatsAppNumber1 = isWhatsApp(customer.phone);
    const isWhatsAppNumber2 = customer.phone2 ? isWhatsApp(customer.phone2) : false;
    
    return (
        <Card>
            <CardHeader>
                <div className='flex items-center justify-between'>
                    <div className='flex items-center gap-4'>
                         <User className="h-8 w-8 text-muted-foreground" />
                        <div>
                            <CardTitle>{customer.name}</CardTitle>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 print:hidden">
                        <Button variant="outline" onClick={() => window.print()}>
                            <Printer className="mr-2 h-4 w-4" />
                            Imprimir Ficha
                        </Button>
                        <Link href="/customers">
                            <Button variant="outline">Voltar para Clientes</Button>
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

const CustomerFinancialSummary = ({ proposals }: { proposals: Proposal[] }) => {
    const summary = React.useMemo(() => {
      let totalContracted = 0;
      let totalCommission = 0;
  
      proposals.forEach((proposal) => {
        if (proposal.status === 'Pago' || proposal.status === 'Saldo Pago') {
          totalContracted += proposal.grossAmount;
          if (proposal.commissionValue) {
            totalCommission += proposal.commissionValue;
          }
        }
      });
  
      return { totalContracted, totalCommission, proposalCount: proposals.length };
    }, [proposals]);
  
    return (
      <div className="grid gap-4 md:grid-cols-3">
        <StatsCard
          title="Propostas Realizadas"
          value={String(summary.proposalCount)}
          icon={FileText}
        />
        <StatsCard
          title="Total Contratado"
          value={formatCurrency(summary.totalContracted)}
          icon={CircleDollarSign}
          valueClassName="text-green-500"
        />
        <StatsCard
          title="Comissão Gerada"
          value={formatCurrency(summary.totalCommission)}
          icon={BadgePercent}
          valueClassName="text-blue-500"
        />
      </div>
    );
};
  

export default function CustomerDetailPage({ params }: { params: { id: string } }) {
  const { id: customerId } = useParams() as { id: string };
  const firestore = useFirestore();
  const { user } = useUser();

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
        <CustomerInfoCard customer={customer} />
        <div className="print:hidden">
            <CustomerAiSummary customer={customer} proposals={proposals || []} />
        </div>
        <CustomerFinancialSummary proposals={proposals || []} />
        <Card>
            <CardHeader>
                <CardTitle>Histórico de Propostas</CardTitle>
            </CardHeader>
            <CardContent>
                <SimpleProposalsTable proposals={proposals || []} />
            </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
