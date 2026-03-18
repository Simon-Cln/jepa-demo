import { type Grid, type Pos, type StepResult, DELTAS, isWalkable, posEq } from '../types'

interface WMState {
  // transition model: "row,col,action" -> "row,col"
  model: Map<string, string>
  // experience buffer
  history: Array<{ s: string; a: number; ns: string }>
  // current planned path
  plan: Pos[]
  lastGridKey: string
}

const pk = (p: Pos) => `${p.row},${p.col}`
const kp = (k: string): Pos => { const [r, c] = k.split(',').map(Number); return { row: r, col: c } }
const mk = (p: Pos, a: number) => `${p.row},${p.col},${a}`

function gridKey(grid: Grid) { return grid.map(r => r.join('')).join('|') }

export function worldModelInit(): WMState {
  return { model: new Map(), history: [], plan: [], lastGridKey: '' }
}

// BFS over internal model to find best action
function planWithModel(model: Map<string, string>, pos: Pos, goal: Pos): Pos[] {
  const start = pk(pos)
  const goalK = pk(goal)
  if (start === goalK) return []

  const visited = new Map<string, string | null>([[start, null]])
  const queue = [start]

  while (queue.length > 0) {
    const cur = queue.shift()!
    if (cur === goalK) break
    for (let a = 0; a < 4; a++) {
      const predicted = model.get(mk(kp(cur), a))
      if (!predicted) continue
      if (visited.has(predicted)) continue
      visited.set(predicted, cur)
      queue.push(predicted)
    }
  }

  if (!visited.has(goalK)) return []

  const path: Pos[] = []
  let k: string | null | undefined = goalK
  while (k && visited.get(k) !== null) {
    path.unshift(kp(k))
    k = visited.get(k)
  }
  return path
}

// Fallback: greedy toward goal
function greedyStep(grid: Grid, pos: Pos, goal: Pos): Pos {
  const dirs = [0, 1, 2, 3].sort((a, b) => {
    const na = { row: pos.row + DELTAS[a].row, col: pos.col + DELTAS[a].col }
    const nb = { row: pos.row + DELTAS[b].row, col: pos.col + DELTAS[b].col }
    return (Math.abs(na.row - goal.row) + Math.abs(na.col - goal.col)) -
           (Math.abs(nb.row - goal.row) + Math.abs(nb.col - goal.col))
  })
  for (const d of dirs) {
    const n = { row: pos.row + DELTAS[d].row, col: pos.col + DELTAS[d].col }
    if (isWalkable(grid, n)) return n
  }
  return pos
}

export function worldModelStep(grid: Grid, pos: Pos, goal: Pos, state: WMState): StepResult {
  const gk = gridKey(grid)
  const { model } = state
  let { plan } = state
  let replan = false

  // Replan if grid changed or plan empty or plan[0] blocked
  if (gk !== state.lastGridKey || plan.length === 0 || !isWalkable(grid, plan[0])) {
    plan = planWithModel(model, pos, goal)
    replan = gk !== state.lastGridKey
  }

  let nextPos: Pos
  let action: number

  if (plan.length > 0) {
    nextPos = plan[0]
    // Figure out which action was taken
    action = DELTAS.findIndex(d => d.row === nextPos.row - pos.row && d.col === nextPos.col - pos.col)
    if (action === -1) action = 0
    plan = plan.slice(1)
  } else {
    // Not enough model knowledge — explore greedily
    nextPos = greedyStep(grid, pos, goal)
    action = DELTAS.findIndex(d => d.row === nextPos.row - pos.row && d.col === nextPos.col - pos.col)
    if (action === -1) action = 0
  }

  const collision = !isWalkable(grid, nextPos) || (nextPos.row === pos.row && nextPos.col === pos.col && !posEq(pos, goal))
  const actual = collision ? pos : nextPos

  // Update model: learn (pos, action) -> actual
  model.set(mk(pos, action), pk(actual))

  return {
    nextPos: actual,
    nextState: { ...state, model, plan, lastGridKey: gk },
    collision,
    replan,
  }
}
