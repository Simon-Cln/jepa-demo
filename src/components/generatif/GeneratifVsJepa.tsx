"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Pause, RotateCcw } from "lucide-react";
import { ArchitectureDiagram } from "./ArchitectureDiagram";
import { Math as Mx } from "@/components/Math";

// ─── Pixel prediction (generative side) ──────────────────────────────────────
function PixelGrid({ isPlaying }: { isPlaying: boolean }) {
  const COLS = 12;
  const ROWS = 8;
  const total = COLS * ROWS;
  const [revealed, setRevealed] = useState<number[]>([]);
  const [noise, setNoise] = useState<number[]>(() =>
    Array.from({ length: total }, () => Math.random())
  );

  useEffect(() => {
    if (!isPlaying) return;
    setRevealed([]);
    const interval = setInterval(() => {
      setRevealed((prev) => {
        if (prev.length >= total) { clearInterval(interval); return prev; }
        return [...prev, prev.length];
      });
    }, 60);
    return () => clearInterval(interval);
  }, [isPlaying, total]);

  useEffect(() => {
    if (!isPlaying) return;
    const t = setInterval(() => {
      setNoise(Array.from({ length: total }, () => Math.random()));
    }, 150);
    return () => clearInterval(t);
  }, [isPlaying, total]);

  const colors = ["#ef4444","#f97316","#eab308","#22c55e","#06b6d4","#3b82f6","#8b5cf6","#ec4899"];

  return (
    <div className="flex flex-col items-center gap-4">
      <div
        className="grid gap-0.5"
        style={{ gridTemplateColumns: `repeat(${COLS}, 1fr)`, background: "#111" }}
      >
        {Array.from({ length: total }, (_, i) => {
          const isRevealed = revealed.includes(i);
          const colorIdx = Math.floor(noise[i] * colors.length);
          return (
            <motion.div
              key={i}
              className="w-5 h-5"
              animate={{
                backgroundColor: isRevealed ? colors[colorIdx] : "#1a1a1a",
                opacity: isRevealed ? (noise[i] > 0.5 ? 1 : 0.6) : 0.2,
              }}
              transition={{ duration: 0.08 }}
            />
          );
        })}
      </div>

      <div className="flex items-center gap-2 text-xs">
        <div className="w-2 h-2 bg-white/40" />
        <span className="text-gray-500">
          {revealed.length}/{total} pixels prédits
          {revealed.length < total ? " — lent, bruité" : " — artefacts visibles"}
        </span>
      </div>

      <div className="text-[10px] uppercase tracking-widest text-gray-600 border border-white/10 px-3 py-1.5 flex items-center gap-2">
        <Mx>{"O(H \\times W)"}</Mx> prédictions · reconstruction coûteuse
      </div>
    </div>
  );
}

// ─── Latent prediction (JEPA side) ───────────────────────────────────────────
function LatentPrediction({ isPlaying }: { isPlaying: boolean }) {
  const [step, setStep] = useState(0);

  const steps = [
    { label: "Encodage",   formula: "x \\rightarrow s_x \\in \\mathbb{R}^d" },
    { label: "Masquage",   formula: "M \\subset \\{1,\\ldots,N\\}" },
    { label: "Prédiction", formula: "\\hat{s}_y = f_\\theta(s_x, \\text{pos}_M)" },
    { label: "Erreur",     formula: "\\|\\hat{s}_y - s_y\\|_2^2" },
  ];

  useEffect(() => {
    if (!isPlaying) { setStep(0); return; }
    const t = setInterval(() => setStep((s) => (s + 1) % steps.length), 900);
    return () => clearInterval(t);
  }, [isPlaying, steps.length]);

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Vector bars */}
      <div className="w-full border border-white/10 p-4 bg-white/[0.02]">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-[10px] uppercase tracking-widest text-gray-600">latent vector</span>
          <span className="text-gray-400 text-xs"><Mx>{"z \\in \\mathbb{R}^{768}"}</Mx></span>
        </div>
        <div className="flex items-end gap-0.5 h-12">
          {Array.from({ length: 32 }, (_, i) => {
            const val = Math.abs(Math.sin(i * 0.7 + step * 0.8)) * 0.8 + 0.1;
            return (
              <motion.div
                key={i}
                className="flex-1 bg-white"
                animate={{ height: `${step >= 1 ? val * 100 : 15}%`, opacity: step >= 1 ? 0.5 + val * 0.5 : 0.1 }}
                style={{ alignSelf: "flex-end" }}
                transition={{ duration: 0.3 }}
              />
            );
          })}
        </div>
      </div>

      {/* Steps */}
      <div className="w-full flex flex-col gap-1">
        {steps.map((s, i) => (
          <div
            key={i}
            className={`flex items-center gap-3 px-3 py-2 border transition-colors ${
              step === i ? "border-white/30 bg-white/5" : "border-transparent"
            }`}
          >
            <div
              className={`w-5 h-5 flex items-center justify-center text-[10px] font-bold border transition-colors ${
                step >= i ? "border-white bg-white text-black" : "border-white/20 text-white/30"
              }`}
            >
              {i + 1}
            </div>
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-white/80 mr-3">{s.label}</span>
              <span className="text-xs text-gray-400"><Mx>{s.formula}</Mx></span>
            </div>
          </div>
        ))}
      </div>

      <div className="text-[10px] uppercase tracking-widest text-gray-600 border border-white/10 px-3 py-1.5 flex items-center gap-2">
        <Mx>{"O(1)"}</Mx> prédiction · pas de reconstruction · sémantique
      </div>
    </div>
  );
}

// ─── Architecture diagram data  (viewBox 700 × 380) ─────────────────────────
const GENERATIVE_NODES = [
  { id: "img",  x: 75,  y: 190, label: "Image",    sublabel: "input",      color: "#888", size: "sm" as const },
  { id: "enc",  x: 220, y: 110, label: "Encoder",  sublabel: "CNN",        color: "#bbb" },
  { id: "z",    x: 360, y: 110, label: "z",        sublabel: "latent",     color: "#fff", size: "sm" as const },
  { id: "dec",  x: 500, y: 110, label: "Decoder",  sublabel: "↑upsample",  color: "#bbb" },
  { id: "px",   x: 610, y: 190, label: "Pixels",   sublabel: "H×W×3",     color: "#ef4444", size: "sm" as const },
  { id: "loss", x: 360, y: 290, label: "Pixel MSE",sublabel: "‖x̂ − x‖²",  color: "#ef4444" },
];
const GENERATIVE_EDGES = [
  { from: "img",  to: "enc" },
  { from: "enc",  to: "z",    label: "compress" },
  { from: "z",    to: "dec" },
  { from: "dec",  to: "px",   label: "reconstruct" },
  { from: "px",   to: "loss", dashed: true, color: "#ef4444" },
  { from: "img",  to: "loss", dashed: true, color: "#ef4444" },
];

const JEPA_NODES = [
  { id: "img",  x: 75,  y: 190, label: "Image",     sublabel: "input",   color: "#888", size: "sm" as const },
  { id: "ctx",  x: 240, y: 100, label: "s_x",       sublabel: "context", color: "#fff" },
  { id: "tgt",  x: 240, y: 290, label: "s_y",       sublabel: "target",  color: "#aaa" },
  { id: "pred", x: 430, y: 100, label: "Predictor", sublabel: "ŝ_y",     color: "#fff", size: "lg" as const },
  { id: "loss", x: 590, y: 190, label: "Latent MSE",sublabel: "‖ŝ_y − s_y‖²", color: "#22c55e" },
];
const JEPA_EDGES = [
  { from: "img",  to: "ctx",  label: "encode" },
  { from: "img",  to: "tgt",  label: "encode" },
  { from: "ctx",  to: "pred" },
  { from: "pred", to: "loss" },
  { from: "tgt",  to: "loss", dashed: true },
];

// ─── Main ─────────────────────────────────────────────────────────────────────
export function GeneratifVsJepa() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [animKey, setAnimKey] = useState(0);
  const [activeTab, setActiveTab] = useState<"animation" | "diagram">("animation");

  const reset = () => {
    setIsPlaying(false);
    setAnimKey((k) => k + 1);
    setTimeout(() => setIsPlaying(true), 50);
  };

  return (
    <div className="space-y-0">

      {/* Tab + controls bar */}
      <div className="flex items-center gap-0 border border-white/20 mb-8">
        {(["animation", "diagram"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-6 py-3 text-[11px] uppercase tracking-widest border-r border-white/20 transition-colors ${
              activeTab === tab ? "bg-white text-black" : "text-gray-500 hover:text-white hover:bg-white/5"
            }`}
          >
            {tab === "animation" ? "Animation" : "Architecture"}
          </button>
        ))}
        <button
          onClick={() => setIsPlaying((p) => !p)}
          className="px-6 py-3 text-[11px] uppercase tracking-widest border-r border-white/20 text-gray-500 hover:text-white hover:bg-white/5 transition-colors flex items-center gap-2"
        >
          {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
          {isPlaying ? "Pause" : "Lancer"}
        </button>
        <button
          onClick={reset}
          className="px-4 py-3 text-gray-500 hover:text-white hover:bg-white/5 transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === "animation" ? (
          <motion.div
            key="animation"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-px bg-white/20 border border-white/20"
          >
            {/* Generative */}
            <div className="bg-[#111] p-8">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-bold uppercase tracking-wider">Modèle Génératif</h3>
                <span className="text-[10px] uppercase tracking-widest text-gray-600">VAE / Diffusion</span>
              </div>
              <p className="text-xs text-gray-600 uppercase tracking-wide mb-6">
                Prédit chaque pixel — O(H×W)
              </p>
              <PixelGrid key={animKey} isPlaying={isPlaying} />
            </div>

            {/* JEPA */}
            <div className="bg-[#111] p-8">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-bold uppercase tracking-wider">JEPA</h3>
                <span className="text-[10px] uppercase tracking-widest text-gray-600">Joint Embedding</span>
              </div>
              <p className="text-xs text-gray-600 uppercase tracking-wide mb-6">
                Prédit dans l&apos;espace latent — O(1)
              </p>
              <LatentPrediction key={animKey} isPlaying={isPlaying} />
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="diagram"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-px bg-white/20 border border-white/20"
          >
            <div className="bg-[#111] p-8" style={{ minHeight: 480 }}>
              <ArchitectureDiagram
                nodes={GENERATIVE_NODES}
                edges={GENERATIVE_EDGES}
                title="Modèle Génératif (VAE)"
                subtitle="Encode → Décode → Pixel MSE"
                accentColor="#888888"
                animationKey={animKey}
              />
            </div>
            <div className="bg-[#111] p-8" style={{ minHeight: 480 }}>
              <ArchitectureDiagram
                nodes={JEPA_NODES}
                edges={JEPA_EDGES}
                title="I-JEPA"
                subtitle="Encode context → Predict target in latent space"
                accentColor="#ffffff"
                animationKey={animKey}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Insight callout */}
      <div className="border border-white/20 mt-8 grid grid-cols-1 md:grid-cols-12">
        <div className="md:col-span-2 p-6 border-b md:border-b-0 md:border-r border-white/20 flex items-start">
          <span className="section-label">[ Insight ]</span>
        </div>
        <div className="md:col-span-10 p-6 md:p-8">
          <p className="text-white/70 text-base leading-relaxed">
            Un modèle génératif doit reconstruire tous les détails non-pertinents — la texture exacte
            d'un mur, le bruit de fond. JEPA ne se soucie pas des pixels. Il prédit{" "}
            <em className="not-italic text-white font-semibold">ce que représente</em> la zone masquée.
            C'est la différence entre mémoriser et comprendre.
          </p>
        </div>
      </div>

      {/* Comparison table */}
      <div className="border border-white/20 mt-8 overflow-hidden">
        <div className="grid grid-cols-3 border-b border-white/20 bg-white/[0.03]">
          <div className="p-4 text-[10px] uppercase tracking-widest text-gray-600">Critère</div>
          <div className="p-4 text-[10px] uppercase tracking-widest text-gray-500 border-l border-white/20">Génératif</div>
          <div className="p-4 text-[10px] uppercase tracking-widest text-white border-l border-white/20">JEPA</div>
        </div>
        {[
          { criteria: "Espace de prédiction", gen: <><Mx>{"\\mathbb{R}^{H \\times W \\times 3}"}</Mx> pixels</>,             jepa: <><Mx>{"\\mathbb{R}^d"}</Mx> vecteurs latents</> },
          { criteria: "Coût computationnel",  gen: <><Mx>{"O(H \\times W)"}</Mx> par image</>,                               jepa: <><Mx>{"O(1)"}</Mx> — constant</> },
          { criteria: "Loss",                 gen: <Mx>{"\\|\\hat{x} - x\\|_2^2"}</Mx>,                                     jepa: <Mx>{"\\|\\hat{s}_y - s_y\\|_2^2"}</Mx> },
          { criteria: "Collapse",             gen: "Non — mais artefacts visuels",                                           jepa: "Via stop-gradient + EMA" },
          { criteria: "Transfer learning",    gen: "Moyen",                                                                  jepa: "Excellent (ViT backbone)" },
          { criteria: "Référence",            gen: "VAE (Kingma 2013)",                                                      jepa: "I-JEPA (Assran 2023)" },
        ].map(({ criteria, gen, jepa }, i) => (
          <div key={i} className="grid grid-cols-3 border-b border-white/10 hover:bg-white/[0.02] transition-colors last:border-b-0">
            <div className="p-4 text-xs text-gray-500 uppercase tracking-wide">{criteria}</div>
            <div className="p-4 text-xs text-gray-600 border-l border-white/10">{gen}</div>
            <div className="p-4 text-xs text-white/60 border-l border-white/10">{jepa}</div>
          </div>
        ))}
      </div>

    </div>
  );
}
