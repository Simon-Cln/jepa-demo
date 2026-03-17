import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

const papers = [
  {
    id: "01",
    year: "2022",
    authors: "Yann LeCun",
    title: "A Path Towards Autonomous Machine Intelligence",
    venue: "OpenReview",
    description:
      "Le papier fondateur. LeCun y propose l'architecture JEPA, les world models hiérarchiques, et une vision complète de l'IA autonome sans apprentissage par renforcement.",
    tag: "Fondateur",
    href: "https://openreview.net/pdf?id=BZ5a1r-kVsf",
  },
  {
    id: "02",
    year: "2023",
    authors: "Assran, Duval, Misra et al. — Meta AI",
    title: "Self-Supervised Learning from Images with a Joint-Embedding Predictive Architecture",
    venue: "CVPR 2023",
    description:
      "I-JEPA : la première implémentation image de JEPA. Prédit des représentations de patches masqués via un context encoder + predictor. Surpasse les méthodes contrastives.",
    tag: "I-JEPA",
    href: "https://arxiv.org/abs/2301.08243",
  },
  {
    id: "03",
    year: "2024",
    authors: "Bardes, Garrido, Ponce et al. — Meta AI",
    title: "V-JEPA: Revisiting Feature Prediction for Learning Visual Representations from Video",
    venue: "NeurIPS 2024",
    description:
      "Extension vidéo de JEPA. Prédit des représentations spatio-temporelles de clips masqués. Transfert zero-shot remarquable sur les tâches d'action et d'objet.",
    tag: "V-JEPA",
    href: "https://arxiv.org/abs/2404.08471",
  },
  {
    id: "04",
    year: "2023",
    authors: "Bardes, Ponce, LeCun — Meta AI",
    title: "MC-JEPA: A Joint-Embedding Predictive Architecture for Self-Supervised Learning of Motion and Content Features",
    venue: "ICLR 2023",
    description:
      "Variante qui sépare les caractéristiques de mouvement et de contenu dans l'espace latent. Illustre la modularité de l'approche JEPA.",
    tag: "MC-JEPA",
    href: "https://arxiv.org/abs/2307.04700",
  },
  {
    id: "05",
    year: "2018",
    authors: "Ha & Schmidhuber",
    title: "World Models",
    venue: "NeurIPS 2018",
    description:
      "Précurseur des world models modernes. Un agent apprend un modèle du monde (RNN + VAE) pour «rêver» des trajectoires et s'entraîner dans son imagination.",
    tag: "World Models",
    href: "https://arxiv.org/abs/1803.10122",
  },
  {
    id: "06",
    year: "2022",
    authors: "Bardes, Ponce, LeCun — Meta AI",
    title: "VICReg: Variance-Invariance-Covariance Regularization for Self-Supervised Learning",
    venue: "ICLR 2022",
    description:
      "Méthode de regularisation pour éviter le collapse de représentations. Base théorique du target encoder EMA utilisé dans I-JEPA.",
    tag: "Théorie",
    href: "https://arxiv.org/abs/2105.04906",
  },
];

export default function PapersPage() {
  return (
    <div className="bg-[#111] text-white min-h-screen">

      {/* Header */}
      <section className="border-b border-white/20 px-4 sm:px-8 md:px-16 pt-16 pb-14">
        <span className="section-label block mb-10">[ Références ]</span>
        <div className="grid grid-cols-1 md:grid-cols-12 items-end gap-8">
          <div className="md:col-span-6">
            <h1 style={{ fontSize: "clamp(2.5rem,6vw,5.5rem)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "-0.03em", lineHeight: 0.92 }}>
              Papiers<br />de Recherche
            </h1>
          </div>
          <div className="md:col-span-6 md:pl-8 pb-1">
            <p className="text-gray-400 text-base leading-relaxed max-w-lg">
              Les travaux fondateurs de JEPA et des World Models — de la théorie
              initiale de LeCun aux implémentations récentes de Meta AI.
            </p>
          </div>
        </div>
      </section>

      {/* Papers list */}
      <section>
        {papers.map((paper) => (
          <a
            key={paper.id}
            href={paper.href}
            target="_blank"
            rel="noopener noreferrer"
            className="group block border-b border-white/20 last:border-b-0 hover:bg-white/[0.03] transition-colors duration-200"
          >
            <div className="grid grid-cols-1 md:grid-cols-12 items-stretch">

              {/* ID + year */}
              <div className="md:col-span-2 p-6 md:p-10 border-b md:border-b-0 md:border-r border-white/20 flex flex-col justify-between gap-4">
                <span className="text-5xl md:text-6xl font-bold text-white/12 group-hover:text-white/60 transition-colors duration-500 leading-none">
                  {paper.id}
                </span>
                <span className="section-label">{paper.year}</span>
              </div>

              {/* Content */}
              <div className="md:col-span-8 p-6 md:p-10 border-b md:border-b-0 md:border-r border-white/20 flex flex-col justify-center gap-3">
                <p className="text-[11px] uppercase tracking-widest text-gray-600">
                  {paper.authors} · {paper.venue}
                </p>
                <h3 className="text-lg md:text-xl font-bold leading-tight group-hover:text-white/80 transition-colors">
                  {paper.title}
                </h3>
                <p className="text-gray-500 text-sm leading-relaxed max-w-2xl">
                  {paper.description}
                </p>
              </div>

              {/* Tag + arrow */}
              <div className="md:col-span-2 p-6 md:p-10 flex items-center justify-between md:flex-col md:justify-center md:items-center gap-4 bg-white/[0.01] opacity-50 group-hover:opacity-100 transition-opacity">
                <span className="text-[10px] uppercase tracking-widest border border-white/30 px-3 py-1">
                  {paper.tag}
                </span>
                <ArrowUpRight className="w-5 h-5 text-white/40 group-hover:text-white group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all duration-200" />
              </div>

            </div>
          </a>
        ))}
      </section>

      {/* Footer CTA */}
      <section className="border-t border-white/20 px-4 sm:px-8 md:px-16 py-16">
        <div className="flex flex-col sm:flex-row gap-4">
          <Link href="/" className="btn-outline text-center">
            ← Retour
          </Link>
          <Link href="/notes" className="btn-primary text-center">
            Prendre des Notes →
          </Link>
        </div>
      </section>

    </div>
  );
}
