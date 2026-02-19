"use client";

import { useTranslations } from "next-intl";
import { Atom, Zap, Check } from "lucide-react";
import ScrollReveal from "./ScrollReveal";

const cards = [
  {
    key: "minerals" as const,
    icon: Atom,
    accent: "from-brand-blue to-cyan-400",
    accentBg: "bg-brand-blue/10",
    border: "hover:border-brand-blue/20",
  },
  {
    key: "vitamins" as const,
    icon: Zap,
    accent: "from-brand-red to-accent-pink",
    accentBg: "bg-brand-red/10",
    border: "hover:border-brand-red/20",
  },
] as const;

export default function FormulationSection() {
  const t = useTranslations("formulation");

  return (
    <section className="relative overflow-hidden bg-white py-24 lg:py-32">
      {/* Subtle accents */}
      <div className="absolute top-0 left-1/4 h-[400px] w-[400px] rounded-full bg-brand-blue/[0.03] blur-[120px]" />
      <div className="absolute bottom-0 right-1/4 h-[400px] w-[400px] rounded-full bg-brand-red/[0.03] blur-[120px]" />

      <div className="relative mx-auto max-w-7xl px-5 lg:px-8">
        {/* Header */}
        <ScrollReveal>
          <div className="mb-16 flex flex-col items-center gap-5 text-center">
            <div className="flex items-center gap-3">
              <div className="h-px w-8 bg-gradient-to-r from-transparent to-brand-red" />
              <span className="text-xs font-bold uppercase tracking-[0.2em] text-brand-red">
                {t("label")}
              </span>
              <div className="h-px w-8 bg-gradient-to-l from-transparent to-brand-red" />
            </div>
            <h2 className="font-heading text-4xl font-extrabold tracking-tight text-navy sm:text-5xl">
              {t("title")}
            </h2>
          </div>
        </ScrollReveal>

        {/* Two cards */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {cards.map(({ key, icon: Icon, accent, accentBg, border }, idx) => {
            const items = [0, 1, 2].map((i) => t(`${key}.items.${i}`));

            return (
              <ScrollReveal key={key} direction={idx === 0 ? "left" : "right"} delay={idx * 150}>
                <div
                  className={`group flex h-full flex-col gap-6 rounded-3xl border border-navy/[0.06] bg-gradient-to-br from-white to-ice-light/30 p-8 transition-all duration-300 ${border} lg:p-10`}
                >
                  {/* Icon + Title */}
                  <div className="flex items-center gap-4">
                    <div
                      className={`flex h-14 w-14 items-center justify-center rounded-2xl ${accentBg} transition-transform duration-300 group-hover:scale-110`}
                    >
                      <Icon size={24} className={`bg-gradient-to-br ${accent} bg-clip-text text-transparent`} strokeWidth={1.5} style={{ color: idx === 0 ? '#1e3a8a' : '#dc2626' }} />
                    </div>
                    <div>
                      <h3 className="font-heading text-2xl font-bold text-navy">
                        {t(`${key}.title`)}
                      </h3>
                      <p className="mt-1 text-sm text-navy/40">
                        {t(`${key}.description`)}
                      </p>
                    </div>
                  </div>

                  {/* Divider */}
                  <div className={`h-px w-full bg-gradient-to-r ${accent} opacity-10`} />

                  {/* Items */}
                  <div className="flex flex-col gap-4">
                    {items.map((item, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${accentBg}`}>
                          <Check size={14} strokeWidth={2.5} style={{ color: idx === 0 ? '#1e3a8a' : '#dc2626' }} />
                        </div>
                        <span className="text-sm font-medium text-navy/60">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </ScrollReveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
