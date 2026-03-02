import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { buildSlotsByDuration, hasOverlap } from "@/lib/time";

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const TIME_REGEX = /^([01]?\d|2[0-3]):[0-5]\d$/;

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const { data: barber } = await supabaseAdmin
      .from("barbers")
      .select("id")
      .eq("slug", slug)
      .maybeSingle();
    if (!barber) {
      return NextResponse.json({ error: "Barbero no encontrado" }, { status: 404 });
    }

    const { data: schedule } = await supabaseAdmin
      .from("barber_schedule")
      .select("working_start_time, working_end_time, appointment_duration_minutes, working_days, is_configured")
      .eq("barber_id", barber.id)
      .maybeSingle();

    if (!schedule || !schedule.is_configured) {
      return NextResponse.json(
        { error: "El barbero no tiene horario configurado" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { date, time, client_name, client_phone, client_email } = body;

    if (!date || !DATE_REGEX.test(date)) {
      return NextResponse.json(
        { error: "date inválido (use YYYY-MM-DD)" },
        { status: 400 }
      );
    }
    if (!time || !TIME_REGEX.test(time)) {
      return NextResponse.json(
        { error: "time inválido (use HH:mm)" },
        { status: 400 }
      );
    }
    if (!client_name?.trim()) {
      return NextResponse.json(
        { error: "client_name es requerido" },
        { status: 400 }
      );
    }

    const dayOfWeek = new Date(date + "T12:00:00").getDay();
    const workingDays = (schedule.working_days as number[]) ?? [];
    if (!workingDays.includes(dayOfWeek)) {
      return NextResponse.json(
        { error: "Ese día no hay disponibilidad" },
        { status: 400 }
      );
    }

    const { data: blocked } = await supabaseAdmin
      .from("blocked_dates")
      .select("id")
      .eq("barber_id", barber.id)
      .eq("date", date)
      .maybeSingle();
    if (blocked) {
      return NextResponse.json(
        { error: "Ese día está bloqueado" },
        { status: 400 }
      );
    }

    const slots = buildSlotsByDuration(
      schedule.working_start_time,
      schedule.working_end_time,
      schedule.appointment_duration_minutes
    );
    const validStarts = new Set(slots.map((s) => s.start));
    if (!validStarts.has(time)) {
      return NextResponse.json(
        { error: "El horario no es un slot válido" },
        { status: 400 }
      );
    }

    const { data: existing } = await supabaseAdmin
      .from("reservations")
      .select("time, duration_minutes")
      .eq("barber_id", barber.id)
      .eq("date", date);

    const existingSlots = (existing ?? []).map((r) => ({
      start: r.time,
      end: formatEndTime(r.time, r.duration_minutes),
    }));

    if (hasOverlap(time, schedule.appointment_duration_minutes, existingSlots)) {
      return NextResponse.json(
        { error: "El horario ya está ocupado" },
        { status: 409 }
      );
    }

    const { data: reservation, error: insertError } = await supabaseAdmin
      .from("reservations")
      .insert({
        barber_id: barber.id,
        date,
        time,
        duration_minutes: schedule.appointment_duration_minutes,
        client_name: (client_name as string).trim(),
        client_phone: (client_phone as string)?.trim() ?? null,
        client_email: (client_email as string)?.trim() ?? null,
      })
      .select("id, date, time, client_name, client_phone, client_email")
      .single();

    if (insertError) {
      return NextResponse.json(
        { error: insertError.message },
        { status: 500 }
      );
    }

    return NextResponse.json(reservation);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Error en el servidor" },
      { status: 500 }
    );
  }
}

function formatEndTime(start: string, durationMinutes: number): string {
  const [h, m] = start.split(":").map(Number);
  const totalMins = h * 60 + m + durationMinutes;
  const eh = Math.floor(totalMins / 60) % 24;
  const em = totalMins % 60;
  return `${String(eh).padStart(2, "0")}:${String(em).padStart(2, "0")}`;
}

/** DELETE: elimina todas las reservas del barbero (requiere auth). Útil para limpiar datos de prueba. */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const authHeader = _request.headers.get("authorization");
    const token = authHeader?.replace(/^Bearer\s+/i, "");
    if (!token) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { data: barber } = await supabaseAdmin
      .from("barbers")
      .select("id")
      .eq("slug", slug)
      .maybeSingle();
    if (!barber) {
      return NextResponse.json({ error: "Barbero no encontrado" }, { status: 404 });
    }

    await supabaseAdmin
      .from("reservations")
      .delete()
      .eq("barber_id", barber.id);

    return NextResponse.json({ ok: true, message: "Todas las reservas eliminadas" });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Error en el servidor" },
      { status: 500 }
    );
  }
}
