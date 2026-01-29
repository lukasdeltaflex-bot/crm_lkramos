'use client';

import { useEffect } from 'react';

/**
 * Componente utilitário para resolver o bug de "tela travada" (pointer-events: none).
 * Ele monitora mudanças no body e garante que, se nenhum modal estiver visível, 
 * as interações do mouse sejam restauradas.
 */
export function InteractionFixer() {
  useEffect(() => {
    const forceCleanup = () => {
      // Verifica se existem elementos de "portal" (modais, menus) ativos no DOM
      const hasOpenOverlays = !!document.querySelector('[data-radix-portal], .fixed.inset-0, [role="dialog"], [role="menu"]');
      
      if (!hasOpenOverlays) {
        // Se não houver overlays visíveis, removemos qualquer trava do body
        const body = document.body;
        if (
          body.style.pointerEvents === 'none' || 
          body.classList.contains('pointer-events-none') ||
          body.style.overflow === 'hidden'
        ) {
          body.style.pointerEvents = 'auto';
          body.style.overflow = 'auto';
          body.classList.remove('pointer-events-none');
          // Remove possíveis atributos do Radix
          body.removeAttribute('data-radix-scroll-lock');
        }
      }
    };

    // Monitora cliques e fechamentos com timers para garantir o fim das animações
    const handleEvents = () => {
      setTimeout(forceCleanup, 50);
      setTimeout(forceCleanup, 150);
      setTimeout(forceCleanup, 300);
      setTimeout(forceCleanup, 500);
    };

    // Monitora mudanças na estrutura do DOM (abertura/fechamento de modais)
    const observer = new MutationObserver(forceCleanup);

    observer.observe(document.body, {
      attributes: true,
      childList: true,
      subtree: false
    });

    window.addEventListener('mousedown', handleEvents);
    window.addEventListener('mouseup', handleEvents);
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') handleEvents();
    });

    // Roda um check periódico curto para segurança extra
    const interval = setInterval(forceCleanup, 1000);

    return () => {
      observer.disconnect();
      clearInterval(interval);
      window.removeEventListener('mousedown', handleEvents);
      window.removeEventListener('mouseup', handleEvents);
    };
  }, []);

  return null;
}
