'use client';

import * as React from 'react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  CircleDollarSign,
  Check,
  ChevronDown,
  X,
  AlertCircle,
} from 'lucide-react';
import { cn, formatCurrency, formatCurrencyInput } from '@/lib/utils';
import {
  SalaryFilter,
  SALARY_PRESETS,
  DEFAULT_SALARY_FILTER,
  formatSalaryLabel,
} from '@/lib/salary-utils';

interface SalaryFilterProps {
  value: SalaryFilter;
  onChange: (filter: SalaryFilter) => void;
}

export function SalaryFilterComponent({ value, onChange }: SalaryFilterProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [customMin, setCustomMin] = React.useState<number | undefined>(value.min);
  const [customMax, setCustomMax] = React.useState<number | undefined>(value.max);
  const [validationError, setValidationError] = React.useState<string | null>(null);

  // Sincroniza inputs personalizados quando o valor externo mudar (ex: ao limpar filtros)
  React.useEffect(() => {
    if (value.presetId !== 'custom') {
      setCustomMin(value.min);
      setCustomMax(value.max);
      setValidationError(null);
    }
  }, [value]);

  const isActive = value.presetId !== 'all' && (value.min !== undefined || value.max !== undefined);

  const handleSelectPreset = (preset: typeof SALARY_PRESETS[number]) => {
    if (preset.id === 'all') {
      onChange(DEFAULT_SALARY_FILTER);
      setCustomMin(undefined);
      setCustomMax(undefined);
      setValidationError(null);
    } else {
      onChange({
        presetId: preset.id,
        min: preset.min,
        max: preset.max,
        label: preset.label,
      });
      setCustomMin(preset.min);
      setCustomMax(preset.max);
      setValidationError(null);
    }
    setIsOpen(false);
  };

  const handleMoneyChange = (raw: string, setter: (val: number | undefined) => void) => {
    const digits = raw.replace(/\D/g, '');
    if (!digits) {
      setter(undefined);
      return;
    }
    setter(parseInt(digits, 10) / 100);
  };

  const handleApplyCustom = () => {
    if (customMin === undefined && customMax === undefined) {
      onChange(DEFAULT_SALARY_FILTER);
      setIsOpen(false);
      return;
    }

    if (customMin !== undefined && customMax !== undefined && customMin > customMax) {
      setValidationError('O valor mínimo não pode ser superior ao valor máximo.');
      return;
    }

    setValidationError(null);
    const label = formatSalaryLabel(customMin, customMax);

    onChange({
      presetId: 'custom',
      min: customMin,
      max: customMax,
      label,
    });
    setIsOpen(false);
  };

  const handleClear = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    onChange(DEFAULT_SALARY_FILTER);
    setCustomMin(undefined);
    setCustomMax(undefined);
    setValidationError(null);
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className={cn(
            'h-10 min-w-[170px] rounded-full text-[10px] font-black uppercase px-5 shadow-sm transition-all gap-2 justify-between border',
            isActive
              ? 'bg-emerald-500/10 border-emerald-500 text-emerald-700 dark:text-emerald-400 font-black shadow-md ring-2 ring-emerald-500/20'
              : 'bg-background border-emerald-200 text-emerald-600 hover:bg-emerald-50/60 dark:hover:bg-emerald-950/20'
          )}
        >
          <div className="flex items-center gap-2 truncate">
            <CircleDollarSign className={cn('h-3.5 w-3.5 shrink-0', isActive ? 'text-emerald-600' : 'opacity-60')} />
            <span className="truncate">
              {isActive ? value.label : 'TODOS OS SALÁRIOS'}
            </span>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            {isActive && (
              <span
                role="button"
                tabIndex={0}
                onClick={handleClear}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    handleClear();
                  }
                }}
                className="h-4 w-4 rounded-full bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-700 flex items-center justify-center p-0.5 ml-1 transition-colors cursor-pointer"
                title="Limpar filtro salarial"
              >
                <X className="h-3 w-3" />
              </span>
            )}
            <ChevronDown className="h-3.5 w-3.5 opacity-50 shrink-0" />
          </div>
        </Button>
      </PopoverTrigger>

      <PopoverContent
        align="end"
        sideOffset={8}
        className="w-80 p-4 rounded-2xl border-2 shadow-2xl bg-card space-y-4 z-50"
      >
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <h4 className="font-black text-xs uppercase tracking-wider text-foreground flex items-center gap-2">
              <CircleDollarSign className="h-4 w-4 text-emerald-600" />
              Filtro por Salário
            </h4>
            {isActive && (
              <button
                type="button"
                onClick={handleClear}
                className="text-[10px] font-black uppercase text-red-600 hover:underline"
              >
                Limpar
              </button>
            )}
          </div>
          <p className="text-[10px] text-muted-foreground font-medium leading-tight">
            Localiza clientes com <strong>pelo menos um benefício</strong> na faixa. Não soma salários de benefícios múltiplos.
          </p>
        </div>

        <div className="space-y-1">
          <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">
            Faixas Predefinidas
          </span>
          <div className="grid grid-cols-1 gap-1">
            {SALARY_PRESETS.map((preset) => {
              const isSelected = value.presetId === preset.id;
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => handleSelectPreset(preset)}
                  className={cn(
                    'flex items-center justify-between w-full px-3 py-2 rounded-xl text-left text-xs font-bold transition-all',
                    isSelected
                      ? 'bg-emerald-500 text-white shadow-sm'
                      : 'hover:bg-muted text-foreground'
                  )}
                >
                  <span>{preset.label}</span>
                  {isSelected && <Check className="h-3.5 w-3.5 text-white" />}
                </button>
              );
            })}
          </div>
        </div>

        <div className="h-px bg-border/60" />

        <div className="space-y-3">
          <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">
            Faixa Personalizada (R$)
          </span>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-[10px] font-bold text-muted-foreground">Mínimo</Label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-xs text-muted-foreground font-bold">R$</span>
                <Input
                  placeholder="0,00"
                  value={formatCurrencyInput(customMin)}
                  onChange={(e) => handleMoneyChange(e.target.value, setCustomMin)}
                  className="pl-9 h-9 text-xs font-bold rounded-xl bg-background border-zinc-200 dark:border-zinc-800"
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-[10px] font-bold text-muted-foreground">Máximo</Label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-xs text-muted-foreground font-bold">R$</span>
                <Input
                  placeholder="0,00"
                  value={formatCurrencyInput(customMax)}
                  onChange={(e) => handleMoneyChange(e.target.value, setCustomMax)}
                  className="pl-9 h-9 text-xs font-bold rounded-xl bg-background border-zinc-200 dark:border-zinc-800"
                />
              </div>
            </div>
          </div>

          {validationError && (
            <div className="flex items-center gap-1.5 text-red-600 text-[10px] font-bold">
              <AlertCircle className="h-3.5 w-3.5 shrink-0" />
              <span>{validationError}</span>
            </div>
          )}

          <Button
            type="button"
            size="sm"
            onClick={handleApplyCustom}
            className="w-full h-8 rounded-xl font-black uppercase text-[10px] tracking-wider bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
          >
            Aplicar Faixa Personalizada
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
