"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Eraser, RefreshCw, Play } from "lucide-react";
import { Math as Mx } from "@/components/Math";

const COLS = 14;
const ROWS = 10;
const TOTAL = COLS * ROWS;

type Category = "sky" | "building" | "tree" | "ground" | "window" | "door";

const PATCH_COLORS: Record<Category, { bg: string; label: string }> = {
  sky:      { bg: "#1e3a5f", label: "Ciel" },
  building: { bg: "#374151", label: "Bâtiment" },
  tree:     { bg: "#14532d", label: "Arbre" },
  ground:   { bg: "#713f12", label: "Sol" },
  window:   { bg: "#1e40af", label: "Fenêtre" },
  door:     { bg: "#7c2d12", label: "Porte" },
};

function generateScene(): Category[] {
  const scene: Category[] = Array(TOTAL).fill("sky");
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      const idx = row * COLS + col;
      if (row >= 7) scene[idx] = "ground";
      else if (row >= 3 && col >= 3 && col <= 10) {
        if (row >= 5 && col >= 5 && col <= 7) scene[idx] = row === 7 ? "door" : "window";
        else scene[idx] = "building";
      } else if (row >= 5 && (col <= 2 || col >= 11)) scene[idx] = "tree";
    }
  }
  return scene;
}
const SCENE = generateScene();

function LatentVector({ category, animated }: { category: Category; animated: boolean }) {
  const seed = category.charCodeAt(0);
  const values = Array.from({ length: 16 }, (_, i) =>
    Math.abs(Math.sin(seed * 0.3 + i * 0.7)) * 0.8 + 0.1
  );
  return (
    <div className="flex flex-col gap-1">
      <span className="text-gray-500 text-xs">
        <Mx>{`z_{\\text{${category}}} \\in \\mathbb{R}^{16}`}</Mx>
      </span>
      <div className="flex items-end gap-0.5 h-8">
        {values.map((v, i) => (
          <motion.div
            key={i}
            className="flex-1 bg-white"
            initial={{ height: 0, opacity: 0 }}
            animate={animated ? { height: `${v * 100}%`, opacity: 0.4 + v * 0.6 } : { height: 0, opacity: 0 }}
            style={{ alignSelf: "flex-end" }}
            transition={{ delay: i * 0.04, duration: 0.3 }}
          />
        ))}
      </div>
    </div>
  );
}

export function MaskingDemo() {
  const [maskedIndices, setMaskedIndices] = useState<Set<number>>(new Set());
  const [isDragging, setIsDragging] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [predicted, setPredicted] = useState<Set<number>>(new Set());
  const [mode, setMode] = useState<"mask" | "unmask">("mask");
  const dragStartMask = useRef(false);

  const togglePatch = useCallback((idx: number) => {
    setMaskedIndices((prev) => {
      const next = new Set(prev);
      if (dragStartMask.current) next.add(idx);
      else next.delete(idx);
      return next;
    });
    setPredicted(new Set());
  }, []);

  const handleMouseDown = (idx: number) => {
    dragStartMask.current = mode === "mask" ? !maskedIndices.has(idx) : false;
    setIsDragging(true);
    togglePatch(idx);
  };

  const handleMouseEnter = (idx: number) => { if (isDragging) togglePatch(idx); };

  useEffect(() => {
    const up = () => setIsDragging(false);
    window.addEventListener("mouseup", up);
    return () => window.removeEventListener("mouseup", up);
  }, []);

  const runPrediction = () => {
    if (maskedIndices.size === 0) return;
    setIsRunning(true);
    setPredicted(new Set());
    const indices = [...maskedIndices];
    indices.forEach((idx, i) => {
      setTimeout(() => {
        setPredicted((prev) => new Set([...prev, idx]));
        if (i === indices.length - 1) setIsRunning(false);
      }, (i + 1) * 200);
    });
  };

  const reset = () => { setMaskedIndices(new Set()); setPredicted(new Set()); setIsRunning(false); };
  const maskRatio = Math.round((maskedIndices.size / TOTAL) * 100);
  const maskedCategories = [...new Set([...maskedIndices].map((i) => SCENE[i]))];

  return (
    <div className="space-y-8">

      {/* Controls bar */}
      <div className="flex flex-wrap items-center gap-0 border border-white/20">
        {(["mask", "unmask"] as const).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`px-5 py-3 text-[11px] uppercase tracking-widest border-r border-white/20 transition-colors ${
              mode === m ? "bg-white text-black" : "text-gray-500 hover:text-white hover:bg-white/5"
            }`}
          >
            {m === "mask" ? "Masquer" : "Démasquer"}
          </button>
        ))}
        <button
          onClick={() => {
            const r = new Set<number>();
            while (r.size < Math.floor(TOTAL * 0.4)) r.add(Math.floor(Math.random() * TOTAL));
            setMaskedIndices(r);
            setPredicted(new Set());
          }}
          className="px-5 py-3 text-[11px] uppercase tracking-widest border-r border-white/20 text-gray-500 hover:text-white hover:bg-white/5 transition-colors flex items-center gap-2"
        >
          <Eraser className="w-3.5 h-3.5" />
          Aléatoire 40%
        </button>
        <button
          onClick={reset}
          className="px-4 py-3 border-r border-white/20 text-gray-500 hover:text-white hover:bg-white/5 transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={runPrediction}
          disabled={maskedIndices.size === 0 || isRunning}
          className="ml-auto px-6 py-3 text-[11px] uppercase tracking-widest bg-white text-black hover:bg-white/85 disabled:opacity-30 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
        >
          <Play className="w-3.5 h-3.5" />
          {isRunning ? "Prédiction..." : "Lancer JEPA"}
        </button>
      </div>

      {/* Stats bar */}
      <div className="flex items-center gap-4 text-[11px] uppercase tracking-widest text-gray-600">
        <span>Masqués : <span className="text-white">{maskedIndices.size}/{TOTAL}</span></span>
        <div className="flex-1 h-px bg-white/10 relative overflow-hidden">
          <motion.div
            className="absolute left-0 top-0 h-full bg-white"
            animate={{ width: `${maskRatio}%` }}
            transition={{ duration: 0.2 }}
          />
        </div>
        <span>{maskRatio}%</span>
        {maskRatio > 75 && <span className="text-white/40">— I-JEPA max ~75%</span>}
      </div>

      {/* Grid + prediction panel */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-px bg-white/20 border border-white/20">

        {/* Image grid */}
        <div className="bg-[#111] p-6 space-y-3">
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-[10px] uppercase tracking-widest text-gray-600 mb-2">
            {(Object.entries(PATCH_COLORS) as [Category, typeof PATCH_COLORS[Category]][]).map(([cat, { bg, label }]) => (
              <div key={cat} className="flex items-center gap-1.5">
                <div className="w-2 h-2" style={{ backgroundColor: bg }} />
                {label}
              </div>
            ))}
          </div>

          <div
            className="grid select-none cursor-crosshair"
            style={{ gridTemplateColumns: `repeat(${COLS}, 1fr)`, gap: 1, backgroundColor: "#111" }}
            onMouseLeave={() => setIsDragging(false)}
          >
            {SCENE.map((category, idx) => {
              const isMasked = maskedIndices.has(idx);
              const isPredicted = predicted.has(idx);
              return (
                <motion.div
                  key={idx}
                  className="relative aspect-square"
                  style={{ backgroundColor: isMasked ? "#050505" : PATCH_COLORS[category].bg }}
                  animate={{ opacity: isMasked ? 0.15 : 1 }}
                  transition={{ duration: 0.1 }}
                  onMouseDown={() => handleMouseDown(idx)}
                  onMouseEnter={() => handleMouseEnter(idx)}
                >
                  {isPredicted && (
                    <motion.div
                      className="absolute inset-0"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      style={{ boxShadow: "inset 0 0 0 1.5px rgba(255,255,255,0.6)", backgroundColor: "rgba(255,255,255,0.08)" }}
                    />
                  )}
                </motion.div>
              );
            })}
          </div>

          <div className="flex items-center gap-6 text-[10px] uppercase tracking-widest text-gray-600">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 bg-[#111] border border-white/20" />
              Masqué
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 border border-white/50 bg-white/10" />
              Représentation prédite
            </div>
            <div className="ml-auto">I-JEPA · Assran et al. 2023</div>
          </div>
        </div>

        {/* Prediction panel */}
        <div className="bg-[#111] p-6 space-y-5 border-t lg:border-t-0 lg:border-l border-white/20">
          <div>
            <span className="section-label block mb-3">[ Prédiction Latente ]</span>
            <p className="text-xs text-gray-600 leading-relaxed">
              Le modèle prédit le <em className="not-italic text-white">vecteur latent</em> de chaque
              patch masqué — jamais les pixels.
            </p>
          </div>

          {maskedIndices.size === 0 ? (
            <p className="text-xs text-gray-600 italic py-4">Masquez des patches...</p>
          ) : (
            <div className="space-y-4">
              {maskedCategories.map((cat) => (
                <div key={cat} className="flex items-center gap-3">
                  <div className="w-4 h-4 shrink-0" style={{ backgroundColor: PATCH_COLORS[cat].bg }} />
                  <div className="flex-1">
                    <LatentVector
                      category={cat}
                      animated={isRunning || predicted.has([...maskedIndices].find((i) => SCENE[i] === cat) ?? -1)}
                    />
                  </div>
                  <AnimatePresence>
                    {predicted.has([...maskedIndices].find((i) => SCENE[i] === cat) ?? -1) && (
                      <motion.span
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-[10px] uppercase tracking-widest text-white shrink-0"
                      >
                        ✓
                      </motion.span>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>
          )}

          {/* Pipeline */}
          {maskedIndices.size > 0 && (
            <div className="border-t border-white/10 pt-4 space-y-2">
              <span className="section-label block mb-2">[ Pipeline ]</span>
              {[
                { step: "Context Encoder", formula: `${TOTAL - maskedIndices.size}\\text{ patches} \\rightarrow z_{ctx}` },
                { step: "Predictor",       formula: "z_{ctx} + pos_M \\rightarrow \\hat{z}_{target}" },
                { step: "Loss (train)",    formula: "\\|\\hat{z}_{target} - z_{target}\\|_2^2" },
              ].map(({ step, formula }) => (
                <div key={step} className="flex items-start gap-2 text-xs">
                  <div className="w-1 h-1 bg-white/30 mt-1.5 shrink-0" />
                  <div>
                    <span className="text-white/60 font-semibold uppercase tracking-wide text-[10px]">{step}</span>
                    <span className="text-gray-500 ml-2"><Mx>{formula}</Mx></span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 3-col technical breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-white/20 border border-white/20">
        {[
          { num: "01", title: "Context Encoder", detail: "Encode les patches visibles via un ViT. Stop-gradient pour éviter le collapse de représentations." },
          { num: "02", title: "Target Encoder",  detail: "EMA (Exponential Moving Average) du context encoder. Génère des cibles stables sans supervision." },
          { num: "03", title: "Predictor",        detail: "Petit réseau qui prédit les représentations cibles depuis le contexte et les positions masquées." },
        ].map(({ num, title, detail }) => (
          <div key={num} className="bg-[#111] p-8 group hover:bg-white/5 transition-colors">
            <div className="flex justify-between items-start mb-6">
              <span className="text-xs border border-white/20 px-2 py-1">{num}</span>
              <span aria-hidden className="text-xl group-hover:rotate-45 transition-transform duration-300">↗</span>
            </div>
            <h4 className="text-base font-bold uppercase tracking-tight mb-3">{title}</h4>
            <p className="text-gray-500 text-sm leading-relaxed">{detail}</p>
          </div>
        ))}
      </div>

    </div>
  );
}
