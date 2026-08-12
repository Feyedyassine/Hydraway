import { NextResponse } from "next/server";
import { loadActivePromotions } from "@/lib/promotions-db";
import { isLive } from "@/lib/promotions";

/**
 * GET /api/promotions/active — public.
 *
 * Lets the cart evaluate promotions locally on every quantity change instead
 * of round-tripping. The server re-evaluates authoritatively at order time, so
 * a stale client payload can only ever affect display.
 */
export async function GET() {
  try {
    const now = new Date();
    const rows = (await loadActivePromotions()).filter((p) => isLive(p, now));

    return NextResponse.json(
      rows.map((p) => ({
        id: p.id,
        slug: p.slug,
        name: p.name,
        type: p.type,
        triggerProductId: p.triggerProductId,
        triggerQuantity: p.triggerQuantity,
        activationQuantity: p.activationQuantity,
        discountPercent: p.discountPercent,
        giftProductId: p.giftProductId,
        giftQuantity: p.giftQuantity,
        giftPrice: p.giftPrice,
        startsAt: p.startsAt,
        expiresAt: p.expiresAt,
        active: p.active,
        deletedAt: p.deletedAt,
        headline: p.headline,
        headlineFr: p.headlineFr,
        // The cart needs these to render a gift line it grants itself.
        giftProduct: p.giftProductId
          ? {
              id: p.giftProductId,
              name: p.giftName,
              nameFr: p.giftNameFr,
              price: p.giftPrice,
              image: p.giftImage,
              stock: p.giftStock,
            }
          : null,
      }))
    );
  } catch {
    // A promotions outage must never take the storefront down — an empty list
    // just means no promotion is offered.
    return NextResponse.json([]);
  }
}
