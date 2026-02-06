
'use client';

import { Landmark } from 'lucide-react';
import { cn } from '@/lib/utils';

// Mapeamento por Código ou por Nome para garantir compatibilidade
const domainMap: Record<string, string> = {
  // Códigos (Legado)
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
  '745': 'citibank.com.br',
  '739': 'neon.com.br',
  // Nomes (Novo Formato)
  'Banco do Brasil S.A.': 'bb.com.br',
  'Caixa Econômica Federal': 'caixa.gov.br',
  'Bradesco S.A.': 'bradesco.com.br',
  'Itaú Unibanco S.A.': 'itau.com.br',
  'Santander (Brasil) S.A.': 'santander.com.br',
  'Nu Pagamentos S.A. - Nubank': 'nubank.com.br',
  'Inter S.A.': 'bancointer.com.br',
  'C6 S.A.': 'c6bank.com.br',
  'PAN S.A.': 'bancopan.com.br',
  'BMG S.A.': 'bancobmg.com.br',
  'Daycoval S.A.': 'daycoval.com.br',
  'Agibank S.A.': 'agibank.com.br',
  'Banrisul - do Estado do Rio Grande do Sul S.A.': 'banrisul.com.br',
  'BRB - de Brasília S.A.': 'brb.com.br',
  'Mercantil do Brasil S.A.': 'mercantil.com.br',
  'Paraná S.A.': 'bancoparana.com.br',
  'Votorantim S.A.': 'bv.com.br',
  'Safra S.A.': 'safra.com.br',
  'Citibank N.A.': 'citibank.com.br',
  'Neon S.A.': 'neon.com.br',
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
  
  // Tenta extrair código se houver " - " (formato antigo)
  const parts = bankName.split(' - ');
  const code = parts.length > 1 ? parts[0] : null;
  const nameOnly = parts.length > 1 ? parts[1] : bankName;

  // Busca domínio por código ou pelo nome limpo
  const domain = (code && domainMap[code]) || domainMap[nameOnly] || null;

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
