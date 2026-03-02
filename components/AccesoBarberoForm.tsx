'use client';

import { useState } from 'react';
import { LogIn } from 'lucide-react';

const BARBER_DOMAIN = process.env.NEXT_PUBLIC_BARBER_DOMAIN ?? 'barber.com';

export default function AccesoBarberoForm() {
  const [slug, setSlug] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = slug.trim().toLowerCase().replace(/\s+/g, '-');
    if (!trimmed) {
      setError('Escribe el nombre de tu barbería');
      return;
    }
    if (!/^[a-z0-9-]+$/.test(trimmed)) {
      setError('Solo letras minúsculas, números y guiones');
      return;
    }
    setError('');
    const protocol = typeof window !== 'undefined' && window.location.protocol === 'https:' ? 'https:' : 'https:';
    const url = `${protocol}//${trimmed}.${BARBER_DOMAIN}/acceso`;
    window.location.href = url;
  };

  return (
    <div className="max-w-md w-full">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-gold mb-2 font-display">
          ACCESO BARBERO
        </h1>
        <p className="text-textMuted">Ingresa el nombre de tu barbería para entrar a tu panel</p>
      </div>

      <div className="bg-card rounded-lg p-8 border border-gold">
        <div className="flex items-center justify-center w-16 h-16 bg-gold/10 rounded-full mx-auto mb-6">
          <LogIn className="w-8 h-8 text-gold" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm text-textMuted mb-2 block">Nombre de tu barbería</label>
            <input
              type="text"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="ej: dani, mi-barberia"
              className="w-full px-4 py-3 bg-input border border-gold rounded-lg focus:outline-none focus:border-gold text-text placeholder-textMuted"
              autoFocus
            />
            <p className="text-xs text-textMuted mt-1">
              Serás redirigido a {slug.trim() || 'tu-slug'}.{BARBER_DOMAIN}/acceso
            </p>
          </div>

          {error && (
            <p className="text-sm text-error">{error}</p>
          )}

          <button
            type="submit"
            className="w-full py-4 bg-gold hover:bg-goldLight text-surface font-bold rounded-lg transition-colors shadow-lg shadow-gold/20"
          >
            Ir a mi panel
          </button>
        </form>
      </div>
    </div>
  );
}
