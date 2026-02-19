"use client";

import { useTranslations } from "next-intl";
import Image from "next/image";
import { FlaskConical, Sparkles, Heart, MapPin, ShieldCheck, Award, Factory } from "lucide-react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import ScrollReveal from "../components/ScrollReveal";

export default function AboutPage() {
  const t = useTranslations("about");

  const values = [
    { key: "science", icon: FlaskConical },
    { key: "simplicity", icon: Sparkles },
    { key: "lifestyle", icon: Heart },
    { key: "local", icon: MapPin },
  ];

  const certifications = [
    { icon: ShieldCheck, label: t("quality.gmp") },
    { icon: Award, label: t("quality.fssc") },
    { icon: Factory, label: t("quality.local") },
  ];

  return (
    <>
      <Navbar />
      <main>
        {/* Hero */}
        <section className="relative overflow-hidden bg-navy pb-24 pt-40 lg:pb-32 lg:pt-48">
          <div className="absolute inset-0">
            <div className="absolute inset-0 bg-gradient-to-br from-navy via-navy-light to-navy-800" />
            <div className="animate-pulse-glow absolute -top-32 -right-32 h-[400px] w-[400px] rounded-full bg-brand-red/8 blur-[120px]" />
            <div className="animate-pulse-glow absolute -bottom-32 -left-32 h-[400px] w-[400px] rounded-full bg-brand-blue/15 blur-[120px]" />
          </div>

          <div className="relative z-10 mx-auto max-w-7xl px-5 lg:px-8">
            <ScrollReveal className="mx-auto max-w-3xl text-center">
              <div className="mb-4 flex items-center justify-center gap-3">
                <div className="h-px w-8 bg-gradient-to-r from-transparent to-brand-red" />
                <span className="text-xs font-bold uppercase tracking-[0.2em] text-brand-red">
                  {t("subtitle")}
                </span>
                <div className="h-px w-8 bg-gradient-to-l from-transparent to-brand-red" />
              </div>
              <h1 className="mb-6 font-heading text-5xl font-extrabold tracking-tight text-white sm:text-6xl">
                {t("title")}
              </h1>
              <p className="text-xl leading-relaxed text-white/50">
                {t("intro")}
              </p>
            </ScrollReveal>
          </div>
        </section>

        {/* Story */}
        <section className="py-24 lg:py-32">
          <div className="mx-auto max-w-7xl px-5 lg:px-8">
            <div className="grid grid-cols-1 items-center gap-16 lg:grid-cols-2">
              <ScrollReveal direction="left">
                <div className="relative">
                  <div className="overflow-hidden rounded-3xl">
                    <Image
                      src="/images/lifestyle-group.png"
                      alt="HydraWay lifestyle"
                      width={600}
                      height={450}
                      className="h-auto w-full object-cover"
                    />
                  </div>
                  <div className="absolute -bottom-6 -right-4 w-44 overflow-hidden rounded-2xl border-4 border-white shadow-2xl sm:-right-8 sm:w-56">
                    <Image
                      src="/images/sticks-duo.png"
                      alt="HydraWay sticks"
                      width={240}
                      height={180}
                      className="h-auto w-full object-cover"
                    />
                  </div>
                  <div className="absolute -top-4 -left-4 h-20 w-20 rounded-full border-2 border-dashed border-brand-red/15" />
                </div>
              </ScrollReveal>

              <ScrollReveal direction="right">
                <div className="flex flex-col gap-6">
                  <h2 className="font-heading text-4xl font-extrabold tracking-tight text-navy">
                    {t("story.title")}
                  </h2>
                  <p className="text-lg leading-relaxed text-navy/50">
                    {t("story.p1")}
                  </p>
                  <p className="text-lg leading-relaxed text-navy/50">
                    {t("story.p2")}
                  </p>
                  <p className="text-lg leading-relaxed text-navy/50">
                    {t("story.p3")}
                  </p>
                  <p className="mt-2 text-xl font-bold italic text-navy/70">
                    {t("story.tagline")}
                  </p>
                </div>
              </ScrollReveal>
            </div>
          </div>
        </section>

        {/* Mission */}
        <section className="bg-gradient-to-b from-ice-light/30 to-white py-24 lg:py-32">
          <div className="mx-auto max-w-7xl px-5 lg:px-8">
            <ScrollReveal className="mx-auto max-w-3xl text-center">
              <h2 className="mb-6 font-heading text-4xl font-extrabold tracking-tight text-navy sm:text-5xl">
                {t("mission.title")}
              </h2>
              <p className="text-xl leading-relaxed text-navy/50">
                {t("mission.description")}
              </p>
            </ScrollReveal>
          </div>
        </section>

        {/* Values */}
        <section className="py-24 lg:py-32">
          <div className="mx-auto max-w-7xl px-5 lg:px-8">
            <ScrollReveal className="mb-16 text-center">
              <h2 className="font-heading text-4xl font-extrabold tracking-tight text-navy sm:text-5xl">
                {t("values.title")}
              </h2>
            </ScrollReveal>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {values.map(({ key, icon: Icon }, i) => (
                <ScrollReveal key={key} delay={i * 120}>
                  <div className="group h-full rounded-3xl border border-navy/[0.05] bg-white p-8 shadow-sm transition-all duration-500 hover:-translate-y-1 hover:shadow-xl hover:shadow-navy/5">
                    <div className="mb-6 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-red/8 transition-transform duration-500 group-hover:scale-110">
                      <Icon size={24} className="text-brand-red" strokeWidth={1.5} />
                    </div>
                    <h3 className="mb-3 font-heading text-xl font-bold text-navy">
                      {t(`values.${key}.title`)}
                    </h3>
                    <p className="text-sm leading-relaxed text-navy/45">
                      {t(`values.${key}.description`)}
                    </p>
                  </div>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </section>

        {/* Quality & Certifications */}
        <section className="relative overflow-hidden bg-navy py-24 lg:py-32">
          <div className="absolute inset-0">
            <div className="absolute -top-32 left-0 h-[400px] w-[400px] rounded-full bg-brand-blue/10 blur-[120px]" />
            <div className="absolute -bottom-32 right-0 h-[400px] w-[400px] rounded-full bg-brand-red/8 blur-[120px]" />
          </div>

          <div className="relative mx-auto max-w-7xl px-5 lg:px-8">
            <div className="grid grid-cols-1 items-center gap-16 lg:grid-cols-2">
              <ScrollReveal direction="left">
                <div className="flex flex-col gap-6">
                  <h2 className="font-heading text-4xl font-extrabold tracking-tight text-white sm:text-5xl">
                    {t("quality.title")}
                  </h2>
                  <p className="text-lg leading-relaxed text-white/50">
                    {t("quality.description")}
                  </p>

                  <div className="mt-4 flex flex-col gap-4">
                    {certifications.map(({ icon: Icon, label }, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-4 rounded-2xl border border-white/[0.06] bg-white/[0.03] px-6 py-4 backdrop-blur-sm"
                      >
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-red/15">
                          <Icon size={18} className="text-brand-red-light" strokeWidth={2} />
                        </div>
                        <span className="text-sm font-semibold text-white/70">{label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </ScrollReveal>

              <ScrollReveal direction="right">
                <div className="relative flex items-center justify-center">
                  <div className="absolute h-[300px] w-[300px] rounded-full bg-brand-red/10 blur-[80px]" />
                  <div className="animate-float-slow relative">
                    <Image
                      src="/images/stick-pour.png"
                      alt="HydraWay quality"
                      width={450}
                      height={450}
                      className="h-auto w-full max-w-[400px] rounded-3xl shadow-2xl shadow-black/40"
                    />
                  </div>
                </div>
              </ScrollReveal>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
