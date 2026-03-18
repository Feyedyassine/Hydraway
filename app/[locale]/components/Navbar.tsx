"use client";

import { useState, useEffect, useRef } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useRouter, usePathname, Link } from "@/i18n/navigation";
import { Menu, X, ShoppingBag, ChevronDown } from "lucide-react";
import Image from "next/image";
import { useCart } from "@/lib/cart-context";

export default function Navbar() {
  const t = useTranslations("nav");
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const { openDrawer, count } = useCart();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const langRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (langRef.current && !langRef.current.contains(e.target as Node)) {
        setLangOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const switchLocale = (next: string) => {
    router.replace(pathname, { locale: next });
    setLangOpen(false);
  };

  const locales = [
    { code: "fr", label: "Français" },
    { code: "en", label: "English" },
  ];

  const navLinks: { href: string; label: string; isRoute?: boolean }[] = [
    { href: "/#produit", label: t("products") },
    { href: "/about", label: t("about"), isRoute: true },
    { href: "/#faq", label: t("faq") },
    { href: "/contact", label: t("contact"), isRoute: true },
  ];

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          scrolled || pathname !== "/"
            ? "bg-navy/90 backdrop-blur-xl shadow-lg shadow-navy/20 py-3"
            : "bg-transparent py-5"
        }`}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 lg:px-8">
          {/* Logo */}
          <Link href="/" className="relative z-10 flex items-center">
            <Image
              src="/Logo_white.svg"
              alt="HydraWay"
              width={140}
              height={39}
              className="h-8 w-auto"
              priority
            />
          </Link>

          {/* Desktop nav */}
          <div className="hidden items-center gap-8 md:flex">
            {navLinks.map((link) =>
              link.isRoute ? (
                <Link
                  key={link.href}
                  href={link.href}
                  className="group relative text-sm font-medium text-white/70 transition-colors hover:text-white"
                >
                  {link.label}
                  <span className="absolute -bottom-1 left-0 h-px w-0 bg-gradient-to-r from-brand-red to-accent-pink transition-all duration-300 group-hover:w-full" />
                </Link>
              ) : (
                <a
                  key={link.href}
                  href={link.href}
                  className="group relative text-sm font-medium text-white/70 transition-colors hover:text-white"
                >
                  {link.label}
                  <span className="absolute -bottom-1 left-0 h-px w-0 bg-gradient-to-r from-brand-red to-accent-pink transition-all duration-300 group-hover:w-full" />
                </a>
              )
            )}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-3">
            {/* Language dropdown */}
            <div ref={langRef} className="relative">
              <button
                onClick={() => setLangOpen(!langOpen)}
                className="flex items-center gap-1 overflow-hidden rounded-full border border-white/15 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-white/80 transition-all hover:border-white/30 hover:text-white"
              >
                {locale.toUpperCase()}
                <ChevronDown size={12} className={`transition-transform duration-200 ${langOpen ? "rotate-180" : ""}`} />
              </button>
              {langOpen && (
                <div className="absolute right-0 mt-2 min-w-[120px] overflow-hidden rounded-xl border border-white/15 bg-navy/95 backdrop-blur-xl shadow-xl">
                  {locales.map(({ code, label }) => (
                    <button
                      key={code}
                      onClick={() => switchLocale(code)}
                      className={`flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm transition-colors hover:bg-white/10 ${
                        locale === code ? "text-white font-semibold" : "text-white/60"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Cart */}
            <button
              onClick={openDrawer}
              className="relative rounded-full border border-white/15 p-2.5 text-white/80 transition-all hover:border-white/30 hover:text-white"
            >
              <ShoppingBag size={18} strokeWidth={1.5} />
              {count > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-brand-red text-[10px] font-bold text-white">
                  {count}
                </span>
              )}
            </button>

            {/* Mobile toggle */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="relative z-50 p-2 text-white md:hidden"
            >
              {mobileOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile menu overlay */}
      <div
        className={`fixed inset-0 z-40 bg-navy/98 backdrop-blur-2xl transition-all duration-500 md:hidden ${
          mobileOpen
            ? "pointer-events-auto opacity-100"
            : "pointer-events-none opacity-0"
        }`}
      >
        <div className="flex h-full flex-col items-center justify-center gap-8">
          {navLinks.map((link, i) => {
            const classes = "font-heading text-3xl font-bold text-white transition-all hover:text-gradient";
            const delay = mobileOpen ? `${i * 80}ms` : "0ms";
            const style = {
              opacity: mobileOpen ? 1 : 0,
              transform: mobileOpen ? "translateY(0)" : "translateY(20px)",
              transition: `opacity 0.4s ease ${delay}, transform 0.4s ease ${delay}, color 0.2s ease ${delay}`,
            };
            return link.isRoute ? (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className={classes}
                style={style}
              >
                {link.label}
              </Link>
            ) : (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className={classes}
                style={style}
              >
                {link.label}
              </a>
            );
          })}
        </div>
      </div>
    </>
  );
}
