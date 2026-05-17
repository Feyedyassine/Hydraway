"use client";

import { useState, useEffect, useRef } from "react";
import { useTranslations, useLocale } from "next-intl";
import Script from "next/script";
import { ShoppingBag, Minus, Plus, CreditCard, Truck } from "lucide-react";

declare global {
  interface Window {
    turnstile?: {
      render: (selector: string | HTMLElement, options: Record<string, unknown>) => string;
      reset: (widgetId?: string) => void;
    };
  }
}

interface Product {
  id: number;
  name: string;
  nameFr: string;
  price: number;
  stock: number;
  image: string | null;
}

const GOVERNORATES = [
  "Ariana", "Béja", "Ben Arous", "Bizerte", "Gabès", "Gafsa", "Jendouba",
  "Kairouan", "Kasserine", "Kébili", "Le Kef", "Mahdia", "La Manouba",
  "Médenine", "Monastir", "Nabeul", "Sfax", "Sidi Bouzid", "Siliana",
  "Sousse", "Tataouine", "Tozeur", "Tunis", "Zaghouan",
];

export default function OrderForm() {
  const t = useTranslations("order");
  const locale = useLocale();
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<Record<number, number>>({});
  const [step, setStep] = useState<"cart" | "info" | "done">("cart");
  const [paymentMethod, setPaymentMethod] = useState<"cod" | "flouci">("cod");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ success: boolean; orderId?: number } | null>(null);

  const [client, setClient] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    governorate: "",
    postalCode: "",
  });
  const [hp, setHp] = useState(""); // honeypot
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const turnstileMounted = useRef(false);
  const turnstileWidgetId = useRef<string | null>(null);

  const SHIPPING_FEE = 9.5;

  const renderTurnstile = () => {
    const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
    if (!siteKey || turnstileMounted.current || !window.turnstile) return;
    const container = document.getElementById("turnstile-orderform");
    if (!container) return;
    turnstileWidgetId.current = window.turnstile.render(container, {
      sitekey: siteKey,
      callback: (token: string) => setTurnstileToken(token),
      "expired-callback": () => setTurnstileToken(null),
      "error-callback": () => setTurnstileToken(null),
    });
    turnstileMounted.current = true;
  };

  useEffect(() => {
    if (step === "info" && window.turnstile) renderTurnstile();
  }, [step]);

  useEffect(() => {
    fetch("/api/products")
      .then((res) => res.json())
      .then((data) => {
        setProducts(data);
        // Default: 1 of first product
        if (data.length > 0) {
          setCart({ [data[0].id]: 1 });
        }
      })
      .catch(() => {});
  }, []);

  const updateQty = (productId: number, delta: number) => {
    setCart((prev) => {
      const current = prev[productId] || 0;
      const next = Math.max(0, current + delta);
      if (next === 0) {
        const { [productId]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [productId]: next };
    });
  };

  const total = Object.entries(cart).reduce((sum, [id, qty]) => {
    const product = products.find((p) => p.id === Number(id));
    return sum + (product?.price || 0) * qty;
  }, 0);

  const cartEmpty = Object.keys(cart).length === 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (hp) return; // honeypot tripped
    if (!turnstileToken) {
      alert("Please complete the verification.");
      return;
    }
    setSubmitting(true);

    try {
      const items = Object.entries(cart).map(([id, quantity]) => ({
        productId: Number(id),
        quantity,
      }));

      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ client, items, paymentMethod, turnstileToken, hp }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "Order failed");
        if (window.turnstile && turnstileWidgetId.current) {
          window.turnstile.reset(turnstileWidgetId.current);
          setTurnstileToken(null);
        }
        return;
      }

      // If Flouci, redirect to payment page
      if (data.paymentUrl) {
        window.location.href = data.paymentUrl;
        return;
      }

      // COD success
      setResult({ success: true, orderId: data.orderId });
      setStep("done");
    } catch {
      alert("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (step === "done" && result?.success) {
    return (
      <section id="commander" className="bg-ice-light/50 py-24 lg:py-32">
        <div className="mx-auto max-w-xl px-5 text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <ShoppingBag size={28} className="text-green-600" />
          </div>
          <h2 className="mb-2 font-heading text-3xl font-bold text-navy">{t("successTitle")}</h2>
          <p className="text-navy/50">{t("successMessage", { id: result.orderId ?? 0 })}</p>
        </div>
      </section>
    );
  }

  return (
    <section id="commander" className="bg-ice-light/50 py-24 lg:py-32">
      <div className="mx-auto max-w-3xl px-5 lg:px-8">
        <div className="mb-12 text-center">
          <h2 className="font-heading text-4xl font-extrabold tracking-tight text-navy sm:text-5xl">
            {t("title")}
          </h2>
          <p className="mt-4 text-lg text-navy/50">{t("subtitle")}</p>
        </div>

        <div className="overflow-hidden rounded-3xl bg-white shadow-xl shadow-navy/5">
          {/* Step indicator */}
          <div className="flex border-b">
            <button
              onClick={() => step === "info" && setStep("cart")}
              className={`flex-1 py-4 text-center text-sm font-semibold transition-colors ${
                step === "cart" ? "bg-navy text-white" : "text-navy/40 hover:text-navy/60"
              }`}
            >
              1. {t("stepCart")}
            </button>
            <button
              disabled={cartEmpty}
              className={`flex-1 py-4 text-center text-sm font-semibold transition-colors ${
                step === "info" ? "bg-navy text-white" : "text-navy/40"
              }`}
            >
              2. {t("stepInfo")}
            </button>
          </div>

          <div className="p-6 sm:p-8">
            {step === "cart" && (
              <div>
                {/* Product list */}
                {products.map((product) => {
                  const qty = cart[product.id] || 0;
                  return (
                    <div
                      key={product.id}
                      className="flex items-center justify-between border-b border-gray-100 py-4 last:border-0"
                    >
                      <div>
                        <p className="font-semibold text-navy">
                          {locale === "fr" ? product.nameFr : product.name}
                        </p>
                        <p className="text-sm text-navy/50">{product.price.toFixed(2)} TND</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => updateQty(product.id, -1)}
                          className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 text-gray-500 hover:bg-gray-50"
                        >
                          <Minus size={14} />
                        </button>
                        <span className="w-8 text-center font-semibold text-navy">{qty}</span>
                        <button
                          onClick={() => updateQty(product.id, 1)}
                          disabled={qty >= product.stock}
                          className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-30"
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                    </div>
                  );
                })}

                {/* Total */}
                <div className="mt-6 flex items-center justify-between rounded-xl bg-ice-light px-5 py-4">
                  <span className="font-semibold text-navy">{t("total")}</span>
                  <span className="text-xl font-bold text-navy">{total.toFixed(2)} TND</span>
                </div>

                <button
                  onClick={() => setStep("info")}
                  disabled={cartEmpty}
                  className="mt-6 w-full rounded-full border border-brand-red/60 bg-transparent py-4 text-base font-semibold text-navy transition-all hover:bg-brand-red/10 disabled:opacity-30"
                >
                  {t("continue")}
                </button>
              </div>
            )}

            {step === "info" && (
              <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-navy/70">
                      {t("firstName")} *
                    </label>
                    <input
                      required
                      value={client.firstName}
                      onChange={(e) => setClient({ ...client, firstName: e.target.value })}
                      className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-navy"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-navy/70">
                      {t("lastName")} *
                    </label>
                    <input
                      required
                      value={client.lastName}
                      onChange={(e) => setClient({ ...client, lastName: e.target.value })}
                      className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-navy"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-navy/70">
                      {t("phone")} *
                    </label>
                    <input
                      required
                      type="tel"
                      value={client.phone}
                      onChange={(e) => setClient({ ...client, phone: e.target.value })}
                      className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-navy"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-navy/70">
                      {t("email")}
                    </label>
                    <input
                      type="email"
                      value={client.email}
                      onChange={(e) => setClient({ ...client, email: e.target.value })}
                      className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-navy"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="mb-1 block text-sm font-medium text-navy/70">
                      {t("address")} *
                    </label>
                    <input
                      required
                      value={client.address}
                      onChange={(e) => setClient({ ...client, address: e.target.value })}
                      className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-navy"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-navy/70">
                      {t("city")} *
                    </label>
                    <input
                      required
                      value={client.city}
                      onChange={(e) => setClient({ ...client, city: e.target.value })}
                      className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-navy"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-navy/70">
                      {t("governorate")} *
                    </label>
                    <select
                      required
                      value={client.governorate}
                      onChange={(e) => setClient({ ...client, governorate: e.target.value })}
                      className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-navy"
                    >
                      <option value="">{t("selectGovernorate")}</option>
                      {GOVERNORATES.map((g) => (
                        <option key={g} value={g}>
                          {g}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-navy/70">
                      {t("postalCode")} *
                    </label>
                    <input
                      required
                      inputMode="numeric"
                      pattern="[0-9]{4}"
                      maxLength={4}
                      placeholder="1002"
                      value={client.postalCode}
                      onChange={(e) =>
                        setClient({
                          ...client,
                          postalCode: e.target.value.replace(/\D/g, "").slice(0, 4),
                        })
                      }
                      className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-navy"
                    />
                  </div>
                </div>

                {/* Payment method */}
                <div className="mt-6">
                  <label className="mb-3 block text-sm font-semibold text-navy">
                    {t("paymentMethod")}
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod("cod")}
                      className={`flex items-center gap-3 rounded-xl border-2 px-4 py-3.5 text-left text-sm font-medium transition-all ${
                        paymentMethod === "cod"
                          ? "border-navy bg-navy/5 text-navy"
                          : "border-gray-200 text-gray-500 hover:border-gray-300"
                      }`}
                    >
                      <Truck size={20} />
                      {t("cod")}
                    </button>
                    <button
                      type="button"
                      disabled
                      aria-disabled="true"
                      className="relative flex cursor-not-allowed items-center gap-3 rounded-xl border-2 border-gray-200 bg-gray-50 px-4 py-3.5 text-left text-sm font-medium text-gray-400"
                    >
                      <CreditCard size={20} />
                      {t("flouci")}
                      <span className="absolute -top-2 right-2 rounded-full bg-navy/80 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-white">
                        {t("comingSoon")}
                      </span>
                    </button>
                  </div>
                </div>

                {/* Summary */}
                <div className="mt-6 space-y-1.5 rounded-xl bg-ice-light px-5 py-4">
                  <div className="flex justify-between text-sm text-navy/60">
                    <span>{t("subtotal")}</span>
                    <span className="font-semibold text-navy">{total.toFixed(2)} TND</span>
                  </div>
                  <div className="flex justify-between text-sm text-navy/60">
                    <span>{t("shipping")}</span>
                    <span className="font-semibold text-navy">{SHIPPING_FEE.toFixed(2)} TND</span>
                  </div>
                  <div className="mt-2 flex justify-between border-t border-navy/10 pt-2 text-sm">
                    <span className="font-semibold text-navy">{t("total")}</span>
                    <span className="font-bold text-navy">
                      {(total + SHIPPING_FEE).toFixed(2)} TND
                    </span>
                  </div>
                  <p className="pt-1 text-[11px] text-navy/40">{t("shippingNote")}</p>
                </div>

                {/* Honeypot */}
                <input
                  type="text"
                  name="company"
                  tabIndex={-1}
                  autoComplete="off"
                  value={hp}
                  onChange={(e) => setHp(e.target.value)}
                  aria-hidden="true"
                  className="absolute h-0 w-0 overflow-hidden border-0 p-0 opacity-0"
                  style={{ position: "absolute", left: "-9999px" }}
                />

                {/* Turnstile */}
                <div className="mt-6 flex justify-center">
                  <div id="turnstile-orderform" />
                </div>

                <div className="mt-6 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setStep("cart")}
                    className="rounded-full border border-gray-200 px-6 py-3.5 text-sm font-medium text-navy/60 hover:bg-gray-50"
                  >
                    {t("back")}
                  </button>
                  <button
                    type="submit"
                    disabled={submitting || !turnstileToken}
                    className="flex-1 rounded-full border border-brand-red/60 bg-transparent py-3.5 text-base font-semibold text-navy transition-all hover:bg-brand-red/10 disabled:opacity-50"
                  >
                    {submitting ? t("processing") : t("placeOrder")}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js"
        strategy="afterInteractive"
        onLoad={renderTurnstile}
      />
    </section>
  );
}
