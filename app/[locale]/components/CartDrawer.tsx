"use client";

import { useCart } from "@/lib/cart-context";
import { useTranslations, useLocale } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { X, Minus, Plus, Trash2, ShoppingBag } from "lucide-react";
import Image from "next/image";

export default function CartDrawer() {
  const t = useTranslations("cart");
  const locale = useLocale();
  const router = useRouter();
  const { items, drawerOpen, closeDrawer, updateQuantity, removeItem, total, count } = useCart();

  const handleCheckout = () => {
    closeDrawer();
    router.push("/checkout");
  };

  return (
    <>
      {/* Backdrop */}
      {drawerOpen && (
        <div
          className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm transition-opacity"
          onClick={closeDrawer}
        />
      )}

      {/* Drawer */}
      <div
        className={`fixed top-0 right-0 z-[70] flex h-full w-full max-w-md flex-col bg-white shadow-2xl transition-transform duration-300 ${
          drawerOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b px-6 py-5">
          <div className="flex items-center gap-3">
            <ShoppingBag size={20} className="text-navy" />
            <h2 className="text-lg font-bold text-navy">{t("title")}</h2>
            {count > 0 && (
              <span className="rounded-full bg-navy px-2.5 py-0.5 text-xs font-bold text-white">
                {count}
              </span>
            )}
          </div>
          <button
            onClick={closeDrawer}
            className="rounded-full p-2 text-navy/40 transition-colors hover:bg-gray-100 hover:text-navy"
          >
            <X size={20} />
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-auto px-6 py-4">
          {items.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <ShoppingBag size={48} className="mb-4 text-navy/10" />
              <p className="text-sm text-navy/40">{t("empty")}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {items.map((item) => (
                <div key={item.productId} className="flex gap-4 rounded-2xl bg-gray-50 p-4">
                  {/* Image */}
                  {item.image && (
                    <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-white">
                      <Image
                        src={item.image}
                        alt={locale === "fr" ? item.nameFr : item.name}
                        width={80}
                        height={80}
                        className="h-full w-full object-contain p-1"
                      />
                    </div>
                  )}

                  {/* Details */}
                  <div className="flex flex-1 flex-col justify-between">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm font-semibold text-navy">
                          {locale === "fr" ? item.nameFr : item.name}
                        </p>
                        <p className="text-xs text-navy/40">{item.price.toFixed(2)} TND</p>
                      </div>
                      <button
                        onClick={() => removeItem(item.productId)}
                        className="text-navy/20 transition-colors hover:text-red-500"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>

                    {/* Quantity controls */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                        className="flex h-7 w-7 items-center justify-center rounded-full border border-gray-200 text-navy/50 hover:bg-gray-100"
                      >
                        <Minus size={12} />
                      </button>
                      <span className="w-6 text-center text-sm font-semibold text-navy">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                        disabled={item.quantity >= item.stock}
                        className="flex h-7 w-7 items-center justify-center rounded-full border border-gray-200 text-navy/50 hover:bg-gray-100 disabled:opacity-30"
                      >
                        <Plus size={12} />
                      </button>
                      <span className="ml-auto text-sm font-bold text-navy">
                        {(item.price * item.quantity).toFixed(2)} TND
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="border-t px-6 py-5">
            <div className="mb-4 flex items-center justify-between">
              <span className="text-sm font-semibold text-navy/60">{t("total")}</span>
              <span className="text-xl font-bold text-navy">{total.toFixed(2)} TND</span>
            </div>
            <button
              onClick={handleCheckout}
              className="w-full rounded-full bg-navy py-4 text-base font-semibold text-white transition-colors hover:bg-navy-light"
            >
              {t("checkout")}
            </button>
          </div>
        )}
      </div>
    </>
  );
}
