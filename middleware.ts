import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyBarberTokenEdge } from "@/lib/jwt-edge";

const BARBER_DOMAIN = process.env.BARBER_DOMAIN ?? "barber.com";

export async function middleware(request: NextRequest) {
  const url = request.nextUrl.clone();
  const pathname = url.pathname;

  // ——— Rutas públicas API: no bloquear ———
  if (pathname.startsWith("/api/auth/") || pathname.startsWith("/api/webhooks/")) {
    return NextResponse.next();
  }

  const host = request.headers.get("host") ?? "";
  let slug: string | null = null;

  if (host.includes("localhost") || host.startsWith("127.0.0.1")) {
    // Desarrollo: slug desde path (/dani, /dani/acceso o /api/barbers/dani/...)
    const pathSlug = pathname.match(/^\/([^/]+)/)?.[1];
    if (pathSlug && pathSlug !== "acceso" && pathSlug !== "api") {
      slug = pathSlug;
    }
  } else {
    // Producción: subdominio (dani.barber.com -> dani). barber.com o www.barber.com no tienen slug.
    const rootDomain = host === BARBER_DOMAIN || host === "www." + BARBER_DOMAIN;
    if (!rootDomain && host.endsWith("." + BARBER_DOMAIN)) {
      const subdomain = host.slice(0, host.indexOf("."));
      if (subdomain && subdomain !== "www") slug = subdomain;
    }
  }

  // ——— Rewrite: subdominio → path (solo en producción con subdominio) ———
  if (slug && !host.includes("localhost")) {
    if (pathname === "/") {
      url.pathname = `/${slug}`;
      return NextResponse.rewrite(url);
    }
    if (pathname === "/acceso") {
      url.pathname = `/${slug}/acceso`;
      return NextResponse.rewrite(url);
    }
  }

  const requestHeaders = new Headers(request.headers);
  if (slug) {
    requestHeaders.set("x-barber-slug", slug);
  }

  // ——— API barberos: verificación JWT ———
  const barberApiMatch = pathname.match(/^\/api\/barbers\/([^/]+)/);
  if (barberApiMatch) {
    const routeSlug = barberApiMatch[1];
    if (request.method === "GET" && pathname === `/api/barbers/${routeSlug}`) {
      return NextResponse.next({ request: { headers: requestHeaders } });
    }
    if (request.method === "POST" && pathname === `/api/barbers/${routeSlug}/reservations`) {
      return NextResponse.next({ request: { headers: requestHeaders } });
    }
    const authHeader = request.headers.get("authorization");
    const token = authHeader?.replace(/^Bearer\s+/i, "");
    if (!token) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
    const payload = await verifyBarberTokenEdge(token);
    if (!payload || payload.slug !== routeSlug) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
  }

  return NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = {
  matcher: [
    "/",
    "/acceso",
    "/:slug",
    "/:slug/acceso",
    "/api/barbers/:path*",
    "/api/auth/:path*",
    "/api/webhooks/:path*",
  ],
};
