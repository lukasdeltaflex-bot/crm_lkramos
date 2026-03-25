'use client';

import React, { useState } from 'react';
import { Landmark, Loader2 } from 'lucide-react';
import { cn, cleanBankName } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

// Mapeamento padrão para os nomes LIMPOS dos bancos
const domainMap: Record<string, string> = {
  'Banco do Brasil S.A.': 'bb.com.br',
  'Caixa Econômica Federal': 'caixa.gov.br',
  'Bradesco S.A.': 'bradesco.com.br',
  'Itaú Unibanco S.A.': 'itau.com.br',
  'Santander (Brasil) S.A.': 'santander.com.br',
  'Nu Pagamentos S.A. - Nubank': 'nubank.com.br',
  'Inter S.A.': 'bancointer.com.br',
  'C6 S.A.': 'c6bank.com.br',
  'Original S.A.': 'original.com.br',
  'BTG Pactual S.A.': 'btgpactual.com',
  'Safra S.A.': 'safra.com.br',
  'Votorantim S.A.': 'bv.com.br',
  'Citibank N.A.': 'citibank.com.br',
  'PAN S.A.': 'bancopan.com.br',
  'Neon S.A.': 'neon.com.br',
  'BMG S.A.': 'bancobmg.com.br',
  'Daycoval S.A.': 'daycoval.com.br',
  'Alfa S.A.': 'bancoalfa.com.br',
  'Sofisa S.A.': 'sofisa.com.br',
  'Pine S.A.': 'pine.com',
  'Indusval S.A.': 'indusval.com.br',
  'Agibank S.A.': 'agibank.com.br',
  'Modal S.A.': 'modal.com.br',
  'da Amazônia S.A.': 'bancoamazonia.com.br',
  'do Nordeste do Brasil S.A.': 'bnb.gov.br',
  'Banrisul - do Estado do Rio Grande do Sul S.A.': 'banrisul.com.br',
  'BRB - de Brasília S.A.': 'brb.com.br',
  'ABC Brasil S.A.': 'abcbrasil.com.br',
  'Fibra S.A.': 'bancofibra.com.br',
  'Luso Brasileiro S.A.': 'lusobrasileiro.com.br',
  'Rendimento S.A.': 'rendimento.com.br',
  'Triângulo S.A. (Tribanco)': 'tribanco.com.br',
  'Mercantil do Brasil S.A.': 'mercantil.com.br',
  'Paraná S.A.': 'bancoparana.com.br',
};

interface BankIconProps {
  bankName?: string;
  domain?: string;
  className?: string;
  showLogo?: boolean;
}

export function BankIcon({ bankName, domain, className, showLogo = true }: BankIconProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  if (!showLogo || !bankName) {
    return <Landmark className={cn("h-4 w-4 text-muted-foreground/40", className)} />;
  }
  
  const cleanedName = cleanBankName(bankName);
  
  // Estratégia de busca flexível para lidar com digitação livre
  const searchKey = cleanedName.toLowerCase();
  const flexibleMap: Record<string, string> = {
      'itau': 'itau.com.br',
      'itaú': 'itau.com.br',
      'bradesco': 'bradesco.com.br',
      'caixa': 'caixa.gov.br',
      'bb': 'bb.com.br',
      'banco do brasil': 'bb.com.br',
      'santander': 'santander.com.br',
      'nubank': 'nubank.com.br',
      'banco inter': 'bancointer.com.br',
      'inter': 'bancointer.com.br',
      'bmg': 'bancobmg.com.br',
      'banco bmg': 'bancobmg.com.br',
      'pan': 'bancopan.com.br',
      'banco pan': 'bancopan.com.br',
      'c6': 'c6bank.com.br',
      'c6 bank': 'c6bank.com.br',
      'safra': 'safra.com.br',
      'banco safra': 'safra.com.br',
      'votorantim': 'bv.com.br',
      'bv': 'bv.com.br',
      'daycoval': 'daycoval.com.br',
      'banco daycoval': 'daycoval.com.br'
  };

  const finalDomain = domain || domainMap[cleanedName] || domainMap[bankName] || flexibleMap[searchKey] || null;

  if (!finalDomain || hasError) {
    return <Landmark className={cn("h-4 w-4 text-muted-foreground/40", className)} />;
  }

  return (
    <div className={cn("relative flex items-center justify-center overflow-hidden rounded bg-white border border-border/50 shrink-0", className || "h-5 w-5")}>
      {isLoading && (
        <Skeleton className="absolute inset-0 h-full w-full bg-muted animate-pulse" />
      )}
      <img
        src={`https://www.google.com/s2/favicons?domain=${finalDomain}&sz=64`}
        alt={bankName}
        className={cn("h-full w-full object-contain p-0.5 transition-opacity duration-300", isLoading ? "opacity-0" : "opacity-100")}
        loading="lazy"
        onLoad={() => setIsLoading(false)}
        onError={() => {
          setHasError(true);
          setIsLoading(false);
        }}
      />
    </div>
  );
}