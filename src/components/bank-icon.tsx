
'use client';

import { Landmark } from 'lucide-react';
import { cn } from '@/lib/utils';

const domainMap: Record<string, string> = {
  '001': 'bb.com.br',
  '104': 'caixa.gov.br',
  '237': 'bradesco.com.br',
  '341': 'itau.com.br',
  '033': 'santander.com.br',
  '260': 'nubank.com.br',
  '077': 'bancointer.com.br',
  '336': 'c6bank.com.br',
  '623': 'bancopan.com.br',
  '318': 'bancobmg.com.br',
  '707': 'daycoval.com.br',
  '121': 'agibank.com.br',
  '041': 'banrisul.com.br',
  '070': 'brb.com.br',
  '389': 'mercantil.com.br',
  '751': 'bancoparana.com.br',
  '655': 'bv.com.br',
  '422': 'safra.com.br',
  '655': 'votorantim.com.br',
  '745': 'citibank.com.br',
  '739': 'neon.com.br',
};

interface BankIconProps {
  bankName?: string;
  className?: string;
  showLogo?: boolean;
}

export function BankIcon({ bankName, className, showLogo = true }: BankIconProps) {
  if (!showLogo || !bankName) {
    return <Landmark className={cn("h-4 w-4 text-muted-foreground/40", className)} />;
  }
  
  const code = bankName.split(' - ')[0];
  const domain = domainMap[code];

  if (!domain) {
    return <Landmark className={cn("h-4 w-4 text-muted-foreground/40", className)} />;
  }

  return (
    <div className={cn("relative flex items-center justify-center overflow-hidden rounded bg-white border border-border/50 shrink-0", className || "h-5 w-5")}>
      <img
        src={`https://www.google.com/s2/favicons?domain=${domain}&sz=64`}
        alt={bankName}
        className="h-full w-full object-contain p-0.5"
        onError={(e) => {
          (e.target as any).style.display = 'none';
        }}
      />
    </div>
  );
}
