
'use client';

import React, { useState, useEffect } from 'react';
import { AppLayout } from '@/components/app-layout';
import { PageHeader } from '@/components/page-header';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
    PlusCircle, 
    NotebookTabs, 
    Newspaper, 
    Building2, 
    Link as LinkIcon, 
    ExternalLink, 
    Trash2, 
    Edit, 
    Globe,
    Loader2,
    Calendar,
    Lock,
    Eye,
    Landmark,
    ChevronDown,
    ChevronUp,
    ShieldCheck,
    PhoneCall,
    Headset,
    EyeOff,
    Mail,
    Copy,
    Hash,
    User as UserIcon,
    Clock,
    Download,
    Video as VideoIcon,
    FileText,
    ImageIcon,
    PlayCircle
} from 'lucide-react';
import { useUser, useFirestore, useCollection, useMemoFirebase, errorEmitter, FirestorePermissionError } from '@/firebase';
import { collection, query, where, doc, setDoc, deleteDoc, orderBy } from 'firebase/firestore';
import { toast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { NewsForm } from './news-form';
import { PromoterForm } from './promoter-form';
import { BankForm } from './bank-form';
import { QuickLinkForm } from './quick-link-form';
import { decryptPassword } from '@/lib/crypto-utils';
import { format, parseISO, isAfter, startOfDay } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { cn, cleanFirestoreData, isWhatsApp, getWhatsAppUrl, getSafeStorageUrl } from '@/lib/utils';
import { WhatsAppIcon } from '@/components/icons/whatsapp-icon';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';

const CopyButton = ({ text, label }: { text?: string; label: string }) => {
    if (!text) return null;
    const handleCopy = (e: React.MouseEvent) => {
        e.stopPropagation();
        navigator.clipboard.writeText(text);
        toast({ title: `${label} copiado!` });
    };
    return (
        <Button variant="ghost" size="icon" className="h-6 w-6 opacity-40 hover:opacity-100 transition-opacity" onClick={handleCopy}>
            <Copy className="h-3.5 w-3.5" />
        </Button>
    );
};

export default function ManagementPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const [activeTab, setActiveTab] = useState('news');
  const [isMounted, setIsMounted] = useState(false);
  
  const [isNewsModalOpen, setIsNewsModalOpen] = useState(false);
  const [isReadingNewsModalOpen, setIsReadingNewsModalOpen] = useState(false);
  const [isPromoterModalOpen, setIsPromoterModalOpen] = useState(false);
  const [isBankModalOpen, setIsBankModalOpen] = useState(false);
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{ path: string, id: string } | null>(null);

  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [selectedPromoterId, setSelectedPromoterId] = useState<string | null>(null);
  const [expandedPromoter, setExpandedPromoter] = useState<string | null>(null);
  const [decryptedPasswords, setDecryptedPasswords] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const newsQuery = useMemoFirebase(() => query(collection(firestore!, 'managementNews'), orderBy('date', 'desc')), []);
  const linksQuery = useMemoFirebase(() => query(collection(firestore!, 'managementQuickLinks'), orderBy('name', 'asc')), []);
  const promotersQuery = useMemoFirebase(() => user ? query(collection(firestore!, 'managementPromoters'), where('ownerId', '==', user.uid)) : null, [user]);

  const { data: rawNews, isLoading: loadingNews } = useCollection(newsQuery);
  const { data: promoters, isLoading: loadingPromoters } = useCollection(promotersQuery);
  const { data: links, isLoading: loadingLinks } = useCollection(linksQuery);

  const [bankLogins, setBankLogins] = useState<any[]>([]);
  const [loadingLogins, setLoadingLogins] = useState(false);

  const sortedPromoters = React.useMemo(() => {
      if (!promoters) return [];
      return [...promoters].sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  }, [promoters]);

  const news = React.useMemo(() => {
    if (!rawNews || !isMounted) return [];
    const today = startOfDay(new Date());
    
    return rawNews.filter(item => {
        if (!item.expirationDate) return true;
        try {
            const expDate = startOfDay(parseISO(item.expirationDate));
            return !isAfter(today, expDate);
        } catch (e) {
            return true;
        }
    });
  }, [rawNews, isMounted]);

  useEffect(() => {
    setDecryptedPasswords({});
    
    if (expandedPromoter && user) {
        setLoadingLogins(true);
        const loginsRef = collection(firestore!, 'managementPromoters', expandedPromoter, 'bankLogins');
        const q = query(loginsRef, where('ownerId', '==', user.uid));
        const getLogins = async () => {
            const { getDocs } = await import('firebase/firestore');
            const snap = await getDocs(q);
            setBankLogins(snap.docs.map(d => ({ ...d.data(), id: d.id })));
            setLoadingLogins(false);
        };
        getLogins();
    } else {
        setBankLogins([]);
    }
  }, [expandedPromoter, user, firestore]);

  const handleSave = (collectionName: string, data: any, id?: string) => {
    if (!user || !firestore) return;
    setIsSaving(true);
    const docId = id || doc(collection(firestore, collectionName)).id;
    const docRef = doc(firestore, collectionName, docId);
    const finalData = cleanFirestoreData({ ...data, id: docId, ownerId: user.uid });

    setDoc(docRef, finalData, { merge: true })
        .then(() => {
            toast({ title: 'Salvo com sucesso!' });
            closeModals();
        })
        .catch(async (e) => {
            console.error("🔥 Erro Crítico ao Salvar:", e);
            toast({ title: 'Falha no Banco de Dados', description: e.message || 'Erro gravando informações.', variant: 'destructive' });
            errorEmitter.emit('permission-error', new FirestorePermissionError({
                path: docRef.path,
                operation: 'write',
                requestResourceData: finalData
            }));
        })
        .finally(() => setIsSaving(false));
  };

  const handleSaveBank = (data: any, id?: string) => {
    if (!user || !selectedPromoterId || !firestore) return;
    setIsSaving(true);
    const docId = id || doc(collection(firestore, 'managementPromoters', selectedPromoterId, 'bankLogins')).id;
    const docRef = doc(firestore, 'managementPromoters', selectedPromoterId, 'bankLogins', docId);
    const finalData = cleanFirestoreData({ ...data, id: docId, ownerId: user.uid });

    setDoc(docRef, finalData, { merge: true })
        .then(() => {
            toast({ title: 'Login Protegido!' });
            if (expandedPromoter === selectedPromoterId) {
                setBankLogins(prev => {
                    const filtered = prev.filter(b => b.id !== docId);
                    return [...filtered, { ...data, id: docId, ownerId: user.uid }];
                });
            }
            closeModals();
        })
        .catch(async (e) => {
            console.error("🔥 Erro Crítico ao Salvar Banco:", e);
            toast({ title: 'Falha no Banco de Dados', description: e.message || 'Erro gravando dados bancários.', variant: 'destructive' });
            errorEmitter.emit('permission-error', new FirestorePermissionError({
                path: docRef.path,
                operation: 'write',
                requestResourceData: finalData
            }));
        })
        .finally(() => setIsSaving(false));
  };

  const handleDelete = () => {
    if (!firestore || !itemToDelete) return;
    setIsSaving(true);
    const docRef = doc(firestore, itemToDelete.path, itemToDelete.id);
    deleteDoc(docRef)
        .then(() => {
            toast({ title: 'Item removido com sucesso!' });
            setDeleteConfirmOpen(false);
            setItemToDelete(null);
        })
        .catch(async (e) => {
            errorEmitter.emit('permission-error', new FirestorePermissionError({
                path: docRef.path,
                operation: 'delete'
            }));
        })
        .finally(() => setIsSaving(false));
  };

  const handleShowPassword = async (bankId: string, encrypted: string) => {
    if (decryptedPasswords[bankId]) {
        setDecryptedPasswords(prev => {
            const next = { ...prev };
            delete next[bankId];
            return next;
        });
        return;
    }
    if (!user) return;
    const decrypted = await decryptPassword(encrypted, user.uid);
    setDecryptedPasswords(prev => ({ ...prev, [bankId]: decrypted }));
  };

  const closeModals = () => {
    setIsNewsModalOpen(false);
    setIsReadingNewsModalOpen(false);
    setIsPromoterModalOpen(false);
    setIsBankModalOpen(false);
    setIsLinkModalOpen(false);
    setSelectedItem(null);
  };

  const handleDownload = (url: string, name: string) => {
    // 🛡️ PROTEÇÃO DE DOWNLOAD: Garante que o userProject vá na URL
    window.open(getSafeStorageUrl(url), '_blank');
    toast({ title: "Iniciando download...", description: name });
  };

  const openNewsReader = (item: any) => {
    setSelectedItem(item);
    setIsReadingNewsModalOpen(true);
  };

  return (
    <AppLayout>
      <PageHeader title="Gestão & Notícias" />
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
        <TabsList className="bg-muted/30 p-1.5 h-14 rounded-full border border-border/50 flex w-fit gap-2">
            <TabsTrigger value="news" className="rounded-full px-8 gap-2 data-[state=active]:bg-primary data-[state=active]:text-white font-black uppercase text-[10px] tracking-widest"><Newspaper className="h-4 w-4" /> Notícias</TabsTrigger>
            <TabsTrigger value="promoters" className="rounded-full px-8 gap-2 data-[state=active]:bg-primary data-[state=active]:text-white font-black uppercase text-[10px] tracking-widest"><Building2 className="h-4 w-4" /> Promotoras</TabsTrigger>
            <TabsTrigger value="links" className="rounded-full px-8 gap-2 data-[state=active]:bg-primary data-[state=active]:text-white font-black uppercase text-[10px] tracking-widest"><LinkIcon className="h-4 w-4" /> Links Úteis</TabsTrigger>
        </TabsList>

        <TabsContent value="news" className="space-y-6 animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
                <div className="space-y-1">
                    <h2 className="text-xl font-black uppercase tracking-tight">Mural do Correspondente</h2>
                    <p className="text-xs text-muted-foreground">Conteúdo compartilhado para toda a equipe.</p>
                </div>
                <Button onClick={() => { setSelectedItem(null); setIsNewsModalOpen(true); }} className="rounded-full bg-primary font-bold shadow-lg gap-2 h-11 px-8" disabled={isSaving}>
                    <PlusCircle className="h-4 w-4" /> Criar Notícia
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {loadingNews ? (
                    Array.from({ length: 3 }).map((_, i) => <Card key={i} className="h-64 animate-pulse bg-muted" />)
                ) : !news || news.length === 0 ? (
                    <div className="col-span-full py-20 text-center border-2 border-dashed rounded-[2rem] bg-muted/5 opacity-40">
                        <Newspaper className="h-12 w-12 mx-auto mb-4" />
                        <p className="font-black uppercase tracking-widest text-xs">Nenhuma notícia publicada ainda.</p>
                    </div>
                ) : (
                    news.map((item) => (
                        <Card key={item.id} className="group overflow-hidden border-2 hover:border-primary/40 transition-all flex flex-col shadow-sm relative cursor-pointer" onClick={() => openNewsReader(item)}>
                            <div className="h-48 overflow-hidden relative bg-muted flex items-center justify-center">
                                {item.coverUrl ? (
                                    <img 
                                        src={getSafeStorageUrl(item.coverUrl)} 
                                        alt={item.title}
                                        className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-500"
                                    />
                                ) : (
                                    <div className="p-6 w-full h-full bg-primary/5 flex items-center justify-center text-center overflow-hidden">
                                        <p className="text-[11px] text-muted-foreground font-medium leading-relaxed italic line-clamp-6">
                                            {item.content}
                                        </p>
                                    </div>
                                )}
                                <div className="absolute top-3 right-3 flex gap-2 z-10">
                                    {item.expirationDate && (
                                        <Badge className="bg-orange-600 text-white font-black text-[8px] uppercase gap-1 shadow-md">
                                            <Clock className="h-2.5 w-2.5" /> Expira: {format(parseISO(item.expirationDate), 'dd/MM')}
                                        </Badge>
                                    )}
                                    <Badge className={cn("font-black text-[8px] uppercase shadow-md", item.status === 'Published' ? "bg-green-600" : "bg-orange-500")}>
                                        {item.status === 'Published' ? 'Publicado' : 'Rascunho'}
                                    </Badge>
                                </div>
                                {item.ownerId === user?.uid && (
                                    <Button 
                                        variant="destructive" 
                                        size="icon" 
                                        className="absolute top-3 left-3 h-8 w-8 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg z-10"
                                        onClick={(e) => { e.stopPropagation(); setItemToDelete({ path: 'managementNews', id: item.id }); setDeleteConfirmOpen(true); }}
                                        title="Excluir Notícia"
                                        disabled={isSaving}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                )}
                            </div>
                            <CardHeader className="p-5 flex-1">
                                <p className="text-[10px] font-black uppercase text-primary/60 tracking-widest flex items-center gap-2 mb-2">
                                    <Calendar className="h-3 w-3" /> {item.date ? format(parseISO(item.date), 'dd/MM/yyyy') : '--/--/----'}
                                </p>
                                <CardTitle className="text-base font-black uppercase leading-tight line-clamp-2">{item.title}</CardTitle>
                                <CardDescription className="text-xs line-clamp-3 mt-2 font-medium leading-relaxed">{item.subtitle}</CardDescription>
                            </CardHeader>
                            <CardContent className="p-5 pt-0 flex gap-2" onClick={(e) => e.stopPropagation()}>
                                {item.ownerId === user?.uid && (
                                    <Button variant="outline" size="sm" className="rounded-full font-bold text-[10px] uppercase h-9 w-10 px-0 shrink-0" onClick={() => { setSelectedItem(item); setIsNewsModalOpen(true); }} disabled={isSaving}>
                                        <Edit className="h-3.5 w-3.5" />
                                    </Button>
                                )}
                                <Button variant="secondary" size="sm" className="rounded-full text-[10px] font-bold uppercase flex-1 h-9" onClick={() => openNewsReader(item)}>Ler Conteúdo</Button>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>
        </TabsContent>

        <TabsContent value="promoters" className="space-y-6 animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
                <div className="space-y-1">
                    <h2 className="text-xl font-black uppercase tracking-tight text-blue-600">Parceiros & Promotoras</h2>
                    <p className="text-xs text-muted-foreground">Contatos, códigos e senhas blindadas por parceiro.</p>
                </div>
                <Button onClick={() => { setSelectedItem(null); setIsPromoterModalOpen(true); }} className="rounded-full bg-blue-600 hover:bg-blue-700 font-bold shadow-lg gap-2 h-11 px-8" disabled={isSaving}>
                    <PlusCircle className="h-4 w-4" /> Nova Promotora
                </Button>
            </div>

            <div className="space-y-6">
                {sortedPromoters?.map((promoter) => {
                    const isSupportWhatsApp = promoter.supportPhone && isWhatsApp(promoter.supportPhone);
                    
                    return (
                        <Card key={promoter.id} className="border-2 overflow-hidden shadow-sm hover:shadow-md transition-all">
                            <div 
                                className={cn(
                                    "p-8 flex items-center justify-between cursor-pointer hover:bg-muted/50 transition-colors",
                                    expandedPromoter === promoter.id && "bg-blue-50/20 border-b-2"
                                )}
                                onClick={() => setExpandedPromoter(expandedPromoter === promoter.id ? null : promoter.id)}
                            >
                                <div className="flex items-center gap-8">
                                    <Avatar className="h-16 w-16 rounded-2xl border-2 border-primary/10 shadow-sm">
                                        <AvatarImage src={getSafeStorageUrl(promoter.photoURL)} />
                                        <AvatarFallback className="bg-blue-100 text-blue-600 font-black">
                                            <Building2 className="h-8 w-8" />
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-3">
                                            <h3 className="font-black uppercase text-lg tracking-tight truncate">{promoter.name}</h3>
                                            {promoter.partnerCode && (
                                                <div className="flex items-center gap-1.5 animate-in zoom-in-95">
                                                    <Badge variant="outline" className="h-6 px-3 text-[10px] font-mono font-black border-blue-200 text-blue-600 bg-blue-50 uppercase">ID: {promoter.partnerCode}</Badge>
                                                    <CopyButton text={promoter.partnerCode} label="Código Parceiro" />
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex flex-wrap gap-x-8 gap-y-3 text-[11px] font-bold text-muted-foreground uppercase mt-3">
                                            <div className="flex items-center gap-2 min-w-0">
                                                <UserIcon className="h-4 w-4 text-blue-500 shrink-0" /> 
                                                <span className="truncate">Gerente: {promoter.contactName || '---'}</span>
                                                {promoter.whatsapp && (
                                                    <div className="flex items-center gap-1.5">
                                                        <a 
                                                            href={getWhatsAppUrl(promoter.whatsapp)} 
                                                            target="_blank" 
                                                            rel="noopener noreferrer" 
                                                            className="text-[#25D366] hover:scale-125 transition-transform flex items-center" 
                                                            onClick={(e) => e.stopPropagation()}
                                                        >
                                                            <WhatsAppIcon className="h-4 w-4" />
                                                        </a>
                                                        <CopyButton text={promoter.whatsapp} label="WhatsApp" />
                                                    </div>
                                                )}
                                                {promoter.managerEmail && (
                                                    <div className="flex items-center gap-1.5 border-l pl-3 ml-1.5">
                                                        <Mail className="h-3.5 w-3.5 text-blue-400" />
                                                        <span className="lowercase font-medium">{promoter.managerEmail}</span>
                                                        <CopyButton text={promoter.managerEmail} label="E-mail Gerente" />
                                                    </div>
                                                )}
                                            </div>

                                            <div className="flex items-center gap-2 min-w-0">
                                                <Headset className="h-4 w-4 text-blue-500 shrink-0" /> 
                                                <span className="truncate">Suporte: {promoter.supportPhone || '---'}</span>
                                                {promoter.supportPhone && (
                                                    <div className="flex items-center gap-1.5">
                                                        {isSupportWhatsApp && (
                                                            <a 
                                                                href={getWhatsAppUrl(promoter.supportPhone)} 
                                                                target="_blank" 
                                                                rel="noopener noreferrer" 
                                                                className="text-[#25D366] hover:scale-125 transition-transform flex items-center" 
                                                                onClick={(e) => e.stopPropagation()}
                                                            >
                                                                <WhatsAppIcon className="h-4 w-4" />
                                                            </a>
                                                        )}
                                                        <CopyButton text={promoter.supportPhone} label="Suporte" />
                                                    </div>
                                                )}
                                            </div>

                                            {promoter.email && (
                                                <div className="flex items-center gap-2 min-w-0">
                                                    <Mail className="h-4 w-4 text-blue-500 shrink-0" />
                                                    <span className="truncate">Institucional: {promoter.email}</span>
                                                    <CopyButton text={promoter.email} label="E-mail" />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full" onClick={(e) => { e.stopPropagation(); setSelectedItem(promoter); setIsPromoterModalOpen(true); }} disabled={isSaving}><Edit className="h-5 w-5" /></Button>
                                    <Button variant="ghost" size="icon" className="h-10 w-10 text-red-500 rounded-full" onClick={(e) => { e.stopPropagation(); setItemToDelete({ path: 'managementPromoters', id: promoter.id }); setDeleteConfirmOpen(true); }} disabled={isSaving}><Trash2 className="h-5 w-5" /></Button>
                                    {expandedPromoter === promoter.id ? <ChevronUp className="h-6 w-6 text-muted-foreground" /> : <ChevronDown className="h-6 w-6 text-muted-foreground" />}
                                </div>
                            </div>

                            {expandedPromoter === promoter.id && (
                                <div className="p-8 bg-muted/10 space-y-8 animate-in slide-in-from-top-2 duration-300">
                                    <div className="flex items-center justify-between border-b pb-5">
                                        <h4 className="text-[11px] font-black uppercase tracking-[0.25em] text-muted-foreground flex items-center gap-2.5">
                                            <Lock className="h-4 w-4" /> Logins Bancários Blindados
                                        </h4>
                                        <Button size="sm" variant="outline" className="rounded-full h-9 px-5 font-bold text-[11px] uppercase gap-2 border-primary/20 text-primary" onClick={() => { setSelectedPromoterId(promoter.id); setSelectedItem(null); setIsBankModalOpen(true); }} disabled={isSaving}>
                                            <PlusCircle className="h-4 w-4" /> Vincular Login
                                        </Button>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                                        {loadingLogins ? (
                                            <div className="col-span-full flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
                                        ) : bankLogins.length === 0 ? (
                                            <div className="col-span-full py-12 text-center border-2 border-dashed rounded-2xl opacity-30 text-[11px] font-black uppercase tracking-widest">Nenhum login cadastrado.</div>
                                        ) : (
                                            bankLogins.map((bank) => (
                                                <Card key={bank.id} className="bg-background border-2 shadow-sm p-5 space-y-5 group/bank">
                                                    <div className="flex justify-between items-start">
                                                        <div className="flex items-center gap-2.5">
                                                            <Landmark className="h-5 w-5 text-primary" />
                                                            <span className="font-black text-xs uppercase truncate max-w-[140px]">{bank.bankName}</span>
                                                        </div>
                                                        <div className="flex gap-1.5 opacity-0 group-hover/bank:opacity-100 transition-opacity">
                                                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setSelectedPromoterId(promoter.id); setSelectedItem(bank); setIsBankModalOpen(true); }} disabled={isSaving}><Edit className="h-4 w-4" /></Button>
                                                            <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500" onClick={() => { setItemToDelete({ path: `managementPromoters/${promoter.id}/bankLogins`, id: bank.id }); setDeleteConfirmOpen(true); }} disabled={isSaving}><Trash2 className="h-4 w-4" /></Button>
                                                        </div>
                                                    </div>
                                                    <div className="space-y-3 bg-muted/20 p-4 rounded-xl border">
                                                        <div className="flex flex-col">
                                                            <span className="text-[9px] font-black uppercase text-muted-foreground tracking-tight">Usuário</span>
                                                            <div className="flex items-center justify-between mt-0.5">
                                                                <span className="text-xs font-bold select-all">{bank.login}</span>
                                                                <CopyButton text={bank.login} label="Login" />
                                                            </div>
                                                        </div>
                                                        <div className="flex flex-col relative">
                                                            <span className="text-[9px] font-black uppercase text-muted-foreground tracking-tight">Senha AES-256</span>
                                                            <div className="flex items-center gap-2.5 mt-0.5">
                                                                <span className="text-xs font-mono tracking-widest flex-1">
                                                                    {decryptedPasswords[bank.id] ? decryptedPasswords[bank.id] : '••••••••'}
                                                                </span>
                                                                <div className="flex items-center gap-1.5">
                                                                    <button onClick={() => handleShowPassword(bank.id, bank.password)} className="text-primary hover:scale-110 transition-transform" disabled={isSaving}>
                                                                        {decryptedPasswords[bank.id] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                                                    </button>
                                                                    {decryptedPasswords[bank.id] && <CopyButton text={decryptedPasswords[bank.id]} label="Senha" />}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    {bank.accessUrl && (
                                                        <Button variant="secondary" className="w-full h-9 rounded-full text-[10px] font-black uppercase gap-2 tracking-widest" asChild>
                                                            <a href={bank.accessUrl} target="_blank" rel="noopener noreferrer"><ExternalLink className="h-3.5 w-3.5" /> Abrir Sistema</a>
                                                        </Button>
                                                    )}
                                                </Card>
                                            ))
                                        )}
                                    </div>
                                </div>
                            )}
                        </Card>
                    );
                })}
            </div>
        </TabsContent>

        <TabsContent value="links" className="space-y-6 animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
                <div className="space-y-1">
                    <h2 className="text-xl font-black uppercase tracking-tight text-emerald-600">Área de Links Rápidos</h2>
                    <p className="text-xs text-muted-foreground">Atalhos compartilhados para agilizar o acesso.</p>
                </div>
                <Button onClick={() => { setSelectedItem(null); setIsLinkModalOpen(true); }} className="rounded-full bg-emerald-600 hover:bg-emerald-700 font-bold shadow-lg gap-2 h-11 px-8" disabled={isSaving}>
                    <PlusCircle className="h-4 w-4" /> Novo Atalho
                </Button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {links?.map((link) => (
                    <div key={link.id} className="relative group">
                        <a 
                            href={link.url} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="flex flex-col items-center justify-center p-6 bg-card border-2 rounded-2xl hover:border-emerald-500 hover:bg-emerald-50/30 transition-all text-center gap-3 shadow-sm h-32"
                        >
                            <div className="h-10 w-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                                <Globe className="h-5 w-5" />
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-tight leading-tight line-clamp-2">{link.name}</span>
                        </a>
                        {link.ownerId === user?.uid && (
                            <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => { setSelectedItem(link); setIsLinkModalOpen(true); }} className="p-1.5 bg-white shadow rounded-full text-muted-foreground hover:text-primary" disabled={isSaving}><Edit className="h-3 w-3" /></button>
                                <button onClick={() => { setItemToDelete({ path: 'managementQuickLinks', id: link.id }); setDeleteConfirmOpen(true); }} className="p-1.5 bg-white shadow rounded-full text-red-500 hover:text-red-600" disabled={isSaving}><Trash2 className="h-3 w-3" /></button>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </TabsContent>
      </Tabs>

      {/* MODAL DE EDIÇÃO/CRIAÇÃO DE NOTÍCIA */}
      <Dialog open={isNewsModalOpen} onOpenChange={setIsNewsModalOpen}>
        <DialogContent className="max-w-4xl h-[90vh] overflow-hidden flex flex-col rounded-[2.5rem] p-0" onPointerDownOutside={(e) => e.preventDefault()} onInteractOutside={(e) => e.preventDefault()}>
            <DialogHeader className="px-8 pt-8 pb-4 shrink-0 border-b">
                <DialogTitle className="text-xl font-black uppercase tracking-tight flex items-center gap-2">
                    <Newspaper className="h-5 w-5 text-primary" />
                    {selectedItem ? 'Editar Publicação' : 'Criar Nova Notícia'}
                </DialogTitle>
                <DialogDescription>Preencha os campos para publicar uma atualização no mural da equipe.</DialogDescription>
            </DialogHeader>
            <div className="flex-1 overflow-hidden px-8 py-4">
                <NewsForm initialData={selectedItem} onSubmit={(d) => handleSave('managementNews', d, selectedItem?.id)} isSaving={isSaving} />
            </div>
        </DialogContent>
      </Dialog>

      {/* MODAL DE LEITURA DE NOTÍCIA (READER) */}
      <Dialog open={isReadingNewsModalOpen} onOpenChange={setIsReadingNewsModalOpen}>
        <DialogContent className="max-w-4xl h-[90vh] overflow-hidden flex flex-col rounded-[2.5rem] p-0">
            {selectedItem && (
                <>
                    <DialogHeader className="px-8 pt-8 pb-4 shrink-0 border-b bg-muted/5">
                        <div className="flex items-center gap-3 mb-2">
                            <Badge className="bg-primary font-black text-[8px] uppercase tracking-widest">Informativo</Badge>
                            <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{format(parseISO(selectedItem.date), 'dd/MM/yyyy')}</span>
                        </div>
                        <DialogTitle className="text-2xl font-black uppercase tracking-tight leading-tight">{selectedItem.title}</DialogTitle>
                        <DialogDescription className="text-sm text-muted-foreground font-medium mt-1">{selectedItem.subtitle}</DialogDescription>
                    </DialogHeader>
                    <ScrollArea className="flex-1 px-8 py-8">
                        <div className="space-y-10 max-w-3xl mx-auto pb-20">
                            {selectedItem.coverUrl && (
                                <div className="relative w-full aspect-[16/9] max-w-[85%] mx-auto">
                                    <img 
                                        src={getSafeStorageUrl(selectedItem.coverUrl)} 
                                        alt={selectedItem.title}
                                        className="w-full h-full object-contain rounded-3xl shadow-xl border-4 border-white bg-white"
                                    />
                                </div>
                            )}

                            <div className="prose prose-zinc dark:prose-invert max-w-none">
                                <p className="text-base leading-relaxed whitespace-pre-wrap font-medium text-foreground/80">
                                    {selectedItem.content}
                                </p>
                            </div>

                            {/* SEÇÃO DE MÍDIAS (VÍDEOS E IMAGENS) */}
                            {selectedItem.attachments && selectedItem.attachments.length > 0 && (
                                <div className="space-y-8 pt-10 border-t border-border/50">
                                    <h4 className="text-xs font-black uppercase tracking-[0.2em] text-primary/60 flex items-center gap-2">
                                        <PlayCircle className="h-4 w-4" /> Mídias & Documentos
                                    </h4>
                                    
                                    <div className="grid grid-cols-1 gap-8">
                                        {/* EXIBIÇÃO DE VÍDEOS */}
                                        {selectedItem.attachments.filter((a: any) => a.type.startsWith('video/')).map((video: any, idx: number) => (
                                            <div key={idx} className="space-y-3">
                                                <div className="rounded-3xl overflow-hidden shadow-2xl border-4 border-background aspect-video bg-black">
                                                    <video src={getSafeStorageUrl(video.url)} controls className="w-full h-full" />
                                                </div>
                                                <p className="text-[10px] font-black uppercase text-center text-muted-foreground">{video.name}</p>
                                            </div>
                                        ))}

                                        {/* EXIBIÇÃO DE IMAGENS */}
                                        <div className="grid grid-cols-2 gap-4">
                                            {selectedItem.attachments.filter((a: any) => a.type.startsWith('image/')).map((img: any, idx: number) => (
                                                <div key={idx} className="relative aspect-video w-full cursor-zoom-in" onClick={() => window.open(getSafeStorageUrl(img.url), '_blank')}>
                                                    <img 
                                                        src={getSafeStorageUrl(img.url)} 
                                                        alt="Anexo"
                                                        className="w-full h-full object-cover rounded-2xl shadow-md border-2 border-white hover:scale-[1.02] transition-transform"
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* LISTA DE DOWNLOADS (PDF E OUTROS) */}
                                    <div className="space-y-3 pt-4">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Arquivos para Download</p>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                            {selectedItem.attachments.map((file: any, idx: number) => (
                                                <div key={idx} className="p-4 bg-muted/20 border-2 border-transparent hover:border-primary/20 rounded-2xl flex items-center justify-between group transition-all">
                                                    <div className="flex items-center gap-3 overflow-hidden">
                                                        {file.type.startsWith('image/') ? (
                                                            <ImageIcon className="h-5 w-5 text-blue-500 shrink-0" />
                                                        ) : file.type.startsWith('video/') ? (
                                                            <VideoIcon className="h-5 w-5 text-purple-500 shrink-0" />
                                                        ) : (
                                                            <FileText className="h-5 w-5 text-red-500 shrink-0" />
                                                        )}
                                                        <div className="flex flex-col overflow-hidden">
                                                            <span className="text-[11px] font-black truncate uppercase tracking-tight">{file.name}</span>
                                                            <span className="text-[9px] font-bold text-muted-foreground">Clique para baixar</span>
                                                        </div>
                                                    </div>
                                                    <Button 
                                                        variant="ghost" 
                                                        size="icon" 
                                                        className="rounded-full h-10 w-10 bg-background shadow-sm hover:bg-primary hover:text-white transition-all"
                                                        onClick={() => handleDownload(file.url, file.name)}
                                                    >
                                                        <Download className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {selectedItem.externalLink && (
                                <div className="pt-6">
                                    <Button className="w-full rounded-2xl h-14 font-black uppercase text-xs tracking-widest gap-2" asChild>
                                        <a href={selectedItem.externalLink} target="_blank" rel="noopener noreferrer">
                                            <ExternalLink className="h-4 w-4" /> Acessar Link Externo Oficial
                                        </a>
                                    </Button>
                                </div>
                            )}
                        </div>
                    </ScrollArea>
                    <DialogFooter className="p-6 border-t bg-muted/5">
                        <Button variant="outline" className="rounded-full px-8 font-bold" onClick={() => setIsReadingNewsModalOpen(false)}>Fechar Leitura</Button>
                    </DialogFooter>
                </>
            )}
        </DialogContent>
      </Dialog>

      <Dialog open={isPromoterModalOpen} onOpenChange={setIsPromoterModalOpen}>
        <DialogContent className="max-md max-h-[90vh] overflow-hidden flex flex-col rounded-[2rem] p-0" onPointerDownOutside={(e) => e.preventDefault()} onInteractOutside={(e) => e.preventDefault()}>
            <DialogHeader className="px-6 pt-6 pb-2 shrink-0">
                <DialogTitle className="text-xl font-black uppercase tracking-tight">
                    {selectedItem ? 'Editar Promotora' : 'Nova Promotora'}
                </DialogTitle>
                <DialogDescription>Gerencie contatos e informações técnicas deste parceiro comercial.</DialogDescription>
            </DialogHeader>
            <ScrollArea className="flex-1 px-6 py-2">
                <PromoterForm initialData={selectedItem} onSubmit={(d) => handleSave('managementPromoters', d, selectedItem?.id)} isSaving={isSaving} />
            </ScrollArea>
        </DialogContent>
      </Dialog>

      <Dialog open={isBankModalOpen} onOpenChange={setIsBankModalOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-hidden flex flex-col rounded-[2rem] p-0" onPointerDownOutside={(e) => e.preventDefault()} onInteractOutside={(e) => e.preventDefault()}>
            <DialogHeader className="px-6 pt-6 pb-2 shrink-0">
                <DialogTitle className="text-xl font-black uppercase tracking-tight">
                    {selectedItem ? 'Editar Login' : 'Vincular Banco'}
                </DialogTitle>
                <DialogDescription>Cadastre credenciais blindadas para acesso rápido aos sistemas bancários.</DialogDescription>
            </DialogHeader>
            <ScrollArea className="flex-1 px-6 py-2">
                <BankForm initialData={selectedItem} onSubmit={(d) => handleSaveBank(d, selectedItem?.id)} isSaving={isSaving} />
            </ScrollArea>
        </DialogContent>
      </Dialog>

      <Dialog open={isLinkModalOpen} onOpenChange={setIsLinkModalOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-hidden flex flex-col rounded-[2rem] p-0" onPointerDownOutside={(e) => e.preventDefault()} onInteractOutside={(e) => e.preventDefault()}>
            <DialogHeader className="px-6 pt-6 pb-2 shrink-0">
                <DialogTitle className="text-xl font-black uppercase tracking-tight">
                    {selectedItem ? 'Editar Atalho' : 'Novo Link'}
                </DialogTitle>
                <DialogDescription>Adicione um atalho rápido para sites e ferramentas externas.</DialogDescription>
            </DialogHeader>
            <ScrollArea className="flex-1 px-6 py-2">
                <QuickLinkForm initialData={selectedItem} onSubmit={(d) => handleSave('managementQuickLinks', d, selectedItem?.id)} isSaving={isSaving} />
            </ScrollArea>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                <AlertDialogDescription>Esta ação irá excluir permanentemente este item do sistema. Não é possível desfazer.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel disabled={isSaving}>Voltar</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90" disabled={isSaving}>
                    {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Confirmar Exclusão
                </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </AppLayout>
  );
}
