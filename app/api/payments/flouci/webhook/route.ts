import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { orders } from "@/lib/db/schema";
import { verifyPayment } from "@/lib/flouci";
import { eq } from "drizzle-orm";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const paymentId = body.payment_id;

    if (!paymentId) {
      return NextResponse.json({ error: "Missing payment_id" }, { status: 400 });
    }

    // Find order by flouci payment ID
    const order = await db
      .select()
      .from(orders)
      .where(eq(orders.flouciPaymentId, paymentId))
      .limit(1);

    if (!order.length) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Verify payment status with Flouci
    const verification = await verifyPayment(paymentId);

    if (verification.success && verification.result.status === "SUCCESS") {
      await db
        .update(orders)
        .set({
          paymentStatus: "paid",
          status: "confirmed",
          updatedAt: new Date().toISOString(),
        })
        .where(eq(orders.id, order[0].id));
    } else if (
      verification.result.status === "FAILURE" ||
      verification.result.status === "EXPIRED"
    ) {
      await db
        .update(orders)
        .set({
          paymentStatus: "failed",
          updatedAt: new Date().toISOString(),
        })
        .where(eq(orders.id, order[0].id));
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}
