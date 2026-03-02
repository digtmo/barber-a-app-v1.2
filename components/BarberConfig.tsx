'use client';

import { useState, useEffect } from 'react';
import { Clock, Calendar, Save, AlertCircle, CheckCircle } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import Modal from './Modal';
import Spinner from './Spinner';

export default function BarberConfig({ onSwitchToAgenda }: { onSwitchToAgenda?: () => void }) {
  const { barberConfig, updateBarberConfig } = useApp();
  const [config, setConfig] = useState({
    startTime: barberConfig.startTime,
    endTime: barberConfig.endTime,
    slotDuration: barberConfig.slotDuration,
    workingDays: barberConfig.workingDays,
  });
  const [message, setMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  useEffect(() => {
    setConfig({
      startTime: barberConfig.startTime,
      endTime: barberConfig.endTime,
      slotDuration: barberConfig.slotDuration,
      workingDays: barberConfig.workingDays,
    });
  }, [barberConfig]);

  const daysOfWeek = [
    { value: 0, label: 'Dom' },
    { value: 1, label: 'Lun' },
    { value: 2, label: 'Mar' },
    { value: 3, label: 'Mié' },
    { value: 4, label: 'Jue' },
    { value: 5, label: 'Vie' },
    { value: 6, label: 'Sáb' },
  ];

  const toggleDay = (day: number) => {
    setConfig(prev => ({
      ...prev,
      workingDays: prev.workingDays.includes(day)
        ? prev.workingDays.filter(d => d !== day)
        : [...prev.workingDays, day].sort(),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (config.workingDays.length === 0) {
      setMessage('Debes seleccionar al menos un día de trabajo');
      return;
    }

    const [startHour, startMin] = config.startTime.split(':').map(Number);
    const [endHour, endMin] = config.endTime.split(':').map(Number);
    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;

    if (startMinutes >= endMinutes) {
      setMessage('La hora de fin debe ser posterior a la hora de inicio');
      return;
    }

    setIsLoading(true);
    try {
      await updateBarberConfig(config);
      setShowSuccessModal(true);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Error al guardar la configuración');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCloseSuccessModal = () => {
    setShowSuccessModal(false);
    setTimeout(() => {
      onSwitchToAgenda?.();
    }, 200);
  };

  return (
    <div className="bg-card rounded-lg p-6 border border-gold">
      <h2 className="text-2xl font-bold mb-6 text-text font-display">Configuración de horario</h2>

      {barberConfig.isConfigured && (
        <div className="bg-gold/10 border border-gold rounded-lg p-4 mb-6 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-gold flex-shrink-0 mt-0.5" />
          <div className="text-goldLight text-sm">
            <p className="font-semibold mb-1">Atención</p>
            <p>Si cambias tu horario, las reservas que queden fuera del nuevo horario serán eliminadas automáticamente.</p>
          </div>
        </div>
      )}

      {message && (
        <div className="bg-error/10 border border-error/20 rounded-lg p-4 mb-6">
          <p className="text-error">{message}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="flex items-center gap-2 text-sm text-textMuted mb-2">
              <Clock className="w-4 h-4" />
              Hora de inicio
            </label>
            <input
              type="time"
              required
              value={config.startTime}
              onChange={(e) => setConfig({ ...config, startTime: e.target.value })}
              className="w-full px-4 py-3 bg-input border border-gold rounded-lg focus:outline-none focus:border-gold text-text"
            />
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm text-textMuted mb-2">
              <Clock className="w-4 h-4" />
              Hora de fin
            </label>
            <input
              type="time"
              required
              value={config.endTime}
              onChange={(e) => setConfig({ ...config, endTime: e.target.value })}
              className="w-full px-4 py-3 bg-input border border-gold rounded-lg focus:outline-none focus:border-gold text-text"
            />
          </div>
        </div>

        <div>
          <label className="flex items-center gap-2 text-sm text-textMuted mb-2">
            <Clock className="w-4 h-4" />
            Duración de cada turno
          </label>
          <div className="grid grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => setConfig({ ...config, slotDuration: 30 })}
              className={`py-3 rounded-lg font-semibold transition-all ${
                config.slotDuration === 30
                  ? 'bg-gold text-surface'
                  : 'bg-input border border-subtle text-textMuted hover:border-gold'
              }`}
            >
              30 minutos
            </button>
            <button
              type="button"
              onClick={() => setConfig({ ...config, slotDuration: 60 })}
              className={`py-3 rounded-lg font-semibold transition-all ${
                config.slotDuration === 60
                  ? 'bg-gold text-surface'
                  : 'bg-input border border-subtle text-textMuted hover:border-gold'
              }`}
            >
              60 minutos
            </button>
          </div>
        </div>

        <div>
          <label className="flex items-center gap-2 text-sm text-textMuted mb-2">
            <Calendar className="w-4 h-4" />
            Días de trabajo
          </label>
          <div className="grid grid-cols-7 gap-2">
            {daysOfWeek.map((day) => (
              <button
                key={day.value}
                type="button"
                onClick={() => toggleDay(day.value)}
                className={`py-3 rounded-lg font-semibold transition-all ${
                  config.workingDays.includes(day.value)
                    ? 'bg-gold text-surface'
                    : 'bg-input border border-subtle text-textMuted hover:border-gold'
                }`}
              >
                {day.label}
              </button>
            ))}
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-4 bg-gold hover:bg-goldLight disabled:bg-gold/50 disabled:cursor-not-allowed text-surface font-bold rounded-lg transition-colors shadow-lg shadow-gold/20 flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <Spinner size="sm" />
              Guardando...
            </>
          ) : (
            <>
              <Save className="w-5 h-5" />
              Guardar configuración
            </>
          )}
        </button>
      </form>

      <Modal isOpen={showSuccessModal} onClose={handleCloseSuccessModal}>
        <div className="text-center">
          <div className="flex items-center justify-center w-16 h-16 bg-gold/10 rounded-full mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-gold" />
          </div>
          <h3 className="text-2xl font-bold text-text mb-2 font-display">
            Configuración guardada
          </h3>
          <p className="text-textMuted mb-6">
            Tu horario de atención ha sido actualizado exitosamente
          </p>
          <button
            onClick={handleCloseSuccessModal}
            className="w-full py-3 bg-gold hover:bg-goldLight text-surface font-bold rounded-lg transition-colors"
          >
            Ir a mi agenda
          </button>
        </div>
      </Modal>
    </div>
  );
}
