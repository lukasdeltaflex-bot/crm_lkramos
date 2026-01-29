
'use client';

import { useEffect } from 'react';

/**
 * Componente utilitário robusto para resolver o bug de "tela travada" (pointer-events: none).
 * Ele monitora mudanças no DOM e interações para garantir que cliques sejam restaurados.
 */
export function InteractionFixer() {
  useEffect(() => {
    const forceCleanup = () => {
      // Verifica se existem elementos de sobreposição ativos (Modais do Radix, menus, etc)
      const overlays = document.querySelectorAll('[data-radix-portal], .fixed.inset-0, [role="dialog"], [role="menu"]');
      
      // Se não houver sobreposições visíveis, limpamos o corpo da página
      if (overlays.length === 0) {
        const body = document.body;
        const html = document.documentElement;

        // Lista de propriedades a resetar
        const resetStyles = (el: HTMLElement) => {
          if (el.style.pointerEvents === 'none') el.style.pointerEvents = 'auto';
          if (el.style.overflow === 'hidden') el.style.overflow = 'auto';
          el.classList.remove('pointer-events-none');
          el.removeAttribute('data-radix-scroll-lock');
        };

        resetStyles(body);
        resetStyles(html);
      }
    };

    // Monitora mudanças na estrutura do DOM (abertura/fechamento de modais)
    const observer = new MutationObserver(() => {
      // Pequeno delay para esperar as animações de saída do Radix/ShadCN
      setTimeout(forceCleanup, 50);
      setTimeout(forceCleanup, 300);
    });

    observer.observe(document.body, {
      attributes: true,
      childList: true,
      subtree: false
    });

    // Eventos de redundância
    const handleRelease = () => {
      setTimeout(forceCleanup, 100);
    };

    window.addEventListener('mousedown', handleRelease);
    window.addEventListener('mouseup', handleRelease);
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') handleRelease();
    });

    // Check periódico de segurança
    const interval = setInterval(forceCleanup, 2000);

    return () => {
      observer.disconnect();
      clearInterval(interval);
      window.removeEventListener('mousedown', handleRelease);
      window.removeEventListener('mouseup', handleRelease);
    };
  }, []);

  return null;
}
