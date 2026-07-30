import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { contactMessages } from "@/lib/db/schema";
import { requireAuth } from "@/lib/auth";
import { desc, eq } from "drizzle-orm";

// GET /api/admin/contact
export async function GET() {
  try {
    await requireAuth(["admin", "support"]);
    const all = await db
      .select()
      .from(contactMessages)
      .orderBy(desc(contactMessages.createdAt));
    return NextResponse.json(all);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error";
    if (message === "Unauthorized" || message === "Forbidden") {
      return NextResponse.json({ error: message }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Failed to fetch contact messages" },
      { status: 500 }
    );
  }
}

// PUT /api/admin/contact — update status
export async function PUT(req: NextRequest) {
  try {
    await requireAuth(["admin", "support"]);
    const { id, status } = await req.json();

    if (!id || !status || !["new", "read", "replied"].includes(status)) {
      return NextResponse.json({ error: "Invalid data" }, { status: 400 });
    }

    await db
      .update(contactMessages)
      .set({ status })
      .where(eq(contactMessages.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error";
    if (message === "Unauthorized" || message === "Forbidden") {
      return NextResponse.json({ error: message }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Failed to update message" },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/contact — delete a message
export async function DELETE(req: NextRequest) {
  try {
    await requireAuth(["admin"]);
    const { id } = await req.json();

    if (!id) {
      return NextResponse.json({ error: "Missing id" }, { status: 400 });
    }

    await db.delete(contactMessages).where(eq(contactMessages.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error";
    if (message === "Unauthorized" || message === "Forbidden") {
      return NextResponse.json({ error: message }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Failed to delete message" },
      { status: 500 }
    );
  }
}
