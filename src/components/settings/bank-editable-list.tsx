
'use client';

import React, { useState } from 'react';
import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { PlusCircle, Trash2, Edit, Save, X, Globe, Sparkles, Loader2, Bot, Building2, Landmark } from 'lucide-react';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { getBankDomain } from '@/ai/flows/get-bank-domain-flow';
import { BankIcon } from '@/components/bank-icon';
import { toast } from '@/hooks/use-toast';

interface BankEditableListProps {
  title?: string;
  banks: string[];
  bankDomains: Record<string, string>;
  onUpdate: (banks: string[], domains: Record<string, string>) => void;
}

export function BankEditableList({ title = "Bancos e Ícones Inteligentes", banks, bankDomains, onUpdate }: BankEditableListProps) {
  const [newItemName, setNewItemName] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editName, setEditName] = useState('');
  const [editDomain, setEditDomain] = useState('');

  const handleAddItem = async () => {
    if (!newItemName.trim()) return;
    
    setIsAdding(true);
    try {
        const { domain } = await getBankDomain({ bankName: newItemName.trim() });
        const newBanks = [...banks, newItemName.trim()];
        const newDomains = { ...bankDomains };
        if (domain) newDomains[newItemName.trim()] = domain;
        
        onUpdate(newBanks, newDomains);
        setNewItemName('');
        toast({ title: "Item Adicionado!", description: domain ? "Ícone detectado via IA." : "Ícone não encontrado, defina manualmente se desejar." });
    } catch (e) {
        onUpdate([...banks, newItemName.trim()], bankDomains);
        setNewItemName('');
    } finally {
        setIsAdding(false);
    }
  };

  const handleRemoveItem = (name: string) => {
    const newBanks = banks.filter(b => b !== name);
    const newDomains = { ...bankDomains };
    delete newDomains[name];
    onUpdate(newBanks, newDomains);
  };

  const handleStartEdit = (index: number, name: string) => {
    setEditingIndex(index);
    setEditName(name);
    setEditDomain(bankDomains[name] || '');
  };

  const handleSaveEdit = (oldName: string) => {
    const newBanks = [...banks];
    const index = newBanks.indexOf(oldName);
    if (index === -1) return;

    newBanks[index] = editName.trim();
    const newDomains = { ...bankDomains };
    delete newDomains[oldName];
    if (editDomain.trim()) newDomains[editName.trim()] = editDomain.trim();

    onUpdate(newBanks, newDomains);
    setEditingIndex(null);
  };

  return (
    <AccordionItem value={title}>
      <AccordionTrigger className="flex items-center gap-2">
        {title.includes("Bancos") ? <Building2 className="h-4 w-4 text-blue-500" /> : title.includes("Órgãos") ? <Landmark className="h-4 w-4 text-emerald-500" /> : <Bot className="h-4 w-4 text-purple-500" />}
        {title}
      </AccordionTrigger>
      <AccordionContent>
        <div className="space-y-4">
          <div className="flex flex-wrap gap-3">
            {banks.map((bank, index) => (
              <div key={index} className="relative group">
                {editingIndex === index ? (
                  <div className="flex items-center gap-2 bg-muted p-2 rounded-lg border">
                    <Input value={editName} onChange={e => setEditName(e.target.value)} className="h-8 w-32" placeholder="Nome" />
                    <div className="relative">
                        <Globe className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                        <Input value={editDomain} onChange={e => setEditDomain(e.target.value)} className="h-8 w-40 pl-7" placeholder="site.com.br" />
                    </div>
                    <Button size="icon" className="h-8 w-8" onClick={() => handleSaveEdit(bank)}><Save className="h-4 w-4" /></Button>
                    <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setEditingIndex(null)}><X className="h-4 w-4" /></Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-secondary/50 border rounded-full hover:border-primary transition-all group/item">
                    <BankIcon bankName={bank} domain={bankDomains[bank]} className="h-4 w-4" />
                    <span className="text-sm font-medium">{bank}</span>
                    <div className="flex items-center gap-1 ml-2 opacity-0 group-hover/item:opacity-100 transition-opacity">
                        <button onClick={() => handleStartEdit(index, bank)} className="text-muted-foreground hover:text-primary"><Edit className="h-3 w-3" /></button>
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <button className="text-muted-foreground hover:text-destructive"><Trash2 className="h-3 w-3" /></button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Remover {bank}?</AlertDialogTitle>
                                    <AlertDialogDescription>Este parceiro será excluído da sua lista de opções.</AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Voltar</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleRemoveItem(bank)}>Remover</AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="flex items-center gap-2 pt-4 border-t mt-4">
            <div className="relative flex-1">
                <Input
                    placeholder="Nome do parceiro (IA buscará o logo)..."
                    value={newItemName}
                    onChange={(e) => setNewItemName(e.target.value)}
                    disabled={isAdding}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddItem()}
                />
                <Sparkles className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary opacity-30" />
            </div>
            <Button onClick={handleAddItem} disabled={isAdding || !newItemName.trim()}>
              {isAdding ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PlusCircle className="mr-2 h-4 w-4" />}
              Adicionar com IA
            </Button>
          </div>
          <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest flex items-center gap-2">
            <Bot className="h-3 w-3" /> A Inteligência Artificial buscará a identidade visual oficial automaticamente.
          </p>
        </div>
      </AccordionContent>
    </AccordionItem>
  );
}
