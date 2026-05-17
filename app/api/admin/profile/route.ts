import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { requireAuth } from "@/lib/auth";
import { compareSync, hashSync } from "bcryptjs";
import { eq } from "drizzle-orm";

export async function PATCH(req: NextRequest) {
  try {
    const session = await requireAuth();
    const body = await req.json();
    const { name, email, currentPassword, newPassword } = body as {
      name?: string;
      email?: string;
      currentPassword?: string;
      newPassword?: string;
    };

    const [me] = await db.select().from(users).where(eq(users.id, session.userId)).limit(1);
    if (!me) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const updates: Partial<typeof users.$inferInsert> = {};

    if (name !== undefined && name.trim().length > 0) {
      updates.name = name.trim();
    }

    if (email !== undefined && email !== me.email) {
      const trimmed = email.trim().toLowerCase();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
        return NextResponse.json({ error: "Invalid email" }, { status: 400 });
      }
      const existing = await db.select().from(users).where(eq(users.email, trimmed)).limit(1);
      if (existing.length > 0 && existing[0].id !== me.id) {
        return NextResponse.json({ error: "Email already in use" }, { status: 409 });
      }
      updates.email = trimmed;
    }

    if (newPassword !== undefined && newPassword.length > 0) {
      if (newPassword.length < 8) {
        return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
      }
      if (!currentPassword) {
        return NextResponse.json({ error: "Current password required" }, { status: 400 });
      }
      if (!compareSync(currentPassword, me.passwordHash)) {
        return NextResponse.json({ error: "Current password is incorrect" }, { status: 401 });
      }
      updates.passwordHash = hashSync(newPassword, 10);
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
    }

    const [updated] = await db
      .update(users)
      .set(updates)
      .where(eq(users.id, me.id))
      .returning();

    return NextResponse.json({
      user: { id: updated.id, name: updated.name, email: updated.email, role: updated.role },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error";
    if (message === "Unauthorized" || message === "Forbidden") {
      return NextResponse.json({ error: message }, { status: 401 });
    }
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
  }
}
