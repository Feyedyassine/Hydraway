import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { db } from "./db";
import { users } from "./db/schema";
import { eq } from "drizzle-orm";

const JWT_SECRET = process.env.JWT_SECRET || "hydraway-dev-secret-change-me";

export type Role = "admin" | "warehouse" | "support";

export interface TokenPayload {
  userId: number;
  email: string;
  role: Role;
}

export function signToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as TokenPayload;
  } catch {
    return null;
  }
}

export async function getSession(): Promise<TokenPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("session")?.value;
  if (!token) return null;
  return verifyToken(token);
}

export async function requireAuth(
  allowedRoles?: Role[]
): Promise<TokenPayload> {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");
  if (allowedRoles && !allowedRoles.includes(session.role)) {
    throw new Error("Forbidden");
  }
  // Verify user still exists
  const user = await db
    .select()
    .from(users)
    .where(eq(users.id, session.userId))
    .limit(1);
  if (user.length === 0) throw new Error("Unauthorized");
  return session;
}
