'use client';

import React, { useState } from 'react';
import { useUser, useFirestore, useMemoFirebase, useDoc } from '@/firebase';
import { PortabilityRule, SourceBankRule, ConditionRule, UserSettings, AgeRule } from '@/lib/types';
import { portabilityRulesService } from '@/lib/services/portabilityRules';
import { logSignificantChange } from '@/lib/auto-guide-logger';
import { doc } from 'firebase/firestore';
import { cleanBankName } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { Save, Plus, Trash2, Info, Check, Search, PlusCircle, UserCircle } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { banks } from '@/lib/config-data';
import { BankIcon } from '@/components/bank-icon';

interface RuleFormProps {
  initialData?: PortabilityRule;
  onClose: () => void;
  onSaved: () => void;
}

const defaultRuleData: Partial<PortabilityRule> = {
  promoter: '',
  bankName: '',
  product: 'Portabilidade INSS',
  isActive: true,
  generalRules: {
    acceptsNegativeMargin: false,
    aggregatesMargin: false,
    reducesInstallment: false,
    purePortability: false,
    requiresRefinancing: false,
  },
  sourceBankRules: [],
  valuesRules: {
    minInstallment: 0,
    minOperationValue: 0,
    minBalance: 0,
    minCashback: 0,
    cashbackPercentage: 0,
    allowPercentageRule: false,
  },
  conditions: [],
  rateRules: {
    minPortabilityRate: 0,
    maxPortabilityRate: 0,
    minRefinRate: 0,
    maxRefinRate: 0,
    requiresRefinForRate: false,
    hasSpecialTable: false,
    requiresTicketCheck: false,
  },
  advancedRules: {
    rulesByAge: '',
    rulesBySpecies: '',
    rulesByAgreement: '',
  },
  texts: {
    whatItDoes: '',
    whatItDoesNotDo: '',
    observations: '',
    manualAnalysisRequired: false,
  }
};

export function RuleForm({ initialData, onClose, onSaved }: RuleFormProps) {
  const { user } = useUser();
  const firestore = useFirestore();
  const settingsDocRef = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return doc(firestore, 'userSettings', user.uid);
  }, [firestore, user]);
  const { data: userSettings } = useDoc<UserSettings>(settingsDocRef);

  const mergedBanks = userSettings?.banks || banks;

  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState<Partial<PortabilityRule>>(initialData || defaultRuleData);
  const [activeTab, setActiveTab] = useState('meta');

  const updateField = (category: keyof PortabilityRule, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [category]: {
        ...(prev[category] as object || {}),
        [field]: value
      }
    }));
  };

  const updateRoot = (field: keyof PortabilityRule, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const addSourceBank = () => {
    const list = formData.sourceBankRules || [];
    setFormData(prev => ({
      ...prev,
      sourceBankRules: [...list, { bankName: '', minPaidInstallments: 0, isBlocked: false, isAllowed: true, notes: '' }]
    }));
  };

  const updateSourceBank = (index: number, field: keyof SourceBankRule, value: any) => {
    const list = [...(formData.sourceBankRules || [])];
    let updatedRow = { ...list[index], [field]: value };
    
    // 🛡️ Lógica de Exclusividade Mútua solicitada pelo usuário
    if (field === 'isAllowed' && value === true) updatedRow.isBlocked = false;
    if (field === 'isBlocked' && value === true) updatedRow.isAllowed = false;
    
    list[index] = updatedRow;
    setFormData(prev => ({ ...prev, sourceBankRules: list }));
  };

  const removeSourceBank = (index: number) => {
    const list = [...(formData.sourceBankRules || [])];
    list.splice(index, 1);
    setFormData(prev => ({ ...prev, sourceBankRules: list }));
  };

  const addCondition = () => {
    const list = formData.conditions || [];
    setFormData(prev => ({
      ...prev,
      conditions: [...list, { conditionType: 'byValue', minValue: 0, maxValue: 0, minInstallments: 0, ruleDescription: '' }]
    }));
  };

  const updateCondition = (index: number, field: keyof ConditionRule, value: any) => {
    const list = [...(formData.conditions || [])];
    list[index] = { ...list[index], [field]: value };
    setFormData(prev => ({ ...prev, conditions: list }));
  };

  const removeCondition = (index: number) => {
    const list = [...(formData.conditions || [])];
    list.splice(index, 1);
    setFormData(prev => ({ ...prev, conditions: list }));
  };

  const addAgeRule = () => {
    const list = formData.ageRules || [];
    setFormData(prev => ({
      ...prev,
      ageRules: [...list, { id: Math.random().toString(36).substring(2, 9), minAge: 0, maxAge: 0, maxAgeAtContractEnd: 0, contractMustEndByAge: 0, minContractValue: 0, maxContractValue: 0, maxInstallments: 0, observations: '' }]
    }));
  };

  const updateAgeRule = (index: number, field: keyof AgeRule, value: any) => {
    const list = [...(formData.ageRules || [])];
    list[index] = { ...list[index], [field]: value };
    setFormData(prev => ({ ...prev, ageRules: list }));
  };

  const removeAgeRule = (index: number) => {
    const list = [...(formData.ageRules || [])];
    list.splice(index, 1);
    setFormData(prev => ({ ...prev, ageRules: list }));
  };

  const handleSave = async () => {
    if (!user) return;
    if (!formData.bankName || !formData.promoter || !formData.product) {
      toast({ variant: 'destructive', title: 'Preencha Banco, Promotora e Produto' });
      setActiveTab('meta');
      return;
    }
    
    setIsSaving(true);
    try {
      if (initialData?.id) {
        await portabilityRulesService.updateRule(initialData.id, formData, user.uid);
        logSignificantChange(firestore, user.uid, 'portability_rules', `Regra atualizada: ${formData.bankName} (${formData.promoter}) - Versão nova gerada.`);
        toast({ title: 'Regra atualizada (Nova versão criada)' });
      } else {
        await portabilityRulesService.createRule(formData as any, user.uid);
        logSignificantChange(firestore, user.uid, 'portability_rules', `Nova regra cadastrada: ${formData.bankName} (${formData.promoter})`);
        toast({ title: 'Nova Regra Cadastrada' });
      }
      onSaved();
    } catch (err: any) {
      console.error(err);
      toast({ variant: 'destructive', title: 'Erro ao salvar', description: err.message });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-background relative">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col h-full overflow-hidden">
        <div className="px-8 pt-4 border-b bg-muted/5 shrink-0 overflow-x-auto">
          <TabsList className="bg-transparent space-x-2 h-12 w-max">
            <TabsTrigger value="meta" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-full h-9 px-6 font-bold shadow-none text-xs">Identificação</TabsTrigger>
            <TabsTrigger value="geral" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-full h-9 px-6 font-bold shadow-none text-xs">Ações Gerais</TabsTrigger>
            <TabsTrigger value="origem" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-full h-9 px-6 font-bold shadow-none text-xs">Bancos Específicos</TabsTrigger>
            <TabsTrigger value="valores" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-full h-9 px-6 font-bold shadow-none text-xs">Valores Mínimos</TabsTrigger>
            <TabsTrigger value="taxas" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-full h-9 px-6 font-bold shadow-none text-xs">Taxas & Índices</TabsTrigger>
            <TabsTrigger value="idade" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-full h-9 px-6 font-bold shadow-none text-xs">Idade & Prazo</TabsTrigger>
            <TabsTrigger value="condicoes" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-full h-9 px-6 font-bold shadow-none text-xs">Condicionais</TabsTrigger>
            <TabsTrigger value="textos" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-full h-9 px-6 font-bold shadow-none text-xs">Análise & Textos</TabsTrigger>
          </TabsList>
        </div>

        <div className="flex-1 overflow-y-auto px-8 py-6">
          <TabsContent value="meta" className="mt-0 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                <Label className="text-xs font-black uppercase text-muted-foreground ml-1">Banco Destino</Label>
                <Select value={formData.bankName} onValueChange={val => updateRoot('bankName', val)}>
                    <SelectTrigger className="h-14 rounded-2xl bg-muted/10 border-border/50 text-base font-bold px-6 shadow-sm focus-visible:ring-1">
                        <SelectValue placeholder="Ex: C6 Bank" />
                    </SelectTrigger>
                    <SelectContent>
                        {mergedBanks.map(b => (
                            <SelectItem key={b} value={b}>
                                <div className="flex items-center gap-2">
                                    <BankIcon bankName={b} domain={userSettings?.bankDomains?.[b]} showLogo={userSettings?.showBankLogos ?? true} className="h-4 w-4" />
                                    <span className="font-bold text-xs uppercase">{cleanBankName(b)}</span>
                                </div>
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
              </div>
                  <div className="space-y-4">
                <Label className="text-xs font-black uppercase text-muted-foreground ml-1">Promotora</Label>
                <Select value={formData.promoter} onValueChange={val => updateRoot('promoter', val)}>
                    <SelectTrigger className="h-14 rounded-2xl bg-muted/10 border-border/50 text-base font-bold px-6 shadow-sm focus-visible:ring-1">
                        <SelectValue placeholder="Ex: Nova Promotora" />
                    </SelectTrigger>
                    <SelectContent>
                        {userSettings?.promoters?.map(p => (
                            <SelectItem key={p} value={p}>
                                <div className="flex items-center gap-2">
                                    <BankIcon bankName={p} domain={userSettings?.promoterDomains?.[p]} showLogo={userSettings?.showPromoterLogos ?? true} className="h-4 w-4" />
                                    <span className="font-bold text-xs uppercase">{p}</span>
                                </div>
                            </SelectItem>
                        ))}
                        {(!userSettings?.promoters || userSettings.promoters.length === 0) && (
                            <SelectItem value="none" disabled>Nenhuma promotora cadastrada</SelectItem>
                        )}
                    </SelectContent>
                </Select>
              </div>
               <div className="space-y-3">
                <Label className="text-xs font-black uppercase text-muted-foreground ml-1">Modalidade / Produto</Label>
                <Input value={formData.product} onChange={e => updateRoot('product', e.target.value)} placeholder="Ex: Portabilidade INSS" className="h-12 rounded-2xl bg-muted/10 border-border/50 text-base font-medium px-4 shadow-sm focus-visible:ring-1" />
              </div>
            </div>
            
            <div className="p-4 bg-muted/20 border border-border/40 rounded-2xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Info className="h-5 w-5 text-blue-500" />
                    <div>
                        <p className="font-bold text-sm">Status da Regra</p>
                        <p className="text-xs text-muted-foreground">Regras inativas são ignoradas pelo motor de simulação da IA.</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase">{formData.isActive ? 'ATIVA' : 'INATIVA'}</span>
                    <Switch checked={formData.isActive} onCheckedChange={c => updateRoot('isActive', c)} />
                </div>
            </div>
          </TabsContent>

          <TabsContent value="geral" className="mt-0">
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                    { key: 'acceptsNegativeMargin', label: 'Aceita Margem Negativa', desc: 'Cliente pode portar mesmo estourado' },
                    { key: 'aggregatesMargin', label: 'Agrega Margem', desc: 'Permite juntar troco e margem livre' },
                    { key: 'reducesInstallment', label: 'Faz Redução de Parcela', desc: 'Portabilidade focada em diminuir prestação' },
                    { key: 'purePortability', label: 'Portabilidade Pura', desc: 'Faz sem refinanciamento casado' },
                    { key: 'requiresRefinancing', label: 'Faz junção de parcela no refin', desc: 'Permite unificar parcelas dentro da operação de refin.' },
                    { 
                        key: 'mandatoryRefin', 
                        label: 'Refin Obrigatório', 
                        desc: 'Trava sistêmica para forçar refinanciamento independente de outras variáveis',
                        disabled: (formData.generalRules as any)?.purePortability === true
                    },
                ].map(item => {
                    // 🛡️ Não exibe Refin Obrigatório se Portabilidade Pura estiver ativado (solicitação do usuário)
                    if (item.key === 'mandatoryRefin' && (formData.generalRules as any)?.purePortability === true) return null;

                    return (
                        <div key={item.key} className="flex items-start gap-4 p-6 rounded-3xl border bg-card hover:border-primary/50 transition-all shadow-sm">
                            <Switch 
                                checked={(formData.generalRules as any)?.[item.key]} 
                                onCheckedChange={c => updateField('generalRules', item.key, c)} 
                                disabled={(item as any).disabled}
                            />
                            <div className="space-y-1.5 mt-[-2px]">
                                <Label className="text-sm font-bold leading-none">{item.label}</Label>
                                <p className="text-[11px] text-muted-foreground leading-relaxed">{item.desc}</p>
                            </div>
                        </div>
                    );
                })}
             </div>
          </TabsContent>

          <TabsContent value="origem" className="mt-0 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                   <h3 className="font-black uppercase tracking-tight text-lg">Bancos de Origem (Exceções)</h3>
                   <p className="text-xs text-muted-foreground mt-1">
                      Os bancos <b className="text-primary">não cadastrados aqui são aceitos por padrão (0 pagas)</b>.<br/>
                      Use esta tela para cadastrar regras próprias de parcelas ou bancos que você <b className="text-destructive uppercase">NÃO ACEITA</b> e deseja bloquear.
                   </p>
                </div>
                <Button onClick={addSourceBank} size="sm" className="rounded-full shadow-md font-bold text-xs h-9">
                    <Plus className="h-3.5 w-3.5 mr-1" /> Adicionar Exceção
                </Button>
            </div>

            {formData.sourceBankRules?.length === 0 ? (
                <div className="text-center p-12 bg-muted/10 rounded-3xl border-2 border-dashed">
                    <p className="text-sm font-medium text-muted-foreground">Nenhuma regra de exceção cadastrada.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {formData.sourceBankRules?.map((rule, index) => (
                        <div key={index} className="p-5 rounded-3xl border bg-card shadow-sm space-y-4 relative group">
                            <Button 
                                variant="destructive" 
                                size="icon" 
                                className="absolute -top-3 -right-3 h-8 w-8 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
                                onClick={() => removeSourceBank(index)}
                            >
                                <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <div className="space-y-2 md:col-span-2">
                                    <Label className="text-[10px] font-black uppercase text-muted-foreground">Nome do Banco Originador</Label>
                                    <Select 
                                        onValueChange={val => updateSourceBank(index, 'bankName', val)} 
                                        value={rule.bankName || undefined}
                                    >
                                        <SelectTrigger className="h-10 rounded-xl font-bold bg-muted/5">
                                            <SelectValue placeholder="Selecione o banco de origem..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {mergedBanks.map(b => (
                                                <SelectItem key={b} value={b}>
                                                    <div className="flex items-center gap-2">
                                                        <BankIcon bankName={b} domain={userSettings?.bankDomains?.[b]} showLogo={userSettings?.showBankLogos ?? true} className="h-4 w-4" />
                                                        <span className="font-bold text-xs uppercase">{cleanBankName(b)}</span>
                                                    </div>
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase text-muted-foreground">Parcelas Pagas (Mín)</Label>
                                    <Input type="number" value={rule.minPaidInstallments} onChange={e => updateSourceBank(index, 'minPaidInstallments', Number(e.target.value))} className="h-10 rounded-xl" />
                                </div>
                                <div className="flex items-center gap-6 md:col-span-1 pt-6 px-2">
                                    <div className="flex items-center gap-2">
                                        <Switch checked={rule.isAllowed} onCheckedChange={c => updateSourceBank(index, 'isAllowed', c)} />
                                        <Label className="text-xs font-bold whitespace-nowrap">Aceita?</Label>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Switch checked={rule.isBlocked} onCheckedChange={c => updateSourceBank(index, 'isBlocked', c)} />
                                        <Label className="text-xs font-bold text-destructive whitespace-nowrap">Bloqueado?</Label>
                                    </div>
                                </div>
                                <div className="space-y-2 md:col-span-4">
                                    <Label className="text-[10px] font-black uppercase text-muted-foreground">Observações Opcionais</Label>
                                    <Input value={rule.notes} onChange={e => updateSourceBank(index, 'notes', e.target.value)} placeholder="Ex: Só compra com refin" className="h-10 rounded-xl" />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
          </TabsContent>

          <TabsContent value="valores" className="mt-0 pt-2 pb-10">
             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                {[
                    { key: 'minInstallment', label: 'Parcela Mínima (R$)', type: 'number' },
                    { key: 'minOperationValue', label: 'Valor Op. Mínimo (Ticket R$)', type: 'number' },
                    { key: 'minBalance', label: 'Saldo Devedor Mínimo (R$)', type: 'number' },
                    { key: 'minCashback', label: 'Troco Mínimo (R$)', type: 'number' },
                    { key: 'cashbackPercentage', label: 'Mínimo Troco (%)', type: 'number' },
                ].map(item => (
                    <div key={item.key} className="space-y-3 p-6 rounded-[2rem] border bg-muted/5 shadow-sm">
                        <Label className="text-xs font-black uppercase text-muted-foreground">{item.label}</Label>
                        <Input 
                            type={item.type}
                            value={(formData.valuesRules as any)?.[item.key]} 
                            onChange={e => updateField('valuesRules', item.key, Number(e.target.value))} 
                            className="bg-background border-border/50 h-11"
                        />
                    </div>
                ))}
            </div>
          </TabsContent>

          <TabsContent value="taxas" className="mt-0 pt-2 pb-10">
             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                 {[
                    { key: 'minPortabilityRate', label: 'Taxa Min. Port (%)' },
                    { key: 'maxPortabilityRate', label: 'Taxa Max. Port (%)' },
                    { key: 'minRefinRate', label: 'Taxa Min. Refin (%)' },
                    { key: 'maxRefinRate', label: 'Taxa Max. Refin (%)' },
                ].map(item => (
                    <div key={item.key} className="space-y-3 p-6 rounded-[2rem] border bg-muted/5 shadow-sm">
                        <Label className="text-xs font-black uppercase text-muted-foreground">{item.label}</Label>
                        <Input 
                            type="number" step="0.01"
                            value={(formData.rateRules as any)?.[item.key]} 
                            onChange={e => updateField('rateRules', item.key, Number(e.target.value))} 
                            className="bg-background border-border/50 h-11"
                        />
                    </div>
                ))}
             </div>
             <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
                 {[
                    { key: 'requiresRefinForRate', label: 'Exige Refin. para Taxa' },
                    { key: 'hasSpecialTable', label: 'Tabela Especial Disponível' },
                    { key: 'requiresTicketCheck', label: 'Validar Ticket vs Taxa' },
                ].map(item => (
                     <div key={item.key} className="flex items-center gap-3 p-4 rounded-xl border bg-card">
                        <Switch checked={(formData.rateRules as any)?.[item.key]} onCheckedChange={c => updateField('rateRules', item.key, c)} />
                        <Label className="text-xs font-bold uppercase">{item.label}</Label>
                    </div>
                ))}
             </div>
          </TabsContent>

          <TabsContent value="idade" className="mt-0 space-y-6">
              <div className="flex items-center justify-between">
                  <div className="max-w-md">
                      <h4 className="font-black text-lg uppercase tracking-tight leading-tight">Idade, Prazo e Valor</h4>
                      <p className="text-xs text-muted-foreground mt-1 text-balance">Configure restrições etárias e prazos máximos que mudam conforme o valor do contrato.</p>
                  </div>
                  <Button onClick={addAgeRule} variant="outline" size="sm" className="rounded-full h-10 uppercase text-[10px] font-black border-2 shadow-sm"><PlusCircle className="h-4 w-4 mr-2" /> Adicionar Faixa</Button>
              </div>

              {(formData.ageRules || []).length === 0 && (
                  <div className="p-12 text-center border-2 border-dashed rounded-[2rem] opacity-60 bg-muted/5">
                      <UserCircle className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
                      <p className="text-sm font-bold uppercase">Nenhuma regra etária cadastrada.</p>
                      <p className="text-[10px] uppercase tracking-widest mt-1">O banco aceitará qualquer idade dentro dos padrões operacionais.</p>
                  </div>
              )}

              <div className="space-y-4">
                {(formData.ageRules || []).map((rule, idx) => (
                    <Card key={rule.id || idx} className="rounded-[2.5rem] border-2 shadow-none relative group overflow-visible">
                        <Button 
                            variant="destructive" size="icon" 
                            className="absolute -top-3 -right-3 h-8 w-8 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-md z-10"
                            onClick={() => removeAgeRule(idx)}
                        >
                            <Trash2 className="h-4 w-4"/>
                        </Button>
                        <CardHeader className="bg-muted/10 py-3 border-b rounded-t-[2.5rem]">
                            <CardTitle className="text-[10px] font-black uppercase tracking-widest text-primary text-center">Configuração de Faixa #{idx + 1}</CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Valor Mínimo (R$)</Label>
                                    <Input type="number" value={rule.minContractValue || 0} onChange={e => updateAgeRule(idx, 'minContractValue', Number(e.target.value))} className="h-11 rounded-2xl bg-muted/5 border-border/50 font-bold" />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Valor Máximo (R$)</Label>
                                    <Input type="number" value={rule.maxContractValue || 0} onChange={e => updateAgeRule(idx, 'maxContractValue', Number(e.target.value))} className="h-11 rounded-2xl bg-muted/5 border-border/50 font-bold" />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 pt-2">
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Idade Mínima</Label>
                                    <Input type="number" value={rule.minAge || 0} onChange={e => updateAgeRule(idx, 'minAge', Number(e.target.value))} className="h-11 rounded-2xl bg-muted/5 border-border/50" />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Idade Máxima</Label>
                                    <Input type="number" value={rule.maxAge || 0} onChange={e => updateAgeRule(idx, 'maxAge', Number(e.target.value))} className="h-11 rounded-2xl bg-muted/5 border-border/50" />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Máx. Fim Volante</Label>
                                    <Input type="number" value={rule.maxAgeAtContractEnd || 0} onChange={e => updateAgeRule(idx, 'maxAgeAtContractEnd', Number(e.target.value))} className="h-11 rounded-2xl bg-muted/5 border-border/50" title="Idade máxima permitida no fim do contrato (Idade + Prazo)" />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Idade Final Fixa</Label>
                                    <Input type="number" value={rule.contractMustEndByAge || 0} onChange={e => updateAgeRule(idx, 'contractMustEndByAge', Number(e.target.value))} className="h-11 rounded-2xl bg-muted/5 border-border/50" title="Idade absoluta em que o contrato TEM que terminar" />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Prazo Máx. (m)</Label>
                                    <Input type="number" value={rule.maxInstallments || 0} onChange={e => updateAgeRule(idx, 'maxInstallments', Number(e.target.value))} className="h-11 rounded-2xl bg-muted/5 border-border/50" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Observação Interna</Label>
                                <Input value={rule.observations || ''} onChange={e => updateAgeRule(idx, 'observations', e.target.value)} className="h-11 rounded-2xl bg-muted/5 border-border/50" placeholder="Ex: Regra válida para pensionistas nesta faixa" />
                            </div>
                        </CardContent>
                    </Card>
                ))}
              </div>
          </TabsContent>

          <TabsContent value="condicoes" className="mt-0 space-y-6">
                <div className="flex items-center justify-between">
                    <div className="max-w-md">
                        <h3 className="font-black uppercase tracking-tight text-lg leading-tight">Regras Condicionais</h3>
                        <p className="text-xs text-muted-foreground mt-1">Exemplo: "Se saldo devedor for maior que R$ 10.000, exige 24 parcelas pagas ao invés de 12."</p>
                    </div>
                    <Button onClick={addCondition} size="sm" className="rounded-full shadow-md font-bold text-xs h-9">
                        <Plus className="h-3.5 w-3.5 mr-1" /> Criar Condição Especial
                    </Button>
                </div>
                 {formData.conditions?.length === 0 ? (
                    <div className="text-center p-10 bg-muted/10 rounded-3xl border-2 border-dashed">
                        <p className="text-sm font-medium text-muted-foreground">Nenhuma condicional dinâmica (If/Then) cadastrada.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {formData.conditions?.map((rule, index) => (
                            <div key={index} className="p-5 rounded-3xl border border-orange-200/50 bg-orange-50/10 dark:bg-orange-950/20 shadow-sm space-y-4 relative group">
                                <Button 
                                    variant="destructive" size="icon" 
                                    className="absolute -top-3 -right-3 h-8 w-8 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
                                    onClick={() => removeCondition(index)}
                                >
                                    <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                                <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-5 gap-4">
                                     <div className="space-y-2 col-span-1 md:col-span-2">
                                        <Label className="text-[10px] font-black uppercase text-muted-foreground">Descrição / Lógica Ocular</Label>
                                        <Input value={rule.ruleDescription} onChange={e => updateCondition(index, 'ruleDescription', e.target.value)} placeholder="Ex: De 5k a 10k exige 15 parcelas" className="bg-background" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase text-muted-foreground">Teto Mínimo</Label>
                                        <Input type="number" value={rule.minValue} onChange={e => updateCondition(index, 'minValue', Number(e.target.value))} className="bg-background" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase text-muted-foreground">Teto Máximo</Label>
                                        <Input type="number" value={rule.maxValue} onChange={e => updateCondition(index, 'maxValue', Number(e.target.value))} className="bg-background" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase text-muted-foreground">Nº Parc. Condicional</Label>
                                        <Input type="number" value={rule.minInstallments} onChange={e => updateCondition(index, 'minInstallments', Number(e.target.value))} className="bg-background" />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
          </TabsContent>

          <TabsContent value="textos" className="mt-0">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <Label className="text-xs font-black uppercase text-muted-foreground">O que faz? / Instrução Gen.</Label>
                    <Textarea 
                        value={(formData.texts as any)?.whatItDoes} 
                        onChange={e => updateField('texts', 'whatItDoes', e.target.value)}
                        className="h-24 bg-muted/10 border-border/50 resize-none font-medium"
                        placeholder="Ex: Faz portabilidade com refinanciamento acima de 12 parcelas pagas."
                    />
                </div>
                 <div className="space-y-2">
                    <Label className="text-xs font-black uppercase text-muted-foreground">O que NÃO faz / Restrições</Label>
                    <Textarea 
                        value={(formData.texts as any)?.whatItDoesNotDo} 
                        onChange={e => updateField('texts', 'whatItDoesNotDo', e.target.value)}
                        className="h-24 bg-red-500/5 border-red-500/20 text-red-700 dark:text-red-300 resize-none font-medium placeholder:text-red-300"
                        placeholder="Ex: Não atende conta salário sem TED processado."
                    />
                </div>
                 <div className="space-y-2 md:col-span-2">
                    <Label className="text-xs font-black uppercase text-muted-foreground">Observações Adicionais</Label>
                    <Textarea 
                        value={(formData.texts as any)?.observations} 
                        onChange={e => updateField('texts', 'observations', e.target.value)}
                        className="h-16 bg-muted/10 border-border/50 resize-none"
                    />
                </div>

                <div className="space-y-4 md:col-span-2 pt-4 border-t">
                     <h3 className="font-black uppercase tracking-tight text-sm">Avançado Administrativo</h3>
                     <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                         <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase text-muted-foreground">Regras por Idade</Label>
                            <Input value={(formData.advancedRules as any)?.rulesByAge} onChange={e => updateField('advancedRules', 'rulesByAge', e.target.value)} placeholder="Ex: De 22 a 73 anos apenas" />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase text-muted-foreground">Espécies Banidas</Label>
                            <Input value={(formData.advancedRules as any)?.rulesBySpecies} onChange={e => updateField('advancedRules', 'rulesBySpecies', e.target.value)} placeholder="Ex: Não aceita 87, 88" />
                        </div>
                         <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase text-muted-foreground">Filtro de Convênio</Label>
                            <Input value={(formData.advancedRules as any)?.rulesByAgreement} onChange={e => updateField('advancedRules', 'rulesByAgreement', e.target.value)} placeholder="Ex: Apenas INSS, não aceita SIAPE" />
                        </div>
                     </div>
                     <div className="mt-4 flex items-center gap-3 p-4 rounded-xl border bg-orange-50 dark:bg-orange-950/20 border-orange-200">
                        <Switch checked={(formData.texts as any)?.manualAnalysisRequired} onCheckedChange={c => updateField('texts', 'manualAnalysisRequired', c)} />
                        <div>
                            <Label className="text-xs font-black text-orange-700 dark:text-orange-400">Requer Análise Manual OBRIGATÓRIA</Label>
                            <p className="text-[10px] text-orange-600/70">O motor não fechará operação, jogará aviso amarelo (Atenção).</p>
                        </div>
                    </div>
                </div>
             </div>
          </TabsContent>
        </div>
      </Tabs>
      
      <div className="shrink-0 p-6 border-t bg-background flex items-center justify-between shadow-[0_-15px_30px_-15px_rgba(0,0,0,0.1)] z-10 sticky bottom-0">
         <Button variant="ghost" onClick={onClose} className="rounded-full px-6 font-bold text-muted-foreground">Cancelar</Button>
         <Button onClick={handleSave} disabled={isSaving} className="rounded-full h-11 px-10 font-bold bg-[#00AEEF] hover:bg-[#0096D1] shadow-xl text-white">
            {isSaving ? "Salvando..." : <><Check className="h-4 w-4 mr-2" /> Salvar Regra</>}
         </Button>
      </div>
    </div>
  );
}
