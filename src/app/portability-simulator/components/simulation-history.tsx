'use client';

import React, { useEffect, useState } from 'react';
import { useUser, useFirestore } from '@/firebase';
import { collection, query, where, orderBy, getDocs, limit } from 'firebase/firestore';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { History, FileText, ChevronDown, ChevronUp, UserCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SimulationAudit {
  id: string;
  timestamp: string;
  ownerId: string;
  rulesConsideredCount: number;
  extractedVerifiedData: any;
  simulationResults: any[];
}

export function SimulationHistory() {
  const { user } = useUser();
  const firestore = useFirestore();
  const [audits, setAudits] = useState<SimulationAudit[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    async function loadHistory() {
      if (!user || !firestore) return;
      try {
        const q = query(
          collection(firestore, 'portabilitySimulations'),
          where('ownerId', '==', user.uid)
        );
        const snap = await getDocs(q);
        const data = snap.docs.map(d => ({ ...d.data(), id: d.id } as SimulationAudit));
        
        // Ordenação e limite feitos no client-side para evitar a necessidade de criar um Índice Composto no Firebase.
        data.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        setAudits(data.slice(0, 50));
      } catch (err) {
        console.error("Erro ao puxar histórico", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadHistory();
  }, [user, firestore]);

  if (isLoading) {
      return (
          <div className="space-y-4 py-6">
              <Skeleton className="h-20 w-full rounded-[2rem]" />
              <Skeleton className="h-20 w-full rounded-[2rem]" />
          </div>
      );
  }

  if (audits.length === 0) {
      return (
         <div className="flex flex-col items-center justify-center py-20 text-center">
             <div className="h-20 w-20 rounded-full bg-muted/20 flex items-center justify-center mb-4">
                 <History className="h-8 w-8 text-muted-foreground/30" />
             </div>
             <p className="font-black uppercase tracking-tight text-xl">Nenhuma Auditoria</p>
             <p className="text-sm text-muted-foreground max-w-sm mt-2">Você ainda não rodou nenhuma simulação de portabilidade neste ambiente.</p>
         </div>
      );
  }

  return (
      <div className="space-y-4 py-6">
          {audits.map(audit => {
              const isExpanded = expandedId === audit.id;
              const date = new Date(audit.timestamp);
              
              const totalBancosAvaliados = audit.simulationResults.reduce((acc, curr) => acc + curr.results.length, 0);
              const totalVerdes = audit.simulationResults.reduce((acc, curr) => acc + curr.results.filter((c: any) => c.status === 'GREEN').length, 0);

              return (
                  <Card key={audit.id} className="rounded-[2rem] border-2 shadow-sm overflow-hidden transition-all duration-300">
                      <div 
                          className="p-6 flex flex-col md:flex-row items-center justify-between cursor-pointer hover:bg-muted/5 transition-colors gap-4"
                          onClick={() => setExpandedId(isExpanded ? null : audit.id)}
                      >
                          <div className="flex items-center gap-4 w-full md:w-auto">
                              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                  <FileText className="h-5 w-5 text-primary" />
                              </div>
                              <div className="flex flex-col">
                                  <div className="flex items-center gap-2">
                                      <span className="font-black uppercase text-sm">{audit.extractedVerifiedData?.name || 'Cliente Sem Nome'}</span>
                                      <Badge variant="outline" className="text-[10px] font-black">{audit.extractedVerifiedData?.cpf || 'Sem CPF'}</Badge>
                                  </div>
                                  <span className="text-xs font-semibold text-muted-foreground">
                                      {format(date, "dd 'de' MMMM, yyyy 'às' HH:mm", { locale: ptBR })}
                                  </span>
                              </div>
                          </div>
                          
                          <div className="flex items-center justify-between w-full md:w-auto gap-8">
                               <div className="flex items-center gap-4 text-xs font-bold text-muted-foreground">
                                   <div className="flex flex-col items-center">
                                       <span className="text-lg text-foreground font-black leading-none">{audit.simulationResults.length}</span>
                                       <span className="text-[9px] uppercase tracking-widest mt-0.5">Contratos</span>
                                   </div>
                                    <div className="flex flex-col items-center">
                                       <span className="text-lg text-foreground font-black leading-none">{totalBancosAvaliados}</span>
                                       <span className="text-[9px] uppercase tracking-widest mt-0.5">Cruzamentos</span>
                                   </div>
                                    <div className="flex flex-col items-center">
                                       <span className="text-lg text-green-600 font-black leading-none">{totalVerdes}</span>
                                       <span className="text-[9px] uppercase tracking-widest mt-0.5 text-green-600/70">Aprovações</span>
                                   </div>
                               </div>
                               <Button variant="ghost" size="icon" className="rounded-full">
                                   {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                               </Button>
                          </div>
                      </div>

                      {isExpanded && (
                          <div className="p-6 bg-muted/20 border-t flex flex-col gap-6 animate-in slide-in-from-top-4 duration-300">
                             <div>
                                 <h4 className="text-xs font-black uppercase text-muted-foreground mb-3 flex items-center gap-1.5"><UserCircle className="h-4 w-4"/> Dados Lidos</h4>
                                 <div className="flex flex-wrap gap-2">
                                     <Badge variant="outline" className="bg-background">Idade: {audit.extractedVerifiedData?.age || '--'}</Badge>
                                     <Badge variant="outline" className="bg-background">Espécie: {audit.extractedVerifiedData?.benefitSpecies || '--'}</Badge>
                                     <Badge variant="outline" className="bg-background">Margem: R$ {audit.extractedVerifiedData?.availableMargin || '0'}</Badge>
                                 </div>
                             </div>

                             <div>
                                 <h4 className="text-xs font-black uppercase text-muted-foreground mb-3">Veredito Arquivado</h4>
                                 <div className="grid grid-cols-1 gap-4">
                                     {audit.simulationResults.map((sim, i) => (
                                         <div key={i} className="p-4 bg-background rounded-2xl border shadow-sm flex flex-col gap-3">
                                             <div className="flex items-center gap-2 border-b pb-2">
                                                 <span className="font-black text-xs uppercase text-primary">Contrato {i + 1}</span>
                                                 <span className="text-xs font-bold text-muted-foreground">{sim.contract.sourceBank} | R$ {sim.contract.installmentValue}</span>
                                             </div>
                                             {sim.results.filter((r: any) => r.status === 'GREEN').length > 0 ? (
                                                <div className="flex flex-wrap gap-2">
                                                   {sim.results.filter((r: any) => r.status === 'GREEN').map((r: any, j: number) => (
                                                       <Badge key={j} className="bg-green-50 text-green-700 border-green-200 hover:bg-green-100 flex items-center gap-1">
                                                           {r.bankName} {r.scenarios?.theoreticalCashback > 0 ? `(Troco R$ ${Number(r.scenarios.theoreticalCashback).toFixed(0)})` : ''}
                                                       </Badge>
                                                   ))}
                                                </div>
                                             ) : (
                                                 <p className="text-xs font-bold text-red-500">Nenhum banco aprovou este contrato puro.</p>
                                             )}
                                         </div>
                                     ))}
                                 </div>
                             </div>
                          </div>
                      )}
                  </Card>
              )
          })}
      </div>
  );
}
