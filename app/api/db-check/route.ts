import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

/**
 * GET /api/db-check — Verifica conexión a Supabase.
 * No usar en producción o proteger la ruta.
 */
export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from("barbers")
      .select("id")
      .limit(1);

    if (error) {
      return NextResponse.json(
        { connected: false, error: error.message, code: error.code },
        { status: 502 }
      );
    }

    return NextResponse.json({
      connected: true,
      message: "Conexión a Supabase correcta",
      barbersCount: data?.length ?? 0,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Error desconocido";
    return NextResponse.json(
      { connected: false, error: message },
      { status: 502 }
    );
  }
}
