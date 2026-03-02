'use client';

import { useState } from 'react';
import { Lock, AlertCircle } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import Spinner from './Spinner';

export default function BarberLogin({ onBackToClient }: { onBackToClient?: () => void }) {
  const { authenticateBarber } = useApp();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setError(true);
      return;
    }
    setIsLoading(true);
    setError(false);

    const success = await authenticateBarber(email.trim(), password);

    setIsLoading(false);
    if (!success) {
      setError(true);
      setPassword('');
      setTimeout(() => setError(false), 3000);
    }
  };

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold text-gold mb-2 font-display">
            BARBER SHOP
          </h1>
          <p className="text-textMuted">Panel de administración</p>
        </div>

        <div className="bg-card rounded-lg p-8 border border-gold">
          <div className="flex items-center justify-center w-16 h-16 bg-gold/10 rounded-full mx-auto mb-6">
            <Lock className="w-8 h-8 text-gold" />
          </div>

          <h2 className="text-2xl font-bold text-center mb-6 font-display text-text">Acceso Barbero</h2>

          {error && (
            <div className="bg-error/10 border border-error/20 rounded-lg p-4 mb-6 flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-error flex-shrink-0" />
              <p className="text-error text-sm">Email o contraseña incorrectos</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm text-textMuted mb-2 block">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-input border border-gold rounded-lg focus:outline-none focus:border-gold text-text"
                placeholder="tu@email.com"
              />
            </div>
            <div>
              <label className="text-sm text-textMuted mb-2 block">Contraseña</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-input border border-gold rounded-lg focus:outline-none focus:border-gold text-text"
                placeholder="Ingresa tu contraseña"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-4 bg-gold hover:bg-goldLight disabled:bg-gold/50 disabled:cursor-not-allowed text-surface font-bold rounded-lg transition-colors shadow-lg shadow-gold/20 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Spinner size="sm" />
                  Verificando...
                </>
              ) : (
                'Ingresar'
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-textMuted text-sm mt-6">
          ¿Eres cliente? <button onClick={onBackToClient} className="text-gold hover:text-goldLight">Haz tu reserva aquí</button>
        </p>
      </div>
    </div>
  );
}
