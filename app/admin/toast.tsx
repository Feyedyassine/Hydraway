"use client";
import { createContext, useCallback, useContext, useState, useEffect, type ReactNode } from "react";

type Toast = { id: number; msg: string; type: "success" | "error"; fading: boolean };
type ToastCtx = { success: (msg: string) => void; error: (msg: string) => void };

const Ctx = createContext<ToastCtx>({ success: () => {}, error: () => {} });
let nextId = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const push = useCallback((msg: string, type: Toast["type"]) => {
    const id = nextId++;
    setToasts((t) => [...t, { id, msg, type, fading: false }]);
    setTimeout(() => setToasts((t) => t.map((x) => (x.id === id ? { ...x, fading: true } : x))), 2600);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3000);
  }, []);

  const ctx: ToastCtx = {
    success: useCallback((m: string) => push(m, "success"), [push]),
    error: useCallback((m: string) => push(m, "error"), [push]),
  };

  return (
    <Ctx.Provider value={ctx}>
      {children}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto px-4 py-3 rounded-lg shadow-lg text-sm font-medium text-white transition-all duration-300 ${
              t.type === "success" ? "bg-green-600" : "bg-red-600"
            } ${t.fading ? "opacity-0 translate-x-4" : "opacity-100 animate-[slideIn_0.3s_ease-out]"}`}
          >
            {t.msg}
          </div>
        ))}
      </div>
      <style>{`@keyframes slideIn{from{opacity:0;transform:translateX(100%)}to{opacity:1;transform:translateX(0)}}`}</style>
    </Ctx.Provider>
  );
}

export const useToast = () => useContext(Ctx);
