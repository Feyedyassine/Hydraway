import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { clients, orders, orderItems, products, promoCodes } from "@/lib/db/schema";
import { generatePayment } from "@/lib/flouci";
import { submitOrderToStockBridge } from "@/lib/stockbridge-submit";
import {
  PROMO_CODE_REGEX,
  evaluatePromo,
  normalizeCode,
} from "@/lib/promo";
import {
  MAX_QTY_PER_LINE,
  evaluatePromotions,
  freeUnitsByProduct,
  lineDiscounts,
} from "@/lib/promotions";
import { loadActivePromotions, toEvaluable } from "@/lib/promotions-db";
import { and, eq, isNull, lt, or, sql } from "drizzle-orm";

const SHIPPING_FEE_TND = 9.5; // 8.5 livraison + 1 timbre fiscal (StockBridge COD)

const MAX_TOTAL_ITEMS = 50;
const MAX_ORDER_TOTAL_TND = 5000;
const TUNISIAN_PHONE_REGEX = /^(?:\+216|00216)?(2[0-9]|3[0-9]|4[0-9]|5[0-57-9]|7[0-9]|9[0-9])\d{6}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

async function verifyTurnstile(token: string, ip: string | null): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) {
    console.warn("TURNSTILE_SECRET_KEY not set — skipping verification (dev only)");
    return true;
  }
  try {
    const params = new URLSearchParams();
    params.set("secret", secret);
    params.set("response", token);
    if (ip) params.set("remoteip", ip);
    const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      body: params,
    });
    const data = (await res.json()) as { success?: boolean };
    return data.success === true;
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest) {
  let claimedPromoId: number | null = null;
  try {
    const body = await req.json();
    const { client, items, paymentMethod, notes, turnstileToken, hp, promoCode } = body as {
      client: {
        firstName: string;
        lastName: string;
        email: string;
        phone: string;
        address: string;
        city: string;
        governorate: string;
        postalCode?: string;
      };
      items: { productId: number; quantity: number }[];
      paymentMethod: "cod" | "flouci";
      notes?: string;
      turnstileToken?: string;
      hp?: string;
      promoCode?: string;
    };

    // Honeypot: real users leave this empty.
    if (hp && hp.length > 0) {
      return NextResponse.json({ error: "Invalid submission" }, { status: 400 });
    }

    // Turnstile verification
    if (!turnstileToken) {
      return NextResponse.json({ error: "Verification required" }, { status: 400 });
    }
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
      req.headers.get("x-real-ip") ||
      null;
    const turnstileOk = await verifyTurnstile(turnstileToken, ip);
    if (!turnstileOk) {
      return NextResponse.json({ error: "Verification failed" }, { status: 400 });
    }

    if (
      !client?.firstName ||
      !client?.lastName ||
      !client?.email ||
      !client?.phone ||
      !client?.address ||
      !client?.city ||
      !client?.governorate
    ) {
      return NextResponse.json(
        { error: "Missing required client fields" },
        { status: 400 }
      );
    }

    const cleanedEmail = client.email.trim().toLowerCase();
    if (!EMAIL_REGEX.test(cleanedEmail) || cleanedEmail.length > 254) {
      return NextResponse.json({ error: "Invalid email address" }, { status: 400 });
    }

    // Field-length sanity checks
    if (
      client.firstName.trim().length < 2 ||
      client.lastName.trim().length < 2 ||
      client.address.trim().length < 5 ||
      client.city.trim().length < 2
    ) {
      return NextResponse.json({ error: "Invalid client fields" }, { status: 400 });
    }

    // Phone format — Tunisian mobile
    const cleanedPhone = client.phone.replace(/[\s\-().]/g, "");
    if (!TUNISIAN_PHONE_REGEX.test(cleanedPhone)) {
      return NextResponse.json({ error: "Invalid Tunisian phone number" }, { status: 400 });
    }

    if (!items?.length) {
      return NextResponse.json(
        { error: "Order must have at least one item" },
        { status: 400 }
      );
    }

    // Collapse duplicate lines so the caps below — and the promotion maths —
    // see one line per product regardless of what the client sent.
    const mergedItems = Array.from(
      items
        .reduce(
          (m, i) => m.set(i.productId, (m.get(i.productId) ?? 0) + (i.quantity || 0)),
          new Map<number, number>()
        )
        .entries(),
      ([productId, quantity]) => ({ productId, quantity })
    );

    // Quantity caps
    const totalUnits = mergedItems.reduce((n, i) => n + (i.quantity || 0), 0);
    if (totalUnits > MAX_TOTAL_ITEMS) {
      return NextResponse.json(
        { error: `Order exceeds the maximum of ${MAX_TOTAL_ITEMS} items` },
        { status: 400 }
      );
    }
    if (mergedItems.some((i) => i.quantity > MAX_QTY_PER_LINE || i.quantity < 1)) {
      return NextResponse.json(
        { error: `Quantity per item must be between 1 and ${MAX_QTY_PER_LINE}` },
        { status: 400 }
      );
    }

    if (!["cod", "flouci"].includes(paymentMethod)) {
      return NextResponse.json(
        { error: "Invalid payment method" },
        { status: 400 }
      );
    }

    let productsTotal = 0;
    const resolvedItems: {
      productId: number;
      quantity: number;
      unitPrice: number;
      product: typeof products.$inferSelect;
    }[] = [];

    for (const item of mergedItems) {
      const [product] = await db
        .select()
        .from(products)
        .where(eq(products.id, item.productId))
        .limit(1);

      if (!product || !product.active) {
        return NextResponse.json(
          { error: `Product ${item.productId} not found or inactive` },
          { status: 400 }
        );
      }

      if (product.stock < item.quantity) {
        return NextResponse.json(
          { error: `Insufficient stock for ${product.name}` },
          { status: 400 }
        );
      }

      resolvedItems.push({
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: product.price,
        product,
      });
      productsTotal += product.price * item.quantity;
    }

    // Automatic promotions. Recomputed here from the resolved lines — the
    // client never gets to say which promotion applies, or what it's worth.
    // Only retail COD/Flouci orders reach this route, so bulk NET-30 orders
    // are excluded by construction.
    const evalLines = resolvedItems.map((r) => ({
      productId: r.productId,
      quantity: r.quantity,
      price: r.unitPrice,
    }));
    const activePromotions = await loadActivePromotions();
    // `grant` is deliberately ignored: if the customer removed a gift line, the
    // server does not put it back. It only ever discounts what's in the cart.
    const { applied: appliedPromotion } = evaluatePromotions(
      evalLines,
      activePromotions.map(toEvaluable)
    );

    const promotionDiscount = Math.min(
      appliedPromotion?.discount ?? 0,
      productsTotal
    );
    const freeUnits = freeUnitsByProduct(appliedPromotion);
    const promotionLineDiscounts = lineDiscounts(appliedPromotion, evalLines);

    let promotionSnapshot: string | null = null;
    if (appliedPromotion) {
      const row = activePromotions.find((p) => p.id === appliedPromotion.promotionId);
      promotionSnapshot = JSON.stringify({
        id: appliedPromotion.promotionId,
        slug: appliedPromotion.slug,
        name: appliedPromotion.name,
        type: appliedPromotion.type,
        triggerProductId: row?.triggerProductId,
        triggerQuantity: row?.triggerQuantity,
        activationQuantity: row?.activationQuantity,
        discountPercent: row?.discountPercent,
        giftProductId: row?.giftProductId,
        giftQuantity: row?.giftQuantity,
        discount: promotionDiscount,
        freeUnits: appliedPromotion.freeUnits,
      });
    }

    // Promo code: validate and atomically claim a redemption slot.
    // When a promotion is already applied the code still gets recorded and
    // claimed — the influencer keeps attribution — but adds no extra discount.
    let discountAmount = 0;
    let promoSnapshot: string | null = null;

    if (promoCode) {
      const normalized = normalizeCode(promoCode);
      if (!PROMO_CODE_REGEX.test(normalized)) {
        return NextResponse.json({ error: "Invalid promo code" }, { status: 400 });
      }
      const [promo] = await db
        .select()
        .from(promoCodes)
        .where(eq(promoCodes.code, normalized))
        .limit(1);
      const result = evaluatePromo(promo, productsTotal);
      if (!result.ok) {
        return NextResponse.json(
          { error: "Promo code is not available", reason: result.reason },
          { status: 400 }
        );
      }
      // Atomic claim — only succeeds if still active, not expired, under cap.
      const claimed = await db
        .update(promoCodes)
        .set({
          redemptionsCount: sql`${promoCodes.redemptionsCount} + 1`,
          updatedAt: new Date().toISOString(),
        })
        .where(
          and(
            eq(promoCodes.id, promo.id),
            eq(promoCodes.active, true),
            isNull(promoCodes.deletedAt),
            or(
              isNull(promoCodes.maxRedemptions),
              lt(promoCodes.redemptionsCount, promoCodes.maxRedemptions)
            )
          )
        )
        .returning({ id: promoCodes.id });
      if (claimed.length === 0) {
        return NextResponse.json(
          { error: "Promo code is no longer available" },
          { status: 400 }
        );
      }
      discountAmount = appliedPromotion ? 0 : result.discount;
      claimedPromoId = promo.id;
      promoSnapshot = normalized;
    }

    const discountedSubtotal = productsTotal - promotionDiscount - discountAmount;

    // For COD: customer pays products + shipping at delivery.
    // For Flouci: shipping is collected at delivery as well, so the online
    // payment only covers the products.
    const total =
      paymentMethod === "cod" ? discountedSubtotal + SHIPPING_FEE_TND : discountedSubtotal;

    if (total > MAX_ORDER_TOTAL_TND) {
      if (claimedPromoId !== null) await releasePromoSlot(claimedPromoId);
      return NextResponse.json(
        { error: `Order total exceeds ${MAX_ORDER_TOTAL_TND} TND — please contact us for large orders` },
        { status: 400 }
      );
    }

    const [newClient] = await db
      .insert(clients)
      .values({
        firstName: client.firstName,
        lastName: client.lastName,
        email: cleanedEmail,
        phone: client.phone,
        address: client.address,
        city: client.city,
        governorate: client.governorate,
        postalCode: client.postalCode || null,
      })
      .returning();

    const [order] = await db
      .insert(orders)
      .values({
        clientId: newClient.id,
        paymentMethod,
        paymentStatus: "pending",
        total,
        shippingFee: SHIPPING_FEE_TND,
        promoCodeId: claimedPromoId,
        promoCodeSnapshot: promoSnapshot,
        discountAmount,
        promotionId: appliedPromotion?.promotionId ?? null,
        promotionSnapshot,
        promotionDiscount,
        notes: notes || null,
      })
      .returning();

    for (const item of resolvedItems) {
      await db.insert(orderItems).values({
        orderId: order.id,
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        freeQuantity: Math.min(freeUnits.get(item.productId) ?? 0, item.quantity),
      });

      // Free units are real units — they ship, so they come out of stock too.
      await db
        .update(products)
        .set({ stock: item.product.stock - item.quantity })
        .where(eq(products.id, item.productId));
    }

    // Per-line pricing for StockBridge. A promotion discount belongs to a
    // specific line, so it's applied there; a promo-code discount has no
    // natural home and stays proportional across lines. Either way the line
    // totals sum to `discountedSubtotal`, so the amount collected on delivery
    // matches what the customer saw at checkout.
    const codeRatio =
      productsTotal > 0 ? (productsTotal - discountAmount) / productsTotal : 1;

    const submitLines = resolvedItems.map((r) => {
      const lineTotal = r.unitPrice * r.quantity;
      const afterPromotion =
        lineTotal - (promotionLineDiscounts.get(r.productId) ?? 0);
      return {
        product: r.product,
        quantity: r.quantity,
        priceHt:
          Math.round(((afterPromotion * codeRatio) / r.quantity) * 100) / 100,
      };
    });

    // Submit to StockBridge for COD orders. Flouci orders wait for payment
    // confirmation (handled separately) before being pushed.
    if (paymentMethod === "cod") {
      await submitOrderToStockBridge(
        order.id,
        newClient,
        submitLines,
        client.postalCode
      );
    }

    if (paymentMethod === "flouci") {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL!;
      const payment = await generatePayment({
        amount: discountedSubtotal,
        orderId: order.id,
        successUrl: `${baseUrl}/api/payments/flouci/verify?payment_id=${order.id}`,
        failUrl: `${baseUrl}/api/payments/flouci/verify?payment_id=${order.id}&status=failed`,
        webhookUrl: `${baseUrl}/api/payments/flouci/webhook`,
      });

      await db
        .update(orders)
        .set({ flouciPaymentId: payment.payment_id })
        .where(eq(orders.id, order.id));

      return NextResponse.json({
        orderId: order.id,
        paymentUrl: payment.link,
      });
    }

    // Totals come back so the client reports the amount actually charged
    // (to the customer and to the Meta pixel) rather than its own estimate.
    return NextResponse.json({
      orderId: order.id,
      status: "pending",
      total,
      promotionDiscount,
      discountAmount,
    });
  } catch (error) {
    console.error("Order creation error:", error);
    if (claimedPromoId !== null) await releasePromoSlot(claimedPromoId);
    return NextResponse.json(
      { error: "Failed to create order" },
      { status: 500 }
    );
  }
}

async function releasePromoSlot(promoId: number) {
  try {
    await db
      .update(promoCodes)
      .set({
        redemptionsCount: sql`MAX(${promoCodes.redemptionsCount} - 1, 0)`,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(promoCodes.id, promoId));
  } catch (err) {
    console.error(`Failed to release promo slot for promo ${promoId}:`, err);
  }
}

