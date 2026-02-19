"use client";

import { useTranslations } from "next-intl";
import { Dumbbell, Sun, Heart, PartyPopper } from "lucide-react";
import ScrollReveal from "./ScrollReveal";

export default function Benefits() {
  const t = useTranslations("benefits");

  const items = [
    {
      key: "sport",
      icon: Dumbbell,
      accent: "bg-brand-red/8",
      iconColor: "text-brand-red",
    },
    {
      key: "heat",
      icon: Sun,
      accent: "bg-amber-500/8",
      iconColor: "text-amber-500",
    },
    {
      key: "daily",
      icon: Heart,
      accent: "bg-brand-blue/8",
      iconColor: "text-brand-blue",
    },
    {
      key: "recovery",
      icon: PartyPopper,
      accent: "bg-brand-berry/8",
      iconColor: "text-brand-berry",
    },
  ];

  return (
    <section
      id="avantages"
      className="relative overflow-hidden bg-gradient-to-b from-white via-ice-light/30 to-white py-24 lg:py-32"
    >
      {/* Background decoration */}
      <div className="absolute top-0 left-1/2 h-[600px] w-[800px] -translate-x-1/2 rounded-full bg-brand-red/[0.02] blur-[120px]" />

      <div className="relative mx-auto max-w-7xl px-5 lg:px-8">
        {/* Section header */}
        <ScrollReveal className="mb-16 text-center lg:mb-20">
          <div className="mb-4 flex items-center justify-center gap-3">
            <div className="h-px w-8 bg-gradient-to-r from-transparent to-brand-red" />
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-brand-red">
              {t("subtitle")}
            </span>
            <div className="h-px w-8 bg-gradient-to-l from-transparent to-brand-red" />
          </div>
          <h2 className="font-heading text-4xl font-extrabold tracking-tight text-navy sm:text-5xl">
            {t("title")}
          </h2>
        </ScrollReveal>

        {/* Cards grid */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {items.map(({ key, icon: Icon, accent, iconColor }, i) => (
            <ScrollReveal key={key} delay={i * 120}>
              <div className="group relative h-full overflow-hidden rounded-3xl border border-navy/[0.05] bg-white p-8 shadow-sm transition-all duration-500 hover:-translate-y-1 hover:border-navy/[0.08] hover:shadow-xl hover:shadow-navy/5">
                {/* Gradient accent on hover */}
                <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-brand-red to-accent-pink opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

                {/* Icon */}
                <div
                  className={`mb-6 inline-flex h-14 w-14 items-center justify-center rounded-2xl ${accent} transition-transform duration-500 group-hover:scale-110`}
                >
                  <Icon size={24} className={iconColor} strokeWidth={1.5} />
                </div>

                {/* Title */}
                <h3 className="mb-3 font-heading text-xl font-bold text-navy">
                  {t(`items.${key}.title`)}
                </h3>

                {/* Description */}
                <p className="text-sm leading-relaxed text-navy/45">
                  {t(`items.${key}.description`)}
                </p>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
