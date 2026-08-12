"use client";

import { useEffect, useState } from "react";
import { Copy, Gift, Pencil, Percent, Plus, Trash2 } from "lucide-react";
import { useToast } from "../toast";
import PromotionForm, {
  type AdminProduct,
  type EditablePromotion,
} from "./PromotionForm";

interface Promotion extends EditablePromotion {
  activationQuantity: number;
  active: boolean;
  createdAt: string;
  orderCount: number;
  discountGiven: number;
  revenue: number;
}

export default function PromotionsPage() {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Promotion | null>(null);
  const toast = useToast();

  const fetchAll = async () => {
    try {
      const [promoRes, productRes] = await Promise.all([
        fetch("/api/admin/promotions"),
        fetch("/api/admin/products"),
      ]);
      if (promoRes.ok) setPromotions(await promoRes.json());
      if (productRes.ok) setProducts((await productRes.json()).products);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const toggleActive = async (promo: Promotion) => {
    try {
      const res = await fetch("/api/admin/promotions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: promo.id, active: !promo.active }),
      });
      const data = await res.json();
      if (res.ok) {
        fetchAll();
      } else {
        toast.error(data.error || "Failed to update promotion");
      }
    } catch {
      toast.error("Failed to update promotion");
    }
  };

  const handleDelete = async (promo: Promotion) => {
    if (
      !confirm(
        `Delete "${promo.name}"? It stops applying immediately. Past orders keep their attribution and the link keeps working as an expired-offer page.`
      )
    )
      return;
    try {
      const res = await fetch("/api/admin/promotions", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: promo.id }),
      });
      if (res.ok) {
        toast.success("Promotion deleted");
        fetchAll();
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to delete promotion");
      }
    } catch {
      toast.error("Failed to delete promotion");
    }
  };

  const copyLink = (slug: string) => {
    navigator.clipboard.writeText(`${window.location.origin}/offre/${slug}`);
    toast.success("Link copied");
  };

  const productName = (id: number | null) =>
    products.find((p) => p.id === id)?.name ?? `#${id}`;

  const describeRule = (p: Promotion) => {
    if (p.type === "percentage") {
      return `Buy ${p.triggerQuantity} × ${productName(p.triggerProductId)} → −${p.discountPercent}%`;
    }
    return `Buy ${p.triggerQuantity} × ${productName(p.triggerProductId)} → ${p.giftQuantity} × ${productName(p.giftProductId)} free`;
  };

  const formatWindow = (p: Promotion) => {
    const start = p.startsAt ? new Date(p.startsAt) : null;
    const end = p.expiresAt ? new Date(p.expiresAt) : null;
    if (!start && !end) return <span className="text-gray-400">Always on</span>;
    const expired = end !== null && end < new Date();
    const pending = start !== null && start > new Date();
    return (
      <span className={expired ? "text-red-600" : "text-gray-700"}>
        {start ? start.toLocaleDateString() : "—"} → {end ? end.toLocaleDateString() : "—"}
        {expired && <span className="ml-1 text-xs">(ended)</span>}
        {pending && <span className="ml-1 text-xs text-amber-600">(scheduled)</span>}
      </span>
    );
  };

  if (loading) {
    return <div className="flex items-center justify-center py-20 text-gray-400">Loading...</div>;
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Promotions</h1>
          <p className="mt-1 text-sm text-gray-500">
            Applied automatically from cart quantity — no code needed. A promotion
            suspends promo-code discounts, which are still recorded for attribution.
          </p>
        </div>
        <button
          onClick={() => {
            setEditing(null);
            setShowForm(true);
          }}
          className="flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
        >
          <Plus size={16} />
          New Promotion
        </button>
      </div>

      <div className="overflow-hidden rounded-xl bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="border-b bg-gray-50 text-xs uppercase text-gray-500">
            <tr>
              <th className="px-5 py-3">Promotion</th>
              <th className="px-5 py-3">Rule</th>
              <th className="px-5 py-3" title="Units of the trigger product that fire it">
                Fires at
              </th>
              <th className="px-5 py-3">Orders</th>
              <th className="px-5 py-3">Given</th>
              <th className="px-5 py-3">Revenue</th>
              <th className="px-5 py-3">Window</th>
              <th className="px-5 py-3">Status</th>
              <th className="px-5 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {promotions.map((p) => (
              <tr key={p.id} className="border-b last:border-0">
                <td className="px-5 py-3">
                  <div className="flex items-center gap-2">
                    {p.type === "percentage" ? (
                      <Percent size={14} className="text-gray-400" />
                    ) : (
                      <Gift size={14} className="text-gray-400" />
                    )}
                    <span className="font-medium text-gray-900">{p.name}</span>
                  </div>
                  <button
                    onClick={() => copyLink(p.slug)}
                    title="Copy shareable link"
                    className="mt-1 flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-700"
                  >
                    <Copy size={11} />
                    /offre/{p.slug}
                  </button>
                </td>
                <td className="px-5 py-3 text-gray-700">{describeRule(p)}</td>
                <td className="px-5 py-3">
                  <span className="rounded bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-900">
                    {p.activationQuantity} units
                  </span>
                </td>
                <td className="px-5 py-3 text-gray-700">{p.orderCount}</td>
                <td className="px-5 py-3 text-gray-700">
                  {p.discountGiven.toFixed(2)} TND
                </td>
                <td className="px-5 py-3 font-medium text-gray-900">
                  {p.revenue.toFixed(2)} TND
                </td>
                <td className="px-5 py-3 text-xs">{formatWindow(p)}</td>
                <td className="px-5 py-3">
                  <button
                    onClick={() => toggleActive(p)}
                    className={`rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
                      p.active
                        ? "bg-green-100 text-green-700 hover:bg-green-200"
                        : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                    }`}
                    title={p.active ? "Click to deactivate" : "Click to activate"}
                  >
                    {p.active ? "Active" : "Inactive"}
                  </button>
                </td>
                <td className="px-5 py-3 text-right">
                  <button
                    onClick={() => {
                      setEditing(p);
                      setShowForm(true);
                    }}
                    title="Edit"
                    className="mr-2 text-gray-400 hover:text-gray-700"
                  >
                    <Pencil size={16} />
                  </button>
                  <button
                    onClick={() => handleDelete(p)}
                    title="Delete"
                    className="text-gray-400 hover:text-red-600"
                  >
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
            {promotions.length === 0 && (
              <tr>
                <td colSpan={9} className="py-12 text-center text-gray-400">
                  No promotions yet
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showForm && (
        <PromotionForm
          products={products}
          editing={editing}
          onClose={() => setShowForm(false)}
          onSaved={fetchAll}
        />
      )}
    </div>
  );
}
