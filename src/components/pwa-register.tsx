'use client';

import { useEffect, useRef } from 'react';
import { toast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';

/**
 * 🚀 PWA MASTER CONTROLLER LK RAMOS
 * Registra o Service Worker APENAS em produção e gerencia atualizações.
 * Detecta via SW ou polling de fallback (version.json).
 */
export function PwaRegister() {
  const updateFound = useRef(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const syncEnvironment = async () => {
      const isProd = process.env.NODE_ENV === 'production';

      // 🛡️ LIMPEZA DE CACHE E WORKERS EM DESENVOLVIMENTO
      if (!isProd) {
        if ('caches' in window) {
          try {
            const cacheNames = await caches.keys();
            await Promise.all(cacheNames.map(name => caches.delete(name)));
          } catch (e) {}
        }
        
        if ('serviceWorker' in navigator) {
          try {
            const registrations = await navigator.serviceWorker.getRegistrations();
            for (const registration of registrations) {
              await registration.unregister();
              console.log("💎 LK RAMOS: Service Worker removido para garantir código fresco em desenvolvimento.");
            }
          } catch (e) {}
        }
        return; 
      }

      // 🚀 REGISTRO APENAS EM PRODUÇÃO
      if (!('serviceWorker' in navigator)) return;

      try {
        const registration = await navigator.serviceWorker.register('/sw.js');

        // Se já tiver alguma att pendente esperando (ignorado na sessão anterior)
        if (registration.waiting) {
            triggerUpdatePrompt(registration);
        }

        // Listener de quando o SW descobre uma nova versão no background
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (!newWorker) return;

          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              triggerUpdatePrompt(registration);
            }
          });
        });

        // Quando o SW de fato ativar, a página pode dar refresh automaticamente para carregar a nova versão
        let refreshing = false;
        navigator.serviceWorker.addEventListener('controllerchange', () => {
          if (!refreshing) {
            refreshing = true;
            window.location.reload();
          }
        });

      } catch (err) {
        console.error('🛡️ LK RAMOS: Erro ao registrar PWA:', err);
      }
    };

    syncEnvironment();
  }, []);

  // FALLBACK WEB: Polling do version.json para forçar updates se o SW falhar na checagem
  useEffect(() => {
    if (typeof window === 'undefined' || process.env.NODE_ENV !== 'production') return;

    const checkFallbackVersion = async () => {
        if (updateFound.current) return;
        try {
            const res = await fetch('/version.json?t=' + Date.now(), { cache: 'no-store' });
            if (!res.ok) return;
            const data = await res.json();
            const currentVersion = localStorage.getItem('lk-app-version');
            
            if (!currentVersion) {
                // Primeira vez, salva a versão
                localStorage.setItem('lk-app-version', data.version);
            } else if (currentVersion !== data.version) {
                // Nova versão detectada!
                triggerUpdatePrompt(undefined, data.version);
            }
        } catch (e) {}
    };

    // Checa versão a cada 5 minutos
    const interval = setInterval(checkFallbackVersion, 5 * 60 * 1000);
    // Também checa assim que a pessoa retorna pra aba
    window.addEventListener('focus', checkFallbackVersion);

    return () => {
        clearInterval(interval);
        window.removeEventListener('focus', checkFallbackVersion);
    };
  }, []);

  const triggerUpdatePrompt = (registration?: ServiceWorkerRegistration, newVersionFallback?: string) => {
    if (updateFound.current) return;
    updateFound.current = true;

    toast({
      title: "🚀 Nova versão disponível",
      description: "Deseja atualizar para a versão mais recente e estável do CRM?",
      duration: 120000, // 2 minutos esperando clique
      action: (
        <div className="flex items-center gap-2 mt-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="h-8 px-3 text-xs"
            onClick={() => {
                // Ao clicar aqui, o toast se descarta nativamente, 
                // e como updateFound.current é true, ele não incomodará tão cedo nessa mesma sessão
                console.log("LK RAMOS: Atualização adiada.")
            }}
          >
            Depois
          </Button>
          <Button 
            size="sm" 
            variant="default" 
            className="bg-primary hover:bg-primary/90 text-white font-bold h-8 px-3 text-xs"
            onClick={() => {
              if (newVersionFallback) {
                  localStorage.setItem('lk-app-version', newVersionFallback);
              }
              if (registration?.waiting) {
                // Manda o worker waiting virar o worker active
                registration.waiting.postMessage({ type: 'SKIP_WAITING' });
                // O page reload ocorrerá no 'controllerchange'
              } else {
                // Força reload no caso de fallback JSON apenas
                window.location.reload();
              }
            }}
          >
            <RefreshCw className="mr-2 h-3 w-3" />
            Atualizar agora
          </Button>
        </div>
      ),
    });
  };

  return null;
}
