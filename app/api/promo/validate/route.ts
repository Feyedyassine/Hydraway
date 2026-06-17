import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { promoCodes } from "@/lib/db/schema";
import {
  PROMO_CODE_REGEX,
  evaluatePromo,
  normalizeCode,
} from "@/lib/promo";
import { eq } from "drizzle-orm";

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as { code?: string; subtotal?: number };
    const code = body.code ? normalizeCode(body.code) : "";
    const subtotal = Number(body.subtotal);

    if (!PROMO_CODE_REGEX.test(code) || !Number.isFinite(subtotal)) {
      return NextResponse.json({ valid: false, reason: "unknown" }, { status: 200 });
    }

    const [promo] = await db
      .select()
      .from(promoCodes)
      .where(eq(promoCodes.code, code))
      .limit(1);

    const result = evaluatePromo(promo, subtotal);
    if (!result.ok) {
      return NextResponse.json({ valid: false, reason: result.reason });
    }
    return NextResponse.json({
      valid: true,
      code,
      type: promo.type,
      value: promo.value,
      discount: result.discount,
    });
  } catch {
    return NextResponse.json({ valid: false, reason: "unknown" }, { status: 200 });
  }
}
