"use client";

import { useTranslations } from "next-intl";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

export default function CGVPage() {
  const t = useTranslations("cgv");

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
              {/* Article 1 */}
              <div>
                <h2 className="font-heading text-2xl font-bold text-navy">{t("object.title")}</h2>
                <p className="mt-4 leading-relaxed text-navy/60">{t("object.p1")}</p>
                <p className="mt-3 leading-relaxed text-navy/60">{t("object.p2")}</p>
              </div>

              {/* Article 2 */}
              <div>
                <h2 className="font-heading text-2xl font-bold text-navy">{t("products.title")}</h2>
                <p className="mt-4 leading-relaxed text-navy/60">{t("products.p1")}</p>
                <p className="mt-3 leading-relaxed text-navy/60">{t("products.p2")}</p>
                <p className="mt-3 leading-relaxed text-navy/60">{t("products.p3")}</p>
              </div>

              {/* Article 3 */}
              <div>
                <h2 className="font-heading text-2xl font-bold text-navy">{t("prices.title")}</h2>
                <p className="mt-4 leading-relaxed text-navy/60">{t("prices.p1")}</p>
                <p className="mt-3 leading-relaxed text-navy/60">{t("prices.p2")}</p>
              </div>

              {/* Article 4 */}
              <div>
                <h2 className="font-heading text-2xl font-bold text-navy">{t("order.title")}</h2>
                <p className="mt-4 text-navy/60">{t("order.intro")}</p>
                <ul className="mt-2 list-disc space-y-1 pl-6 text-navy/60">
                  <li>{t("order.item1")}</li>
                  <li>{t("order.item2")}</li>
                  <li>{t("order.item3")}</li>
                </ul>
                <p className="mt-4 leading-relaxed text-navy/60">{t("order.fraud")}</p>
              </div>

              {/* Article 5 */}
              <div>
                <h2 className="font-heading text-2xl font-bold text-navy">{t("payment.title")}</h2>
                <p className="mt-4 leading-relaxed text-navy/60">{t("payment.p1")}</p>
                <p className="mt-3 leading-relaxed text-navy/60">{t("payment.p2")}</p>
              </div>

              {/* Article 6 */}
              <div>
                <h2 className="font-heading text-2xl font-bold text-navy">{t("delivery.title")}</h2>
                <p className="mt-4 leading-relaxed text-navy/60">{t("delivery.p1")}</p>
                <p className="mt-3 leading-relaxed text-navy/60">{t("delivery.p2")}</p>
                <p className="mt-3 leading-relaxed text-navy/60">{t("delivery.p3")}</p>
              </div>

              {/* Article 7 */}
              <div>
                <h2 className="font-heading text-2xl font-bold text-navy">{t("withdrawal.title")}</h2>
                <p className="mt-4 leading-relaxed text-navy/60">{t("withdrawal.intro")}</p>
                <p className="mt-3 text-navy/60">{t("withdrawal.conditions")}</p>
                <ul className="mt-2 list-disc space-y-1 pl-6 text-navy/60">
                  <li>{t("withdrawal.cond1")}</li>
                  <li>{t("withdrawal.cond2")}</li>
                  <li>{t("withdrawal.cond3")}</li>
                </ul>
                <p className="mt-4 leading-relaxed text-navy/60">{t("withdrawal.fees")}</p>
              </div>

              {/* Article 8 */}
              <div>
                <h2 className="font-heading text-2xl font-bold text-navy">{t("responsibility.title")}</h2>
                <p className="mt-4 text-navy/60">{t("responsibility.intro")}</p>
                <ul className="mt-2 list-disc space-y-1 pl-6 text-navy/60">
                  <li>{t("responsibility.item1")}</li>
                  <li>{t("responsibility.item2")}</li>
                  <li>{t("responsibility.item3")}</li>
                </ul>
                <p className="mt-4 leading-relaxed text-navy/60">{t("responsibility.note")}</p>
              </div>

              {/* Article 9 */}
              <div>
                <h2 className="font-heading text-2xl font-bold text-navy">{t("disputes.title")}</h2>
                <p className="mt-4 leading-relaxed text-navy/60">{t("disputes.p1")}</p>
                <p className="mt-3 leading-relaxed text-navy/60">{t("disputes.p2")}</p>
              </div>

              {/* B2B */}
              <div className="rounded-2xl border border-navy/[0.06] bg-navy/[0.02] p-8">
                <h2 className="font-heading text-2xl font-bold text-navy">{t("b2b.title")}</h2>
                <p className="mt-4 leading-relaxed text-navy/60">{t("b2b.intro")}</p>
                <p className="mt-3 text-navy/60">{t("b2b.commitIntro")}</p>
                <ul className="mt-2 list-disc space-y-1 pl-6 text-navy/60">
                  <li>{t("b2b.commit1")}</li>
                  <li>{t("b2b.commit2")}</li>
                  <li>{t("b2b.commit3")}</li>
                  <li>{t("b2b.commit4")}</li>
                </ul>
                <p className="mt-4 leading-relaxed text-navy/60">{t("b2b.abuse")}</p>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
