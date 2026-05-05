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
  blockSlot as apiBlockSlot,
  unblockSlot as apiUnblockSlot,
  createReservation,
  deleteReservation as apiDeleteReservation,
  clearAllReservations as apiClearAllReservations,
  type ApiReservation,
} from '@/lib/barberApiClient';
import { getSupabaseBrowser } from '@/lib/supabase';

interface AppContextType {
  slug: string;
  displayName: string;
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
  blockSlot: (date: string, time: string) => Promise<void>;
  unblockSlot: (date: string, time: string) => Promise<void>;
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
  blockedSlots: [],
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

  const start = toHHmm(schedule.working_start_time ?? '');
  const end = toHHmm(schedule.working_end_time ?? '');
  const hasValidSchedule = start.length === 5 && end.length === 5 && start < end;
  const isConfigured = schedule.is_configured === true || (hasValidSchedule && (schedule.working_days?.length ?? 0) > 0);

  return {
    startTime: start || defaultBarberConfig.startTime,
    endTime: end || defaultBarberConfig.endTime,
    slotDuration: (schedule.appointment_duration_minutes === 60 ? 60 : 30) as 30 | 60,
    workingDays: schedule.working_days ?? [],
    blockedDates: (api.blocked_dates ?? []).map((d) => d.date),
    blockedSlots: (api.blocked_slots ?? []).map((s) => `${s.date} ${s.time}`),
    isConfigured,
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

/** Decodifica el payload de un JWT sin verificar la firma (sólo lectura de claims). */
function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    return JSON.parse(atob(token.split('.')[1]));
  } catch {
    return null;
  }
}

export function AppProvider({ children, slug }: { children: ReactNode; slug: string }) {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [barberId, setBarberId] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState<string>('');
  const [barberConfig, setBarberConfig] = useState<BarberConfig>(defaultBarberConfig);
  const [isBarberAuthenticated, setIsBarberAuthenticated] = useState(() => {
    const token = getToken();
    if (!token) return false;
    // Verificar que el token pertenece al slug de esta URL; si no, descartarlo.
    const payload = decodeJwtPayload(token);
    if (!payload || payload.slug !== slug) {
      clearToken();
      return false;
    }
    return true;
  });
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
      setDisplayName(data.display_name ?? '');
      setBarberId(data.id);
      setBarberConfig(mapApiToBarberConfig(data));
      setAppointments(mapApiReservationsToAppointments(data.reservations));
    } catch (e) {
      setBarberDataError(e instanceof Error ? e.message : 'Error al cargar datos');
    } finally {
      setIsLoadingBarberData(false);
    }
  }, [slug]);

  // Refresco silencioso: actualiza datos sin activar el spinner de carga
  const silentRefetch = useCallback(async () => {
    if (!slug) return;
    try {
      const data = await apiFetchBarberData(slug);
      setBarberConfig(mapApiToBarberConfig(data));
      setAppointments(mapApiReservationsToAppointments(data.reservations));
    } catch {
      // silencioso
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

  // Tiempo real: suscripción Supabase Realtime filtrada por barbero
  useEffect(() => {
    if (!barberId) return;
    let realtimeActive = false;

    let supabase: ReturnType<typeof getSupabaseBrowser> | null = null;
    let channel: ReturnType<ReturnType<typeof getSupabaseBrowser>['channel']> | null = null;

    try {
      supabase = getSupabaseBrowser();
      channel = supabase
        .channel(`reservations:${barberId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'reservations',
            filter: `barber_id=eq.${barberId}`,
          },
          (payload) => {
            realtimeActive = true;
            if (payload.eventType === 'INSERT') {
              const r = payload.new as ApiReservation;
              setAppointments((prev) => {
                if (prev.some((a) => a.id === r.id)) return prev;
                return [
                  ...prev,
                  {
                    id: r.id,
                    date: r.date,
                    timeSlot: toHHmm(r.time),
                    clientName: r.client_name,
                    clientPhone: r.client_phone ?? '',
                    clientEmail: r.client_email ?? '',
                  },
                ];
              });
            } else if (payload.eventType === 'DELETE') {
              const r = payload.old as { id: string };
              setAppointments((prev) => prev.filter((a) => a.id !== r.id));
            } else if (payload.eventType === 'UPDATE') {
              const r = payload.new as ApiReservation;
              setAppointments((prev) =>
                prev.map((a) =>
                  a.id === r.id
                    ? {
                        id: r.id,
                        date: r.date,
                        timeSlot: toHHmm(r.time),
                        clientName: r.client_name,
                        clientPhone: r.client_phone ?? '',
                        clientEmail: r.client_email ?? '',
                      }
                    : a
                )
              );
            }
          }
        )
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            realtimeActive = true;
          }
        });
    } catch {
      // NEXT_PUBLIC_SUPABASE_ANON_KEY no configurado — solo polling
    }

    // Polling cada 5 segundos como fallback al realtime (sin spinner)
    const interval = setInterval(() => {
      if (!realtimeActive) {
        silentRefetch();
      }
    }, 5000);

    return () => {
      clearInterval(interval);
      if (supabase && channel) supabase.removeChannel(channel);
    };
  }, [barberId, silentRefetch]);

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
        const blocked = barberConfig.blockedSlots.includes(`${date} ${time}`);
        return {
          time,
          available: !appointment && !blocked,
          blocked,
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
      const putResponse = await apiUpdateBarberConfig(slug, newConfig);
      // Refetch para reservas y blocked_dates; en producción el GET puede venir en caché
      const fresh = await apiFetchBarberData(slug, true);
      const baseMapped = mapApiToBarberConfig(fresh);
      // Prioridad al schedule devuelto por el PUT para no depender del GET en producción
      const finalConfig = putResponse?.schedule
        ? mapApiToBarberConfig({ ...fresh, schedule: putResponse.schedule })
        : baseMapped;
      setBarberConfig(finalConfig);
      setAppointments(mapApiReservationsToAppointments(fresh.reservations));
    },
    [slug, barberConfig]
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

  const blockSlot = useCallback(
    async (date: string, time: string) => {
      if (!slug) throw new Error('Barbero no disponible');
      await apiBlockSlot(slug, date, time);
      setBarberConfig((prev) => ({
        ...prev,
        blockedSlots: [...prev.blockedSlots, `${date} ${time}`],
      }));
    },
    [slug]
  );

  const unblockSlot = useCallback(
    async (date: string, time: string) => {
      if (!slug) throw new Error('Barbero no disponible');
      await apiUnblockSlot(slug, date, time);
      setBarberConfig((prev) => ({
        ...prev,
        blockedSlots: prev.blockedSlots.filter((s) => s !== `${date} ${time}`),
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
      // Verificar que el token pertenece al slug de esta URL.
      const payload = decodeJwtPayload(token);
      const tokenSlug = payload?.slug as string | undefined;
      if (tokenSlug && tokenSlug !== slug) {
        // El barbero inició sesión desde la URL de otro barbero → redirigir a la suya.
        const domain = process.env.NEXT_PUBLIC_BARBER_DOMAIN ?? 'tubarber.com';
        window.location.href = `https://${tokenSlug}.${domain}/acceso`;
        return false;
      }
      setToken(token);
      setIsBarberAuthenticated(true);
      // Recargar datos para mostrar la agenda del barbero autenticado, no la del slug de URL.
      await refetchBarberData();
      return true;
    } catch {
      return false;
    }
  }, [slug, refetchBarberData]);

  const logoutBarber = useCallback(() => {
    clearToken();
    setIsBarberAuthenticated(false);
    setDisplayName('');
    setAppointments([]);
    setBarberConfig(defaultBarberConfig);
    setBarberDataError(null);
  }, []);

  return (
    <AppContext.Provider
      value={{
        slug,
        displayName,
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
        blockSlot,
        unblockSlot,
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
