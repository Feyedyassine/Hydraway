"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { ChevronDown } from "lucide-react";
import ScrollReveal from "./ScrollReveal";

function FAQItem({
  question,
  answer,
  isOpen,
  onToggle,
}: {
  question: string;
  answer: string;
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="border-b border-navy/[0.06] last:border-b-0">
      <button
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-4 py-5 text-left transition-colors hover:text-brand-red"
      >
        <span className="pr-4 font-heading text-base font-bold text-navy">
          {question}
        </span>
        <div
          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border transition-all duration-300 ${
            isOpen
              ? "rotate-180 border-brand-red/20 bg-brand-red/8"
              : "border-navy/10 bg-navy/[0.02]"
          }`}
        >
          <ChevronDown
            size={14}
            className={`transition-colors duration-300 ${
              isOpen ? "text-brand-red" : "text-navy/40"
            }`}
          />
        </div>
      </button>
      <div
        className="grid transition-all duration-300 ease-in-out"
        style={{ gridTemplateRows: isOpen ? "1fr" : "0fr" }}
      >
        <div className="overflow-hidden">
          <p className="pb-5 text-sm leading-relaxed text-navy/50">
            {answer}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function FAQSection() {
  const t = useTranslations("faq");
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const items = Array.from({ length: 10 }, (_, i) => ({
    question: t(`items.${i}.question`),
    answer: t(`items.${i}.answer`),
  }));

  const midpoint = Math.ceil(items.length / 2);
  const leftColumn = items.slice(0, midpoint);
  const rightColumn = items.slice(midpoint);

  return (
    <section id="faq" className="relative overflow-hidden bg-gradient-to-b from-white via-ice-light/20 to-white py-24 lg:py-32">
      <div className="absolute top-0 right-0 h-[400px] w-[400px] rounded-full bg-brand-red/[0.02] blur-[120px]" />

      <div className="relative mx-auto max-w-7xl px-5 lg:px-8">
        {/* Header */}
        <ScrollReveal className="mb-14 text-center lg:mb-16">
          <div className="mb-4 flex items-center justify-center gap-3">
            <div className="h-px w-8 bg-gradient-to-r from-transparent to-brand-red" />
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-brand-red">
              FAQ
            </span>
            <div className="h-px w-8 bg-gradient-to-l from-transparent to-brand-red" />
          </div>
          <h2 className="mb-3 font-heading text-4xl font-extrabold tracking-tight text-navy sm:text-5xl">
            {t("title")}
          </h2>
          <p className="text-lg text-navy/40">
            {t("subtitle")}
          </p>
        </ScrollReveal>

        {/* 2-column accordion on desktop */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:gap-8">
          <ScrollReveal direction="left">
            <div className="rounded-2xl border border-navy/[0.06] bg-white p-5 shadow-sm sm:p-7">
              {leftColumn.map((item, i) => (
                <FAQItem
                  key={i}
                  question={item.question}
                  answer={item.answer}
                  isOpen={openIndex === i}
                  onToggle={() => setOpenIndex(openIndex === i ? null : i)}
                />
              ))}
            </div>
          </ScrollReveal>
          <ScrollReveal direction="right">
            <div className="rounded-2xl border border-navy/[0.06] bg-white p-5 shadow-sm sm:p-7">
              {rightColumn.map((item, i) => {
                const globalIndex = midpoint + i;
                return (
                  <FAQItem
                    key={globalIndex}
                    question={item.question}
                    answer={item.answer}
                    isOpen={openIndex === globalIndex}
                    onToggle={() => setOpenIndex(openIndex === globalIndex ? null : globalIndex)}
                  />
                );
              })}
            </div>
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
}
