"use client";

import { useTranslations } from "next-intl";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

export default function PolitiqueConfidentialitePage() {
  const t = useTranslations("privacy");

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
              {/* 1. Données collectées */}
              <div>
                <h2 className="font-heading text-2xl font-bold text-navy">{t("collected.title")}</h2>
                <p className="mt-4 text-navy/60">{t("collected.intro")}</p>
                <ul className="mt-2 list-disc space-y-1 pl-6 text-navy/60">
                  <li>{t("collected.item1")}</li>
                  <li>{t("collected.item2")}</li>
                  <li>{t("collected.item3")}</li>
                  <li>{t("collected.item4")}</li>
                  <li>{t("collected.item5")}</li>
                </ul>
              </div>

              {/* 2. Finalité */}
              <div>
                <h2 className="font-heading text-2xl font-bold text-navy">{t("purpose.title")}</h2>
                <p className="mt-4 text-navy/60">{t("purpose.intro")}</p>
                <ul className="mt-2 list-disc space-y-1 pl-6 text-navy/60">
                  <li>{t("purpose.item1")}</li>
                  <li>{t("purpose.item2")}</li>
                  <li>{t("purpose.item3")}</li>
                  <li>{t("purpose.item4")}</li>
                </ul>
              </div>

              {/* 3. Conservation */}
              <div>
                <h2 className="font-heading text-2xl font-bold text-navy">{t("retention.title")}</h2>
                <p className="mt-4 leading-relaxed text-navy/60">{t("retention.content")}</p>
              </div>

              {/* 4. Sécurité */}
              <div>
                <h2 className="font-heading text-2xl font-bold text-navy">{t("security.title")}</h2>
                <p className="mt-4 leading-relaxed text-navy/60">{t("security.content")}</p>
              </div>

              {/* 5. Droits */}
              <div>
                <h2 className="font-heading text-2xl font-bold text-navy">{t("rights.title")}</h2>
                <p className="mt-4 text-navy/60">{t("rights.intro")}</p>
                <ul className="mt-2 list-disc space-y-1 pl-6 text-navy/60">
                  <li>{t("rights.item1")}</li>
                  <li>{t("rights.item2")}</li>
                  <li>{t("rights.item3")}</li>
                  <li>{t("rights.item4")}</li>
                </ul>
                <p className="mt-4 text-navy/60">{t("rights.contact")}</p>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
