'use client';

import React from 'react';
import { AppLayout } from '@/components/app-layout';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ProfileForm } from './profile-form';
import { useFirebase, useFirestore, useDoc, useMemoFirebase, useCollection } from '@/firebase';
import { doc, setDoc, query, collection, where } from 'firebase/firestore';
import type { UserProfile, Proposal } from '@/lib/types';
import { toast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { updateEmail } from 'firebase/auth';
import { cleanFirestoreData, formatCurrency } from '@/lib/utils';
import { Trophy, Star, Crown, Medal, TrendingUp, Wallet, Share2, Copy, Mail, MessageSquareText, Check, Link as LinkIcon } from 'lucide-react';
import { startOfMonth, format, parseISO, isValid } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const RecordCard = ({ title, value, subValue, icon: Icon, colorClass }: any) => (
    <Card className="relative overflow-hidden border-2 bg-card/50 shadow-sm transition-all hover:scale-[1.02] hover:shadow-md">
        <div className={`absolute top-0 left-0 w-1 h-full ${colorClass}`} />
        <CardContent className="p-5 flex items-center gap-4">
            <div className={`p-3 rounded-2xl bg-muted/50 ${colorClass.replace('bg-', 'text-')}`}>
                <Icon className="h-6 w-6" />
            </div>
            <div className="space-y-0.5 overflow-hidden">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">{title}</p>
                <p className="text-xl font-black text-foreground truncate">{value}</p>
                {subValue && <p className="text-[9px] font-bold text-muted-foreground uppercase opacity-60 truncate">{subValue}</p>}
            </div>
        </CardContent>
    </Card>
);

export default function ProfilePage() {
    const { user, auth, isUserLoading } = useFirebase();
    const firestore = useFirestore();
    const [copiedType, setCopiedType] = React.useState<'email' | 'whatsapp' | 'leads' | null>(null);

    const userProfileDocRef = useMemoFirebase(() => {
        if (!user || !firestore) return null;
        return doc(firestore, 'users', user.uid);
    }, [firestore, user]);

    const proposalsQuery = useMemoFirebase(() => {
        if (!user || !firestore) return null;
        return query(collection(firestore, 'loanProposals'), where('ownerId', '==', user.uid));
    }, [firestore, user]);

    const { data: userProfile, isLoading: isProfileLoading } = useDoc<UserProfile>(userProfileDocRef);
    const { data: proposals, isLoading: isProposalsLoading } = useCollection<Proposal>(proposalsQuery);
    
    const achievements = React.useMemo(() => {
        if (!proposals) return null;

        const paidProposals = proposals.filter(p => p.status === 'Pago' || p.status === 'Saldo Pago');
        
        const biggestOne = [...paidProposals].sort((a,b) => (b.grossAmount || 0) - (a.grossAmount || 0))[0];
        const totalCommissions = proposals.reduce((sum, p) => sum + (p.amountPaid || 0), 0);
        const totalVolume = paidProposals.reduce((sum, p) => sum + (p.grossAmount || 0), 0);

        const monthlyStats: Record<string, { volume: number, label: string }> = {};
        paidProposals.forEach(p => {
            if (!p.datePaidToClient) return;
            const d = parseISO(p.datePaidToClient);
            if (!isValid(d)) return;
            const key = format(d, 'yyyy-MM');
            const ptBRMonth = format(d, 'MMMM/yyyy', { locale: ptBR });
            const label = ptBRMonth.charAt(0).toUpperCase() + ptBRMonth.slice(1);
            if (!monthlyStats[key]) monthlyStats[key] = { volume: 0, label };
            
            // Usa o valor total do contrato pago (grossAmount), ignorando comissão, netAmount ou não-pagos
            monthlyStats[key].volume += (p.grossAmount || 0);
        });

        const bestMonth = Object.values(monthlyStats).sort((a,b) => b.volume - a.volume)[0];

        return {
            biggest: biggestOne?.grossAmount || 0,
            biggestDate: biggestOne?.dateDigitized ? format(parseISO(biggestOne.dateDigitized), 'dd/MM/yyyy') : null,
            totalCommissions,
            totalVolume,
            bestMonth: bestMonth?.volume || 0,
            bestMonthLabel: bestMonth?.label || '---'
        };
    }, [proposals]);

    const handleProfileUpdate = async (data: Partial<UserProfile>) => {
        if (!user || !auth || !userProfileDocRef) {
             toast({
                variant: 'destructive',
                title: 'Erro de Autenticação',
                description: 'Não foi possível identificar o usuário. Por favor, faça login novamente.',
            });
            return;
        }

        const emailToUpdate = data.email?.trim();

        if (emailToUpdate && emailToUpdate !== user.email) {
            try {
                await updateEmail(user, emailToUpdate);
            } catch (error: any) {
                console.error("Error updating email:", error);
                let description = 'Ocorreu um erro ao tentar atualizar seu e-mail. Nenhuma informação foi salva.';
                if (error.code === 'auth/requires-recent-login') {
                    description = 'Para alterar seu e-mail, você precisa fazer login novamente. Por segurança, nenhuma outra informação foi alterada.';
                } else if (error.code === 'auth/email-already-in-use') {
                    description = 'Este e-mail já está em uso por outra conta. Nenhuma informação foi alterada.';
                }
                toast({
                    variant: 'destructive',
                    title: 'Falha na atualização do e-mail',
                    description: description,
                });
                return;
            }
        }
        
        try {
            const finalData = cleanFirestoreData({
                ...data,
                email: emailToUpdate || user.email
            });
            await setDoc(userProfileDocRef, finalData, { merge: true });
            toast({
                title: 'Perfil Atualizado!',
                description: 'Suas informações foram salvas com sucesso.',
            });
        } catch (error) {
            console.error("Error saving profile to Firestore:", error);
            toast({
                variant: 'destructive',
                title: 'Erro ao Salvar',
                description: 'Não foi possível salvar seu perfil. Tente novamente.',
            });
        }
    };

    const handleCopySignature = (type: 'email' | 'whatsapp' | 'leads') => {
        if (!userProfile || !user) return;
        
        if (type === 'leads') {
            const link = `${window.location.protocol}//${window.location.host}/enviar/${user.uid}`;
            navigator.clipboard.writeText(link);
            setCopiedType('leads');
            setTimeout(() => setCopiedType(null), 2000);
            toast({ title: "Link de Leads Copiado!", description: "Envie para seus clientes se cadastrarem." });
            return;
        }

        const name = userProfile.fullName || userProfile.displayName || "Agente LK RAMOS";
        const phone = userProfile.phone || "(00) 00000-0000";
        const email = userProfile.email;

        if (type === 'whatsapp') {
            const text = `*${name}*\n🔹 Agente de Crédito de Elite\n🏢 *LK RAMOS*\n📞 ${phone}\n✉️ ${email}\n🚀 _Soluções financeiras de alta performance._`;
            navigator.clipboard.writeText(text);
        } else {
            const text = `${name}\nAgente de Crédito de Elite | LK RAMOS\nTelefone: ${phone}\nE-mail: ${email}\nwww.lkramos.com.br`;
            navigator.clipboard.writeText(text);
        }

        setCopiedType(type);
        setTimeout(() => setCopiedType(null), 2000);
        toast({ title: "Assinatura Copiada!", description: "Pronto para colar onde desejar." });
    };

    const isLoading = isUserLoading || isProfileLoading || isProposalsLoading;

    return (
        <AppLayout>
            <div className="flex items-center justify-between mb-8">
                <PageHeader title="Meu Perfil" />
                <div className="flex items-center gap-2 bg-primary/5 px-4 py-2 rounded-full border border-primary/10">
                    <Crown className="h-4 w-4 text-primary animate-pulse" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-primary">Agente de Elite LK RAMOS</span>
                </div>
            </div>

            <div className="space-y-10 pb-20">
                {/* 🏆 HALL DA FAMA - RECORDES */}
                <div className="space-y-4">
                    <h3 className="text-sm font-black uppercase tracking-[0.25em] text-primary/60 flex items-center gap-2">
                        <Trophy className="h-4 w-4" /> Hall da Fama Profissional
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {isLoading ? (
                            Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 w-full rounded-xl" />)
                        ) : (
                            <>
                                <RecordCard 
                                    title="Maior Contrato Pago" 
                                    value={formatCurrency(achievements?.biggest || 0)} 
                                    subValue={achievements?.biggestDate ? `Batido em: ${achievements.biggestDate}` : "Aguardando recorde"}
                                    icon={Crown} 
                                    colorClass="bg-amber-500"
                                />
                                <RecordCard 
                                    title="Recorde de Produção Mensal" 
                                    value={formatCurrency(achievements?.bestMonth || 0)} 
                                    subValue={`Referência: ${achievements?.bestMonthLabel}`}
                                    icon={Star} 
                                    colorClass="bg-blue-500"
                                />
                                <RecordCard 
                                    title="Volume Total de Negócios" 
                                    value={formatCurrency(achievements?.totalVolume || 0)} 
                                    subValue="Somatória de operações pagas"
                                    icon={TrendingUp} 
                                    colorClass="bg-emerald-500"
                                />
                                <RecordCard 
                                    title="Comissões Acumuladas" 
                                    value={formatCurrency(achievements?.totalCommissions || 0)} 
                                    subValue="Ganho líquido total no sistema"
                                    icon={Wallet} 
                                    colorClass="bg-purple-500"
                                />
                            </>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* FORMULÁRIO DE PERFIL */}
                    <div className="lg:col-span-2 space-y-8">
                        <Card className="border-border/50 shadow-lg rounded-2xl overflow-hidden">
                            <CardHeader className="bg-muted/10 border-b border-border/50">
                                <CardTitle className="text-xl font-bold flex items-center gap-2">
                                    <Medal className="h-5 w-5 text-primary" />
                                    Informações Pessoais
                                </CardTitle>
                                <CardDescription>
                                    Gerencie suas informações de acesso e como você é exibido para a equipe.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="pt-8">
                                {isLoading ? (
                                    <div className="space-y-4">
                                        <div className="flex items-center space-x-4">
                                            <Skeleton className="h-24 w-24 rounded-full" />
                                            <div className="space-y-2">
                                                <Skeleton className="h-4 w-[250px]" />
                                                <Skeleton className="h-4 w-[200px]" />
                                            </div>
                                        </div>
                                        <Skeleton className="h-10 w-full" />
                                        <Skeleton className="h-10 w-full" />
                                        <Skeleton className="h-10 w-full" />
                                    </div>
                                ) : (
                                    <ProfileForm userProfile={userProfile} onSubmit={handleProfileUpdate} />
                                )}
                            </CardContent>
                        </Card>

                        {/* 🔗 PORTAL DE LEADS (ACESSO RÁPIDO NO PERFIL) */}
                        <Card className="border-primary/20 bg-primary/[0.02] shadow-lg rounded-2xl overflow-hidden">
                            <CardHeader className="pb-4">
                                <CardTitle className="text-lg font-black uppercase flex items-center gap-2 text-primary">
                                    <LinkIcon className="h-5 w-5" />
                                    Portal de Captura de Leads
                                </CardTitle>
                                <CardDescription className="text-[10px] font-bold uppercase tracking-widest">Seu link exclusivo para auto-cadastro do cliente</CardDescription>
                            </CardHeader>
                            <CardContent className="flex flex-col sm:flex-row items-center justify-between gap-4">
                                <div className="p-3 bg-white dark:bg-zinc-950 border-2 rounded-xl flex-1 w-full overflow-hidden">
                                    <p className="text-xs font-mono text-muted-foreground truncate">
                                        {user ? `${window.location.protocol}//${window.location.host}/enviar/${user.uid}` : 'Carregando link...'}
                                    </p>
                                </div>
                                <Button 
                                    onClick={() => handleCopySignature('leads')}
                                    className="rounded-full h-11 px-8 font-black uppercase text-[10px] tracking-widest bg-primary shadow-xl shadow-primary/20 shrink-0"
                                    disabled={!user}
                                >
                                    {copiedType === 'leads' ? <Check className="mr-2 h-4 w-4" /> : <Copy className="mr-2 h-4 w-4" />}
                                    Copiar Link de Envio
                                </Button>
                            </CardContent>
                        </Card>
                    </div>

                    {/* ✍️ GERADOR DE ASSINATURA */}
                    <div className="lg:col-span-1">
                        <Card className="border-primary/20 shadow-xl rounded-2xl overflow-hidden bg-primary/[0.02] h-full">
                            <CardHeader className="bg-primary/5 border-b border-primary/10">
                                <CardTitle className="text-lg font-black uppercase flex items-center gap-2 text-primary">
                                    <Share2 className="h-5 w-5" />
                                    Assinatura Digital
                                </CardTitle>
                                <CardDescription className="text-[10px] font-bold uppercase tracking-widest">Sua marca em todo lugar</CardDescription>
                            </CardHeader>
                            <CardContent className="pt-6 space-y-6">
                                <div className="p-6 bg-white dark:bg-zinc-950 rounded-2xl border-2 border-primary/10 shadow-inner relative overflow-hidden">
                                    <div className="absolute top-0 right-0 p-2 opacity-5">
                                        <Crown className="h-20 w-20" />
                                    </div>
                                    <div className="flex items-start gap-4">
                                        <Avatar className="h-16 w-16 border-2 border-primary/20">
                                            <AvatarImage src={userProfile?.photoURL || ''} />
                                            <AvatarFallback className="bg-primary/5 text-primary font-black uppercase text-xl">
                                                {userProfile?.displayName?.[0] || '..'}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="space-y-1">
                                            <h4 className="font-black text-sm uppercase tracking-tight text-primary">
                                                {userProfile?.fullName || userProfile?.displayName || "Agente LK RAMOS"}
                                            </h4>
                                            <p className="text-[9px] font-black uppercase text-muted-foreground tracking-widest">Agente de Crédito de Elite</p>
                                            <div className="h-0.5 w-10 bg-amber-500 rounded-full my-2" />
                                            <div className="space-y-0.5">
                                                <p className="text-[10px] font-bold text-foreground/80 flex items-center gap-1.5">
                                                    <Mail className="h-2.5 w-2.5 text-primary opacity-60" /> {userProfile?.email}
                                                </p>
                                                <p className="text-[10px] font-bold text-foreground/80 flex items-center gap-1.5">
                                                    <MessageSquareText className="h-2.5 w-2.5 text-primary opacity-60" /> {userProfile?.phone || "(00) 00000-0000"}
                                                </p>
                                            </div>
                                            <div className="pt-2">
                                                <p className="text-[8px] font-black text-primary uppercase tracking-[0.25em]">LK RAMOS INVESTIMENTOS</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 gap-2">
                                    <Button 
                                        variant="outline" 
                                        className="rounded-full h-11 font-black uppercase text-[10px] tracking-widest gap-2 border-2"
                                        onClick={() => handleCopySignature('email')}
                                    >
                                        {copiedType === 'email' ? <Check className="h-4 w-4 text-green-500" /> : <Mail className="h-4 w-4" />}
                                        Copiar para E-mail
                                    </Button>
                                    <Button 
                                        className="rounded-full h-11 font-black uppercase text-[10px] tracking-widest gap-2 bg-[#25D366] hover:bg-[#1eb954] text-white border-none shadow-lg shadow-green-500/20"
                                        onClick={() => handleCopySignature('whatsapp')}
                                    >
                                        {copiedType === 'whatsapp' ? <Check className="h-4 w-4" /> : <MessageSquareText className="h-4 w-4" />}
                                        Copiar para WhatsApp
                                    </Button>
                                </div>

                                <div className="p-4 rounded-xl bg-primary/5 border border-primary/10">
                                    <p className="text-[9px] text-muted-foreground leading-relaxed font-medium">
                                        <strong>Dica Profissional:</strong> Utilize a assinatura de WhatsApp na sua primeira mensagem de saudação para transmitir autoridade imediata.
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
