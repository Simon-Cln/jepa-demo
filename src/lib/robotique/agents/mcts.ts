import { type Grid, type Pos, type StepResult, DELTAS, isWalkable, posEq } from '../types'

const N_SIMULATIONS = 40
const MAX_DEPTH     = 20
const C             = 1.41  // UCB exploration constant

interface MCTSNode {
  visits: number
  value: number
  children: Map<number, MCTSNode>
}

interface MCTSState {
  // Lightweight: no persistent tree (rebuild each step)
  dummy: null
}

function newNode(): MCTSNode {
  return { visits: 0, value: 0, children: new Map() }
}

function simulate(grid: Grid, pos: Pos, goal: Pos, depth: number): number {
  if (posEq(pos, goal)) return 1
  if (depth === 0) return -(Math.abs(pos.row - goal.row) + Math.abs(pos.col - goal.col)) / 20
  // Random rollout
  const actions = [0, 1, 2, 3]
  const shuffled = actions.sort(() => Math.random() - 0.5)
  for (const a of shuffled) {
    const n: Pos = { row: pos.row + DELTAS[a].row, col: pos.col + DELTAS[a].col }
    if (isWalkable(grid, n)) {
      return posEq(n, goal) ? 1 : simulate(grid, n, goal, depth - 1) * 0.95
    }
  }
  return -0.5  // stuck
}

export function mctsInit(): MCTSState {
  return { dummy: null }
}

export function mctsStep(grid: Grid, pos: Pos, goal: Pos, state: MCTSState): StepResult {
  // Build a fresh tree for this step
  const root = newNode()

  for (let s = 0; s < N_SIMULATIONS; s++) {
    // Selection + expansion + simulation
    for (let a = 0; a < 4; a++) {
      if (!root.children.has(a)) root.children.set(a, newNode())
    }

    // UCB selection
    let bestA = 0
    let bestUCB = -Infinity
    for (const [a, child] of root.children) {
      const n = { row: pos.row + DELTAS[a].row, col: pos.col + DELTAS[a].col }
      if (!isWalkable(grid, n) && !posEq(n, goal)) {
        continue
      }
      const ucb = child.visits === 0
        ? Infinity
        : child.value / child.visits + C * Math.sqrt(Math.log(root.visits + 1) / child.visits)
      if (ucb > bestUCB) { bestUCB = ucb; bestA = a }
    }

    const next: Pos = { row: pos.row + DELTAS[bestA].row, col: pos.col + DELTAS[bestA].col }
    const canMove = isWalkable(grid, next)
    const simPos = canMove ? next : pos

    const value = simulate(grid, simPos, goal, MAX_DEPTH)

    const child = root.children.get(bestA)!
    child.visits++
    child.value += value
    root.visits++
  }

  // Pick most visited action
  let bestAction = 0
  let bestVisits = -1
  for (const [a, child] of root.children) {
    if (child.visits > bestVisits) { bestVisits = child.visits; bestAction = a }
  }

  const nextPos: Pos = { row: pos.row + DELTAS[bestAction].row, col: pos.col + DELTAS[bestAction].col }
  const canMove = isWalkable(grid, nextPos)

  return {
    nextPos: canMove ? nextPos : pos,
    nextState: state,
    collision: !canMove,
    replan: false,
  }
}
