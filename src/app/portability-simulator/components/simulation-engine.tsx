'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useUser, useFirestore } from '@/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { extractPortabilityDataFromImage, ExtractPortabilityDataOutput } from '@/ai/flows/extract-portability-data-flow';
import { toast } from '@/hooks/use-toast';
import { Upload, FileSearch, Loader2, Search, Zap, CheckCircle2, AlertTriangle, XCircle, FileType, FileText, Check, Trophy, Send, Hash, UserCircle } from 'lucide-react';
import { PortabilityRule } from '@/lib/types';
import { portabilityRulesService } from '@/lib/services/portabilityRules';
import { runSimulationForContract, BankSimulationResult } from '@/lib/services/portabilitySimulationEngine';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { collection, doc, setDoc } from 'firebase/firestore';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

type Step = 'UPLOAD' | 'EXTRACTING' | 'REVIEW' | 'RESULTS';

export function SimulationEngine() {
  const { user } = useUser();
  const firestore = useFirestore();
  const [step, setStep] = useState<Step>('UPLOAD');
  const [activeRules, setActiveRules] = useState<PortabilityRule[]>([]);
  
  const [fileBase64, setFileBase64] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [extractedData, setExtractedData] = useState<ExtractPortabilityDataOutput | null>(null);
  const [simulationResults, setSimulationResults] = useState<{ contract: NonNullable<ExtractPortabilityDataOutput['contracts']>[0], results: BankSimulationResult[] }[]>([]);

  const [isDetailedMode, setIsDetailedMode] = useState(false);
  const [isWhatsappDialogOpen, setIsWhatsappDialogOpen] = useState(false);
  const [whatsappText, setWhatsappText] = useState('');
  const [whatsappPhone, setWhatsappPhone] = useState('');

  useEffect(() => {
    if (user) {
      portabilityRulesService.getCurrentRules(user.uid).then(setActiveRules).catch(console.error);
    }
  }, [user]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({ variant: 'destructive', title: 'Arquivo excedeu 5MB.' });
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFileBase64(reader.result as string);
        processFile(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const processFile = async (base64: string) => {
    setStep('EXTRACTING');
    try {
      const data = await extractPortabilityDataFromImage(base64);
      setExtractedData(data);
      setStep('REVIEW');
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Erro na extração', description: err.message });
      setStep('UPLOAD');
    }
  };

  const handleUpdateContract = (idx: number, field: string, value: any) => {
     if (!extractedData || !extractedData.contracts) return;
     const newContracts = [...extractedData.contracts];
     (newContracts[idx] as any)[field] = value;
     setExtractedData({ ...extractedData, contracts: newContracts });
  };

  const isDataInsufficient = useMemo(() => {
    if (!extractedData) return true;
    if (!extractedData.cpf || !extractedData.contracts || extractedData.contracts.length === 0) return true;
    // Check if at least one contract has critical fields
    return !extractedData.contracts.some(c => c.installmentValue && c.sourceBank);
  }, [extractedData]);

  const handleRunSimulation = async () => {
    if (isDataInsufficient || !user || !firestore) return;
    
    const contracts = extractedData!.contracts || [];
    if (contracts.length === 0) {
      toast({ variant: 'destructive', title: 'Nenhum contrato para simular.' });
      return;
    }

    if (activeRules.length === 0) {
        toast({ variant: 'destructive', title: 'Regra insuficiente para decidir', description: 'Nenhuma regra bancária está cadastrada e ativa neste usuário.' });
        return;
    }

    const allResults = [];

    for (const contract of contracts) {
      const results = await runSimulationForContract(extractedData!, contract, activeRules);
      allResults.push({ contract, results });
    }

    setSimulationResults(allResults);
    setStep('RESULTS');

    // Salvar Auditoria
    try {
        const auditRef = doc(collection(firestore, 'portabilitySimulations'));
        await setDoc(auditRef, {
            id: auditRef.id,
            ownerId: user.uid,
            timestamp: new Date().toISOString(),
            extractedVerifiedData: extractedData,
            rulesConsideredCount: activeRules.length,
            simulationResults: allResults
        });
    } catch (err) {
        console.error("Erro ao salvar auditoria", err);
    }
  };

  const openWhatsappDialog = (bankName: string, promoter: string, contract: any, scenarios: any) => {
    const defaultText = `Olá ${extractedData?.name || 'Cliente'}!\n\nAnalisamos seu benefício e encontramos uma excelente oportunidade de Portabilidade no banco *${bankName}* (${promoter}) referente ao seu contrato de R$ ${contract.installmentValue?.toFixed(2)}.\n\n${scenarios.theoreticalCashback > 0 ? `Temos uma liberação estimada com troco para o senhor(a).` : `Temos uma redução na sua taxa de juros.`}\n\nVou pedir pro pessoal formalizar, podemos seguir?`;
    setWhatsappText(defaultText);
    setWhatsappPhone(extractedData?.cpf || ''); 
    setIsWhatsappDialogOpen(true);
  };

  const handleSendWhatsapp = () => {
    const phone = whatsappPhone.replace(/\D/g, '');
    const url = `https://wa.me/55${phone}?text=${encodeURIComponent(whatsappText)}`;
    window.open(url, '_blank');
    setIsWhatsappDialogOpen(false);
  };

  const renderStatus = (status: string) => {
      switch(status) {
          case 'GREEN': return <Badge className="bg-green-500 text-white font-black tracking-widest"><CheckCircle2 className="h-3 w-3 mr-1"/> CABE</Badge>;
          case 'RED': return <Badge className="bg-red-500 text-white font-black tracking-widest"><XCircle className="h-3 w-3 mr-1"/> NÃO CABE</Badge>;
          default: return <Badge className="bg-yellow-500 text-white font-black tracking-widest"><AlertTriangle className="h-3 w-3 mr-1"/> ATENÇÃO</Badge>;
      }
  };

  if (step === 'UPLOAD') {
      return (
          <div className="flex flex-col items-center justify-center py-20 bg-muted/10 rounded-[2rem] border-2 border-dashed border-border hover:bg-muted/20 transition-all cursor-pointer group" onClick={() => fileInputRef.current?.click()}>
              <input type="file" ref={fileInputRef} className="hidden" accept="image/*,application/pdf" onChange={handleFileSelect} />
              <div className="h-20 w-20 rounded-3xl bg-primary/10 flex items-center justify-center border-2 border-primary/20 rotate-3 group-hover:rotate-0 transition-transform mb-6 shadow-sm">
                  <FileSearch className="h-10 w-10 text-primary" />
              </div>
              <h3 className="text-xl font-black uppercase text-foreground/80 tracking-tight">Upload do Arquivo do Cliente</h3>
              <p className="text-sm tracking-wide text-muted-foreground mt-2 max-w-md text-center">
                  Faça upload do HISCON, extrato de empréstimos (PDF ou Imagem) para iniciar a leitura.
              </p>
              <Button className="mt-8 rounded-full h-11 px-8 font-black uppercase tracking-widest shadow-lg">Selecionar Arquivo</Button>
          </div>
      );
  }

  if (step === 'EXTRACTING') {
      return (
          <div className="flex flex-col items-center justify-center py-32 bg-muted/5 rounded-[2rem] border border-border/50">
              <Loader2 className="h-12 w-12 text-primary animate-spin mb-4" />
              <h3 className="text-lg font-black uppercase tracking-tight text-primary">A IA está lendo o documento...</h3>
              <p className="text-xs text-muted-foreground mt-2 font-medium">Extraindo beneficiários, saldo e parcelas...</p>
          </div>
      );
  }

  if (step === 'REVIEW' && extractedData) {
      return (
          <div className="space-y-6 animate-in fade-in zoom-in-95 duration-500">
             <div className="flex items-center justify-between p-4 bg-muted/20 border rounded-2xl">
                 <div className="flex items-center gap-3">
                     <FileText className="h-8 w-8 text-blue-500" />
                     <div>
                         <h3 className="font-black uppercase tracking-tight text-base">Revisão de Dados Extraídos</h3>
                         <p className="text-[10px] text-muted-foreground uppercase font-black">Valide as informações preenchidas pela IA antes da Simulação Operacional.</p>
                     </div>
                 </div>
                 <Button 
                    onClick={handleRunSimulation} 
                    disabled={isDataInsufficient}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-black uppercase h-10 px-8 rounded-full shadow-xl shadow-blue-500/20 disabled:opacity-50 disabled:bg-muted disabled:text-muted-foreground"
                 >
                     <Zap className="h-4 w-4 mr-2"/> {isDataInsufficient ? 'Dados Insuficientes' : 'Rodar Simulador C/ Regras'}
                 </Button>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                 <div className="space-y-2">
                     <Label className="text-[10px] font-black uppercase text-muted-foreground">Nome (Opcional)</Label>
                     <Input value={extractedData.name || ''} onChange={e => setExtractedData({...extractedData, name: e.target.value})} className="h-10 rounded-xl" />
                 </div>
                 <div className="space-y-2">
                     <Label className="text-[10px] font-black uppercase text-muted-foreground">CPF do Cliente</Label>
                     <Input value={extractedData.cpf || ''} onChange={e => setExtractedData({...extractedData, cpf: e.target.value})} className="h-10 rounded-xl" />
                 </div>
                 <div className="space-y-2">
                     <Label className="text-[10px] font-black uppercase text-muted-foreground">Espécie Benefício</Label>
                     <Input value={extractedData.benefitSpecies || ''} onChange={e => setExtractedData({...extractedData, benefitSpecies: e.target.value})} className="h-10 rounded-xl" />
                 </div>
                 <div className="space-y-2">
                     <Label className="text-[10px] font-black uppercase text-muted-foreground">Margem Livre (R$)</Label>
                     <Input type="number" value={extractedData.availableMargin || ''} onChange={e => setExtractedData({...extractedData, availableMargin: Number(e.target.value)})} className="h-10 rounded-xl" />
                 </div>
             </div>

             <div className="mt-8">
                 <h4 className="font-black uppercase tracking-tight text-sm mb-4 border-b pb-2">Contratos Listados para Portabilidade</h4>
                 {(!extractedData.contracts || extractedData.contracts.length === 0) ? (
                     <div className="p-8 text-center bg-red-500/5 text-red-600 rounded-2xl border-2 border-dashed border-red-500/20">
                         <p className="font-bold">A leitura ocular não localizou contratos vinculados no documento.</p>
                         <p className="text-xs">Se for um erro, refaça o upload ou digite sem formato.</p>
                     </div>
                 ) : (
                     <div className="space-y-4">
                         {extractedData.contracts.map((contract, index) => (
                             <Card key={index} className="shadow-sm border-2 overflow-hidden">
                                 <CardHeader className="bg-muted/20 py-3 border-b">
                                     <CardTitle className="text-xs font-black uppercase tracking-widest flex items-center gap-2">
                                         Contrato #{index + 1}
                                     </CardTitle>
                                 </CardHeader>
                                 <CardContent className="p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
                                     <div className="space-y-2 md:col-span-2">
                                         <Label className="text-[10px] font-black uppercase text-muted-foreground">Banco Origem</Label>
                                         <Input value={contract.sourceBank || ''} onChange={e=>handleUpdateContract(index, 'sourceBank', e.target.value)} className="bg-background"/>
                                     </div>
                                     <div className="space-y-2">
                                         <Label className="text-[10px] font-black uppercase text-muted-foreground">Qtd. Pagas</Label>
                                         <Input type="number" value={contract.installmentsPaid || ''} onChange={e=>handleUpdateContract(index, 'installmentsPaid', Number(e.target.value))} className="bg-background"/>
                                     </div>
                                     <div className="space-y-2">
                                         <Label className="text-[10px] font-black uppercase text-muted-foreground">Vlr. Parcela (R$)</Label>
                                         <Input type="number" value={contract.installmentValue || ''} onChange={e=>handleUpdateContract(index, 'installmentValue', Number(e.target.value))} className="bg-background"/>
                                     </div>
                                     <div className="space-y-2">
                                         <Label className="text-[10px] font-black uppercase text-muted-foreground">Saldo Devedor (R$)</Label>
                                         <Input type="number" value={contract.outstandingBalance || ''} onChange={e=>handleUpdateContract(index, 'outstandingBalance', Number(e.target.value))} className="bg-background"/>
                                     </div>
                                 </CardContent>
                             </Card>
                         ))}
                     </div>
                 )}
             </div>
          </div>
      );
  }

  if (step === 'RESULTS') {
      return (
        <div className="space-y-8 animate-in fade-in duration-500">
           <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-6 bg-emerald-50 text-emerald-900 border border-emerald-200 rounded-3xl shadow-sm">
                <div>
                    <h2 className="text-2xl font-black uppercase tracking-tight flex items-center gap-2"><CheckCircle2 className="h-6 w-6"/> Simulação Concluída</h2>
                    <p className="text-xs font-bold mt-1 opacity-80">Auditoria salva em histórico. As análises seguiram {activeRules.length} regras cadastradas.</p>
                </div>
                <div className="flex items-center gap-4 mt-4 sm:mt-0">
                    <div className="flex items-center gap-2 bg-white/50 px-4 py-2 rounded-full">
                        <Switch checked={isDetailedMode} onCheckedChange={setIsDetailedMode} id="detailed-mode" />
                        <Label htmlFor="detailed-mode" className="text-xs font-black uppercase cursor-pointer">Modo Detalhado</Label>
                    </div>
                    <Button variant="outline" onClick={() => setStep('UPLOAD')} className="rounded-full font-bold bg-white text-emerald-800 border-none shadow-md">
                        Nova Simulação
                    </Button>
                </div>
           </div>    

           {simulationResults.map((sim, i) => (
               <div key={i} className="border-2 rounded-[2rem] bg-card overflow-hidden shadow-sm">
                   <div className="bg-muted/30 p-4 border-b flex flex-wrap gap-4 items-center justify-between">
                       <div className="flex items-center gap-2">
                           <span className="bg-primary text-primary-foreground px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
                               Contrato {i + 1}
                           </span>
                           <span className="font-bold text-sm">{sim.contract.sourceBank || 'Banco Não Identificado'}</span>
                       </div>
                       <div className="flex items-center gap-4 text-xs font-semibold text-muted-foreground flex-wrap">
                           <span><b className="uppercase text-[9px] mr-1 opacity-60">Parcela:</b> R$ {sim.contract.installmentValue?.toFixed(2) || '0.00'}</span>
                           <span><b className="uppercase text-[9px] mr-1 opacity-60">Pagas:</b> {sim.contract.installmentsPaid || 0}</span>
                           <span><b className="uppercase text-[9px] mr-1 opacity-60">Saldo:</b> R$ {sim.contract.outstandingBalance?.toFixed(2) || '0.00'}</span>
                       </div>
                   </div>

                   <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                       {sim.results.filter(r => isDetailedMode || r.status === 'GREEN' || r.status === 'YELLOW').map((res, j) => {
                           const isPodium = res.status === 'GREEN' && j < 3;
                           return (
                           <div key={j} className={`p-4 rounded-2xl border flex flex-col gap-4 relative transition-all ${res.status === 'GREEN' ? 'bg-green-50/50 border-green-200 shadow-sm' : res.status === 'YELLOW' ? 'bg-yellow-50/50 border-yellow-200' : 'bg-red-50/10 border-red-100 opacity-70'}`}>
                               {isPodium && (
                                   <div className="absolute -top-3 -left-3 bg-gradient-to-br from-yellow-400 to-amber-600 text-white h-8 w-8 rounded-full flex items-center justify-center font-black shadow-lg">
                                       <span className="text-xs">#{j + 1}</span>
                                   </div>
                               )}
                               <div className="flex items-center justify-between pl-2">
                                   <div className="flex flex-col">
                                       <span className="font-black uppercase tracking-tight flex items-center gap-1.5">
                                           {res.bankName} 
                                           {isPodium && <Trophy className="h-3.5 w-3.5 text-amber-500 fill-amber-500"/>}
                                       </span>
                                       <span className="text-[10px] font-bold text-muted-foreground">{res.promoter}</span>
                                   </div>
                                   {renderStatus(res.status)}
                               </div>
                               
                                <div className="grid grid-cols-2 gap-2 mt-1">
                                    {res.scenarios.canRefinance && <Badge variant="outline" className="text-[9px] justify-center bg-background">👍 Permite Refin</Badge>}
                                    {res.scenarios.isPurePortability && <Badge variant="outline" className="text-[9px] justify-center bg-background">♻️ Port. Pura</Badge>}
                                    {res.scenarios.theoreticalCashback > 0 && <Badge variant="outline" className="text-[9px] justify-center bg-green-100 text-green-700 border-green-200">💰 Est: R$ {res.scenarios.theoreticalCashback.toFixed(0)}</Badge>}
                                    {res.manualAnalysisRequired && <Badge variant="outline" className="text-[9px] justify-center bg-yellow-100 text-yellow-700 border-yellow-200 font-bold col-span-2">⚠️ Analisar Manualmente</Badge>}
                                </div>

                               <div className="space-y-2 mt-2 bg-background p-3 rounded-xl border border-muted flex-1 text-xs font-semibold leading-tight text-muted-foreground">
                                   {res.reasons.map((reason, k) => {
                                       let Icon = Hash;
                                       if (reason.toLowerCase().includes('parcela')) Icon = Zap;
                                       if (reason.toLowerCase().includes('banco') || reason.toLowerCase().includes('origem')) Icon = Search;
                                       if (reason.toLowerCase().includes('saldo') || reason.toLowerCase().includes('valor')) Icon = AlertTriangle;
                                       if (reason.toLowerCase().includes('espécie') || reason.toLowerCase().includes('idade')) Icon = UserCircle;

                                       return (
                                           <div key={k} className="flex gap-2 items-start">
                                               <Icon className="h-3 w-3 shrink-0 mt-0.5 opacity-40 text-primary" />
                                               <span>{reason}</span>
                                           </div>
                                       );
                                   })}
                               </div>

                               {(res.status === 'GREEN' || res.status === 'YELLOW') && (
                                   <Button 
                                      variant="outline" 
                                      onClick={() => openWhatsappDialog(res.bankName, res.promoter, sim.contract, res.scenarios)}
                                      className="w-full mt-2 rounded-xl text-xs font-black uppercase text-[#25D366] hover:text-[#25D366] hover:bg-[#25D366]/10 border-[#25D366]"
                                    >
                                       <Send className="h-3 w-3 mr-2" />
                                       Enviar via ZAP
                                   </Button>
                               )}
                           </div>
                           )
                       })}
                       {sim.results.filter(r => isDetailedMode || r.status === 'GREEN' || r.status === 'YELLOW').length === 0 && (
                            <div className="col-span-full p-8 text-center bg-muted/20 border-2 border-dashed rounded-[2rem]">
                                <AlertTriangle className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
                                <p className="font-black uppercase tracking-tight text-muted-foreground">Nenhuma oportunidade viável</p>
                                <p className="text-xs text-muted-foreground mt-1">Ative o modo Detalhado acima para entender as restrições.</p>
                            </div>
                       )}
                   </div>
               </div>
           ))}        

           <Dialog open={isWhatsappDialogOpen} onOpenChange={setIsWhatsappDialogOpen}>
               <DialogContent className="sm:max-w-md rounded-[2rem] p-0 overflow-hidden border-none shadow-2xl">
                   <DialogHeader className="px-6 pt-6 pb-4 bg-[#25D366]/10">
                       <DialogTitle className="flex items-center gap-2 text-[#128C7E] font-black uppercase tracking-tight">
                           <Send className="h-5 w-5" />
                           Compartilhar Veredito
                       </DialogTitle>
                   </DialogHeader>
                   <div className="p-6 space-y-4">
                       <div className="space-y-2">
                           <Label className="text-xs font-black uppercase text-muted-foreground">Telefone do Cliente</Label>
                           <Input 
                              placeholder="Faltou celular, digite o número Ex: 11999999999" 
                              value={whatsappPhone} 
                              onChange={e => setWhatsappPhone(e.target.value)} 
                              className="h-11 rounded-xl font-bold tracking-widest text-[#128C7E]" 
                            />
                       </div>
                       <div className="space-y-2">
                           <Label className="text-xs font-black uppercase text-muted-foreground">Mensagem Inteligente</Label>
                           <Textarea 
                              value={whatsappText} 
                              onChange={e => setWhatsappText(e.target.value)}
                              className="min-h-[150px] resize-none rounded-xl" 
                            />
                       </div>
                       <Button onClick={handleSendWhatsapp} className="w-full h-11 rounded-xl bg-[#25D366] hover:bg-[#128C7E] text-white font-black uppercase tracking-widest shadow-lg shadow-[#25D366]/30">
                           Abrir no WhatsApp
                       </Button>
                   </div>
               </DialogContent>
           </Dialog>
        </div>
      );
  }

  return null;
}
