import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { clients, orders, orderItems, products } from "@/lib/db/schema";
import { generatePayment } from "@/lib/flouci";
import { eq } from "drizzle-orm";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { client, items, paymentMethod, notes } = body as {
      client: {
        firstName: string;
        lastName: string;
        email?: string;
        phone: string;
        address: string;
        city: string;
        governorate: string;
      };
      items: { productId: number; quantity: number }[];
      paymentMethod: "cod" | "flouci";
      notes?: string;
    };

    // Validate required fields
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

    if (!items?.length) {
      return NextResponse.json(
        { error: "Order must have at least one item" },
        { status: 400 }
      );
    }

    if (!["cod", "flouci"].includes(paymentMethod)) {
      return NextResponse.json(
        { error: "Invalid payment method" },
        { status: 400 }
      );
    }

    // Fetch products and compute total
    let total = 0;
    const resolvedItems: { productId: number; quantity: number; unitPrice: number }[] = [];

    for (const item of items) {
      const product = await db
        .select()
        .from(products)
        .where(eq(products.id, item.productId))
        .limit(1);

      if (!product.length || !product[0].active) {
        return NextResponse.json(
          { error: `Product ${item.productId} not found or inactive` },
          { status: 400 }
        );
      }

      if (product[0].stock < item.quantity) {
        return NextResponse.json(
          { error: `Insufficient stock for ${product[0].name}` },
          { status: 400 }
        );
      }

      resolvedItems.push({
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: product[0].price,
      });
      total += product[0].price * item.quantity;
    }

    // Create or find client
    const [newClient] = await db
      .insert(clients)
      .values({
        firstName: client.firstName,
        lastName: client.lastName,
        email: client.email || null,
        phone: client.phone,
        address: client.address,
        city: client.city,
        governorate: client.governorate,
      })
      .returning();

    // Create order
    const [order] = await db
      .insert(orders)
      .values({
        clientId: newClient.id,
        paymentMethod,
        paymentStatus: paymentMethod === "cod" ? "pending" : "pending",
        total,
        notes: notes || null,
      })
      .returning();

    // Create order items and decrement stock
    for (const item of resolvedItems) {
      await db.insert(orderItems).values({
        orderId: order.id,
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
      });

      const product = await db
        .select()
        .from(products)
        .where(eq(products.id, item.productId))
        .limit(1);

      await db
        .update(products)
        .set({ stock: product[0].stock - item.quantity })
        .where(eq(products.id, item.productId));
    }

    // If Flouci, initiate payment
    if (paymentMethod === "flouci") {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL!;
      const payment = await generatePayment({
        amount: total,
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

    // COD - order stays pending until admin confirms
    return NextResponse.json({ orderId: order.id, status: "pending" });
  } catch (error) {
    console.error("Order creation error:", error);
    return NextResponse.json(
      { error: "Failed to create order" },
      { status: 500 }
    );
  }
}
