"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import { Plus, Pencil, Trash2, X, Search, ChevronLeft, ChevronRight, Upload, Link2, CheckCircle2, AlertTriangle } from "lucide-react";
import { useToast } from "../toast";

interface StockBridgeInfo {
  id: string;
  price_ht: number;
  stock_physical: number;
  stock_reserved: number;
  stock_available: number;
  is_low_stock: boolean;
  alert_threshold: number;
  updated_at: string;
}

interface Product {
  id: number;
  name: string;
  nameFr: string;
  description: string | null;
  descriptionFr: string | null;
  price: number;
  sku: string | null;
  stockbridgeProductId: string | null;
  stock: number;
  image: string | null;
  active: boolean;
  stockbridge: StockBridgeInfo | null;
}

const emptyForm = {
  name: "",
  nameFr: "",
  description: "",
  descriptionFr: "",
  price: 0,
  sku: "",
  stock: 0,
  image: "",
  active: true,
};

const PAGE_SIZE = 10;

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [uploading, setUploading] = useState(false);
  const [stockbridgeError, setStockbridgeError] = useState<string | null>(null);
  const [syncedAt, setSyncedAt] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const toast = useToast();

  const fetchProducts = async () => {
    try {
      const res = await fetch("/api/admin/products");
      if (res.ok) {
        const data = await res.json();
        setProducts(data.products);
        setStockbridgeError(data.stockbridgeError);
        setSyncedAt(data.syncedAt);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const filtered = useMemo(() => {
    return products.filter((p) => {
      const q = search.toLowerCase();
      const matchesSearch =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.nameFr.toLowerCase().includes(q);
      const matchesStatus =
        !statusFilter ||
        (statusFilter === "active" && p.active) ||
        (statusFilter === "inactive" && !p.active) ||
        (statusFilter === "lowstock" && p.stock < 5);
      return matchesSearch && matchesStatus;
    });
  }, [products, search, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const editingProduct = editingId ? products.find((p) => p.id === editingId) ?? null : null;
  const isLinked = !!editingProduct?.stockbridgeProductId;

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter]);

  const openNew = () => {
    setForm(emptyForm);
    setEditingId(null);
    setShowForm(true);
  };

  const openEdit = (p: Product) => {
    setForm({
      name: p.name,
      nameFr: p.nameFr,
      description: p.description || "",
      descriptionFr: p.descriptionFr || "",
      price: p.price,
      sku: p.sku || "",
      stock: p.stock,
      image: p.image || "",
      active: p.active,
    });
    setEditingId(p.id);
    setShowForm(true);
  };

  const handleLinkStockBridge = async (p: Product) => {
    let sku = p.sku;
    if (!sku) {
      const entered = prompt(
        `Enter the StockBridge SKU for "${p.name}".\nIt will be matched against StockBridge; if no match is found, a new product will be created there.`
      );
      if (!entered) return;
      sku = entered.trim();
      if (!sku) return;
    }

    try {
      const res = await fetch("/api/admin/stockbridge/sync-product", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: p.id, sku }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(
          data.matched
            ? `Linked to existing StockBridge SKU ${sku}`
            : `Created on StockBridge as ${sku}`
        );
        fetchProducts();
      } else {
        toast.error(data.message || data.error || "Link failed");
      }
    } catch {
      toast.error("Link failed");
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/admin/upload", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        setForm((f) => ({ ...f, image: data.path }));
        toast.success("Image uploaded");
      } else {
        const data = await res.json();
        toast.error(data.error || "Upload failed");
      }
    } catch {
      toast.error("Upload failed");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleSave = async () => {
    const method = editingId ? "PUT" : "POST";
    const body = editingId ? { ...form, id: editingId } : form;

    try {
      const res = await fetch("/api/admin/products", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.stockbridgeWarning) {
          toast.error(`Saved locally, but StockBridge push failed: ${data.stockbridgeWarning}`);
        } else {
          toast.success(editingId ? "Product updated" : "Product created");
        }
        setShowForm(false);
        fetchProducts();
      } else {
        toast.error("Failed to save product");
      }
    } catch {
      toast.error("Failed to save product");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this product?")) return;
    try {
      const res = await fetch("/api/admin/products", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (res.ok) {
        toast.success("Product deleted");
        fetchProducts();
      } else {
        toast.error("Failed to delete product");
      }
    } catch {
      toast.error("Failed to delete product");
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center py-20 text-gray-400">Loading...</div>;
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Products</h1>
        <button
          onClick={openNew}
          className="flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
        >
          <Plus size={16} />
          Add Product
        </button>
      </div>

      {stockbridgeError && (
        <div className="mb-4 flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <AlertTriangle size={18} className="mt-0.5 shrink-0 text-amber-600" />
          <div>
            <p className="font-medium">Couldn&apos;t reach StockBridge — showing cached values.</p>
            <p className="text-xs text-amber-700">
              Live stock and price comparisons are unavailable. {syncedAt && `Last attempt: ${new Date(syncedAt).toLocaleTimeString()}.`}{" "}
              Reason: {stockbridgeError}
            </p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name..."
            className="w-full rounded-lg border border-gray-200 py-2 pl-9 pr-3 text-sm outline-none focus:border-gray-900"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-gray-900"
        >
          <option value="">All products</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="lowstock">Low stock (&lt; 5)</option>
        </select>
        <span className="text-sm text-gray-500">{filtered.length} products</span>
      </div>

      {/* Product list */}
      <div className="overflow-hidden rounded-xl bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="border-b bg-gray-50 text-xs uppercase text-gray-500">
            <tr>
              <th className="px-5 py-3">Product</th>
              <th className="px-5 py-3">Price</th>
              <th className="px-5 py-3">Stock</th>
              <th className="px-5 py-3">Status</th>
              <th className="px-5 py-3">StockBridge</th>
              <th className="px-5 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginated.map((p) => (
              <tr key={p.id} className="border-b last:border-0">
                <td className="px-5 py-3">
                  <p className="font-medium text-gray-900">{p.name}</p>
                  <p className="text-xs text-gray-400">{p.nameFr}</p>
                </td>
                <td className="px-5 py-3">
                  <div className="text-gray-700">{p.price.toFixed(2)} TND</div>
                  {p.stockbridge && Math.abs(p.stockbridge.price_ht - p.price) > 0.01 && (
                    <div className="mt-0.5 inline-flex items-center gap-1 text-[11px] text-amber-700">
                      <AlertTriangle size={10} />
                      SB: {p.stockbridge.price_ht.toFixed(2)} TND
                    </div>
                  )}
                </td>
                <td className="px-5 py-3">
                  {p.stockbridge ? (
                    <div className="flex flex-col gap-0.5 text-xs">
                      <span className={`font-medium ${p.stockbridge.is_low_stock ? "text-red-600" : "text-gray-700"}`}>
                        {p.stockbridge.stock_available} available
                      </span>
                      <span className="text-gray-400">
                        {p.stockbridge.stock_physical} physical · {p.stockbridge.stock_reserved} reserved
                      </span>
                      {p.stockbridge.stock_available !== p.stock && (
                        <span className="inline-flex items-center gap-1 text-[11px] text-amber-700">
                          <AlertTriangle size={10} />
                          local: {p.stock}
                        </span>
                      )}
                    </div>
                  ) : (
                    <span className={p.stock < 5 ? "font-medium text-red-600" : "text-gray-700"}>
                      {p.stock}
                    </span>
                  )}
                </td>
                <td className="px-5 py-3">
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                      p.active ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-500"
                    }`}
                  >
                    {p.active ? "Active" : "Inactive"}
                  </span>
                </td>
                <td className="px-5 py-3">
                  {p.stockbridgeProductId ? (
                    <span
                      className="inline-flex items-center gap-1.5 text-xs text-green-700"
                      title={`SKU ${p.sku} → ${p.stockbridgeProductId}`}
                    >
                      <CheckCircle2 size={14} />
                      {p.sku}
                    </span>
                  ) : (
                    <button
                      onClick={() => handleLinkStockBridge(p)}
                      className="inline-flex items-center gap-1.5 rounded-md border border-gray-200 px-2 py-1 text-xs text-gray-600 hover:bg-gray-50"
                    >
                      <Link2 size={12} />
                      Link
                    </button>
                  )}
                </td>
                <td className="px-5 py-3 text-right">
                  <button onClick={() => openEdit(p)} className="mr-2 text-gray-400 hover:text-gray-700">
                    <Pencil size={16} />
                  </button>
                  <button onClick={() => handleDelete(p.id)} className="text-gray-400 hover:text-red-600">
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
            {paginated.length === 0 && (
              <tr>
                <td colSpan={6} className="py-12 text-center text-gray-400">
                  {products.length === 0 ? "No products yet" : "No products match your filters"}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between rounded-xl bg-white px-5 py-3 shadow-sm">
          <span className="text-sm text-gray-500">
            Page {page} of {totalPages}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="rounded-lg border border-gray-200 p-2 text-gray-500 hover:bg-gray-50 disabled:opacity-40"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="rounded-lg border border-gray-200 p-2 text-gray-500 hover:bg-gray-50 disabled:opacity-40"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Modal form */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-xl bg-white p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold">{editingId ? "Edit Product" : "New Product"}</h2>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-700">
                <X size={20} />
              </button>
            </div>

            {isLinked && (
              <div className="mb-4 rounded-lg border border-blue-100 bg-blue-50 px-3 py-2 text-xs text-blue-900">
                <span className="font-medium">Linked to StockBridge.</span> Price & name changes auto-push to StockBridge on save. Stock and SKU are managed by StockBridge and can&apos;t be edited here.
              </div>
            )}

            <div className="space-y-4">
              {/* Storefront content — local only */}
              <div>
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-gray-400">Storefront content <span className="text-gray-300">· local only</span></p>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="mb-1 block text-xs font-medium text-gray-500">Name (EN) {isLinked && <span className="text-blue-600">↑ syncs to SB</span>}</label>
                      <input
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-gray-900"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium text-gray-500">Name (FR)</label>
                      <input
                        value={form.nameFr}
                        onChange={(e) => setForm({ ...form, nameFr: e.target.value })}
                        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-gray-900"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-500">Description (EN)</label>
                    <textarea
                      value={form.description}
                      onChange={(e) => setForm({ ...form, description: e.target.value })}
                      rows={2}
                      className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-gray-900"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-500">Description (FR)</label>
                    <textarea
                      value={form.descriptionFr}
                      onChange={(e) => setForm({ ...form, descriptionFr: e.target.value })}
                      rows={2}
                      className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-gray-900"
                    />
                  </div>
                </div>
              </div>

              {/* Commerce — price syncs to SB, stock & SKU locked when linked */}
              <div>
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                  Commerce {isLinked && <span className="text-gray-300">· some fields managed by StockBridge</span>}
                </p>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-500">
                      Price (TND) {isLinked && <span className="text-blue-600">↑ syncs to SB</span>}
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={form.price}
                      onChange={(e) => setForm({ ...form, price: parseFloat(e.target.value) || 0 })}
                      className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-gray-900"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-500">
                      Stock {isLinked && <span className="text-gray-400">· SB managed</span>}
                    </label>
                    <input
                      type="number"
                      value={form.stock}
                      onChange={(e) => setForm({ ...form, stock: parseInt(e.target.value) || 0 })}
                      disabled={isLinked}
                      title={isLinked ? "Stock is managed by StockBridge and synced automatically." : ""}
                      className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-gray-900 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-400"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-500">
                      SKU {isLinked && <span className="text-gray-400">· link key</span>}
                    </label>
                    <input
                      value={form.sku}
                      onChange={(e) => setForm({ ...form, sku: e.target.value })}
                      disabled={isLinked}
                      placeholder="HYDRAWAY-..."
                      title={isLinked ? "SKU is the link key with StockBridge and can't be changed once linked." : ""}
                      className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-gray-900 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-400"
                    />
                  </div>
                </div>
              </div>
              {/* Display — local only */}
              <div>
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-gray-400">Display <span className="text-gray-300">· local only</span></p>
                <div className="space-y-3">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-500">Image</label>
                    <div className="flex gap-2">
                      <input
                        value={form.image}
                        onChange={(e) => setForm({ ...form, image: e.target.value })}
                        placeholder="/images/..."
                        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-gray-900"
                      />
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                        className="shrink-0 rounded-lg border border-gray-200 p-2 text-gray-500 hover:bg-gray-50 disabled:opacity-40"
                        title="Upload image"
                      >
                        <Upload size={16} />
                      </button>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                    </div>
                    {uploading && (
                      <p className="mt-1 text-xs text-gray-400">Uploading...</p>
                    )}
                  </div>
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={form.active}
                      onChange={(e) => setForm({ ...form, active: e.target.checked })}
                      className="rounded"
                    />
                    Active (visible on storefront)
                  </label>
                </div>
              </div>

              {isLinked && editingProduct?.stockbridge && (
                <div className="rounded-lg border border-gray-100 bg-gray-50 px-3 py-2 text-[11px] text-gray-500">
                  <span className="font-medium">StockBridge:</span>{" "}
                  {editingProduct.stockbridge.stock_available} available
                  {" "}({editingProduct.stockbridge.stock_physical} physical, {editingProduct.stockbridge.stock_reserved} reserved){" "}
                  · {editingProduct.stockbridge.price_ht.toFixed(2)} TND HT
                  · alert at {editingProduct.stockbridge.alert_threshold}
                </div>
              )}
            </div>

            <div className="mt-5 flex justify-end gap-3">
              <button
                onClick={() => setShowForm(false)}
                className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
              >
                {editingId ? "Update" : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
