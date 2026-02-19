"use client";

import { useTranslations } from "next-intl";
import Image from "next/image";
import { Check, Quote } from "lucide-react";
import ScrollReveal from "./ScrollReveal";

const minerals = [
  { key: "sodium", color: "from-red-500 to-orange-400", bg: "bg-red-500/10" },
  { key: "potassium", color: "from-blue-500 to-cyan-400", bg: "bg-blue-500/10" },
  { key: "magnesium", color: "from-emerald-500 to-teal-400", bg: "bg-emerald-500/10" },
  { key: "chloride", color: "from-violet-500 to-purple-400", bg: "bg-violet-500/10" },
];

export default function ScienceSection() {
  const t = useTranslations("science");
  const p = useTranslations("positioning");

  const functions = [0, 1, 2, 3].map((i) => t(`functions.items.${i}`));

  return (
    <section className="relative overflow-hidden bg-navy py-24 lg:py-32">
      {/* Background image — right-aligned */}
      <div className="absolute inset-0">
        <Image
          src="/images/stick-pour.png"
          alt=""
          fill
          className="object-cover object-left"
          style={{ left: "20%" }}
        />
        {/* Left fade */}
        <div className="absolute inset-0 bg-gradient-to-r from-navy via-navy/95 via-50% to-navy/40" />
        {/* Top fade */}
        <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-navy to-transparent" />
        {/* Bottom fade */}
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-navy to-transparent" />
      </div>

      <div className="relative mx-auto max-w-7xl px-5 lg:px-8">
        <div className="grid grid-cols-1 items-center gap-16 lg:grid-cols-2">
          {/* Left — Content */}
          <div className="flex flex-col gap-10">
            <ScrollReveal direction="left">
              <div className="flex flex-col gap-6">
                <div className="flex items-center gap-3">
                  <div className="h-px w-8 bg-gradient-to-r from-brand-red to-transparent" />
                  <span className="text-xs font-bold uppercase tracking-[0.2em] text-brand-red">
                    {t("label")}
                  </span>
                </div>

                <h2 className="font-heading text-4xl font-extrabold tracking-tight text-white sm:text-5xl">
                  {t("title")}
                </h2>

                <p className="max-w-lg text-lg leading-relaxed text-white/45">
                  {t("description")}
                </p>
              </div>
            </ScrollReveal>

            {/* Mineral cards */}
            <ScrollReveal direction="left" delay={200}>
              <div>
                <h3 className="mb-4 text-xs font-bold uppercase tracking-[0.15em] text-white/30">
                  {t("minerals.title")}
                </h3>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {minerals.map(({ key, color, bg }) => (
                    <div
                      key={key}
                      className="group flex flex-col items-center gap-2 rounded-2xl border border-white/[0.06] bg-white/[0.03] p-5 backdrop-blur-sm transition-all duration-300 hover:border-white/[0.12] hover:bg-white/[0.06]"
                    >
                      <div
                        className={`flex h-12 w-12 items-center justify-center rounded-xl ${bg} transition-transform duration-300 group-hover:scale-110`}
                      >
                        <span
                          className={`bg-gradient-to-br ${color} bg-clip-text text-lg font-extrabold text-transparent`}
                        >
                          {t(`minerals.${key}.symbol`)}
                        </span>
                      </div>
                      <span className="text-xs font-semibold text-white/60">
                        {t(`minerals.${key}.name`)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </ScrollReveal>

            {/* Functions */}
            <ScrollReveal direction="left" delay={400}>
              <div>
                <h3 className="mb-4 text-xs font-bold uppercase tracking-[0.15em] text-white/30">
                  {t("functions.title")}
                </h3>
                <div className="flex flex-col gap-3">
                  {functions.map((fn, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-red/15">
                        <Check size={12} className="text-brand-red-light" strokeWidth={3} />
                      </div>
                      <span className="text-sm font-medium text-white/55">{fn}</span>
                    </div>
                  ))}
                </div>
              </div>
            </ScrollReveal>
          </div>

          {/* Right — Quote */}
          <div className="hidden lg:flex lg:items-center lg:justify-center">
            <ScrollReveal direction="right">
              <div className="relative">
                <div className="absolute -inset-6 rounded-3xl bg-gradient-to-br from-brand-red/8 to-brand-blue/6 blur-2xl" />
                <div className="relative rounded-3xl border border-white/[0.08] bg-white/[0.04] p-10 backdrop-blur-sm">
                  {/* Large quote mark */}
                  <div className="mb-6">
                    <Quote size={40} className="text-yellow-400/50" strokeWidth={1} />
                  </div>
                  <blockquote className="mb-8 font-heading text-2xl font-bold leading-snug text-white/80">
                    {p("insight")}
                  </blockquote>
                  {/* Attribution */}
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-1 rounded-full bg-gradient-to-b from-yellow-400 to-yellow-600" />
                    <div>
                      <span className="text-base font-bold text-white/70">
                        {p("source")}
                      </span>
                      <p className="text-xs font-medium text-yellow-400/50">
                        {p("sourceTitle")}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </div>
    </section>
  );
}
