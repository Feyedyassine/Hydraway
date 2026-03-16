import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { orders } from "@/lib/db/schema";
import { verifyPayment } from "@/lib/flouci";
import { eq } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const orderId = searchParams.get("payment_id");
  const failStatus = searchParams.get("status");

  if (!orderId) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  const order = await db
    .select()
    .from(orders)
    .where(eq(orders.id, parseInt(orderId)))
    .limit(1);

  if (!order.length || !order[0].flouciPaymentId) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  // If explicitly failed from fail_link redirect
  if (failStatus === "failed") {
    await db
      .update(orders)
      .set({
        paymentStatus: "failed",
        status: "cancelled",
        updatedAt: new Date().toISOString(),
      })
      .where(eq(orders.id, order[0].id));

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL!;
    return NextResponse.redirect(
      new URL(`${baseUrl}/?order=failed`)
    );
  }

  // Verify with Flouci API
  try {
    const verification = await verifyPayment(order[0].flouciPaymentId);

    if (verification.success && verification.result.status === "SUCCESS") {
      await db
        .update(orders)
        .set({
          paymentStatus: "paid",
          status: "confirmed",
          updatedAt: new Date().toISOString(),
        })
        .where(eq(orders.id, order[0].id));

      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL!;
      return NextResponse.redirect(
        new URL(`${baseUrl}/?order=success&id=${order[0].id}`)
      );
    } else {
      await db
        .update(orders)
        .set({
          paymentStatus: "failed",
          status: "cancelled",
          updatedAt: new Date().toISOString(),
        })
        .where(eq(orders.id, order[0].id));

      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL!;
      return NextResponse.redirect(
        new URL(`${baseUrl}/?order=failed`)
      );
    }
  } catch (error) {
    console.error("Payment verification error:", error);
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL!;
    return NextResponse.redirect(
      new URL(`${baseUrl}/?order=error`)
    );
  }
}
