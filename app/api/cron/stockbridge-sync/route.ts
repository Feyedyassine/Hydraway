import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { orders, products } from "@/lib/db/schema";
import { getOrder, listProducts, mapStockBridgeStatus } from "@/lib/stockbridge";
import { and, eq, isNotNull, ne } from "drizzle-orm";

const TERMINAL = new Set(["delivered", "cancelled", "returned"]);

export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization");
  const secret = process.env.CRON_SECRET;
  if (secret && auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const orderResults = await syncOrders();
  const productResults = await syncProductStock();

  return NextResponse.json({
    orders: orderResults,
    products: productResults,
  });
}

async function syncOrders() {
  const candidates = await db
    .select()
    .from(orders)
    .where(
      and(
        isNotNull(orders.stockbridgeOrderId),
        ne(orders.status, "delivered"),
        ne(orders.status, "cancelled"),
        ne(orders.status, "returned")
      )
    );

  const results: Array<{ orderId: number; status: string; changed: boolean; error?: string }> = [];

  for (const order of candidates) {
    if (!order.stockbridgeOrderId) continue;
    if (TERMINAL.has(order.status)) continue;

    try {
      const sb = await getOrder(order.stockbridgeOrderId);
      const mapped = mapStockBridgeStatus(sb.status);
      const changed =
        mapped !== order.status ||
        sb.status !== order.stockbridgeStatus ||
        sb.tracking_number !== order.trackingNumber ||
        sb.shipped_at !== order.shippedAt ||
        sb.delivered_at !== order.deliveredAt;

      if (changed) {
        const history = JSON.parse(order.statusHistory || "[]");
        if (mapped !== order.status) {
          history.push({
            from: order.status,
            to: mapped,
            at: new Date().toISOString(),
            via: "stockbridge",
            stockbridge_status: sb.status,
          });
        }

        await db
          .update(orders)
          .set({
            status: mapped,
            stockbridgeStatus: sb.status,
            trackingNumber: sb.tracking_number,
            shippedAt: sb.shipped_at,
            deliveredAt: sb.delivered_at,
            statusHistory: JSON.stringify(history),
            paymentStatus:
              mapped === "delivered" && order.paymentMethod === "cod"
                ? "paid"
                : order.paymentStatus,
            updatedAt: new Date().toISOString(),
          })
          .where(eq(orders.id, order.id));
      }

      results.push({ orderId: order.id, status: sb.status, changed });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      results.push({ orderId: order.id, status: order.stockbridgeStatus || "?", changed: false, error: msg });
    }
  }

  return { checked: results.length, results };
}

async function syncProductStock() {
  const linked = await db
    .select()
    .from(products)
    .where(isNotNull(products.stockbridgeProductId));

  if (linked.length === 0) {
    return { checked: 0, results: [] };
  }

  try {
    const list = await listProducts({ limit: 100 });
    const byId = new Map(list.data.map((p) => [p.id, p]));

    const results: Array<{ productId: number; available: number; changed: boolean }> = [];

    for (const local of linked) {
      if (!local.stockbridgeProductId) continue;
      const sb = byId.get(local.stockbridgeProductId);
      if (!sb) continue;

      const available = sb.stock_physical - sb.stock_reserved;
      if (local.stock !== available) {
        await db
          .update(products)
          .set({ stock: available })
          .where(eq(products.id, local.id));
        results.push({ productId: local.id, available, changed: true });
      } else {
        results.push({ productId: local.id, available, changed: false });
      }
    }

    return { checked: results.length, results };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return { checked: 0, results: [], error: msg };
  }
}
