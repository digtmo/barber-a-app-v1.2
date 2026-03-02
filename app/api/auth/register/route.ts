import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { supabaseAdmin } from "@/lib/supabase";
import { signBarberToken } from "@/lib/jwt";

const SLUG_REGEX = /^[a-z0-9-]+$/;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { slug, display_name, email, password } = body;

    if (!slug || !display_name || !email || !password) {
      return NextResponse.json(
        { error: "Faltan slug, display_name, email o password" },
        { status: 400 }
      );
    }

    if (!SLUG_REGEX.test(slug)) {
      return NextResponse.json(
        { error: "El slug solo puede tener letras minúsculas, números y guiones" },
        { status: 400 }
      );
    }

    const [{ data: existingSlug }, { data: existingEmail }] = await Promise.all([
      supabaseAdmin.from("barbers").select("id").eq("slug", slug).maybeSingle(),
      supabaseAdmin.from("barbers").select("id").eq("email", email).maybeSingle(),
    ]);

    if (existingSlug) {
      return NextResponse.json({ error: "El slug ya está tomado" }, { status: 409 });
    }
    if (existingEmail) {
      return NextResponse.json({ error: "El email ya está registrado" }, { status: 409 });
    }

    const password_hash = await bcrypt.hash(password, 10);

    const { data: barber, error: barberError } = await supabaseAdmin
      .from("barbers")
      .insert({ slug, display_name, email, password_hash })
      .select("id")
      .single();

    if (barberError || !barber) {
      return NextResponse.json(
        { error: barberError?.message ?? "Error al crear barbero" },
        { status: 500 }
      );
    }

    const trialEnd = new Date();
    trialEnd.setDate(trialEnd.getDate() + 14);

    const [{ error: scheduleError }, { error: subError }] = await Promise.all([
      supabaseAdmin.from("barber_schedule").insert({
        barber_id: barber.id,
        working_start_time: "09:00",
        working_end_time: "18:00",
        appointment_duration_minutes: 30,
        working_days: [1, 2, 3, 4, 5],
        is_configured: false,
      }),
      supabaseAdmin.from("subscriptions").insert({
        barber_id: barber.id,
        plan: "trial",
        status: "trialing",
        trial_end_date: trialEnd.toISOString().split("T")[0],
      }),
    ]);

    if (scheduleError || subError) {
      await supabaseAdmin.from("barbers").delete().eq("id", barber.id);
      return NextResponse.json(
        { error: scheduleError?.message ?? subError?.message ?? "Error al crear datos" },
        { status: 500 }
      );
    }

    const token = signBarberToken({ barberId: barber.id, slug });
    return NextResponse.json({ token });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Error en el servidor" },
      { status: 500 }
    );
  }
}
