import { db } from "@/lib/db";
import { products, promotions } from "@/lib/db/schema";
import type { EvaluablePromotion } from "@/lib/promotions";
import { and, eq, isNull, or } from "drizzle-orm";

export type PromotionRow = typeof promotions.$inferSelect;

export type PromotionWithGift = PromotionRow & {
  giftPrice: number | null;
  giftName: string | null;
  giftNameFr: string | null;
  giftImage: string | null;
  giftStock: number | null;
};

/**
 * Promotions that are active and not deleted, joined with the gift product's
 * price so the evaluator can value a gift that isn't in the cart yet.
 * Date-window filtering is left to `isLive` at evaluation time.
 */
export async function loadActivePromotions(): Promise<PromotionWithGift[]> {
  const rows = await db
    .select({
      promotion: promotions,
      giftPrice: products.price,
      giftName: products.name,
      giftNameFr: products.nameFr,
      giftImage: products.image,
      giftStock: products.stock,
    })
    .from(promotions)
    .leftJoin(products, eq(promotions.giftProductId, products.id))
    .where(and(eq(promotions.active, true), isNull(promotions.deletedAt)));

  return rows.map((r) => ({
    ...r.promotion,
    giftPrice: r.giftPrice ?? null,
    giftName: r.giftName ?? null,
    giftNameFr: r.giftNameFr ?? null,
    giftImage: r.giftImage ?? null,
    giftStock: r.giftStock ?? null,
  }));
}

/**
 * Live promotions that depend on a product, either as the trigger or as the
 * free gift.
 *
 * Creating a promotion validates that its products are active and linked to
 * StockBridge, but nothing stops someone editing those products afterwards.
 * Deactivating a referenced product makes `/api/orders` reject the whole order;
 * clearing its SKU is worse — the order succeeds and the customer sees a
 * success screen while the StockBridge push silently aborts.
 */
export async function livePromotionsUsingProduct(productId: number) {
  return db
    .select({
      id: promotions.id,
      name: promotions.name,
      slug: promotions.slug,
      isGift: promotions.giftProductId,
    })
    .from(promotions)
    .where(
      and(
        eq(promotions.active, true),
        isNull(promotions.deletedAt),
        or(
          eq(promotions.triggerProductId, productId),
          eq(promotions.giftProductId, productId)
        )
      )
    );
}

/** Narrow a DB row to the shape the shared evaluator accepts. */
export function toEvaluable(row: PromotionWithGift): EvaluablePromotion {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    type: row.type,
    triggerProductId: row.triggerProductId,
    triggerQuantity: row.triggerQuantity,
    activationQuantity: row.activationQuantity,
    discountPercent: row.discountPercent,
    giftProductId: row.giftProductId,
    giftQuantity: row.giftQuantity,
    giftPrice: row.giftPrice,
    startsAt: row.startsAt,
    expiresAt: row.expiresAt,
    active: row.active,
    deletedAt: row.deletedAt,
  };
}
