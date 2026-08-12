"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { useCart } from "@/lib/cart-context";
import { fbTrack } from "@/lib/fb-pixel";
import {
  Package,
  Droplets,
  Ban,
  WheatOff,
  Leaf,
  Palette,
  ShoppingCart,
  ShieldCheck,
  Clock,
  ChevronDown,
  Gift,
} from "lucide-react";

const featureKeys = [
  { key: "sticks", icon: Package },
  { key: "soluble", icon: Droplets },
  { key: "sugarFree", icon: Ban },
  { key: "glutenFree", icon: WheatOff },
  { key: "vegan", icon: Leaf },
  { key: "colorant", icon: Palette },
] as const;

const steps = ["open", "pour", "mix"] as const;

export type OfferProduct = {
  productId: number;
  name: string;
  nameFr: string;
  price: number;
  image: string | null;
  stock: number;
};

/**
 * The buying panel of the offer page — mirrors the homepage product section,
 * with the promotion's pricing already applied.
 */
export default function OfferPanel({
  product,
  quantity,
  headline,
  description,
  giftLabel,
  was,
  now,
  discount,
  live,
  promotionSlug,
  promotionName,
}: {
  product: OfferProduct;
  quantity: number;
  headline: string;
  description: string | null;
  giftLabel: string | null;
  was: number;
  now: number;
  discount: number;
  live: boolean;
  promotionSlug: string;
  promotionName: string;
}) {
  const t = useTranslations("product");
  const h = useTranslations("howToUse");
  const o = useTranslations("offer");
  const { addItem, updateQuantity, openDrawer, items } = useCart();
  const [howToOpen, setHowToOpen] = useState(false);
  const viewTracked = useRef(false);

  useEffect(() => {
    if (viewTracked.current || !live) return;
    viewTracked.current = true;
    fbTrack("ViewContent", {
      content_ids: [String(product.productId)],
      content_name: promotionName,
      content_category: `promotion:${promotionSlug}`,
      content_type: "product",
      value: now,
      currency: "TND",
    });
  }, [live, product.productId, now, promotionSlug, promotionName]);

  const soldOut = product.stock <= 0;

  const claim = () => {
    if (soldOut) return;
    const target = Math.min(quantity, product.stock);
    if (items.some((i) => i.productId === product.productId)) {
      updateQuantity(product.productId, target);
      openDrawer();
      return;
    }
    addItem(product);
    if (target > 1) updateQuantity(product.productId, target);
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Offer label */}
      <div className="flex items-center gap-3">
        <div className="h-px w-8 bg-gradient-to-r from-brand-red to-accent-pink" />
        <span className="text-xs font-bold uppercase tracking-[0.2em] text-brand-red">
          {live ? o("badge") : o("expiredTitle")}
        </span>
      </div>

      <h1 className="font-heading text-4xl font-extrabold tracking-tight text-navy sm:text-5xl">
        {headline}
      </h1>

      <p className="max-w-md text-lg leading-relaxed text-navy/50">
        {description || t("description")}
      </p>

      {/* What's in the offer */}
      <div className="flex flex-col gap-2 rounded-2xl border border-navy/[0.06] bg-ice-light/50 px-5 py-4">
        <div className="flex items-center justify-between gap-4">
          <span className="text-sm font-semibold text-navy">
            {quantity} × {product.nameFr}
          </span>
          <span className="text-sm font-medium text-navy/40">
            {(product.price * quantity).toFixed(2)} TND
          </span>
        </div>
        {giftLabel && (
          <div className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-2 text-sm font-semibold text-green-700">
              <Gift size={14} />
              {giftLabel}
            </span>
            <span className="text-sm font-bold uppercase tracking-wide text-green-700">
              {o("freeTag")}
            </span>
          </div>
        )}
      </div>

      {/* Feature pills */}
      <div className="flex flex-wrap gap-2.5">
        {featureKeys.map(({ key, icon: Icon }) => (
          <div
            key={key}
            className="flex items-center gap-2 rounded-full border border-navy/[0.07] bg-ice-light/60 px-3.5 py-2 transition-colors duration-200 hover:border-brand-red/20 hover:bg-ice/50"
          >
            <Icon size={14} className="text-brand-red/70" strokeWidth={2} />
            <span className="text-xs font-semibold text-navy/65">
              {t(`features.${key}`)}
            </span>
          </div>
        ))}
      </div>

      {/* Price + CTA */}
      <div className="flex flex-wrap items-end gap-6 pt-2">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-navy/40">
            {t("price")}
          </span>
          <div className="flex items-baseline gap-2.5">
            <span className="font-heading text-4xl font-extrabold text-navy">
              {now.toFixed(2)}
            </span>
            <span className="text-lg font-semibold text-navy/40">TND</span>
            {discount > 0 && (
              <span className="text-lg font-medium text-navy/25 line-through">
                {was.toFixed(2)}
              </span>
            )}
          </div>
          {discount > 0 && (
            <span className="mt-1 inline-block text-sm font-semibold text-green-700">
              {o("save", { amount: discount.toFixed(2) })}
            </span>
          )}
        </div>

        <button
          onClick={claim}
          disabled={!live || soldOut}
          className="group flex items-center gap-3 rounded-full bg-navy px-8 py-4 text-base font-semibold text-white shadow-lg shadow-navy/20 transition-all duration-300 hover:bg-navy-light hover:shadow-navy/30 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <ShoppingCart size={18} strokeWidth={2} />
          {!live ? o("expiredCta") : soldOut ? t("outOfStock") : o("claim")}
        </button>
      </div>

      <p className="-mt-2 text-xs text-navy/35">{o("shippingNote")}</p>

      {/* Trust bar */}
      <div className="mt-1 flex flex-col gap-3 rounded-2xl border border-navy/[0.06] bg-navy/[0.02] px-5 py-4">
        <div className="flex items-center gap-2.5">
          <Clock size={14} className="text-navy/30" strokeWidth={2} />
          <span className="text-xs font-semibold text-navy/50">
            {t("recommendation")}
          </span>
        </div>

        <div className="h-px bg-navy/[0.05]" />

        <div className="flex items-start gap-2.5">
          <ShieldCheck
            size={14}
            className="mt-0.5 shrink-0 text-emerald-600/70"
            strokeWidth={2}
          />
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <span className="text-xs font-semibold text-navy/50">
              {t("certifications.title")}
            </span>
            <span className="text-[11px] font-medium text-navy/35">
              {t("certifications.gmp")}
            </span>
            <span className="text-navy/15">·</span>
            <span className="text-[11px] font-medium text-navy/35">
              {t("certifications.fssc")}
            </span>
            <span className="text-navy/15">·</span>
            <span className="text-[11px] font-medium italic text-navy/40">
              {t("certifications.tagline")}
            </span>
          </div>
        </div>
      </div>

      {/* How to use */}
      <div className="rounded-2xl border border-navy/[0.06] bg-navy/[0.02]">
        <button
          onClick={() => setHowToOpen(!howToOpen)}
          aria-expanded={howToOpen}
          className="flex w-full items-center justify-between px-5 py-4 text-left"
        >
          <span className="text-xs font-bold uppercase tracking-[0.15em] text-navy/50">
            {h("title")}
          </span>
          <ChevronDown
            size={16}
            className={`text-navy/30 transition-transform duration-300 ${
              howToOpen ? "rotate-180" : ""
            }`}
            strokeWidth={2}
          />
        </button>
        <div
          className="grid transition-all duration-300"
          style={{ gridTemplateRows: howToOpen ? "1fr" : "0fr" }}
        >
          <div className="overflow-hidden">
            <div className="flex flex-col gap-4 px-5 pb-5">
              <div className="h-px bg-navy/[0.05]" />
              <div className="grid grid-cols-3 gap-3">
                {steps.map((step, i) => (
                  <div
                    key={step}
                    className="flex flex-col items-center gap-2 text-center"
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-red/10">
                      <span className="text-sm font-bold text-brand-red">{i + 1}</span>
                    </div>
                    <span className="text-xs font-semibold text-navy/70">
                      {h(`steps.${step}.title`)}
                    </span>
                    <span className="text-[11px] leading-snug text-navy/40">
                      {h(`steps.${step}.description`)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <p className="text-[11px] leading-relaxed text-navy/30">{t("supplement")}</p>
    </div>
  );
}
