import { LatentSpaceViz } from "@/components/latent/LatentSpaceViz";

export default function EspaceLatentPage() {
  return (
    <div className="bg-[#111] text-white min-h-screen">

      <section className="border-b border-white/20 px-4 sm:px-8 md:px-16 pt-16 pb-14">
        <span className="section-label block mb-10">[ 04 — Visualisation ]</span>
        <div className="grid grid-cols-1 md:grid-cols-12 items-end gap-8">
          <div className="md:col-span-6">
            <h1 style={{ fontSize: "clamp(2.5rem,6vw,5.5rem)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "-0.03em", lineHeight: 0.92 }}>
              Espace<br />Latent
            </h1>
          </div>
          <div className="md:col-span-6 md:pl-8 pb-1">
            <p className="text-gray-400 text-base leading-relaxed max-w-lg">
              Basculez entre espace pixel (aléatoire) et espace latent (structuré). Survolez
              un concept pour voir ses voisins sémantiques. La géométrie révèle la compréhension.
            </p>
          </div>
        </div>
      </section>

      <section className="px-4 sm:px-8 md:px-16 py-16">
        <LatentSpaceViz />
      </section>

    </div>
  );
}
