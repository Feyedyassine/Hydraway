import Link from "next/link";
import { Droplets } from "lucide-react";

export default function NotFound() {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-navy">
      {/* Background effects */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/3 h-[500px] w-[500px] rounded-full bg-brand-red/6 blur-[160px]" />
        <div className="absolute bottom-1/4 right-1/3 h-[400px] w-[400px] rounded-full bg-brand-blue/8 blur-[140px]" />
      </div>

      {/* Dot pattern */}
      <div
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage:
            "radial-gradient(rgba(255,255,255,0.4) 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      />

      <div className="relative z-10 flex flex-col items-center gap-8 px-5 text-center">
        {/* Icon */}
        <div className="flex h-20 w-20 items-center justify-center rounded-full border border-white/[0.06] bg-white/[0.03]">
          <Droplets size={32} className="text-brand-red/60" strokeWidth={1.5} />
        </div>

        {/* 404 number */}
        <h1 className="font-heading text-[8rem] font-extrabold leading-none tracking-tighter sm:text-[10rem]">
          <span className="bg-gradient-to-b from-white/20 to-white/[0.04] bg-clip-text text-transparent">
            404
          </span>
        </h1>

        {/* Message */}
        <div className="flex flex-col gap-3">
          <p className="font-heading text-2xl font-bold text-white/80 sm:text-3xl">
            Page introuvable
          </p>
          <p className="max-w-md text-base text-white/35">
            Cette page semble avoir disparu. Peut-être qu&apos;une bonne
            hydratation vous aidera à retrouver votre chemin.
          </p>
        </div>

        {/* CTA */}
        <Link
          href="/"
          className="mt-4 rounded-full bg-gradient-to-r from-brand-red to-brand-crimson px-8 py-3.5 text-sm font-semibold text-white shadow-lg shadow-brand-red/20 transition-all hover:shadow-brand-red/35 hover:brightness-110"
        >
          Retour à l&apos;accueil
        </Link>
      </div>
    </div>
  );
}
