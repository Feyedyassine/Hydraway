import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { products } from "@/lib/db/schema";
import { requireAuth } from "@/lib/auth";
import {
  createProduct,
  listProducts,
  StockBridgeError,
} from "@/lib/stockbridge";
import { eq } from "drizzle-orm";

export async function POST(req: NextRequest) {
  try {
    await requireAuth(["admin"]);
    const { productId, sku } = (await req.json()) as {
      productId: number;
      sku: string;
    };

    if (!productId || !sku) {
      return NextResponse.json(
        { error: "productId and sku are required" },
        { status: 400 }
      );
    }

    const [product] = await db
      .select()
      .from(products)
      .where(eq(products.id, productId))
      .limit(1);

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    // First try to find an existing StockBridge product with this SKU.
    const existing = await listProducts({ search: sku, limit: 20 });
    const match = existing.data.find((p) => p.sku === sku);

    let stockbridgeProductId: string;

    if (match) {
      stockbridgeProductId = match.id;
    } else {
      try {
        const created = await createProduct({
          sku,
          name: product.name,
          description: product.description ?? undefined,
          price_ht: product.price,
          tax_rate: 0, // VAT-exempt
          alert_threshold: 50,
        });
        stockbridgeProductId = created.id;
      } catch (err) {
        if (err instanceof StockBridgeError) {
          return NextResponse.json(
            {
              error: err.code,
              message: err.message,
              details: err.details,
            },
            { status: err.status }
          );
        }
        throw err;
      }
    }

    const [updated] = await db
      .update(products)
      .set({ sku, stockbridgeProductId })
      .where(eq(products.id, productId))
      .returning();

    return NextResponse.json({
      ...updated,
      matched: !!match,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error";
    if (message === "Unauthorized" || message === "Forbidden") {
      return NextResponse.json({ error: message }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Failed to sync product" },
      { status: 500 }
    );
  }
}
