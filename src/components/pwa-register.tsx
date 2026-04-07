'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';

/**
 * 🚀 PWA MASTER CONTROLLER LK RAMOS V2
 * Gerencia o ciclo de vida do Service Worker e atualizações do sistema.
 * Otimizado para funcionamento em APPs instalados (Standalone).
 */
export function PwaRegister() {
  const updateFound = useRef(false);
  const { toast, dismiss } = useToast();

  const triggerUpdatePrompt = useCallback((registration?: ServiceWorkerRegistration, newVersionFallback?: string) => {
    // 🛡️ Impedir duplicidade e respeitar o SNOOZE
    const snoozeUntil = localStorage.getItem('lk-pwa-snooze');
    if (snoozeUntil && Date.now() < parseInt(snoozeUntil, 10)) {
        console.log("[PWA Stage: UI] ⏳ Aviso suprimido pelo SNOOZE ativo.");
        return;
    }

    if (updateFound.current) {
        console.log("[PWA Stage: UI] ⏳ Aviso já está em exibição ou processamento.");
        return;
    }
    
    console.log(`[PWA Stage: UI] 🚨 Disparando Toast de Atualização. SW Waiting: ${!!registration?.waiting}`);
    dismiss();
    updateFound.current = true;

    toast({
      title: "🚀 Nova versão disponível",
      description: "Uma nova versão do CRM foi detectada. Deseja atualizar agora?",
      duration: Infinity, // Mantém aberto até interação no PWA
      action: (
        <div className="flex items-center gap-2 mt-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="h-8 px-3 text-xs"
            onClick={() => {
                dismiss();
                updateFound.current = false;
                const thirtyMins = Date.now() + 30 * 60 * 1000;
                localStorage.setItem('lk-pwa-snooze', thirtyMins.toString());
                console.log("[PWA Stage: Action] ⏭️ Atualização adiada por 30 minutos.");
            }}
          >
            Depois
          </Button>
          <Button 
            size="sm" 
            variant="default" 
            className="bg-primary hover:bg-primary/90 text-white font-bold h-8 px-3 text-xs"
            onClick={() => {
              dismiss();
              console.log("[PWA Stage: Action] ⚡ Atualização iniciada pelo usuário.");
              
              if (newVersionFallback) {
                  localStorage.setItem('lk-app-version', newVersionFallback);
              }

              if (registration?.waiting) {
                registration.waiting.postMessage({ type: 'SKIP_WAITING' });
              } else {
                // Caso onde o SW não está em waiting mas detectamos mudança via version.json
                const forceHardReload = async () => {
                    try {
                        if ('caches' in window) {
                            const names = await caches.keys();
                            await Promise.all(names.map(name => caches.delete(name)));
                        }
                        const regs = await navigator.serviceWorker.getRegistrations();
                        for (const r of regs) await r.unregister();
                    } catch (e) {}
                    window.location.href = window.location.pathname + '?refresh=' + Date.now();
                };
                forceHardReload();
              }
            }}
          >
            <RefreshCw className="mr-2 h-3 w-3" />
            Atualizar agora
          </Button>
        </div>
      ),
    });
  }, [dismiss, toast]);

  const checkUpdates = useCallback(async () => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

    console.log("[PWA Stage: Check] 🔍 Iniciando verificação de atualizações...");

    // 1. Verificar via Service Worker
    try {
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (const reg of registrations) {
            // Tenta forçar o navegador a baixar o sw.js novamente
            await reg.update().catch(() => {});

            if (reg.waiting) {
                console.log("[PWA Stage: Check] 📦 Service Worker em estado WAITING detectado.");
                triggerUpdatePrompt(reg);
                return;
            }

            if (reg.installing) {
                console.log("[PWA Stage: Check] ⚙️ Service Worker em estado INSTALLING detectado. Aguardando...");
                reg.installing.addEventListener('statechange', (e: any) => {
                    if (e.target.state === 'installed') {
                        console.log("[PWA Stage: Check] ✅ SW instalado com sucesso durante a sessão.");
                        triggerUpdatePrompt(reg);
                    }
                });
            }
        }
    } catch (e) {
        console.warn("[PWA Stage: Check] Erro na checagem do SW", e);
    }

    // 2. Verificar via Fallback (version.json)
    try {
        const res = await fetch('/version.json?t=' + Date.now(), { cache: 'no-store' });
        if (res.ok) {
            const data = await res.json();
            const currentVersion = localStorage.getItem('lk-app-version');
            
            if (currentVersion && currentVersion !== data.version) {
                console.log(`[PWA Stage: Check] 🚨 Versão detectada via fallback: ${data.version}`);
                triggerUpdatePrompt(undefined, data.version);
            } else if (!currentVersion) {
                localStorage.setItem('lk-app-version', data.version);
            }
        }
    } catch (e) {
        console.warn("[PWA Stage: Check] Erro na checagem do version.json", e);
    }
  }, [triggerUpdatePrompt]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // 🚀 Lógica de inicialização de ambiente
    const isProd = process.env.NODE_ENV === 'production';
    if (!isProd) return;

    if (!('serviceWorker' in navigator)) return;

    const initPwa = async () => {
        try {
            console.log("[PWA Stage: Init] 🚀 Registrando Service Worker...");
            const registration = await navigator.serviceWorker.register('/sw.js');
            
            // Listener de atualizações futuras na mesma sessão
            registration.addEventListener('updatefound', () => {
                console.log("[PWA Stage: Event] 💡 Novo conteúdo encontrado (updatefound).");
                const newWorker = registration.installing;
                if (newWorker) {
                    newWorker.addEventListener('statechange', () => {
                        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                            console.log("[PWA Stage: Event] ✅ Novo worker instalado. Disparando prompt...");
                            triggerUpdatePrompt(registration);
                        }
                    });
                }
            });

            // 🛡️ VERIFICAÇÃO IMEDIATA: Caso o worker já esteja em WAITING logo após o registro
            if (registration.waiting) {
                console.log("[PWA Stage: Init] 📦 Worker já estava em estado WAITING.");
                triggerUpdatePrompt(registration);
            }

            // Refresh automático quando o novo SW assume o controle
            let refreshing = false;
            navigator.serviceWorker.addEventListener('controllerchange', () => {
                if (!refreshing) {
                    refreshing = true;
                    console.log("[PWA Stage: Lifecycle] 🔄 Controller alterado. Recarregando...");
                    window.location.reload();
                }
            });

            // Checagem inicial
            await checkUpdates();

        } catch (err) {
            console.error('[PWA Stage: Init] 🛡️ Erro fatal no PWA:', err);
        }
    };

    initPwa();

    // 🕒 Polling de segurança (A cada 15 minutos)
    const interval = setInterval(checkUpdates, 15 * 60 * 1000);

    // ⚡ Monitor de Retorno ao App (Essencial para Standalone/PWA Instalado)
    const handleActivity = () => {
        if (document.visibilityState === 'visible') {
            console.log("[PWA Stage: Resume] 📡 App voltou para o primeiro plano. Forçando verificação...");
            // Força o navegador a verificar o arquivo sw.js no servidor
            navigator.serviceWorker.getRegistrations().then(regs => {
                for (const reg of regs) reg.update().catch(() => {});
            });
            checkUpdates();
        }
    };

    window.addEventListener('focus', handleActivity);
    document.addEventListener('visibilitychange', handleActivity);

    return () => {
        clearInterval(interval);
        window.removeEventListener('focus', handleActivity);
        document.removeEventListener('visibilitychange', handleActivity);
    };
  }, [checkUpdates, triggerUpdatePrompt]);

  return null;
}
