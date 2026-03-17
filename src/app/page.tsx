import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

const demos = [
  {
    num: "01",
    href: "/generatif-vs-jepa",
    title: "Génératif vs JEPA",
    description: "Prédire des pixels vs prédire dans l'espace latent. La distinction fondamentale.",
    tag: "Fondamental",
  },
  {
    num: "02",
    href: "/masking",
    title: "I-JEPA Masking",
    description: "Masquez des zones d'image. JEPA prédit leur représentation abstraite, jamais les pixels.",
    tag: "Interactif",
  },
  {
    num: "03",
    href: "/world-model",
    title: "World Model",
    description: "Un agent qui simule mentalement le futur avant d'agir. Versus l'agent aléatoire.",
    tag: "Simulation",
  },
  {
    num: "04",
    href: "/espace-latent",
    title: "Espace Latent",
    description: "Basculez entre espace pixel (chaos) et espace latent (structure sémantique).",
    tag: "Visualisation",
  },
];

export default function Home() {
  return (
    <div className="bg-[#111] text-white min-h-screen">

      {/* ── HERO ──────────────────────────────────────────────────────────── */}
      <section className="relative h-[100svh] pt-14 flex flex-col justify-center border-b border-white/20 overflow-hidden">

        {/* Ambient glow top-right */}
        <div aria-hidden className="absolute top-0 right-0 w-[600px] h-[600px] bg-white/[0.02] rounded-full blur-[120px] pointer-events-none" />

        <div className="relative z-10 px-4 sm:px-8 md:px-16 max-w-[1600px] mx-auto w-full">

          {/* Top label */}
          <p className="section-label mb-8 animate-fade-in">
            [ Yann LeCun · Meta AI · 2022–2024 ]
          </p>

          {/* Two-column layout : title left, meta right */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-0 items-end animate-fade-in">

            {/* Title — 8 cols */}
            <div className="lg:col-span-8">
              <h1 style={{ fontSize: "clamp(3rem,9vw,8.5rem)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "-0.03em", lineHeight: 0.9 }}>
                Joint<br />
                Embedding<br />
                Predictive<br />
                Architecture
              </h1>
            </div>

            {/* Right meta — 4 cols */}
            <div className="lg:col-span-4 lg:pl-16 pb-2 flex flex-col gap-6">
              <p className="text-gray-400 text-base leading-relaxed">
                Les LLMs prédisent des tokens. JEPA prédit des{" "}
                <em className="not-italic text-white">représentations abstraites</em>.
                Une distinction fondamentale qui pourrait mener à de vraies IA autonomes.
              </p>
              <div className="flex flex-col gap-3">
                <div className="flex flex-col sm:flex-row gap-3">
                  <Link href="/generatif-vs-jepa" className="btn-primary inline-block text-center flex-1">
                    Démarrer la démo
                  </Link>
                  <Link href="/papers" className="btn-outline inline-block text-center flex-1">
                    Lire les papiers →
                  </Link>
                </div>
                <Link href="/notes" className="btn-outline inline-block text-center w-full">
                  Notes & Collaboration →
                </Link>
              </div>
            </div>
          </div>

          {/* Bottom strip — scroll hint */}
          <div className="mt-16 flex items-center gap-4 animate-fade-in-delay">
            <div className="h-px flex-1 bg-white/10" />
            <span className="section-label">4 démos interactives</span>
            <div className="h-px flex-1 bg-white/10" />
          </div>
        </div>
      </section>

      {/* ── DEMOS — numbered rows ──────────────────────────────────────────── */}
      <section className="border-b border-white/20">

        <div className="px-4 sm:px-8 md:px-16 pt-16 pb-10 border-b border-white/20">
          <div className="grid grid-cols-1 md:grid-cols-12 items-end gap-6">
            <div className="md:col-span-7">
              <span className="section-label block mb-5">[ Démos Interactives ]</span>
              <h2 style={{ fontSize: "clamp(2rem,5vw,3.8rem)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "-0.03em", lineHeight: 0.94 }}>
                4 Concepts.<br />4 Démos.
              </h2>
            </div>
            <div className="md:col-span-5 md:pl-8">
              <p className="text-gray-400 text-base leading-relaxed">
                Aucun modèle ML côté client. Chaque démo illustre un concept clé avec rigueur
                conceptuelle — pour comprendre, pas pour impressionner.
              </p>
            </div>
          </div>
        </div>

        {demos.map((demo) => (
          <Link
            key={demo.href}
            href={demo.href}
            className="group block border-b border-white/20 last:border-b-0 hover:bg-white/[0.03] transition-colors duration-200"
          >
            <div className="grid grid-cols-1 md:grid-cols-12 md:min-h-[18vh] items-stretch">

              {/* Number */}
              <div className="md:col-span-2 p-6 md:p-10 border-b md:border-b-0 md:border-r border-white/20 flex items-center">
                <span className="text-5xl md:text-6xl font-bold text-white/15 group-hover:text-white/70 transition-colors duration-500 leading-none">
                  {demo.num}
                </span>
              </div>

              {/* Title + desc */}
              <div className="md:col-span-7 p-6 md:p-10 border-b md:border-b-0 md:border-r border-white/20 flex flex-col justify-center gap-2">
                <h3 className="text-xl md:text-3xl font-bold uppercase tracking-tight group-hover:text-white/80 transition-colors">
                  {demo.title}
                </h3>
                <p className="text-gray-500 text-sm md:text-base leading-relaxed max-w-xl">
                  {demo.description}
                </p>
              </div>

              {/* Tag + arrow */}
              <div className="md:col-span-3 p-6 md:p-10 flex items-center justify-between md:justify-center gap-4 bg-white/[0.01] opacity-50 group-hover:opacity-100 transition-opacity">
                <span className="text-[10px] uppercase tracking-widest border border-white/30 px-3 py-1 text-white">
                  {demo.tag}
                </span>
                <ArrowUpRight className="w-5 h-5 text-white/40 group-hover:text-white group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all duration-200" />
              </div>

            </div>
          </Link>
        ))}
      </section>

      {/* ── BENTO — key ideas ─────────────────────────────────────────────── */}
      <section className="border-b border-white/20 px-4 sm:px-8 md:px-16 py-16 md:py-24">

        <div className="mb-4">
          <span className="section-label">[ Ce Que LeCun Propose ]</span>
        </div>
        <div className="mb-14 grid grid-cols-1 md:grid-cols-12 items-end gap-6">
          <div className="md:col-span-7">
            <h2 style={{ fontSize: "clamp(2rem,5vw,3.8rem)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "-0.03em", lineHeight: 0.94 }}>
              Pas de pixels.<br />
              Pas de tokens.<br />
              <em className="not-italic text-gray-500 font-normal">Des représentations.</em>
            </h2>
          </div>
          <div className="md:col-span-5 md:pl-8">
            <span className="section-label block mb-2">Notre philosophie</span>
            <p className="text-lg text-white/70">Les modèles génératifs mémorisent. JEPA comprend.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-white/20 border border-white/20">
          {[
            { num: "01", title: "Prédiction Latente",  desc: "Plutôt que reconstruire chaque pixel, JEPA prédit dans un espace de représentations abstrait. O(1) vs O(H×W).", span: "md:col-span-2" },
            { num: "02", title: "Stop-Gradient",       desc: "Évite le representation collapse via EMA sur le target encoder. Stable sans contrastive loss explicite.", span: "" },
            { num: "03", title: "World Model",         desc: "Un agent maintient un modèle interne du monde pour simuler les conséquences avant d'agir.", span: "" },
            { num: "04", title: "Sémantique Émergente",desc: "L'espace latent de JEPA regroupe naturellement les concepts similaires — sans supervision explicite.", span: "md:col-span-2" },
          ].map(({ num, title, desc, span }) => (
            <div key={num} className={`bg-[#111] p-8 md:p-12 flex flex-col justify-between group hover:bg-white/5 transition-colors min-h-[220px] ${span}`}>
              <div className="flex justify-between items-start">
                <span className="text-xs border border-white/20 px-2 py-1">{num}</span>
                <span aria-hidden className="text-xl text-white/30 group-hover:rotate-45 group-hover:text-white transition-all duration-300">↗</span>
              </div>
              <div className="mt-8">
                <h3 className="text-xl font-bold mb-3 uppercase tracking-tight">{title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── LECUN QUOTE ───────────────────────────────────────────────────── */}
      <section className="px-4 sm:px-8 md:px-16 py-16 md:py-24">
        <div className="grid grid-cols-1 md:grid-cols-12 border border-white/20">
          <div className="md:col-span-2 p-8 md:p-10 border-b md:border-b-0 md:border-r border-white/20 flex items-start">
            <span className="section-label mt-1">[ Citation ]</span>
          </div>
          <div className="md:col-span-10 p-8 md:p-12">
            <blockquote
              style={{ fontSize: "clamp(1.2rem,2.5vw,2rem)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "-0.02em", lineHeight: 1.15 }}
              className="mb-6"
            >
              &ldquo;The next step is to build AI systems that can learn world models —
              internal models of how the world works — so they can plan and reason
              about the consequences of their actions.&rdquo;
            </blockquote>
            <footer className="section-label">
              — Yann LeCun · A Path Towards Autonomous Machine Intelligence · 2022
            </footer>
          </div>
        </div>
      </section>

    </div>
  );
}
