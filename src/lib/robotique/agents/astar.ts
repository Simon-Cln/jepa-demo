import { type Grid, type Pos, type StepResult, DELTAS, ROWS, COLS, isWalkable } from '../types'

interface AStarState {
  path: Pos[]
  lastGrid: string
}

function gridKey(grid: Grid): string {
  return grid.map(row => row.join('')).join('|')
}

export function astarInit(): AStarState {
  return { path: [], lastGrid: '' }
}

export function computePath(grid: Grid, start: Pos, goal: Pos): Pos[] {
  const key = (p: Pos) => p.row * COLS + p.col
  const gScore = new Float32Array(ROWS * COLS).fill(Infinity)
  const fScore = new Float32Array(ROWS * COLS).fill(Infinity)
  const parent = new Int32Array(ROWS * COLS).fill(-1)
  const open = new Set<number>()

  const sk = key(start)
  gScore[sk] = 0
  fScore[sk] = Math.abs(start.row - goal.row) + Math.abs(start.col - goal.col)
  open.add(sk)

  while (open.size > 0) {
    // Pick node with lowest fScore
    let cur = -1
    let bestF = Infinity
    for (const k of open) { if (fScore[k] < bestF) { bestF = fScore[k]; cur = k } }
    if (cur === -1) break

    const curRow = Math.floor(cur / COLS)
    const curCol = cur % COLS

    if (curRow === goal.row && curCol === goal.col) {
      // Reconstruct
      const path: Pos[] = []
      let k = cur
      while (k !== sk) {
        path.unshift({ row: Math.floor(k / COLS), col: k % COLS })
        k = parent[k]
      }
      return path
    }

    open.delete(cur)

    for (const d of DELTAS) {
      const nr = curRow + d.row
      const nc = curCol + d.col
      const next: Pos = { row: nr, col: nc }
      if (!isWalkable(grid, next)) continue
      const nk = key(next)
      const tentG = gScore[cur] + 1
      if (tentG < gScore[nk]) {
        parent[nk] = cur
        gScore[nk] = tentG
        fScore[nk] = tentG + Math.abs(nr - goal.row) + Math.abs(nc - goal.col)
        open.add(nk)
      }
    }
  }
  return []
}

export function astarStep(grid: Grid, pos: Pos, goal: Pos, state: AStarState): StepResult {
  const gk = gridKey(grid)
  let { path } = state
  let replan = false

  // Replan if grid changed or path is empty or path[0] is blocked
  if (gk !== state.lastGrid || path.length === 0 || !isWalkable(grid, path[0])) {
    path = computePath(grid, pos, goal)
    replan = gk !== state.lastGrid
  }

  if (path.length === 0) {
    return { nextPos: pos, nextState: { path, lastGrid: gk }, collision: true, replan }
  }

  const next = path[0]
  return {
    nextPos: next,
    nextState: { path: path.slice(1), lastGrid: gk },
    collision: false,
    replan,
  }
}
