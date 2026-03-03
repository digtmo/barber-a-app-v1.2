import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { checkSubscription } from "@/lib/check-subscription";

export async function POST(
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
    const subscription = body?.subscription;
    if (!subscription?.endpoint || !subscription?.keys?.p256dh || !subscription?.keys?.auth) {
      return NextResponse.json(
        { error: "subscription con endpoint y keys (p256dh, auth) son requeridos" },
        { status: 400 }
      );
    }

    const { error } = await supabaseAdmin
      .from("barber_push_subscriptions")
      .upsert(
        {
          barber_id: barber.id,
          endpoint: subscription.endpoint,
          p256dh: subscription.keys.p256dh,
          auth: subscription.keys.auth,
        },
        { onConflict: "barber_id,endpoint", ignoreDuplicates: false }
      );

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Error en el servidor" },
      { status: 500 }
    );
  }
}
