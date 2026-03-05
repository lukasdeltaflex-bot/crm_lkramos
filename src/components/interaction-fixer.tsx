'use client';

import { useEffect } from 'react';

/**
 * 🚀 OTIMIZAÇÃO DE PERFORMANCE V2 (LK RAMOS)
 * Componente de estabilização de interface via MutationObserver.
 * Em vez de um timer constante, ele observa o DOM e só limpa a rolagem
 * quando detecta o fechamento de portais, diálogos ou menus.
 */
export function InteractionFixer() {
  useEffect(() => {
    if (typeof document === 'undefined') return;

    const cleanup = () => {
      // Só executa se NÃO houver nenhum modal, dialog ou menu aberto
      const hasOverlays = document.querySelectorAll('[data-radix-portal], [role="dialog"], [role="menu"], .fixed.inset-0').length > 0;
      
      if (!hasOverlays) {
        const rootElements = [document.body, document.documentElement];
        let changed = false;

        rootElements.forEach(el => {
          if (el && (el.style.pointerEvents === 'none' || el.style.overflow === 'hidden')) {
            el.style.pointerEvents = 'auto';
            el.style.overflow = 'auto';
            changed = true;
          }
        });
        
        if (document.body.classList.contains('pointer-events-none')) {
            document.body.classList.remove('pointer-events-none');
            changed = true;
        }
        
        if (document.body.hasAttribute('data-scroll-locked')) {
            document.body.removeAttribute('data-scroll-locked');
            changed = true;
        }

        if (changed) {
            console.log("💎 LK RAMOS: Interface estabilizada via MutationObserver.");
        }
      }
    };

    // 🔬 MONITOR DE MUTAÇÕES: Acorda apenas quando o DOM muda
    const observer = new MutationObserver((mutations) => {
        const hasOverlayChanges = mutations.some(m => 
            Array.from(m.removedNodes).some(node => 
                node instanceof HTMLElement && 
                (node.hasAttribute('data-radix-portal') || node.getAttribute('role') === 'dialog')
            )
        );

        if (hasOverlayChanges) {
            // Pequeno delay para garantir que o Radix terminou a transição de saída
            setTimeout(cleanup, 100);
        }
    });

    observer.observe(document.body, { 
        childList: true, 
        subtree: false 
    });
    
    // Executa uma limpeza inicial
    cleanup();

    return () => observer.disconnect();
  }, []);

  return null;
}
