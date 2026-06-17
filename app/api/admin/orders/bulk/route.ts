import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { clients, orders, orderItems, products } from "@/lib/db/schema";
import { submitOrderToStockBridge } from "@/lib/stockbridge-submit";
import { requireAuth } from "@/lib/auth";
import { eq } from "drizzle-orm";

const TUNISIAN_PHONE_REGEX =
  /^(?:\+216|00216)?(2[0-9]|3[0-9]|4[0-9]|5[0-57-9]|7[0-9]|9[0-9])\d{6}$/;

type BulkBody = {
  client: {
    firstName: string;
    lastName: string;
    email?: string;
    phone: string;
    address: string;
    city: string;
    governorate: string;
    postalCode?: string;
  };
  items: { productId: number; quantity: number; unitPrice: number }[];
  shippingFee?: number;
  notes?: string;
};

export async function POST(req: NextRequest) {
  try {
    await requireAuth(["admin"]);
    const body = (await req.json()) as BulkBody;
    const { client, items, shippingFee, notes } = body;

    // Client validation — same shape as retail, no Turnstile.
    if (
      !client?.firstName ||
      !client?.lastName ||
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
    const cleanedPhone = client.phone.replace(/[\s\-().]/g, "");
    if (!TUNISIAN_PHONE_REGEX.test(cleanedPhone)) {
      return NextResponse.json(
        { error: "Invalid Tunisian phone number" },
        { status: 400 }
      );
    }

    if (!items?.length) {
      return NextResponse.json(
        { error: "Order must have at least one line item" },
        { status: 400 }
      );
    }
    for (const it of items) {
      if (!Number.isFinite(it.quantity) || it.quantity < 1) {
        return NextResponse.json({ error: "Invalid quantity" }, { status: 400 });
      }
      if (!Number.isFinite(it.unitPrice) || it.unitPrice < 0) {
        return NextResponse.json({ error: "Invalid unit price" }, { status: 400 });
      }
    }

    // Resolve products, validate stock — block on insufficient stock (same as retail).
    let productsTotal = 0;
    const resolved: {
      productId: number;
      quantity: number;
      unitPrice: number;
      product: typeof products.$inferSelect;
    }[] = [];
    for (const it of items) {
      const [product] = await db
        .select()
        .from(products)
        .where(eq(products.id, it.productId))
        .limit(1);
      if (!product || !product.active) {
        return NextResponse.json(
          { error: `Product ${it.productId} not found or inactive` },
          { status: 400 }
        );
      }
      if (product.stock < it.quantity) {
        return NextResponse.json(
          {
            error: `Insufficient stock for ${product.name} — available ${product.stock}, requested ${it.quantity}`,
          },
          { status: 400 }
        );
      }
      resolved.push({
        productId: it.productId,
        quantity: it.quantity,
        unitPrice: it.unitPrice,
        product,
      });
      productsTotal += it.unitPrice * it.quantity;
    }

    const fee = Number.isFinite(shippingFee) ? Math.max(0, Number(shippingFee)) : 9.5;
    const total = productsTotal + fee;

    // Insert client (always fresh — ad-hoc model)
    const [newClient] = await db
      .insert(clients)
      .values({
        type: "b2b",
        firstName: client.firstName.trim(),
        lastName: client.lastName.trim(),
        email: client.email?.trim().toLowerCase() || null,
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
        paymentMethod: "net30",
        paymentStatus: "pending",
        orderType: "bulk",
        total,
        shippingFee: fee,
        notes: notes || null,
      })
      .returning();

    // Insert line items + decrement stock
    for (const r of resolved) {
      await db.insert(orderItems).values({
        orderId: order.id,
        productId: r.productId,
        quantity: r.quantity,
        unitPrice: r.unitPrice,
      });
      await db
        .update(products)
        .set({ stock: r.product.stock - r.quantity })
        .where(eq(products.id, r.productId));
    }

    // Push to StockBridge with price_ht = 0 so SB doesn't try to collect anything
    // at delivery. Payment is settled NET-30 between us and the wholesale buyer.
    await submitOrderToStockBridge(
      order.id,
      newClient,
      resolved.map((r) => ({
        product: r.product,
        quantity: r.quantity,
        priceHt: 0,
      })),
      client.postalCode
    );

    return NextResponse.json({ orderId: order.id });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error";
    if (message === "Unauthorized" || message === "Forbidden") {
      return NextResponse.json({ error: message }, { status: 401 });
    }
    console.error("Bulk order creation error:", error);
    return NextResponse.json(
      { error: "Failed to create bulk order" },
      { status: 500 }
    );
  }
}
