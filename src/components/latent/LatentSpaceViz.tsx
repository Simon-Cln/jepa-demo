"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CONCEPTS, CATEGORY_COLORS, CATEGORY_LABELS,
  type Concept, type ConceptCategory,
} from "@/lib/latentSpaceData";

// ─── Canvas scatter plot ───────────────────────────────────────────────────────
function ScatterPlot({
  mode, hoveredId, onHover, selectedCategory,
}: {
  mode: "pixel" | "latent";
  hoveredId: string | null;
  onHover: (id: string | null) => void;
  selectedCategory: ConceptCategory | null;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const progressRef = useRef(0);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const W = canvas.width;
    const H = canvas.height;
    const t = progressRef.current;

    ctx.clearRect(0, 0, W, H);

    // Grid
    ctx.strokeStyle = "rgba(255,255,255,0.04)";
    ctx.lineWidth = 1;
    for (let i = 0; i <= 10; i++) {
      ctx.beginPath(); ctx.moveTo((i/10)*W, 0); ctx.lineTo((i/10)*W, H); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, (i/10)*H); ctx.lineTo(W, (i/10)*H); ctx.stroke();
    }

    // Category cluster halos in latent mode
    if (t > 0.5) {
      const categories = [...new Set(CONCEPTS.map((c) => c.category))];
      categories.forEach((cat) => {
        const pts = CONCEPTS.filter((c) => c.category === cat);
        const cx = pts.reduce((s,p) => s + p.latentX, 0) / pts.length;
        const cy = pts.reduce((s,p) => s + p.latentY, 0) / pts.length;
        const alpha = (t - 0.5) * 2 * (selectedCategory === null || selectedCategory === cat ? 0.06 : 0.01);
        const grd = ctx.createRadialGradient(cx*W, cy*H, 0, cx*W, cy*H, W*0.14);
        grd.addColorStop(0, CATEGORY_COLORS[cat] + Math.round(alpha * 255).toString(16).padStart(2,"0"));
        grd.addColorStop(1, "transparent");
        ctx.fillStyle = grd;
        ctx.beginPath(); ctx.arc(cx*W, cy*H, W*0.14, 0, Math.PI*2); ctx.fill();
      });
    }

    // Connections for hovered point
    if (hoveredId) {
      const hovered = CONCEPTS.find((c) => c.id === hoveredId);
      if (hovered) {
        const px = (hovered.pixelX*(1-t) + hovered.latentX*t) * W;
        const py = (hovered.pixelY*(1-t) + hovered.latentY*t) * H;
        CONCEPTS.filter((c) => c.category === hovered.category && c.id !== hoveredId).forEach((n) => {
          const nx = (n.pixelX*(1-t) + n.latentX*t) * W;
          const ny = (n.pixelY*(1-t) + n.latentY*t) * H;
          ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(nx, ny);
          ctx.strokeStyle = "rgba(255,255,255,0.15)";
          ctx.lineWidth = 1;
          ctx.setLineDash([4, 4]); ctx.stroke(); ctx.setLineDash([]);
        });
      }
    }

    // Points
    CONCEPTS.forEach((c) => {
      const x = (c.pixelX*(1-t) + c.latentX*t) * W;
      const y = (c.pixelY*(1-t) + c.latentY*t) * H;
      const isHovered = c.id === hoveredId;
      const isDimmed = selectedCategory !== null && c.category !== selectedCategory;
      const r = isHovered ? 10 : 7;
      const alpha = isDimmed ? 0.15 : isHovered ? 1 : 0.8;

      ctx.globalAlpha = alpha;

      // Glow ring on hover
      if (isHovered) {
        const grd = ctx.createRadialGradient(x, y, 0, x, y, 22);
        grd.addColorStop(0, "rgba(255,255,255,0.2)");
        grd.addColorStop(1, "transparent");
        ctx.fillStyle = grd;
        ctx.beginPath(); ctx.arc(x, y, 22, 0, Math.PI*2); ctx.fill();
      }

      // White fill
      ctx.fillStyle = "#fff";
      ctx.strokeStyle = "#000";
      ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI*2); ctx.fill(); ctx.stroke();

      // Emoji
      ctx.font = `${isHovered ? 13 : 10}px serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(c.emoji, x, y);
      ctx.globalAlpha = 1;
    });
  }, [hoveredId, selectedCategory]);

  useEffect(() => {
    const target = mode === "latent" ? 1 : 0;
    const duration = 900;
    const start = performance.now();
    const from = progressRef.current;

    const animate = (now: number) => {
      const p = Math.min((now - start) / duration, 1);
      const eased = p < 0.5 ? 4*p*p*p : 1 - Math.pow(-2*p+2,3)/2;
      progressRef.current = from + (target - from) * eased;
      draw();
      if (p < 1) animRef.current = requestAnimationFrame(animate);
    };
    cancelAnimationFrame(animRef.current);
    animRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animRef.current);
  }, [mode, draw]);

  useEffect(() => { draw(); }, [hoveredId, selectedCategory, draw]);

  const getHoveredConcept = (e: React.MouseEvent<HTMLCanvasElement>): string | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const mx = (e.clientX - rect.left) * (canvas.width / rect.width);
    const my = (e.clientY - rect.top) * (canvas.height / rect.height);
    const t = progressRef.current;
    let closest: string | null = null;
    let minDist = 18;
    CONCEPTS.forEach((c) => {
      const cx = (c.pixelX*(1-t) + c.latentX*t) * canvas.width;
      const cy = (c.pixelY*(1-t) + c.latentY*t) * canvas.height;
      const d = Math.sqrt((cx-mx)**2 + (cy-my)**2);
      if (d < minDist) { minDist = d; closest = c.id; }
    });
    return closest;
  };

  return (
    <canvas
      ref={canvasRef}
      width={700} height={480}
      className="w-full border border-white/20 bg-[#050505] cursor-crosshair"
      onMouseMove={(e) => onHover(getHoveredConcept(e))}
      onMouseLeave={() => onHover(null)}
    />
  );
}

// ─── Tooltip ──────────────────────────────────────────────────────────────────
function ConceptTooltip({ concept, mode }: { concept: Concept; mode: "pixel" | "latent" }) {
  const x = mode === "pixel" ? concept.pixelX : concept.latentX;
  const y = mode === "pixel" ? concept.pixelY : concept.latentY;
  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="absolute bottom-4 right-4 border border-white/20 bg-[#111] p-4 space-y-2 text-xs z-10 min-w-44"
    >
      <div className="flex items-center gap-2">
        <span className="text-xl">{concept.emoji}</span>
        <div>
          <div className="font-bold uppercase tracking-wide">{concept.label}</div>
          <div className="text-[10px] uppercase tracking-widest text-gray-500 mt-0.5">
            {CATEGORY_LABELS[concept.category]}
          </div>
        </div>
      </div>
      <div className="border-t border-white/10 pt-2 space-y-1 text-[10px] uppercase tracking-widest">
        <div className="text-gray-600">x = <span className="text-white/50">{x.toFixed(3)}</span></div>
        <div className="text-gray-600">y = <span className="text-white/50">{y.toFixed(3)}</span></div>
        <div className="text-gray-600">dim = <span className="text-white/50">768</span> <span className="text-gray-700">(ViT-H)</span></div>
      </div>
    </motion.div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export function LatentSpaceViz() {
  const [mode, setMode] = useState<"pixel" | "latent">("pixel");
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<ConceptCategory | null>(null);

  const hoveredConcept = hoveredId ? CONCEPTS.find((c) => c.id === hoveredId) ?? null : null;
  const categories = [...new Set(CONCEPTS.map((c) => c.category))] as ConceptCategory[];

  return (
    <div className="space-y-8">

      {/* Mode toggle + filters */}
      <div className="flex flex-wrap items-center gap-0 border border-white/20">
        {(["pixel", "latent"] as const).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`px-6 py-3 text-[11px] uppercase tracking-widest border-r border-white/20 transition-colors ${
              mode === m ? "bg-white text-black" : "text-gray-500 hover:text-white hover:bg-white/5"
            }`}
          >
            {m === "pixel" ? "Espace Pixel" : "Espace Latent"}
          </button>
        ))}
        <div className="flex flex-wrap gap-0">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(selectedCategory === cat ? null : cat)}
              className={`px-4 py-3 text-[11px] uppercase tracking-widest border-r border-white/20 transition-colors ${
                selectedCategory === cat ? "bg-white text-black" : "text-gray-600 hover:text-white hover:bg-white/5"
              }`}
            >
              {CATEGORY_LABELS[cat]}
            </button>
          ))}
        </div>
        {selectedCategory && (
          <button
            onClick={() => setSelectedCategory(null)}
            className="px-4 py-3 text-[11px] uppercase tracking-widest text-gray-600 hover:text-white transition-colors"
          >
            ✕
          </button>
        )}
      </div>

      {/* Mode explainer */}
      <AnimatePresence mode="wait">
        <motion.div
          key={mode}
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className="border border-white/20 grid grid-cols-1 md:grid-cols-12"
        >
          <div className="md:col-span-2 p-4 border-b md:border-b-0 md:border-r border-white/20 flex items-center">
            <span className="section-label">[{mode === "pixel" ? " Pixel " : " Latent "}]</span>
          </div>
          <div className="md:col-span-10 p-4 text-sm text-gray-400">
            {mode === "pixel"
              ? "Espace pixel : les concepts sont distribués aléatoirement. Un chat et un chien peuvent être plus « proches » en pixels qu'un chat et un lion. Aucune structure sémantique."
              : "Espace latent JEPA : les concepts similaires se regroupent naturellement. La géométrie reflète la sémantique — un chat est proche d'un chien, une voiture d'un vélo."}
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Canvas */}
      <div className="relative">
        <ScatterPlot mode={mode} hoveredId={hoveredId} onHover={setHoveredId} selectedCategory={selectedCategory} />
        <AnimatePresence>
          {hoveredConcept && <ConceptTooltip concept={hoveredConcept} mode={mode} />}
        </AnimatePresence>

        {/* Axis labels */}
        <div className="absolute top-3 left-3 text-[10px] uppercase tracking-widest text-white/20">
          {mode === "pixel" ? "t-SNE · espace pixel" : "t-SNE · espace latent JEPA"}
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-x-6 gap-y-1">
        {categories.map((cat) => (
          <div key={cat} className="flex items-center gap-2 text-[11px] uppercase tracking-widest text-gray-600">
            <div className="w-2 h-2 bg-white" />
            {CATEGORY_LABELS[cat]}
          </div>
        ))}
      </div>

      {/* Distance comparison table */}
      <div className="border border-white/20 overflow-hidden">
        <div className="border-b border-white/20 p-4 bg-white/[0.02]">
          <span className="section-label">[ Distance sémantique vs pixel ]</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-white/10">
          {[
            { pair: "🐱 Chat ↔ 🐶 Chien",     pixel: "haute",    latent: "faible",   insight: "Même catégorie, structures visuelles différentes" },
            { pair: "🐱 Chat ↔ 🌸 Fleur",      pixel: "variable", latent: "haute",    insight: "Catégories différentes, bien séparées en latent" },
            { pair: "🚗 Voiture ↔ 🚲 Vélo",    pixel: "variable", latent: "faible",   insight: "Même concept (transport), proches en latent" },
            { pair: "🍕 Pizza ↔ 💻 Laptop",    pixel: "aléatoire",latent: "haute",    insight: "JEPA comprend qu'ils n'ont rien en commun" },
          ].map(({ pair, pixel, latent, insight }) => (
            <div key={pair} className="p-5 hover:bg-white/[0.02] transition-colors">
              <div className="text-sm text-white mb-3">{pair}</div>
              <div className="flex gap-6 text-[10px] uppercase tracking-widest">
                <div>
                  <div className="text-gray-600 mb-0.5">Pixel</div>
                  <div className="text-white/50">{pixel}</div>
                </div>
                <div>
                  <div className="text-gray-600 mb-0.5">Latent</div>
                  <div className="text-white">{latent}</div>
                </div>
              </div>
              <div className="text-[10px] text-gray-600 mt-2 italic">{insight}</div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
