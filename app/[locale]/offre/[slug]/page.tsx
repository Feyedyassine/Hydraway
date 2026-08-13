import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { db } from "@/lib/db";
import { products, promotions } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { isLive } from "@/lib/promotions";
import { Link } from "@/i18n/navigation";
import { ArrowLeft } from "lucide-react";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import CartDrawer from "../../components/CartDrawer";
import OfferPanel from "./OfferPanel";

type Props = {
  params: Promise<{ locale: string; slug: string }>;
};

type Loaded = {
  promo: typeof promotions.$inferSelect;
  triggerProduct: typeof products.$inferSelect;
  giftProduct: typeof products.$inferSelect | null;
};

/**
 * Soft-deleted promotions still resolve: links shared on social outlive the
 * campaign, and an expired-offer page converts better than a 404.
 */
async function load(slug: string): Promise<Loaded | null> {
  const [promo] = await db
    .select()
    .from(promotions)
    .where(eq(promotions.slug, slug))
    .limit(1);
  if (!promo) return null;

  const [triggerProduct] = await db
    .select()
    .from(products)
    .where(eq(products.id, promo.triggerProductId))
    .limit(1);
  if (!triggerProduct) return null;

  let giftProduct: typeof products.$inferSelect | null = null;
  if (promo.giftProductId) {
    const [g] = await db
      .select()
      .from(products)
      .where(eq(products.id, promo.giftProductId))
      .limit(1);
    giftProduct = g ?? null;
  }

  return { promo, triggerProduct, giftProduct };
}

function absoluteUrl(path: string | null): string | undefined {
  if (!path) return undefined;
  if (path.startsWith("http")) return path;
  const base = process.env.NEXT_PUBLIC_BASE_URL;
  return base ? `${base}${path}` : undefined;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const loaded = await load(slug);
  if (!loaded) return {};

  const { promo, triggerProduct } = loaded;
  const headline = locale === "fr" ? promo.headlineFr : promo.headline;
  const description =
    (locale === "fr" ? promo.descriptionFr : promo.description) ?? undefined;
  // Without an absolute URL Facebook renders the share card with no image.
  const image = absoluteUrl(promo.ogImage ?? triggerProduct.image);

  return {
    title: `${headline} — HydraWay`,
    description,
    openGraph: {
      title: headline,
      description,
      type: "website",
      images: image ? [{ url: image }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: headline,
      description,
      images: image ? [image] : undefined,
    },
  };
}

export default async function OfferPage({ params }: Props) {
  const { locale, slug } = await params;
  const loaded = await load(slug);
  if (!loaded) notFound();

  const { promo, triggerProduct, giftProduct } = loaded;
  const t = await getTranslations("offer");
  const fr = locale === "fr";

  const live = isLive(
    {
      id: promo.id,
      slug: promo.slug,
      name: promo.name,
      type: promo.type,
      triggerProductId: promo.triggerProductId,
      triggerQuantity: promo.triggerQuantity,
      activationQuantity: promo.activationQuantity,
      discountPercent: promo.discountPercent,
      giftProductId: promo.giftProductId,
      giftQuantity: promo.giftQuantity,
      giftPrice: giftProduct?.price ?? null,
      startsAt: promo.startsAt,
      expiresAt: promo.expiresAt,
      active: promo.active,
      deletedAt: promo.deletedAt,
    },
    new Date()
  );

  const headline = fr ? promo.headlineFr : promo.headline;
  const description = fr ? promo.descriptionFr : promo.description;
  const productDescription = fr
    ? triggerProduct.descriptionFr
    : triggerProduct.description;
  const giftName = giftProduct ? (fr ? giftProduct.nameFr : giftProduct.name) : null;

  const crossProductGift =
    promo.type === "bxgy" &&
    giftProduct !== null &&
    promo.giftProductId !== promo.triggerProductId;

  const triggerSubtotal = triggerProduct.price * promo.activationQuantity;
  const giftSubtotal = crossProductGift
    ? (promo.giftQuantity ?? 0) * (giftProduct?.price ?? 0)
    : 0;

  let discount = 0;
  if (promo.type === "percentage") {
    discount = (triggerSubtotal * (promo.discountPercent ?? 0)) / 100;
  } else if (crossProductGift) {
    discount = giftSubtotal;
  } else {
    discount = (promo.giftQuantity ?? 0) * triggerProduct.price;
  }
  discount = Math.round(discount * 100) / 100;

  const was = Math.round((triggerSubtotal + giftSubtotal) * 100) / 100;
  const now = Math.round((was - discount) * 100) / 100;

  const giftLabel = crossProductGift
    ? `${promo.giftQuantity} × ${giftName}`
    : promo.type === "bxgy"
      ? `${promo.giftQuantity} × ${fr ? triggerProduct.nameFr : triggerProduct.name}`
      : null;

  return (
    <>
      <Navbar />
      <CartDrawer />

      <main>
        {/* Product hero */}
        <section className="relative overflow-hidden bg-white pb-20 pt-24 lg:pb-28 lg:pt-28">
          <div className="absolute -top-64 right-0 h-[500px] w-[500px] rounded-full bg-brand-red/[0.03] blur-[100px]" />

          <div className="relative mx-auto max-w-7xl px-5 lg:px-8">
            <Link
              href="/"
              className="group mb-10 inline-flex items-center gap-2 rounded-full border border-navy/[0.08] bg-white/70 px-4 py-2 text-xs font-semibold text-navy/50 shadow-sm backdrop-blur transition-all duration-300 hover:border-navy/[0.15] hover:bg-white hover:text-navy hover:shadow-md"
            >
              <ArrowLeft
                size={14}
                strokeWidth={2.5}
                className="transition-transform duration-300 group-hover:-translate-x-0.5"
              />
              {t("backHome")}
            </Link>

            {!live && (
              <div className="mb-10 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4">
                <p className="text-sm font-semibold text-amber-900">
                  {t("expiredTitle")}
                </p>
                <p className="mt-1 text-sm text-amber-800">{t("expiredBody")}</p>
              </div>
            )}

            <div className="grid grid-cols-1 items-center gap-16 lg:grid-cols-2">
              {/* Images — same composition as the homepage product section */}
              <div className="relative">
                <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-navy/5 to-ice/40">
                  <Image
                    src={triggerProduct.image ?? "/images/sticks-duo.png"}
                    alt={fr ? triggerProduct.nameFr : triggerProduct.name}
                    width={600}
                    height={500}
                    priority
                    className="h-auto w-full object-cover"
                  />
                  {live && discount > 0 && (
                    <span className="absolute right-5 top-5 rounded-full bg-brand-red px-4 py-1.5 text-sm font-bold text-white shadow-lg shadow-brand-red/25">
                      −{Math.round((discount / was) * 100)}%
                    </span>
                  )}
                </div>

                <div className="absolute -bottom-6 -right-4 w-40 overflow-hidden rounded-2xl border-4 border-white shadow-2xl shadow-navy/10 sm:w-52 lg:-right-8">
                  <Image
                    src={
                      crossProductGift && giftProduct?.image
                        ? giftProduct.image
                        : "/images/stick-single.png"
                    }
                    alt={crossProductGift ? giftName ?? "" : "HydraWay Stick"}
                    width={240}
                    height={200}
                    className="h-auto w-full bg-white object-cover"
                  />
                </div>

              </div>

              {/* Buying panel */}
              <OfferPanel
                product={{
                  productId: triggerProduct.id,
                  name: triggerProduct.name,
                  nameFr: triggerProduct.nameFr,
                  price: triggerProduct.price,
                  image: triggerProduct.image,
                  stock: triggerProduct.stock,
                }}
                quantity={promo.activationQuantity}
                headline={headline}
                description={description || productDescription}
                giftLabel={giftLabel}
                was={was}
                now={now}
                discount={discount}
                live={live}
                promotionSlug={promo.slug}
                promotionName={promo.name}
              />
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
