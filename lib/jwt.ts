import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET!;

export interface BarberTokenPayload {
  barberId: string;
  slug: string;
}

export function signBarberToken(payload: BarberTokenPayload): string {
  if (!JWT_SECRET) throw new Error("JWT_SECRET no definido");
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
}

export function verifyBarberToken(token: string): BarberTokenPayload | null {
  if (!JWT_SECRET) return null;
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as BarberTokenPayload;
    return decoded;
  } catch {
    return null;
  }
}
