import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const { data: barber, error: barberError } = await supabaseAdmin
      .from("barbers")
      .select("id, slug, display_name, email, created_at")
      .eq("slug", slug)
      .maybeSingle();

    if (barberError || !barber) {
      return NextResponse.json({ error: "Barbero no encontrado" }, { status: 404 });
    }

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    const [
      { data: schedule },
      { data: blockedDates },
      { data: reservations },
    ] = await Promise.all([
      supabaseAdmin
        .from("barber_schedule")
        .select("*")
        .eq("barber_id", barber.id)
        .maybeSingle(),
      supabaseAdmin
        .from("blocked_dates")
        .select("date")
        .eq("barber_id", barber.id)
        .gte("date", startOfMonth.toISOString().split("T")[0])
        .lte("date", endOfMonth.toISOString().split("T")[0]),
      supabaseAdmin
        .from("reservations")
        .select("*")
        .eq("barber_id", barber.id)
        .gte("date", startOfMonth.toISOString().split("T")[0])
        .lte("date", endOfMonth.toISOString().split("T")[0]),
    ]);

    return NextResponse.json(
      {
        ...barber,
        schedule: schedule ?? null,
        blocked_dates: blockedDates ?? [],
        reservations: reservations ?? [],
      },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate',
          Pragma: 'no-cache',
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
