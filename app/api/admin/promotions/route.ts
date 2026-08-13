import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { orders, products, promotions } from "@/lib/db/schema";
import { requireAuth } from "@/lib/auth";
import {
  MAX_QTY_PER_LINE,
  PROMOTION_SLUG_REGEX,
  computeActivationQuantity,
  slugify,
  type PromotionType,
} from "@/lib/promotions";
import { and, eq, isNull, ne, sql } from "drizzle-orm";

function authErr(err: unknown) {
  const message = err instanceof Error ? err.message : "Error";
  if (message === "Unauthorized" || message === "Forbidden") {
    return NextResponse.json({ error: message }, { status: 401 });
  }
  return null;
}

/** Open-ended windows (null start / null end) count as unbounded. */
function windowsOverlap(
  a: { startsAt: string | null; expiresAt: string | null },
  b: { startsAt: string | null; expiresAt: string | null }
): boolean {
  const aStart = a.startsAt ? new Date(a.startsAt).getTime() : -Infinity;
  const aEnd = a.expiresAt ? new Date(a.expiresAt).getTime() : Infinity;
  const bStart = b.startsAt ? new Date(b.startsAt).getTime() : -Infinity;
  const bEnd = b.expiresAt ? new Date(b.expiresAt).getTime() : Infinity;
  return aStart <= bEnd && bStart <= aEnd;
}

type PromotionInput = {
  name?: string;
  slug?: string;
  type?: PromotionType;
  triggerProductId?: number;
  triggerQuantity?: number;
  discountPercent?: number | null;
  giftProductId?: number | null;
  giftQuantity?: number | null;
  headline?: string;
  headlineFr?: string;
  description?: string | null;
  descriptionFr?: string | null;
  ogImage?: string | null;
  startsAt?: string | null;
  expiresAt?: string | null;
  active?: boolean;
};

type ValidatedPromotion = {
  name: string;
  slug: string;
  type: PromotionType;
  triggerProductId: number;
  triggerQuantity: number;
  activationQuantity: number;
  discountPercent: number | null;
  giftProductId: number | null;
  giftQuantity: number | null;
  headline: string;
  headlineFr: string;
  description: string | null;
  descriptionFr: string | null;
  ogImage: string | null;
  startsAt: string | null;
  expiresAt: string | null;
  active: boolean;
};

/**
 * Validate a promotion payload and enforce the creation-time rules that keep
 * evaluation unambiguous and fulfillment intact.
 *
 * Returns an error string, or the normalized row to write.
 */
async function validate(
  body: PromotionInput,
  selfId: number | null
): Promise<{ error: string; status: number } | { value: ValidatedPromotion }> {
  const name = (body.name || "").trim();
  if (name.length < 3) {
    return { error: "Name must be at least 3 characters", status: 400 };
  }

  const slug = slugify(body.slug || body.name || "");
  if (!PROMOTION_SLUG_REGEX.test(slug)) {
    return { error: "Slug must be 3–64 chars: a–z, 0–9 and dashes", status: 400 };
  }

  const type = body.type;
  if (type !== "percentage" && type !== "bxgy") {
    return { error: "Type must be 'percentage' or 'bxgy'", status: 400 };
  }

  const triggerProductId = body.triggerProductId;
  if (!Number.isInteger(triggerProductId)) {
    return { error: "Trigger product is required", status: 400 };
  }
  const triggerQuantity = body.triggerQuantity ?? 0;
  if (!Number.isInteger(triggerQuantity) || triggerQuantity < 1) {
    return { error: "Trigger quantity must be at least 1", status: 400 };
  }

  const [triggerProduct] = await db
    .select()
    .from(products)
    .where(eq(products.id, triggerProductId as number))
    .limit(1);
  if (!triggerProduct) {
    return { error: "Trigger product not found", status: 400 };
  }
  if (!triggerProduct.active) {
    return { error: "Trigger product is inactive", status: 400 };
  }

  let discountPercent: number | null = null;
  let giftProductId: number | null = null;
  let giftQuantity: number | null = null;

  if (type === "percentage") {
    discountPercent = body.discountPercent ?? 0;
    if (
      typeof discountPercent !== "number" ||
      discountPercent <= 0 ||
      discountPercent > 100
    ) {
      return { error: "Discount must be between 1 and 100%", status: 400 };
    }
  } else {
    giftProductId = body.giftProductId ?? null;
    giftQuantity = body.giftQuantity ?? 0;
    if (!Number.isInteger(giftProductId)) {
      return { error: "Free product is required", status: 400 };
    }
    if (!Number.isInteger(giftQuantity) || (giftQuantity as number) < 1) {
      return { error: "Free quantity must be at least 1", status: 400 };
    }

    const [giftProduct] = await db
      .select()
      .from(products)
      .where(eq(products.id, giftProductId as number))
      .limit(1);
    if (!giftProduct) {
      return { error: "Free product not found", status: 400 };
    }
    if (!giftProduct.active) {
      // Order creation rejects inactive products, so the whole order would fail.
      return { error: "Free product is inactive — activate it first", status: 400 };
    }
    // A line without a StockBridge mapping aborts the submission for the ENTIRE
    // order, silently: the customer sees success and the warehouse sees nothing.
    if (!giftProduct.sku || !giftProduct.stockbridgeProductId) {
      return {
        error: `"${giftProduct.name}" isn't linked to StockBridge. Link it from the Products page first, or orders using this promotion will never reach the warehouse.`,
        status: 400,
      };
    }
  }

  const activationQuantity = computeActivationQuantity({
    type,
    triggerProductId: triggerProductId as number,
    triggerQuantity,
    giftProductId,
    giftQuantity,
  });
  if (activationQuantity > MAX_QTY_PER_LINE) {
    return {
      error: `This promotion needs ${activationQuantity} units in the cart, above the ${MAX_QTY_PER_LINE}-per-line order limit — it could never apply.`,
      status: 400,
    };
  }

  const headline = (body.headline || "").trim();
  const headlineFr = (body.headlineFr || "").trim();
  if (!headline || !headlineFr) {
    return { error: "Headline is required in both languages", status: 400 };
  }

  const startsAt = body.startsAt || null;
  const expiresAt = body.expiresAt || null;
  for (const [label, value] of [
    ["start", startsAt],
    ["expiry", expiresAt],
  ] as const) {
    if (value && !Number.isFinite(new Date(value).getTime())) {
      return { error: `Invalid ${label} date`, status: 400 };
    }
  }
  if (startsAt && expiresAt && new Date(startsAt) > new Date(expiresAt)) {
    return { error: "Start date is after the expiry date", status: 400 };
  }

  const active = body.active ?? true;

  // Uniqueness gate: no two live promotions may compete for the same cart.
  // Scoped to overlapping date windows so a successor campaign can be queued
  // up while the current one is still running.
  if (active) {
    const siblings = await db
      .select({
        id: promotions.id,
        name: promotions.name,
        startsAt: promotions.startsAt,
        expiresAt: promotions.expiresAt,
      })
      .from(promotions)
      .where(
        and(
          eq(promotions.triggerProductId, triggerProductId as number),
          eq(promotions.activationQuantity, activationQuantity),
          eq(promotions.active, true),
          isNull(promotions.deletedAt),
          selfId ? ne(promotions.id, selfId) : undefined
        )
      );

    const clash = siblings.find((s) => windowsOverlap(s, { startsAt, expiresAt }));
    if (clash) {
      return {
        error: `"${clash.name}" already activates at ${activationQuantity} × ${triggerProduct.name} over the same dates. Deactivate it, or change the quantity or schedule.`,
        status: 409,
      };
    }
  }

  const slugOwner = await db
    .select({ id: promotions.id })
    .from(promotions)
    .where(eq(promotions.slug, slug))
    .limit(1);
  if (slugOwner.length > 0 && slugOwner[0].id !== selfId) {
    return { error: "That link slug is already taken", status: 409 };
  }

  return {
    value: {
      name,
      slug,
      type,
      triggerProductId: triggerProductId as number,
      triggerQuantity,
      activationQuantity,
      discountPercent,
      giftProductId,
      giftQuantity,
      headline,
      headlineFr,
      description: body.description?.trim() || null,
      descriptionFr: body.descriptionFr?.trim() || null,
      ogImage: body.ogImage || null,
      startsAt,
      expiresAt,
      active,
    },
  };
}

export async function GET() {
  try {
    await requireAuth(["admin", "support"]);

    const rows = await db
      .select({
        id: promotions.id,
        name: promotions.name,
        slug: promotions.slug,
        type: promotions.type,
        triggerProductId: promotions.triggerProductId,
        triggerQuantity: promotions.triggerQuantity,
        activationQuantity: promotions.activationQuantity,
        discountPercent: promotions.discountPercent,
        giftProductId: promotions.giftProductId,
        giftQuantity: promotions.giftQuantity,
        headline: promotions.headline,
        headlineFr: promotions.headlineFr,
        description: promotions.description,
        descriptionFr: promotions.descriptionFr,
        ogImage: promotions.ogImage,
        startsAt: promotions.startsAt,
        expiresAt: promotions.expiresAt,
        active: promotions.active,
        createdAt: promotions.createdAt,
        orderCount: sql<number>`COALESCE((
          SELECT COUNT(*) FROM ${orders}
          WHERE ${orders.promotionId} = ${promotions.id}
        ), 0)`,
        discountGiven: sql<number>`COALESCE((
          SELECT SUM(${orders.promotionDiscount}) FROM ${orders}
          WHERE ${orders.promotionId} = ${promotions.id}
        ), 0)`,
        revenue: sql<number>`COALESCE((
          SELECT SUM(
            CASE WHEN ${orders.paymentMethod} = 'cod'
              THEN ${orders.total} - COALESCE(${orders.shippingFee}, 0)
              ELSE ${orders.total}
            END
          )
          FROM ${orders}
          WHERE ${orders.promotionId} = ${promotions.id}
        ), 0)`,
      })
      .from(promotions)
      .where(isNull(promotions.deletedAt))
      .orderBy(sql`${promotions.createdAt} DESC`);

    return NextResponse.json(rows);
  } catch (err) {
    const e = authErr(err);
    if (e) return e;
    return NextResponse.json({ error: "Failed to list promotions" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireAuth(["admin", "support"]);
    const body = (await req.json()) as PromotionInput;

    const result = await validate(body, null);
    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    const [created] = await db.insert(promotions).values(result.value).returning();
    return NextResponse.json(created, { status: 201 });
  } catch (err) {
    const e = authErr(err);
    if (e) return e;
    return NextResponse.json({ error: "Failed to create promotion" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    await requireAuth(["admin", "support"]);
    const body = (await req.json()) as PromotionInput & { id?: number };
    if (!body.id) {
      return NextResponse.json({ error: "id required" }, { status: 400 });
    }

    const result = await validate(body, body.id);
    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    const [updated] = await db
      .update(promotions)
      .set({ ...result.value, updatedAt: new Date().toISOString() })
      .where(and(eq(promotions.id, body.id), isNull(promotions.deletedAt)))
      .returning();
    if (!updated) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json(updated);
  } catch (err) {
    const e = authErr(err);
    if (e) return e;
    return NextResponse.json({ error: "Failed to update promotion" }, { status: 500 });
  }
}

/** Toggle only — full edits go through PUT so validation always runs. */
export async function PATCH(req: NextRequest) {
  try {
    await requireAuth(["admin", "support"]);
    const body = (await req.json()) as { id?: number; active?: boolean };
    if (!body.id || typeof body.active !== "boolean") {
      return NextResponse.json({ error: "id and active required" }, { status: 400 });
    }

    const [promo] = await db
      .select()
      .from(promotions)
      .where(and(eq(promotions.id, body.id), isNull(promotions.deletedAt)))
      .limit(1);
    if (!promo) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // Re-activating has to pass the uniqueness gate again — another promotion
    // may have taken this slot while it was off.
    if (body.active && !promo.active) {
      const siblings = await db
        .select({
          id: promotions.id,
          name: promotions.name,
          startsAt: promotions.startsAt,
          expiresAt: promotions.expiresAt,
        })
        .from(promotions)
        .where(
          and(
            eq(promotions.triggerProductId, promo.triggerProductId),
            eq(promotions.activationQuantity, promo.activationQuantity),
            eq(promotions.active, true),
            isNull(promotions.deletedAt),
            ne(promotions.id, promo.id)
          )
        );
      const clash = siblings.find((s) =>
        windowsOverlap(s, { startsAt: promo.startsAt, expiresAt: promo.expiresAt })
      );
      if (clash) {
        return NextResponse.json(
          {
            error: `Can't reactivate — "${clash.name}" already activates at ${promo.activationQuantity} units over the same dates.`,
          },
          { status: 409 }
        );
      }
    }

    const [updated] = await db
      .update(promotions)
      .set({ active: body.active, updatedAt: new Date().toISOString() })
      .where(eq(promotions.id, body.id))
      .returning();
    return NextResponse.json(updated);
  } catch (err) {
    const e = authErr(err);
    if (e) return e;
    return NextResponse.json({ error: "Failed to update promotion" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    await requireAuth(["admin", "support"]);
    const { id } = (await req.json()) as { id?: number };
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

    // Soft delete: past orders keep their attribution, and the slug stays
    // resolvable so links already shared on social degrade gracefully.
    await db
      .update(promotions)
      .set({
        active: false,
        deletedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      .where(eq(promotions.id, id));
    return NextResponse.json({ success: true });
  } catch (err) {
    const e = authErr(err);
    if (e) return e;
    return NextResponse.json({ error: "Failed to delete promotion" }, { status: 500 });
  }
}
