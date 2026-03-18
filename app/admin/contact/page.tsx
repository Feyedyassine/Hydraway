"use client";

import { useEffect, useState, useMemo } from "react";
import { Search, ChevronLeft, ChevronRight, Mail, Eye, CheckCircle, Trash2, X } from "lucide-react";
import { useToast } from "../toast";

interface ContactMessage {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  subject: string;
  message: string;
  status: "new" | "read" | "replied";
  createdAt: string;
}

const PAGE_SIZE = 10;

const subjectLabels: Record<string, string> = {
  general: "General Inquiry",
  order: "Order Question",
  partnership: "Partnership",
  other: "Other",
};

const statusConfig = {
  new: { label: "New", bg: "bg-blue-100 text-blue-800", icon: Mail },
  read: { label: "Read", bg: "bg-yellow-100 text-yellow-800", icon: Eye },
  replied: { label: "Replied", bg: "bg-green-100 text-green-800", icon: CheckCircle },
};

export default function AdminContactPage() {
  const toast = useToast();
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<ContactMessage | null>(null);

  const fetchMessages = () => {
    fetch("/api/admin/contact")
      .then((res) => (res.ok ? res.json() : []))
      .then(setMessages)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchMessages();
  }, []);

  const filtered = useMemo(() => {
    return messages.filter((m) => {
      const q = search.toLowerCase();
      const matchesSearch =
        !q ||
        m.name.toLowerCase().includes(q) ||
        m.email.toLowerCase().includes(q) ||
        m.message.toLowerCase().includes(q) ||
        (m.phone && m.phone.includes(q));
      const matchesStatus = !statusFilter || m.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [messages, search, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter]);

  const updateStatus = async (id: number, status: string) => {
    try {
      const res = await fetch("/api/admin/contact", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
      if (!res.ok) throw new Error();
      setMessages((prev) =>
        prev.map((m) => (m.id === id ? { ...m, status: status as ContactMessage["status"] } : m))
      );
      if (selected?.id === id) {
        setSelected((prev) => prev ? { ...prev, status: status as ContactMessage["status"] } : null);
      }
      toast.success("Status updated");
    } catch {
      toast.error("Failed to update status");
    }
  };

  const deleteMessage = async (id: number) => {
    if (!confirm("Delete this message?")) return;
    try {
      const res = await fetch("/api/admin/contact", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) throw new Error();
      setMessages((prev) => prev.filter((m) => m.id !== id));
      if (selected?.id === id) setSelected(null);
      toast.success("Message deleted");
    } catch {
      toast.error("Failed to delete message");
    }
  };

  const openMessage = (msg: ContactMessage) => {
    setSelected(msg);
    if (msg.status === "new") {
      updateStatus(msg.id, "read");
    }
  };

  const newCount = messages.filter((m) => m.status === "new").length;

  if (loading) {
    return <div className="flex items-center justify-center py-20 text-gray-400">Loading...</div>;
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          Contact Messages
          {newCount > 0 && (
            <span className="ml-2 inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-sm font-medium text-blue-800">
              {newCount} new
            </span>
          )}
        </h1>
        <p className="text-sm text-gray-500">
          {filtered.length} of {messages.length} messages
        </p>
      </div>

      {/* Filters */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative min-w-[200px] max-w-md flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email, or message..."
            className="w-full rounded-lg border border-gray-200 py-2 pl-9 pr-3 text-sm outline-none focus:border-gray-900"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-gray-900"
        >
          <option value="">All statuses</option>
          <option value="new">New</option>
          <option value="read">Read</option>
          <option value="replied">Replied</option>
        </select>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="border-b bg-gray-50 text-xs uppercase text-gray-500">
            <tr>
              <th className="px-5 py-3">Status</th>
              <th className="px-5 py-3">Name</th>
              <th className="px-5 py-3">Subject</th>
              <th className="px-5 py-3">Email</th>
              <th className="px-5 py-3">Date</th>
              <th className="px-5 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginated.map((m) => {
              const sc = statusConfig[m.status];
              return (
                <tr
                  key={m.id}
                  className={`cursor-pointer border-b last:border-0 transition-colors hover:bg-gray-50 ${
                    m.status === "new" ? "bg-blue-50/30" : ""
                  }`}
                  onClick={() => openMessage(m)}
                >
                  <td className="px-5 py-3">
                    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${sc.bg}`}>
                      <sc.icon size={12} />
                      {sc.label}
                    </span>
                  </td>
                  <td className={`px-5 py-3 ${m.status === "new" ? "font-semibold text-gray-900" : "text-gray-700"}`}>
                    {m.name}
                  </td>
                  <td className="px-5 py-3 text-gray-600">
                    {subjectLabels[m.subject] || m.subject}
                  </td>
                  <td className="px-5 py-3 text-gray-500">{m.email}</td>
                  <td className="px-5 py-3 text-gray-400">
                    {new Date(m.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-5 py-3">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteMessage(m.id);
                      }}
                      className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600"
                    >
                      <Trash2 size={15} />
                    </button>
                  </td>
                </tr>
              );
            })}
            {paginated.length === 0 && (
              <tr>
                <td colSpan={6} className="py-12 text-center text-gray-400">
                  {messages.length === 0 ? "No messages yet" : "No messages match your search"}
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

      {/* Message Detail Modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setSelected(null)}>
          <div
            className="w-full max-w-lg rounded-2xl bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b px-6 py-4">
              <div>
                <h2 className="text-lg font-bold text-gray-900">{selected.name}</h2>
                <p className="text-sm text-gray-500">{selected.email}</p>
              </div>
              <button
                onClick={() => setSelected(null)}
                className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100"
              >
                <X size={20} />
              </button>
            </div>

            {/* Body */}
            <div className="px-6 py-5">
              <div className="mb-4 flex flex-wrap gap-3 text-sm">
                <span className="text-gray-500">
                  <strong>Subject:</strong> {subjectLabels[selected.subject] || selected.subject}
                </span>
                {selected.phone && (
                  <span className="text-gray-500">
                    <strong>Phone:</strong> {selected.phone}
                  </span>
                )}
                <span className="text-gray-400">
                  {new Date(selected.createdAt).toLocaleString()}
                </span>
              </div>
              <div className="rounded-xl bg-gray-50 p-4">
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-700">
                  {selected.message}
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between border-t px-6 py-4">
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400">Mark as:</span>
                {(["new", "read", "replied"] as const).map((s) => {
                  const sc = statusConfig[s];
                  return (
                    <button
                      key={s}
                      onClick={() => updateStatus(selected.id, s)}
                      className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium transition-opacity ${sc.bg} ${
                        selected.status === s ? "opacity-100 ring-2 ring-offset-1 ring-gray-300" : "opacity-60 hover:opacity-100"
                      }`}
                    >
                      <sc.icon size={12} />
                      {sc.label}
                    </button>
                  );
                })}
              </div>
              <a
                href={`mailto:${selected.email}?subject=Re: ${subjectLabels[selected.subject] || selected.subject}`}
                onClick={() => updateStatus(selected.id, "replied")}
                className="inline-flex items-center gap-1.5 rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-800"
              >
                <Mail size={14} />
                Reply
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
