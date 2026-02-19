"use client";

import { useTranslations } from "next-intl";
import { Stethoscope, Dumbbell, Sun, Droplets, Quote } from "lucide-react";
import ScrollReveal from "./ScrollReveal";

const contexts = [
  { key: "medical", icon: Stethoscope, color: "text-emerald-500", bg: "bg-emerald-500/10" },
  { key: "sport", icon: Dumbbell, color: "text-brand-red", bg: "bg-brand-red/10" },
  { key: "heat", icon: Sun, color: "text-amber-500", bg: "bg-amber-500/10" },
  { key: "sweat", icon: Droplets, color: "text-cyan-500", bg: "bg-cyan-500/10" },
] as const;

export default function PositioningSection() {
  const t = useTranslations("positioning");

  return (
    <section className="relative overflow-hidden bg-navy py-24 lg:py-32">
      {/* Background effects */}
      <div className="absolute inset-0">
        <div className="absolute top-1/3 left-0 h-[400px] w-[400px] rounded-full bg-brand-red/5 blur-[140px]" />
        <div className="absolute bottom-0 right-1/4 h-[350px] w-[350px] rounded-full bg-brand-blue/8 blur-[120px]" />
      </div>

      {/* Dot pattern */}
      <div
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: "radial-gradient(rgba(255,255,255,0.4) 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      />

      <div className="relative mx-auto max-w-7xl px-5 lg:px-8">
        <div className="grid grid-cols-1 items-center gap-16 lg:grid-cols-2">
          {/* Left — Context cards */}
          <div className="flex flex-col gap-8">
            <ScrollReveal direction="left">
              <div className="flex flex-col gap-5">
                <div className="flex items-center gap-3">
                  <div className="h-px w-8 bg-gradient-to-r from-brand-red to-transparent" />
                  <span className="text-xs font-bold uppercase tracking-[0.2em] text-brand-red">
                    {t("label")}
                  </span>
                </div>
                <h2 className="font-heading text-4xl font-extrabold tracking-tight text-white sm:text-5xl">
                  {t("title")}
                </h2>
              </div>
            </ScrollReveal>

            <ScrollReveal direction="left" delay={200}>
              <div className="grid grid-cols-2 gap-4">
                {contexts.map(({ key, icon: Icon, color, bg }) => (
                  <div
                    key={key}
                    className="group flex items-center gap-3.5 rounded-2xl border border-white/[0.06] bg-white/[0.03] p-5 backdrop-blur-sm transition-all duration-300 hover:border-white/[0.12] hover:bg-white/[0.06]"
                  >
                    <div
                      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${bg} transition-transform duration-300 group-hover:scale-110`}
                    >
                      <Icon size={20} className={color} strokeWidth={1.5} />
                    </div>
                    <span className="text-sm font-medium text-white/60">
                      {t(`contexts.${key}`)}
                    </span>
                  </div>
                ))}
              </div>
            </ScrollReveal>
          </div>

          {/* Right — Scientific insight blockquote */}
          <ScrollReveal direction="right">
            <div className="relative">
              {/* Glow behind */}
              <div className="absolute -inset-4 rounded-3xl bg-gradient-to-br from-brand-red/5 to-brand-blue/5 blur-2xl" />

              <div className="relative rounded-3xl border border-white/[0.08] bg-white/[0.04] p-8 backdrop-blur-sm lg:p-10">
                {/* Quote icon */}
                <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-red/10">
                  <Quote size={20} className="text-brand-red-light" strokeWidth={1.5} />
                </div>

                {/* Quote text */}
                <blockquote className="mb-6 text-lg font-medium leading-relaxed text-white/60 italic">
                  {t("insight")}
                </blockquote>

                {/* Source */}
                <div className="flex items-center gap-3">
                  <div className="h-px w-6 bg-gradient-to-r from-brand-red to-transparent" />
                  <span className="text-xs font-bold uppercase tracking-[0.15em] text-white/30">
                    {t("source")}
                  </span>
                </div>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
}
