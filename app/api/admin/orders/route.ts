import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { orders, orderItems, clients, products } from "@/lib/db/schema";
import { requireAuth } from "@/lib/auth";
import { eq, desc } from "drizzle-orm";

// GET /api/admin/orders
export async function GET() {
  try {
    await requireAuth();

    const allOrders = await db
      .select()
      .from(orders)
      .innerJoin(clients, eq(orders.clientId, clients.id))
      .orderBy(desc(orders.createdAt));

    // Fetch items for each order
    const result = await Promise.all(
      allOrders.map(async (row) => {
        const items = await db
          .select({
            id: orderItems.id,
            quantity: orderItems.quantity,
            unitPrice: orderItems.unitPrice,
            productName: products.name,
            productNameFr: products.nameFr,
          })
          .from(orderItems)
          .innerJoin(products, eq(orderItems.productId, products.id))
          .where(eq(orderItems.orderId, row.orders.id));

        return {
          ...row.orders,
          client: row.clients,
          items,
        };
      })
    );

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error";
    if (message === "Unauthorized" || message === "Forbidden") {
      return NextResponse.json({ error: message }, { status: 401 });
    }
    return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 });
  }
}

// PUT /api/admin/orders — Update order status
export async function PUT(req: NextRequest) {
  try {
    await requireAuth();
    const body = await req.json();

    if (!body.id || !body.status) {
      return NextResponse.json(
        { error: "Order ID and status required" },
        { status: 400 }
      );
    }

    const [updated] = await db
      .update(orders)
      .set({
        status: body.status,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(orders.id, body.id))
      .returning();

    return NextResponse.json(updated);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error";
    if (message === "Unauthorized" || message === "Forbidden") {
      return NextResponse.json({ error: message }, { status: 401 });
    }
    return NextResponse.json({ error: "Failed to update order" }, { status: 500 });
  }
}
