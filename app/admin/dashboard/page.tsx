"use client";

import { useEffect, useState } from "react";
import { ShoppingCart, DollarSign, Users, AlertTriangle } from "lucide-react";

interface Client {
  id: number;
  firstName: string;
  lastName: string;
}

interface Order {
  id: number;
  status: string;
  paymentMethod: string;
  paymentStatus: string;
  total: number;
  createdAt: string;
  client: Client;
  items: unknown[];
}

interface Product {
  id: number;
  name: string;
  stock: number;
  active: boolean;
  price: number;
}

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  confirmed: "bg-blue-100 text-blue-800",
  shipped: "bg-indigo-100 text-indigo-800",
  delivered: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
  returned: "bg-orange-100 text-orange-800",
};

export default function DashboardPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/admin/orders").then((r) => (r.ok ? r.json() : [])),
      fetch("/api/admin/products").then((r) => (r.ok ? r.json() : [])),
      fetch("/api/admin/clients").then((r) => (r.ok ? r.json() : [])),
    ])
      .then(([o, p, c]) => {
        setOrders(o);
        setProducts(p);
        setClients(c);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-gray-400">
        Loading...
      </div>
    );
  }

  const pendingCount = orders.filter((o) => o.status === "pending").length;
  const paidOrders = orders.filter((o) => o.paymentStatus === "paid");
  const codRevenue = paidOrders.filter((o) => o.paymentMethod === "cod").reduce((sum, o) => sum + o.total, 0);
  const flouciRevenue = paidOrders.filter((o) => o.paymentMethod === "flouci").reduce((sum, o) => sum + o.total, 0);
  const lowStockProducts = products.filter((p) => p.active && p.stock < 20);
  const recentOrders = orders.slice(0, 5);

  const stats = [
    {
      title: "Total Orders",
      value: orders.length,
      subtitle: `${pendingCount} pending`,
      icon: ShoppingCart,
    },
    {
      title: "COD Revenue",
      value: `${codRevenue.toFixed(2)} TND`,
      subtitle: "cash on delivery",
      icon: DollarSign,
    },
    {
      title: "Flouci Revenue",
      value: `${flouciRevenue.toFixed(2)} TND`,
      subtitle: "online payments",
      icon: DollarSign,
    },
    {
      title: "Clients",
      value: clients.length,
      subtitle: "total registered",
      icon: Users,
    },
  ];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500">Overview of your store</p>
      </div>

      {/* Stat Cards */}
      <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((stat) => (
          <div
            key={stat.title}
            className="rounded-xl bg-white p-5 shadow-sm"
          >
            <div className="mb-3 flex items-center justify-between">
              <span className="text-sm text-gray-500">{stat.title}</span>
              <stat.icon className="h-5 w-5 text-gray-400" />
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {stat.value}
            </div>
            <p className="mt-1 text-xs text-gray-400">{stat.subtitle}</p>
          </div>
        ))}
      </div>

      {/* Low Stock Alert */}
      {lowStockProducts.length > 0 && (
        <div className="mb-8 rounded-xl border border-red-200 bg-red-50 px-5 py-4">
          <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-red-800">
            <AlertTriangle size={16} />
            Low Stock Alert
          </div>
          <ul className="space-y-1">
            {lowStockProducts.map((p) => (
              <li key={p.id} className="flex items-center justify-between text-sm">
                <span className="text-red-700">{p.name}</span>
                <span className="font-medium text-red-800">{p.stock} units left</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Recent Orders */}
      <div className="rounded-xl bg-white shadow-sm">
        <div className="border-b px-5 py-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Recent Orders
          </h2>
        </div>
        <ul className="divide-y">
          {recentOrders.map((order) => (
            <li
              key={order.id}
              className="flex items-center justify-between px-5 py-3"
            >
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium text-gray-900">
                  #{order.id}
                </span>
                <span className="text-sm text-gray-500">
                  {order.client.firstName} {order.client.lastName}
                </span>
              </div>
              <div className="flex items-center gap-4">
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    statusColors[order.status] ?? "bg-gray-100 text-gray-800"
                  }`}
                >
                  {order.status}
                </span>
                <span className="text-sm font-medium text-gray-900">
                  {order.total.toFixed(2)} TND
                </span>
              </div>
            </li>
          ))}
          {recentOrders.length === 0 && (
            <li className="px-5 py-8 text-center text-sm text-gray-400">
              No orders yet
            </li>
          )}
        </ul>
      </div>
    </div>
  );
}
