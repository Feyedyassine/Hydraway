"use client";

import { useState, useEffect, useMemo } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useCart } from "@/lib/cart-context";
import { tiersFor } from "@/lib/promotions";
import Image from "next/image";
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
  ChevronRight,
} from "lucide-react";
import ScrollReveal from "./ScrollReveal";

const featureKeys = [
  { key: "sticks", icon: Package },
  { key: "soluble", icon: Droplets },
  { key: "sugarFree", icon: Ban },
  { key: "glutenFree", icon: WheatOff },
  { key: "vegan", icon: Leaf },
  { key: "colorant", icon: Palette },
] as const;

const steps = ["open", "pour", "mix"] as const;

interface Product {
  id: number;
  name: string;
  nameFr: string;
  price: number;
  stock: number;
  image: string | null;
}

export default function ProductShowcase() {
  const t = useTranslations("product");
  const h = useTranslations("howToUse");
  const locale = useLocale();
  const { addItem, updateQuantity, openDrawer, items, promotions } = useCart();
  const [howToOpen, setHowToOpen] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);

  const product = products[0];

  // Volume pricing for this product, so the offer is visible before anything
  // is added to the cart — the drawer nudge fires too late to shape the choice.
  const tiers = useMemo(
    () => (product ? tiersFor(product.id, product.price, promotions) : []),
    [product, promotions]
  );
  // A single-box offer that genuinely lowers the box price reads as a plain
  // sale, so it belongs on the price itself rather than in the pack panel —
  // showing the list price and a "1 boîte" row underneath contradicts itself.
  // A gift at quantity 1 doesn't qualify: the box still costs full price.
  const saleTier = useMemo(
    () =>
      product
        ? tiers.find((tier) => tier.quantity === 1 && tier.total < product.price) ?? null
        : null,
    [tiers, product]
  );

  const packTiers = useMemo(
    () => tiers.filter((tier) => tier !== saleTier),
    [tiers, saleTier]
  );

  const bestTier = useMemo(
    () =>
      packTiers.length > 1
        ? packTiers.reduce((best, tier) => (tier.perUnit < best.perUnit ? tier : best))
        : null,
    [packTiers]
  );

  useEffect(() => {
    fetch("/api/products")
      .then((res) => res.json())
      .then(setProducts)
      .catch(() => {});
  }, []);

  const handleAddToCart = () => {
    if (!product) return;
    addItem({
      productId: product.id,
      name: product.name,
      nameFr: product.nameFr,
      price: product.price,
      stock: product.stock,
      image: product.image,
    });
  };

  /** Take an offer: set the cart to exactly the quantity that unlocks it. */
  const claimTier = (quantity: number) => {
    if (!product || product.stock <= 0) return;
    const target = Math.min(quantity, product.stock);
    if (items.some((i) => i.productId === product.id)) {
      updateQuantity(product.id, target);
      openDrawer();
      return;
    }
    handleAddToCart();
    if (target > 1) updateQuantity(product.id, target);
  };

  return (
    <section id="produit" className="relative overflow-hidden bg-white py-24 lg:py-32">
      {/* Subtle accent */}
      <div className="absolute -top-64 right-0 h-[500px] w-[500px] rounded-full bg-brand-red/[0.03] blur-[100px]" />

      <div className="mx-auto max-w-7xl px-5 lg:px-8">
        <div className="grid grid-cols-1 items-center gap-16 lg:grid-cols-2">
          {/* Left — Images */}
          <ScrollReveal direction="left">
            <div className="relative">
              {/* Main product image */}
              <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-navy/5 to-ice/40">
                <Image
                  src="/images/sticks-duo.png"
                  alt="HydraWay Sticks"
                  width={600}
                  height={500}
                  className="h-auto w-full object-cover"
                />
              </div>

              {/* Overlapping smaller image */}
              <div className="absolute -bottom-6 -right-4 w-40 overflow-hidden rounded-2xl border-4 border-white shadow-2xl shadow-navy/10 sm:w-52 lg:-right-8">
                <Image
                  src="/images/stick-single.png"
                  alt="HydraWay Stick"
                  width={240}
                  height={200}
                  className="h-auto w-full object-cover"
                />
              </div>

            </div>
          </ScrollReveal>

          {/* Right — Product info */}
          <ScrollReveal direction="right">
            <div className="flex flex-col gap-6">
              {/* Section label */}
              <div className="flex items-center gap-3">
                <div className="h-px w-8 bg-gradient-to-r from-brand-red to-accent-pink" />
                <span className="text-xs font-bold uppercase tracking-[0.2em] text-brand-red">
                  {t("title")}
                </span>
              </div>

              {/* Product name */}
              <h2 className="font-heading text-4xl font-extrabold tracking-tight text-navy sm:text-5xl">
                {t("subtitle")}
              </h2>

              {/* Description */}
              <p className="max-w-md text-lg leading-relaxed text-navy/50">
                {t("description")}
              </p>

              {/* Feature pills — compact flowing layout */}
              <div className="flex flex-wrap gap-2.5">
                {featureKeys.map(({ key, icon: Icon }) => (
                  <div
                    key={key}
                    className="flex items-center gap-2 rounded-full border border-navy/[0.07] bg-ice-light/60 px-3.5 py-2 transition-colors duration-200 hover:border-brand-red/20 hover:bg-ice/50"
                  >
                    <Icon size={14} className="text-brand-red/70" strokeWidth={2} />
                    <span className="text-xs font-semibold text-navy/65">{t(`features.${key}`)}</span>
                  </div>
                ))}
              </div>

              {/* Offers — phrased as an action, and tappable: each one drops
                  its own quantity straight into the cart. */}
              {packTiers.length > 0 && (
                <div className="flex flex-col gap-2.5 pt-2">
                  <div className="flex items-center gap-3">
                    <div className="h-px w-8 bg-gradient-to-r from-brand-red to-accent-pink" />
                    <span className="text-xs font-bold uppercase tracking-[0.2em] text-brand-red">
                      {t("tiersTitle")}
                    </span>
                  </div>

                  {packTiers.map((tier) => {
                    const gift = tier.giftProductId
                      ? promotions.find((p) => p.id === tier.promotionId)?.giftProduct
                      : null;
                    const giftName = gift
                      ? (locale === "fr" ? gift.nameFr : gift.name) ?? ""
                      : "";
                    const isBest = bestTier?.promotionId === tier.promotionId;

                    return (
                      <button
                        key={tier.promotionId}
                        type="button"
                        onClick={() => claimTier(tier.quantity)}
                        disabled={!product || product.stock <= 0}
                        className={`group relative flex items-center gap-4 rounded-2xl border-2 px-5 py-4 text-left transition-all duration-300 disabled:cursor-not-allowed disabled:opacity-50 ${
                          isBest
                            ? "border-brand-red bg-brand-red/[0.04] hover:bg-brand-red/[0.07]"
                            : "border-navy/[0.08] bg-white hover:border-brand-red/40 hover:bg-brand-red/[0.02]"
                        }`}
                      >
                        {isBest && (
                          <span className="absolute -top-2.5 left-4 rounded-full bg-brand-red px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                            {t("tierBest")}
                          </span>
                        )}

                        <div className="flex-1">
                          <p className="font-heading text-lg font-extrabold leading-tight text-navy">
                            {gift
                              ? t("tierBuyGift", {
                                  count: tier.quantity,
                                  product: giftName,
                                })
                              : t("tierBuy", {
                                  count: tier.quantity,
                                  price: tier.total.toFixed(2),
                                })}
                          </p>
                          <p className="mt-0.5 text-xs font-medium text-navy/45">
                            {gift
                              ? `${tier.total.toFixed(2)} TND`
                              : t("tierPerUnit", { price: tier.perUnit.toFixed(2) })}
                          </p>
                        </div>

                        <span className="shrink-0 rounded-full bg-brand-red px-3.5 py-1.5 text-sm font-bold text-white">
                          −{tier.percentOff}%
                        </span>
                        <ChevronRight
                          size={18}
                          className="shrink-0 text-navy/20 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:text-brand-red"
                          strokeWidth={2.5}
                        />
                      </button>
                    );
                  })}

                  <p className="text-[11px] leading-relaxed text-navy/35">
                    {t("tiersNote")}
                  </p>
                </div>
              )}

              {/* Price + CTA */}
              <div className="flex flex-wrap items-end gap-6 pt-2">
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-navy/40">
                    {t("price")}
                  </span>
                  {saleTier && product ? (
                    <>
                      <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
                        <span className="font-heading text-4xl font-extrabold text-brand-red">
                          {saleTier.total.toFixed(2)}
                        </span>
                        <span className="text-lg font-semibold text-brand-red/60">
                          TND
                        </span>
                        <span className="text-lg font-medium text-navy/30 line-through">
                          {product.price.toFixed(2)}
                        </span>
                        <span className="rounded-full bg-brand-red/10 px-2 py-0.5 text-xs font-bold text-brand-red">
                          −{saleTier.percentOff}%
                        </span>
                      </div>
                      <span className="mt-0.5 block text-[11px] text-navy/35">
                        {t("tiersNote")}
                      </span>
                    </>
                  ) : (
                    <div className="flex items-baseline gap-2">
                      <span className="font-heading text-4xl font-extrabold text-navy">
                        {product?.price.toFixed(2) ?? "—"}
                      </span>
                      <span className="text-lg font-semibold text-navy/40">TND</span>
                    </div>
                  )}
                </div>
                <button
                  onClick={handleAddToCart}
                  disabled={!product || product.stock <= 0}
                  className="group flex items-center gap-3 rounded-full bg-navy px-8 py-4 text-base font-semibold text-white shadow-lg shadow-navy/20 transition-all duration-300 hover:bg-navy-light hover:shadow-navy/30 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <ShoppingCart size={18} strokeWidth={2} />
                  {product && product.stock <= 0 ? t("outOfStock") : t("addToCart")}
                </button>
              </div>

              {/* Trust bar — recommendation + certifications */}
              <div className="mt-1 flex flex-col gap-3 rounded-2xl border border-navy/[0.06] bg-navy/[0.02] px-5 py-4">
                {/* Recommendation */}
                <div className="flex items-center gap-2.5">
                  <Clock size={14} className="text-navy/30" strokeWidth={2} />
                  <span className="text-xs font-semibold text-navy/50">
                    {t("recommendation")}
                  </span>
                </div>

                <div className="h-px bg-navy/[0.05]" />

                {/* Certifications */}
                <div className="flex items-start gap-2.5">
                  <ShieldCheck size={14} className="mt-0.5 shrink-0 text-emerald-600/70" strokeWidth={2} />
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

              {/* How to use — collapsible */}
              <div className="rounded-2xl border border-navy/[0.06] bg-navy/[0.02]">
                <button
                  onClick={() => setHowToOpen(!howToOpen)}
                  className="flex w-full items-center justify-between px-5 py-4 text-left"
                >
                  <span className="text-xs font-bold uppercase tracking-[0.15em] text-navy/50">
                    {h("title")}
                  </span>
                  <ChevronDown
                    size={16}
                    className={`text-navy/30 transition-transform duration-300 ${howToOpen ? "rotate-180" : ""}`}
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
                          <div key={step} className="flex flex-col items-center gap-2 text-center">
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

              {/* Disclaimer */}
              <p className="text-[11px] leading-relaxed text-navy/30">
                {t("supplement")}
              </p>
            </div>
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
}
