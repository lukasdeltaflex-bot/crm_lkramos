
'use client';

import { useEffect } from 'react';

/**
 * Componente de estabilização de interface.
 * Garante que a rolagem seja restaurada se um modal travar ao fechar.
 */
export function InteractionFixer() {
  useEffect(() => {
    if (typeof document === 'undefined') return;

    const cleanup = () => {
      // Só executa se NÃO houver nenhum modal, dialog ou menu aberto
      const hasOverlays = document.querySelectorAll('[data-radix-portal], [role="dialog"], [role="menu"], .fixed.inset-0').length > 0;
      
      if (!hasOverlays) {
        const rootElements = [document.body, document.documentElement];
        rootElements.forEach(el => {
          if (el && (el.style.pointerEvents === 'none' || el.style.overflow === 'hidden')) {
            el.style.pointerEvents = 'auto';
            el.style.overflow = 'auto';
          }
        });
        
        if (document.body.classList.contains('pointer-events-none')) {
            document.body.classList.remove('pointer-events-none');
        }
        
        if (document.body.hasAttribute('data-scroll-locked')) {
            document.body.removeAttribute('data-scroll-locked');
        }
      }
    };

    // Executa a limpeza periodicamente, mas de forma leve
    const interval = setInterval(cleanup, 2000);
    
    return () => clearInterval(interval);
  }, []);

  return null;
}
