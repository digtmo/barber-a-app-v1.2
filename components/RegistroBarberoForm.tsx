'use client';

import { useState } from 'react';
import { UserPlus } from 'lucide-react';
import Link from 'next/link';

const BARBER_DOMAIN = process.env.NEXT_PUBLIC_BARBER_DOMAIN ?? 'tubarber.com';

export default function RegistroBarberoForm() {
  const [slug, setSlug] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [successSlug, setSuccessSlug] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const trimmedSlug = slug.trim().toLowerCase().replace(/\s+/g, '-');
    if (!trimmedSlug || !displayName.trim() || !email.trim() || !password) {
      setError('Completa todos los campos');
      return;
    }
    if (!/^[a-z0-9-]+$/.test(trimmedSlug)) {
      setError('Nombre de barbería: solo letras minúsculas, números y guiones');
      return;
    }
    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug: trimmedSlug,
          display_name: displayName.trim(),
          email: email.trim().toLowerCase(),
          password,
        }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data.error || 'Error al registrar');
        return;
      }
      setSuccessSlug(trimmedSlug);
    } catch {
      setError('Error de conexión. Intenta de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  if (successSlug) {
    const accesoUrl = `https://${successSlug}.${BARBER_DOMAIN}/acceso`;
    return (
      <div className="max-w-md w-full">
        <div className="bg-card rounded-lg p-8 border border-gold text-center">
          <div className="flex items-center justify-center w-16 h-16 bg-gold/10 rounded-full mx-auto mb-6">
            <UserPlus className="w-8 h-8 text-gold" />
          </div>
          <h2 className="text-2xl font-bold text-text mb-2 font-display">Cuenta creada</h2>
          <p className="text-textMuted mb-6">
            Tu barbería <strong className="text-gold">{successSlug}.{BARBER_DOMAIN}</strong> está lista.
          </p>
          <a
            href={accesoUrl}
            className="inline-block w-full py-4 bg-gold hover:bg-goldLight text-surface font-bold rounded-lg transition-colors shadow-lg shadow-gold/20 text-center"
          >
            Ir a mi panel
          </a>
          <p className="text-textMuted text-sm mt-4">
            <Link href="/acceso" className="text-gold hover:text-goldLight">Iniciar sesión</Link> si ya tienes cuenta
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md w-full">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-gold mb-2 font-display">
          REGISTRAR BARBERÍA
        </h1>
        <p className="text-textMuted">Crea tu página y agenda en {BARBER_DOMAIN}</p>
      </div>

      <div className="bg-card rounded-lg p-8 border border-gold">
        <div className="flex items-center justify-center w-16 h-16 bg-gold/10 rounded-full mx-auto mb-6">
          <UserPlus className="w-8 h-8 text-gold" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm text-textMuted mb-2 block">Nombre de tu barbería (URL)</label>
            <input
              type="text"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="ej: dani, mi-barberia"
              className="w-full px-4 py-3 bg-input border border-gold rounded-lg focus:outline-none focus:border-gold text-text placeholder-textMuted"
            />
            <p className="text-xs text-textMuted mt-1">
              Tu página será: <strong className="text-gold">{slug.trim() || 'tu-slug'}.{BARBER_DOMAIN}</strong>
            </p>
          </div>

          <div>
            <label className="text-sm text-textMuted mb-2 block">Nombre para mostrar</label>
            <input
              type="text"
              required
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="ej: Barbería Dani"
              className="w-full px-4 py-3 bg-input border border-gold rounded-lg focus:outline-none focus:border-gold text-text placeholder-textMuted"
            />
          </div>

          <div>
            <label className="text-sm text-textMuted mb-2 block">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@email.com"
              className="w-full px-4 py-3 bg-input border border-gold rounded-lg focus:outline-none focus:border-gold text-text placeholder-textMuted"
            />
          </div>

          <div>
            <label className="text-sm text-textMuted mb-2 block">Contraseña (mín. 6 caracteres)</label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-3 bg-input border border-gold rounded-lg focus:outline-none focus:border-gold text-text placeholder-textMuted"
            />
          </div>

          {error && (
            <p className="text-sm text-error">{error}</p>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-4 bg-gold hover:bg-goldLight disabled:opacity-50 disabled:cursor-not-allowed text-surface font-bold rounded-lg transition-colors shadow-lg shadow-gold/20"
          >
            {isLoading ? 'Creando cuenta...' : 'Registrarme'}
          </button>
        </form>

        <p className="text-center text-textMuted text-sm mt-6">
          ¿Ya tienes cuenta? <Link href="/acceso" className="text-gold hover:text-goldLight">Iniciar sesión</Link>
        </p>
      </div>
    </div>
  );
}
