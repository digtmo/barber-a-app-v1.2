/**
 * Cliente para la API REST del backend (mismo origen).
 * El slug se pasa desde la ruta app/[slug].
 */

const TOKEN_KEY = 'barber_token';

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

export interface ApiSchedule {
  id?: string;
  barber_id?: string;
  working_start_time: string;
  working_end_time: string;
  appointment_duration_minutes: number;
  working_days: number[];
  is_configured: boolean;
}

export interface ApiBlockedDate {
  date: string;
}

export interface ApiReservation {
  id: string;
  barber_id: string;
  date: string;
  time: string;
  duration_minutes?: number;
  client_name: string;
  client_phone: string | null;
  client_email: string | null;
  created_at?: string;
}

export interface ApiBarberData {
  id: string;
  slug: string;
  display_name: string;
  email: string;
  schedule: ApiSchedule | null;
  blocked_dates: ApiBlockedDate[];
  reservations: ApiReservation[];
}

export async function fetchBarberData(slug: string): Promise<ApiBarberData> {
  const res = await fetch(`/api/barbers/${encodeURIComponent(slug)}`, {
    cache: 'no-store',
    headers: { 'Cache-Control': 'no-cache', Pragma: 'no-cache' },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { error?: string }).error || `Error ${res.status}`);
  }
  return res.json();
}

export async function login(email: string, password: string): Promise<{ token: string }> {
  const res = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error((data as { error?: string }).error || 'Error al iniciar sesión');
  }
  return data as { token: string };
}

export async function updateBarberConfig(
  slug: string,
  config: {
    working_start_time: string;
    working_end_time: string;
    appointment_duration_minutes: number;
    working_days: number[];
  }
): Promise<void> {
  const token = getToken();
  if (!token) throw new Error('No autorizado');
  const res = await fetch(`/api/barbers/${encodeURIComponent(slug)}/config`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(config),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (res.status === 402) throw new Error('Suscripción no activa');
    throw new Error((data as { error?: string }).error || `Error ${res.status}`);
  }
}

export async function blockDate(slug: string, date: string): Promise<void> {
  const token = getToken();
  if (!token) throw new Error('No autorizado');
  const res = await fetch(`/api/barbers/${encodeURIComponent(slug)}/blocked-dates`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ date }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (res.status === 402) throw new Error('Suscripción no activa');
    throw new Error((data as { error?: string }).error || `Error ${res.status}`);
  }
}

export async function unblockDate(slug: string, date: string): Promise<void> {
  const token = getToken();
  if (!token) throw new Error('No autorizado');
  const res = await fetch(
    `/api/barbers/${encodeURIComponent(slug)}/blocked-dates/${encodeURIComponent(date)}`,
    {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    }
  );
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (res.status === 402) throw new Error('Suscripción no activa');
    throw new Error((data as { error?: string }).error || `Error ${res.status}`);
  }
}

/** Elimina todas las fechas bloqueadas del barbero. */
export async function clearAllBlockedDates(slug: string): Promise<void> {
  const token = getToken();
  if (!token) throw new Error('No autorizado');
  const res = await fetch(
    `/api/barbers/${encodeURIComponent(slug)}/blocked-dates`,
    {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    }
  );
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (res.status === 402) throw new Error('Suscripción no activa');
    throw new Error((data as { error?: string }).error || `Error ${res.status}`);
  }
}

export async function createReservation(
  slug: string,
  data: {
    date: string;
    time: string;
    client_name: string;
    client_phone?: string;
    client_email?: string;
  }
): Promise<ApiReservation> {
  const res = await fetch(`/api/barbers/${encodeURIComponent(slug)}/reservations`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      date: data.date,
      time: data.time,
      client_name: data.client_name,
      client_phone: data.client_phone || null,
      client_email: data.client_email || null,
    }),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error((json as { error?: string }).error || 'Error al crear la reserva');
  }
  return json as ApiReservation;
}

export async function deleteReservation(slug: string, reservationId: string): Promise<void> {
  const token = getToken();
  if (!token) throw new Error('No autorizado');
  const res = await fetch(
    `/api/barbers/${encodeURIComponent(slug)}/reservations/${encodeURIComponent(reservationId)}`,
    {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    }
  );
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (res.status === 402) throw new Error('Suscripción no activa');
    throw new Error((data as { error?: string }).error || `Error ${res.status}`);
  }
}

/** Elimina todas las reservas del barbero. */
export async function clearAllReservations(slug: string): Promise<void> {
  const token = getToken();
  if (!token) throw new Error('No autorizado');
  const res = await fetch(
    `/api/barbers/${encodeURIComponent(slug)}/reservations`,
    {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    }
  );
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (res.status === 402) throw new Error('Suscripción no activa');
    throw new Error((data as { error?: string }).error || `Error ${res.status}`);
  }
}
