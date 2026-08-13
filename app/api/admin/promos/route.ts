import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { promoCodes, orders } from "@/lib/db/schema";
import { requireAuth } from "@/lib/auth";
import { PROMO_CODE_REGEX, normalizeCode } from "@/lib/promo";
import { and, eq, isNull, sql } from "drizzle-orm";

function authErr(err: unknown) {
  const message = err instanceof Error ? err.message : "Error";
  if (message === "Unauthorized" || message === "Forbidden") {
    return NextResponse.json({ error: message }, { status: 401 });
  }
  return null;
}

export async function GET() {
  try {
    await requireAuth(["admin", "support"]);
    const rows = await db
      .select({
        id: promoCodes.id,
        code: promoCodes.code,
        type: promoCodes.type,
        value: promoCodes.value,
        maxRedemptions: promoCodes.maxRedemptions,
        redemptionsCount: promoCodes.redemptionsCount,
        expiresAt: promoCodes.expiresAt,
        active: promoCodes.active,
        createdAt: promoCodes.createdAt,
        revenue: sql<number>`COALESCE((
          SELECT SUM(
            CASE WHEN ${orders.paymentMethod} = 'cod'
              THEN ${orders.total} - COALESCE(${orders.shippingFee}, 0)
              ELSE ${orders.total}
            END
          )
          FROM ${orders}
          WHERE ${orders.promoCodeId} = ${promoCodes.id}
        ), 0)`,
      })
      .from(promoCodes)
      .where(isNull(promoCodes.deletedAt))
      .orderBy(sql`${promoCodes.createdAt} DESC`);
    return NextResponse.json(rows);
  } catch (err) {
    const e = authErr(err);
    if (e) return e;
    return NextResponse.json({ error: "Failed to list promos" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireAuth(["admin", "support"]);
    const body = (await req.json()) as {
      code?: string;
      type?: "percentage" | "fixed";
      value?: number;
      maxRedemptions?: number | null;
      expiresAt?: string | null;
      active?: boolean;
    };

    const code = body.code ? normalizeCode(body.code) : "";
    if (!PROMO_CODE_REGEX.test(code)) {
      return NextResponse.json(
        { error: "Code must be 3–32 chars, A–Z 0–9 or dashes" },
        { status: 400 }
      );
    }
    if (!body.type || !["percentage", "fixed"].includes(body.type)) {
      return NextResponse.json({ error: "Invalid type" }, { status: 400 });
    }
    if (typeof body.value !== "number" || body.value <= 0) {
      return NextResponse.json({ error: "Value must be positive" }, { status: 400 });
    }
    if (body.type === "percentage" && body.value > 100) {
      return NextResponse.json({ error: "Percentage cannot exceed 100" }, { status: 400 });
    }
    if (
      body.maxRedemptions !== null &&
      body.maxRedemptions !== undefined &&
      (!Number.isInteger(body.maxRedemptions) || body.maxRedemptions < 1)
    ) {
      return NextResponse.json({ error: "Max redemptions must be ≥ 1" }, { status: 400 });
    }
    if (body.expiresAt) {
      const t = new Date(body.expiresAt).getTime();
      if (!Number.isFinite(t)) {
        return NextResponse.json({ error: "Invalid expiry date" }, { status: 400 });
      }
    }

    const existing = await db
      .select({ id: promoCodes.id, deletedAt: promoCodes.deletedAt })
      .from(promoCodes)
      .where(eq(promoCodes.code, code))
      .limit(1);
    if (existing.length > 0) {
      const msg =
        existing[0].deletedAt !== null
          ? "Code was previously used and soft-deleted — pick a new code"
          : "Code already exists";
      return NextResponse.json({ error: msg }, { status: 409 });
    }

    const [created] = await db
      .insert(promoCodes)
      .values({
        code,
        type: body.type,
        value: body.value,
        maxRedemptions: body.maxRedemptions ?? null,
        expiresAt: body.expiresAt ?? null,
        active: body.active ?? true,
      })
      .returning();
    return NextResponse.json(created, { status: 201 });
  } catch (err) {
    const e = authErr(err);
    if (e) return e;
    return NextResponse.json({ error: "Failed to create promo" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    await requireAuth(["admin", "support"]);
    const body = (await req.json()) as {
      id?: number;
      active?: boolean;
      maxRedemptions?: number | null;
      expiresAt?: string | null;
    };
    if (!body.id) {
      return NextResponse.json({ error: "id required" }, { status: 400 });
    }

    const updates: Record<string, unknown> = {
      updatedAt: new Date().toISOString(),
    };
    if (typeof body.active === "boolean") updates.active = body.active;
    if (body.maxRedemptions !== undefined) updates.maxRedemptions = body.maxRedemptions;
    if (body.expiresAt !== undefined) updates.expiresAt = body.expiresAt;

    const [updated] = await db
      .update(promoCodes)
      .set(updates)
      .where(and(eq(promoCodes.id, body.id), isNull(promoCodes.deletedAt)))
      .returning();
    if (!updated) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json(updated);
  } catch (err) {
    const e = authErr(err);
    if (e) return e;
    return NextResponse.json({ error: "Failed to update promo" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    await requireAuth(["admin", "support"]);
    const { id } = (await req.json()) as { id?: number };
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

    await db
      .update(promoCodes)
      .set({
        active: false,
        deletedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      .where(eq(promoCodes.id, id));
    return NextResponse.json({ success: true });
  } catch (err) {
    const e = authErr(err);
    if (e) return e;
    return NextResponse.json({ error: "Failed to delete promo" }, { status: 500 });
  }
}
