
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
    MessageSquareText,
    ChevronDown,
    ChevronUp,
    ShieldCheck,
    PhoneCall,
    Headset,
    EyeOff
} from 'lucide-react';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, doc, setDoc, deleteDoc, orderBy } from 'firebase/firestore';
import { toast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { NewsForm } from './news-form';
import { PromoterForm } from './promoter-form';
import { BankForm } from './bank-form';
import { QuickLinkForm } from './quick-link-form';
import { decryptPassword } from '@/lib/crypto-utils';
import { format, parseISO } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { cn, cleanFirestoreData } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';

export default function ManagementPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const [activeTab, setActiveTab] = useState('news');
  
  // Modals
  const [isNewsModalOpen, setIsNewsModalOpen] = useState(false);
  const [isPromoterModalOpen, setIsPromoterModalOpen] = useState(false);
  const [isBankModalOpen, setIsBankModalOpen] = useState(false);
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  
  // Data selection
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [selectedPromoterId, setSelectedPromoterId] = useState<string | null>(null);
  const [expandedPromoter, setExpandedPromoter] = useState<string | null>(null);
  const [decryptedPasswords, setDecryptedPasswords] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);

  // Firestore Queries
  // 🔓 COMPARTILHADO: Notícias e Links agora aparecem para TODOS (sem filtro de ownerId no read)
  const newsQuery = useMemoFirebase(() => query(collection(firestore!, 'managementNews'), orderBy('date', 'desc')), []);
  const linksQuery = useMemoFirebase(() => query(collection(firestore!, 'managementQuickLinks'), orderBy('name', 'asc')), []);
  
  // 🔒 PRIVADO: Promotoras permanecem individuais por segurança de senha
  const promotersQuery = useMemoFirebase(() => user ? query(collection(firestore!, 'managementPromoters'), where('ownerId', '==', user.uid), orderBy('name', 'asc')) : null, [user]);

  const { data: news, isLoading: loadingNews } = useCollection(newsQuery);
  const { data: promoters, isLoading: loadingPromoters } = useCollection(promotersQuery);
  const { data: links, isLoading: loadingLinks } = useCollection(linksQuery);

  const [bankLogins, setBankLogins] = useState<any[]>([]);
  const [loadingLogins, setLoadingLogins] = useState(false);

  useEffect(() => {
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

  const handleSave = async (collectionName: string, data: any, id?: string) => {
    if (!user) return;
    setIsSaving(true);
    try {
        const docId = id || doc(collection(firestore!, collectionName)).id;
        const docRef = doc(firestore!, collectionName, docId);
        await setDoc(docRef, cleanFirestoreData({ ...data, id: docId, ownerId: user.uid }), { merge: true });
        toast({ title: 'Salvo com sucesso!' });
        closeModals();
    } catch (e) {
        toast({ variant: 'destructive', title: 'Erro ao salvar' });
    } finally {
        setIsSaving(false);
    }
  };

  const handleSaveBank = async (data: any, id?: string) => {
    if (!user || !selectedPromoterId) return;
    setIsSaving(true);
    try {
        const docId = id || doc(collection(firestore!, 'managementPromoters', selectedPromoterId, 'bankLogins')).id;
        const docRef = doc(firestore!, 'managementPromoters', selectedPromoterId, 'bankLogins', docId);
        await setDoc(docRef, cleanFirestoreData({ ...data, id: docId, ownerId: user.uid }), { merge: true });
        toast({ title: 'Login Protegido!' });
        
        if (expandedPromoter === selectedPromoterId) {
            setBankLogins(prev => {
                const filtered = prev.filter(b => b.id !== docId);
                return [...filtered, { ...data, id: docId, ownerId: user.uid }];
            });
        }
        closeModals();
    } catch (e) {
        toast({ variant: 'destructive', title: 'Erro ao salvar login' });
    } finally {
        setIsSaving(false);
    }
  };

  const handleDelete = async (collectionPath: string, id: string) => {
    if (!firestore) return;
    try {
        await deleteDoc(doc(firestore, collectionPath, id));
        toast({ title: 'Item removido' });
    } catch (e) { toast({ variant: 'destructive', title: 'Erro ao excluir' }); }
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
    setIsPromoterModalOpen(false);
    setIsBankModalOpen(false);
    setIsLinkModalOpen(false);
    setSelectedItem(null);
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
                    <p className="text-xs text-muted-foreground">Conteúdo compartilhado para todos os usuários do sistema.</p>
                </div>
                <Button onClick={() => { setSelectedItem(null); setIsNewsModalOpen(true); }} className="rounded-full bg-primary font-bold shadow-lg gap-2">
                    <PlusCircle className="h-4 w-4" /> Publicar Notícia
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {loadingNews ? (
                    Array.from({ length: 3 }).map((_, i) => <Card key={i} className="h-64 animate-pulse bg-muted" />)
                ) : news?.length === 0 ? (
                    <div className="col-span-full py-20 text-center border-2 border-dashed rounded-[2rem] bg-muted/5 opacity-40">
                        <Newspaper className="h-12 w-12 mx-auto mb-4" />
                        <p className="font-black uppercase tracking-widest text-xs">Nenhuma notícia publicada ainda.</p>
                    </div>
                ) : (
                    news?.map((item) => (
                        <Card key={item.id} className="group overflow-hidden border-2 hover:border-primary/40 transition-all flex flex-col shadow-sm">
                            {item.coverUrl && (
                                <div className="h-48 overflow-hidden relative">
                                    <img src={item.coverUrl} className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-500" alt={item.title} />
                                    <Badge className={cn("absolute top-3 right-3 font-black text-[8px] uppercase", item.status === 'Published' ? "bg-green-600" : "bg-orange-500")}>
                                        {item.status === 'Published' ? 'Publicado' : 'Rascunho'}
                                    </Badge>
                                </div>
                            )}
                            <CardHeader className="p-5 flex-1">
                                <p className="text-[10px] font-black uppercase text-primary/60 tracking-widest flex items-center gap-2 mb-2">
                                    <Calendar className="h-3 w-3" /> {format(parseISO(item.date), 'dd/MM/yyyy')}
                                </p>
                                <CardTitle className="text-base font-black uppercase leading-tight line-clamp-2">{item.title}</CardTitle>
                                <CardDescription className="text-xs line-clamp-3 mt-2 font-medium leading-relaxed">{item.subtitle}</CardDescription>
                            </CardHeader>
                            <CardContent className="p-5 pt-0 flex gap-2">
                                {item.ownerId === user?.uid && (
                                    <>
                                        <Button variant="outline" size="sm" className="flex-1 rounded-full font-bold text-[10px] uppercase" onClick={() => { setSelectedItem(item); setIsNewsModalOpen(true); }}>Editar</Button>
                                        <Button variant="ghost" size="icon" className="text-red-500 hover:bg-red-50 rounded-full" onClick={() => handleDelete('managementNews', item.id)}><Trash2 className="h-4 w-4" /></Button>
                                    </>
                                )}
                                <Button variant="secondary" size="sm" className="rounded-full text-[10px] font-bold uppercase flex-1" onClick={() => { setSelectedItem(item); setIsNewsModalOpen(true); }}>Ler Mais</Button>
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
                    <p className="text-xs text-muted-foreground">Controle individual de telefones, gerentes e senhas vinculadas.</p>
                </div>
                <Button onClick={() => { setSelectedItem(null); setIsPromoterModalOpen(true); }} className="rounded-full bg-blue-600 hover:bg-blue-700 font-bold shadow-lg gap-2">
                    <Building2 className="h-4 w-4" /> Adicionar Promotora
                </Button>
            </div>

            <div className="space-y-4">
                {promoters?.map((promoter) => (
                    <Card key={promoter.id} className="border-2 overflow-hidden shadow-sm hover:shadow-md transition-all">
                        <div 
                            className={cn(
                                "p-5 flex items-center justify-between cursor-pointer hover:bg-muted/50 transition-colors",
                                expandedPromoter === promoter.id && "bg-blue-50/20 border-b-2"
                            )}
                            onClick={() => setExpandedPromoter(expandedPromoter === promoter.id ? null : promoter.id)}
                        >
                            <div className="flex items-center gap-4">
                                <div className="h-12 w-12 rounded-2xl bg-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                                    <Building2 className="h-6 w-6" />
                                </div>
                                <div>
                                    <h3 className="font-black uppercase text-sm tracking-tight">{promoter.name}</h3>
                                    <div className="flex items-center gap-4 text-[10px] font-bold text-muted-foreground uppercase mt-1.5">
                                        <span className="flex items-center gap-1.5"><NotebookTabs className="h-3.5 w-3.5 text-blue-500" /> {promoter.contactName || 'Sem gerente'}</span>
                                        <span className="flex items-center gap-1.5"><Headset className="h-3.5 w-3.5 text-blue-500" /> Suporte: {promoter.supportPhone || 'Não inf.'}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={(e) => { e.stopPropagation(); setSelectedItem(promoter); setIsPromoterModalOpen(true); }}><Edit className="h-4 w-4" /></Button>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 rounded-full" onClick={(e) => { e.stopPropagation(); handleDelete('managementPromoters', promoter.id); }}><Trash2 className="h-4 w-4" /></Button>
                                {expandedPromoter === promoter.id ? <ChevronUp className="h-5 w-5 text-muted-foreground" /> : <ChevronDown className="h-5 w-5 text-muted-foreground" />}
                            </div>
                        </div>

                        {expandedPromoter === promoter.id && (
                            <div className="p-6 bg-muted/10 space-y-6 animate-in slide-in-from-top-2 duration-300">
                                <div className="flex items-center justify-between border-b pb-4">
                                    <h4 className="text-[10px] font-black uppercase tracking-[0.25em] text-muted-foreground flex items-center gap-2">
                                        <Lock className="h-3.5 w-3.5" /> Logins Bancários Vínculados
                                    </h4>
                                    <Button size="sm" variant="outline" className="rounded-full h-8 px-4 font-bold text-[10px] uppercase gap-2 border-primary/20 text-primary" onClick={() => { setSelectedPromoterId(promoter.id); setSelectedItem(null); setIsBankModalOpen(true); }}>
                                        <PlusCircle className="h-3 w-3" /> Vincular Login
                                    </Button>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {loadingLogins ? (
                                        <div className="col-span-full flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
                                    ) : bankLogins.length === 0 ? (
                                        <div className="col-span-full py-10 text-center border-2 border-dashed rounded-2xl opacity-30 text-[10px] font-black uppercase">Nenhum login cadastrado para esta promotora.</div>
                                    ) : (
                                        bankLogins.map((bank) => (
                                            <Card key={bank.id} className="bg-background border-2 shadow-sm p-4 space-y-4 group/bank">
                                                <div className="flex justify-between items-start">
                                                    <div className="flex items-center gap-2">
                                                        <Landmark className="h-4 w-4 text-primary" />
                                                        <span className="font-black text-xs uppercase truncate max-w-[120px]">{bank.bankName}</span>
                                                    </div>
                                                    <div className="flex gap-1 opacity-0 group-hover/bank:opacity-100 transition-opacity">
                                                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => { setSelectedPromoterId(promoter.id); setSelectedItem(bank); setIsBankModalOpen(true); }}><Edit className="h-3 w-3" /></Button>
                                                        <Button variant="ghost" size="icon" className="h-6 w-6 text-red-500" onClick={() => handleDelete(`managementPromoters/${promoter.id}/bankLogins`, bank.id)}><Trash2 className="h-3 w-3" /></Button>
                                                    </div>
                                                </div>
                                                <div className="space-y-2 bg-muted/20 p-3 rounded-lg border">
                                                    <div className="flex flex-col">
                                                        <span className="text-[8px] font-black uppercase text-muted-foreground">Usuário</span>
                                                        <span className="text-[11px] font-bold select-all">{bank.login}</span>
                                                    </div>
                                                    <div className="flex flex-col relative">
                                                        <span className="text-[8px] font-black uppercase text-muted-foreground">Senha Protegida</span>
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-[11px] font-mono tracking-widest flex-1">
                                                                {decryptedPasswords[bank.id] ? decryptedPasswords[bank.id] : '••••••••'}
                                                            </span>
                                                            <button onClick={() => handleShowPassword(bank.id, bank.password)} className="text-primary hover:scale-110 transition-transform">
                                                                {decryptedPasswords[bank.id] ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                                {bank.accessUrl && (
                                                    <Button variant="secondary" className="w-full h-8 rounded-full text-[10px] font-bold uppercase gap-2" asChild>
                                                        <a href={bank.accessUrl} target="_blank" rel="noopener noreferrer"><ExternalLink className="h-3 w-3" /> Abrir Sistema</a>
                                                    </Button>
                                                )}
                                            </Card>
                                        ))
                                    )}
                                </div>
                            </div>
                        )}
                    </Card>
                ))}
            </div>
        </TabsContent>

        <TabsContent value="links" className="space-y-6 animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
                <div className="space-y-1">
                    <h2 className="text-xl font-black uppercase tracking-tight text-emerald-600">Área de Links Rápidos</h2>
                    <p className="text-xs text-muted-foreground">Atalhos compartilhados para agilizar o acesso aos portais oficiais.</p>
                </div>
                <Button onClick={() => { setSelectedItem(null); setIsLinkModalOpen(true); }} className="rounded-full bg-emerald-600 hover:bg-emerald-700 font-bold shadow-lg gap-2">
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
                                <button onClick={() => { setSelectedItem(link); setIsLinkModalOpen(true); }} className="p-1.5 bg-white shadow rounded-full text-muted-foreground hover:text-primary"><Edit className="h-3 w-3" /></button>
                                <button onClick={() => handleDelete('managementQuickLinks', link.id)} className="p-1.5 bg-white shadow rounded-full text-red-500 hover:text-red-600"><Trash2 className="h-3 w-3" /></button>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </TabsContent>
      </Tabs>

      <Dialog open={isNewsModalOpen} onOpenChange={setIsNewsModalOpen}>
        <DialogContent className="max-w-3xl">
            <DialogHeader><DialogTitle>{selectedItem ? 'Visualizar / Editar Notícia' : 'Publicar Nova Notícia'}</DialogTitle></DialogHeader>
            <NewsForm initialData={selectedItem} onSubmit={(d) => handleSave('managementNews', d, selectedItem?.id)} isSaving={isSaving} />
        </DialogContent>
      </Dialog>

      <Dialog open={isPromoterModalOpen} onOpenChange={setIsPromoterModalOpen}>
        <DialogContent className="max-w-md">
            <DialogHeader><DialogTitle>{selectedItem ? 'Editar Promotora' : 'Nova Promotora'}</DialogTitle></DialogHeader>
            <PromoterForm initialData={selectedItem} onSubmit={(d) => handleSave('managementPromoters', d, selectedItem?.id)} isSaving={isSaving} />
        </DialogContent>
      </Dialog>

      <Dialog open={isBankModalOpen} onOpenChange={setIsBankModalOpen}>
        <DialogContent className="max-w-md">
            <DialogHeader><DialogTitle>{selectedItem ? 'Editar Login' : 'Vincular Novo Banco'}</DialogTitle></DialogHeader>
            <BankForm initialData={selectedItem} onSubmit={(d) => handleSaveBank(d, selectedItem?.id)} isSaving={isSaving} />
        </DialogContent>
      </Dialog>

      <Dialog open={isLinkModalOpen} onOpenChange={setIsLinkModalOpen}>
        <DialogContent className="max-w-md">
            <DialogHeader><DialogTitle>{selectedItem ? 'Editar Atalho' : 'Novo Link Rápido'}</DialogTitle></DialogHeader>
            <QuickLinkForm initialData={selectedItem} onSubmit={(d) => handleSave('managementQuickLinks', d, selectedItem?.id)} isSaving={isSaving} />
        </DialogContent>
      </Dialog>

    </AppLayout>
  );
}
