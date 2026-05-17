"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Mail, Phone, MapPin, Send, CheckCircle } from "lucide-react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import ScrollReveal from "../components/ScrollReveal";

export default function ContactPage() {
  const t = useTranslations("contactPage");

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error || "Error sending message");
        return;
      }
      setSent(true);
    } catch {
      alert("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (sent) {
    return (
      <>
        <Navbar />
        <main className="flex min-h-screen items-center justify-center bg-ice-light/30 px-5 pt-24">
          <div className="max-w-md text-center">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
              <CheckCircle size={40} className="text-green-600" />
            </div>
            <h1 className="mb-3 font-heading text-3xl font-extrabold text-navy">
              {t("success.title")}
            </h1>
            <p className="mb-8 text-navy/50">{t("success.message")}</p>
            <a
              href="/"
              className="inline-flex rounded-full bg-navy px-8 py-3 text-sm font-semibold text-white transition-colors hover:bg-navy-light"
            >
              {t("success.backHome")}
            </a>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main>
        {/* Hero */}
        <section className="relative overflow-hidden bg-navy pb-16 pt-40 lg:pb-20 lg:pt-48">
          <div className="absolute inset-0">
            <div className="absolute inset-0 bg-gradient-to-br from-navy via-navy-light to-navy-800" />
            <div className="animate-pulse-glow absolute -top-32 -right-32 h-[400px] w-[400px] rounded-full bg-brand-red/8 blur-[120px]" />
          </div>
          <div className="relative z-10 mx-auto max-w-4xl px-5 text-center lg:px-8">
            <ScrollReveal>
              <div className="mb-4 flex items-center justify-center gap-3">
                <div className="h-px w-8 bg-gradient-to-r from-transparent to-brand-red" />
                <span className="text-xs font-bold uppercase tracking-[0.2em] text-brand-red">
                  {t("subtitle")}
                </span>
                <div className="h-px w-8 bg-gradient-to-l from-transparent to-brand-red" />
              </div>
              <h1 className="mb-4 font-heading text-4xl font-extrabold tracking-tight text-white sm:text-5xl">
                {t("title")}
              </h1>
              <p className="mx-auto max-w-2xl text-lg text-white/50">
                {t("description")}
              </p>
            </ScrollReveal>
          </div>
        </section>

        {/* Contact Section */}
        <section className="py-16 lg:py-24">
          <div className="mx-auto max-w-7xl px-5 lg:px-8">
            <div className="grid grid-cols-1 gap-12 lg:grid-cols-5">
              {/* Contact Info */}
              <ScrollReveal direction="left" className="lg:col-span-2">
                <div className="flex flex-col gap-8">
                  <div>
                    <h2 className="mb-6 font-heading text-2xl font-bold text-navy">
                      {t("info.title")}
                    </h2>
                    <p className="text-navy/50">{t("info.description")}</p>
                  </div>

                  <div className="flex flex-col gap-5">
                    <div className="flex items-start gap-4">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-red/8">
                        <Mail size={18} className="text-brand-red" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-navy">{t("info.email")}</p>
                        <a
                          href="mailto:info@hydraway.com.tn"
                          className="text-sm text-navy/50 transition-colors hover:text-brand-red"
                        >
                          info@hydraway.com.tn
                        </a>
                      </div>
                    </div>

                    <div className="flex items-start gap-4">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-red/8">
                        <Phone size={18} className="text-brand-red" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-navy">{t("info.phone")}</p>
                        <a
                          href="tel:+21652888739"
                          className="text-sm text-navy/50 transition-colors hover:text-brand-red"
                        >
                          +216 52 888 739
                        </a>
                      </div>
                    </div>

                    <div className="flex items-start gap-4">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-red/8">
                        <MapPin size={18} className="text-brand-red" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-navy">{t("info.address")}</p>
                        <p className="text-sm text-navy/50">
                          9 rue Noureddine El Khayechi
                          <br />
                          La Marsa Safsaf, 2078 La Marsa
                          <br />
                          Tunisie
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </ScrollReveal>

              {/* Contact Form */}
              <ScrollReveal direction="right" className="lg:col-span-3">
                <form onSubmit={handleSubmit} className="rounded-2xl bg-white p-6 shadow-sm sm:p-8">
                  <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                    {/* Name */}
                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-navy/60">
                        {t("form.name")} *
                      </label>
                      <input
                        type="text"
                        name="name"
                        required
                        value={form.name}
                        onChange={handleChange}
                        className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none transition-colors focus:border-navy"
                      />
                    </div>

                    {/* Email */}
                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-navy/60">
                        {t("form.email")} *
                      </label>
                      <input
                        type="email"
                        name="email"
                        required
                        value={form.email}
                        onChange={handleChange}
                        className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none transition-colors focus:border-navy"
                      />
                    </div>

                    {/* Phone */}
                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-navy/60">
                        {t("form.phone")}
                      </label>
                      <input
                        type="tel"
                        name="phone"
                        value={form.phone}
                        onChange={handleChange}
                        className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none transition-colors focus:border-navy"
                      />
                    </div>

                    {/* Subject */}
                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-navy/60">
                        {t("form.subject")} *
                      </label>
                      <select
                        name="subject"
                        required
                        value={form.subject}
                        onChange={handleChange}
                        className="w-full appearance-none rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none transition-colors focus:border-navy"
                      >
                        <option value="">{t("form.selectSubject")}</option>
                        <option value="general">{t("form.subjects.general")}</option>
                        <option value="order">{t("form.subjects.order")}</option>
                        <option value="partnership">{t("form.subjects.partnership")}</option>
                        <option value="other">{t("form.subjects.other")}</option>
                      </select>
                    </div>
                  </div>

                  {/* Message */}
                  <div className="mt-5">
                    <label className="mb-1.5 block text-sm font-medium text-navy/60">
                      {t("form.message")} *
                    </label>
                    <textarea
                      name="message"
                      required
                      rows={5}
                      value={form.message}
                      onChange={handleChange}
                      className="w-full resize-none rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none transition-colors focus:border-navy"
                    />
                  </div>

                  {/* Submit */}
                  <button
                    type="submit"
                    disabled={submitting}
                    className="mt-6 inline-flex items-center gap-2 rounded-full bg-navy px-8 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-navy-light disabled:opacity-50"
                  >
                    {submitting ? t("form.sending") : t("form.send")}
                    {!submitting && <Send size={16} />}
                  </button>
                </form>
              </ScrollReveal>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
