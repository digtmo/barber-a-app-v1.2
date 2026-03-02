'use client';

import { useState } from 'react';
import { Calendar, Clock, User, Phone, Lock, Unlock, AlertCircle, Trash2 } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { getWeekDates, formatDate, formatDisplayDate, isToday } from '@/utils/dateUtils';

export default function BarberAgenda() {
  const { getTimeSlotsForDate, barberConfig, blockDate, unblockDate, clearAllBlockedDates, clearAllReservations, appointments, deleteReservation } = useApp();
  const [selectedDate, setSelectedDate] = useState<string>(formatDate(new Date()));
  const [weekOffset, setWeekOffset] = useState(0);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [clearingBlocked, setClearingBlocked] = useState(false);
  const [clearingReservations, setClearingReservations] = useState(false);

  const getWeekForOffset = () => {
    const today = new Date();
    const offsetDate = new Date(today);
    offsetDate.setDate(today.getDate() + (weekOffset * 7));
    return getWeekDates(offsetDate);
  };

  const weekDates = getWeekForOffset();
  const timeSlots = getTimeSlotsForDate(selectedDate);
  const isBlocked = barberConfig.blockedDates.includes(selectedDate);

  const handleToggleBlock = async () => {
    if (loadingAction) return;
    if (isBlocked) {
      setLoadingAction('unblock');
      try {
        await unblockDate(selectedDate);
      } finally {
        setLoadingAction(null);
      }
    } else {
      const appointmentsForDate = appointments.filter(apt => apt.date === selectedDate);
      if (appointmentsForDate.length > 0) {
        if (!confirm(`Hay ${appointmentsForDate.length} reserva(s) para este día. ¿Estás seguro de que quieres bloquearlo? Las reservas serán eliminadas.`)) return;
      }
      setLoadingAction('block');
      try {
        await blockDate(selectedDate);
      } finally {
        setLoadingAction(null);
      }
    }
  };

  const occupiedCount = timeSlots.filter(slot => !slot.available).length;
  const totalSlots = timeSlots.length;

  return (
    <div>
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <h2 className="text-2xl font-bold text-text font-display">Tu agenda</h2>
          <div className="flex gap-2 items-center">
            {barberConfig.blockedDates.length > 0 && (
              <button
                type="button"
                onClick={async () => {
                  if (!confirm(`¿Desbloquear todas las fechas bloqueadas (${barberConfig.blockedDates.length})?`)) return;
                  setClearingBlocked(true);
                  try {
                    await clearAllBlockedDates();
                  } finally {
                    setClearingBlocked(false);
                  }
                }}
                disabled={clearingBlocked}
                className="px-3 py-1.5 text-sm bg-gold hover:bg-goldLight disabled:opacity-50 rounded transition-colors text-surface font-semibold"
              >
                {clearingBlocked ? '...' : 'Desbloquear todas las fechas'}
              </button>
            )}
            {appointments.length > 0 && (
              <button
                type="button"
                onClick={async () => {
                  if (!confirm(`¿Eliminar todas las reservas (${appointments.length})? Esta acción no se puede deshacer.`)) return;
                  setClearingReservations(true);
                  try {
                    await clearAllReservations();
                  } finally {
                    setClearingReservations(false);
                  }
                }}
                disabled={clearingReservations}
                className="px-3 py-1.5 text-sm bg-error hover:bg-error/90 disabled:opacity-50 rounded transition-colors text-white font-semibold"
              >
                {clearingReservations ? '...' : 'Eliminar todas las reservas'}
              </button>
            )}
            <button
              onClick={() => setWeekOffset(weekOffset - 1)}
              className="px-3 py-1 bg-card border border-subtle rounded hover:bg-input transition-colors text-text"
            >
              ←
            </button>
            <button
              onClick={() => setWeekOffset(weekOffset + 1)}
              className="px-3 py-1 bg-card border border-subtle rounded hover:bg-input transition-colors text-text"
            >
              →
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-2">
          {weekDates.map((date) => {
            const dateStr = formatDate(date);
            const isSelected = selectedDate === dateStr;
            const isTodayDate = isToday(date);
            const dateSlots = getTimeSlotsForDate(dateStr);
            const hasAppointments = dateSlots.some(slot => !slot.available);
            const isDateBlocked = barberConfig.blockedDates.includes(dateStr);

            return (
              <button
                key={dateStr}
                onClick={() => setSelectedDate(dateStr)}
                className={`p-3 rounded-lg text-center transition-all relative border ${
                  isSelected
                    ? 'bg-gold text-surface shadow-lg shadow-gold/20 border-gold'
                    : 'bg-card hover:bg-input border-subtle text-text'
                } ${isTodayDate && !isSelected ? 'ring-2 ring-gold/50' : ''}`}
              >
                <div className="text-xs text-textMuted mb-1">
                  {formatDisplayDate(date).split(' ')[0]}
                </div>
                <div className="text-lg font-bold mb-1">
                  {date.getDate()}
                </div>
                {isDateBlocked && (
                  <Lock className="w-3 h-3 absolute top-1 right-1 text-error" />
                )}
                {hasAppointments && !isDateBlocked && (
                  <div className="h-1 w-1 rounded-full bg-gold mx-auto" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="bg-card rounded-lg p-6 border border-gold">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-bold mb-1 text-text font-display">
              {formatDisplayDate(new Date(selectedDate + 'T00:00:00'))}
            </h3>
            {!isBlocked && totalSlots > 0 && (
              <p className="text-sm text-textMuted">
                {occupiedCount} de {totalSlots} turnos ocupados
              </p>
            )}
          </div>
          <button
            onClick={handleToggleBlock}
            disabled={!!loadingAction}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-colors disabled:opacity-60 ${
              isBlocked
                ? 'bg-gold hover:bg-goldLight text-surface'
                : 'bg-error/90 hover:bg-error text-white'
            }`}
          >
            {loadingAction ? (
              '...'
            ) : isBlocked ? (
              <>
                <Unlock className="w-4 h-4" />
                Desbloquear día
              </>
            ) : (
              <>
                <Lock className="w-4 h-4" />
                Bloquear día
              </>
            )}
          </button>
        </div>

        {isBlocked ? (
          <div className="bg-error/10 border border-error/20 rounded-lg p-6 text-center">
            <Lock className="w-12 h-12 text-error mx-auto mb-3" />
            <p className="text-error font-semibold">Este día está bloqueado</p>
            <p className="text-textMuted text-sm mt-2">Los clientes no pueden hacer reservas</p>
          </div>
        ) : timeSlots.length === 0 ? (
          <div className="bg-surface border border-gold rounded-lg p-6 text-center">
            <AlertCircle className="w-12 h-12 text-textMuted mx-auto mb-3" />
            <p className="text-textMuted">No trabajas este día</p>
          </div>
        ) : (
          <div className="space-y-3">
            {timeSlots.map((slot) => (
              <div
                key={slot.time}
                className={`p-4 rounded-lg border transition-all ${
                  slot.available
                    ? 'bg-surface border-gold'
                    : 'bg-gold/10 border-gold'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`flex items-center gap-2 font-bold ${
                      slot.available ? 'text-textMuted' : 'text-gold'
                    }`}>
                      <Clock className="w-4 h-4" />
                      {slot.time}
                    </div>
                    {slot.available ? (
                      <span className="text-sm text-textMuted">Disponible</span>
                    ) : slot.appointment && (
                      <div className="flex items-center justify-between gap-2 min-w-0 w-full text-sm">
                        <div className="flex items-center gap-3 min-w-0 flex-1 overflow-hidden">
                          <div className="flex items-center gap-2 text-text min-w-0 shrink-0">
                            <User className="w-4 h-4 flex-shrink-0" />
                            <span className="truncate">{slot.appointment.clientName}</span>
                          </div>
                          <a
                            href={`tel:${slot.appointment.clientPhone.replace(/\s/g, '')}`}
                            className="flex items-center gap-2 text-textMuted hover:text-gold transition-colors shrink-0"
                            title="Llamar al cliente"
                          >
                            <Phone className="w-4 h-4" />
                            <span>{slot.appointment.clientPhone}</span>
                          </a>
                        </div>
                        <button
                          type="button"
                          onClick={async () => {
                            if (!slot.appointment || !confirm('¿Eliminar esta reserva?')) return;
                            try {
                              await deleteReservation(slot.appointment.id);
                            } catch {
                              // el contexto ya muestra error o se puede añadir toast
                            }
                          }}
                          title="Eliminar reserva"
                          className="p-1.5 rounded text-error hover:text-error hover:bg-error/10 transition-colors flex-shrink-0"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
