import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { requireAuth } from "@/lib/auth";
import { hashSync } from "bcryptjs";
import { eq } from "drizzle-orm";

export async function GET() {
  try {
    await requireAuth(["admin"]);
    const all = await db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        role: users.role,
        createdAt: users.createdAt,
      })
      .from(users);
    return NextResponse.json(all);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error";
    if (message === "Unauthorized" || message === "Forbidden") {
      return NextResponse.json({ error: message }, { status: 401 });
    }
    return NextResponse.json({ error: "Failed to list users" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireAuth(["admin"]);
    const body = await req.json();
    const { name, email, password, role } = body as {
      name?: string;
      email?: string;
      password?: string;
      role?: "admin" | "warehouse" | "support";
    };

    if (!name || !email || !password || !role) {
      return NextResponse.json(
        { error: "name, email, password and role are required" },
        { status: 400 }
      );
    }
    if (!["admin", "warehouse", "support"].includes(role)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }
    const normalizedEmail = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      return NextResponse.json({ error: "Invalid email" }, { status: 400 });
    }
    if (password.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
    }

    const existing = await db
      .select()
      .from(users)
      .where(eq(users.email, normalizedEmail))
      .limit(1);
    if (existing.length > 0) {
      return NextResponse.json({ error: "Email already in use" }, { status: 409 });
    }

    const [created] = await db
      .insert(users)
      .values({
        name: name.trim(),
        email: normalizedEmail,
        passwordHash: hashSync(password, 10),
        role,
      })
      .returning({
        id: users.id,
        email: users.email,
        name: users.name,
        role: users.role,
        createdAt: users.createdAt,
      });

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error";
    if (message === "Unauthorized" || message === "Forbidden") {
      return NextResponse.json({ error: message }, { status: 401 });
    }
    return NextResponse.json({ error: "Failed to create user" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await requireAuth(["admin"]);
    const { id } = (await req.json()) as { id: number };

    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
    if (id === session.userId) {
      return NextResponse.json({ error: "You can't delete your own account" }, { status: 400 });
    }

    await db.delete(users).where(eq(users.id, id));
    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error";
    if (message === "Unauthorized" || message === "Forbidden") {
      return NextResponse.json({ error: message }, { status: 401 });
    }
    return NextResponse.json({ error: "Failed to delete user" }, { status: 500 });
  }
}
