'use client';

import { useState, useEffect, useRef } from 'react';
import { LogOut, Settings, Calendar as CalendarIcon } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import BarberConfig from './BarberConfig';
import BarberAgenda from './BarberAgenda';
import BarberPushNotifications from './BarberPushNotifications';
import InstallPWAButton from './InstallPWAButton';

export default function BarberView({ onBackToClient }: { onBackToClient?: () => void }) {
  const { barberConfig, logoutBarber, isLoadingBarberData, barberDataError, refetchBarberData } = useApp();
  const [activeTab, setActiveTab] = useState<'agenda' | 'config'>(
    barberConfig.isConfigured ? 'agenda' : 'config'
  );
  const [isTransitioning, setIsTransitioning] = useState(false);
  const wasConfiguredRef = useRef(barberConfig.isConfigured);

  // Al guardar el horario por primera vez, pasar automáticamente a la pestaña Agenda
  useEffect(() => {
    if (barberConfig.isConfigured && !wasConfiguredRef.current) {
      setActiveTab('agenda');
    }
    wasConfiguredRef.current = barberConfig.isConfigured;
  }, [barberConfig.isConfigured]);

  const handleTabChange = (tab: 'agenda' | 'config') => {
    setIsTransitioning(true);
    setTimeout(() => {
      setActiveTab(tab);
      setIsTransitioning(false);
    }, 150);
  };

  const handleLogout = () => {
    logoutBarber();
    onBackToClient?.();
  };

  if (isLoadingBarberData) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center text-text">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-text/30 border-t-gold rounded-full animate-spin mx-auto mb-4" />
          <p className="text-textMuted">Cargando...</p>
        </div>
      </div>
    );
  }

  if (barberDataError) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center p-4 text-text">
        <div className="text-center max-w-md">
          <p className="text-error mb-4">{barberDataError}</p>
          <button
            onClick={() => refetchBarberData()}
            className="px-4 py-2 bg-gold hover:bg-goldLight rounded-lg text-surface font-semibold"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface text-text">
      <header className="bg-surfaceAlt border-b border-subtle p-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-gold font-display">
              PANEL BARBERO
            </h1>
            <p className="text-textMuted text-sm mt-1">Gestiona tu agenda</p>
          </div>
          <div className="flex items-center gap-3">
            <BarberPushNotifications />
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 bg-card hover:bg-input rounded-lg transition-colors text-text border border-subtle"
            >
              <LogOut className="w-4 h-4" />
              Salir
            </button>
          </div>
        </div>
      </header>

      {!barberConfig.isConfigured ? (
        <div className="max-w-2xl mx-auto p-6">
          <div className="bg-gold/10 border border-gold rounded-lg p-6 mb-6">
            <h2 className="text-xl font-bold text-gold mb-2 font-display">Configuración requerida</h2>
            <p className="text-text">Debes configurar tu horario de atención antes de comenzar a recibir reservas.</p>
          </div>
          <BarberConfig onSwitchToAgenda={() => setActiveTab('agenda')} />
        </div>
      ) : (
        <>
          <div className="border-b border-subtle">
            <div className="max-w-6xl mx-auto px-6">
              <div className="flex gap-4">
                <button
                  onClick={() => handleTabChange('agenda')}
                  className={`flex items-center gap-2 px-6 py-4 font-semibold transition-colors relative ${
                    activeTab === 'agenda'
                      ? 'text-gold'
                      : 'text-textMuted hover:text-text'
                  }`}
                >
                  <CalendarIcon className="w-5 h-5" />
                  Agenda
                  {activeTab === 'agenda' && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gold" />
                  )}
                </button>
                <button
                  onClick={() => handleTabChange('config')}
                  className={`flex items-center gap-2 px-6 py-4 font-semibold transition-colors relative ${
                    activeTab === 'config'
                      ? 'text-gold'
                      : 'text-textMuted hover:text-text'
                  }`}
                >
                  <Settings className="w-5 h-5" />
                  Configuración
                  {activeTab === 'config' && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gold" />
                  )}
                </button>
              </div>
            </div>
          </div>

          <main className="max-w-6xl mx-auto p-6">
            <div className={isTransitioning ? 'slide-out-right' : 'slide-in-left'}>
              {activeTab === 'agenda' ? <BarberAgenda /> : <BarberConfig onSwitchToAgenda={() => handleTabChange('agenda')} />}
            </div>
          </main>
        </>
      )}
      <InstallPWAButton />
    </div>
  );
}
