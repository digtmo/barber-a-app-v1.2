import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { checkSubscription } from "@/lib/check-subscription";
import { isValidWorkingRange, buildSlotsByDuration } from "@/lib/time";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const authHeader = request.headers.get("authorization");
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

    const sub = await checkSubscription(barber.id);
    if (!sub.ok) {
      return NextResponse.json(
        { error: "Suscripción no activa" },
        { status: 402 }
      );
    }

    const body = await request.json();
    let {
      working_start_time,
      working_end_time,
      appointment_duration_minutes,
      working_days,
    } = body;

    if (
      working_start_time == null ||
      working_end_time == null ||
      appointment_duration_minutes == null ||
      working_days == null
    ) {
      return NextResponse.json(
        { error: "Faltan working_start_time, working_end_time, appointment_duration_minutes o working_days" },
        { status: 400 }
      );
    }

    // Normalizar a HH:mm (el input type="time" puede enviar "09:00" o la BD devolver "09:00:00")
    working_start_time = String(working_start_time).slice(0, 5);
    working_end_time = String(working_end_time).slice(0, 5);

    if (
      !isValidWorkingRange(working_start_time, working_end_time)
    ) {
      return NextResponse.json(
        { error: "Rango de horario inválido" },
        { status: 400 }
      );
    }

    const { data: schedule } = await supabaseAdmin
      .from("barber_schedule")
      .select("id")
      .eq("barber_id", barber.id)
      .maybeSingle();
    if (!schedule) {
      return NextResponse.json({ error: "Horario no encontrado" }, { status: 404 });
    }

    const { error: updateError } = await supabaseAdmin
      .from("barber_schedule")
      .update({
        working_start_time,
        working_end_time,
        appointment_duration_minutes: Number(appointment_duration_minutes),
        working_days: Array.isArray(working_days) ? working_days : [],
        is_configured: true,
      })
      .eq("id", schedule.id);

    if (updateError) {
      return NextResponse.json(
        { error: updateError.message },
        { status: 500 }
      );
    }

    // Eliminar reservas fuera del nuevo horario
    const { data: reservations } = await supabaseAdmin
      .from("reservations")
      .select("id, date, time, duration_minutes")
      .eq("barber_id", barber.id);

    const slots = buildSlotsByDuration(
      working_start_time,
      working_end_time,
      Number(appointment_duration_minutes)
    );
    const validStarts = new Set(slots.map((s) => s.start));

    if (reservations?.length) {
      const toDelete: string[] = [];
      for (const r of reservations) {
        const timeNorm = String(r.time).slice(0, 5);
        if (!validStarts.has(timeNorm)) {
          toDelete.push(r.id);
        }
      }
      if (toDelete.length > 0) {
        await supabaseAdmin.from("reservations").delete().in("id", toDelete);
      }
    }

    return NextResponse.json(
      { ok: true },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate",
          Pragma: "no-cache",
        },
      }
    );
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Error en el servidor" },
      { status: 500 }
    );
  }
}
