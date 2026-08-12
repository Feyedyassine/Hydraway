/**
 * Automatic promotions — evaluated identically on the client (live cart
 * display) and on the server (authoritative, at order time).
 *
 * Rules, as agreed with the team:
 *  - A promotion is product-specific and fires on total units of its trigger
 *    product in the cart (`activationQuantity`), "at least", not "exactly".
 *  - It applies once per order — never repeated for larger carts.
 *  - At most one promotion applies to an order. The creation-time uniqueness
 *    gate rules out same-product collisions; across products the highest
 *    customer value wins.
 *  - A cross-product gift (buy sticks, get a tote) only applies if the gift
 *    line is actually in the cart. Removing it forfeits the gift — the server
 *    never invents a line the customer didn't see.
 */

export type PromotionType = "percentage" | "bxgy";

/**
 * Hard cap on units per cart line, enforced at order time. A promotion whose
 * activation quantity exceeds it could never fire, so creation rejects those.
 */
export const MAX_QTY_PER_LINE = 20;

/**
 * Minimum shape the evaluator needs. Satisfied both by a DB row joined with
 * the gift product's price and by the trimmed payload `/api/promotions/active`
 * sends to the cart.
 */
export type EvaluablePromotion = {
  id: number;
  slug: string;
  name: string;
  type: PromotionType;
  triggerProductId: number;
  triggerQuantity: number;
  activationQuantity: number;
  discountPercent: number | null;
  giftProductId: number | null;
  giftQuantity: number | null;
  /** Unit price of the gift product, needed to value a gift that isn't in the cart yet. */
  giftPrice: number | null;
  startsAt: string | null;
  expiresAt: string | null;
  active: boolean;
  deletedAt: string | null;
};

export type EvalLine = {
  productId: number;
  quantity: number;
  price: number;
};

export type FreeUnits = {
  productId: number;
  quantity: number;
};

export type AppliedPromotion = {
  promotionId: number;
  slug: string;
  name: string;
  type: PromotionType;
  triggerProductId: number;
  /** TND taken off the product subtotal. */
  discount: number;
  freeUnits: FreeUnits[];
};

/** A gift line the cart should add so a qualifying promotion can apply. */
export type GiftGrant = {
  promotionId: number;
  productId: number;
  quantity: number;
};

export type EvaluationResult = {
  applied: AppliedPromotion | null;
  /** Set when the winning promotion needs a gift line the cart doesn't have yet. */
  grant: GiftGrant | null;
};

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export function isLive(promo: EvaluablePromotion, now: Date): boolean {
  if (!promo.active || promo.deletedAt) return false;
  if (promo.startsAt && new Date(promo.startsAt) > now) return false;
  if (promo.expiresAt && new Date(promo.expiresAt) < now) return false;
  return true;
}

type Candidate = {
  promo: EvaluablePromotion;
  /** What this promotion is worth to the customer — used to pick a winner. */
  value: number;
  applied: AppliedPromotion | null;
  grant: GiftGrant | null;
};

function describe(promo: EvaluablePromotion) {
  return {
    promotionId: promo.id,
    slug: promo.slug,
    name: promo.name,
    type: promo.type,
    triggerProductId: promo.triggerProductId,
  };
}

/**
 * What a single promotion would do to this cart, or null if it doesn't fire.
 */
function candidateFor(
  promo: EvaluablePromotion,
  lines: EvalLine[]
): Candidate | null {
  const triggerLine = lines.find((l) => l.productId === promo.triggerProductId);
  if (!triggerLine || triggerLine.quantity < promo.activationQuantity) {
    return null;
  }

  if (promo.type === "percentage") {
    const percent = promo.discountPercent ?? 0;
    if (percent <= 0) return null;
    // Scoped to the trigger product's line — a cart-wide percentage would leak
    // the discount onto unrelated products.
    const discount = round2(
      triggerLine.price * triggerLine.quantity * (percent / 100)
    );
    if (discount <= 0) return null;
    return {
      promo,
      value: discount,
      applied: { ...describe(promo), discount, freeUnits: [] },
      grant: null,
    };
  }

  const giftProductId = promo.giftProductId;
  const giftQuantity = promo.giftQuantity ?? 0;
  if (!giftProductId || giftQuantity <= 0) return null;

  // Same product: the customer added X + Y themselves, the last Y are free.
  if (giftProductId === promo.triggerProductId) {
    const free = Math.min(
      giftQuantity,
      triggerLine.quantity - promo.triggerQuantity
    );
    if (free <= 0) return null;
    const discount = round2(free * triggerLine.price);
    return {
      promo,
      value: discount,
      applied: {
        ...describe(promo),
        discount,
        freeUnits: [{ productId: giftProductId, quantity: free }],
      },
      grant: null,
    };
  }

  // Different product: discount whatever gift units are in the cart, capped at
  // the promised quantity. If the customer trims the line to 1, that 1 is free.
  const giftLine = lines.find((l) => l.productId === giftProductId);
  if (giftLine) {
    const free = Math.min(giftQuantity, giftLine.quantity);
    if (free <= 0) return null;
    const discount = round2(free * giftLine.price);
    return {
      promo,
      value: discount,
      applied: {
        ...describe(promo),
        discount,
        freeUnits: [{ productId: giftProductId, quantity: free }],
      },
      grant: null,
    };
  }

  // Gift isn't in the cart. Value it so it can compete for the win, but leave
  // the actual granting to the cart — the server never adds lines by itself.
  const giftPrice = promo.giftPrice ?? 0;
  if (giftPrice <= 0) return null;
  return {
    promo,
    value: round2(giftQuantity * giftPrice),
    applied: null,
    grant: {
      promotionId: promo.id,
      productId: giftProductId,
      quantity: giftQuantity,
    },
  };
}

/**
 * Pick the single promotion that applies to this cart.
 *
 * `declined` holds promotion ids whose granted gift line the customer removed —
 * without it the cart would re-add the gift the moment they delete it.
 */
export function evaluatePromotions(
  lines: EvalLine[],
  promos: EvaluablePromotion[],
  now: Date = new Date(),
  declined: number[] = []
): EvaluationResult {
  const candidates = promos
    .filter((p) => isLive(p, now))
    .map((p) => candidateFor(p, lines))
    .filter((c): c is Candidate => c !== null)
    .filter((c) => !(c.grant && declined.includes(c.promo.id)));

  if (candidates.length === 0) return { applied: null, grant: null };

  candidates.sort(
    (a, b) =>
      b.value - a.value ||
      b.promo.activationQuantity - a.promo.activationQuantity ||
      a.promo.id - b.promo.id
  );

  const winner = candidates[0];
  return { applied: winner.applied, grant: winner.grant };
}

/** Which promotion ids currently qualify, regardless of gift-line presence. */
export function qualifyingIds(
  lines: EvalLine[],
  promos: EvaluablePromotion[],
  now: Date = new Date()
): number[] {
  return promos
    .filter((p) => isLive(p, now))
    .filter((p) => candidateFor(p, lines) !== null)
    .map((p) => p.id);
}

export type NextTier = {
  promo: EvaluablePromotion;
  productId: number;
  unitsNeeded: number;
  projectedDiscount: number;
};

/**
 * The cheapest upgrade available to this cart — "add 1 more and save 25%".
 * Only considers products already in the cart.
 */
export function nextTier(
  lines: EvalLine[],
  promos: EvaluablePromotion[],
  now: Date = new Date()
): NextTier | null {
  const options: NextTier[] = [];

  for (const promo of promos) {
    if (!isLive(promo, now)) continue;
    const triggerLine = lines.find(
      (l) => l.productId === promo.triggerProductId
    );
    if (!triggerLine) continue;
    const unitsNeeded = promo.activationQuantity - triggerLine.quantity;
    if (unitsNeeded <= 0) continue;

    // Value it at the quantity that would unlock it.
    const projected = candidateFor(promo, [
      ...lines.filter((l) => l.productId !== promo.triggerProductId),
      { ...triggerLine, quantity: promo.activationQuantity },
    ]);
    if (!projected) continue;

    options.push({
      promo,
      productId: promo.triggerProductId,
      unitsNeeded,
      projectedDiscount: projected.value,
    });
  }

  if (options.length === 0) return null;
  options.sort(
    (a, b) => a.unitsNeeded - b.unitsNeeded || b.projectedDiscount - a.projectedDiscount
  );
  return options[0];
}

/**
 * Spread an applied promotion across cart lines.
 * Returns free units per product id — the shape `order_items.freeQuantity`
 * and the cart UI both need.
 */
export function freeUnitsByProduct(
  applied: AppliedPromotion | null
): Map<number, number> {
  const map = new Map<number, number>();
  if (!applied) return map;
  for (const unit of applied.freeUnits) {
    map.set(unit.productId, (map.get(unit.productId) ?? 0) + unit.quantity);
  }
  return map;
}

export type ProductTier = {
  promotionId: number;
  /** Units of the product the customer takes to get this price. */
  quantity: number;
  /** What they pay for the whole bundle. */
  total: number;
  undiscounted: number;
  discount: number;
  percentOff: number;
  /** Price per unit at this tier — the honest way to compare tiers. */
  perUnit: number;
  giftProductId: number | null;
  giftQuantity: number | null;
};

/**
 * Every live tier available for a product, cheapest quantity first.
 *
 * Unlike `nextTier` this ignores the cart entirely, so a product page can
 * advertise its volume pricing before anything has been added.
 */
export function tiersFor(
  productId: number,
  unitPrice: number,
  promos: EvaluablePromotion[],
  now: Date = new Date()
): ProductTier[] {
  const tiers: ProductTier[] = [];

  for (const promo of promos) {
    if (!isLive(promo, now)) continue;
    if (promo.triggerProductId !== productId) continue;

    const triggerSubtotal = unitPrice * promo.activationQuantity;
    const giftQuantity = promo.giftQuantity ?? 0;
    const crossGift =
      promo.type === "bxgy" &&
      promo.giftProductId !== null &&
      promo.giftProductId !== productId;
    const giftSubtotal = crossGift ? giftQuantity * (promo.giftPrice ?? 0) : 0;

    let discount = 0;
    if (promo.type === "percentage") {
      discount = (triggerSubtotal * (promo.discountPercent ?? 0)) / 100;
    } else if (crossGift) {
      discount = giftSubtotal;
    } else {
      discount = giftQuantity * unitPrice;
    }
    discount = round2(discount);
    if (discount <= 0) continue;

    const undiscounted = round2(triggerSubtotal + giftSubtotal);
    const total = round2(undiscounted - discount);

    tiers.push({
      promotionId: promo.id,
      quantity: promo.activationQuantity,
      total,
      undiscounted,
      discount,
      percentOff:
        undiscounted > 0 ? Math.round((discount / undiscounted) * 100) : 0,
      perUnit: round2(total / promo.activationQuantity),
      giftProductId: crossGift ? promo.giftProductId : null,
      giftQuantity: crossGift ? giftQuantity : null,
    });
  }

  return tiers.sort((a, b) => a.quantity - b.quantity);
}

/**
 * How much of an applied promotion's discount belongs to each product line.
 * Needed because StockBridge is billed per line: a discount concentrated on one
 * product must not be smeared across the others, or the COD amount collected
 * at delivery won't match what the customer was shown.
 */
export function lineDiscounts(
  applied: AppliedPromotion | null,
  lines: EvalLine[]
): Map<number, number> {
  const map = new Map<number, number>();
  if (!applied) return map;

  if (applied.type === "percentage") {
    map.set(applied.triggerProductId, applied.discount);
    return map;
  }

  for (const unit of applied.freeUnits) {
    const line = lines.find((l) => l.productId === unit.productId);
    if (!line) continue;
    map.set(
      unit.productId,
      round2((map.get(unit.productId) ?? 0) + unit.quantity * line.price)
    );
  }
  return map;
}

export const PROMOTION_SLUG_REGEX = /^[a-z0-9-]{3,64}$/;

export function slugify(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);
}

/**
 * Units of the trigger product a cart needs before the promotion fires.
 * Same-product BXGY needs X + Y in the cart (buy 2 get 1 = 3 sticks);
 * everything else fires at X.
 */
export function computeActivationQuantity(input: {
  type: PromotionType;
  triggerProductId: number;
  triggerQuantity: number;
  giftProductId: number | null;
  giftQuantity: number | null;
}): number {
  if (
    input.type === "bxgy" &&
    input.giftProductId === input.triggerProductId
  ) {
    return input.triggerQuantity + (input.giftQuantity ?? 0);
  }
  return input.triggerQuantity;
}
