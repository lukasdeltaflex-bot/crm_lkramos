'use client';

import { useEffect } from 'react';

/**
 * Componente utilitário ultra-robusto para resolver o bug de "tela travada" (pointer-events: none).
 * Ele monitora mudanças no DOM e interações para garantir que cliques sejam restaurados.
 */
export function InteractionFixer() {
  useEffect(() => {
    const forceCleanup = () => {
      // Verifica se existem elementos de sobreposição ativos (Modais do Radix, menus, etc)
      const overlays = document.querySelectorAll('[data-radix-portal], .fixed.inset-0, [role="dialog"], [role="menu"]');
      
      // Função para resetar estilos agressivamente
      const resetStyles = (el: HTMLElement) => {
        // Usamos setProperty com !important para garantir a vitória sobre estilos inline do Radix
        el.style.setProperty('pointer-events', 'auto', 'important');
        el.style.setProperty('overflow', 'auto', 'important');
        el.classList.remove('pointer-events-none');
        el.removeAttribute('data-radix-scroll-lock');
      };

      // Se não houver sobreposições visíveis, limpamos o corpo e o html da página agressivamente
      if (overlays.length === 0) {
        resetStyles(document.body);
        resetStyles(document.documentElement);
      }
    };

    // Monitora mudanças na estrutura do DOM (abertura/fechamento de modais)
    const observer = new MutationObserver(() => {
      // Múltiplos delays para garantir que as transições de saída do Radix/Lucide terminem
      forceCleanup();
      setTimeout(forceCleanup, 50);
      setTimeout(forceCleanup, 150);
      setTimeout(forceCleanup, 400);
      setTimeout(forceCleanup, 800);
    });

    observer.observe(document.body, {
      attributes: true,
      childList: true,
      subtree: false
    });

    // Eventos de redundância em interações comuns do usuário
    const handleRelease = () => {
      setTimeout(forceCleanup, 50);
      setTimeout(forceCleanup, 200);
    };

    window.addEventListener('mousedown', handleRelease);
    window.addEventListener('mouseup', handleRelease);
    window.addEventListener('click', handleRelease);
    window.addEventListener('touchstart', handleRelease);
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') handleRelease();
    });

    // Check periódico de segurança contra travas residuais ("fantasmagóricas")
    const interval = setInterval(forceCleanup, 1500);

    return () => {
      observer.disconnect();
      clearInterval(interval);
      window.removeEventListener('mousedown', handleRelease);
      window.removeEventListener('mouseup', handleRelease);
      window.removeEventListener('click', handleRelease);
      window.removeEventListener('touchstart', handleRelease);
    };
  }, []);

  return null;
}
