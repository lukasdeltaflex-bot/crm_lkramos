'use client';

import React, { useEffect, useState } from 'react';
import { useUser, useFirestore } from '@/firebase';
import { Button } from '@/components/ui/button';
import { PlusCircle, Search, Settings2, Trash2, Edit, CopyPlus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { toast } from '@/hooks/use-toast';
import { PortabilityRule } from '@/lib/types';
import { portabilityRulesService } from '@/lib/services/portabilityRules';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { RuleForm } from './rule-form';

export function RulesManager() {
  const { user } = useUser();
  const [rules, setRules] = useState<PortabilityRule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<PortabilityRule | undefined>(undefined);

  const fetchRules = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const data = await portabilityRulesService.getCurrentRules(user.uid);
      setRules(data);
    } catch (err) {
      toast({ variant: 'destructive', title: 'Erro ao buscar regras' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRules();
  }, [user]);

  const handleToggleActive = async (ruleId: string, currentStatus: boolean) => {
    if (!user) return;
    try {
      // Optimistic update
      setRules(prev => prev.map(r => r.id === ruleId ? { ...r, isActive: !currentStatus } : r));
      await portabilityRulesService.toggleActive(ruleId, !currentStatus, user.uid);
      toast({ title: !currentStatus ? 'Regra ativada' : 'Regra inativada' });
    } catch (err) {
      toast({ variant: 'destructive', title: 'Erro ao alterar status' });
      fetchRules(); // Revert on error
    }
  };

  const handleDelete = async (ruleId: string) => {
    if (!user || !confirm('Tem certeza que deseja apagar permanentemente esta regra?')) return;
    try {
      await portabilityRulesService.deleteRule(ruleId, user.uid);
      setRules(prev => prev.filter(r => r.id !== ruleId));
      toast({ title: 'Regra excluída permanentemente' });
    } catch (err) {
      toast({ variant: 'destructive', title: 'Erro ao excluir' });
    }
  };

  const handleOpenNew = () => {
    setEditingRule(undefined);
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (rule: PortabilityRule) => {
    setEditingRule(rule);
    setIsDialogOpen(true);
  };

  const handleOpenDuplicate = (rule: PortabilityRule) => {
    const duplicated = { ...rule };
    delete duplicated.id;
    delete duplicated.version;
    delete duplicated.validFrom;
    delete duplicated.validUntil;
    delete duplicated.isCurrent;
    duplicated.isActive = true;
    duplicated.bankName = `${duplicated.bankName} (Cópia)`;
    setEditingRule(duplicated);
    setIsDialogOpen(true);
  };

  const filteredRules = rules.filter(r => 
    r.bankName.toLowerCase().includes(search.toLowerCase()) || 
    r.promoter.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground opacity-50" />
          <Input 
            placeholder="Buscar por banco destino ou promotora..." 
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-10 h-11 rounded-full bg-background border-border"
          />
        </div>
        <Button 
          onClick={handleOpenNew}
          className="h-11 px-8 rounded-full font-bold bg-[#00AEEF] hover:bg-[#0096D1] text-white shadow-lg transition-all"
        >
          <PlusCircle className="h-4 w-4 mr-2" />
          Nova Regra
        </Button>
      </div>

      <div className="bg-background rounded-3xl border border-border/50 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-8 space-y-4">
            <Skeleton className="h-16 w-full rounded-2xl" />
            <Skeleton className="h-16 w-full rounded-2xl" />
            <Skeleton className="h-16 w-full rounded-2xl" />
          </div>
        ) : filteredRules.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-20 text-center">
            <Settings2 className="h-12 w-12 text-muted-foreground/30 mb-4" />
            <p className="text-xl font-bold mb-2">Nenhuma regra ativa</p>
            <p className="text-sm text-muted-foreground max-w-md mb-6">
              Cadastre as políticas e limitações dos bancos para alimentar a IA do motor de simulação de portabilidade.
            </p>
            <Button onClick={handleOpenNew} variant="outline" className="rounded-full font-bold">
              Criar a Primeira Regra
            </Button>
          </div>
        ) : (
          <div className="divide-y divide-border/50">
            {filteredRules.map(rule => (
                <div key={rule.id} className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between p-4 px-6 hover:bg-muted/10 transition-colors">
                    <div className="flex flex-col gap-1.5 flex-1">
                        <div className="flex items-center gap-2">
                            <span className="font-black text-lg tracking-tight uppercase">{rule.bankName}</span>
                            <Badge variant="outline" className="text-[10px] font-black tracking-widest">{rule.product}</Badge>
                            <Badge className="bg-primary/10 text-primary hover:bg-primary/20 text-[10px] font-black">v{rule.version}</Badge>
                        </div>
                        <div className="flex items-center gap-4 text-xs font-semibold text-muted-foreground">
                            <span>Promotora: {rule.promoter}</span>
                            <span className="flex items-center gap-1.5">
                                Status: 
                                <span className={rule.isActive ? 'text-green-500' : 'text-red-500'}>
                                    {rule.isActive ? 'Ativo' : 'Inativo'}
                                </span>
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center gap-6 mt-4 md:mt-0">
                        <div className="flex items-center gap-2">
                            <Switch 
                                checked={rule.isActive} 
                                onCheckedChange={() => handleToggleActive(rule.id, rule.isActive)} 
                            />
                            <span className="text-xs font-bold whitespace-nowrap">
                                {rule.isActive ? 'ATIVA' : 'INATIVA'}
                            </span>
                        </div>
                        
                        <div className="flex items-center gap-2">
                            <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => handleOpenDuplicate(rule)}
                                className="h-8 rounded-full px-4 text-xs font-bold hover:bg-blue-500/10 hover:text-blue-500"
                            >
                                <CopyPlus className="h-3 w-3 mr-1.5" /> Duplicar
                            </Button>
                            <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => handleOpenEdit(rule)}
                                className="h-8 rounded-full px-4 text-xs font-bold hover:bg-primary/10 hover:text-primary"
                            >
                                <Edit className="h-3 w-3 mr-1.5" /> Editar
                            </Button>
                            <Button 
                                variant="ghost" 
                                size="icon" 
                                onClick={() => handleDelete(rule.id)}
                                className="h-8 w-8 rounded-full text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                            >
                                <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                        </div>
                    </div>
                </div>
            ))}
          </div>
        )}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent 
            className="max-w-7xl w-[95vw] h-[90vh] flex flex-col p-0 overflow-hidden rounded-[3rem] border-none shadow-2xl"
            onPointerDownOutside={(e) => e.preventDefault()}
        >
          <DialogHeader className="px-8 pt-8 pb-4 shrink-0 bg-muted/5 border-b">
            <DialogTitle className="text-xl font-black uppercase tracking-tight text-primary">
                {editingRule ? `Editar Regra: ${editingRule.bankName}` : 'Nova Regra Bancária'}
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto w-full">
            <RuleForm 
              initialData={editingRule} 
              onClose={() => setIsDialogOpen(false)} 
              onSaved={() => {
                fetchRules();
                setIsDialogOpen(false);
              }} 
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
