"use client";

import { useTranslations } from "next-intl";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

export default function MentionsLegalesPage() {
  const t = useTranslations("legal");

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
              {/* 1. Identification */}
              <div>
                <h2 className="font-heading text-2xl font-bold text-navy">{t("identification.title")}</h2>
                <p className="mt-4 leading-relaxed text-navy/60">{t("identification.intro")}</p>
                <ul className="mt-4 space-y-1 text-navy/60">
                  <li><strong>{t("identification.companyName")}</strong></li>
                  <li>{t("identification.companyType")}</li>
                  <li>{t("identification.address")}</li>
                  <li>{t("identification.rne")}</li>
                  <li>{t("identification.fiscal")}</li>
                  <li>{t("identification.representative")}</li>
                  <li>{t("identification.email")}</li>
                  <li>{t("identification.phone")}</li>
                </ul>
                <p className="mt-4 text-navy/60">{t("identification.brand")}</p>
              </div>

              {/* 2. Hébergement */}
              <div>
                <h2 className="font-heading text-2xl font-bold text-navy">{t("hosting.title")}</h2>
                <p className="mt-4 leading-relaxed text-navy/60">{t("hosting.intro")}</p>
                <ul className="mt-4 space-y-1 text-navy/60">
                  <li><strong>Vercel</strong></li>
                  <li>{t("hosting.type")}</li>
                  <li>{t("hosting.site")}</li>
                </ul>
                <p className="mt-4 leading-relaxed text-navy/60">
                  {t("hosting.dev").replace("grafen.tn", "")}<a href="https://www.grafen.tn/" target="_blank" rel="noopener noreferrer" className="font-semibold text-navy/70 hover:underline">grafen.tn</a>
                </p>
                <p className="mt-4 text-sm text-navy/40">{t("hosting.note")}</p>
              </div>

              {/* 3. Propriété intellectuelle */}
              <div>
                <h2 className="font-heading text-2xl font-bold text-navy">{t("ip.title")}</h2>
                <p className="mt-4 leading-relaxed text-navy/60">{t("ip.p1")}</p>
                <p className="mt-3 leading-relaxed text-navy/60">{t("ip.p2")}</p>
              </div>

              {/* 4. Responsabilité */}
              <div>
                <h2 className="font-heading text-2xl font-bold text-navy">{t("liability.title")}</h2>
                <p className="mt-4 leading-relaxed text-navy/60">{t("liability.p1")}</p>
                <p className="mt-3 leading-relaxed text-navy/60">{t("liability.p2")}</p>
                <p className="mt-3 leading-relaxed text-navy/60">{t("liability.p3")}</p>
                <p className="mt-3 leading-relaxed text-navy/60">{t("liability.p4")}</p>
              </div>

              {/* 5. Protection des données */}
              <div>
                <h2 className="font-heading text-2xl font-bold text-navy">{t("data.title")}</h2>
                <p className="mt-4 leading-relaxed text-navy/60">{t("data.intro")}</p>
                <p className="mt-3 text-navy/60">{t("data.usageIntro")}</p>
                <ul className="mt-2 list-disc space-y-1 pl-6 text-navy/60">
                  <li>{t("data.usage1")}</li>
                  <li>{t("data.usage2")}</li>
                  <li>{t("data.usage3")}</li>
                </ul>
                <p className="mt-4 leading-relaxed text-navy/60">{t("data.rights")}</p>
                <p className="mt-3 text-navy/60">{t("data.contact")}</p>
                <p className="mt-3 text-navy/60">{t("data.noDpo")}</p>
                <p className="mt-3 text-navy/60">{t("data.noSale")}</p>
              </div>

              {/* 6. Cookies */}
              <div>
                <h2 className="font-heading text-2xl font-bold text-navy">{t("cookies.title")}</h2>
                <p className="mt-4 leading-relaxed text-navy/60">{t("cookies.p1")}</p>
                <p className="mt-3 leading-relaxed text-navy/60">{t("cookies.p2")}</p>
                <p className="mt-3 leading-relaxed text-navy/60">{t("cookies.p3")}</p>
              </div>

              {/* 7. Droit applicable */}
              <div>
                <h2 className="font-heading text-2xl font-bold text-navy">{t("jurisdiction.title")}</h2>
                <p className="mt-4 leading-relaxed text-navy/60">{t("jurisdiction.p1")}</p>
                <p className="mt-3 leading-relaxed text-navy/60">{t("jurisdiction.p2")}</p>
              </div>

              {/* Avertissement santé */}
              <div className="rounded-2xl border border-brand-red/10 bg-brand-red/[0.03] p-8">
                <h2 className="font-heading text-2xl font-bold text-navy">{t("health.title")}</h2>
                <ul className="mt-4 list-disc space-y-2 pl-6 text-navy/60">
                  <li>{t("health.item1")}</li>
                  <li>{t("health.item2")}</li>
                  <li>{t("health.item3")}</li>
                  <li>{t("health.item4")}</li>
                  <li>{t("health.item5")}</li>
                  <li>{t("health.item6")}</li>
                  <li>{t("health.item7")}</li>
                </ul>
              </div>

              {/* Usage et précautions */}
              <div>
                <h2 className="font-heading text-2xl font-bold text-navy">{t("usage.title")}</h2>
                <p className="mt-4 leading-relaxed text-navy/60">{t("usage.intro")}</p>
                <p className="mt-3 text-navy/60">{t("usage.notIntended")}</p>
                <ul className="mt-2 list-disc space-y-1 pl-6 text-navy/60">
                  <li>{t("usage.not1")}</li>
                  <li>{t("usage.not2")}</li>
                  <li>{t("usage.not3")}</li>
                </ul>
                <p className="mt-4 text-navy/60">{t("usage.disclaimer")}</p>
                <ul className="mt-2 list-disc space-y-1 pl-6 text-navy/60">
                  <li>{t("usage.disc1")}</li>
                  <li>{t("usage.disc2")}</li>
                  <li>{t("usage.disc3")}</li>
                </ul>
              </div>

              {/* Stockage */}
              <div>
                <h2 className="font-heading text-2xl font-bold text-navy">{t("storage.title")}</h2>
                <p className="mt-4 text-navy/60">{t("storage.intro")}</p>
                <ul className="mt-2 list-disc space-y-1 pl-6 text-navy/60">
                  <li>{t("storage.item1")}</li>
                  <li>{t("storage.item2")}</li>
                  <li>{t("storage.item3")}</li>
                  <li>{t("storage.item4")}</li>
                </ul>
                <p className="mt-4 text-sm text-navy/40">{t("storage.disclaimer")}</p>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
