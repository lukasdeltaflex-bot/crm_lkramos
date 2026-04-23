'use client';

import React, { useMemo, useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Zap, ChevronRight, User, TrendingUp, X, RefreshCcw, ArchiveRestore, Archive, Copy, MessageCircle, Edit2, Trash2, History, Clock } from 'lucide-react';
import type { Customer, Proposal, UserSettings } from '@/lib/types';
import Link from 'next/link';
import { formatCurrency, isWhatsApp, getWhatsAppUrl } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useRadar, RadarOpportunity } from '@/hooks/use-radar';
import { useUser, useFirestore, useDoc } from '@/firebase';
import { BankIcon } from '@/components/bank-icon';
import { doc } from 'firebase/firestore';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format, differenceInDays } from 'date-fns';

import { defaultRadarJustifications } from '@/lib/config-data';

interface RadarWidgetProps {
  proposals: Proposal[];
  customers: Customer[];
  isLoading: boolean;
}

export function RadarWidget({ proposals, customers, isLoading }: RadarWidgetProps) {
  const { user } = useUser();
  const firestore = useFirestore();
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  const settingsDocRef = useMemo(() => {
    if (!user || !firestore) return null;
    return doc(firestore, 'userSettings', user.uid);
  }, [firestore, user]);

  const { data: userSettings } = useDoc<UserSettings>(settingsDocRef as any);
  const activeConfigs = useMemo(() => userSettings?.proposalStatuses || [], [userSettings]);
  
  const justificativasList = useMemo(() => {
    return userSettings?.radarJustifications || defaultRadarJustifications;
  }, [userSettings?.radarJustifications]);

  const { activeSignals, dismissedSignals, dismissSignal, restoreSignal } = useRadar(customers, proposals, activeConfigs);

  // Modals state
  const [dispenseTarget, setDispenseTarget] = useState<RadarOpportunity | null>(null);
  const [justificativa, setJustificativa] = useState<string>('');
  const [isDispenseModalOpen, setIsDispenseModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  
  const [isRestoreModalOpen, setIsRestoreModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [historyTarget, setHistoryTarget] = useState<RadarOpportunity | null>(null);

  const handleDispenseClick = (e: React.MouseEvent, opt: RadarOpportunity) => {
    e.preventDefault();
    e.stopPropagation();
    setDispenseTarget(opt);
    setJustificativa('');
    setIsEditMode(false);
    setIsDispenseModalOpen(true);
  };

  const confirmDispense = async () => {
    if (!dispenseTarget || (!justificativa && !isEditMode)) return;
    
    if (isEditMode) {
       await updateSignalJustification(dispenseTarget, justificativa);
    } else {
       await dismissSignal(dispenseTarget, justificativa);
    }
    
    setIsDispenseModalOpen(false);
    setDispenseTarget(null);
  };

  const handleEditMotiveClick = (opt: RadarOpportunity) => {
    setDispenseTarget(opt);
    setJustificativa(opt.dbSignal?.justificativa || '');
    setIsEditMode(true);
    setIsDispenseModalOpen(true);
  };

  const handleDeleteMotiveClick = async (opt: RadarOpportunity) => {
    await updateSignalJustification(opt, '');
  };

  const handleRestoreClick = async (opt: RadarOpportunity) => {
    await restoreSignal(opt);
  };

  return (
    <>
      <Card className="h-full flex flex-col border-orange-500/20 bg-orange-500/5 dark:bg-orange-500/[0.03] shadow-lg overflow-hidden relative">
        <CardHeader className="pb-4 bg-orange-500/[0.08] dark:bg-orange-500/[0.05] border-b border-orange-500/10">
          <div className="flex items-center justify-between">
              <div className="space-y-1">
                  <CardTitle className="text-lg font-bold flex items-center gap-2 text-orange-600 dark:text-orange-400">
                      <Zap className="h-5 w-5 fill-orange-500 text-orange-500" />
                      Radar de Vendas
                  </CardTitle>
                  <CardDescription className="text-[10px] font-black uppercase text-orange-600/70 dark:text-orange-400/60 tracking-widest">
                      Retenção, Refinanciamento e Saque Complementar
                  </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                {!isLoading && activeSignals.length > 0 && (
                    <Badge variant="outline" className="bg-background dark:bg-zinc-900 border-orange-500/30 text-orange-600 dark:text-orange-400 font-bold hidden sm:inline-flex">
                        {activeSignals.length} ATIVAS
                    </Badge>
                )}
                <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 text-orange-600/70 hover:text-orange-600 hover:bg-orange-500/10"
                    title="Ver dispensados"
                    onClick={() => setIsRestoreModalOpen(true)}
                >
                  <ArchiveRestore className="h-4 w-4" />
                </Button>
              </div>
          </div>
        </CardHeader>
        <CardContent className="flex-1 pt-6 pb-0">
          {isLoading || !hasMounted ? (
              <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="h-16 w-full bg-muted animate-pulse rounded-lg" />
                  ))}
              </div>
          ) : activeSignals.length === 0 ? (
              <div className="flex h-[400px] flex-col items-center justify-center text-center text-muted-foreground p-8 border-2 border-dashed border-orange-500/10 rounded-xl bg-muted/5">
                  <Zap className="h-10 w-10 mb-4 opacity-10" />
                  <p className="font-bold text-sm text-foreground/80">Radar Limpo</p>
                  <p className="text-[11px] opacity-60 mt-1">Nenhum contrato ativo para abordagem no momento.</p>
              </div>
          ) : (
              <ScrollArea className="h-[400px] w-full">
                  <div className="space-y-3 pr-4 pb-6">
                      {activeSignals.map((opt) => (
                          <Link key={opt.id} href={`/customers/${opt.customer.id}`}>
                              <div className="group relative flex items-center gap-3 p-3 rounded-xl border border-orange-500/10 dark:border-orange-500/20 bg-card dark:bg-zinc-900/50 hover:border-orange-500/40 hover:bg-orange-500/[0.02] dark:hover:bg-orange-500/[0.05] transition-all">
                                  <div className="h-10 w-10 rounded-full bg-orange-500/10 flex items-center justify-center shrink-0">
                                      <User className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                                  </div>
                                  <div className="flex-1 min-w-0 pr-8">
                                      <p className="text-sm font-bold text-foreground group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors truncate mb-0.5">{opt.customer.name}</p>
                                      
                                      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1.5">
                                          <span className="font-mono bg-muted/50 px-1 rounded text-[11px]">{opt.customer.cpf?.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4")}</span>
                                          <button 
                                            onClick={(e) => { 
                                                e.preventDefault(); 
                                                e.stopPropagation();
                                                navigator.clipboard.writeText(opt.customer.cpf || ''); 
                                                toast({title: "Copiado", description: "CPF copiado para a área de transferência."}); 
                                            }} 
                                            className="hover:text-primary transition-colors focus:outline-none"
                                            title="Copiar CPF"
                                          >
                                            <Copy className="h-3 w-3" />
                                          </button>
                                          {opt.customer.phone && isWhatsApp(opt.customer.phone) && (
                                              <a 
                                                href={getWhatsAppUrl(opt.customer.phone)} 
                                                target="_blank" 
                                                rel="noopener noreferrer" 
                                                onClick={e => e.stopPropagation()} 
                                                className="text-emerald-500 hover:text-emerald-600 transition-colors"
                                                title="Chamar no WhatsApp"
                                              >
                                                <MessageCircle className="h-3.5 w-3.5" />
                                              </a>
                                          )}
                                      </div>

                                      <div className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground dark:text-zinc-400 uppercase mb-1">
                                          <TrendingUp className="h-3 w-3 text-orange-500 shrink-0" />
                                          {opt.type === 'saque' ? (
                                              <>
                                                  <span className="shrink-0">Revisar Saque ({opt.daysSincePaid} dias)</span>
                                                  {opt.lastProposal?.bank && (
                                                      <>
                                                          <span className="opacity-50 shrink-0">•</span>
                                                          <div className="flex items-center gap-1" title={opt.lastProposal.bank}>
                                                              <BankIcon 
                                                                  bankName={opt.lastProposal.bank} 
                                                                  domain={userSettings?.bankDomains?.[opt.lastProposal.bank]} 
                                                                  showLogo={userSettings?.showBankLogos ?? true} 
                                                                  className="h-3 w-3 border-none shadow-none bg-transparent" 
                                                              />
                                                              <span className="truncate max-w-[60px] sm:max-w-[100px]">{opt.lastProposal.bank}</span>
                                                          </div>
                                                      </>
                                                  )}
                                              </>
                                          ) : (
                                              <span className="shrink-0">Retenção ({opt.monthsSincePaid} meses)</span>
                                          )}
                                          <span className="opacity-50 shrink-0">•</span> 
                                          <span className="shrink-0 truncate">{formatCurrency(opt.lastProposal.grossAmount)}</span>
                                      </div>

                                      {opt.dbSignal?.justificativa && (
                                          <div className="text-[10px] text-muted-foreground mt-1 bg-muted/30 px-2 py-1.5 rounded border border-border/50 inline-flex items-center gap-1.5 leading-none">
                                              <span>Última análise: <strong>{opt.dbSignal.justificativa}</strong></span>
                                          </div>
                                      )}
                                  </div>
                                  
                                  <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
                                    {opt.dbSignal?.justificativa && (
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10 z-10"
                                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setHistoryTarget(opt); setIsHistoryModalOpen(true); }}
                                        title="Histórico"
                                      >
                                        <History className="h-4 w-4" />
                                      </Button>
                                    )}
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 z-10"
                                      onClick={(e) => handleDispenseClick(e, opt)}
                                      title="Dispensar oportunidade"
                                    >
                                      <X className="h-4 w-4" />
                                    </Button>
                                    <ChevronRight className="h-4 w-4 text-orange-500/30 group-hover:text-orange-500 transition-all ml-1" />
                                  </div>
                              </div>
                          </Link>
                      ))}
                  </div>
              </ScrollArea>
          )}
        </CardContent>
        <div className="px-6 py-3 border-t border-orange-500/10 bg-orange-500/[0.03]">
            <p className="text-[9px] text-center text-muted-foreground dark:text-zinc-500 font-bold uppercase tracking-tighter">
                Oportunidades de Vendas Automáticas
            </p>
        </div>
      </Card>

      {/* Modal Dispensa */}
      <Dialog open={isDispenseModalOpen} onOpenChange={setIsDispenseModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Dispensar Oportunidade</DialogTitle>
            <DialogDescription>
              Justifique o motivo da dispensa de <strong>{dispenseTarget?.customer.name}</strong>.
              {dispenseTarget?.type === 'saque' && (
                <span className="block mt-2 text-orange-600 text-[11px] font-bold uppercase bg-orange-500/10 p-2 rounded-lg">
                  Regra do Saque: Cliente retornará automaticamente em 10 dias.
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Select value={justificativa} onValueChange={setJustificativa}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o motivo..." />
              </SelectTrigger>
              <SelectContent className="max-h-[300px] z-[9999]" position="popper">
                {justificativasList.map(j => (
                  <SelectItem key={j} value={j}>{j}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsDispenseModalOpen(false)}>Cancelar</Button>
          <Button onClick={confirmDispense} disabled={!justificativa && !isEditMode} variant="destructive">
            {isEditMode ? 'Salvar Edição' : 'Confirmar Dispensa'}
          </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Histórico */}
      <Dialog open={isHistoryModalOpen} onOpenChange={setIsHistoryModalOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="h-5 w-5 text-muted-foreground" />
              Histórico
            </DialogTitle>
            <DialogDescription>
              {historyTarget?.customer.name}
            </DialogDescription>
          </DialogHeader>
          <div className="py-2 space-y-3">
            <div className="bg-muted/30 p-3 rounded-lg border text-sm flex flex-col gap-2">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Último motivo:</span>
                <span className="font-bold">{historyTarget?.dbSignal?.justificativa || '-'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Dispensado em:</span>
                <span className="font-medium">
                  {historyTarget?.dbSignal?.dismissedAt 
                    ? `${format(new Date(historyTarget.dbSignal.dismissedAt), 'dd/MM/yyyy')} (${differenceInDays(new Date(), new Date(historyTarget.dbSignal.dismissedAt))} dias atrás)`
                    : '-'}
                </span>
              </div>
              
              {historyTarget?.type === 'saque' && historyTarget?.dbSignal?.nextReentryDate && (
                <div className="flex justify-between items-center pt-2 border-t mt-1">
                  <span className="text-muted-foreground">Retorno:</span>
                  <span className="font-bold text-primary">
                    {(() => {
                      const reentry = new Date(historyTarget.dbSignal.nextReentryDate);
                      const diff = differenceInDays(reentry, new Date());
                      if (diff > 0) return `Em ${diff} dias (${format(reentry, 'dd/MM')})`;
                      if (diff === 0) return `Hoje (${format(reentry, 'dd/MM')})`;
                      return `Já retornou (${format(reentry, 'dd/MM')})`;
                    })()}
                  </span>
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setIsHistoryModalOpen(false)}>Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Restaurar */}
      <Dialog open={isRestoreModalOpen} onOpenChange={setIsRestoreModalOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Archive className="h-5 w-5 text-muted-foreground" />
              Oportunidades Dispensadas
            </DialogTitle>
            <DialogDescription>
              Visualize os clientes removidos do Radar e restaure-os manualmente se desejar.
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex-1 pr-4 py-4 min-h-[300px] max-h-[60vh] overflow-y-auto overflow-x-hidden">
            {dismissedSignals.length === 0 ? (
              <div className="flex h-full flex-col justify-center items-center text-muted-foreground opacity-60 p-8">
                <ArchiveRestore className="h-10 w-10 mb-2" />
                <p className="text-sm font-bold">Nenhum registro dispensado</p>
              </div>
            ) : (
              <div className="space-y-3">
                {dismissedSignals.map(opt => (
                  <div key={opt.id} className="flex justify-between items-center p-3 rounded-lg border bg-muted/20">
                    <div>
                      <p className="text-sm font-bold">{opt.customer.name}</p>
                      <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 text-[10px] text-muted-foreground mt-1">
                        <span className="uppercase font-bold text-orange-600/70">{opt.type}</span>
                        <div className="flex items-center gap-2">
                          <span>Motivo: <strong className={opt.dbSignal?.justificativa ? "" : "opacity-50"}>{opt.dbSignal?.justificativa || 'Nenhum salvo'}</strong>
                            {opt.dbSignal?.justificativa && !justificativasList.includes(opt.dbSignal.justificativa) && (
                                <span className="ml-1 text-[8px] uppercase bg-red-500/10 text-red-500 px-1 rounded">(Desativado)</span>
                            )}
                          </span>
                          
                          <div className="flex items-center opacity-40 hover:opacity-100 transition-opacity gap-1 ml-1">
                            <button onClick={() => handleEditMotiveClick(opt)} title="Editar Motivo" className="p-1 hover:text-primary transition-colors focus:outline-none">
                              <Edit2 className="h-3 w-3" />
                            </button>
                            {opt.dbSignal?.justificativa && (
                                <button onClick={() => handleDeleteMotiveClick(opt)} title="Excluir Motivo" className="p-1 hover:text-destructive transition-colors focus:outline-none">
                                  <Trash2 className="h-3 w-3" />
                                </button>
                            )}
                          </div>
                        </div>
                        {opt.type === 'saque' && opt.dbSignal?.nextReentryDate && (
                          <span className="text-primary font-bold">
                            {(() => {
                              const diff = differenceInDays(new Date(opt.dbSignal.nextReentryDate), new Date());
                              if (diff > 0) return `Retorna em ${diff} dias`;
                              if (diff === 0) return `Retorna hoje`;
                              return `Retornou há ${Math.abs(diff)} dias`;
                            })()}
                          </span>
                        )}
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="ml-4 shrink-0 transition-colors hover:text-primary hover:border-primary/50 hover:bg-primary/5"
                      onClick={() => handleRestoreClick(opt)}
                    >
                      <RefreshCcw className="h-4 w-4 mr-2" /> Restaurar
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}