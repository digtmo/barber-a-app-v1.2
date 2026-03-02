import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { supabaseAdmin } from "@/lib/supabase";

const TEST_PASSWORD = "test1234";

/**
 * POST /api/seed — Inserta datos de prueba. Solo en desarrollo.
 */
export async function POST() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Seed no disponible en producción" }, { status: 403 });
  }

  try {
    const password_hash = await bcrypt.hash(TEST_PASSWORD, 10);

    // 1. Barbero Dani
    const { data: dani, error: errDani } = await supabaseAdmin
      .from("barbers")
      .insert({
        slug: "dani",
        display_name: "Daniel",
        email: "dani@barber.com",
        password_hash,
      })
      .select("id")
      .single();

    if (errDani) {
      if (errDani.code === "23505") {
        return NextResponse.json({
          message: "Los datos de prueba ya existen. Barbero 'dani' o 'carlos' ya está registrado.",
          hint: "Puedes hacer login con dani@barber.com / test1234 o carlos@barber.com / test1234",
        });
      }
      throw errDani;
    }

    const trialEnd = new Date();
    trialEnd.setDate(trialEnd.getDate() + 14);

    await Promise.all([
      supabaseAdmin.from("barber_schedule").insert({
        barber_id: dani.id,
        working_start_time: "09:00",
        working_end_time: "18:00",
        appointment_duration_minutes: 30,
        working_days: [1, 2, 3, 4, 5],
        is_configured: true,
      }),
      supabaseAdmin.from("subscriptions").insert({
        barber_id: dani.id,
        plan: "trial",
        status: "trialing",
        trial_end_date: trialEnd.toISOString().split("T")[0],
      }),
    ]);

    // 2. Barbero Carlos
    const { data: carlos, error: errCarlos } = await supabaseAdmin
      .from("barbers")
      .insert({
        slug: "carlos",
        display_name: "Carlos",
        email: "carlos@barber.com",
        password_hash,
      })
      .select("id")
      .single();

    if (errCarlos) throw errCarlos;

    await Promise.all([
      supabaseAdmin.from("barber_schedule").insert({
        barber_id: carlos.id,
        working_start_time: "10:00",
        working_end_time: "19:00",
        appointment_duration_minutes: 45,
        working_days: [1, 2, 3, 4, 5, 6],
        is_configured: false,
      }),
      supabaseAdmin.from("subscriptions").insert({
        barber_id: carlos.id,
        plan: "trial",
        status: "trialing",
        trial_end_date: trialEnd.toISOString().split("T")[0],
      }),
    ]);

    return NextResponse.json({
      message: "Datos de prueba insertados correctamente",
      barbers: [
        { slug: "dani", email: "dani@barber.com", password: TEST_PASSWORD },
        { slug: "carlos", email: "carlos@barber.com", password: TEST_PASSWORD },
      ],
      hint: "Login en /api/auth/login con email y password. GET /api/barbers/dani para ver agenda.",
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Error al insertar datos";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
