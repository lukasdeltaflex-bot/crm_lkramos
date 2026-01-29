'use client';

import { useEffect } from 'react';

/**
 * Componente utilitário para resolver o bug de "tela travada" (pointer-events: none).
 * Ele monitora mudanças no body e garante que, se nenhum modal estiver visível, 
 * as interações do mouse sejam restauradas.
 */
export function InteractionFixer() {
  useEffect(() => {
    const cleanup = () => {
      // Verifica se existem elementos de "portal" (modais, menus) ativos no DOM
      const hasOpenOverlays = !!document.querySelector('[data-radix-portal], .fixed.inset-0');
      
      if (!hasOpenOverlays) {
        // Se não houver overlays, mas o body estiver bloqueado, força a liberação
        if (document.body.style.pointerEvents === 'none' || document.body.classList.contains('pointer-events-none')) {
          document.body.style.pointerEvents = 'auto';
          document.body.style.overflow = 'auto';
          // Remove classes comuns de bloqueio do Tailwind/Radix
          document.body.classList.remove('pointer-events-none');
        }
      }
    };

    // Monitora cliques e fechamentos por 1 segundo após qualquer clique
    const handleGlobalClick = () => {
      setTimeout(cleanup, 100);
      setTimeout(cleanup, 300);
      setTimeout(cleanup, 500);
    };

    // Monitora mudanças na estrutura do DOM (abertura/fechamento de modais)
    const observer = new MutationObserver((mutations) => {
      cleanup();
    });

    observer.observe(document.body, {
      attributes: true,
      childList: true,
      subtree: false
    });

    window.addEventListener('click', handleGlobalClick);
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') handleGlobalClick();
    });

    return () => {
      observer.disconnect();
      window.removeEventListener('click', handleGlobalClick);
    };
  }, []);

  return null;
}
