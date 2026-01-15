'use client';

import { cn } from '@/lib/utils';
import { Landmark } from 'lucide-react';

export function Logo({ className, forPrinting = false }: { className?: string; forPrinting?: boolean }) {
  if (forPrinting) {
    return (
       <div className={cn('flex items-center gap-4', className)}>
         <Landmark className="h-10 w-10 text-primary" />
         <div>
            <h1 className="font-bold text-lg text-black">Relatório Financeiro</h1>
            <p className="text-sm text-gray-500">LK RAMOS Gestão de Propostas</p>
         </div>
      </div>
    )
  }
  
  return (
    <div
      className={cn(
        'flex items-center gap-2',
        className
      )}
    >
      <Landmark className="h-8 w-8 text-primary" />
      <span className="text-xl font-bold group-data-[collapsible=icon]:hidden">
        LK RAMOS
      </span>
    </div>
  );
}
