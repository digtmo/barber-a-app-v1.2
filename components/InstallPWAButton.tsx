'use client';

import { useState, useEffect } from 'react';
import { Smartphone } from 'lucide-react';

export default function InstallPWAButton() {
  const [deferredPrompt, setDeferredPrompt] = useState<{ prompt: () => Promise<{ outcome: string }> } | null>(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [showIOSModal, setShowIOSModal] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    const ua = typeof navigator !== 'undefined' ? navigator.userAgent : '';
    const ios = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    setIsIOS(!!ios);

    const standalone = typeof window !== 'undefined' &&
      (window.matchMedia('(display-mode: standalone)').matches ||
       (window.navigator as unknown as { standalone?: boolean }).standalone === true);
    setIsStandalone(!!standalone);

    const onBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as unknown as { prompt: () => Promise<{ outcome: string }> });
    };
    window.addEventListener('beforeinstallprompt', onBeforeInstall);
    return () => window.removeEventListener('beforeinstallprompt', onBeforeInstall);
  }, []);

  const handleClick = async () => {
    if (isIOS) {
      setShowIOSModal(true);
      return;
    }
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      setDeferredPrompt(null);
    }
  };

  if (isStandalone) return null;
  if (!deferredPrompt && !isIOS) return null;

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-xl bg-gold text-surface font-semibold shadow-lg hover:bg-goldLight transition-colors"
        aria-label="Instalar app"
      >
        <Smartphone className="w-5 h-5" />
        Transformar a app
      </button>

      {showIOSModal && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60"
          onClick={() => setShowIOSModal(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Instrucciones para instalar"
        >
          <div
            className="bg-card border border-subtle rounded-xl p-6 max-w-sm shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold text-gold font-display mb-2">Añadir a la pantalla de inicio</h3>
            <p className="text-text text-sm mb-4">
              Toca el botón <strong>Compartir</strong> (cuadro con flecha hacia arriba) en la barra del navegador y luego
              selecciona <strong>&quot;Añadir a la pantalla de inicio&quot;</strong>.
            </p>
            <button
              type="button"
              onClick={() => setShowIOSModal(false)}
              className="w-full py-2 rounded-lg bg-gold text-surface font-semibold"
            >
              Entendido
            </button>
          </div>
        </div>
      )}
    </>
  );
}
