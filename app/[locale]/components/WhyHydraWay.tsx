"use client";

import { useTranslations } from "next-intl";
import Image from "next/image";
import {
  Atom,
  Zap,
  Check,
  Droplets,
  BatteryFull,
  Leaf,
  Gauge,
} from "lucide-react";
import ScrollReveal from "./ScrollReveal";

const useCases = [
  { key: "sport", image: "/images/effort.jpg" },
  { key: "heat", image: "/images/hot.png" },
  { key: "recovery", image: "/images/recoup.jpg" },
] as const;

const formulaCards = [
  {
    key: "minerals" as const,
    icon: Atom,
    color: "#1e3a8a",
    accentBg: "bg-brand-blue/10",
  },
  {
    key: "vitamins" as const,
    icon: Zap,
    color: "#dc2626",
    accentBg: "bg-brand-red/10",
  },
] as const;

const advantages = [
  { key: "hydration", icon: Droplets, color: "text-cyan-500", bg: "bg-cyan-500/10" },
  { key: "recovery", icon: BatteryFull, color: "text-emerald-500", bg: "bg-emerald-500/10" },
  { key: "taste", icon: Leaf, color: "text-amber-500", bg: "bg-amber-500/10" },
  { key: "performance", icon: Gauge, color: "text-brand-red", bg: "bg-brand-red/10" },
] as const;

export default function WhyHydraWay() {
  const b = useTranslations("benefits");
  const a = useTranslations("advantages");
  const f = useTranslations("formulation");

  return (
    <section id="avantages" className="relative overflow-hidden">
      {/* ── Part 1: Use-case lifestyle tiles ── */}
      <div className="bg-gradient-to-b from-white via-ice-light/20 to-white py-24 lg:py-32">
        <div className="mx-auto max-w-7xl px-5 lg:px-8">
          {/* Header */}
          <ScrollReveal className="mb-14 text-center lg:mb-16">
            <div className="mb-4 flex items-center justify-center gap-3">
              <div className="h-px w-8 bg-gradient-to-r from-transparent to-brand-red" />
              <span className="text-xs font-bold uppercase tracking-[0.2em] text-brand-red">
                {b("subtitle")}
              </span>
              <div className="h-px w-8 bg-gradient-to-l from-transparent to-brand-red" />
            </div>
            <h2 className="font-heading text-4xl font-extrabold tracking-tight text-navy sm:text-5xl">
              {b("title")}
            </h2>
          </ScrollReveal>

          {/* Lifestyle tiles */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 lg:gap-5">
            {useCases.map(({ key, image }, i) => (
              <ScrollReveal key={key} delay={i * 100}>
                <div className="group relative aspect-[3/4] overflow-hidden rounded-2xl lg:rounded-3xl">
                  <Image
                    src={image}
                    alt={b(`items.${key}.title`)}
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  {/* Blue tint + gradient overlay */}
                  <div className="absolute inset-0 bg-navy/15" />
                  <div className="absolute inset-0 bg-gradient-to-t from-navy/90 via-navy/30 to-transparent" />

                  {/* Content */}
                  <div className="absolute inset-x-0 bottom-0 flex flex-col gap-1.5 p-5 lg:p-6">
                    <h3 className="font-heading text-lg font-bold text-white lg:text-xl">
                      {b(`items.${key}.title`)}
                    </h3>
                    <p className="text-xs leading-relaxed text-white/50 lg:text-sm">
                      {b(`items.${key}.description`)}
                    </p>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </div>

      {/* ── Advantages ── */}
      <div className="bg-white py-24 lg:py-32">
        <div className="mx-auto max-w-7xl px-5 lg:px-8">
          <ScrollReveal className="mb-14 text-center lg:mb-16">
            <div className="mb-4 flex items-center justify-center gap-3">
              <div className="h-px w-8 bg-gradient-to-r from-transparent to-brand-red" />
              <span className="text-xs font-bold uppercase tracking-[0.2em] text-brand-red">
                {a("label")}
              </span>
              <div className="h-px w-8 bg-gradient-to-l from-transparent to-brand-red" />
            </div>
            <h2 className="font-heading text-4xl font-extrabold tracking-tight text-navy sm:text-5xl">
              {a("title")}
            </h2>
          </ScrollReveal>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {advantages.map(({ key, icon: Icon, color, bg }, i) => (
              <ScrollReveal key={key} delay={i * 100}>
                <div className="group flex h-full flex-col items-center gap-4 rounded-2xl border border-navy/[0.05] bg-ice-light/30 p-7 text-center transition-all duration-300 hover:border-navy/[0.1] hover:shadow-lg hover:shadow-navy/[0.03]">
                  <div className={`flex h-14 w-14 items-center justify-center rounded-2xl ${bg} transition-transform duration-300 group-hover:scale-110`}>
                    <Icon size={26} className={color} strokeWidth={1.5} />
                  </div>
                  <h3 className="font-heading text-lg font-bold text-navy">
                    {a(`items.${key}.title`)}
                  </h3>
                  <p className="text-sm leading-relaxed text-navy/45">
                    {a(`items.${key}.description`)}
                  </p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </div>

      {/* ── Part 2: Formula + Positioning ── */}
      <div className="relative bg-navy py-24 lg:py-32">
        {/* Background effects */}
        <div className="absolute inset-0">
          <div className="absolute top-0 left-1/4 h-[400px] w-[400px] rounded-full bg-brand-blue/6 blur-[140px]" />
          <div className="absolute bottom-0 right-1/4 h-[400px] w-[400px] rounded-full bg-brand-red/5 blur-[120px]" />
        </div>
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: "radial-gradient(rgba(255,255,255,0.4) 1px, transparent 1px)",
            backgroundSize: "24px 24px",
          }}
        />

        <div className="relative mx-auto max-w-7xl px-5 lg:px-8">
          {/* Header */}
          <ScrollReveal className="mb-14 text-center lg:mb-16">
            <div className="mb-4 flex items-center justify-center gap-3">
              <div className="h-px w-8 bg-gradient-to-r from-transparent to-brand-red" />
              <span className="text-xs font-bold uppercase tracking-[0.2em] text-brand-red">
                {f("label")}
              </span>
              <div className="h-px w-8 bg-gradient-to-l from-transparent to-brand-red" />
            </div>
            <h2 className="font-heading text-4xl font-extrabold tracking-tight text-white sm:text-5xl">
              {f("title")}
            </h2>
            <div className="mt-8">
              <Image
                src="/images/stick_crop.png"
                alt="HydraWay stick"
                width={600}
                height={120}
                className="mx-auto h-auto w-full max-w-md"
              />
            </div>
          </ScrollReveal>

          {/* Side-by-side formula cards */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {formulaCards.map(({ key, icon: Icon, color, accentBg }, idx) => {
              const items = [0, 1, 2].map((i) => f(`${key}.items.${i}`));
              return (
                <ScrollReveal key={key} direction={idx === 0 ? "left" : "right"} delay={idx * 150}>
                  <div className="group flex h-full flex-col rounded-2xl border border-white/[0.06] bg-white/[0.03] p-7 backdrop-blur-sm transition-all duration-300 hover:border-white/[0.1] hover:bg-white/[0.05] lg:p-8">
                    {/* Icon */}
                    <div className={`mb-5 flex h-14 w-14 items-center justify-center rounded-2xl ${accentBg} transition-transform duration-300 group-hover:scale-110`}>
                      <Icon size={28} style={{ color, filter: `drop-shadow(0 0 8px ${color}90)` }} strokeWidth={1.5} />
                    </div>

                    {/* Title */}
                    <h3 className="mb-2 font-heading text-2xl font-extrabold tracking-tight text-white">
                      {f(`${key}.title`)}
                    </h3>

                    {/* Description — fixed 2 lines */}
                    <p className="mb-6 min-h-[2.75rem] text-sm leading-relaxed text-white/40">
                      {f(`${key}.description`)}
                    </p>

                    {/* Items */}
                    <div className="mt-auto flex flex-col gap-3.5">
                      {items.map((item, i) => (
                        <div key={i} className="flex items-start gap-3">
                          <div className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md ${accentBg}`}>
                            <Check size={12} strokeWidth={2.5} style={{ color }} />
                          </div>
                          <span className="text-[13px] leading-snug text-white/55">{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </ScrollReveal>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
