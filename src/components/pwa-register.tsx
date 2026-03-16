'use client';

import { useEffect } from 'react';
import { toast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';

/**
 * 🚀 PWA MASTER CONTROLLER V2 (LK RAMOS)
 * Registra o Service Worker e gerencia o fluxo de atualização segura.
 * Resolve o problema de "código antigo" preso no navegador do usuário.
 */
export function PwaRegister() {
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

    const registerServiceWorker = async () => {
      try {
        // Limpeza de cache bruta no registro (Opcional, mas segura para desincronização)
        if ('caches' in window) {
            const cacheNames = await caches.keys();
            await Promise.all(cacheNames.map(name => caches.delete(name)));
        }

        const registration = await navigator.serviceWorker.register('/sw.js');

        // Monitora atualizações do Service Worker
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (!newWorker) return;

          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // 🔔 Nova versão detectada e pronta para assumir
              showUpdateToast(registration);
            }
          });
        });

      } catch (err) {
        console.error('🛡️ LK RAMOS: Erro ao registrar PWA:', err);
      }
    };

    // Pequeno delay para não competir com o carregamento inicial do Firebase
    const timer = setTimeout(registerServiceWorker, 2000);
    return () => clearTimeout(timer);
  }, []);

  const showUpdateToast = (registration: ServiceWorkerRegistration) => {
    toast({
      title: "🚀 Nova Versão Disponível!",
      description: "Uma atualização crítica foi publicada. Recarregue para aplicar.",
      duration: 30000, // 30 segundos visível
      action: (
        <Button 
          size="sm" 
          variant="default" 
          className="bg-primary text-white font-bold h-8 px-4 rounded-full shadow-lg"
          onClick={() => {
            if (registration.waiting) {
              registration.waiting.postMessage({ type: 'SKIP_WAITING' });
            }
            // Limpa cache do navegador e recarrega
            window.location.reload();
          }}
        >
          <RefreshCw className="mr-2 h-3 w-3" />
          Atualizar Agora
        </Button>
      ),
    });
  };

  return null;
}