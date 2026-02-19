"use client";

import { useTranslations } from "next-intl";
import Image from "next/image";
import { ArrowRight, Truck } from "lucide-react";
import ScrollReveal from "./ScrollReveal";

export default function CTASection() {
  const t = useTranslations("cta");

  return (
    <section
      id="commander"
      className="relative overflow-hidden py-24 lg:py-32"
    >
      {/* Background image */}
      <div className="absolute inset-0">
        <Image
          src="/images/lifestyle-sport.png"
          alt="HydraWay lifestyle"
          fill
          className="object-cover"
        />
        {/* Overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-r from-navy/95 via-navy/85 to-navy/70" />
        <div className="absolute inset-0 bg-gradient-to-t from-navy/60 to-transparent" />
      </div>

      {/* Grid pattern */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.2) 1px, transparent 1px)`,
          backgroundSize: "60px 60px",
        }}
      />

      <div className="relative mx-auto max-w-7xl px-5 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <ScrollReveal>
            <h2 className="mb-6 font-heading text-4xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-6xl">
              {t("title")}
            </h2>
          </ScrollReveal>

          <ScrollReveal delay={150}>
            <p className="mb-10 text-lg text-white/50 sm:text-xl">
              {t("description")}
            </p>
          </ScrollReveal>

          <ScrollReveal delay={300}>
            <div className="flex flex-col items-center gap-5">
              <a
                href="#produit"
                className="group inline-flex items-center gap-3 rounded-full bg-gradient-to-r from-brand-red to-brand-crimson px-10 py-5 text-lg font-semibold text-white shadow-2xl shadow-brand-red/30 transition-all duration-300 hover:shadow-brand-red/50 hover:brightness-110"
              >
                {t("button")}
                <ArrowRight
                  size={20}
                  className="transition-transform group-hover:translate-x-1"
                />
              </a>

              <div className="flex items-center gap-2 text-white/35">
                <Truck size={16} strokeWidth={1.5} />
                <span className="text-sm">{t("shipping")}</span>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
}
