"use client";

import { useTranslations } from "next-intl";
import { Star, Quote } from "lucide-react";
import ScrollReveal from "./ScrollReveal";

export default function Testimonials() {
  const t = useTranslations("testimonials");

  const items = [0, 1, 2];

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-white via-ice-light/20 to-white py-24 lg:py-32">
      <div className="mx-auto max-w-7xl px-5 lg:px-8">
        {/* Section header */}
        <ScrollReveal className="mb-16 text-center lg:mb-20">
          <h2 className="font-heading text-4xl font-extrabold tracking-tight text-navy sm:text-5xl">
            {t("title")}
          </h2>
        </ScrollReveal>

        {/* Testimonial cards */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {items.map((i) => (
            <ScrollReveal key={i} delay={i * 140}>
              <div className="group relative h-full overflow-hidden rounded-3xl border border-navy/[0.05] bg-white p-8 shadow-sm transition-all duration-500 hover:-translate-y-1 hover:shadow-xl hover:shadow-navy/5">
                {/* Quote icon */}
                <div className="mb-6 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-brand-red/8">
                  <Quote size={18} className="text-brand-red/60" strokeWidth={2} />
                </div>

                {/* Stars */}
                <div className="mb-4 flex gap-1">
                  {[...Array(5)].map((_, j) => (
                    <Star
                      key={j}
                      size={14}
                      className="fill-amber-400 text-amber-400"
                      strokeWidth={0}
                    />
                  ))}
                </div>

                {/* Quote text */}
                <p className="mb-8 text-base leading-relaxed text-navy/55">
                  &ldquo;{t(`items.${i}.text`)}&rdquo;
                </p>

                {/* Author */}
                <div className="mt-auto flex items-center gap-3 border-t border-navy/[0.05] pt-6">
                  {/* Avatar placeholder */}
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-navy/10 to-navy/5">
                    <span className="text-sm font-bold text-navy/40">
                      {(t(`items.${i}.name`) as string).charAt(0)}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-navy">
                      {t(`items.${i}.name`)}
                    </p>
                    <p className="text-xs text-navy/40">
                      {t(`items.${i}.role`)}
                    </p>
                  </div>
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
