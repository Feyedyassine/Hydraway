import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { products } from "@/lib/db/schema";
import { requireAuth } from "@/lib/auth";
import { listProducts, updateProduct as sbUpdateProduct, StockBridgeError } from "@/lib/stockbridge";
import { eq } from "drizzle-orm";

// GET /api/admin/products
export async function GET() {
  try {
    await requireAuth(["admin", "warehouse"]);
    const all = await db.select().from(products);

    const linkedIds = new Set(
      all.map((p) => p.stockbridgeProductId).filter((id): id is string => !!id)
    );

    let sbById = new Map<string, Awaited<ReturnType<typeof listProducts>>["data"][number]>();
    let stockbridgeError: string | null = null;

    if (linkedIds.size > 0) {
      try {
        const list = await listProducts({ limit: 100 });
        for (const p of list.data) {
          if (linkedIds.has(p.id)) sbById.set(p.id, p);
        }
      } catch (err) {
        stockbridgeError = err instanceof Error ? err.message : "StockBridge unreachable";
      }
    }

    const enriched = all.map((p) => {
      const sb = p.stockbridgeProductId ? sbById.get(p.stockbridgeProductId) ?? null : null;
      return {
        ...p,
        stockbridge: sb
          ? {
              id: sb.id,
              price_ht: sb.price_ht,
              stock_physical: sb.stock_physical,
              stock_reserved: sb.stock_reserved,
              stock_available: sb.stock_physical - sb.stock_reserved,
              is_low_stock: sb.is_low_stock,
              alert_threshold: sb.alert_threshold,
              updated_at: sb.updated_at,
            }
          : null,
      };
    });

    return NextResponse.json({
      products: enriched,
      stockbridgeError,
      syncedAt: new Date().toISOString(),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error";
    if (message === "Unauthorized" || message === "Forbidden") {
      return NextResponse.json({ error: message }, { status: 401 });
    }
    return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 });
  }
}

// POST /api/admin/products
export async function POST(req: NextRequest) {
  try {
    await requireAuth(["admin"]);
    const body = await req.json();

    const [product] = await db
      .insert(products)
      .values({
        name: body.name,
        nameFr: body.nameFr,
        description: body.description || null,
        descriptionFr: body.descriptionFr || null,
        price: body.price,
        sku: body.sku || null,
        stock: body.stock || 0,
        image: body.image || null,
        active: body.active ?? true,
      })
      .returning();

    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error";
    if (message === "Unauthorized" || message === "Forbidden") {
      return NextResponse.json({ error: message }, { status: 401 });
    }
    return NextResponse.json({ error: "Failed to create product" }, { status: 500 });
  }
}

// PUT /api/admin/products
export async function PUT(req: NextRequest) {
  try {
    await requireAuth(["admin"]);
    const body = await req.json();

    if (!body.id) {
      return NextResponse.json({ error: "Product ID required" }, { status: 400 });
    }

    const [updated] = await db
      .update(products)
      .set({
        name: body.name,
        nameFr: body.nameFr,
        description: body.description,
        descriptionFr: body.descriptionFr,
        price: body.price,
        sku: body.sku || null,
        stock: body.stock,
        image: body.image,
        active: body.active,
      })
      .where(eq(products.id, body.id))
      .returning();

    // Auto-push price/name/threshold to StockBridge for linked products.
    let stockbridgeWarning: string | null = null;
    if (updated.stockbridgeProductId) {
      try {
        await sbUpdateProduct(updated.stockbridgeProductId, {
          name: updated.name,
          price_ht: updated.price,
          tax_rate: 0, // Hydraway is VAT-exempt
        });
      } catch (err) {
        stockbridgeWarning =
          err instanceof StockBridgeError
            ? `${err.code}: ${err.message}`
            : err instanceof Error
              ? err.message
              : "Failed to push to StockBridge";
      }
    }

    return NextResponse.json({ ...updated, stockbridgeWarning });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error";
    if (message === "Unauthorized" || message === "Forbidden") {
      return NextResponse.json({ error: message }, { status: 401 });
    }
    return NextResponse.json({ error: "Failed to update product" }, { status: 500 });
  }
}

// DELETE /api/admin/products
export async function DELETE(req: NextRequest) {
  try {
    await requireAuth(["admin"]);
    const { id } = await req.json();

    await db.delete(products).where(eq(products.id, id));
    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error";
    if (message === "Unauthorized" || message === "Forbidden") {
      return NextResponse.json({ error: message }, { status: 401 });
    }
    return NextResponse.json({ error: "Failed to delete product" }, { status: 500 });
  }
}
