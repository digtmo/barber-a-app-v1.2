import { supabaseAdmin } from "./supabase";

export type SubscriptionCheckResult =
  | { ok: true }
  | { ok: false; status: 402 };

/**
 * Verifica que el barbero tenga suscripción activa (trialing o active).
 * Si no, devuelve { ok: false, status: 402 }.
 */
export async function checkSubscription(
  barberId: string
): Promise<SubscriptionCheckResult> {
  const { data, error } = await supabaseAdmin
    .from("subscriptions")
    .select("status")
    .eq("barber_id", barberId)
    .maybeSingle();

  if (error || !data) {
    return { ok: false, status: 402 };
  }

  if (data.status === "trialing" || data.status === "active") {
    return { ok: true };
  }

  return { ok: false, status: 402 };
}
