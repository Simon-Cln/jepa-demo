"use client"

import { useState, useEffect, useRef } from "react"

const METHODS = [
  { id: "ijepa",  name: "I-JEPA",  type: "Prédictif latent",  color: "#8b5cf6" },
  { id: "mae",    name: "MAE",     type: "Génératif pixels",  color: "#3b82f6" },
  { id: "dino",   name: "DINO",    type: "Distillation",      color: "#22c55e" },
  { id: "simclr", name: "SimCLR",  type: "Contrastif",        color: "#ef4444" },
]

interface EpochData {
  epoch: number
  total_epochs?: number
  train_loss?: number
  train_acc?: number
  test_acc?: number
  phase: string
  msg?: string
  done?: boolean
}

interface MethodState {
  status: "idle" | "running" | "done" | "error"
  epochs: EpochData[]
  lastTestAcc: number | null
}

const API_BASE = "http://localhost:8000"

// Visual panel shown when a method has completed training
function SampleVisuals({ methodId, methodName, color, trainingDone }: { methodId: string; methodName: string; color: string; trainingDone: boolean }) {
  const [visuals, setVisuals] = useState<Array<{
    image_b64: string;
    attention_b64: string | null;
    true_label: string;
    predictions: Array<{ class: string; confidence: number }>;
    correct: boolean;
  }>>([]);
  const [selected, setSelected] = useState(0);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!trainingDone) return;
    fetch(`http://localhost:8000/api/visuals/${methodId}`)
      .then(r => r.json())
      .then(d => {
        if (d.visuals?.length > 0) { setVisuals(d.visuals); setLoaded(true); }
      })
      .catch(() => {});
  }, [methodId, trainingDone]);

  if (!loaded || visuals.length === 0) return null;

  const v = visuals[selected];

  return (
    <div className="border border-white/20 p-6 space-y-4">
      <div className="flex items-center gap-3">
        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
        <span className="text-[11px] uppercase tracking-widest font-bold">{methodName} — Exemples</span>
      </div>

      {/* Thumbnail strip */}
      <div className="flex gap-2 flex-wrap">
        {visuals.map((vi, i) => (
          <button
            key={i}
            onClick={() => setSelected(i)}
            className={`relative border-2 transition-colors ${i === selected ? 'border-white' : 'border-white/20 hover:border-white/40'}`}
          >
            <img src={`data:image/png;base64,${vi.image_b64}`} alt={vi.true_label} className="w-12 h-12 block" style={{ imageRendering: 'pixelated' }} />
            <span className={`absolute bottom-0 right-0 w-2 h-2 ${vi.correct ? 'bg-green-400' : 'bg-red-400'}`} />
          </button>
        ))}
      </div>

      {/* Detail view */}
      <div className="flex gap-6 items-start">
        <div className="space-y-1">
          <p className="text-[10px] uppercase tracking-widest text-gray-600">Image</p>
          <img src={`data:image/png;base64,${v.image_b64}`} alt={v.true_label} className="w-24 h-24 border border-white/20" style={{ imageRendering: 'pixelated' }} />
          <p className="text-[10px] text-gray-500">Vrai : <span className="text-white">{v.true_label}</span></p>
        </div>

        {v.attention_b64 && (
          <div className="space-y-1">
            <p className="text-[10px] uppercase tracking-widest text-gray-600">Attention map</p>
            <img src={`data:image/png;base64,${v.attention_b64}`} alt="attention" className="w-24 h-24 border border-white/20" />
            <p className="text-[10px] text-gray-500">CLS → patches</p>
          </div>
        )}

        <div className="space-y-2 flex-1">
          <p className="text-[10px] uppercase tracking-widest text-gray-600">Top-3 prédictions</p>
          {v.predictions.map((p, i) => (
            <div key={i} className="flex items-center gap-3">
              <span className="text-[11px] w-24 truncate" style={{ color: i === 0 ? '#fff' : 'rgba(255,255,255,0.4)' }}>{p.class}</span>
              <div className="flex-1 h-1 bg-white/10 relative">
                <div className="absolute left-0 top-0 h-1 transition-all" style={{ width: `${p.confidence}%`, backgroundColor: i === 0 ? color : 'rgba(255,255,255,0.2)' }} />
              </div>
              <span className="text-[10px] text-gray-600 w-10 text-right">{p.confidence}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function JEPABenchmarkPage() {
  const [methodStates, setMethodStates] = useState<Record<string, MethodState>>(
    Object.fromEntries(METHODS.map(m => [m.id, { status: "idle", epochs: [], lastTestAcc: null }]))
  )
  const [backendOnline, setBackendOnline] = useState<boolean | null>(null)
  const esRefs = useRef<Record<string, EventSource>>({})

  // Check backend connectivity
  useEffect(() => {
    fetch(`${API_BASE}/api/methods`)
      .then(r => r.ok ? setBackendOnline(true) : setBackendOnline(false))
      .catch(() => setBackendOnline(false))
  }, [])

  const startTraining = async (methodId: string) => {
    setMethodStates(prev => ({
      ...prev,
      [methodId]: { status: "running", epochs: [], lastTestAcc: null },
    }))

    await fetch(`${API_BASE}/api/train/${methodId}`, { method: "POST" })

    // Subscribe to SSE stream
    if (esRefs.current[methodId]) esRefs.current[methodId].close()
    const es = new EventSource(`${API_BASE}/api/stream/${methodId}`)
    esRefs.current[methodId] = es

    es.onmessage = (e) => {
      const data: EpochData = JSON.parse(e.data)
      if (data.done) {
        es.close()
        setMethodStates(prev => ({ ...prev, [methodId]: { ...prev[methodId], status: "done" } }))
        return
      }
      setMethodStates(prev => {
        const cur = prev[methodId]
        const newEpochs = [...cur.epochs, data]
        const lastTestAcc = data.test_acc ?? cur.lastTestAcc
        return { ...prev, [methodId]: { ...cur, epochs: newEpochs, lastTestAcc } }
      })
    }

    es.onerror = () => {
      es.close()
      setMethodStates(prev => ({ ...prev, [methodId]: { ...prev[methodId], status: "error" } }))
    }
  }

  const stopAll = () => {
    Object.values(esRefs.current).forEach(es => es.close())
    esRefs.current = {}
  }

  useEffect(() => () => stopAll(), [])

  return (
    <div className="bg-[#111] text-white min-h-screen">

      {/* Header */}
      <section className="border-b border-white/20 px-4 sm:px-8 md:px-16 pt-16 pb-14">
        <span className="section-label block mb-10">[ 06 — Benchmark Comparatif ]</span>
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
              JEPA<br />Benchmark
            </h1>
          </div>
          <div className="md:col-span-6 md:pl-8 pb-1">
            <p className="text-gray-400 text-base leading-relaxed max-w-lg">
              Entraînez quatre méthodes SSL (I-JEPA, MAE, DINO, SimCLR) sur STL-10 via le backend
              FastAPI. Chaque méthode utilise un encodeur ViT-B pré-entraîné + sonde linéaire.
              Observez la précision de test en temps réel via SSE.
            </p>
            {backendOnline !== null && (
              <div className={`mt-4 flex items-center gap-2 text-xs uppercase tracking-widest ${backendOnline ? "text-green-400" : "text-red-400"}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${backendOnline ? "bg-green-400" : "bg-red-400"}`} />
                {backendOnline ? "Backend en ligne" : "Backend hors ligne — lancez uvicorn server:app --port 8000"}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Method Cards */}
      <section className="px-4 sm:px-8 md:px-16 py-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-px bg-white/10 border border-white/20">
          {METHODS.map(method => {
            const state = methodStates[method.id]
            const lastEpoch = state.epochs.filter(e => e.phase === "train").at(-1)
            const progress = lastEpoch && lastEpoch.total_epochs
              ? (lastEpoch.epoch / lastEpoch.total_epochs) * 100
              : 0

            return (
              <div key={method.id} className="bg-[#111] p-6 flex flex-col gap-5">
                {/* Method header */}
                <div className="flex items-start justify-between">
                  <div>
                    <span
                      className="text-[10px] uppercase tracking-widest px-2 py-0.5 border"
                      style={{ borderColor: `${method.color}40`, color: method.color }}
                    >
                      {method.type}
                    </span>
                    <h3 className="text-2xl font-bold uppercase tracking-tight mt-2">{method.name}</h3>
                  </div>
                  <span
                    className="w-3 h-3 rounded-full mt-1"
                    style={{
                      background: method.color,
                      boxShadow: state.status === "running" ? `0 0 12px ${method.color}` : "none",
                    }}
                  />
                </div>

                {/* Accuracy display */}
                <div className="border border-white/10 p-4 bg-white/[0.02]">
                  <div className="text-[11px] uppercase tracking-widest text-gray-500 mb-1">
                    Test Accuracy
                  </div>
                  <div
                    className="text-3xl font-bold font-mono"
                    style={{ color: state.lastTestAcc !== null ? method.color : undefined }}
                  >
                    {state.lastTestAcc !== null ? `${state.lastTestAcc.toFixed(1)}%` : "—"}
                  </div>
                  {lastEpoch && (
                    <div className="text-[11px] text-gray-600 mt-1">
                      Epoch {lastEpoch.epoch}/{lastEpoch.total_epochs} · loss {lastEpoch.train_loss}
                    </div>
                  )}
                </div>

                {/* Progress bar */}
                <div className="h-0.5 bg-white/10 overflow-hidden">
                  <div
                    className="h-full transition-all duration-300"
                    style={{
                      width: `${state.status === "done" ? 100 : progress}%`,
                      background: method.color,
                    }}
                  />
                </div>

                {/* Epoch log (last 4) */}
                <div className="flex-1 min-h-[80px]">
                  {state.epochs.slice(-4).map((ep, i) => (
                    <div key={i} className="text-[11px] text-gray-600 font-mono leading-relaxed">
                      {ep.phase === "train"
                        ? `E${ep.epoch} · trn ${ep.train_acc?.toFixed(1)}% · tst ${ep.test_acc?.toFixed(1)}%`
                        : ep.msg ?? ep.phase
                      }
                    </div>
                  ))}
                </div>

                {/* Status + Button */}
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => startTraining(method.id)}
                    disabled={state.status === "running" || !backendOnline}
                    className={`flex-1 px-4 py-3 border text-xs uppercase tracking-widest transition-colors ${
                      state.status === "running"
                        ? "border-white/20 text-white/30 cursor-not-allowed"
                        : !backendOnline
                          ? "border-white/10 text-white/20 cursor-not-allowed"
                          : "border-white text-white hover:bg-white/10"
                    }`}
                  >
                    {state.status === "running" ? "En cours..." : state.status === "done" ? "Relancer" : "Entraîner"}
                  </button>
                  {state.status === "done" && (
                    <span className="text-[10px] border border-green-400/40 text-green-400 px-2 py-1.5 uppercase tracking-widest">
                      Done
                    </span>
                  )}
                  {state.status === "error" && (
                    <span className="text-[10px] border border-red-400/40 text-red-400 px-2 py-1.5 uppercase tracking-widest">
                      Erreur
                    </span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* Comparison Table */}
      <section className="px-4 sm:px-8 md:px-16 pb-10">
        <div className="border border-white/20">
          <div className="border-b border-white/20 px-6 py-4">
            <span className="section-label">[ Résultats Comparatifs ]</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/20 text-left">
                  <th className="px-6 py-4 text-[11px] uppercase tracking-widest text-gray-500 font-normal">Méthode</th>
                  <th className="px-6 py-4 text-[11px] uppercase tracking-widest text-gray-500 font-normal">Type</th>
                  <th className="px-6 py-4 text-[11px] uppercase tracking-widest text-gray-500 font-normal text-right">Train Acc</th>
                  <th className="px-6 py-4 text-[11px] uppercase tracking-widest text-gray-500 font-normal text-right">Test Acc</th>
                  <th className="px-6 py-4 text-[11px] uppercase tracking-widest text-gray-500 font-normal text-center">Statut</th>
                </tr>
              </thead>
              <tbody>
                {METHODS.map(method => {
                  const state = methodStates[method.id]
                  const lastTrain = state.epochs.filter(e => e.phase === "train").at(-1)
                  return (
                    <tr key={method.id} className="border-b border-white/10 last:border-0 hover:bg-white/[0.02] transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <span
                            className="w-2.5 h-2.5 rounded-full shrink-0"
                            style={{ background: method.color }}
                          />
                          <span className="font-bold uppercase tracking-wide text-xs">{method.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-500 text-xs">{method.type}</td>
                      <td className="px-6 py-4 text-right font-mono text-white/70">
                        {lastTrain?.train_acc != null ? `${lastTrain.train_acc.toFixed(1)}%` : "—"}
                      </td>
                      <td className="px-6 py-4 text-right font-mono" style={{ color: state.lastTestAcc !== null ? method.color : undefined }}>
                        {state.lastTestAcc != null ? `${state.lastTestAcc.toFixed(1)}%` : "—"}
                      </td>
                      <td className="px-6 py-4 text-center">
                        {state.status === "done" ? (
                          <span className="text-[11px] border border-green-400/50 text-green-400 px-2 py-0.5 uppercase tracking-widest">Terminé</span>
                        ) : state.status === "running" ? (
                          <span className="inline-block w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: method.color }} />
                        ) : state.status === "error" ? (
                          <span className="text-[11px] border border-red-400/50 text-red-400 px-2 py-0.5 uppercase tracking-widest">Erreur</span>
                        ) : (
                          <span className="text-white/20 text-[11px] uppercase tracking-widest">En attente</span>
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

      {/* Architecture explanations */}
      <section className="px-4 sm:px-8 md:px-16 pb-20">
        <div className="border-b border-white/20 pb-6 mb-8">
          <span className="section-label">[ Architecture des Méthodes ]</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-white/10 border border-white/20">
          {[
            {
              method: "I-JEPA",
              color: "#8b5cf6",
              tag: "Prédictif",
              body: "Prédit la représentation latente de régions masquées de l'image. Pas de reconstruction pixel. Le contexte encoder et le target encoder partagent la même architecture ViT, mais le target est mis à jour par EMA (stop-gradient). Objectif : minimiser l'erreur de prédiction dans l'espace latent.",
            },
            {
              method: "MAE",
              color: "#3b82f6",
              tag: "Génératif",
              body: "Masked Autoencoder : masque 75% des patches et reconstruit les pixels manquants. Encodeur asymétrique (traite seulement les patches visibles), décodeur léger pour la reconstruction. Très efficace computationnellement mais prédit dans l'espace pixel.",
            },
            {
              method: "DINO",
              color: "#22c55e",
              tag: "Distillation",
              body: "Self-DIstillation with NO labels. Un student apprend à prédire les sorties d'un teacher mis à jour par EMA. Centering + sharpening évitent le collapse. Produit des features qui segmentent naturellement les objets sans supervision.",
            },
            {
              method: "SimCLR",
              color: "#ef4444",
              tag: "Contrastif",
              body: "Simple Framework for Contrastive Learning. Maximise l'accord entre deux augmentations de la même image (positive pairs) et minimise l'accord entre images différentes (negative pairs). Nécessite de grands batch sizes pour avoir suffisamment de négatifs.",
            },
          ].map(card => (
            <div key={card.method} className="bg-[#111] p-8 flex flex-col gap-4 hover:bg-white/[0.02] transition-colors">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold uppercase tracking-tight">{card.method}</h3>
                <span
                  className="text-[10px] border px-2 py-0.5 uppercase tracking-widest"
                  style={{ borderColor: `${card.color}40`, color: card.color }}
                >
                  {card.tag}
                </span>
              </div>
              <p className="text-gray-500 text-sm leading-relaxed">{card.body}</p>
            </div>
          ))}
        </div>

        {/* Visualisations section */}
        <div className="mt-12 space-y-2">
          <div className="border-t border-white/20 pt-8 mb-6">
            <p className="section-label text-[10px] uppercase tracking-widest mb-2">05 — Visualisations</p>
            <h2 className="text-2xl font-bold uppercase tracking-tight">Attention Maps & Prédictions</h2>
            <p className="text-gray-500 text-sm mt-2 max-w-xl">
              Pour chaque modèle entraîné, visualisation de l&apos;attention du token CLS vers les patches de l&apos;image, et des top-3 prédictions.
            </p>
          </div>
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            {METHODS.map(m => (
              <SampleVisuals key={m.id} methodId={m.id} methodName={m.name} color={m.color} trainingDone={methodStates[m.id].status === "done"} />
            ))}
          </div>
        </div>
      </section>

    </div>
  )
}
