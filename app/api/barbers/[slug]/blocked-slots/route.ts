import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { checkSubscription } from "@/lib/check-subscription";

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const TIME_REGEX = /^\d{2}:\d{2}$/;

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

    const sub = await checkSubscription(barber.id);
    if (!sub.ok) {
      return NextResponse.json({ error: "Suscripción no activa" }, { status: 402 });
    }

    const body = await request.json();
    const { date, time } = body;
    if (!date || !DATE_REGEX.test(date)) {
      return NextResponse.json({ error: "date inválido (use YYYY-MM-DD)" }, { status: 400 });
    }
    if (!time || !TIME_REGEX.test(time)) {
      return NextResponse.json({ error: "time inválido (use HH:mm)" }, { status: 400 });
    }

    await supabaseAdmin.from("blocked_slots").upsert(
      { barber_id: barber.id, date, time },
      { onConflict: "barber_id,date,time" }
    );

    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Error en el servidor" },
      { status: 500 }
    );
  }
}
