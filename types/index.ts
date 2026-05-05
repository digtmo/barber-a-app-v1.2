export interface Appointment {
  id: string;
  date: string;
  timeSlot: string;
  clientName: string;
  clientPhone: string;
  clientEmail: string;
}

export interface BarberConfig {
  startTime: string;
  endTime: string;
  slotDuration: 30 | 60;
  workingDays: number[];
  blockedDates: string[];
  blockedSlots: string[]; // formato: "YYYY-MM-DD HH:mm"
  isConfigured: boolean;
}

export interface TimeSlot {
  time: string;
  available: boolean;
  blocked: boolean;
  appointment?: Appointment;
}
