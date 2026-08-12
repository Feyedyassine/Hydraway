"use client";

import { useEffect, useMemo, useState } from "react";
import { X, Link2, Check, ArrowLeft, ArrowRight, AlertCircle } from "lucide-react";
import { useToast } from "../toast";
import {
  MAX_QTY_PER_LINE,
  PROMOTION_SLUG_REGEX,
  computeActivationQuantity,
  slugify,
  type PromotionType,
} from "@/lib/promotions";

export interface AdminProduct {
  id: number;
  name: string;
  nameFr: string;
  price: number;
  active: boolean;
  sku: string | null;
  stockbridgeProductId: string | null;
}

export interface EditablePromotion {
  id: number;
  name: string;
  slug: string;
  type: PromotionType;
  triggerProductId: number;
  triggerQuantity: number;
  discountPercent: number | null;
  giftProductId: number | null;
  giftQuantity: number | null;
  headline: string;
  headlineFr: string;
  description: string | null;
  descriptionFr: string | null;
  ogImage: string | null;
  startsAt: string | null;
  expiresAt: string | null;
}

type FormState = {
  name: string;
  slug: string;
  slugTouched: boolean;
  type: PromotionType;
  triggerProductId: number | "";
  triggerQuantity: string;
  discountPercent: string;
  giftProductId: number | "";
  giftQuantity: string;
  headline: string;
  headlineFr: string;
  description: string;
  descriptionFr: string;
  ogImage: string;
  startsAt: string;
  expiresAt: string;
};

const emptyForm: FormState = {
  name: "",
  slug: "",
  slugTouched: false,
  type: "percentage",
  triggerProductId: "",
  triggerQuantity: "1",
  discountPercent: "",
  giftProductId: "",
  giftQuantity: "1",
  headline: "",
  headlineFr: "",
  description: "",
  descriptionFr: "",
  ogImage: "",
  startsAt: "",
  expiresAt: "",
};

const STEP_ONE_FIELDS = [
  "name",
  "triggerProductId",
  "triggerQuantity",
  "discountPercent",
  "giftProductId",
  "giftQuantity",
] as const;

function toDateInput(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  return Number.isFinite(d.getTime()) ? d.toISOString().slice(0, 10) : "";
}

const money = (n: number) => `${n.toFixed(2)} TND`;

function FieldError({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <p className="mt-1 flex items-center gap-1 text-xs text-red-600">
      <AlertCircle size={12} />
      {message}
    </p>
  );
}

export default function PromotionForm({
  products,
  editing,
  presetTriggerProductId,
  onClose,
  onSaved,
}: {
  products: AdminProduct[];
  editing?: EditablePromotion | null;
  presetTriggerProductId?: number;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState<FormState>(emptyForm);
  const [step, setStep] = useState<1 | 2>(1);
  const [touched, setTouched] = useState<Set<string>>(new Set());
  const [attempted, setAttempted] = useState(false);
  const [saving, setSaving] = useState(false);
  const toast = useToast();

  useEffect(() => {
    if (editing) {
      setForm({
        name: editing.name,
        slug: editing.slug,
        slugTouched: true,
        type: editing.type,
        triggerProductId: editing.triggerProductId,
        triggerQuantity: String(editing.triggerQuantity),
        discountPercent:
          editing.discountPercent !== null ? String(editing.discountPercent) : "",
        giftProductId: editing.giftProductId ?? "",
        giftQuantity: editing.giftQuantity !== null ? String(editing.giftQuantity) : "1",
        headline: editing.headline,
        headlineFr: editing.headlineFr,
        description: editing.description ?? "",
        descriptionFr: editing.descriptionFr ?? "",
        ogImage: editing.ogImage ?? "",
        startsAt: toDateInput(editing.startsAt),
        expiresAt: toDateInput(editing.expiresAt),
      });
    } else {
      setForm({ ...emptyForm, triggerProductId: presetTriggerProductId ?? "" });
    }
  }, [editing, presetTriggerProductId]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const sellable = products.filter((p) => p.active);
  const triggerProduct = products.find((p) => p.id === form.triggerProductId);
  const giftProduct = products.find((p) => p.id === form.giftProductId);

  const triggerQuantity = parseInt(form.triggerQuantity, 10) || 0;
  const giftQuantity = parseInt(form.giftQuantity, 10) || 0;
  const percent = parseFloat(form.discountPercent) || 0;
  const isGift = form.type === "bxgy";
  const crossProduct = isGift && !!giftProduct && giftProduct.id !== triggerProduct?.id;

  const activationQuantity = useMemo(() => {
    if (!form.triggerProductId || triggerQuantity < 1) return null;
    return computeActivationQuantity({
      type: form.type,
      triggerProductId: form.triggerProductId as number,
      triggerQuantity,
      giftProductId: isGift ? (form.giftProductId as number) || null : null,
      giftQuantity: isGift ? giftQuantity : null,
    });
  }, [form.type, form.triggerProductId, form.giftProductId, triggerQuantity, giftQuantity, isGift]);

  /** Concrete money for the smallest qualifying cart — the whole point of the preview. */
  const preview = useMemo(() => {
    if (!triggerProduct || activationQuantity === null) return null;
    if (isGift && (!giftProduct || giftQuantity < 1)) return null;
    if (!isGift && percent <= 0) return null;

    const triggerSubtotal = triggerProduct.price * activationQuantity;
    const giftSubtotal = crossProduct ? (giftProduct?.price ?? 0) * giftQuantity : 0;
    const was = triggerSubtotal + giftSubtotal;

    let discount = 0;
    if (!isGift) discount = (triggerSubtotal * percent) / 100;
    else if (crossProduct) discount = giftSubtotal;
    else discount = giftQuantity * triggerProduct.price;

    discount = Math.round(discount * 100) / 100;
    return {
      lines: [
        { qty: activationQuantity, name: triggerProduct.name, free: 0 },
        ...(crossProduct && giftProduct
          ? [{ qty: giftQuantity, name: giftProduct.name, free: giftQuantity }]
          : []),
      ],
      was: Math.round(was * 100) / 100,
      now: Math.round((was - discount) * 100) / 100,
      discount,
      percentOff: was > 0 ? Math.round((discount / was) * 100) : 0,
    };
  }, [triggerProduct, giftProduct, activationQuantity, isGift, crossProduct, percent, giftQuantity]);

  const suggestions = useMemo(() => {
    if (!triggerProduct || activationQuantity === null) return { en: "", fr: "" };
    // French agrees with the quantity — "1 acheté", "2 achetés".
    const bought = `acheté${triggerQuantity > 1 ? "s" : ""}`;
    const offered = `offert${giftQuantity > 1 ? "s" : ""}`;

    if (!isGift) {
      return {
        en: `Buy ${triggerQuantity}, save ${percent}%`,
        fr: `${triggerQuantity} ${bought}, −${percent}%`,
      };
    }
    if (crossProduct && giftProduct) {
      return {
        en: `Buy ${triggerQuantity} ${triggerProduct.name}, get ${giftProduct.name} free`,
        fr: `${triggerQuantity} ${triggerProduct.nameFr} ${bought}, ${giftProduct.nameFr} offert`,
      };
    }
    return {
      en: `Buy ${triggerQuantity}, get ${giftQuantity} free`,
      fr: `${triggerQuantity} ${bought}, ${giftQuantity} ${offered}`,
    };
  }, [triggerProduct, giftProduct, activationQuantity, isGift, crossProduct, triggerQuantity, giftQuantity, percent]);

  const slug = form.slugTouched ? form.slug : slugify(form.name);

  // Same rule the API enforces — surfaced here so it explains itself before Save.
  const giftUnlinked =
    isGift && !!giftProduct && (!giftProduct.sku || !giftProduct.stockbridgeProductId);

  const errors = useMemo(() => {
    const e: Record<string, string> = {};
    if (form.name.trim().length < 3) e.name = "At least 3 characters";
    if (!form.triggerProductId) e.triggerProductId = "Pick a product";
    if (triggerQuantity < 1) e.triggerQuantity = "Must be 1 or more";
    if (!isGift && (percent <= 0 || percent > 100)) {
      e.discountPercent = "Between 1 and 100";
    }
    if (isGift) {
      if (!form.giftProductId) e.giftProductId = "Pick a product";
      if (giftQuantity < 1) e.giftQuantity = "Must be 1 or more";
      if (giftUnlinked) e.giftProductId = "Not linked to StockBridge";
    }
    if (activationQuantity !== null && activationQuantity > MAX_QTY_PER_LINE) {
      e.triggerQuantity = `Needs ${activationQuantity} units — over the ${MAX_QTY_PER_LINE} limit`;
    }
    if (!PROMOTION_SLUG_REGEX.test(slug)) e.slug = "3–64 characters: a–z, 0–9, dashes";
    if (!form.headline.trim()) e.headline = "Required";
    if (!form.headlineFr.trim()) e.headlineFr = "Required";
    if (form.startsAt && form.expiresAt && form.startsAt > form.expiresAt) {
      e.expiresAt = "Ends before it starts";
    }
    return e;
  }, [form, slug, triggerQuantity, giftQuantity, percent, isGift, giftUnlinked, activationQuantity]);

  const showError = (field: string) =>
    (attempted || touched.has(field)) && errors[field] ? errors[field] : null;

  const blur = (field: string) =>
    setTouched((prev) => (prev.has(field) ? prev : new Set(prev).add(field)));

  const stepOneHasErrors = STEP_ONE_FIELDS.some((f) => errors[f]);

  const goToPage = () => {
    setAttempted(true);
    if (stepOneHasErrors) return;
    // Fill the copy from the rule so nobody faces two blank required fields.
    setForm((f) => ({
      ...f,
      headline: f.headline || suggestions.en,
      headlineFr: f.headlineFr || suggestions.fr,
    }));
    setAttempted(false);
    setStep(2);
  };

  const save = async () => {
    setAttempted(true);
    if (Object.keys(errors).length > 0) {
      if (stepOneHasErrors) setStep(1);
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/admin/promotions", {
        method: editing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editing?.id,
          name: form.name.trim(),
          slug,
          type: form.type,
          triggerProductId: form.triggerProductId || undefined,
          triggerQuantity,
          discountPercent: isGift ? null : percent,
          giftProductId: isGift ? form.giftProductId || null : null,
          giftQuantity: isGift ? giftQuantity : null,
          headline: form.headline.trim(),
          headlineFr: form.headlineFr.trim(),
          description: form.description.trim() || null,
          descriptionFr: form.descriptionFr.trim() || null,
          ogImage: form.ogImage.trim() || null,
          startsAt: form.startsAt
            ? new Date(form.startsAt + "T00:00:00").toISOString()
            : null,
          expiresAt: form.expiresAt
            ? new Date(form.expiresAt + "T23:59:59").toISOString()
            : null,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(editing ? "Promotion updated" : `Promotion "${data.name}" created`);
        onSaved();
        onClose();
      } else {
        toast.error(data.error || "Failed to save promotion");
      }
    } catch {
      toast.error("Failed to save promotion");
    } finally {
      setSaving(false);
    }
  };

  // Enter inside an input submits the form even with no submit button present,
  // so route that through the step guard rather than letting it save.
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (step === 2) save();
    else goToPage();
  };

  const field =
    "w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 outline-none transition-colors focus:border-gray-900 focus:ring-1 focus:ring-gray-900";
  const fieldError = "border-red-300 focus:border-red-500 focus:ring-red-500";
  const labelClass = "mb-1 block text-xs font-medium text-gray-600";

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="promotion-form-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
    >
      <form
        onSubmit={handleSubmit}
        className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-xl bg-white shadow-xl"
      >
        {/* Header */}
        <div className="shrink-0 border-b border-gray-100 px-6 pb-0 pt-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 id="promotion-form-title" className="text-lg font-bold text-gray-900">
              {editing ? "Edit promotion" : "New promotion"}
            </h2>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="rounded-lg p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700"
            >
              <X size={18} />
            </button>
          </div>

          <div className="flex gap-6">
            {[
              { n: 1 as const, label: "The deal" },
              { n: 2 as const, label: "Shareable page" },
            ].map(({ n, label }) => {
              const active = step === n;
              const done = step > n && !stepOneHasErrors;
              return (
                <button
                  key={n}
                  type="button"
                  onClick={() => (n === 1 ? setStep(1) : goToPage())}
                  aria-current={active ? "step" : undefined}
                  className={`-mb-px flex items-center gap-2 border-b-2 pb-3 text-sm font-medium transition-colors ${
                    active
                      ? "border-gray-900 text-gray-900"
                      : "border-transparent text-gray-400 hover:text-gray-700"
                  }`}
                >
                  <span
                    className={`flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-bold ${
                      active
                        ? "bg-gray-900 text-white"
                        : done
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-500"
                    }`}
                  >
                    {done ? <Check size={11} strokeWidth={3} /> : n}
                  </span>
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {step === 1 ? (
            <div className="space-y-5">
              {/* The rule, as a sentence */}
              <div className="rounded-xl border border-gray-200 bg-gray-50/70 p-4">
                <div className="flex flex-wrap items-center gap-2 text-sm text-gray-700">
                  <span>When a customer buys</span>
                  <input
                    aria-label="Quantity to buy"
                    type="number"
                    min={1}
                    value={form.triggerQuantity}
                    onChange={(e) => setForm({ ...form, triggerQuantity: e.target.value })}
                    onBlur={() => blur("triggerQuantity")}
                    className={`w-16 rounded-lg border bg-white px-2 py-1.5 text-center text-sm font-semibold outline-none focus:ring-1 ${
                      showError("triggerQuantity")
                        ? fieldError
                        : "border-gray-300 focus:border-gray-900 focus:ring-gray-900"
                    }`}
                  />
                  <span>×</span>
                  <select
                    aria-label="Product to buy"
                    value={form.triggerProductId}
                    onChange={(e) =>
                      setForm({ ...form, triggerProductId: Number(e.target.value) })
                    }
                    onBlur={() => blur("triggerProductId")}
                    className={`min-w-[180px] flex-1 rounded-lg border bg-white px-2 py-1.5 text-sm font-semibold outline-none focus:ring-1 ${
                      showError("triggerProductId")
                        ? fieldError
                        : "border-gray-300 focus:border-gray-900 focus:ring-gray-900"
                    }`}
                  >
                    <option value="">Choose a product…</option>
                    {sellable.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} · {p.price.toFixed(2)} TND
                      </option>
                    ))}
                  </select>
                </div>

                <FieldError message={showError("triggerQuantity")} />
                <FieldError message={showError("triggerProductId")} />

                <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-gray-700">
                  <span>they get</span>
                  <div className="inline-flex overflow-hidden rounded-lg border border-gray-300 bg-white">
                    {(
                      [
                        { value: "percentage" as const, label: "a discount" },
                        { value: "bxgy" as const, label: "a free product" },
                      ]
                    ).map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        aria-pressed={form.type === option.value}
                        onClick={() => setForm({ ...form, type: option.value })}
                        className={`px-3 py-1.5 text-sm font-medium transition-colors ${
                          form.type === option.value
                            ? "bg-gray-900 text-white"
                            : "text-gray-600 hover:bg-gray-50"
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>

                  {!isGift ? (
                    <div className="relative">
                      <input
                        aria-label="Discount percentage"
                        type="number"
                        min="1"
                        max="100"
                        step="0.01"
                        placeholder="25"
                        value={form.discountPercent}
                        onChange={(e) =>
                          setForm({ ...form, discountPercent: e.target.value })
                        }
                        onBlur={() => blur("discountPercent")}
                        className={`w-24 rounded-lg border bg-white px-2 py-1.5 pr-7 text-center text-sm font-semibold outline-none focus:ring-1 ${
                          showError("discountPercent")
                            ? fieldError
                            : "border-gray-300 focus:border-gray-900 focus:ring-gray-900"
                        }`}
                      />
                      <span className="pointer-events-none absolute inset-y-0 right-2.5 flex items-center text-xs text-gray-400">
                        %
                      </span>
                    </div>
                  ) : (
                    <>
                      <input
                        aria-label="Free quantity"
                        type="number"
                        min={1}
                        value={form.giftQuantity}
                        onChange={(e) => setForm({ ...form, giftQuantity: e.target.value })}
                        onBlur={() => blur("giftQuantity")}
                        className={`w-16 rounded-lg border bg-white px-2 py-1.5 text-center text-sm font-semibold outline-none focus:ring-1 ${
                          showError("giftQuantity")
                            ? fieldError
                            : "border-gray-300 focus:border-gray-900 focus:ring-gray-900"
                        }`}
                      />
                      <span>×</span>
                      <select
                        aria-label="Free product"
                        value={form.giftProductId}
                        onChange={(e) =>
                          setForm({ ...form, giftProductId: Number(e.target.value) })
                        }
                        onBlur={() => blur("giftProductId")}
                        className={`min-w-[160px] flex-1 rounded-lg border bg-white px-2 py-1.5 text-sm font-semibold outline-none focus:ring-1 ${
                          showError("giftProductId")
                            ? fieldError
                            : "border-gray-300 focus:border-gray-900 focus:ring-gray-900"
                        }`}
                      >
                        <option value="">Choose a product…</option>
                        {sellable.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name} · {p.price.toFixed(2)} TND
                          </option>
                        ))}
                      </select>
                      <span>free</span>
                    </>
                  )}
                </div>

                <FieldError message={showError("discountPercent")} />
                <FieldError message={showError("giftQuantity")} />
                {!giftUnlinked && <FieldError message={showError("giftProductId")} />}

                <p className="mt-3 text-xs leading-relaxed text-gray-500">
                  Applies by itself from the cart — customers never type a code. While it
                  applies, promo codes give no extra discount.
                </p>
              </div>

              {giftUnlinked && (
                <div className="flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs leading-relaxed text-amber-900">
                  <Link2 size={15} className="mt-0.5 shrink-0" />
                  <span>
                    <span className="font-semibold">{giftProduct?.name}</span> isn&apos;t
                    linked to StockBridge. Link it on the Products page first — otherwise
                    orders using this promotion never reach the warehouse, while customers
                    still see a success screen.
                  </span>
                </div>
              )}

              {/* Live preview */}
              {preview && activationQuantity !== null && (
                <div className="rounded-xl border border-gray-200 p-4">
                  <p className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                    What the customer sees
                  </p>
                  <div className="space-y-1.5">
                    {preview.lines.map((l, i) => (
                      <div key={i} className="flex items-center justify-between text-sm">
                        <span className="text-gray-700">
                          {l.qty} × {l.name}
                          {l.free > 0 && (
                            <span className="ml-2 rounded-full bg-green-100 px-2 py-0.5 text-[11px] font-semibold text-green-700">
                              free
                            </span>
                          )}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 flex items-baseline gap-2 border-t border-gray-100 pt-3">
                    <span className="text-xl font-bold text-gray-900">
                      {money(preview.now)}
                    </span>
                    <span className="text-sm text-gray-400 line-through">
                      {money(preview.was)}
                    </span>
                    <span className="ml-auto text-sm font-semibold text-green-700">
                      saves {money(preview.discount)}
                      {preview.percentOff > 0 && ` (${preview.percentOff}%)`}
                    </span>
                  </div>
                  <p className="mt-3 text-xs leading-relaxed text-gray-500">
                    Fires as soon as the cart holds{" "}
                    <span className="font-semibold text-gray-700">
                      {activationQuantity} × {triggerProduct?.name}
                    </span>
                    {activationQuantity > triggerQuantity &&
                      " — the free unit sits in the cart too"}
                    . Larger carts get it once, never repeated.
                  </p>
                </div>
              )}

              <div>
                <label htmlFor="promo-name" className={labelClass}>
                  Name
                </label>
                <input
                  id="promo-name"
                  autoFocus
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  onBlur={() => blur("name")}
                  placeholder="Pack of 2 — 25% off"
                  className={`${field} ${showError("name") ? fieldError : ""}`}
                />
                <FieldError message={showError("name")} />
                <p className="mt-1 text-[11px] text-gray-400">
                  Shown to customers on the cart and checkout discount line.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-5">
              <div>
                <label htmlFor="promo-slug" className={labelClass}>
                  Shareable link
                </label>
                <div
                  className={`flex items-center rounded-lg border bg-white transition-colors focus-within:ring-1 ${
                    showError("slug")
                      ? "border-red-300 focus-within:border-red-500 focus-within:ring-red-500"
                      : "border-gray-200 focus-within:border-gray-900 focus-within:ring-gray-900"
                  }`}
                >
                  <span className="select-none py-2 pl-3 text-sm text-gray-400">
                    /offre/
                  </span>
                  <input
                    id="promo-slug"
                    value={slug}
                    onChange={(e) =>
                      setForm({ ...form, slug: slugify(e.target.value), slugTouched: true })
                    }
                    onBlur={() => blur("slug")}
                    placeholder="pack-de-2"
                    className="flex-1 rounded-r-lg bg-transparent py-2 pr-3 font-mono text-sm text-gray-900 outline-none"
                  />
                </div>
                <FieldError message={showError("slug")} />
                <p className="mt-1 text-[11px] text-gray-400">
                  This is the page you post on Facebook or Instagram. Keep it stable once
                  shared — changing it breaks links already out there.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label htmlFor="promo-headline-fr" className={labelClass}>
                    Headline (FR)
                  </label>
                  <input
                    id="promo-headline-fr"
                    value={form.headlineFr}
                    onChange={(e) => setForm({ ...form, headlineFr: e.target.value })}
                    onBlur={() => blur("headlineFr")}
                    className={`${field} ${showError("headlineFr") ? fieldError : ""}`}
                  />
                  <FieldError message={showError("headlineFr")} />
                </div>
                <div>
                  <label htmlFor="promo-headline" className={labelClass}>
                    Headline (EN)
                  </label>
                  <input
                    id="promo-headline"
                    value={form.headline}
                    onChange={(e) => setForm({ ...form, headline: e.target.value })}
                    onBlur={() => blur("headline")}
                    className={`${field} ${showError("headline") ? fieldError : ""}`}
                  />
                  <FieldError message={showError("headline")} />
                </div>
                <div>
                  <label htmlFor="promo-desc-fr" className={labelClass}>
                    Description (FR) <span className="text-gray-400">· optional</span>
                  </label>
                  <textarea
                    id="promo-desc-fr"
                    rows={3}
                    value={form.descriptionFr}
                    onChange={(e) => setForm({ ...form, descriptionFr: e.target.value })}
                    className={field}
                  />
                </div>
                <div>
                  <label htmlFor="promo-desc" className={labelClass}>
                    Description (EN) <span className="text-gray-400">· optional</span>
                  </label>
                  <textarea
                    id="promo-desc"
                    rows={3}
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    className={field}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="promo-og" className={labelClass}>
                  Social preview image <span className="text-gray-400">· optional</span>
                </label>
                <input
                  id="promo-og"
                  value={form.ogImage}
                  onChange={(e) => setForm({ ...form, ogImage: e.target.value })}
                  placeholder="/images/..."
                  className={field}
                />
                <p className="mt-1 text-[11px] text-gray-400">
                  The picture shown when the link is pasted into a post. Falls back to the
                  product image.
                </p>
              </div>

              <div>
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                  Schedule <span className="text-gray-300">· optional</span>
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="promo-start" className={labelClass}>
                      Starts
                    </label>
                    <input
                      id="promo-start"
                      type="date"
                      value={form.startsAt}
                      onChange={(e) => setForm({ ...form, startsAt: e.target.value })}
                      className={field}
                    />
                  </div>
                  <div>
                    <label htmlFor="promo-end" className={labelClass}>
                      Ends
                    </label>
                    <input
                      id="promo-end"
                      type="date"
                      value={form.expiresAt}
                      onChange={(e) => setForm({ ...form, expiresAt: e.target.value })}
                      onBlur={() => blur("expiresAt")}
                      className={`${field} ${showError("expiresAt") ? fieldError : ""}`}
                    />
                    <FieldError message={showError("expiresAt")} />
                  </div>
                </div>
                <p className="mt-2 text-[11px] leading-relaxed text-gray-400">
                  Leave empty to run until you turn it off. Dates let you queue the next
                  campaign while this one is still running.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex shrink-0 items-center justify-between gap-3 border-t border-gray-100 px-6 py-4">
          {step === 2 ? (
            <button
              type="button"
              onClick={() => setStep(1)}
              className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-gray-500 transition-colors hover:bg-gray-50 hover:text-gray-900"
            >
              <ArrowLeft size={15} />
              Back
            </button>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-3 py-2 text-sm font-medium text-gray-500 transition-colors hover:bg-gray-50 hover:text-gray-900"
            >
              Cancel
            </button>
          )}

          {/* Always type="button", never type="submit". React reuses this DOM
              node across steps, so a submit type here would be adopted by the
              in-flight click that advanced the step — saving the promotion on
              the very click meant to move to step 2. */}
          {step === 1 ? (
            <button
              key="continue"
              type="button"
              onClick={goToPage}
              className="flex items-center gap-1.5 rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-800"
            >
              Continue
              <ArrowRight size={15} />
            </button>
          ) : (
            <button
              key="save"
              type="button"
              onClick={save}
              disabled={saving}
              className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-800 disabled:opacity-50"
            >
              {saving ? "Saving…" : editing ? "Save changes" : "Create promotion"}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
