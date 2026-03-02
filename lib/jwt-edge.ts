/**
 * Verificación JWT compatible con Edge Runtime (middleware).
 * Usar solo en middleware; en API routes usar lib/jwt.ts (jsonwebtoken).
 */
import { jwtVerify } from "jose";

export interface BarberTokenPayload {
  barberId: string;
  slug: string;
}

export async function verifyBarberTokenEdge(
  token: string
): Promise<BarberTokenPayload | null> {
  const secret = process.env.JWT_SECRET;
  if (!secret) return null;
  try {
    const { payload } = await jwtVerify(
      token,
      new TextEncoder().encode(secret)
    );
    const barberId = payload.barberId as string;
    const slug = payload.slug as string;
    if (!barberId || !slug) return null;
    return { barberId, slug };
  } catch {
    return null;
  }
}
