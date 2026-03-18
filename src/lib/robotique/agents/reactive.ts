import { type Grid, type Pos, type StepResult, DELTAS, isWalkable } from '../types'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function reactiveInit(): any { return {} }

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function reactiveStep(grid: Grid, pos: Pos, goal: Pos, state: any): StepResult {
  // Sort directions by how much they reduce manhattan distance to goal
  const dirs = [0, 1, 2, 3].sort((a, b) => {
    const na = { row: pos.row + DELTAS[a].row, col: pos.col + DELTAS[a].col }
    const nb = { row: pos.row + DELTAS[b].row, col: pos.col + DELTAS[b].col }
    const da = Math.abs(na.row - goal.row) + Math.abs(na.col - goal.col)
    const db = Math.abs(nb.row - goal.row) + Math.abs(nb.col - goal.col)
    return da - db
  })

  for (const d of dirs) {
    const next = { row: pos.row + DELTAS[d].row, col: pos.col + DELTAS[d].col }
    if (isWalkable(grid, next)) {
      return { nextPos: next, nextState: state, collision: false, replan: false }
    }
  }

  // Completely stuck — stay
  return { nextPos: pos, nextState: state, collision: true, replan: false }
}
