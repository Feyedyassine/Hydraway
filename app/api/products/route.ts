import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { products } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

// GET /api/products — Public: fetch active products
export async function GET() {
  try {
    const activeProducts = await db
      .select()
      .from(products)
      .where(eq(products.active, true));

    return NextResponse.json(activeProducts);
  } catch {
    return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 });
  }
}
