import { type Grid, type Pos, type StepResult, DELTAS, ROWS, COLS, isWalkable, posEq } from '../types'

const N_STATES  = ROWS * COLS
const N_ACTIONS = 4
const LR        = 0.15
const GAMMA     = 0.95
const EPS_INIT  = 1.0
const EPS_MIN   = 0.05
const EPS_DECAY = 0.998

interface QLState {
  qTable: Float32Array  // N_STATES * N_ACTIONS
  epsilon: number
  prevStateIdx: number
  prevAction: number
  episode: number
}

const flatIdx = (p: Pos) => p.row * COLS + p.col

export function qlearningInit(): QLState {
  return {
    qTable: new Float32Array(N_STATES * N_ACTIONS).fill(0),
    epsilon: EPS_INIT,
    prevStateIdx: -1,
    prevAction: -1,
    episode: 0,
  }
}

function maxQ(qt: Float32Array, si: number): number {
  let m = -Infinity
  for (let a = 0; a < N_ACTIONS; a++) {
    const v = qt[si * N_ACTIONS + a]
    if (v > m) m = v
  }
  return m
}

function chooseAction(qt: Float32Array, si: number, eps: number): number {
  if (Math.random() < eps) return Math.floor(Math.random() * N_ACTIONS)
  let best = 0, bestV = -Infinity
  for (let a = 0; a < N_ACTIONS; a++) {
    const v = qt[si * N_ACTIONS + a]
    if (v > bestV) { bestV = v; best = a }
  }
  return best
}

export function qlearningStep(grid: Grid, pos: Pos, goal: Pos, state: QLState): StepResult {
  const qt = state.qTable
  const si = flatIdx(pos)
  const action = chooseAction(qt, si, state.epsilon)

  const delta = DELTAS[action]
  const next: Pos = { row: pos.row + delta.row, col: pos.col + delta.col }
  const canMove = isWalkable(grid, next)
  const actualNext = canMove ? next : pos

  const done = posEq(actualNext, goal)
  const reward = done ? 10 : !canMove ? -1 : -0.05

  // Q update
  const ni = flatIdx(actualNext)
  const idx = si * N_ACTIONS + action
  qt[idx] = qt[idx] + LR * (reward + GAMMA * maxQ(qt, ni) - qt[idx])

  const newEps = Math.max(EPS_MIN, state.epsilon * EPS_DECAY)

  return {
    nextPos: actualNext,
    nextState: { qTable: qt, epsilon: newEps, prevStateIdx: ni, prevAction: action, episode: state.episode + (done ? 1 : 0) },
    collision: !canMove,
    replan: false,
  }
}
