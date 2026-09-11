import { RECIPES } from './recipes'
import { GLYPHS, mapGlyphs } from './catalog'
import type { FontProject, GlyphChar, GridConnection, Point } from './types'

export const GRID_COLUMNS = 5
export const GRID_ROWS = 9
export const BASELINE_ROW = 6
export const X_HEIGHT_ROW = 2
export const GRID_SIZE = GRID_COLUMNS * GRID_ROWS

const pointId = ([x, y]: Point) => y * GRID_COLUMNS + x
const position = (id: number): Point => [id % GRID_COLUMNS, Math.floor(id / GRID_COLUMNS)]

export function initialGlyphPoints(variants: FontProject['glyphVariants']): FontProject['glyphPoints'] {
  const points: FontProject['glyphPoints'] = mapGlyphs(() => [])
  for (const char of GLYPHS) {
    points[char] = RECIPES[char][variants[char]].nodes.map(pointId).sort((a, b) => a - b)
  }
  return points
}

/** Every stored edge is explicit; point edits never infer new connections. */
export function normalizeConnections(links: GridConnection[]): GridConnection[] {
  const unique = new Map<string, GridConnection>()
  for (const [from, to] of links) {
    if (from === to) continue
    const pair: GridConnection = [Math.min(from, to), Math.max(from, to)]
    unique.set(pair.join(':'), pair)
  }
  return [...unique.values()].sort(([a, b], [c, d]) => a - c || b - d)
}

function splitConnections(links: GridConnection[], points: number[]): GridConnection[] {
  const active = new Set(points)
  return normalizeConnections(links.flatMap(([from, to]): GridConnection[] => {
    // Keep inactive strokes intact here; migration discards them afterward.
    if (!active.has(from) || !active.has(to)) return [[from, to]]
    const a = position(from)
    const b = position(to)
    const dx = b[0] - a[0]
    const dy = b[1] - a[1]
    const lengthSquared = dx * dx + dy * dy
    const onStroke = points.filter(id => {
      const [x, y] = position(id)
      const dot = (x - a[0]) * dx + (y - a[1]) * dy
      return (x - a[0]) * dy === (y - a[1]) * dx && dot >= 0 && dot <= lengthSquared
    }).sort((left, right) => {
      const l = position(left)
      const r = position(right)
      return (l[0] - r[0]) * dx + (l[1] - r[1]) * dy
    })
    return onStroke.slice(1).map((id, index) => [onStroke[index], id])
  }))
}

function neighbourConnections(points: number[], original: number[], added: number[]): GridConnection[] {
  const links: GridConnection[] = []
  for (const id of added) {
    const [x, y] = position(id)
    for (const other of points) {
      if (original.includes(id) && original.includes(other)) continue
      const [nx, ny] = position(other)
      if (id !== other && Math.abs(nx - x) <= 1 && Math.abs(ny - y) <= 1) links.push([id, other])
    }
  }
  return links
}

export function initialGlyphConnections(variants: FontProject['glyphVariants']): FontProject['glyphConnections'] {
  const links: FontProject['glyphConnections'] = mapGlyphs(() => [])
  for (const char of GLYPHS) {
    const recipe = RECIPES[char][variants[char]]
    links[char] = splitConnections(
      recipe.connections.map(([from, to]) => [pointId(recipe.nodes[from]), pointId(recipe.nodes[to])]),
      recipe.nodes.map(pointId),
    )
  }
  return links
}

/** Materialize the old recipe + manual-link rules once when reading legacy saves. */
export function migrateGlyphConnections(
  variants: FontProject['glyphVariants'], points: FontProject['glyphPoints'], manual: FontProject['glyphConnections'],
): FontProject['glyphConnections'] {
  const links: FontProject['glyphConnections'] = mapGlyphs(() => [])
  for (const char of GLYPHS) {
    const recipe = RECIPES[char][variants[char]]
    const original = recipe.nodes.map(pointId)
    const strokes: GridConnection[] = recipe.connections.map(([a, b]) => [original[a], original[b]])
    links[char] = normalizeConnections([
      ...splitConnections([...strokes, ...manual[char]], points[char]),
      ...neighbourConnections(points[char], original, points[char]),
    ]).filter(([from, to]) => points[char].includes(from) && points[char].includes(to))
  }
  return links
}

export function resolveDrawing(char: GlyphChar, project: FontProject) {
  const ids = project.glyphPoints[char]
  const indices = new Map(ids.map((id, index) => [id, index]))
  const connections: [number, number][] = []
  for (const [from, to] of project.glyphConnections[char]) {
    const a = indices.get(from)
    const b = indices.get(to)
    if (a !== undefined && b !== undefined) connections.push([a, b])
  }
  return { nodes: ids.map(position), connections }
}
