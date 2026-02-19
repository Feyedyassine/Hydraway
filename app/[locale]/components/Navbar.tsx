"use client";

import { useState, useEffect } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useRouter, usePathname, Link } from "@/i18n/navigation";
import { Menu, X, ShoppingBag } from "lucide-react";
import Image from "next/image";

export default function Navbar() {
  const t = useTranslations("nav");
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const switchLocale = () => {
    const next = locale === "fr" ? "en" : "fr";
    router.replace(pathname, { locale: next });
  };

  const navLinks: { href: string; label: string; isRoute?: boolean }[] = [
    { href: "/#produit", label: t("products") },
    { href: "/about", label: t("about"), isRoute: true },
    { href: "/#faq", label: t("faq") },
    { href: "/#contact", label: t("contact") },
  ];

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          scrolled
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
            {/* Language toggle */}
            <button
              onClick={switchLocale}
              className="relative overflow-hidden rounded-full border border-white/15 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-white/80 transition-all hover:border-white/30 hover:text-white"
            >
              {locale === "fr" ? "EN" : "FR"}
            </button>

            {/* Cart */}
            <button className="relative rounded-full border border-white/15 p-2.5 text-white/80 transition-all hover:border-white/30 hover:text-white">
              <ShoppingBag size={18} strokeWidth={1.5} />
            </button>

            {/* CTA */}
            <a
              href="#commander"
              className="hidden rounded-full bg-gradient-to-r from-brand-red to-brand-crimson px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-brand-red/25 transition-all hover:shadow-brand-red/40 hover:brightness-110 md:block"
            >
              {t("order")}
            </a>

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
            const style = {
              transitionDelay: mobileOpen ? `${i * 80}ms` : "0ms",
              opacity: mobileOpen ? 1 : 0,
              transform: mobileOpen ? "translateY(0)" : "translateY(20px)",
              transition: "opacity 0.4s ease, transform 0.4s ease, color 0.2s ease",
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
          <a
            href="#commander"
            onClick={() => setMobileOpen(false)}
            className="mt-4 rounded-full bg-gradient-to-r from-brand-red to-brand-crimson px-8 py-3 text-lg font-semibold text-white shadow-lg shadow-brand-red/30"
            style={{
              transitionDelay: mobileOpen ? "320ms" : "0ms",
              opacity: mobileOpen ? 1 : 0,
              transform: mobileOpen ? "translateY(0)" : "translateY(20px)",
              transition: "opacity 0.4s ease, transform 0.4s ease",
            }}
          >
            {t("order")}
          </a>
        </div>
      </div>
    </>
  );
}
