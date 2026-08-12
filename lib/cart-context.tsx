"use client";

import { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import { fbTrack } from "@/lib/fb-pixel";
import {
  evaluatePromotions,
  freeUnitsByProduct,
  nextTier,
  qualifyingIds,
  type AppliedPromotion,
  type EvalLine,
  type EvaluablePromotion,
  type NextTier,
} from "@/lib/promotions";

export interface CartItem {
  productId: number;
  name: string;
  nameFr: string;
  price: number;
  quantity: number;
  image: string | null;
  stock: number;
  /** Set when the cart added this line itself to satisfy a gift promotion. */
  grantedBy?: number;
}

/** Shape of /api/promotions/active — the evaluator's fields plus display bits. */
export interface ActivePromotion extends EvaluablePromotion {
  headline: string;
  headlineFr: string;
  giftProduct: {
    id: number;
    name: string | null;
    nameFr: string | null;
    price: number | null;
    image: string | null;
    stock: number | null;
  } | null;
}

interface CartContextType {
  items: CartItem[];
  drawerOpen: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
  addItem: (item: Omit<CartItem, "quantity">) => void;
  updateQuantity: (productId: number, quantity: number) => void;
  removeItem: (productId: number) => void;
  clearCart: () => void;
  /** Raw product subtotal, before any promotion. */
  total: number;
  count: number;
  promotion: AppliedPromotion | null;
  promotionDiscount: number;
  /** Subtotal after the promotion — still excludes shipping. */
  discountedTotal: number;
  /** Free units per product id, for rendering "offert" on a line. */
  freeUnits: Map<number, number>;
  upsell: NextTier | null;
  promotions: ActivePromotion[];
  /** False until /api/promotions/active answers — prices aren't final before then. */
  promotionsLoaded: boolean;
}

const CartContext = createContext<CartContextType | null>(null);

const CART_KEY = "hydraway-cart";
const DECLINED_KEY = "hydraway-declined-gifts";

/**
 * `declined` holds promotions whose granted gift the customer deleted. It lives
 * alongside the items so a single reconciliation can update both without two
 * setters racing each other.
 */
type CartState = {
  items: CartItem[];
  declined: number[];
};

function toLines(items: CartItem[]): EvalLine[] {
  return items.map((i) => ({
    productId: i.productId,
    quantity: i.quantity,
    price: i.price,
  }));
}

/**
 * Bring granted gift lines back in step with the cart after any change.
 *
 * Runs on every mutation rather than in an effect, so the cart only ever
 * renders a settled state — no flash of a gift that's about to be revoked.
 */
function reconcile(state: CartState, promotions: ActivePromotion[]): CartState {
  const now = new Date();

  // Only one promotion applies per order, so a gift is free only while its own
  // promotion is the one winning. Keeping it merely because it still qualifies
  // would let a richer promotion take over and quietly charge for the gift.
  const winner = evaluatePromotions(
    toLines(state.items),
    promotions,
    now,
    state.declined
  ).applied?.promotionId;

  // Take back exactly the units the cart granted.
  let items = state.items.flatMap((i) => {
    if (i.grantedBy === undefined || i.grantedBy === winner) return [i];
    const grantedQty =
      promotions.find((p) => p.id === i.grantedBy)?.giftQuantity ?? 1;
    const remaining = i.quantity - grantedQty;
    return remaining > 0
      ? [{ ...i, quantity: remaining, grantedBy: undefined }]
      : [];
  });

  // Forget stale declines: a cart that no longer qualifies should be offered
  // the gift again next time. Same reference when nothing changed, so React
  // can bail out of the update.
  const qualifying = new Set(qualifyingIds(toLines(items), promotions));
  const declined = state.declined.every((id) => qualifying.has(id))
    ? state.declined
    : state.declined.filter((id) => qualifying.has(id));

  // Grant the gift line the winning promotion needs. The server never adds
  // lines itself, so the customer always sees a gift before it can ship.
  const { grant } = evaluatePromotions(toLines(items), promotions, now, declined);
  if (grant && !items.some((i) => i.productId === grant.productId)) {
    const product = promotions.find((p) => p.id === grant.promotionId)?.giftProduct;
    const stock = product?.stock ?? 0;
    if (product && product.price !== null && stock > 0) {
      items = [
        ...items,
        {
          productId: product.id,
          name: product.name ?? "",
          nameFr: product.nameFr ?? product.name ?? "",
          price: product.price,
          quantity: Math.min(grant.quantity, stock),
          image: product.image,
          stock,
          grantedBy: grant.promotionId,
        },
      ];
    }
  }

  return { items, declined };
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<CartState>({ items: [], declined: [] });
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [promotions, setPromotions] = useState<ActivePromotion[]>([]);
  const [promotionsLoaded, setPromotionsLoaded] = useState(false);

  const { items } = cart;

  // Load from localStorage. Carts saved before promotions existed simply lack
  // the new fields, which read as undefined — no migration needed.
  useEffect(() => {
    try {
      const savedItems = localStorage.getItem(CART_KEY);
      const savedDeclined = localStorage.getItem(DECLINED_KEY);
      setCart({
        items: savedItems ? JSON.parse(savedItems) : [],
        declined: savedDeclined ? JSON.parse(savedDeclined) : [],
      });
    } catch {}
  }, []);

  useEffect(() => {
    localStorage.setItem(CART_KEY, JSON.stringify(cart.items));
    localStorage.setItem(DECLINED_KEY, JSON.stringify(cart.declined));
  }, [cart]);

  useEffect(() => {
    fetch("/api/promotions/active")
      .then((res) => (res.ok ? res.json() : []))
      .then((loaded: ActivePromotion[]) => {
        setPromotions(loaded);
        // Promotions arrive after the cart is restored, so reconcile once here
        // — a returning customer gets their gift line without touching anything.
        setCart((prev) => reconcile(prev, loaded));
      })
      .catch(() => {})
      .finally(() => setPromotionsLoaded(true));
  }, []);

  /** Apply a change to the items, then settle gift lines around it. */
  const mutate = useCallback(
    (
      update: (items: CartItem[]) => CartItem[],
      updateDeclined?: (declined: number[], items: CartItem[]) => number[]
    ) => {
      setCart((prev) =>
        reconcile(
          {
            items: update(prev.items),
            declined: updateDeclined
              ? updateDeclined(prev.declined, prev.items)
              : prev.declined,
          },
          promotions
        )
      );
    },
    [promotions]
  );

  const openDrawer = useCallback(() => setDrawerOpen(true), []);
  const closeDrawer = useCallback(() => setDrawerOpen(false), []);

  const addItem = useCallback(
    (item: Omit<CartItem, "quantity">) => {
      if (item.stock <= 0) return;
      fbTrack("AddToCart", {
        content_ids: [String(item.productId)],
        content_name: item.name,
        content_type: "product",
        value: item.price,
        currency: "TND",
      });
      mutate((prev) => {
        const existing = prev.find((i) => i.productId === item.productId);
        if (existing) {
          if (existing.quantity >= item.stock) return prev;
          return prev.map((i) =>
            i.productId === item.productId
              ? { ...i, quantity: Math.min(i.quantity + 1, item.stock) }
              : i
          );
        }
        return [...prev, { ...item, quantity: 1 }];
      });
      setDrawerOpen(true);
    },
    [mutate]
  );

  const removeItem = useCallback(
    (productId: number) => {
      mutate(
        (prev) => prev.filter((i) => i.productId !== productId),
        // Deleting a granted gift means declining it — without this the cart
        // would immediately grant it again and the line could never go away.
        (declined, prevItems) => {
          const line = prevItems.find((i) => i.productId === productId);
          if (line?.grantedBy === undefined || declined.includes(line.grantedBy)) {
            return declined;
          }
          return [...declined, line.grantedBy];
        }
      );
    },
    [mutate]
  );

  const updateQuantity = useCallback(
    (productId: number, quantity: number) => {
      if (quantity <= 0) {
        removeItem(productId);
        return;
      }
      mutate((prev) =>
        prev.map((i) =>
          i.productId === productId
            ? { ...i, quantity: Math.min(quantity, i.stock) }
            : i
        )
      );
    },
    [mutate, removeItem]
  );

  const clearCart = useCallback(() => setCart({ items: [], declined: [] }), []);

  const lines = useMemo(() => toLines(items), [items]);

  const evaluation = useMemo(
    () => evaluatePromotions(lines, promotions, new Date(), cart.declined),
    [lines, promotions, cart.declined]
  );

  const total = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const count = items.reduce((sum, i) => sum + i.quantity, 0);

  const promotion = evaluation.applied;
  const promotionDiscount = promotion?.discount ?? 0;
  const discountedTotal = Math.max(0, total - promotionDiscount);
  const freeUnits = useMemo(() => freeUnitsByProduct(promotion), [promotion]);
  const upsell = useMemo(() => nextTier(lines, promotions), [lines, promotions]);

  return (
    <CartContext.Provider
      value={{
        items,
        drawerOpen,
        openDrawer,
        closeDrawer,
        addItem,
        updateQuantity,
        removeItem,
        clearCart,
        total,
        count,
        promotion,
        promotionDiscount,
        discountedTotal,
        freeUnits,
        upsell,
        promotions,
        promotionsLoaded,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
