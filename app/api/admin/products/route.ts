import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { products } from "@/lib/db/schema";
import { requireAuth } from "@/lib/auth";
import { eq } from "drizzle-orm";

// GET /api/admin/products
export async function GET() {
  try {
    await requireAuth();
    const all = await db.select().from(products);
    return NextResponse.json(all);
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
        stock: body.stock,
        image: body.image,
        active: body.active,
      })
      .where(eq(products.id, body.id))
      .returning();

    return NextResponse.json(updated);
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
