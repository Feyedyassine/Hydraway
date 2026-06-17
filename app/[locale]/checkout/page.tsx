"use client";

import { useState, useEffect, useRef } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useCart } from "@/lib/cart-context";
import { Link } from "@/i18n/navigation";
import Image from "next/image";
import Script from "next/script";
import { CreditCard, Banknote, ArrowLeft, ShoppingBag, ChevronDown, Tag, X } from "lucide-react";
import Navbar from "../components/Navbar";
import CartDrawer from "../components/CartDrawer";

declare global {
  interface Window {
    turnstile?: {
      render: (selector: string | HTMLElement, options: Record<string, unknown>) => string;
      reset: (widgetId?: string) => void;
    };
  }
}

const GOVERNORATES = [
  "Ariana", "Béja", "Ben Arous", "Bizerte", "Gabès", "Gafsa", "Jendouba",
  "Kairouan", "Kasserine", "Kébili", "Le Kef", "Mahdia", "La Manouba",
  "Médenine", "Monastir", "Nabeul", "Sfax", "Sidi Bouzid", "Siliana",
  "Sousse", "Tataouine", "Tozeur", "Tunis", "Zaghouan",
];

export default function CheckoutPage() {
  const t = useTranslations("checkout");
  const locale = useLocale();
  const { items, total, clearCart } = useCart();
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
  const [phoneError, setPhoneError] = useState("");
  const [hp, setHp] = useState(""); // honeypot
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [promoInput, setPromoInput] = useState("");
  const [promoApplied, setPromoApplied] = useState<{ code: string; discount: number } | null>(null);
  const [promoError, setPromoError] = useState("");
  const [promoApplying, setPromoApplying] = useState(false);
  const turnstileMounted = useRef(false);
  const turnstileWidgetId = useRef<string | null>(null);

  const SHIPPING_FEE = 9.5;
  const discount = promoApplied?.discount ?? 0;
  const discountedSubtotal = Math.max(0, total - discount);
  const grandTotal = discountedSubtotal + SHIPPING_FEE;

  const renderTurnstile = () => {
    const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
    if (!siteKey || turnstileMounted.current || !window.turnstile) return;
    const container = document.getElementById("turnstile-checkout");
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
    if (window.turnstile) renderTurnstile();
  }, []);

  const validatePhone = (phone: string): boolean => {
    const cleaned = phone.replace(/[\s\-().]/g, "");
    const match = cleaned.match(/^(?:\+216|00216)?(\d+)$/);
    if (!match) {
      setPhoneError(t("phoneInvalid"));
      return false;
    }
    const digits = match[1];
    if (digits.length !== 8) {
      setPhoneError(t("phoneLength"));
      return false;
    }
    if (!/^[2-57-9]/.test(digits)) {
      setPhoneError(t("phoneInvalid"));
      return false;
    }
    setPhoneError("");
    return true;
  };

  const handlePhoneChange = (value: string) => {
    setClient({ ...client, phone: value });
    if (phoneError) setPhoneError("");
  };

  const applyPromo = async () => {
    const code = promoInput.trim().toUpperCase();
    if (!code) return;
    setPromoApplying(true);
    setPromoError("");
    try {
      const res = await fetch("/api/promo/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, subtotal: total }),
      });
      const data = (await res.json()) as
        | { valid: true; code: string; discount: number }
        | { valid: false; reason: string };
      if (data.valid) {
        setPromoApplied({ code: data.code, discount: data.discount });
        setPromoInput("");
      } else {
        const map: Record<string, string> = {
          unknown: t("promoUnknown"),
          inactive: t("promoUnknown"),
          expired: t("promoExpired"),
          exhausted: t("promoExhausted"),
          invalid_subtotal: t("promoUnknown"),
        };
        setPromoError(map[data.reason] || t("promoUnknown"));
      }
    } catch {
      setPromoError(t("promoUnknown"));
    } finally {
      setPromoApplying(false);
    }
  };

  const removePromo = () => {
    setPromoApplied(null);
    setPromoError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validatePhone(client.phone)) return;
    if (hp) return; // honeypot tripped — silent reject
    if (!turnstileToken) {
      alert("Please complete the verification.");
      return;
    }
    setSubmitting(true);

    try {
      const orderItems = items.map((i) => ({
        productId: i.productId,
        quantity: i.quantity,
      }));

      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client,
          items: orderItems,
          paymentMethod,
          turnstileToken,
          hp,
          promoCode: promoApplied?.code,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "Order failed");
        // Reset Turnstile so user can retry
        if (window.turnstile && turnstileWidgetId.current) {
          window.turnstile.reset(turnstileWidgetId.current);
          setTurnstileToken(null);
        }
        return;
      }

      if (data.paymentUrl) {
        window.location.href = data.paymentUrl;
        return;
      }

      clearCart();
      setResult({ success: true, orderId: data.orderId });
    } catch {
      alert("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // Success state
  if (result?.success) {
    return (
      <>
        <Navbar />
        <CartDrawer />
        <div className="flex min-h-screen items-center justify-center bg-ice-light/30 px-5 pt-24">
          <div className="max-w-md text-center">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
              <ShoppingBag size={32} className="text-green-600" />
            </div>
            <h1 className="mb-3 font-heading text-3xl font-bold text-navy">
              {t("successTitle")}
            </h1>
            <p className="mb-8 text-navy/50">
              {t("successMessage", { id: result.orderId ?? 0 })}
            </p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-full bg-navy px-6 py-3 text-sm font-semibold text-white hover:bg-navy-light"
            >
              <ArrowLeft size={16} />
              {t("backHome")}
            </Link>
          </div>
        </div>
      </>
    );
  }

  // Empty cart
  if (items.length === 0 && !result) {
    return (
      <>
        <Navbar />
        <CartDrawer />
        <div className="flex min-h-screen items-center justify-center bg-ice-light/30 px-5 pt-24">
          <div className="max-w-md text-center">
            <ShoppingBag size={48} className="mx-auto mb-4 text-navy/10" />
            <h1 className="mb-3 font-heading text-2xl font-bold text-navy">
              {t("emptyCart")}
            </h1>
            <p className="mb-6 text-navy/40">{t("emptyCartMessage")}</p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-full bg-navy px-6 py-3 text-sm font-semibold text-white hover:bg-navy-light"
            >
              <ArrowLeft size={16} />
              {t("continueShopping")}
            </Link>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <CartDrawer />
      <div className="min-h-screen bg-ice-light/30 pt-28 pb-16">
        <div className="mx-auto max-w-5xl px-5 lg:px-8">
          {/* Back link */}
          <Link
            href="/"
            className="mb-8 inline-flex items-center gap-2 text-sm font-medium text-navy/40 transition-colors hover:text-navy"
          >
            <ArrowLeft size={16} />
            {t("continueShopping")}
          </Link>

          <h1 className="mb-8 font-heading text-3xl font-extrabold text-navy sm:text-4xl">
            {t("title")}
          </h1>

          <div className="grid grid-cols-1 gap-8 lg:grid-cols-5">
            {/* Left — Form */}
            <form onSubmit={handleSubmit} className="lg:col-span-3">
              <div className="rounded-2xl bg-white p-6 shadow-sm sm:p-8">
                <h2 className="mb-6 text-lg font-bold text-navy">{t("deliveryInfo")}</h2>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-navy/60">
                      {t("firstName")} *
                    </label>
                    <input
                      required
                      value={client.firstName}
                      onChange={(e) => setClient({ ...client, firstName: e.target.value })}
                      className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none transition-colors focus:border-navy"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-navy/60">
                      {t("lastName")} *
                    </label>
                    <input
                      required
                      value={client.lastName}
                      onChange={(e) => setClient({ ...client, lastName: e.target.value })}
                      className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none transition-colors focus:border-navy"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-navy/60">
                      {t("phone")} *
                    </label>
                    <input
                      required
                      type="tel"
                      placeholder="XX XXX XXX"
                      value={client.phone}
                      onChange={(e) => handlePhoneChange(e.target.value)}
                      className={`w-full rounded-xl border px-4 py-3 text-sm outline-none transition-colors focus:border-navy ${
                        phoneError ? "border-red-400" : "border-gray-200"
                      }`}
                    />
                    {phoneError && (
                      <p className="mt-1 text-xs text-red-500">{phoneError}</p>
                    )}
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-navy/60">
                      {t("email")} *
                    </label>
                    <input
                      required
                      type="email"
                      value={client.email}
                      onChange={(e) => setClient({ ...client, email: e.target.value })}
                      className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none transition-colors focus:border-navy"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="mb-1.5 block text-sm font-medium text-navy/60">
                      {t("address")} *
                    </label>
                    <input
                      required
                      value={client.address}
                      onChange={(e) => setClient({ ...client, address: e.target.value })}
                      className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none transition-colors focus:border-navy"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-navy/60">
                      {t("city")} *
                    </label>
                    <input
                      required
                      value={client.city}
                      onChange={(e) => setClient({ ...client, city: e.target.value })}
                      className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none transition-colors focus:border-navy"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-navy/60">
                      {t("governorate")} *
                    </label>
                    <div className="relative">
                      <select
                        required
                        value={client.governorate}
                        onChange={(e) => setClient({ ...client, governorate: e.target.value })}
                        className="w-full appearance-none rounded-xl border border-gray-200 px-4 py-3 pr-10 text-sm outline-none transition-colors focus:border-navy"
                      >
                        <option value="">{t("selectGovernorate")}</option>
                        {GOVERNORATES.map((g) => (
                          <option key={g} value={g}>{g}</option>
                        ))}
                      </select>
                      <ChevronDown size={16} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-navy/30" />
                    </div>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-navy/60">
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
                      className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none transition-colors focus:border-navy"
                    />
                  </div>
                </div>

                {/* Payment method */}
                <h2 className="mb-4 mt-8 text-lg font-bold text-navy">{t("paymentMethod")}</h2>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("cod")}
                    className={`flex items-center justify-center gap-2 rounded-xl border-2 px-4 py-4 text-sm font-semibold transition-all ${
                      paymentMethod === "cod"
                        ? "border-navy bg-navy/5 text-navy"
                        : "border-gray-200 text-gray-400 hover:border-gray-300"
                    }`}
                  >
                    <Banknote size={20} />
                    {t("cod")}
                  </button>
                  <button
                    type="button"
                    disabled
                    aria-disabled="true"
                    className="relative flex cursor-not-allowed items-center justify-center gap-2 rounded-xl border-2 border-gray-200 bg-gray-50 px-4 py-4 text-sm font-semibold text-gray-400"
                  >
                    <CreditCard size={20} />
                    {t("flouci")}
                    <span className="absolute -top-2 right-2 rounded-full bg-navy/80 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-white">
                      {t("comingSoon")}
                    </span>
                  </button>
                </div>

                {/* Honeypot — humans leave empty, bots fill it. Visually hidden, off-screen, autocomplete off. */}
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

                {/* Turnstile widget */}
                <div className="mt-8 flex justify-center">
                  <div id="turnstile-checkout" />
                </div>

                <button
                  type="submit"
                  disabled={submitting || !turnstileToken}
                  className="mt-6 w-full rounded-full bg-navy py-4 text-base font-semibold text-white transition-colors hover:bg-navy-light disabled:opacity-50"
                >
                  {submitting ? t("processing") : t("placeOrder")}
                </button>
              </div>
            </form>
            <Script
              src="https://challenges.cloudflare.com/turnstile/v0/api.js"
              strategy="afterInteractive"
              onLoad={renderTurnstile}
            />

            {/* Right — Order summary */}
            <div className="lg:col-span-2">
              <div className="sticky top-28 rounded-2xl bg-white p-6 shadow-sm">
                <h2 className="mb-5 text-lg font-bold text-navy">{t("summary")}</h2>

                <div className="space-y-4">
                  {items.map((item) => (
                    <div key={item.productId} className="flex gap-3">
                      {item.image && (
                        <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-gray-50">
                          <Image
                            src={item.image}
                            alt={locale === "fr" ? item.nameFr : item.name}
                            width={56}
                            height={56}
                            className="h-full w-full object-contain p-1"
                          />
                        </div>
                      )}
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-navy">
                          {locale === "fr" ? item.nameFr : item.name}
                        </p>
                        <p className="text-xs text-navy/40">x{item.quantity}</p>
                      </div>
                      <span className="text-sm font-semibold text-navy">
                        {(item.price * item.quantity).toFixed(2)} TND
                      </span>
                    </div>
                  ))}
                </div>

                <div className="my-5 h-px bg-gray-100" />

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-navy/60">{t("subtotal")}</span>
                    <span className="font-semibold text-navy">{total.toFixed(2)} TND</span>
                  </div>
                  {promoApplied && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-1.5 text-green-700">
                        <Tag size={13} />
                        {t("promoApplied")} ({promoApplied.code})
                      </span>
                      <span className="font-semibold text-green-700">
                        −{promoApplied.discount.toFixed(2)} TND
                      </span>
                    </div>
                  )}
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-navy/60">{t("shipping")}</span>
                    <span className="font-semibold text-navy">{SHIPPING_FEE.toFixed(2)} TND</span>
                  </div>
                  <p className="text-xs text-navy/40">{t("shippingNote")}</p>
                </div>

                {/* Promo code */}
                <div className="my-5 h-px bg-gray-100" />
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-navy/50">
                    {t("promoLabel")}
                  </label>
                  {promoApplied ? (
                    <div className="flex items-center justify-between rounded-xl bg-green-50 px-3 py-2.5">
                      <span className="text-sm font-mono font-semibold text-green-800">
                        {promoApplied.code}
                      </span>
                      <button
                        type="button"
                        onClick={removePromo}
                        className="flex items-center gap-1 text-xs font-medium text-green-700 hover:text-green-900"
                      >
                        <X size={14} />
                        {t("promoRemove")}
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={promoInput}
                          onChange={(e) =>
                            setPromoInput(
                              e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, "")
                            )
                          }
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              applyPromo();
                            }
                          }}
                          placeholder={t("promoPlaceholder")}
                          className="flex-1 rounded-xl border border-gray-200 px-3 py-2.5 font-mono text-sm outline-none focus:border-navy"
                        />
                        <button
                          type="button"
                          onClick={applyPromo}
                          disabled={!promoInput || promoApplying}
                          className="rounded-xl bg-navy px-4 py-2.5 text-sm font-semibold text-white hover:bg-navy-light disabled:opacity-40"
                        >
                          {promoApplying ? "…" : t("promoApply")}
                        </button>
                      </div>
                      {promoError && (
                        <p className="mt-1.5 text-xs text-red-500">{promoError}</p>
                      )}
                    </>
                  )}
                </div>

                <div className="my-5 h-px bg-gray-100" />

                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-navy/60">{t("total")}</span>
                  <span className="text-2xl font-bold text-navy">{grandTotal.toFixed(2)} TND</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
