export const ROWS = 12
export const COLS = 14
export const CELL = 1.1 // Three.js unit size

export type Grid = number[][] // 0=floor, 1=wall, 3=goal
export interface Pos { row: number; col: number }

export const DELTAS: Pos[] = [
  { row: -1, col: 0 },  // up=0
  { row:  1, col: 0 },  // down=1
  { row:  0, col: -1 }, // left=2
  { row:  0, col: 1 },  // right=3
]

export function inBounds(p: Pos): boolean {
  return p.row >= 0 && p.row < ROWS && p.col >= 0 && p.col < COLS
}
export function isWalkable(grid: Grid, p: Pos): boolean {
  return inBounds(p) && grid[p.row][p.col] !== 1
}
export function posEq(a: Pos, b: Pos): boolean {
  return a.row === b.row && a.col === b.col
}

export interface Metrics {
  steps: number
  collisions: number
  replans: number
  done: boolean
}

export interface StepResult {
  nextPos: Pos
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  nextState: any
  collision: boolean
  replan: boolean
}

export const AGENT_DEFS = [
  { id: 'reactive',   name: 'Réactif',     color: '#ef4444', hex: 0xef4444, desc: 'Règles fixes, aucun modèle' },
  { id: 'astar',      name: 'A*',          color: '#3b82f6', hex: 0x3b82f6, desc: 'Planification classique optimale' },
  { id: 'qlearning',  name: 'Q-Learning',  color: '#22c55e', hex: 0x22c55e, desc: 'RL model-free, apprend par essai' },
  { id: 'worldmodel', name: 'World Model', color: '#8b5cf6', hex: 0x8b5cf6, desc: 'Simule mentalement (JEPA-inspired)' },
  { id: 'mcts',       name: 'MCTS',        color: '#f59e0b', hex: 0xf59e0b, desc: 'Monte Carlo Tree Search' },
] as const

export type AgentId = typeof AGENT_DEFS[number]['id']
