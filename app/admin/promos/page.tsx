"use client";

import { useEffect, useState } from "react";
import { Copy, Plus, Trash2, X } from "lucide-react";
import { useToast } from "../toast";

interface Promo {
  id: number;
  code: string;
  type: "percentage" | "fixed";
  value: number;
  maxRedemptions: number | null;
  redemptionsCount: number;
  expiresAt: string | null;
  active: boolean;
  createdAt: string;
  revenue: number;
}

type FormState = {
  code: string;
  type: "percentage" | "fixed";
  value: string;
  maxRedemptions: string;
  expiresAt: string;
};

const emptyForm: FormState = {
  code: "",
  type: "percentage",
  value: "",
  maxRedemptions: "",
  expiresAt: "",
};

export default function PromosPage() {
  const [promos, setPromos] = useState<Promo[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [creating, setCreating] = useState(false);
  const toast = useToast();

  const fetchPromos = async () => {
    try {
      const res = await fetch("/api/admin/promos");
      if (res.ok) setPromos(await res.json());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPromos();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      const body = {
        code: form.code.trim().toUpperCase(),
        type: form.type,
        value: parseFloat(form.value),
        maxRedemptions: form.maxRedemptions ? parseInt(form.maxRedemptions, 10) : null,
        expiresAt: form.expiresAt
          ? new Date(form.expiresAt + "T23:59:59").toISOString()
          : null,
        active: true,
      };
      const res = await fetch("/api/admin/promos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(`Promo ${data.code} created`);
        setShowForm(false);
        setForm(emptyForm);
        fetchPromos();
      } else {
        toast.error(data.error || "Failed to create promo");
      }
    } catch {
      toast.error("Failed to create promo");
    } finally {
      setCreating(false);
    }
  };

  const toggleActive = async (promo: Promo) => {
    try {
      const res = await fetch("/api/admin/promos", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: promo.id, active: !promo.active }),
      });
      if (res.ok) {
        fetchPromos();
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to update promo");
      }
    } catch {
      toast.error("Failed to update promo");
    }
  };

  const handleDelete = async (promo: Promo) => {
    if (
      !confirm(
        `Delete promo ${promo.code}? It will stop working immediately. Past orders will keep their attribution.`
      )
    )
      return;
    try {
      const res = await fetch("/api/admin/promos", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: promo.id }),
      });
      if (res.ok) {
        toast.success("Promo deleted");
        fetchPromos();
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to delete promo");
      }
    } catch {
      toast.error("Failed to delete promo");
    }
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success(`Copied ${code}`);
  };

  const formatValue = (p: Promo) =>
    p.type === "percentage" ? `-${p.value}%` : `-${p.value.toFixed(2)} TND`;

  const formatExpiry = (iso: string | null) => {
    if (!iso) return <span className="text-gray-400">—</span>;
    const date = new Date(iso);
    const expired = date < new Date();
    return (
      <span className={expired ? "text-red-600" : "text-gray-700"}>
        {date.toLocaleDateString()}
        {expired && <span className="ml-1 text-xs">(expired)</span>}
      </span>
    );
  };

  const formatUses = (p: Promo) => {
    if (p.maxRedemptions === null) {
      return <span className="text-gray-700">{p.redemptionsCount}</span>;
    }
    const pct = Math.min(100, (p.redemptionsCount / p.maxRedemptions) * 100);
    return (
      <div>
        <div className="text-xs text-gray-700">
          {p.redemptionsCount} / {p.maxRedemptions}
        </div>
        <div className="mt-1 h-1 w-20 overflow-hidden rounded-full bg-gray-100">
          <div
            className="h-full bg-gray-700"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
    );
  };

  if (loading) {
    return <div className="flex items-center justify-center py-20 text-gray-400">Loading...</div>;
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Promo Codes</h1>
          <p className="mt-1 text-sm text-gray-500">
            For influencer campaigns. Revenue = product revenue after discount (excludes shipping).
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
        >
          <Plus size={16} />
          New Promo
        </button>
      </div>

      <div className="overflow-hidden rounded-xl bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="border-b bg-gray-50 text-xs uppercase text-gray-500">
            <tr>
              <th className="px-5 py-3">Code</th>
              <th className="px-5 py-3">Discount</th>
              <th className="px-5 py-3">Uses</th>
              <th className="px-5 py-3" title="Product revenue after discount, excluding shipping">
                Revenue
              </th>
              <th className="px-5 py-3">Expires</th>
              <th className="px-5 py-3">Status</th>
              <th className="px-5 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {promos.map((p) => (
              <tr key={p.id} className="border-b last:border-0">
                <td className="px-5 py-3">
                  <div className="flex items-center gap-2">
                    <code className="rounded bg-gray-100 px-2 py-0.5 font-mono text-xs font-semibold text-gray-900">
                      {p.code}
                    </code>
                    <button
                      onClick={() => copyCode(p.code)}
                      title="Copy code"
                      className="text-gray-300 hover:text-gray-700"
                    >
                      <Copy size={13} />
                    </button>
                  </div>
                </td>
                <td className="px-5 py-3 font-medium text-gray-900">{formatValue(p)}</td>
                <td className="px-5 py-3">{formatUses(p)}</td>
                <td className="px-5 py-3 font-medium text-gray-900">
                  {p.revenue.toFixed(2)} TND
                </td>
                <td className="px-5 py-3 text-xs">{formatExpiry(p.expiresAt)}</td>
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
                    onClick={() => handleDelete(p)}
                    title="Delete"
                    className="text-gray-400 hover:text-red-600"
                  >
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
            {promos.length === 0 && (
              <tr>
                <td colSpan={7} className="py-12 text-center text-gray-400">
                  No promo codes yet
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <form
            onSubmit={handleCreate}
            className="w-full max-w-md rounded-xl bg-white p-6"
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold">New Promo Code</h2>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="text-gray-400 hover:text-gray-700"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-500">
                  Code <span className="text-gray-400">(e.g. SARAH10)</span>
                </label>
                <input
                  required
                  value={form.code}
                  onChange={(e) =>
                    setForm({ ...form, code: e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, "") })
                  }
                  pattern="[A-Z0-9-]{3,32}"
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 font-mono text-sm outline-none focus:border-gray-900"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-gray-500">Type</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, type: "percentage" })}
                    className={`rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                      form.type === "percentage"
                        ? "border-gray-900 bg-gray-900 text-white"
                        : "border-gray-200 text-gray-600 hover:border-gray-400"
                    }`}
                  >
                    Percentage (%)
                  </button>
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, type: "fixed" })}
                    className={`rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                      form.type === "fixed"
                        ? "border-gray-900 bg-gray-900 text-white"
                        : "border-gray-200 text-gray-600 hover:border-gray-400"
                    }`}
                  >
                    Fixed (TND)
                  </button>
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-gray-500">
                  Value
                </label>
                <div className="relative">
                  <input
                    required
                    type="number"
                    min={form.type === "percentage" ? "1" : "0.5"}
                    max={form.type === "percentage" ? "100" : undefined}
                    step="0.01"
                    value={form.value}
                    onChange={(e) => setForm({ ...form, value: e.target.value })}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 pr-12 text-sm outline-none focus:border-gray-900"
                  />
                  <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs text-gray-400">
                    {form.type === "percentage" ? "%" : "TND"}
                  </span>
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-gray-500">
                  Max uses <span className="text-gray-400">(optional)</span>
                </label>
                <input
                  type="number"
                  min={1}
                  value={form.maxRedemptions}
                  onChange={(e) => setForm({ ...form, maxRedemptions: e.target.value })}
                  placeholder="Unlimited"
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-gray-900"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-gray-500">
                  Expires on <span className="text-gray-400">(optional)</span>
                </label>
                <input
                  type="date"
                  value={form.expiresAt}
                  onChange={(e) => setForm({ ...form, expiresAt: e.target.value })}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-gray-900"
                />
              </div>
            </div>

            <div className="mt-5 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={creating}
                className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
              >
                {creating ? "Creating..." : "Create"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
