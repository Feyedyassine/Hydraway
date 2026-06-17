import { db } from "@/lib/db";
import { clients, orders, products } from "@/lib/db/schema";
import {
  createOrder as createStockBridgeOrder,
  StockBridgeError,
  type StockBridgeOrderItemInput,
} from "@/lib/stockbridge";
import { eq } from "drizzle-orm";

export type SubmitLine = {
  product: typeof products.$inferSelect;
  quantity: number;
  priceHt: number;
};

/**
 * Push an order to StockBridge and write the result back to our `orders` row.
 *
 * Caller computes `priceHt` per line:
 *   - retail: actual unit price (post-discount scaling for promos)
 *   - bulk NET-30: always 0 — StockBridge collects nothing at delivery;
 *     payment is settled NET-30 between Hydraway and the wholesale buyer.
 */
export async function submitOrderToStockBridge(
  orderId: number,
  client: typeof clients.$inferSelect,
  lines: SubmitLine[],
  postalCode: string | undefined
) {
  const missingMapping = lines.find(
    (l) => !l.product.stockbridgeProductId || !l.product.sku
  );
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

  const sbItems: StockBridgeOrderItemInput[] = lines.map((l) => ({
    product_id: l.product.stockbridgeProductId!,
    sku: l.product.sku!,
    product_name: l.product.name,
    quantity: l.quantity,
    price_ht: l.priceHt,
    tax_rate: 0,
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
