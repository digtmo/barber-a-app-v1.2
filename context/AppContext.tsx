'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { Appointment, BarberConfig, TimeSlot } from '@/types';
import {
  getToken,
  setToken,
  clearToken,
  fetchBarberData as apiFetchBarberData,
  login as apiLogin,
  updateBarberConfig as apiUpdateBarberConfig,
  blockDate as apiBlockDate,
  unblockDate as apiUnblockDate,
  clearAllBlockedDates as apiClearAllBlockedDates,
  createReservation,
  deleteReservation as apiDeleteReservation,
  clearAllReservations as apiClearAllReservations,
} from '@/lib/barberApiClient';

interface AppContextType {
  appointments: Appointment[];
  barberConfig: BarberConfig;
  isBarberAuthenticated: boolean;
  isLoadingBarberData: boolean;
  barberDataError: string | null;
  addAppointment: (appointment: Omit<Appointment, 'id'>) => Promise<{ success: boolean; message?: string }>;
  deleteReservation: (id: string) => Promise<void>;
  clearAllReservations: () => Promise<void>;
  updateBarberConfig: (config: Partial<BarberConfig>) => Promise<void>;
  blockDate: (date: string) => Promise<void>;
  unblockDate: (date: string) => Promise<void>;
  clearAllBlockedDates: () => Promise<void>;
  authenticateBarber: (email: string, password: string) => Promise<boolean>;
  logoutBarber: () => void;
  getTimeSlotsForDate: (date: string) => TimeSlot[];
  refetchBarberData: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const defaultBarberConfig: BarberConfig = {
  startTime: '09:00',
  endTime: '18:00',
  slotDuration: 30,
  workingDays: [1, 2, 3, 4, 5],
  blockedDates: [],
  isConfigured: false,
};

/** Normaliza hora a HH:mm (la BD puede devolver HH:mm:ss). */
function toHHmm(t: string): string {
  if (!t || typeof t !== 'string') return '';
  const parts = t.trim().split(':');
  const h = (parts[0] ?? '0').padStart(2, '0');
  const m = (parts[1] ?? '0').slice(0, 2).padStart(2, '0');
  return `${h}:${m}`;
}

function mapApiToBarberConfig(api: Awaited<ReturnType<typeof apiFetchBarberData>>): BarberConfig {
  const schedule = api.schedule;
  if (!schedule) return { ...defaultBarberConfig, isConfigured: false };

  return {
    startTime: toHHmm(schedule.working_start_time),
    endTime: toHHmm(schedule.working_end_time),
    slotDuration: (schedule.appointment_duration_minutes === 60 ? 60 : 30) as 30 | 60,
    workingDays: schedule.working_days ?? [],
    blockedDates: (api.blocked_dates ?? []).map((d) => d.date),
    isConfigured: schedule.is_configured ?? false,
  };
}

function mapApiReservationsToAppointments(
  reservations: Awaited<ReturnType<typeof apiFetchBarberData>>['reservations']
): Appointment[] {
  return (reservations ?? []).map((r) => ({
    id: r.id,
    date: r.date,
    timeSlot: toHHmm(r.time),
    clientName: r.client_name,
    clientPhone: r.client_phone ?? '',
    clientEmail: r.client_email ?? '',
  }));
}

function generateTimeSlots(startTime: string, endTime: string, duration: number): string[] {
  const slots: string[] = [];
  const [startHour, startMin] = startTime.split(':').map(Number);
  const [endHour, endMin] = endTime.split(':').map(Number);
  let currentMinutes = startHour * 60 + startMin;
  const endMinutes = endHour * 60 + endMin;
  while (currentMinutes < endMinutes) {
    const hours = Math.floor(currentMinutes / 60);
    const minutes = currentMinutes % 60;
    slots.push(`${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`);
    currentMinutes += duration;
  }
  return slots;
}

export function AppProvider({ children, slug }: { children: ReactNode; slug: string }) {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [barberConfig, setBarberConfig] = useState<BarberConfig>(defaultBarberConfig);
  const [isBarberAuthenticated, setIsBarberAuthenticated] = useState(() => !!getToken());
  const [isLoadingBarberData, setIsLoadingBarberData] = useState(true);
  const [barberDataError, setBarberDataError] = useState<string | null>(null);

  const refetchBarberData = useCallback(async () => {
    if (!slug) {
      setBarberDataError('No se pudo determinar el barbero (slug).');
      setIsLoadingBarberData(false);
      return;
    }
    setIsLoadingBarberData(true);
    setBarberDataError(null);
    try {
      const data = await apiFetchBarberData(slug);
      setBarberConfig(mapApiToBarberConfig(data));
      setAppointments(mapApiReservationsToAppointments(data.reservations));
    } catch (e) {
      setBarberDataError(e instanceof Error ? e.message : 'Error al cargar datos');
    } finally {
      setIsLoadingBarberData(false);
    }
  }, [slug]);

  useEffect(() => {
    refetchBarberData();
  }, [refetchBarberData]);

  // Refrescar datos al recuperar foco (para que el barbero vea nuevas reservas y otros clientes vean huecos ocupados)
  useEffect(() => {
    const onFocus = () => refetchBarberData();
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [refetchBarberData]);

  const getTimeSlotsForDate = useCallback(
    (date: string): TimeSlot[] => {
      if (!barberConfig.isConfigured) return [];

      const dateObj = new Date(date + 'T00:00:00');
      const dayOfWeek = dateObj.getDay();
      if (!barberConfig.workingDays.includes(dayOfWeek)) return [];
      if (barberConfig.blockedDates.includes(date)) return [];

      const timeSlots = generateTimeSlots(
        barberConfig.startTime,
        barberConfig.endTime,
        barberConfig.slotDuration
      );

      return timeSlots.map((time) => {
        const appointment = appointments.find((apt) => apt.date === date && apt.timeSlot === time);
        return {
          time,
          available: !appointment,
          appointment,
        };
      });
    },
    [barberConfig, appointments]
  );

  const addAppointment = useCallback(
    async (appointment: Omit<Appointment, 'id'>): Promise<{ success: boolean; message?: string }> => {
      if (!slug) return { success: false, message: 'Barbero no disponible' };
      try {
        const created = await createReservation(slug, {
          date: appointment.date,
          time: appointment.timeSlot,
          client_name: appointment.clientName,
          client_phone: appointment.clientPhone || undefined,
          client_email: appointment.clientEmail || undefined,
        });
        setAppointments((prev) => [
          ...prev,
          {
            id: created.id,
            date: created.date,
            timeSlot: toHHmm(created.time),
            clientName: created.client_name,
            clientPhone: created.client_phone ?? '',
            clientEmail: created.client_email ?? '',
          },
        ]);
        return { success: true };
      } catch (e) {
        return {
          success: false,
          message: e instanceof Error ? e.message : 'Error al crear la reserva',
        };
      }
    },
    [slug]
  );

  const deleteReservation = useCallback(
    async (id: string) => {
      if (!slug) return;
      await apiDeleteReservation(slug, id);
      setAppointments((prev) => prev.filter((a) => a.id !== id));
    },
    [slug]
  );

  const updateBarberConfig = useCallback(
    async (config: Partial<BarberConfig>) => {
      if (!slug) throw new Error('Barbero no disponible');
      const newConfig = {
        working_start_time: config.startTime ?? barberConfig.startTime,
        working_end_time: config.endTime ?? barberConfig.endTime,
        appointment_duration_minutes: config.slotDuration ?? barberConfig.slotDuration,
        working_days: config.workingDays ?? barberConfig.workingDays,
      };
      await apiUpdateBarberConfig(slug, newConfig);
      await refetchBarberData();
    },
    [slug, barberConfig, refetchBarberData]
  );

  const blockDate = useCallback(
    async (date: string) => {
      if (!slug) throw new Error('Barbero no disponible');
      await apiBlockDate(slug, date);
      setBarberConfig((prev) => ({
        ...prev,
        blockedDates: [...prev.blockedDates, date],
      }));
      setAppointments((prev) => prev.filter((a) => a.date !== date));
    },
    [slug]
  );

  const unblockDate = useCallback(
    async (date: string) => {
      if (!slug) throw new Error('Barbero no disponible');
      await apiUnblockDate(slug, date);
      setBarberConfig((prev) => ({
        ...prev,
        blockedDates: prev.blockedDates.filter((d) => d !== date),
      }));
    },
    [slug]
  );

  const clearAllBlockedDates = useCallback(async () => {
    if (!slug) throw new Error('Barbero no disponible');
    await apiClearAllBlockedDates(slug);
    setBarberConfig((prev) => ({ ...prev, blockedDates: [] }));
  }, [slug]);

  const clearAllReservations = useCallback(async () => {
    if (!slug) throw new Error('Barbero no disponible');
    await apiClearAllReservations(slug);
    setAppointments([]);
  }, [slug]);

  const authenticateBarber = useCallback(async (email: string, password: string): Promise<boolean> => {
    try {
      const { token } = await apiLogin(email, password);
      setToken(token);
      setIsBarberAuthenticated(true);
      return true;
    } catch {
      return false;
    }
  }, []);

  const logoutBarber = useCallback(() => {
    clearToken();
    setIsBarberAuthenticated(false);
  }, []);

  return (
    <AppContext.Provider
      value={{
        appointments,
        barberConfig,
        isBarberAuthenticated,
        isLoadingBarberData,
        barberDataError,
        addAppointment,
        deleteReservation,
        updateBarberConfig,
        blockDate,
        unblockDate,
        clearAllBlockedDates,
        clearAllReservations,
        authenticateBarber,
        logoutBarber,
        getTimeSlotsForDate,
        refetchBarberData,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
}
