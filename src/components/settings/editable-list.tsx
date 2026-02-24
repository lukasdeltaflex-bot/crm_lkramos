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
import { PlusCircle, Trash2, Edit, Save, X, SmilePlus } from 'lucide-react';
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
  } from "@/components/ui/alert-dialog"

interface EditableListProps {
  title: string;
  items: string[];
  setItems: (items: string[]) => void;
}

export function EditableList({ title, items, setItems }: EditableListProps) {
  const [newItem, setNewItem] = useState('');
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingValue, setEditingValue] = useState('');

  const handleAddItem = () => {
    if (newItem.trim()) {
      setItems([...items, newItem.trim()]);
      setNewItem('');
    }
  };

  const handleRemoveItem = (indexToRemove: number) => {
    setItems(items.filter((_, index) => index !== indexToRemove));
  };

  const handleStartEditing = (index: number, value: string) => {
    setEditingIndex(index);
    setEditingValue(value);
  };

  const handleCancelEditing = () => {
    setEditingIndex(null);
    setEditingValue('');
  };

  const handleSaveEdit = (index: number) => {
    if (editingValue.trim()) {
      const updatedItems = [...items];
      updatedItems[index] = editingValue.trim();
      setItems(updatedItems);
      handleCancelEditing();
    }
  };

  return (
    <AccordionItem value={title} className="border-none">
      <AccordionTrigger className="hover:no-underline py-3">
        <span className="font-bold text-sm uppercase tracking-tight">{title}</span>
      </AccordionTrigger>
      <AccordionContent>
        <div className="space-y-4 pt-2">
          <div className="flex flex-wrap gap-2">
            {items.map((item, index) => (
              <div key={index} className="relative group">
                {editingIndex === index ? (
                  <div className="flex items-center gap-2 bg-muted/50 p-1 rounded-lg border">
                    <Input
                      value={editingValue}
                      onChange={(e) => setEditingValue(e.target.value)}
                      className="h-8 text-xs font-bold"
                      autoFocus
                    />
                    <Button size="icon" className="h-7 w-7" onClick={() => handleSaveEdit(index)}>
                        <Save className="h-3.5 w-3.5" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={handleCancelEditing}>
                        <X className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ) : (
                  <Badge variant="secondary" className="pl-3 pr-9 py-1.5 text-xs font-bold rounded-full border-2 border-transparent hover:border-primary/20 transition-all relative">
                    {item}
                    <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity bg-secondary rounded-full px-1">
                      <button onClick={() => handleStartEditing(index, item)} className="p-1 text-muted-foreground hover:text-primary transition-colors">
                        <Edit className="h-3 w-3" />
                      </button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <button className="p-1 text-muted-foreground hover:text-destructive transition-colors">
                                <Trash2 className="h-3 w-3" />
                            </button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Remover item?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    Deseja excluir permanentemente o item "{item}" desta lista?
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleRemoveItem(index)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Remover</AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </Badge>
                )}
              </div>
            ))}
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center gap-2">
                <div className="relative flex-1">
                    <Input
                        placeholder={title.includes('Tag') ? "Ex: 💎 VIP ou ✅ Margem" : "Adicionar novo item..."}
                        value={newItem}
                        onChange={(e) => setNewItem(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAddItem()}
                        className="rounded-full h-10 px-4"
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 text-[10px] font-black text-muted-foreground/40 pointer-events-none uppercase">
                        <SmilePlus className="h-3.5 w-3.5" />
                        <span>Win + .</span>
                    </div>
                </div>
                <Button onClick={handleAddItem} className="rounded-full h-10 px-6 font-bold" disabled={!newItem.trim()}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Adicionar
                </Button>
            </div>
            <p className="text-[9px] text-muted-foreground font-medium uppercase tracking-widest pl-4">
                Dica: Use <kbd className="bg-muted px-1 rounded border">Win + .</kbd> ou <kbd className="bg-muted px-1 rounded border">Cmd + Ctrl + Space</kbd> para inserir símbolos.
            </p>
          </div>
        </div>
      </AccordionContent>
    </AccordionItem>
  );
}
