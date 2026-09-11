import { BASELINE_ROW, GRID_COLUMNS, GRID_ROWS } from './drawing'
import type { FontProject, GridAxis, GridSpacing } from './types'

/** Smallest gap between neighbouring lines, as a share of a regular gap: lines never cross or merge. */
const MIN_GAP = 0.3
/** Randomized gaps start within this range of a regular gap, before fitting the frame. */
const RANDOM_GAP = [0.6, 1.6] as const

// Locked lines split each axis into stretches that keep their length: the
// frame belongs to Width and Height, and the baseline anchors the font metrics.
const LOCKED: Record<GridAxis, readonly number[]> = {
  column: [0, GRID_COLUMNS - 1],
  row: [0, BASELINE_ROW, GRID_ROWS - 1],
}

const round = (value: number) => Math.round(value * 10000) / 10000
const roundSpacing = ({ columns, rows }: GridSpacing): GridSpacing => ({ columns: columns.map(round), rows: rows.map(round) })

export function regularGrid(): GridSpacing {
  return { columns: Array.from({ length: GRID_COLUMNS - 1 }, () => 1), rows: Array.from({ length: GRID_ROWS - 1 }, () => 1) }
}

export function isGridLineMovable(axis: GridAxis, line: number): boolean {
  const count = axis === 'column' ? GRID_COLUMNS : GRID_ROWS
  return Number.isInteger(line) && line > 0 && line < count - 1 && !LOCKED[axis].includes(line)
}

/** Share one stretch between its gaps in proportion to their weights, none under the minimum. */
function fitStretch(weights: number[], length: number): number[] {
  const pinned = new Set<number>()
  while (true) {
    const free = weights.reduce((sum, weight, i) => pinned.has(i) ? sum : sum + weight, 0)
    const room = length - MIN_GAP * pinned.size
    const gaps = weights.map((weight, i) => pinned.has(i) ? MIN_GAP : weight * room / free)
    const under = gaps.flatMap((gap, i) => pinned.has(i) || gap >= MIN_GAP ? [] : [i])
    // A stretch always has room for more than the minimum per gap, so some gap stays free.
    if (!under.length || pinned.size + under.length === weights.length) return gaps
    for (const i of under) pinned.add(i)
  }
}

function fitAxis(weights: number[], axis: GridAxis): number[] {
  const locked = LOCKED[axis]
  return locked.slice(1).flatMap((end, i) => fitStretch(weights.slice(locked[i], end), end - locked[i]))
}

const fit = ({ columns, rows }: GridSpacing): GridSpacing => ({ columns: fitAxis(columns, 'column'), rows: fitAxis(rows, 'row') })

/** Gaps every letter is built on: the saved weights, fitted to the frame. */
export const resolveGrid = (project: FontProject): GridSpacing => fit(project.grid)

/** Line positions in grid units, from the first line, for a list of gaps. */
export function linePositions(gaps: number[]): number[] {
  return gaps.reduce((positions, gap) => [...positions, positions[positions.length - 1] + gap], [0])
}

/** Move one line rigidly: only the gaps on either side of it change. */
export function withGridLine(project: FontProject, axis: GridAxis, line: number, position: number): FontProject {
  if (!isGridLineMovable(axis, line)) throw new Error('This grid line cannot move.')
  if (!Number.isFinite(position)) throw new Error('Invalid grid position.')
  const gaps = resolveGrid(project)
  const list = axis === 'column' ? gaps.columns : gaps.rows
  const positions = linePositions(list)
  const target = Math.min(positions[line + 1] - MIN_GAP, Math.max(positions[line - 1] + MIN_GAP, position))
  if (Math.abs(target - positions[line]) < 1e-6) return project
  const next = list.map((gap, i) => i === line - 1 ? target - positions[line - 1] : i === line ? positions[line + 1] - target : gap)
  return { ...project, grid: roundSpacing(axis === 'column' ? { ...gaps, columns: next } : { ...gaps, rows: next }) }
}

/** A random grid: every gap drawn around a regular gap, then fitted to the frame. */
export function randomGrid(random: () => number): GridSpacing {
  const draw = (count: number) => Array.from({ length: count }, () => RANDOM_GAP[0] + (RANDOM_GAP[1] - RANDOM_GAP[0]) * random())
  return roundSpacing(fit({ columns: draw(GRID_COLUMNS - 1), rows: draw(GRID_ROWS - 1) }))
}

export function readGridSpacing(value: unknown): GridSpacing {
  const spacing = value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {}
  const valid = (list: unknown, length: number): list is number[] => Array.isArray(list) && list.length === length &&
    list.every(gap => typeof gap === 'number' && Number.isFinite(gap) && gap > 0 && gap < 100)
  if (!valid(spacing.columns, GRID_COLUMNS - 1) || !valid(spacing.rows, GRID_ROWS - 1)) throw new Error('Invalid grid.')
  return { columns: [...spacing.columns], rows: [...spacing.rows] }
}
