import { promoCodes } from "@/lib/db/schema";

type PromoRow = typeof promoCodes.$inferSelect;

export const PROMO_CODE_REGEX = /^[A-Z0-9-]{3,32}$/;

export function normalizeCode(input: string): string {
  return input.trim().toUpperCase();
}

export type PromoCheckOk = {
  ok: true;
  discount: number;
};

export type PromoCheckErr = {
  ok: false;
  reason: "unknown" | "inactive" | "expired" | "exhausted" | "invalid_subtotal";
};

export function evaluatePromo(
  promo: PromoRow | undefined,
  subtotal: number
): PromoCheckOk | PromoCheckErr {
  if (!promo || promo.deletedAt) return { ok: false, reason: "unknown" };
  if (!promo.active) return { ok: false, reason: "inactive" };
  if (promo.expiresAt && new Date(promo.expiresAt) < new Date()) {
    return { ok: false, reason: "expired" };
  }
  if (
    promo.maxRedemptions !== null &&
    promo.redemptionsCount >= promo.maxRedemptions
  ) {
    return { ok: false, reason: "exhausted" };
  }
  if (subtotal <= 0) return { ok: false, reason: "invalid_subtotal" };

  let discount = 0;
  if (promo.type === "percentage") {
    discount = subtotal * (promo.value / 100);
  } else if (promo.type === "fixed") {
    discount = Math.min(promo.value, subtotal);
  }

  discount = Math.round(discount * 100) / 100;
  if (discount < 0) discount = 0;
  if (discount > subtotal) discount = subtotal;

  return { ok: true, discount };
}
