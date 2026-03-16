"use client";

import { useEffect, useState } from "react";
import { ChevronDown } from "lucide-react";

interface Order {
  id: number;
  status: string;
  paymentMethod: string;
  paymentStatus: string;
  total: number;
  createdAt: string;
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

const STATUS_OPTIONS = ["pending", "confirmed", "processing", "shipped", "delivered", "cancelled"];

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  confirmed: "bg-blue-100 text-blue-800",
  processing: "bg-purple-100 text-purple-800",
  shipped: "bg-indigo-100 text-indigo-800",
  delivered: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
};

const paymentStatusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  paid: "bg-green-100 text-green-800",
  failed: "bg-red-100 text-red-800",
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<number | null>(null);

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

  const updateStatus = async (orderId: number, status: string) => {
    await fetch("/api/admin/orders", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: orderId, status }),
    });
    fetchOrders();
  };

  if (loading) {
    return <div className="flex items-center justify-center py-20 text-gray-400">Loading...</div>;
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
        <span className="text-sm text-gray-500">{orders.length} total</span>
      </div>

      {orders.length === 0 ? (
        <div className="rounded-xl bg-white py-20 text-center text-gray-400 shadow-sm">
          No orders yet
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => (
            <div key={order.id} className="overflow-hidden rounded-xl bg-white shadow-sm">
              {/* Order header row */}
              <button
                onClick={() => setExpandedId(expandedId === order.id ? null : order.id)}
                className="flex w-full items-center gap-4 px-5 py-4 text-left hover:bg-gray-50"
              >
                <span className="w-16 text-sm font-bold text-gray-900">#{order.id}</span>
                <span className="flex-1 text-sm text-gray-600">
                  {order.client.firstName} {order.client.lastName}
                </span>
                <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusColors[order.status]}`}>
                  {order.status}
                </span>
                <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${paymentStatusColors[order.paymentStatus]}`}>
                  {order.paymentMethod === "cod" ? "COD" : "Flouci"} - {order.paymentStatus}
                </span>
                <span className="w-20 text-right text-sm font-semibold text-gray-900">
                  {order.total.toFixed(2)} TND
                </span>
                <ChevronDown
                  size={16}
                  className={`text-gray-400 transition-transform ${expandedId === order.id ? "rotate-180" : ""}`}
                />
              </button>

              {/* Expanded details */}
              {expandedId === order.id && (
                <div className="border-t border-gray-100 px-5 py-4">
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

                    {/* Status update */}
                    <div>
                      <h3 className="mb-2 text-xs font-semibold uppercase text-gray-400">
                        Update Status
                      </h3>
                      <select
                        value={order.status}
                        onChange={(e) => updateStatus(order.id, e.target.value)}
                        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-gray-900"
                      >
                        {STATUS_OPTIONS.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                      <p className="mt-2 text-xs text-gray-400">
                        Ordered: {new Date(order.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
