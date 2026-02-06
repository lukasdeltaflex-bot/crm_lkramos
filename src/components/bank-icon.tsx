
'use client';

import { Landmark } from 'lucide-react';
import { cn } from '@/lib/utils';

// Mapeamento padrão para bancos conhecidos (Fallback abrangente)
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
  domain?: string; // Domínio vindo das configurações do usuário
  className?: string;
  showLogo?: boolean;
}

export function BankIcon({ bankName, domain, className, showLogo = true }: BankIconProps) {
  if (!showLogo || !bankName) {
    return <Landmark className={cn("h-4 w-4 text-muted-foreground/40", className)} />;
  }
  
  // 1. Usa o domínio manual das configurações se existir
  // 2. Senão usa o mapeamento interno (fallback)
  const finalDomain = domain || domainMap[bankName] || null;

  if (!finalDomain) {
    return <Landmark className={cn("h-4 w-4 text-muted-foreground/40", className)} />;
  }

  return (
    <div className={cn("relative flex items-center justify-center overflow-hidden rounded bg-white border border-border/50 shrink-0", className || "h-5 w-5")}>
      <img
        src={`https://www.google.com/s2/favicons?domain=${finalDomain}&sz=64`}
        alt={bankName}
        className="h-full w-full object-contain p-0.5"
        onError={(e) => {
          (e.target as any).style.display = 'none';
        }}
      />
    </div>
  );
}
