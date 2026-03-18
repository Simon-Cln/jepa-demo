import { ROWS, COLS, type Grid } from './types'

function empty(): Grid {
  return Array.from({ length: ROWS }, () => new Array(COLS).fill(0))
}

function set(g: Grid, positions: [number, number][]): Grid {
  for (const [r, c] of positions) g[r][c] = 1
  return g
}

// Scenario 1: Open with a few walls
function scenario1(): Grid {
  const g = empty()
  g[10][12] = 3 // goal
  set(g, [
    [3,3],[3,4],[3,5],[3,6],
    [6,7],[6,8],[6,9],[6,10],
    [2,9],[3,9],[4,9],
    [8,2],[8,3],[8,4],[8,5],
  ])
  return g
}

// Scenario 2: Maze-like corridors
function scenario2(): Grid {
  const g = empty()
  g[10][12] = 3
  set(g, [
    // horizontal walls
    [2,2],[2,3],[2,4],[2,5],[2,6],[2,7],[2,8],
    [4,4],[4,5],[4,6],[4,7],[4,8],[4,9],[4,10],
    [6,2],[6,3],[6,4],[6,5],[6,6],
    [8,5],[8,6],[8,7],[8,8],[8,9],[8,10],[8,11],
    // vertical walls
    [3,8],[4,8],[5,8],
    [7,3],[8,3],[9,3],
  ])
  return g
}

// Scenario 3: Open grid, obstacle will be added dynamically
function scenario3(): Grid {
  const g = empty()
  g[10][12] = 3
  set(g, [
    [4,4],[5,4],[6,4],[7,4],
    [4,9],[5,9],[6,9],
  ])
  return g
}

export const SCENARIOS = [
  { id: 'open',  label: 'Obstacles fixes',         grid: scenario1, dynamicObstacles: [] as [number,number][] },
  { id: 'maze',  label: 'Labyrinthe',              grid: scenario2, dynamicObstacles: [] as [number,number][] },
  { id: 'surpr', label: 'Obstacle inattendu',      grid: scenario3, dynamicObstacles: [[5,7],[6,7],[7,7]] as [number,number][] },
]

export const START: { row: number; col: number } = { row: 1, col: 1 }
export const GOAL:  { row: number; col: number } = { row: 10, col: 12 }
