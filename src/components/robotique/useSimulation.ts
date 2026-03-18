"use client"
import { useState, useEffect, useRef, useCallback } from "react"
import { type Grid, type Pos, type Metrics, AGENT_DEFS, type AgentId, posEq } from "@/lib/robotique/types"
import { SCENARIOS, START, GOAL } from "@/lib/robotique/gridMaps"
import { reactiveInit, reactiveStep }     from "@/lib/robotique/agents/reactive"
import { astarInit, astarStep }           from "@/lib/robotique/agents/astar"
import { qlearningInit, qlearningStep }   from "@/lib/robotique/agents/qlearning"
import { worldModelInit, worldModelStep } from "@/lib/robotique/agents/worldModel"
import { mctsInit, mctsStep }             from "@/lib/robotique/agents/mcts"

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AgentInternalState = any

const STEP_FUNCS: Record<AgentId, (g: Grid, p: Pos, goal: Pos, s: AgentInternalState) => ReturnType<typeof reactiveStep>> = {
  reactive:   reactiveStep,
  astar:      astarStep,
  qlearning:  qlearningStep,
  worldmodel: worldModelStep,
  mcts:       mctsStep,
}

const INIT_FUNCS: Record<AgentId, () => AgentInternalState> = {
  reactive:   reactiveInit,
  astar:      astarInit,
  qlearning:  qlearningInit,
  worldmodel: worldModelInit,
  mcts:       mctsInit,
}

const MAX_STEPS = 600

export interface SimAgentState {
  pos: Pos
  metrics: Metrics
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  internal: any
}

export interface SimState {
  positions: Record<AgentId, Pos>
  metrics: Record<AgentId, Metrics>
  grid: Grid
  running: boolean
  scenarioIdx: number
  speed: number  // ms per step
  dynamicSpawned: boolean
}

function cloneGrid(g: Grid): Grid { return g.map(r => [...r]) }
function initMetrics(): Metrics { return { steps: 0, collisions: 0, replans: 0, done: false } }

export function useSimulation() {
  const [scenarioIdx, setScenarioIdx] = useState(0)
  const [running, setRunning] = useState(false)
  const [speed, setSpeed] = useState(180)  // ms between steps
  const [grid, setGrid] = useState<Grid>(() => cloneGrid(SCENARIOS[0].grid()))
  const [positions, setPositions] = useState<Record<string, Pos>>(() =>
    Object.fromEntries(AGENT_DEFS.map(a => [a.id, { ...START }]))
  )
  const [metrics, setMetrics] = useState<Record<string, Metrics>>(() =>
    Object.fromEntries(AGENT_DEFS.map(a => [a.id, initMetrics()]))
  )
  const [dynamicSpawned, setDynamicSpawned] = useState(false)

  // Internal agent states (not rendered, just refs)
  const internalRef = useRef<Record<string, AgentInternalState>>(
    Object.fromEntries(AGENT_DEFS.map(a => [a.id, INIT_FUNCS[a.id as AgentId]()]))
  )
  const gridRef = useRef<Grid>(cloneGrid(SCENARIOS[0].grid()))
  const posRef  = useRef<Record<string, Pos>>(Object.fromEntries(AGENT_DEFS.map(a => [a.id, { ...START }])))
  const metricsRef = useRef<Record<string, Metrics>>(Object.fromEntries(AGENT_DEFS.map(a => [a.id, initMetrics()])))
  const dynamicSpawnedRef = useRef(false)

  const reset = useCallback((sIdx?: number) => {
    const idx = sIdx ?? scenarioIdx
    const g = cloneGrid(SCENARIOS[idx].grid())
    gridRef.current = g
    posRef.current = Object.fromEntries(AGENT_DEFS.map(a => [a.id, { ...START }]))
    metricsRef.current = Object.fromEntries(AGENT_DEFS.map(a => [a.id, initMetrics()]))
    internalRef.current = Object.fromEntries(AGENT_DEFS.map(a => [a.id, INIT_FUNCS[a.id as AgentId]()]))
    dynamicSpawnedRef.current = false
    setGrid(cloneGrid(g))
    setPositions({ ...posRef.current })
    setMetrics({ ...metricsRef.current })
    setDynamicSpawned(false)
    setRunning(false)
  }, [scenarioIdx])

  const changeScenario = useCallback((idx: number) => {
    setScenarioIdx(idx)
    const g = cloneGrid(SCENARIOS[idx].grid())
    gridRef.current = g
    posRef.current = Object.fromEntries(AGENT_DEFS.map(a => [a.id, { ...START }]))
    metricsRef.current = Object.fromEntries(AGENT_DEFS.map(a => [a.id, initMetrics()]))
    internalRef.current = Object.fromEntries(AGENT_DEFS.map(a => [a.id, INIT_FUNCS[a.id as AgentId]()]))
    dynamicSpawnedRef.current = false
    setGrid(cloneGrid(g))
    setPositions({ ...posRef.current })
    setMetrics({ ...metricsRef.current })
    setDynamicSpawned(false)
    setRunning(false)
  }, [])

  // Spawn dynamic obstacle
  const spawnDynamicObstacles = useCallback(() => {
    const sc = SCENARIOS[scenarioIdx]
    if (!sc.dynamicObstacles.length || dynamicSpawnedRef.current) return
    for (const [r, c] of sc.dynamicObstacles) {
      gridRef.current[r][c] = 1
    }
    dynamicSpawnedRef.current = true
    setGrid(cloneGrid(gridRef.current))
    setDynamicSpawned(true)
  }, [scenarioIdx])

  // Step all agents
  const stepAll = useCallback(() => {
    const allDone = AGENT_DEFS.every(a => metricsRef.current[a.id].done)
    if (allDone) { setRunning(false); return }

    // Auto-spawn dynamic obstacles at step 80
    const maxSteps = Math.max(...AGENT_DEFS.map(a => metricsRef.current[a.id].steps))
    if (maxSteps === 80 && !dynamicSpawnedRef.current && SCENARIOS[scenarioIdx].dynamicObstacles.length > 0) {
      for (const [r, c] of SCENARIOS[scenarioIdx].dynamicObstacles) {
        gridRef.current[r][c] = 1
      }
      dynamicSpawnedRef.current = true
      setDynamicSpawned(true)
    }

    for (const agent of AGENT_DEFS) {
      const id = agent.id as AgentId
      const m = metricsRef.current[id]
      if (m.done || m.steps >= MAX_STEPS) continue

      const result = STEP_FUNCS[id](gridRef.current, posRef.current[id], GOAL, internalRef.current[id])

      internalRef.current[id] = result.nextState
      posRef.current[id] = result.nextPos

      const newDone = posEq(result.nextPos, GOAL)
      metricsRef.current[id] = {
        steps: m.steps + 1,
        collisions: m.collisions + (result.collision ? 1 : 0),
        replans: m.replans + (result.replan ? 1 : 0),
        done: newDone,
      }
    }

    setPositions({ ...posRef.current })
    setMetrics({ ...metricsRef.current })
  }, [scenarioIdx])

  // Timer
  useEffect(() => {
    if (!running) return
    const t = setInterval(stepAll, speed)
    return () => clearInterval(t)
  }, [running, speed, stepAll])

  return {
    grid, positions, metrics, running, speed, scenarioIdx, dynamicSpawned,
    setRunning, setSpeed,
    reset: () => reset(),
    changeScenario,
    spawnDynamicObstacles,
  }
}
