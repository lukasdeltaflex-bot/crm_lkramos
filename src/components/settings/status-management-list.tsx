'use client';

import React, { useState, useMemo } from 'react';
import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { 
  PlusCircle, 
  Trash2, 
  Edit, 
  Save, 
  X, 
  GripVertical, 
  LayoutDashboard,
  Target,
  CheckCircle2,
  XCircle,
  Ban,
  Hourglass,
  CircleDot
} from 'lucide-react';

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
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { cn, normalizeStatuses } from '@/lib/utils';
import type { ProposalStatusConfig, StatusBehavior } from '@/lib/types';

const BEHAVIOR_LABELS: Record<string, { label: string; color: string; icon: any }> = {
  'pending': { label: 'Pendente', color: 'text-amber-500', icon: CircleDot },
  'in_progress': { label: 'Em Esteira', color: 'text-blue-500', icon: Hourglass },
  'success': { label: 'Sucesso/Pago', color: 'text-emerald-500', icon: CheckCircle2 },
  'rejection': { label: 'Reprovado', color: 'text-red-500', icon: XCircle },
  'canceled': { label: 'Cancelado', color: 'text-zinc-500', icon: Ban },
};

interface SortableStatusItemProps {
  id: string;
  config: ProposalStatusConfig;
  onUpdate: (id: string, updates: Partial<ProposalStatusConfig>) => void;
  onRemove: (id: string) => void;
}

function SortableStatusItem({
  id,
  config,
  onUpdate,
  onRemove,
}: SortableStatusItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editLabel, setEditLabel] = useState(config.label);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : undefined,
  };

  const handleSave = () => {
    if (editLabel.trim()) {
      onUpdate(config.id, { label: editLabel.trim() });
      setIsEditing(false);
    }
  };

  const behaviorInfo = BEHAVIOR_LABELS[config.behavior || 'pending'];
  const BehaviorIcon = behaviorInfo.icon;

  return (
    <div 
        ref={setNodeRef} 
        style={style} 
        className={cn(
            "flex items-center gap-4 bg-background border-2 p-3 rounded-2xl transition-all group shadow-sm",
            isDragging && "opacity-50 scale-[1.02] shadow-xl border-primary/20 bg-muted/30",
            !config.isActive && "opacity-60 grayscale-[0.5]"
        )}
    >
      <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing p-1 text-muted-foreground/30 hover:text-primary transition-colors">
        <GripVertical className="h-5 w-5" />
      </div>

      <div className="flex-1 min-w-0">
        {isEditing ? (
          <div className="flex items-center gap-2">
            <Input 
                value={editLabel} 
                onChange={(e) => setEditLabel(e.target.value)} 
                className="h-9 font-bold text-sm"
                autoFocus
                onKeyDown={(e) => e.key === 'Enter' && handleSave()}
            />
            <Button size="icon" className="h-9 w-9 shrink-0" onClick={handleSave}><Save className="h-4 w-4" /></Button>
            <Button size="icon" variant="ghost" className="h-9 w-9 shrink-0" onClick={() => setIsEditing(false)}><X className="h-4 w-4" /></Button>
          </div>
        ) : (
          <div className="flex flex-col">
            <div className="flex items-center gap-3">
                <span className="font-bold text-sm truncate uppercase tracking-tight">{config.label}</span>
                <Badge variant={config.isActive ? "default" : "secondary"} className="text-[9px] h-4 leading-none px-1.5 font-black uppercase">
                    {config.isActive ? "Ativo" : "Inativo"}
                </Badge>
                <button onClick={() => setIsEditing(true)} className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-muted-foreground hover:text-primary">
                    <Edit className="h-3.5 w-3.5" />
                </button>
            </div>
            <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[9px] text-muted-foreground font-medium uppercase tracking-widest leading-none">ID: {config.id}</span>
                <span className="text-[9px] text-muted-foreground/30">•</span>
                <div className={cn("flex items-center gap-1 text-[9px] font-black uppercase tracking-widest", behaviorInfo.color)}>
                    <BehaviorIcon className="h-2.5 w-2.5" />
                    {behaviorInfo.label}
                </div>
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center gap-4 shrink-0 pr-2">
          <div className="flex flex-col items-start gap-1 w-[130px]">
              <Label className="text-[8px] font-black uppercase tracking-tighter text-muted-foreground/60 leading-none pl-1">Comportamento (Lógica)</Label>
              <Select 
                value={config.behavior || 'pending'} 
                onValueChange={(val: any) => onUpdate(config.id, { behavior: val })}
              >
                <SelectTrigger className="h-7 text-[9px] font-bold uppercase border-muted/30 focus:ring-0">
                    <SelectValue />
                </SelectTrigger>
                <SelectContent>
                    {Object.entries(BEHAVIOR_LABELS).map(([value, info]) => (
                        <SelectItem key={value} value={value} className="text-[10px] font-bold uppercase">
                            <div className="flex items-center gap-2">
                                <info.icon className={cn("h-3 w-3", info.color)} />
                                {info.label}
                            </div>
                        </SelectItem>
                    ))}
                </SelectContent>
              </Select>
          </div>

          <div className="flex flex-col items-center gap-1">
              <Label className="text-[8px] font-black uppercase tracking-tighter text-muted-foreground/60 leading-none">Dashboard</Label>
              <Switch 
                checked={config.showOnDashboard} 
                onCheckedChange={(val) => onUpdate(config.id, { showOnDashboard: val })}
                className="scale-75 data-[state=checked]:bg-primary"
              />
          </div>

          <div className="flex flex-col items-center gap-1">
              <Label className="text-[8px] font-black uppercase tracking-tighter text-muted-foreground/60 leading-none">Poderá Usar</Label>
              <Switch 
                checked={config.isActive} 
                onCheckedChange={(val) => onUpdate(config.id, { isActive: val })}
                className="scale-75 data-[state=checked]:bg-emerald-500"
              />
          </div>

          <AlertDialog>
              <AlertDialogTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground/40 hover:text-destructive hover:bg-destructive/5 transition-colors">
                      <Trash2 className="h-4 w-4" />
                  </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="rounded-[2rem]">
                  <AlertDialogHeader>
                      <AlertDialogTitle>Remover Status?</AlertDialogTitle>
                      <AlertDialogDescription>
                          Deseja remover "{config.label}"? 
                          <br/><br/>
                          <span className="font-bold text-destructive underline uppercase text-xs">Padrão de Segurança:</span> 
                          <span className="text-xs block mt-1">Propostas que já utilizam este status continuarão vinculadas ao ID original. Recomendamos apenas **Desativar** o status em vez de excluí-lo para preservar o histórico operacional.</span>
                      </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                      <AlertDialogCancel className="rounded-full">Cancelar</AlertDialogCancel>
                      <AlertDialogAction onClick={() => onRemove(config.id)} className="bg-destructive text-white hover:bg-destructive/90 rounded-full">Confirmar Exclusão</AlertDialogAction>
                  </AlertDialogFooter>
              </AlertDialogContent>
          </AlertDialog>
      </div>
    </div>
  );
}

export function StatusManagementList({ 
  items, 
  setItems 
}: { 
  items: (string | ProposalStatusConfig)[]; 
  setItems: (newItems: ProposalStatusConfig[]) => void 
}) {
  const [newItemLabel, setNewItemLabel] = useState('');
  const [newItemBehavior, setNewItemBehavior] = useState<StatusBehavior>('in_progress');

  const normalizedItems = useMemo(() => normalizeStatuses(items), [items]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = normalizedItems.findIndex(i => i.id === active.id);
      const newIndex = normalizedItems.findIndex(i => i.id === over.id);
      
      const moved = arrayMove(normalizedItems, oldIndex, newIndex).map((item, idx) => ({
          ...item,
          order: idx
      }));
      setItems(moved);
    }
  };

  const addItem = () => {
    if (newItemLabel.trim()) {
      const label = newItemLabel.trim();
      
      const id = label.toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/\s+/g, '-')
        .replace(/[^\w-]/g, '');
      
      if (normalizedItems.some(i => i.id === id)) return;

      const newItem: ProposalStatusConfig = {
        id,
        label,
        isActive: true,
        showOnDashboard: true,
        order: normalizedItems.length,
        behavior: newItemBehavior
      };
      setItems([...normalizedItems, newItem]);
      setNewItemLabel('');
      setNewItemBehavior('in_progress');
    }
  };

  const updateItem = (id: string, updates: Partial<ProposalStatusConfig>) => {
    setItems(normalizedItems.map(item => 
        item.id === id ? { ...item, ...updates } : item
    ));
  };

  const removeItem = (id: string) => {
    setItems(normalizedItems.filter(item => item.id !== id));
  };

  return (
    <AccordionItem value="status-proposta" className="border-none">
      <AccordionTrigger className="hover:no-underline py-4">
        <div className="flex items-center gap-3">
            <LayoutDashboard className="h-5 w-5 text-primary" />
            <div className="flex flex-col items-start gap-0.5">
                <span className="font-black text-sm uppercase tracking-tight">Status da Proposta (Configuração Avançada)</span>
                <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest leading-none">Controles Semânticos, Dashboard e Ordem</span>
            </div>
        </div>
      </AccordionTrigger>
      <AccordionContent>
        <div className="space-y-6 pt-4">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <div className="space-y-3">
              <SortableContext items={normalizedItems.map(i => i.id)} strategy={verticalListSortingStrategy}>
                {normalizedItems.map((config) => (
                  <SortableStatusItem
                    key={config.id}
                    id={config.id}
                    config={config}
                    onUpdate={updateItem}
                    onRemove={removeItem}
                  />
                ))}
              </SortableContext>
            </div>
          </DndContext>
          
          <div className="p-6 bg-muted/20 rounded-[2rem] border-2 border-dashed border-muted/50 flex flex-col gap-4">
            <div className="flex lg:flex-row flex-col items-center gap-4">
                <div className="flex-1 w-full">
                    <Input
                        placeholder="Nome do novo status (ex: Aguardando Documento)"
                        value={newItemLabel}
                        onChange={(e) => setNewItemLabel(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && addItem()}
                        className="h-12 rounded-2xl border-2 bg-background font-bold"
                    />
                </div>
                <div className="w-full lg:w-[240px]">
                    <Select value={newItemBehavior} onValueChange={(val: any) => setNewItemBehavior(val)}>
                        <SelectTrigger className="h-12 rounded-2xl border-2 bg-background font-bold text-xs uppercase">
                            <SelectValue placeholder="Comportamento" />
                        </SelectTrigger>
                        <SelectContent>
                            {Object.entries(BEHAVIOR_LABELS).map(([value, info]) => (
                                <SelectItem key={value} value={value} className="text-xs font-bold uppercase">
                                    <div className="flex items-center gap-2">
                                        <info.icon className={cn("h-4 w-4", info.color)} />
                                        {info.label}
                                    </div>
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>
            <div className="flex items-center justify-between">
                <p className="text-[9px] text-muted-foreground font-black uppercase tracking-widest pl-2">O ID interno será gerado automaticamente. Defina o comportamento para garantir cálculos corretos.</p>
                <Button onClick={addItem} className="h-12 px-8 rounded-2xl font-black uppercase text-[10px] tracking-widest gap-2 bg-primary shadow-lg shadow-primary/20 hover:scale-105 transition-all" disabled={!newItemLabel.trim()}>
                    <PlusCircle className="h-4 w-4" /> Adicionar Status
                </Button>
            </div>
          </div>
        </div>
      </AccordionContent>
    </AccordionItem>
  );
}

