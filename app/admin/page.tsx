"use client";

import { useEffect, useState, useMemo } from "react";
import { ChevronDown, Search, ChevronLeft, ChevronRight, Check, AlertTriangle, Truck, Link as LinkIcon } from "lucide-react";
import { useToast } from "./toast";

function timeAgo(date: string) {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

interface StatusEntry {
  from: string;
  to: string;
  at: string;
  via?: string;
  stockbridge_status?: string;
}

interface Order {
  id: number;
  status: string;
  paymentMethod: string;
  paymentStatus: string;
  total: number;
  createdAt: string;
  statusHistory: string | null;
  stockbridgeOrderId: string | null;
  stockbridgeInternalRef: string | null;
  stockbridgeStatus: string | null;
  stockbridgeError: string | null;
  trackingNumber: string | null;
  shippedAt: string | null;
  deliveredAt: string | null;
  client: {
    firstName: string;
    lastName: string;
    phone: string;
    city: string;
    governorate: string;
    address: string;
  };
  items: {
    productName: string;
    quantity: number;
    unitPrice: number;
  }[];
}

const STATUS_OPTIONS = ["pending", "confirmed", "shipped", "delivered", "cancelled", "returned"];
const PAGE_SIZE = 10;

const TRANSITIONS: Record<string, string[]> = {
  pending: ["confirmed", "cancelled"],
  confirmed: ["shipped", "cancelled"],
  shipped: ["delivered", "returned"],
  delivered: [],
  cancelled: [],
  returned: [],
};

const SB_FLOW = ["RECEIVED", "ACCEPTED", "PICKING", "PACKING", "SHIPPED", "DELIVERED"] as const;
const SB_TERMINAL_BAD = new Set(["CANCELLED", "REJECTED", "RETURNED"]);

const sbStatusColors: Record<string, string> = {
  RECEIVED: "bg-yellow-100 text-yellow-800",
  ACCEPTED: "bg-blue-100 text-blue-800",
  PICKING: "bg-blue-100 text-blue-800",
  PACKING: "bg-blue-100 text-blue-800",
  SHIPPED: "bg-indigo-100 text-indigo-800",
  DELIVERED: "bg-green-100 text-green-800",
  CANCELLED: "bg-red-100 text-red-800",
  REJECTED: "bg-red-100 text-red-800",
  RETURNED: "bg-orange-100 text-orange-800",
};

const localStatusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  confirmed: "bg-blue-100 text-blue-800",
  shipped: "bg-indigo-100 text-indigo-800",
  delivered: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
  returned: "bg-orange-100 text-orange-800",
};

function StockBridgeStepIndicator({ sbStatus }: { sbStatus: string }) {
  const isBadTerminal = SB_TERMINAL_BAD.has(sbStatus);
  const currentIdx = SB_FLOW.indexOf(sbStatus as (typeof SB_FLOW)[number]);
  const isDelivered = sbStatus === "DELIVERED";

  return (
    <div className="flex items-center gap-1">
      {SB_FLOW.map((step, i) => {
        const isCompleted = isDelivered || currentIdx > i;
        const isCurrent = !isDelivered && currentIdx === i;

        return (
          <div key={step} className="flex items-center gap-1">
            <div
              title={step}
              className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-medium transition-colors ${
                isBadTerminal
                  ? "bg-gray-100 text-gray-400"
                  : isCompleted
                    ? "bg-green-500 text-white"
                    : isCurrent
                      ? "bg-blue-500 text-white"
                      : "bg-gray-100 text-gray-400"
              }`}
            >
              {isCompleted ? <Check size={10} /> : i + 1}
            </div>
            {i < SB_FLOW.length - 1 && (
              <div
                className={`h-0.5 w-3 ${
                  isBadTerminal ? "bg-gray-200" : isCompleted ? "bg-green-400" : "bg-gray-200"
                }`}
              />
            )}
          </div>
        );
      })}
      {isBadTerminal && (
        <span
          className={`ml-2 rounded-full px-2 py-0.5 text-[10px] font-medium ${sbStatusColors[sbStatus] ?? "bg-gray-100 text-gray-700"}`}
        >
          {sbStatus}
        </span>
      )}
    </div>
  );
}

function LegacyStepIndicator({ status, paymentMethod }: { status: string; paymentMethod: string }) {
  const isCancelled = status === "cancelled";
  const isReturned = status === "returned";
  const steps =
    paymentMethod === "flouci"
      ? ["confirmed", "shipped", "delivered"]
      : ["pending", "confirmed", "shipped", "delivered"];
  const currentIdx = steps.indexOf(status);
  const isTerminal = status === "delivered";

  return (
    <div className="flex items-center gap-1">
      {steps.map((step, i) => {
        const isCompleted = isTerminal || currentIdx > i;
        const isCurrent = !isTerminal && currentIdx === i;

        return (
          <div key={step} className="flex items-center gap-1">
            <div
              className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium transition-colors ${
                isCancelled || isReturned
                  ? "bg-gray-100 text-gray-400"
                  : isCompleted
                    ? "bg-green-500 text-white"
                    : isCurrent
                      ? "bg-blue-500 text-white"
                      : "bg-gray-100 text-gray-400"
              }`}
            >
              {isCompleted ? <Check size={12} /> : i + 1}
            </div>
            {i < steps.length - 1 && (
              <div
                className={`h-0.5 w-4 ${
                  isCancelled || isReturned ? "bg-gray-200" : isCompleted ? "bg-green-400" : "bg-gray-200"
                }`}
              />
            )}
          </div>
        );
      })}
      {(isCancelled || isReturned) && (
        <span
          className={`ml-2 rounded-full px-2 py-0.5 text-xs font-medium ${
            isCancelled ? "bg-red-100 text-red-700" : "bg-orange-100 text-orange-700"
          }`}
        >
          {status}
        </span>
      )}
    </div>
  );
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [paymentFilter, setPaymentFilter] = useState("");
  const [page, setPage] = useState(1);
  const toast = useToast();

  const fetchOrders = async () => {
    try {
      const res = await fetch("/api/admin/orders");
      if (res.ok) setOrders(await res.json());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const filtered = useMemo(() => {
    return orders.filter((o) => {
      const q = search.toLowerCase();
      const matchesSearch =
        !q ||
        `${o.client.firstName} ${o.client.lastName}`.toLowerCase().includes(q) ||
        `#${o.id}`.includes(q) ||
        (o.stockbridgeInternalRef?.toLowerCase().includes(q) ?? false) ||
        (o.trackingNumber?.toLowerCase().includes(q) ?? false);
      const matchesStatus = !statusFilter || o.status === statusFilter;
      const matchesPayment = !paymentFilter || o.paymentMethod === paymentFilter;
      return matchesSearch && matchesStatus && matchesPayment;
    });
  }, [orders, search, statusFilter, paymentFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter, paymentFilter]);

  const updateStatus = async (orderId: number, newStatus: string) => {
    if (newStatus === "cancelled" && !confirm("Are you sure you want to cancel this order?")) return;
    if (newStatus === "returned" && !confirm("Mark this order as returned?")) return;

    try {
      const res = await fetch("/api/admin/orders", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: orderId, status: newStatus }),
      });
      if (res.ok) {
        toast.success(`Order #${orderId} → ${newStatus}`);
        fetchOrders();
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to update order status");
      }
    } catch {
      toast.error("Failed to update order status");
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center py-20 text-gray-400">Loading...</div>;
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
        <span className="text-sm text-gray-500">
          {filtered.length} of {orders.length} orders
        </span>
      </div>

      {/* Filters */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, order #, SB ref, or tracking..."
            className="w-full rounded-lg border border-gray-200 py-2 pl-9 pr-3 text-sm outline-none focus:border-gray-900"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-gray-900"
        >
          <option value="">All statuses</option>
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <select
          value={paymentFilter}
          onChange={(e) => setPaymentFilter(e.target.value)}
          className="rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-gray-900"
        >
          <option value="">All payments</option>
          <option value="cod">COD</option>
          <option value="flouci">Flouci</option>
        </select>
      </div>

      {paginated.length === 0 ? (
        <div className="rounded-xl bg-white py-20 text-center text-gray-400 shadow-sm">
          {orders.length === 0 ? "No orders yet" : "No orders match your filters"}
        </div>
      ) : (
        <div className="space-y-3">
          {paginated.map((order) => {
            const linked = !!order.stockbridgeOrderId;
            const sbStatus = order.stockbridgeStatus;
            const hasSbError = !!order.stockbridgeError;
            const allowed = TRANSITIONS[order.status] || [];
            const isTerminal = allowed.length === 0;
            const history: StatusEntry[] = JSON.parse(order.statusHistory || "[]");

            return (
              <div
                key={order.id}
                className={`overflow-hidden rounded-xl bg-white shadow-sm ${hasSbError ? "ring-1 ring-red-200" : ""}`}
              >
                {/* Order header row */}
                <button
                  onClick={() => setExpandedId(expandedId === order.id ? null : order.id)}
                  className="flex w-full items-center gap-4 px-5 py-4 text-left hover:bg-gray-50"
                >
                  <span className="w-16 shrink-0 text-sm font-bold text-gray-900">#{order.id}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-gray-600">
                      {order.client.firstName} {order.client.lastName}
                      <span className="ml-2 text-xs text-gray-400">{timeAgo(order.createdAt)}</span>
                    </div>
                    {order.stockbridgeInternalRef && (
                      <div className="mt-0.5 truncate text-[11px] text-gray-400">
                        SB: {order.stockbridgeInternalRef}
                        {order.trackingNumber && (
                          <span className="ml-2 inline-flex items-center gap-1 text-indigo-600">
                            <Truck size={10} />
                            {order.trackingNumber}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="hidden md:block">
                    {linked && sbStatus ? (
                      <StockBridgeStepIndicator sbStatus={sbStatus} />
                    ) : (
                      <LegacyStepIndicator status={order.status} paymentMethod={order.paymentMethod} />
                    )}
                  </div>
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-medium md:hidden ${
                      linked && sbStatus
                        ? sbStatusColors[sbStatus] ?? "bg-gray-100 text-gray-700"
                        : localStatusColors[order.status]
                    }`}
                  >
                    {linked && sbStatus ? sbStatus : order.status}
                  </span>
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                      order.paymentMethod === "flouci"
                        ? "bg-orange-100 text-orange-700"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {order.paymentMethod === "cod" ? "COD" : "Flouci"}
                  </span>
                  <span className="w-20 text-right text-sm font-semibold text-gray-900">
                    {order.total.toFixed(2)} TND
                  </span>
                  <ChevronDown
                    size={16}
                    className={`text-gray-400 transition-transform ${
                      expandedId === order.id ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {/* Expanded details */}
                {expandedId === order.id && (
                  <div className="border-t border-gray-100 px-5 py-4">
                    {hasSbError && (
                      <div className="mb-4 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
                        <AlertTriangle size={16} className="mt-0.5 shrink-0 text-red-600" />
                        <div>
                          <p className="font-medium">StockBridge submission failed</p>
                          <p className="text-xs text-red-700">{order.stockbridgeError}</p>
                          <p className="mt-1 text-xs text-red-600">
                            This order is in our DB but was never accepted by StockBridge. Investigate or recreate manually on their side.
                          </p>
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                      {/* Client info */}
                      <div>
                        <h3 className="mb-2 text-xs font-semibold uppercase text-gray-400">Client</h3>
                        <p className="text-sm text-gray-700">
                          {order.client.firstName} {order.client.lastName}
                        </p>
                        <p className="text-sm text-gray-500">{order.client.phone}</p>
                        <p className="text-sm text-gray-500">
                          {order.client.address}, {order.client.city}
                        </p>
                        <p className="text-sm text-gray-500">{order.client.governorate}</p>
                      </div>

                      {/* Items */}
                      <div>
                        <h3 className="mb-2 text-xs font-semibold uppercase text-gray-400">Items</h3>
                        {order.items.map((item, i) => (
                          <div key={i} className="text-sm text-gray-700">
                            {item.quantity}x {item.productName} — {item.unitPrice.toFixed(2)} TND
                          </div>
                        ))}
                      </div>

                      {/* Status / actions */}
                      <div>
                        <h3 className="mb-2 text-xs font-semibold uppercase text-gray-400">Status</h3>

                        {linked ? (
                          <div className="space-y-2 text-sm">
                            <div className="flex items-center gap-2">
                              <span className="text-gray-500">StockBridge:</span>
                              <span
                                className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                                  sbStatusColors[sbStatus ?? ""] ?? "bg-gray-100 text-gray-700"
                                }`}
                              >
                                {sbStatus ?? "—"}
                              </span>
                            </div>
                            <p className="text-xs text-gray-400">
                              Lifecycle is owned by StockBridge — they call the customer, confirm, ship and update status. Manual transitions disabled.
                            </p>
                            {order.trackingNumber && (
                              <p className="text-sm text-gray-700">
                                <Truck size={12} className="mr-1 inline" />
                                Tracking: <span className="font-mono">{order.trackingNumber}</span>
                              </p>
                            )}
                            {order.shippedAt && (
                              <p className="text-xs text-gray-400">
                                Shipped: {new Date(order.shippedAt).toLocaleString()}
                              </p>
                            )}
                            {order.deliveredAt && (
                              <p className="text-xs text-gray-400">
                                Delivered: {new Date(order.deliveredAt).toLocaleString()}
                              </p>
                            )}
                          </div>
                        ) : isTerminal ? (
                          <p className="text-sm italic text-gray-400">
                            Order is {order.status} — no further changes
                          </p>
                        ) : (
                          <div className="flex flex-wrap gap-2">
                            {allowed.map((s) => {
                              const isDestructive = s === "cancelled" || s === "returned";
                              return (
                                <button
                                  key={s}
                                  onClick={() => updateStatus(order.id, s)}
                                  className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                                    isDestructive
                                      ? "border border-red-200 text-red-600 hover:bg-red-50"
                                      : "bg-gray-900 text-white hover:bg-gray-800"
                                  }`}
                                >
                                  {s === "confirmed"
                                    ? "Confirm"
                                    : s === "shipped"
                                      ? "Mark Shipped"
                                      : s === "delivered"
                                        ? "Mark Delivered"
                                        : s === "cancelled"
                                          ? "Cancel"
                                          : "Mark Returned"}
                                </button>
                              );
                            })}
                          </div>
                        )}

                        {/* Timeline */}
                        <div className="mt-3 space-y-1">
                          <p className="text-xs text-gray-400">
                            Created: {new Date(order.createdAt).toLocaleString()}
                          </p>
                          {history.map((h, i) => (
                            <p key={i} className="text-xs text-gray-400">
                              {h.from} → {h.to}: {new Date(h.at).toLocaleString()}
                              {h.via === "stockbridge" && (
                                <span className="ml-1 text-indigo-500">(via SB{h.stockbridge_status ? `: ${h.stockbridge_status}` : ""})</span>
                              )}
                            </p>
                          ))}
                        </div>

                        {linked && (
                          <div className="mt-3 flex items-center gap-1 text-[11px] text-gray-400">
                            <LinkIcon size={10} />
                            SB ref: <span className="font-mono">{order.stockbridgeInternalRef}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

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
    </div>
  );
}
