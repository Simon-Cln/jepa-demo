"use client"

import dynamic from "next/dynamic"
import { useSimulation } from "@/components/robotique/useSimulation"
import { AGENT_DEFS } from "@/lib/robotique/types"
import { SCENARIOS } from "@/lib/robotique/gridMaps"

const RoboticScene = dynamic(() => import("@/components/robotique/RoboticScene"), { ssr: false })

const AGENT_TECH_CARDS = [
  {
    id: "reactive",
    title: "Réactif",
    color: "#ef4444",
    tag: "Règles",
    body: "Aucune mémoire, aucun modèle interne. À chaque pas, choisit la direction qui minimise la distance de Manhattan vers le but. Simple et rapide, mais bloqué par tout obstacle en ligne directe.",
  },
  {
    id: "astar",
    title: "A*",
    color: "#3b82f6",
    tag: "Planification",
    body: "Trouve le chemin optimal via heuristique admissible h = Manhattan. Replanifie dès qu'un obstacle bloque le chemin courant. Garantit l'optimalité mais ne peut pas anticiper les obstacles futurs.",
  },
  {
    id: "qlearning",
    title: "Q-Learning",
    color: "#22c55e",
    tag: "RL Model-Free",
    body: "Apprend une table Q(s,a) par essais-erreurs en temps réel. Epsilon-greedy pour l'exploration. Commence aléatoire, converge progressivement vers une bonne politique au fil des épisodes.",
  },
  {
    id: "worldmodel",
    title: "World Model",
    color: "#8b5cf6",
    tag: "JEPA-Inspired",
    body: "Construit un modèle de transition interne T(s,a)→s'. Planifie via BFS sur ce modèle avant d'agir. Analogue à l'architecture JEPA : prédire dans l'espace latent plutôt que réagir.",
  },
  {
    id: "mcts",
    title: "MCTS",
    color: "#f59e0b",
    tag: "Monte Carlo",
    body: "Simule 40 trajectoires aléatoires depuis la position courante. Sélectionne l'action par UCB pour équilibrer exploitation et exploration. Robuste mais coûteux en calcul.",
  },
]

export default function RobotiquePage() {
  const {
    grid,
    positions,
    metrics,
    running,
    speed,
    scenarioIdx,
    dynamicSpawned,
    setRunning,
    setSpeed,
    reset,
    changeScenario,
    spawnDynamicObstacles,
  } = useSimulation()

  const allDone = AGENT_DEFS.every(a => metrics[a.id]?.done)

  return (
    <div className="bg-[#111] text-white min-h-screen">

      {/* ── Section Header ─────────────────────────────────────────────────── */}
      <section className="border-b border-white/20 px-4 sm:px-8 md:px-16 pt-16 pb-14">
        <span className="section-label block mb-10">[ 05 — Simulation Multi-Agents ]</span>
        <div className="grid grid-cols-1 md:grid-cols-12 items-end gap-8">
          <div className="md:col-span-6">
            <h1
              style={{
                fontSize: "clamp(2.5rem,6vw,5.5rem)",
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "-0.03em",
                lineHeight: 0.92,
              }}
            >
              Robotique
            </h1>
          </div>
          <div className="md:col-span-6 md:pl-8 pb-1">
            <p className="text-gray-400 text-base leading-relaxed max-w-lg">
              Cinq agents naviguent le même labyrinthe simultanément. Réactif, A*, Q-Learning,{" "}
              <em className="not-italic text-white">World Model</em> et MCTS — observez comment
              chaque paradigme se comporte face aux obstacles statiques et dynamiques.
            </p>
          </div>
        </div>
      </section>

      {/* ── Main body ──────────────────────────────────────────────────────── */}
      <section className="px-4 sm:px-8 md:px-16 py-10">
        <div className="flex flex-col lg:flex-row gap-0 border border-white/20">

          {/* ── 3D Canvas ─────────────────────────────────────────────────── */}
          <div
            className="lg:w-[65%] border-b lg:border-b-0 lg:border-r border-white/20"
            style={{ minHeight: 520 }}
          >
            <RoboticScene grid={grid} positions={positions} metrics={metrics} />
          </div>

          {/* ── Controls Panel ────────────────────────────────────────────── */}
          <div className="lg:w-[35%] flex flex-col">

            {/* Scenarios */}
            <div className="border-b border-white/20 p-6">
              <span className="section-label block mb-4">[ Scénario ]</span>
              <div className="flex flex-col gap-2">
                {SCENARIOS.map((sc, idx) => (
                  <button
                    key={sc.id}
                    onClick={() => changeScenario(idx)}
                    className={`w-full text-left px-4 py-3 border text-xs uppercase tracking-widest transition-colors ${
                      scenarioIdx === idx
                        ? "border-white bg-white text-black"
                        : "border-white/20 text-gray-400 hover:border-white/50 hover:text-white"
                    }`}
                  >
                    <span className="text-white/40 mr-2">
                      {String(idx + 1).padStart(2, "0")} —
                    </span>
                    {sc.label}
                    {sc.dynamicObstacles.length > 0 && (
                      <span className="ml-2 text-[10px] border border-yellow-400/40 text-yellow-400 px-1">
                        Dynamique
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Speed Slider */}
            <div className="border-b border-white/20 p-6">
              <span className="section-label block mb-4">
                [ Vitesse — {speed} ms/step ]
              </span>
              <input
                type="range"
                min={50}
                max={600}
                step={10}
                value={speed}
                onChange={e => setSpeed(Number(e.target.value))}
                className="w-full accent-white cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-white/30 mt-1 uppercase tracking-widest">
                <span>Rapide</span>
                <span>Lent</span>
              </div>
            </div>

            {/* Play / Pause / Reset */}
            <div className="border-b border-white/20 p-6 flex flex-col gap-3">
              <span className="section-label block mb-1">[ Contrôles ]</span>
              <div className="flex gap-3">
                <button
                  onClick={() => setRunning(!running)}
                  disabled={allDone}
                  className={`flex-1 px-4 py-3 border text-xs uppercase tracking-widest transition-colors ${
                    running
                      ? "border-white bg-white text-black hover:bg-white/80"
                      : allDone
                        ? "border-white/20 text-white/20 cursor-not-allowed"
                        : "border-white text-white hover:bg-white/10"
                  }`}
                >
                  {running ? "Pause" : allDone ? "Terminé" : "Play"}
                </button>
                <button
                  onClick={reset}
                  className="flex-1 px-4 py-3 border border-white/30 text-xs uppercase tracking-widest text-gray-400 hover:border-white hover:text-white transition-colors"
                >
                  Reset
                </button>
              </div>

              {/* Dynamic obstacle button (only scenario 3) */}
              {SCENARIOS[scenarioIdx].dynamicObstacles.length > 0 && (
                <button
                  onClick={spawnDynamicObstacles}
                  disabled={dynamicSpawned}
                  className={`w-full px-4 py-3 border text-xs uppercase tracking-widest transition-colors ${
                    dynamicSpawned
                      ? "border-yellow-400/20 text-yellow-400/30 cursor-not-allowed"
                      : "border-yellow-400/60 text-yellow-400 hover:border-yellow-400 hover:bg-yellow-400/5"
                  }`}
                >
                  {dynamicSpawned ? "Obstacle spawné ✓" : "Spawner obstacle"}
                </button>
              )}
            </div>

            {/* Agent Legend */}
            <div className="p-6 flex-1">
              <span className="section-label block mb-4">[ Agents ]</span>
              <div className="flex flex-col gap-2">
                {AGENT_DEFS.map(agent => (
                  <div
                    key={agent.id}
                    className="flex items-center gap-3 py-2 border-b border-white/10 last:border-0"
                  >
                    <span
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{ background: agent.color, boxShadow: `0 0 6px ${agent.color}` }}
                    />
                    <span className="text-xs font-bold uppercase tracking-wider text-white w-24 shrink-0">
                      {agent.name}
                    </span>
                    <span className="text-[11px] text-gray-500 leading-tight">
                      {agent.desc}
                    </span>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── Metrics Table ──────────────────────────────────────────────────── */}
      <section className="px-4 sm:px-8 md:px-16 pb-10">
        <div className="border border-white/20">
          <div className="border-b border-white/20 px-6 py-4">
            <span className="section-label">[ Métriques en temps réel ]</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/20 text-left">
                  <th className="px-6 py-4 text-[11px] uppercase tracking-widest text-gray-500 font-normal w-[220px]">
                    Agent
                  </th>
                  <th className="px-6 py-4 text-[11px] uppercase tracking-widest text-gray-500 font-normal text-right">
                    Steps
                  </th>
                  <th className="px-6 py-4 text-[11px] uppercase tracking-widest text-gray-500 font-normal text-right">
                    Collisions
                  </th>
                  <th className="px-6 py-4 text-[11px] uppercase tracking-widest text-gray-500 font-normal text-right">
                    Replans
                  </th>
                  <th className="px-6 py-4 text-[11px] uppercase tracking-widest text-gray-500 font-normal text-center">
                    Statut
                  </th>
                </tr>
              </thead>
              <tbody>
                {AGENT_DEFS.map((agent, i) => {
                  const m = metrics[agent.id] ?? { steps: 0, collisions: 0, replans: 0, done: false }
                  return (
                    <tr
                      key={agent.id}
                      className={`border-b border-white/10 last:border-0 transition-colors ${
                        m.done ? "bg-white/[0.02]" : "hover:bg-white/[0.015]"
                      }`}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <span
                            className="w-2.5 h-2.5 rounded-full shrink-0"
                            style={{ background: agent.color, boxShadow: `0 0 5px ${agent.color}` }}
                          />
                          <span className="font-bold uppercase tracking-wide text-xs">
                            {agent.name}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right font-mono text-white/70">
                        {m.steps}
                      </td>
                      <td className="px-6 py-4 text-right font-mono">
                        <span className={m.collisions > 0 ? "text-red-400" : "text-white/40"}>
                          {m.collisions}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right font-mono">
                        <span className={m.replans > 0 ? "text-yellow-400" : "text-white/40"}>
                          {m.replans}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        {m.done ? (
                          <span className="text-[11px] border border-green-400/50 text-green-400 px-2 py-0.5 uppercase tracking-widest">
                            Arrivé
                          </span>
                        ) : m.steps > 0 ? (
                          <span
                            className="inline-block w-1.5 h-1.5 rounded-full animate-pulse"
                            style={{ background: agent.color }}
                          />
                        ) : (
                          <span className="text-white/20 text-[11px] uppercase tracking-widest">
                            En attente
                          </span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ── Agent Technique Cards ──────────────────────────────────────────── */}
      <section className="px-4 sm:px-8 md:px-16 pb-20">
        <div className="border-b border-white/20 pb-6 mb-8">
          <span className="section-label">[ Architecture des Agents ]</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-px bg-white/10 border border-white/20">
          {AGENT_TECH_CARDS.map(card => (
            <div
              key={card.id}
              className="bg-[#111] p-6 flex flex-col gap-4 hover:bg-white/[0.03] transition-colors"
            >
              <div className="flex items-center justify-between">
                <span
                  className="w-3 h-3 rounded-full"
                  style={{ background: card.color, boxShadow: `0 0 8px ${card.color}` }}
                />
                <span
                  className="text-[10px] border px-2 py-0.5 uppercase tracking-widest"
                  style={{ borderColor: `${card.color}40`, color: card.color }}
                >
                  {card.tag}
                </span>
              </div>
              <h3 className="text-lg font-bold uppercase tracking-tight">{card.title}</h3>
              <p className="text-gray-500 text-xs leading-relaxed flex-1">{card.body}</p>
            </div>
          ))}
        </div>
      </section>

    </div>
  )
}
