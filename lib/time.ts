/**
 * Utilidades para horarios, slots y solapamientos.
 */

export interface TimeSlot {
  start: string; // HH:mm
  end: string;   // HH:mm
}

/** Normaliza tiempo a HH:mm (quita segundos si vienen de BD o input). */
function toHHmm(t: string): string {
  if (!t || typeof t !== "string") return "";
  const parts = t.trim().split(":");
  const h = parts[0] ?? "0";
  const m = (parts[1] ?? "0").slice(0, 2);
  return `${h.padStart(2, "0")}:${m.padStart(2, "0")}`;
}

/**
 * Valida que working_start_time y working_end_time formen un rango válido
 * (start < end). Acepta HH:mm o HH:mm:ss.
 */
export function isValidWorkingRange(
  workingStartTime: string,
  workingEndTime: string
): boolean {
  const start = toHHmm(workingStartTime);
  const end = toHHmm(workingEndTime);
  const regex = /^([01]?\d|2[0-3]):[0-5]\d$/;
  if (!regex.test(start) || !regex.test(end)) {
    return false;
  }
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  const startMins = sh * 60 + sm;
  const endMins = eh * 60 + em;
  return startMins < endMins;
}

/**
 * Genera slots de duración fija entre start y end.
 * workingDays: array de 0-6 (0 = domingo).
 */
export function buildSlotsByDuration(
  workingStartTime: string,
  workingEndTime: string,
  durationMinutes: number,
  date?: string
): TimeSlot[] {
  if (!isValidWorkingRange(workingStartTime, workingEndTime) || durationMinutes <= 0) {
    return [];
  }
  const [sh, sm] = workingStartTime.split(":").map(Number);
  const [eh, em] = workingEndTime.split(":").map(Number);
  let startMins = sh * 60 + sm;
  const endMins = eh * 60 + em;
  const slots: TimeSlot[] = [];
  while (startMins + durationMinutes <= endMins) {
    const endSlotMins = startMins + durationMinutes;
    const startStr = `${String(Math.floor(startMins / 60)).padStart(2, "0")}:${String(startMins % 60).padStart(2, "0")}`;
    const endStr = `${String(Math.floor(endSlotMins / 60)).padStart(2, "0")}:${String(endSlotMins % 60).padStart(2, "0")}`;
    slots.push({ start: startStr, end: endStr });
    startMins = endSlotMins;
  }
  return slots;
}

/**
 * Comprueba si el intervalo (time, time + durationMinutes) se solapa
 * con algún intervalo en existingSlots (cada uno con start, end en HH:mm).
 */
export function hasOverlap(
  time: string,
  durationMinutes: number,
  existingSlots: { start: string; end: string }[]
): boolean {
  const [th, tm] = time.split(":").map(Number);
  let startMins = th * 60 + tm;
  const endMins = startMins + durationMinutes;
  for (const slot of existingSlots) {
    const [sh, sm] = slot.start.split(":").map(Number);
    const [eh, em] = slot.end.split(":").map(Number);
    const slotStart = sh * 60 + sm;
    const slotEnd = eh * 60 + em;
    if (startMins < slotEnd && endMins > slotStart) {
      return true;
    }
  }
  return false;
}
