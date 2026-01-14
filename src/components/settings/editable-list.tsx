
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
import { PlusCircle, Trash2, Edit, Save, X } from 'lucide-react';
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
  setItems: React.Dispatch<React.SetStateAction<string[]>>;
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
    <AccordionItem value={title}>
      <AccordionTrigger>{title}</AccordionTrigger>
      <AccordionContent>
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {items.map((item, index) => (
              <div key={index} className="relative group">
                {editingIndex === index ? (
                  <div className="flex items-center gap-2">
                    <Input
                      value={editingValue}
                      onChange={(e) => setEditingValue(e.target.value)}
                      className="h-8"
                    />
                    <Button size="icon" className="h-8 w-8" onClick={() => handleSaveEdit(index)}>
                        <Save className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-8 w-8" onClick={handleCancelEditing}>
                        <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <Badge variant="secondary" className="pr-8 text-sm">
                    {item}
                    <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => handleStartEditing(index, item)} className="text-foreground/70 hover:text-foreground">
                        <Edit className="h-3 w-3" />
                      </button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <button className="text-destructive/70 hover:text-destructive">
                                <Trash2 className="h-3 w-3" />
                            </button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    Essa ação não pode ser desfeita. Isso irá remover permanentemente o item &quot;{item}&quot;.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleRemoveItem(index)}>Remover</AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </Badge>
                )}
              </div>
            ))}
          </div>
          <div className="flex items-center gap-2 pt-4">
            <Input
              placeholder="Adicionar novo item..."
              value={newItem}
              onChange={(e) => setNewItem(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddItem()}
            />
            <Button onClick={handleAddItem}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Adicionar
            </Button>
          </div>
        </div>
      </AccordionContent>
    </AccordionItem>
  );
}
