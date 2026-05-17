"use client";

import { useTranslations } from "next-intl";
import Image from "next/image";
import { Zap, Leaf, Sparkles, Droplets } from "lucide-react";

export default function Hero() {
  const t = useTranslations("hero");

  const badges = [
    { icon: Droplets, label: t("stats.electrolytes"), delay: "0.6s" },
    { icon: Sparkles, label: t("stats.sugarFree"), delay: "0.8s" },
    { icon: Zap, label: t("stats.vitamins"), delay: "1s" },
    { icon: Leaf, label: t("stats.vegan"), delay: "1.2s" },
  ];

  return (
    <section className="relative flex min-h-screen items-center overflow-hidden bg-navy">
      {/* Gradient backdrop */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-navy via-navy-light to-navy-800" />
        {/* Accent glows */}
        <div className="animate-pulse-glow absolute -top-32 -right-32 h-[500px] w-[500px] rounded-full bg-brand-red/8 blur-[120px]" />
        <div className="animate-pulse-glow absolute -bottom-48 -left-48 h-[600px] w-[600px] rounded-full bg-brand-blue/15 blur-[140px]" style={{ animationDelay: "2s" }} />
        <div className="animate-pulse-glow absolute top-1/2 left-1/2 h-[300px] w-[300px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand-red/5 blur-[100px]" style={{ animationDelay: "4s" }} />
      </div>

      {/* Decorative grid lines */}
      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
        backgroundSize: "80px 80px",
      }} />

      <div className="relative z-10 mx-auto grid w-full max-w-7xl grid-cols-1 items-center gap-12 px-5 py-32 lg:grid-cols-2 lg:gap-8 lg:px-8">
        {/* Left — Copy */}
        <div className="flex flex-col gap-8">
          {/* Eyebrow badge */}
          <div
            className="animate-fade-in inline-flex w-fit items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 backdrop-blur-sm"
          >
            <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-brand-red" />
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-white/60">
              {t("badge")}
            </span>
          </div>

          {/* Headline */}
          <h1 className="animate-fade-in-up font-heading leading-[0.95]" style={{ animationDelay: "0.2s" }}>
            <span className="block text-5xl font-extrabold tracking-tight text-white sm:text-6xl lg:text-7xl">
              {t("title")}
            </span>
            <span className="mt-2 block text-5xl font-extrabold tracking-tight text-gradient sm:text-6xl lg:text-7xl">
              {t("titleAccent")}
            </span>
          </h1>

          {/* Description */}
          <p
            className="animate-fade-in-up max-w-lg text-lg leading-relaxed text-white/50 sm:text-xl"
            style={{ animationDelay: "0.4s" }}
          >
            {t("description")}
          </p>

          {/* CTA buttons */}
          <div
            className="animate-fade-in-up flex flex-wrap items-center gap-4"
            style={{ animationDelay: "0.5s" }}
          >
            <a
              href="#produit"
              className="group relative inline-flex items-center gap-2 overflow-hidden rounded-full border border-brand-red/60 bg-transparent px-8 py-4 text-base font-semibold text-white transition-all duration-300 hover:bg-brand-red/10"
            >
              <span className="relative z-10">{t("cta")}</span>
              <svg
                className="relative z-10 h-4 w-4 transition-transform group-hover:translate-x-1"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
              {/* Hover shine */}
              <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
            </a>
            <a
              href="#avantages"
              className="inline-flex items-center gap-2 rounded-full border border-white/15 px-7 py-4 text-base font-medium text-white/70 transition-all duration-300 hover:border-white/30 hover:text-white"
            >
              {t("ctaSecondary")}
            </a>
          </div>

          {/* Feature badges */}
          <div className="flex flex-wrap gap-3 pt-4">
            {badges.map(({ icon: Icon, label, delay }) => (
              <div
                key={label}
                className="animate-fade-in-up glass-card flex items-center gap-2 rounded-full px-4 py-2"
                style={{ animationDelay: delay }}
              >
                <Icon size={14} className="text-brand-red-light" strokeWidth={2} />
                <span className="text-xs font-semibold text-white/70">{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right — Product visual */}
        <div className="relative flex items-center justify-center">
          {/* Glow behind product */}
          <div className="absolute h-[400px] w-[400px] rounded-full bg-gradient-to-br from-brand-red/15 to-brand-blue/10 blur-[80px] lg:h-[500px] lg:w-[500px]" />

          {/* Rotating ring */}
          <div className="animate-spin-slow absolute h-[340px] w-[340px] rounded-full border border-dashed border-white/[0.06] lg:h-[440px] lg:w-[440px]" />

          {/* Product image */}
          <div className="relative z-10">
            <Image
              src="/images/hydraway-15.png"
              alt="HydraWay Red Berries"
              width={716}
              height={999}
              priority
              className="h-auto w-[240px] drop-shadow-[0_20px_60px_rgba(220,38,38,0.3)] sm:w-[280px] lg:w-[320px]"
              style={{ objectFit: "contain" }}
            />
          </div>

        </div>
      </div>

    </section>
  );
}
