import type { Metadata } from "next";
import { Manrope, DM_Sans } from "next/font/google";
import "./globals.css";

const headingFont = Manrope({
  subsets: ["latin"],
  variable: "--font-heading-var",
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

const bodyFont = DM_Sans({
  subsets: ["latin"],
  variable: "--font-body",
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

// Paste the code from Meta Business Manager → Brand Safety → Domains
// (the `content` value of the facebook-domain-verification meta tag).
const FB_DOMAIN_VERIFICATION = "37kv7ent732uk8pvwaahodku040u3h";

export const metadata: Metadata = {
  title: "HydraWay — Hydrate better. Live better.",
  description:
    "Solution d'hydratation premium en Tunisie. Électrolytes, vitamines et minéraux essentiels sans sucre.",
  ...(FB_DOMAIN_VERIFICATION
    ? { other: { "facebook-domain-verification": FB_DOMAIN_VERIFICATION } }
    : {}),
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" className={`${headingFont.variable} ${bodyFont.variable}`}>
      <body className="antialiased" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
