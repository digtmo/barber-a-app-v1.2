import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyBarberTokenEdge } from "@/lib/jwt-edge";

const BARBER_DOMAIN = process.env.BARBER_DOMAIN ?? "tubarber.com";

export async function middleware(request: NextRequest) {
  const url = request.nextUrl.clone();
  const pathname = url.pathname;

  // ——— Rutas públicas API: no bloquear ———
  if (pathname.startsWith("/api/auth/") || pathname.startsWith("/api/webhooks/")) {
    return NextResponse.next();
  }

  const host = (request.headers.get("host") ?? "").toLowerCase();
  let slug: string | null = null;

  if (host.includes("localhost") || host.startsWith("127.0.0.1")) {
    // Desarrollo: slug desde path (/dani, /dani/acceso)
    const pathSlug = pathname.match(/^\/([^/]+)/)?.[1];
    if (pathSlug && !["acceso", "registro", "api"].includes(pathSlug)) {
      slug = pathSlug;
    }
  } else {
    const isRoot = host === BARBER_DOMAIN || host === "www." + BARBER_DOMAIN;

    // ——— Redirigir path → subdominio: tubarber.com/dani o www.tubarber.com/dani → dani.tubarber.com ———
    if (isRoot && pathname.startsWith("/")) {
      const pathSlug = pathname.match(/^\/([^/]+)/)?.[1];
      const rest = pathSlug ? pathname.slice(1 + pathSlug.length) : ""; // "" o "/acceso"
      if (pathSlug && !["acceso", "registro", "api", ""].includes(pathSlug)) {
        const target = `https://${pathSlug}.${BARBER_DOMAIN}${rest || ""}`;
        return NextResponse.redirect(target, 307);
      }
    }

    // Producción: subdominio dani.tubarber.com o www.dani.tubarber.com → slug = dani
    const domainEscaped = BARBER_DOMAIN.replace(".", "\\.");
    const subdomainMatch = host.match(new RegExp(`^(.+)\\.${domainEscaped}$`));
    if (subdomainMatch) {
      const part = subdomainMatch[1];
      if (part !== "www") {
        slug = part.startsWith("www.") ? part.slice(4) : part;
        if (!slug) slug = null;
      }
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
    "/registro",
    "/:slug",
    "/:slug/acceso",
    "/api/barbers/:path*",
    "/api/auth/:path*",
    "/api/webhooks/:path*",
  ],
};
