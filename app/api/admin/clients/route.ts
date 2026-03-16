import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { clients } from "@/lib/db/schema";
import { requireAuth } from "@/lib/auth";
import { desc } from "drizzle-orm";

// GET /api/admin/clients
export async function GET() {
  try {
    await requireAuth();
    const all = await db.select().from(clients).orderBy(desc(clients.createdAt));
    return NextResponse.json(all);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error";
    if (message === "Unauthorized" || message === "Forbidden") {
      return NextResponse.json({ error: message }, { status: 401 });
    }
    return NextResponse.json({ error: "Failed to fetch clients" }, { status: 500 });
  }
}
