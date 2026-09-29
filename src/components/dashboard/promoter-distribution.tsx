'use client';

import * as React from 'react';
import type { Proposal } from '@/lib/types';
import { formatCurrency, cn } from '@/lib/utils';
import { Users, Check } from 'lucide-react';

interface PromoterDistributionProps {
  proposals: Proposal[];
  amountType?: 'grossAmount' | 'commissionValue' | 'netAmount' | 'amountPaid';
  selectedPromoter: string | null;
  onSelectPromoter: (promoter: string | null) => void;
}

export function PromoterDistribution({
  proposals,
  amountType = 'grossAmount',
  selectedPromoter,
  onSelectPromoter,
}: PromoterDistributionProps) {
  const { items, totalAmount, totalCount } = React.useMemo(() => {
    const safeProposals = Array.isArray(proposals) ? proposals : [];
    const map = new Map<string, { total: number; count: number }>();

    let sum = 0;

    safeProposals.forEach((p) => {
      const rawPromoter = p.promoter ? p.promoter.trim() : '';
      const promoterName = rawPromoter || 'Promotora não informada';

      const val = Number((p as any)[amountType] || 0);
      sum += val;

      const current = map.get(promoterName) || { total: 0, count: 0 };
      map.set(promoterName, {
        total: current.total + val,
        count: current.count + 1,
      });
    });

    const list = Array.from(map.entries()).map(([name, data]) => ({
      name,
      total: data.total,
      count: data.count,
    }));

    // Ordenar de forma decrescente por valor e depois por quantidade
    list.sort((a, b) => b.total - a.total || b.count - a.count);

    // Validação matemática interna (em ambiente de dev/diagnóstico)
    const sumPromoters = list.reduce((acc, curr) => acc + curr.total, 0);
    if (Math.abs(sumPromoters - sum) > 0.01 && process.env.NODE_ENV !== 'production') {
      console.warn(`[PromoterDistribution] Divergência detectada entre soma das promotoras (${sumPromoters}) e total das propostas (${sum}).`);
    }

    return {
      items: list,
      totalAmount: sum,
      totalCount: safeProposals.length,
    };
  }, [proposals, amountType]);

  if (items.length === 0) {
    return null;
  }

  const isFiltered = Boolean(selectedPromoter);

  return (
    <div className="space-y-3 p-4 rounded-xl bg-card border border-border">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-muted-foreground" />
          <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
            Distribuição por Promotora
          </span>
        </div>
        <div className="text-right">
          <span className="text-[11px] font-medium text-muted-foreground mr-2">
            Total: {totalCount} {totalCount === 1 ? 'proposta' : 'propostas'}
          </span>
          <span className="text-xs font-bold text-foreground">
            {formatCurrency(totalAmount)}
          </span>
        </div>
      </div>

      {/* Grid de Pílulas / Botões de Filtro */}
      <div className="flex flex-wrap gap-2 pt-1">
        <button
          type="button"
          onClick={() => onSelectPromoter(null)}
          className={cn(
            'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border select-none',
            !isFiltered
              ? 'bg-primary text-primary-foreground border-primary shadow-xs'
              : 'bg-background hover:bg-muted text-foreground border-border'
          )}
        >
          {!isFiltered && <Check className="h-3 w-3 stroke-[2.5]" />}
          <span>Todas</span>
          <span
            className={cn(
              'text-[10px] ml-1 px-1.5 py-0.5 rounded font-medium',
              !isFiltered ? 'bg-primary-foreground/15 text-primary-foreground' : 'bg-muted text-muted-foreground'
            )}
          >
            {totalCount}
          </span>
        </button>

        {items.map((item) => {
          const isSelected = selectedPromoter === item.name;
          return (
            <button
              key={item.name}
              type="button"
              onClick={() => onSelectPromoter(isSelected ? null : item.name)}
              className={cn(
                'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border select-none',
                isSelected
                  ? 'bg-primary text-primary-foreground border-primary shadow-xs'
                  : 'bg-background hover:bg-muted text-foreground border-border'
              )}
            >
              {isSelected && <Check className="h-3 w-3 stroke-[2.5]" />}
              <span className="truncate max-w-[180px]">{item.name}</span>
              <span
                className={cn(
                  'text-[10px] ml-1 px-1.5 py-0.5 rounded font-medium',
                  isSelected ? 'bg-primary-foreground/15 text-primary-foreground' : 'bg-muted text-muted-foreground'
                )}
              >
                {item.count} • {formatCurrency(item.total)}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
