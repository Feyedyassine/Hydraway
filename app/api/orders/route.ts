import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { clients, orders, orderItems, products } from "@/lib/db/schema";
import { generatePayment } from "@/lib/flouci";
import {
  createOrder as createStockBridgeOrder,
  StockBridgeError,
  type StockBridgeOrderItemInput,
} from "@/lib/stockbridge";
import { eq } from "drizzle-orm";

const SHIPPING_FEE_TND = 9.5; // 8.5 livraison + 1 timbre fiscal (StockBridge COD)

const MAX_QTY_PER_LINE = 20;
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
  try {
    const body = await req.json();
    const { client, items, paymentMethod, notes, turnstileToken, hp } = body as {
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

    // Quantity caps
    const totalUnits = items.reduce((n, i) => n + (i.quantity || 0), 0);
    if (totalUnits > MAX_TOTAL_ITEMS) {
      return NextResponse.json(
        { error: `Order exceeds the maximum of ${MAX_TOTAL_ITEMS} items` },
        { status: 400 }
      );
    }
    if (items.some((i) => i.quantity > MAX_QTY_PER_LINE || i.quantity < 1)) {
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

    for (const item of items) {
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

    // For COD: customer pays products + shipping at delivery.
    // For Flouci: shipping is collected at delivery as well, so the online
    // payment only covers the products.
    const total = paymentMethod === "cod" ? productsTotal + SHIPPING_FEE_TND : productsTotal;

    if (total > MAX_ORDER_TOTAL_TND) {
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
        notes: notes || null,
      })
      .returning();

    for (const item of resolvedItems) {
      await db.insert(orderItems).values({
        orderId: order.id,
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
      });

      await db
        .update(products)
        .set({ stock: item.product.stock - item.quantity })
        .where(eq(products.id, item.productId));
    }

    // Submit to StockBridge for COD orders. Flouci orders wait for payment
    // confirmation (handled separately) before being pushed.
    if (paymentMethod === "cod") {
      await submitToStockBridge(order.id, newClient, resolvedItems, client.postalCode);
    }

    if (paymentMethod === "flouci") {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL!;
      const payment = await generatePayment({
        amount: productsTotal,
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

    return NextResponse.json({ orderId: order.id, status: "pending" });
  } catch (error) {
    console.error("Order creation error:", error);
    return NextResponse.json(
      { error: "Failed to create order" },
      { status: 500 }
    );
  }
}

async function submitToStockBridge(
  orderId: number,
  client: typeof clients.$inferSelect,
  resolved: {
    productId: number;
    quantity: number;
    unitPrice: number;
    product: typeof products.$inferSelect;
  }[],
  postalCode: string | undefined
) {
  const missingMapping = resolved.find((r) => !r.product.stockbridgeProductId || !r.product.sku);
  if (missingMapping) {
    await db
      .update(orders)
      .set({
        stockbridgeError: `Product ${missingMapping.product.id} has no StockBridge mapping`,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(orders.id, orderId));
    return;
  }

  const sbItems: StockBridgeOrderItemInput[] = resolved.map((r) => ({
    product_id: r.product.stockbridgeProductId!,
    sku: r.product.sku!,
    product_name: r.product.name,
    quantity: r.quantity,
    price_ht: r.unitPrice,
    tax_rate: 0, // Hydraway is VAT-exempt
  }));

  try {
    const sb = await createStockBridgeOrder({
      external_ref: `HYD-${orderId}`,
      priority: "normal",
      shipping_address: {
        name: `${client.firstName} ${client.lastName}`.trim(),
        phone: client.phone,
        address: client.address,
        city: client.city,
        postal_code: postalCode || "0000",
        governorate: client.governorate,
        country_code: "TN",
      },
      items: sbItems,
    });

    await db
      .update(orders)
      .set({
        stockbridgeOrderId: sb.id,
        stockbridgeInternalRef: sb.internal_ref,
        stockbridgeStatus: sb.status,
        stockbridgeError: null,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(orders.id, orderId));
  } catch (err) {
    const msg =
      err instanceof StockBridgeError
        ? `${err.code}: ${err.message}`
        : err instanceof Error
          ? err.message
          : "Unknown StockBridge error";
    console.error(`StockBridge submission failed for order ${orderId}:`, msg);
    await db
      .update(orders)
      .set({
        stockbridgeError: msg,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(orders.id, orderId));
  }
}
