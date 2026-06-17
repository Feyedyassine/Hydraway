"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, ArrowLeft, Info } from "lucide-react";
import { useToast } from "../../toast";

interface Product {
  id: number;
  name: string;
  nameFr: string;
  price: number;
  stock: number;
  active: boolean;
}

const GOVERNORATES = [
  "Ariana", "Béja", "Ben Arous", "Bizerte", "Gabès", "Gafsa", "Jendouba",
  "Kairouan", "Kasserine", "Kébili", "Le Kef", "Mahdia", "La Manouba",
  "Médenine", "Monastir", "Nabeul", "Sfax", "Sidi Bouzid", "Siliana",
  "Sousse", "Tataouine", "Tozeur", "Tunis", "Zaghouan",
];

type Line = {
  uid: string;
  productId: number | "";
  quantity: number;
  unitPrice: number;
};

const newLine = (): Line => ({
  uid: Math.random().toString(36).slice(2),
  productId: "",
  quantity: 1,
  unitPrice: 0,
});

export default function NewBulkOrderPage() {
  const router = useRouter();
  const toast = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

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
  const [lines, setLines] = useState<Line[]>([newLine()]);
  const [shippingFee, setShippingFee] = useState("9.5");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    fetch("/api/admin/products")
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data) => {
        setProducts(
          (data.products as Product[]).filter((p) => p.active).sort((a, b) => a.name.localeCompare(b.name))
        );
      })
      .catch(() => toast.error("Failed to load products"))
      .finally(() => setLoading(false));
  }, [toast]);

  const productById = useMemo(() => {
    const map = new Map<number, Product>();
    products.forEach((p) => map.set(p.id, p));
    return map;
  }, [products]);

  const productsSubtotal = useMemo(
    () =>
      lines.reduce((sum, l) => {
        if (l.productId === "") return sum;
        return sum + (l.unitPrice || 0) * (l.quantity || 0);
      }, 0),
    [lines]
  );

  const fee = Number.parseFloat(shippingFee) || 0;
  const total = productsSubtotal + fee;

  const updateLine = (uid: string, patch: Partial<Line>) => {
    setLines((curr) =>
      curr.map((l) => {
        if (l.uid !== uid) return l;
        const merged = { ...l, ...patch };
        // When a product is picked, default the unit price to its retail price
        if (patch.productId !== undefined && patch.productId !== "") {
          const p = productById.get(Number(patch.productId));
          if (p && merged.unitPrice === 0) merged.unitPrice = p.price;
        }
        return merged;
      })
    );
  };

  const addLine = () => setLines((curr) => [...curr, newLine()]);
  const removeLine = (uid: string) =>
    setLines((curr) => (curr.length === 1 ? curr : curr.filter((l) => l.uid !== uid)));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Validate line items
    const validLines = lines.filter((l) => l.productId !== "");
    if (validLines.length === 0) {
      toast.error("Add at least one product");
      return;
    }
    for (const l of validLines) {
      if (l.quantity < 1) {
        toast.error("Quantity must be at least 1");
        return;
      }
      if (l.unitPrice < 0) {
        toast.error("Unit price cannot be negative");
        return;
      }
      const p = productById.get(Number(l.productId));
      if (p && l.quantity > p.stock) {
        toast.error(`${p.name}: only ${p.stock} in stock`);
        return;
      }
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/orders/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client,
          items: validLines.map((l) => ({
            productId: Number(l.productId),
            quantity: l.quantity,
            unitPrice: l.unitPrice,
          })),
          shippingFee: fee,
          notes: notes || undefined,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(`Bulk order #${data.orderId} created`);
        router.push("/admin");
      } else {
        toast.error(data.error || "Failed to create bulk order");
      }
    } catch {
      toast.error("Network error");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center py-20 text-gray-400">Loading...</div>;
  }

  return (
    <div className="mx-auto max-w-4xl">
      <button
        onClick={() => router.push("/admin")}
        className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-gray-500 hover:text-gray-900"
      >
        <ArrowLeft size={14} />
        Back to orders
      </button>

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">New Bulk Order</h1>
        <p className="mt-1 text-sm text-gray-500">
          Wholesale order with custom per-line pricing. NET-30 payment terms.
        </p>
      </div>

      <div className="mb-6 flex items-start gap-2 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
        <Info size={16} className="mt-0.5 shrink-0" />
        <div>
          <p className="font-medium">How this works</p>
          <p className="mt-0.5 text-xs text-blue-700">
            StockBridge delivers but collects nothing at delivery (line prices sent as 0). You invoice
            the buyer separately and chase payment within 30 days. Retail caps, Turnstile, and promo
            codes don&apos;t apply.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Client info */}
        <section className="rounded-xl bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-sm font-bold uppercase tracking-wide text-gray-500">
            Wholesale buyer
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Contact first name *">
              <input
                required
                value={client.firstName}
                onChange={(e) => setClient({ ...client, firstName: e.target.value })}
                className="input"
              />
            </Field>
            <Field label="Contact last name *">
              <input
                required
                value={client.lastName}
                onChange={(e) => setClient({ ...client, lastName: e.target.value })}
                className="input"
              />
            </Field>
            <Field label="Phone *">
              <input
                required
                type="tel"
                placeholder="+216 XX XXX XXX"
                value={client.phone}
                onChange={(e) => setClient({ ...client, phone: e.target.value })}
                className="input"
              />
            </Field>
            <Field label="Email">
              <input
                type="email"
                value={client.email}
                onChange={(e) => setClient({ ...client, email: e.target.value })}
                className="input"
              />
            </Field>
            <Field label="Address *" colSpan>
              <input
                required
                value={client.address}
                onChange={(e) => setClient({ ...client, address: e.target.value })}
                className="input"
              />
            </Field>
            <Field label="City *">
              <input
                required
                value={client.city}
                onChange={(e) => setClient({ ...client, city: e.target.value })}
                className="input"
              />
            </Field>
            <Field label="Governorate *">
              <select
                required
                value={client.governorate}
                onChange={(e) => setClient({ ...client, governorate: e.target.value })}
                className="input"
              >
                <option value="">Select…</option>
                {GOVERNORATES.map((g) => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
            </Field>
            <Field label="Postal code">
              <input
                inputMode="numeric"
                maxLength={4}
                value={client.postalCode}
                onChange={(e) =>
                  setClient({
                    ...client,
                    postalCode: e.target.value.replace(/\D/g, "").slice(0, 4),
                  })
                }
                className="input"
              />
            </Field>
          </div>
        </section>

        {/* Line items */}
        <section className="rounded-xl bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-sm font-bold uppercase tracking-wide text-gray-500">
            Line items
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs uppercase text-gray-400">
                <tr>
                  <th className="pb-2 pr-3">Product</th>
                  <th className="pb-2 pr-3 w-24">Qty</th>
                  <th className="pb-2 pr-3 w-32">Unit price (TND)</th>
                  <th className="pb-2 pr-3 w-32 text-right">Subtotal</th>
                  <th className="pb-2 w-8" />
                </tr>
              </thead>
              <tbody>
                {lines.map((line) => {
                  const product =
                    line.productId !== "" ? productById.get(Number(line.productId)) : null;
                  const lineSubtotal = (line.unitPrice || 0) * (line.quantity || 0);
                  const overStock = product && line.quantity > product.stock;
                  return (
                    <tr key={line.uid} className="border-t border-gray-100">
                      <td className="py-2 pr-3">
                        <select
                          value={line.productId}
                          onChange={(e) =>
                            updateLine(line.uid, {
                              productId: e.target.value === "" ? "" : Number(e.target.value),
                            })
                          }
                          className="input"
                        >
                          <option value="">Select product…</option>
                          {products.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name} ({p.stock} in stock)
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="py-2 pr-3">
                        <input
                          type="number"
                          min={1}
                          value={line.quantity}
                          onChange={(e) =>
                            updateLine(line.uid, {
                              quantity: Math.max(1, parseInt(e.target.value || "1", 10)),
                            })
                          }
                          className={`input ${overStock ? "border-red-300" : ""}`}
                        />
                        {overStock && (
                          <p className="mt-1 text-[11px] text-red-500">Only {product?.stock} available</p>
                        )}
                      </td>
                      <td className="py-2 pr-3">
                        <input
                          type="number"
                          min={0}
                          step="0.01"
                          value={line.unitPrice}
                          onChange={(e) =>
                            updateLine(line.uid, {
                              unitPrice: Math.max(0, parseFloat(e.target.value || "0")),
                            })
                          }
                          className="input"
                        />
                        {product && line.unitPrice !== product.price && line.productId !== "" && (
                          <p className="mt-1 text-[11px] text-gray-400">
                            Retail: {product.price.toFixed(2)} TND
                          </p>
                        )}
                      </td>
                      <td className="py-2 pr-3 text-right font-semibold text-gray-900">
                        {lineSubtotal.toFixed(2)} TND
                      </td>
                      <td className="py-2 text-right">
                        <button
                          type="button"
                          onClick={() => removeLine(line.uid)}
                          disabled={lines.length === 1}
                          className="text-gray-300 hover:text-red-600 disabled:opacity-30"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <button
            type="button"
            onClick={addLine}
            className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-gray-600 hover:text-gray-900"
          >
            <Plus size={14} />
            Add line
          </button>
        </section>

        {/* Shipping + notes */}
        <section className="rounded-xl bg-white p-6 shadow-sm">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Field label="Shipping fee (TND)">
              <input
                type="number"
                min={0}
                step="0.01"
                value={shippingFee}
                onChange={(e) => setShippingFee(e.target.value)}
                className="input"
              />
              <p className="mt-1 text-[11px] text-gray-400">
                Default 9.5. Adjust if SB quoted a different rate for this shipment.
              </p>
            </Field>
            <Field label="Notes (PO ref, instructions…)" className="sm:col-span-2">
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                placeholder="PO #12345 — deliver Wed AM"
                className="input"
              />
            </Field>
          </div>
        </section>

        {/* Total + submit */}
        <section className="rounded-xl bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3 text-sm">
            <span className="text-gray-500">Products subtotal</span>
            <span className="font-semibold text-gray-900">{productsSubtotal.toFixed(2)} TND</span>
          </div>
          <div className="flex items-center justify-between border-b border-gray-100 py-3 text-sm">
            <span className="text-gray-500">Shipping</span>
            <span className="font-semibold text-gray-900">{fee.toFixed(2)} TND</span>
          </div>
          <div className="flex items-center justify-between pt-3">
            <span className="font-semibold text-gray-900">Total (NET-30)</span>
            <span className="text-xl font-bold text-gray-900">{total.toFixed(2)} TND</span>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="mt-6 w-full rounded-lg bg-gray-900 py-3 text-sm font-semibold text-white hover:bg-gray-800 disabled:opacity-50"
          >
            {submitting ? "Creating…" : "Create bulk order"}
          </button>
        </section>
      </form>

      <style jsx>{`
        :global(.input) {
          width: 100%;
          border-radius: 0.5rem;
          border: 1px solid rgb(229, 231, 235);
          padding: 0.5rem 0.75rem;
          font-size: 0.875rem;
          outline: none;
          background: white;
        }
        :global(.input:focus) {
          border-color: rgb(17, 24, 39);
        }
      `}</style>
    </div>
  );
}

function Field({
  label,
  children,
  colSpan,
  className,
}: {
  label: string;
  children: React.ReactNode;
  colSpan?: boolean;
  className?: string;
}) {
  return (
    <div className={`${colSpan ? "sm:col-span-2" : ""} ${className ?? ""}`}>
      <label className="mb-1 block text-xs font-medium text-gray-500">{label}</label>
      {children}
    </div>
  );
}
