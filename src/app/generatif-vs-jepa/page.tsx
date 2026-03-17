import { GeneratifVsJepa } from "@/components/generatif/GeneratifVsJepa";

export default function GeneratifVsJepaPage() {
  return (
    <div className="bg-[#111] text-white min-h-screen">

      <section className="border-b border-white/20 px-4 sm:px-8 md:px-16 pt-16 pb-14">
        <span className="section-label block mb-10">[ 01 — Fondamental ]</span>
        <div className="grid grid-cols-1 md:grid-cols-12 items-end gap-8">
          <div className="md:col-span-6">
            <h1 style={{ fontSize: "clamp(2.5rem,6vw,5.5rem)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "-0.03em", lineHeight: 0.92 }}>
              Génératif<br />vs JEPA
            </h1>
          </div>
          <div className="md:col-span-6 md:pl-8 pb-1">
            <p className="text-gray-400 text-base leading-relaxed max-w-lg">
              Les modèles génératifs prédisent des pixels. JEPA prédit dans l&apos;espace
              des représentations. Une même image — deux façons radicalement différentes
              de l&apos;apprendre.
            </p>
          </div>
        </div>
      </section>

      <section className="px-4 sm:px-8 md:px-16 py-16">
        <GeneratifVsJepa />
      </section>

    </div>
  );
}
