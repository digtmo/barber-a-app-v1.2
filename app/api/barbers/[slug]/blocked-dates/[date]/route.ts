import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { checkSubscription } from "@/lib/check-subscription";

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string; date: string }> }
) {
  try {
    const { slug, date } = await params;
    if (!DATE_REGEX.test(date)) {
      return NextResponse.json(
        { error: "date inválido (use YYYY-MM-DD)" },
        { status: 400 }
      );
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

    await supabaseAdmin
      .from("blocked_dates")
      .delete()
      .eq("barber_id", barber.id)
      .eq("date", date);

    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Error en el servidor" },
      { status: 500 }
    );
  }
}
