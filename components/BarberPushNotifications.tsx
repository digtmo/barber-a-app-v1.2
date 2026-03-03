'use client';

import { useState, useEffect, useCallback } from 'react';
import { Bell, BellOff } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { savePushSubscription } from '@/lib/barberApiClient';

const VAPID_PUBLIC = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) outputArray[i] = rawData.charCodeAt(i);
  return outputArray;
}

export default function BarberPushNotifications() {
  const { slug } = useApp();
  const [status, setStatus] = useState<'idle' | 'loading' | 'enabled' | 'unsupported' | 'denied' | 'error'>('idle');
  const [message, setMessage] = useState<string | null>(null);

  const trySubscribe = useCallback(async () => {
    if (!slug || !VAPID_PUBLIC) {
      setStatus('unsupported');
      setMessage('Notificaciones no configuradas');
      return;
    }
    if (typeof window === 'undefined' || !('serviceWorker' in navigator) || !('PushManager' in window)) {
      setStatus('unsupported');
      return;
    }
    setStatus('loading');
    setMessage(null);

    const timeout = setTimeout(() => {
      setStatus((s) => (s === 'loading' ? 'error' : s));
      setMessage('Tardó demasiado. Reintenta o añade la app a la pantalla de inicio.');
    }, 12000);

    try {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        setStatus('denied');
        setMessage('Permiso denegado');
        return;
      }
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await savePushSubscription(slug, sub);
        setStatus('enabled');
        setMessage('Notificaciones activas');
        return;
      }
      const newSub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC) as BufferSource,
      });
      await savePushSubscription(slug, newSub);
      setStatus('enabled');
      setMessage('Notificaciones activadas');
    } catch (e) {
      setStatus('error');
      setMessage(e instanceof Error ? e.message : 'Error al activar');
    } finally {
      clearTimeout(timeout);
    }
  }, [slug]);

  useEffect(() => {
    if (!slug || !VAPID_PUBLIC) return;
    if (typeof window === 'undefined' || !('Notification' in window)) return;
    if (Notification.permission === 'granted') {
      navigator.serviceWorker.ready.then((reg) => {
        reg.pushManager.getSubscription().then((sub) => {
          setStatus(sub ? 'enabled' : 'idle');
        });
      }).catch(() => setStatus('idle'));
    }
  }, [slug]);

  if (!slug || status === 'unsupported') return null;

  if (status === 'enabled') return null;

  return (
    <div className="flex items-center gap-2">
      {message && <span className="text-sm text-textMuted">{message}</span>}
      <button
          type="button"
          onClick={trySubscribe}
          disabled={status === 'loading'}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-gold/50 text-gold hover:bg-gold/10 transition-colors text-sm disabled:opacity-50"
        >
          {status === 'loading' ? (
            <span className="animate-pulse">Activando...</span>
          ) : status === 'denied' || status === 'error' ? (
            <>
              <BellOff className="w-4 h-4" />
              Activar notificaciones
            </>
          ) : (
            <>
              <Bell className="w-4 h-4" />
              Activar notificaciones
            </>
          )}
        </button>
    </div>
  );
}
