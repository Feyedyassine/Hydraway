"use client";

import { useEffect, useState } from "react";
import { useToast } from "../toast";

interface Me {
  id: number;
  name: string;
  email: string;
  role: "admin" | "warehouse";
}

export default function ProfilePage() {
  const [me, setMe] = useState<Me | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const toast = useToast();

  useEffect(() => {
    fetch("/api/admin/auth")
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((data) => {
        // /api/admin/auth returns the JWT payload, not full user — fetch from users list
        return fetch("/api/admin/users")
          .then((r) => (r.ok ? r.json() : Promise.reject()))
          .then((all: Me[]) => {
            const current = all.find((u) => u.id === data.user.userId) ?? null;
            if (current) {
              setMe(current);
              setName(current.name);
              setEmail(current.email);
            } else {
              // Warehouse role can't hit /users — fall back to JWT payload
              const fallback: Me = {
                id: data.user.userId,
                name: "",
                email: data.user.email,
                role: data.user.role,
              };
              setMe(fallback);
              setEmail(fallback.email);
            }
          })
          .catch(() => {
            const fallback: Me = {
              id: data.user.userId,
              name: "",
              email: data.user.email,
              role: data.user.role,
            };
            setMe(fallback);
            setEmail(fallback.email);
          });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword && newPassword !== confirmPassword) {
      toast.error("New passwords don't match");
      return;
    }

    setSaving(true);
    try {
      const body: Record<string, string> = {};
      if (name && name !== me?.name) body.name = name;
      if (email && email !== me?.email) body.email = email;
      if (newPassword) {
        body.newPassword = newPassword;
        body.currentPassword = currentPassword;
      }

      if (Object.keys(body).length === 0) {
        toast.error("Nothing to update");
        return;
      }

      const res = await fetch("/api/admin/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success("Profile updated");
        setMe(data.user);
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        toast.error(data.error || "Update failed");
      }
    } catch {
      toast.error("Update failed");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center py-20 text-gray-400">Loading...</div>;
  }
  if (!me) {
    return <div className="py-20 text-center text-gray-400">Could not load profile.</div>;
  }

  return (
    <div className="max-w-2xl">
      <h1 className="mb-2 text-2xl font-bold text-gray-900">My Profile</h1>
      <p className="mb-6 text-sm text-gray-500">
        Update your name, email, or password. Role: <span className="font-medium capitalize">{me.role}</span>.
      </p>

      <form onSubmit={handleSave} className="space-y-6 rounded-xl bg-white p-6 shadow-sm">
        <div>
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-gray-400">Identity</p>
          <div className="space-y-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500">Name</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-gray-900"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-gray-900"
              />
            </div>
          </div>
        </div>

        <div>
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-gray-400">Change password</p>
          <p className="mb-3 text-xs text-gray-400">Leave blank to keep your current password.</p>
          <div className="space-y-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500">Current password</label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                autoComplete="current-password"
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-gray-900"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-500">New password (min 8)</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  autoComplete="new-password"
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-gray-900"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-500">Confirm new password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  autoComplete="new-password"
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-gray-900"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save changes"}
          </button>
        </div>
      </form>
    </div>
  );
}
