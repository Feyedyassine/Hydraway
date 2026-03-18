"use client";

import { useTranslations } from "next-intl";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

export default function PolitiqueRetourPage() {
  const t = useTranslations("returns");

  return (
    <>
      <Navbar />
      <main>
        {/* Hero */}
        <section className="relative overflow-hidden bg-navy pb-16 pt-40 lg:pb-20 lg:pt-48">
          <div className="absolute inset-0">
            <div className="absolute inset-0 bg-gradient-to-br from-navy via-navy-light to-navy-800" />
          </div>
          <div className="relative z-10 mx-auto max-w-4xl px-5 text-center lg:px-8">
            <h1 className="font-heading text-4xl font-extrabold tracking-tight text-white sm:text-5xl">
              {t("title")}
            </h1>
          </div>
        </section>

        {/* Content */}
        <section className="py-16 lg:py-24">
          <div className="mx-auto max-w-4xl px-5 lg:px-8">
            <div className="prose prose-navy max-w-none space-y-12">
              {/* Conditions */}
              <div>
                <h2 className="font-heading text-2xl font-bold text-navy">{t("conditions.title")}</h2>
                <p className="mt-4 text-navy/60">{t("conditions.intro")}</p>
                <ul className="mt-2 list-disc space-y-1 pl-6 text-navy/60">
                  <li>{t("conditions.item1")}</li>
                  <li>{t("conditions.item2")}</li>
                  <li>{t("conditions.item3")}</li>
                </ul>
                <p className="mt-4 leading-relaxed text-navy/60">{t("conditions.opened")}</p>
              </div>

              {/* Procédure */}
              <div>
                <h2 className="font-heading text-2xl font-bold text-navy">{t("procedure.title")}</h2>
                <p className="mt-4 leading-relaxed text-navy/60">{t("procedure.p1")}</p>
                <p className="mt-3 leading-relaxed text-navy/60">{t("procedure.p2")}</p>
              </div>

              {/* Remboursement */}
              <div>
                <h2 className="font-heading text-2xl font-bold text-navy">{t("refund.title")}</h2>
                <p className="mt-4 leading-relaxed text-navy/60">{t("refund.p1")}</p>
                <p className="mt-3 leading-relaxed text-navy/60">{t("refund.p2")}</p>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
