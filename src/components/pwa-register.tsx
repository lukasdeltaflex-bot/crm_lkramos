'use client';

import { useEffect } from 'react';
import { toast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';

/**
 * 🚀 PWA MASTER CONTROLLER LK RAMOS
 * Registra o Service Worker APENAS em produção para evitar cache persistente em desenvolvimento.
 * Em modo dev, remove qualquer worker residual para garantir atualizações de código instantâneas.
 */
export function PwaRegister() {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const syncEnvironment = async () => {
      const isProd = process.env.NODE_ENV === 'production';

      // 🛡️ LIMPEZA DE CACHE E WORKERS EM DESENVOLVIMENTO
      if (!isProd) {
        // Limpa caches do navegador para evitar assets antigos
        if ('caches' in window) {
          try {
            const cacheNames = await caches.keys();
            await Promise.all(cacheNames.map(name => caches.delete(name)));
          } catch (e) {}
        }
        
        // Desregistra workers antigos que travam o ambiente local
        if ('serviceWorker' in navigator) {
          try {
            const registrations = await navigator.serviceWorker.getRegistrations();
            for (const registration of registrations) {
              await registration.unregister();
              console.log("💎 LK RAMOS: Service Worker removido para garantir código fresco em desenvolvimento.");
            }
          } catch (e) {}
        }
        return; // Interrompe o registro no modo desenvolvimento
      }

      // 🚀 REGISTRO APENAS EM PRODUÇÃO
      if (!('serviceWorker' in navigator)) return;

      try {
        const registration = await navigator.serviceWorker.register('/sw.js');

        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (!newWorker) return;

          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              showUpdateToast(registration);
            }
          });
        });
      } catch (err) {
        console.error('🛡️ LK RAMOS: Erro ao registrar PWA:', err);
      }
    };

    syncEnvironment();
  }, []);

  const showUpdateToast = (registration: ServiceWorkerRegistration) => {
    toast({
      title: "🚀 Nova Versão Disponível!",
      description: "Uma atualização crítica foi publicada. Recarregue para aplicar.",
      duration: 30000,
      action: (
        <Button 
          size="sm" 
          variant="default" 
          className="bg-primary text-white font-bold h-8 px-4 rounded-full shadow-lg"
          onClick={() => {
            if (registration.waiting) {
              registration.waiting.postMessage({ type: 'SKIP_WAITING' });
            }
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
