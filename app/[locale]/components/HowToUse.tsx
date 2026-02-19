"use client";

import { useTranslations } from "next-intl";
import Image from "next/image";
import ScrollReveal from "./ScrollReveal";

export default function HowToUse() {
  const t = useTranslations("howToUse");

  const steps = [
    { key: "open", num: "01" },
    { key: "pour", num: "02" },
    { key: "mix", num: "03" },
  ];

  return (
    <section
      id="utilisation"
      className="relative overflow-hidden bg-navy py-24 lg:py-32"
    >
      {/* Background effects */}
      <div className="absolute inset-0">
        <div className="absolute -top-32 left-0 h-[400px] w-[400px] rounded-full bg-brand-blue/10 blur-[120px]" />
        <div className="absolute -bottom-32 right-0 h-[400px] w-[400px] rounded-full bg-brand-red/8 blur-[120px]" />
      </div>

      {/* Grid overlay */}
      <div
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `radial-gradient(rgba(255,255,255,0.3) 1px, transparent 1px)`,
          backgroundSize: "32px 32px",
        }}
      />

      <div className="relative mx-auto max-w-7xl px-5 lg:px-8">
        {/* Section header */}
        <ScrollReveal className="mb-16 text-center lg:mb-20">
          <div className="mb-4 flex items-center justify-center gap-3">
            <div className="h-px w-8 bg-gradient-to-r from-transparent to-brand-red" />
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-white/40">
              {t("subtitle")}
            </span>
            <div className="h-px w-8 bg-gradient-to-l from-transparent to-brand-red" />
          </div>
          <h2 className="font-heading text-4xl font-extrabold tracking-tight text-white sm:text-5xl">
            {t("title")}
          </h2>
        </ScrollReveal>

        <div className="grid grid-cols-1 items-center gap-16 lg:grid-cols-2">
          {/* Left — Steps */}
          <div className="relative flex flex-col gap-0">
            {/* Connecting line */}
            <div className="absolute left-[27px] top-[40px] bottom-[40px] w-px bg-gradient-to-b from-brand-red/40 via-white/10 to-brand-red/40 lg:left-[27px]" />

            {steps.map(({ key, num }, i) => (
              <ScrollReveal key={key} delay={i * 150} direction="left">
                <div className="group relative flex items-start gap-6 py-8">
                  {/* Step number circle */}
                  <div className="relative z-10 flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-white/10 bg-navy-light shadow-lg shadow-navy/50 transition-all duration-300 group-hover:border-brand-red/30 group-hover:shadow-brand-red/10">
                    <span className="font-heading text-sm font-bold text-white/60 transition-colors group-hover:text-brand-red-light">
                      {num}
                    </span>
                  </div>

                  {/* Content */}
                  <div className="pt-2">
                    <h3 className="mb-2 font-heading text-2xl font-bold text-white">
                      {t(`steps.${key}.title`)}
                    </h3>
                    <p className="text-base text-white/40">
                      {t(`steps.${key}.description`)}
                    </p>
                  </div>
                </div>
              </ScrollReveal>
            ))}

            {/* Recommendation */}
            <ScrollReveal delay={500}>
              <div className="ml-20 mt-4 glass-card inline-flex items-center gap-2 rounded-full px-5 py-2.5">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-brand-red" />
                <span className="text-sm font-medium text-white/50">
                  {t("recommendation")}
                </span>
              </div>
            </ScrollReveal>
          </div>

          {/* Right — Image */}
          <ScrollReveal direction="right">
            <div className="relative flex items-center justify-center">
              {/* Glow */}
              <div className="absolute h-[350px] w-[350px] rounded-full bg-brand-red/10 blur-[80px]" />

              <div className="animate-float-slow relative overflow-hidden rounded-3xl">
                <Image
                  src="/images/stick-pour.png"
                  alt="Pour HydraWay"
                  width={500}
                  height={500}
                  className="h-auto w-full max-w-[440px] rounded-3xl object-cover shadow-2xl shadow-black/40"
                />
              </div>

              {/* Floating glass detail */}
              <div className="absolute -bottom-4 -left-4 z-10 overflow-hidden rounded-2xl border-4 border-navy shadow-2xl lg:-left-8">
                <Image
                  src="/images/glass-fruits.png"
                  alt="HydraWay drink"
                  width={140}
                  height={100}
                  className="h-auto w-28 object-cover lg:w-36"
                />
              </div>
            </div>
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
}
