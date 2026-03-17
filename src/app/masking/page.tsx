import { MaskingDemo } from "@/components/masking/MaskingDemo";

export default function MaskingPage() {
  return (
    <div className="bg-[#111] text-white min-h-screen">

      <section className="border-b border-white/20 px-4 sm:px-8 md:px-16 pt-16 pb-14">
        <span className="section-label block mb-10">[ 02 — Interactif ]</span>
        <div className="grid grid-cols-1 md:grid-cols-12 items-end gap-8">
          <div className="md:col-span-6">
            <h1 style={{ fontSize: "clamp(2.5rem,6vw,5.5rem)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "-0.03em", lineHeight: 0.92 }}>
              I-JEPA<br />Masking
            </h1>
          </div>
          <div className="md:col-span-6 md:pl-8 pb-1">
            <p className="text-gray-400 text-base leading-relaxed max-w-lg">
              Masquez des zones de l&apos;image. JEPA prédit leur{" "}
              <em className="not-italic text-white">représentation latente</em> — sans jamais
              reconstruire un pixel. Glissez la souris pour masquer plusieurs patches.
            </p>
          </div>
        </div>
      </section>

      <section className="px-4 sm:px-8 md:px-16 py-16">
        <MaskingDemo />
      </section>

    </div>
  );
}
