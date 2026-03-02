import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { checkSubscription } from "@/lib/check-subscription";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string; id: string }> }
) {
  try {
    const { slug, id } = await params;

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

    const { data: reservation, error: fetchError } = await supabaseAdmin
      .from("reservations")
      .select("id")
      .eq("id", id)
      .eq("barber_id", barber.id)
      .maybeSingle();

    if (fetchError || !reservation) {
      return NextResponse.json({ error: "Reserva no encontrada" }, { status: 404 });
    }

    await supabaseAdmin
      .from("reservations")
      .delete()
      .eq("id", id)
      .eq("barber_id", barber.id);

    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Error en el servidor" },
      { status: 500 }
    );
  }
}
