import { createClient, SupabaseClient } from "@supabase/supabase-js";

let _admin: SupabaseClient | null = null;

function getSupabaseAdmin(): SupabaseClient {
  if (_admin) return _admin;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error(
      "Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en las variables de entorno"
    );
  }
  _admin = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
  return _admin;
}

/**
 * Cliente Supabase con service_role. Solo usar en el servidor.
 * Nunca exponer este cliente al cliente.
 */
export const supabaseAdmin = new Proxy({} as SupabaseClient, {
  get(_, prop) {
    return (getSupabaseAdmin() as unknown as Record<string | symbol, unknown>)[prop];
  },
});

let _browser: SupabaseClient | null = null;

/**
 * Cliente Supabase con anon key para usar en el navegador.
 * Requiere NEXT_PUBLIC_SUPABASE_ANON_KEY.
 * Usado para suscripciones Realtime.
 */
export function getSupabaseBrowser(): SupabaseClient {
  if (_browser) return _browser;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    throw new Error("Faltan NEXT_PUBLIC_SUPABASE_URL o NEXT_PUBLIC_SUPABASE_ANON_KEY");
  }
  _browser = createClient(url, anonKey);
  return _browser;
}
