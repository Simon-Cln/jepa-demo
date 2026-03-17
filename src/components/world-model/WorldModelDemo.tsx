"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Pause, RotateCcw } from "lucide-react";
import {
  GRID_COLS, GRID_ROWS, START_POS, GOAL_POS,
  getGridCell, bfs, randomStep, posEq,
  type GridPos,
} from "@/lib/worldModelSim";

// ─── Grid Cell ────────────────────────────────────────────────────────────────
function GridCell({
  row, col, isAgent, isGoal, isStart, isWall, inPath, inImagined, isVisited,
}: {
  row: number; col: number;
  isAgent: boolean; isGoal: boolean; isStart: boolean; isWall: boolean;
  inPath: boolean; inImagined: boolean; isVisited: boolean;
}) {
  return (
    <div
      className="relative aspect-square flex items-center justify-center"
      style={{
        backgroundColor: isWall
          ? "#1a1a1a"
          : inImagined
          ? "rgba(255,255,255,0.08)"
          : inPath
          ? "rgba(255,255,255,0.04)"
          : isVisited
          ? "rgba(255,255,255,0.02)"
          : "transparent",
        border: "1px solid rgba(255,255,255,0.06)",
        transition: "background-color 0.15s",
      }}
    >
      {isGoal && (
        <motion.span
          className="text-sm z-10"
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >⭐</motion.span>
      )}
      {isStart && !isAgent && (
        <span className="text-[9px] text-white/20 uppercase tracking-widest">S</span>
      )}
      {inImagined && !isAgent && (
        <div className="absolute inset-0.5 border border-white/20 opacity-60" />
      )}
      {isAgent && (
        <motion.div
          className="w-3.5 h-3.5 bg-white z-20"
          animate={{ boxShadow: ["0 0 0 0 rgba(255,255,255,0.3)", "0 0 0 6px rgba(255,255,255,0)"] }}
          transition={{ duration: 1, repeat: Infinity }}
        />
      )}
    </div>
  );
}

// ─── Agent Panel ──────────────────────────────────────────────────────────────
type AgentType = "random" | "worldmodel";

function AgentPanel({
  type, agentPos, path, imagined, steps, reached, visitedCells,
}: {
  type: AgentType;
  agentPos: GridPos;
  path: GridPos[];
  imagined: GridPos[];
  steps: number;
  reached: boolean;
  visitedCells: Set<string>;
}) {
  const isWM = type === "worldmodel";

  return (
    <div className="border border-white/20 bg-[#111]">
      {/* Header */}
      <div className="border-b border-white/20 p-5 flex items-center justify-between">
        <div>
          <h3 className="text-xs font-bold uppercase tracking-widest text-white">
            {isWM ? "Agent World Model" : "Agent Aléatoire"}
          </h3>
          <p className="text-[10px] uppercase tracking-widest text-gray-600 mt-0.5">
            {isWM ? "BFS + simulation mentale" : "Random walk"}
          </p>
        </div>
        <div className="text-right">
          {reached ? (
            <span className="text-[10px] uppercase tracking-widest text-white">✓ {steps} étapes</span>
          ) : (
            <span className="text-[10px] uppercase tracking-widest text-gray-600">{steps} étapes</span>
          )}
        </div>
      </div>

      {/* Grid */}
      <div className="p-5 relative">
        {/* Thought bubble */}
        {isWM && imagined.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="absolute top-2 right-5 border border-white/20 bg-[#111] px-3 py-1.5 text-[10px] uppercase tracking-widest text-white z-20"
          >
            ◎ Simulation : {imagined.length} étapes
          </motion.div>
        )}
        <div
          className="grid"
          style={{
            gridTemplateColumns: `repeat(${GRID_COLS}, 1fr)`,
            gap: 1,
            backgroundColor: "#111",
          }}
        >
          {Array.from({ length: GRID_ROWS }, (_, row) =>
            Array.from({ length: GRID_COLS }, (_, col) => {
              const cell = getGridCell(row, col);
              const pos = { row, col };
              return (
                <GridCell
                  key={`${row},${col}`}
                  row={row} col={col}
                  isAgent={posEq(agentPos, pos)}
                  isGoal={cell === "goal"}
                  isStart={cell === "start"}
                  isWall={cell === "wall"}
                  inPath={path.some((p) => posEq(p, pos))}
                  inImagined={isWM && imagined.some((p) => posEq(p, pos))}
                  isVisited={visitedCells.has(`${row},${col}`)}
                />
              );
            })
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="border-t border-white/20 grid grid-cols-2 divide-x divide-white/20">
        <div className="p-4">
          <div className="text-[10px] uppercase tracking-widest text-gray-600 mb-1">Cellules visitées</div>
          <div className="text-sm font-bold text-white">{visitedCells.size}</div>
        </div>
        <div className="p-4">
          <div className="text-[10px] uppercase tracking-widest text-gray-600 mb-1">Efficacité</div>
          <div className="text-sm font-bold text-white">
            {reached ? (isWM ? "Optimal" : "Aléatoire") : "En cours..."}
          </div>
        </div>
      </div>

      {/* Strategy */}
      <div className="border-t border-white/20 p-4">
        <p className="text-xs text-gray-600 leading-relaxed">
          {isWM
            ? "BFS dans le world model interne → action optimale à chaque étape. Visualise mentalement l'avenir avant d'agir."
            : "Choisit aléatoirement parmi les voisins accessibles. Aucune planification, aucun modèle interne."}
        </p>
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
const TICK_MS = 300;

export function WorldModelDemo() {
  const [rPos, setRPos] = useState<GridPos>(START_POS);
  const [rSteps, setRSteps] = useState(0);
  const [rReached, setRReached] = useState(false);
  const [rVisited, setRVisited] = useState<Set<string>>(new Set(["1,1"]));

  const [wmPos, setWmPos] = useState<GridPos>(START_POS);
  const [wmPath] = useState<GridPos[]>(() => bfs(START_POS, GOAL_POS));
  const [wmSteps, setWmSteps] = useState(0);
  const [wmReached, setWmReached] = useState(false);
  const [wmPathIdx, setWmPathIdx] = useState(1);
  const [wmImagined, setWmImagined] = useState<GridPos[]>([]);
  const [wmVisited, setWmVisited] = useState<Set<string>>(new Set(["1,1"]));

  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const reset = useCallback(() => {
    setIsPlaying(false);
    setRPos(START_POS); setRSteps(0); setRReached(false); setRVisited(new Set(["1,1"]));
    setWmPos(START_POS); setWmSteps(0); setWmReached(false); setWmPathIdx(1);
    setWmImagined([]); setWmVisited(new Set(["1,1"]));
  }, []);

  const triggerImagination = useCallback((idx: number, path: GridPos[]) => {
    setWmImagined(path.slice(idx, idx + 4));
    setTimeout(() => setWmImagined([]), TICK_MS * 0.8);
  }, []);

  useEffect(() => {
    if (!isPlaying) { if (tickRef.current) clearInterval(tickRef.current); return; }
    if (rReached && wmReached) { setIsPlaying(false); return; }

    tickRef.current = setInterval(() => {
      setRPos((prev) => {
        if (rReached) return prev;
        const next = randomStep(prev);
        setRVisited((v) => new Set([...v, `${next.row},${next.col}`]));
        setRSteps((s) => s + 1);
        if (posEq(next, GOAL_POS)) setRReached(true);
        return next;
      });
      setWmPathIdx((idx) => {
        if (wmReached || idx >= wmPath.length) return idx;
        const nextPos = wmPath[idx];
        setWmPos(nextPos);
        setWmVisited((v) => new Set([...v, `${nextPos.row},${nextPos.col}`]));
        setWmSteps((s) => s + 1);
        if (posEq(nextPos, GOAL_POS)) setWmReached(true);
        triggerImagination(idx + 1, wmPath);
        return idx + 1;
      });
    }, TICK_MS / speed);

    return () => { if (tickRef.current) clearInterval(tickRef.current); };
  }, [isPlaying, rReached, wmReached, wmPath, speed, triggerImagination]);

  const optimalLen = wmPath.length - 1;

  return (
    <div className="space-y-8">

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-0 border border-white/20">
        <button
          onClick={() => setIsPlaying((p) => !p)}
          disabled={rReached && wmReached}
          className="px-6 py-3 text-[11px] uppercase tracking-widest border-r border-white/20 text-gray-500 hover:text-white hover:bg-white/5 disabled:opacity-30 transition-colors flex items-center gap-2"
        >
          {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
          {isPlaying ? "Pause" : (rReached && wmReached ? "Terminé" : "Lancer")}
        </button>
        <button
          onClick={reset}
          className="px-4 py-3 border-r border-white/20 text-gray-500 hover:text-white hover:bg-white/5 transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>

        {/* Speed */}
        <div className="flex border-r border-white/20">
          {[0.5, 1, 2, 3].map((s) => (
            <button
              key={s}
              onClick={() => setSpeed(s)}
              className={`px-4 py-3 text-[11px] uppercase tracking-widest transition-colors ${
                speed === s ? "bg-white text-black" : "text-gray-600 hover:text-white hover:bg-white/5"
              }`}
            >
              {s}×
            </button>
          ))}
        </div>

        {/* Result badge */}
        <AnimatePresence>
          {wmReached && rReached && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="ml-auto px-5 py-3 text-[11px] uppercase tracking-widest text-white border-l border-white/20"
            >
              World Model : {optimalLen} étapes · Aléatoire : {rSteps} étapes ·{" "}
              <span className="text-white/60">{(rSteps / optimalLen).toFixed(1)}× plus efficace</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Agent grids */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-px bg-white/20">
        <AgentPanel type="random"     agentPos={rPos}  path={[]}     imagined={[]}        steps={rSteps}  reached={rReached}  visitedCells={rVisited} />
        <AgentPanel type="worldmodel" agentPos={wmPos} path={wmPath} imagined={wmImagined} steps={wmSteps} reached={wmReached} visitedCells={wmVisited} />
      </div>

      {/* Callout */}
      <div className="border border-white/20 grid grid-cols-1 md:grid-cols-12">
        <div className="md:col-span-2 p-6 border-b md:border-b-0 md:border-r border-white/20 flex items-start">
          <span className="section-label">[ World Model ]</span>
        </div>
        <div className="md:col-span-10 p-6 md:p-8">
          <p className="text-white/70 text-base leading-relaxed">
            L&apos;agent ne se contente pas d&apos;explorer — il{" "}
            <em className="not-italic text-white font-semibold">simule mentalement</em> les
            conséquences de ses actions via son world model avant d&apos;agir. LeCun argumente que
            c&apos;est exactement ainsi que fonctionne l&apos;intelligence animale et humaine.
          </p>
        </div>
      </div>

      {/* JEPA → World Model link */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-white/20 border border-white/20">
        {[
          { num: "01", title: "Perception",  desc: "JEPA encode l'état du monde en représentations latentes compactes." },
          { num: "02", title: "Prédiction",  desc: "Le predictor imagine les états futurs dans l'espace latent — sans reconstruction." },
          { num: "03", title: "Action",      desc: "L'agent choisit l'action qui minimise la distance au but dans l'espace latent." },
        ].map(({ num, title, desc }) => (
          <div key={num} className="bg-[#111] p-8 group hover:bg-white/5 transition-colors">
            <div className="flex justify-between items-start mb-6">
              <span className="text-xs border border-white/20 px-2 py-1">{num}</span>
              <span aria-hidden className="text-xl group-hover:rotate-45 transition-transform duration-300">↗</span>
            </div>
            <h4 className="text-base font-bold uppercase tracking-tight mb-3">{title}</h4>
            <p className="text-gray-500 text-sm leading-relaxed">{desc}</p>
          </div>
        ))}
      </div>

    </div>
  );
}
