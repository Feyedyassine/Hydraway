import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { orders, orderItems, clients, products } from "@/lib/db/schema";
import { requireAuth } from "@/lib/auth";
import { eq, desc } from "drizzle-orm";

// Allowed transitions per status
const TRANSITIONS: Record<string, string[]> = {
  pending: ["confirmed", "cancelled"],
  confirmed: ["shipped", "cancelled"],
  shipped: ["delivered", "returned"],
  delivered: [],
  cancelled: [],
  returned: [],
};

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

// PUT /api/admin/orders — Update order status OR payment status
export async function PUT(req: NextRequest) {
  try {
    const session = await requireAuth();
    const body = await req.json();

    if (!body.id) {
      return NextResponse.json({ error: "Order ID required" }, { status: 400 });
    }
    if (!body.status && !body.paymentStatus) {
      return NextResponse.json(
        { error: "status or paymentStatus required" },
        { status: 400 }
      );
    }

    const [order] = await db
      .select()
      .from(orders)
      .where(eq(orders.id, body.id));

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Payment-status changes are admin-only (financial).
    if (body.paymentStatus) {
      if (session.role !== "admin") {
        return NextResponse.json({ error: "Forbidden" }, { status: 401 });
      }
      if (!["pending", "paid", "failed"].includes(body.paymentStatus)) {
        return NextResponse.json({ error: "Invalid paymentStatus" }, { status: 400 });
      }
      const [updated] = await db
        .update(orders)
        .set({
          paymentStatus: body.paymentStatus,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(orders.id, body.id))
        .returning();
      return NextResponse.json(updated);
    }

    // Status change — enforce valid transitions.
    const allowed = TRANSITIONS[order.status] || [];
    if (!allowed.includes(body.status)) {
      return NextResponse.json(
        { error: `Cannot change from "${order.status}" to "${body.status}"` },
        { status: 400 }
      );
    }

    const history = JSON.parse(order.statusHistory || "[]");
    history.push({
      from: order.status,
      to: body.status,
      at: new Date().toISOString(),
    });

    // Auto-mark COD payment as paid on delivery (NET-30 bulk orders are
    // marked manually by admin via paymentStatus).
    const paymentUpdate =
      body.status === "delivered" && order.paymentMethod === "cod"
        ? { paymentStatus: "paid" as const }
        : {};

    const [updated] = await db
      .update(orders)
      .set({
        status: body.status,
        statusHistory: JSON.stringify(history),
        updatedAt: new Date().toISOString(),
        ...paymentUpdate,
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
