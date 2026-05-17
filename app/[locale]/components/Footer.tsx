"use client";

import { useTranslations } from "next-intl";
import { Instagram, Facebook, Mail, MapPin, Phone } from "lucide-react";
import Image from "next/image";

export default function Footer() {
  const t = useTranslations("footer");
  const nav = useTranslations("nav");

  const navLinks = [
    { href: "#", label: nav("home") },
    { href: "#produit", label: nav("products") },
    { href: "#avantages", label: nav("about") },
    { href: "/contact", label: nav("contact") },
  ];

  const legalLinks = [
    { href: "/mentions-legales", label: t("legal") },
    { href: "/cgv", label: t("cgv") },
    { href: "/politique-confidentialite", label: t("privacy") },
    { href: "/politique-retour", label: t("returns") },
    { href: "/#faq", label: nav("faq") },
  ];

  return (
    <footer id="contact" className="relative bg-navy">
      {/* Top gradient line */}
      <div className="h-px w-full bg-gradient-to-r from-transparent via-brand-red/40 to-transparent" />

      <div className="mx-auto max-w-7xl px-5 py-16 lg:px-8 lg:py-20">
        <div className="grid grid-cols-1 gap-12 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand column */}
          <div className="lg:col-span-1">
            <div className="mb-4">
              <Image
                src="/Logo_white.svg"
                alt="HydraWay"
                width={140}
                height={39}
                className="h-8 w-auto"
              />
            </div>
            <p className="mb-6 max-w-xs text-sm leading-relaxed text-white/35">
              {t("description")}
            </p>
            {/* Social icons */}
            <div className="flex gap-3">
              {[Instagram, Facebook, Mail].map((Icon, i) => (
                <a
                  key={i}
                  href="#"
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 text-white/40 transition-all hover:border-brand-red/30 hover:text-brand-red-light"
                >
                  <Icon size={16} strokeWidth={1.5} />
                </a>
              ))}
            </div>
          </div>

          {/* Navigation */}
          <div>
            <h4 className="mb-5 text-xs font-bold uppercase tracking-[0.15em] text-white/25">
              {t("navigation")}
            </h4>
            <ul className="flex flex-col gap-3">
              {navLinks.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    className="text-sm text-white/45 transition-colors hover:text-white"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="mb-5 text-xs font-bold uppercase tracking-[0.15em] text-white/25">
              {t("legalSection")}
            </h4>
            <ul className="flex flex-col gap-3">
              {legalLinks.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    className="text-sm text-white/45 transition-colors hover:text-white"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="mb-5 text-xs font-bold uppercase tracking-[0.15em] text-white/25">
              {t("contact")}
            </h4>
            <div className="flex flex-col gap-4">
              <a
                href="mailto:info@hydraway.com.tn"
                className="flex items-center gap-2.5 text-sm text-white/45 transition-colors hover:text-white"
              >
                <Mail size={14} strokeWidth={1.5} />
                info@hydraway.com.tn
              </a>
              <a
                href="tel:+21652888739"
                className="flex items-center gap-2.5 text-sm text-white/45 transition-colors hover:text-white"
              >
                <Phone size={14} strokeWidth={1.5} />
                +216 52 888 739
              </a>
              <div className="flex items-start gap-2.5 text-sm text-white/45">
                <MapPin size={14} strokeWidth={1.5} className="mt-0.5 shrink-0" />
                <span>
                  9 rue Noureddine El Khayechi
                  <br />
                  La Marsa Safsaf, 2078 La Marsa
                  <br />
                  Tunisie
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-16 flex flex-col items-center gap-4 border-t border-white/[0.06] pt-8 sm:flex-row sm:justify-between">
          <div className="flex flex-col gap-1">
            <p className="text-xs text-white/25">
              &copy; {new Date().getFullYear()} HydraWay. {t("rights")}
            </p>
            <p className="text-[10px] text-white/15">
              Powered by{" "}
              <a href="https://www.grafen.tn/" target="_blank" rel="noopener noreferrer" className="text-white/25 transition-colors hover:text-white">grafen.tn</a>
            </p>
          </div>
          <p className="text-xs text-white/25">{t("madeIn")}</p>
        </div>
      </div>
    </footer>
  );
}
