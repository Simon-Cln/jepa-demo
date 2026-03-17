// ─── Types ────────────────────────────────────────────────────────────────────
export type Cell = "empty" | "wall" | "start" | "goal" | "agent";
export type Direction = "up" | "down" | "left" | "right";

export interface GridPos { row: number; col: number }
export interface SimState {
  agentPos: GridPos;
  steps: number;
  reached: boolean;
  path: GridPos[];
  imagined: GridPos[];   // world model imagined trajectory
}

// ─── Grid definition (12×10) ──────────────────────────────────────────────────
export const GRID_COLS = 12;
export const GRID_ROWS = 10;

const WALL_CELLS: GridPos[] = [
  // Horizontal walls
  { row: 2, col: 2 }, { row: 2, col: 3 }, { row: 2, col: 4 }, { row: 2, col: 5 },
  { row: 4, col: 6 }, { row: 4, col: 7 }, { row: 4, col: 8 }, { row: 4, col: 9 },
  { row: 6, col: 1 }, { row: 6, col: 2 }, { row: 6, col: 3 }, { row: 6, col: 4 },
  { row: 7, col: 7 }, { row: 7, col: 8 }, { row: 7, col: 9 },
];

export const START_POS: GridPos = { row: 1, col: 1 };
export const GOAL_POS:  GridPos = { row: 8, col: 10 };

export function isWall(pos: GridPos): boolean {
  return WALL_CELLS.some((w) => w.row === pos.row && w.col === pos.col);
}

export function isInBounds(pos: GridPos): boolean {
  return pos.row >= 0 && pos.row < GRID_ROWS && pos.col >= 0 && pos.col < GRID_COLS;
}

export function isBlocked(pos: GridPos): boolean {
  return !isInBounds(pos) || isWall(pos);
}

export function posEq(a: GridPos, b: GridPos): boolean {
  return a.row === b.row && a.col === b.col;
}

// ─── BFS pathfinding (world model uses this) ──────────────────────────────────
export function bfs(start: GridPos, goal: GridPos): GridPos[] {
  const queue: GridPos[] = [start];
  const visited = new Set<string>();
  const parent = new Map<string, GridPos | null>();
  const key = (p: GridPos) => `${p.row},${p.col}`;

  visited.add(key(start));
  parent.set(key(start), null);

  const dirs: GridPos[] = [
    { row: -1, col: 0 }, { row: 1, col: 0 },
    { row: 0, col: -1 }, { row: 0, col: 1 },
  ];

  while (queue.length > 0) {
    const current = queue.shift()!;
    if (posEq(current, goal)) {
      // Reconstruct path
      const path: GridPos[] = [];
      let node: GridPos | null = current;
      while (node) {
        path.unshift(node);
        node = parent.get(key(node)) ?? null;
      }
      return path;
    }
    for (const d of dirs) {
      const next = { row: current.row + d.row, col: current.col + d.col };
      if (!isBlocked(next) && !visited.has(key(next))) {
        visited.add(key(next));
        parent.set(key(next), current);
        queue.push(next);
      }
    }
  }
  return []; // No path
}

// ─── Random agent step ────────────────────────────────────────────────────────
export function randomStep(pos: GridPos): GridPos {
  const dirs: GridPos[] = [
    { row: -1, col: 0 }, { row: 1, col: 0 },
    { row: 0, col: -1 }, { row: 0, col: 1 },
  ];
  const valid = dirs
    .map((d) => ({ row: pos.row + d.row, col: pos.col + d.col }))
    .filter((p) => !isBlocked(p));
  if (valid.length === 0) return pos;
  return valid[Math.floor(Math.random() * valid.length)];
}

// ─── Grid builder ─────────────────────────────────────────────────────────────
export function getGridCell(row: number, col: number): Cell {
  if (posEq({ row, col }, START_POS)) return "start";
  if (posEq({ row, col }, GOAL_POS))  return "goal";
  if (isWall({ row, col }))           return "wall";
  return "empty";
}
