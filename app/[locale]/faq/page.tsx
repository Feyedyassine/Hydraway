"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { ChevronDown, HelpCircle } from "lucide-react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import ScrollReveal from "../components/ScrollReveal";

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
        className="flex w-full items-center justify-between gap-4 py-6 text-left transition-colors hover:text-brand-red"
      >
        <span className="font-heading text-lg font-bold text-navy pr-4">
          {question}
        </span>
        <div
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border transition-all duration-300 ${
            isOpen
              ? "border-brand-red/20 bg-brand-red/8 rotate-180"
              : "border-navy/10 bg-navy/[0.02]"
          }`}
        >
          <ChevronDown
            size={16}
            className={`transition-colors duration-300 ${
              isOpen ? "text-brand-red" : "text-navy/40"
            }`}
          />
        </div>
      </button>
      <div
        className={`grid transition-all duration-300 ease-in-out ${
          isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
        }`}
      >
        <div className="overflow-hidden">
          <p className="pb-6 text-base leading-relaxed text-navy/50">
            {answer}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function FAQPage() {
  const t = useTranslations("faq");
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const items = Array.from({ length: 9 }, (_, i) => ({
    question: t(`items.${i}.question`),
    answer: t(`items.${i}.answer`),
  }));

  return (
    <>
      <Navbar />
      <main>
        {/* Hero */}
        <section className="relative overflow-hidden bg-navy pb-24 pt-40 lg:pb-32 lg:pt-48">
          <div className="absolute inset-0">
            <div className="absolute inset-0 bg-gradient-to-br from-navy via-navy-light to-navy-800" />
            <div className="animate-pulse-glow absolute -top-32 right-0 h-[400px] w-[400px] rounded-full bg-brand-red/8 blur-[120px]" />
          </div>

          <div className="relative z-10 mx-auto max-w-7xl px-5 lg:px-8">
            <ScrollReveal className="mx-auto max-w-3xl text-center">
              <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-red/10">
                <HelpCircle size={28} className="text-brand-red-light" strokeWidth={1.5} />
              </div>
              <h1 className="mb-4 font-heading text-5xl font-extrabold tracking-tight text-white sm:text-6xl">
                {t("title")}
              </h1>
              <p className="text-xl text-white/50">
                {t("subtitle")}
              </p>
            </ScrollReveal>
          </div>
        </section>

        {/* FAQ Items */}
        <section className="py-24 lg:py-32">
          <div className="mx-auto max-w-3xl px-5 lg:px-8">
            <ScrollReveal>
              <div className="rounded-3xl border border-navy/[0.06] bg-white p-6 shadow-sm sm:p-10">
                {items.map((item, i) => (
                  <FAQItem
                    key={i}
                    question={item.question}
                    answer={item.answer}
                    isOpen={openIndex === i}
                    onToggle={() =>
                      setOpenIndex(openIndex === i ? null : i)
                    }
                  />
                ))}
              </div>
            </ScrollReveal>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
