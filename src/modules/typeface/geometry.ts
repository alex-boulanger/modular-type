import polygonClipping from 'polygon-clipping'
import type { Polygon, Ring } from 'polygon-clipping'
import { BASELINE_ROW, GRID_COLUMNS, GRID_ROWS, resolveDrawing } from './drawing'
import { organicConnection } from './connections'
import { lerp, METRICS, OUTLINE_SCALE } from './style'
import type { FontProject, GlyphChar, GlyphOutline, GridNode, Point } from './types'

const SIDE_BEARING = 36
const ARC_STEPS = 16

// Curves are sampled once here. SVG and CFF both consume the resulting
// integer contours; the exporter never performs its own curve approximation.
function ellipse(cx: number, cy: number, rx: number, ry: number): Polygon {
  const ring: Ring = []
  for (let i = 0; i < ARC_STEPS * 4; i++) {
    const angle = i * Math.PI * 2 / (ARC_STEPS * 4)
    ring.push([cx + rx * Math.cos(angle), cy + ry * Math.sin(angle)])
  }
  return [ring]
}

function canonicalRing(ring: Ring, isHole: boolean): Point[] | null {
  const points: Point[] = []
  for (const [x, y] of ring) {
    if (!Number.isFinite(x) || !Number.isFinite(y)) throw new Error('Outline contains non-finite coordinates.')
    const point: Point = [Math.round(x * OUTLINE_SCALE), Math.round(y * OUTLINE_SCALE)]
    const previous = points.at(-1)
    if (!previous || previous[0] !== point[0] || previous[1] !== point[1]) points.push(point)
  }
  const first = points[0]
  const last = points.at(-1)
  if (!first || !last) throw new Error('Empty outline.')
  if (last[0] !== first[0] || last[1] !== first[1]) points.push(first)
  const area = points.slice(1).reduce((sum, point, i) => sum + points[i][0] * point[1] - point[0] * points[i][1], 0)
  // Boolean junctions can leave subpixel pinholes, sometimes collapsed by
  // integer quantization. Fill only these tiny holes (under 16 square units),
  // never discard an exterior or one of the letter's actual counters.
  if (isHole && (points.length < 4 || Math.abs(area) < 32 * OUTLINE_SCALE ** 2)) return null
  if (points.length < 4 || Math.abs(area) < 2) throw new Error('Degenerate outline.')
  return points
}

export function buildGlyph(char: GlyphChar, project: FontProject): GlyphOutline {
  const style = project.style
  const recipe = resolveDrawing(char, project)
  const stepX = lerp(300, 500, style.width) / 4
  const stepY = lerp(460, 600, style.height) / 6
  const cell = Math.min(stepX, stepY)
  const strokeRadius = cell * lerp(0.35, 0.85, style.moduleSize)
  const vertical = 1 + style.contrast * 0.2
  const horizontal = 1 - style.contrast * 0.2
  // Spacing retracts the node envelope and changes relative neck fullness;
  // Module Size scales both. Grid proportions are independent of either.
  const envelope = strokeRadius * lerp(1.12, 0.78, style.spacing)
  const rx = Math.min(stepX * 0.94, envelope * vertical)
  const ry = Math.min(stepY * 0.92, envelope * horizontal)
  const transform = ([x, y]: Point): Point => [x * stepX, (BASELINE_ROW - y) * stepY + Math.ceil(Math.max(ry, strokeRadius))]
  const nodes = recipe.nodes.map(transform)
  const connections = recipe.connections.map(([a, b]) => [nodes[a], nodes[b]] as const)
  const shapes: Polygon[] = nodes.map(([x, y]) => ellipse(x, y, rx, ry))
  for (const [a, b] of connections) {
    const fullness = (style.connectionStyle === 'union' ? 0.62 : 0.42) + style.spacing * 0.1
    shapes.push(organicConnection(a, b, rx, ry, fullness, style.roundness))
  }

  // Input snapping prevents almost-coincident edges from accumulating floating
  // point noise in the boolean sweep. Final quantization is in font units.
  const snapped = shapes.map(polygon => polygon.map(ring => ring.map(([x, y]): [number, number] => [
    Math.round(x * 64) / 64, Math.round(y * 64) / 64,
  ])))
  // A drawing may contain islands or be empty while the author reshapes it.
  const merged = snapped.length ? polygonClipping.union(snapped[0], ...snapped.slice(1)) : []
  const contours = merged.flatMap(polygon => polygon.flatMap((ring, index) => {
    const canonical = canonicalRing(ring, index > 0)
    return canonical ? [canonical] : []
  }))
  const points = contours.flat()
  if (points.length > 12000) throw new Error('Geometry is too complex.')
  const xMin = points.length ? Math.min(...points.map(p => p[0])) : -Math.ceil(rx * OUTLINE_SCALE)
  const xMax = points.length ? Math.max(...points.map(p => p[0])) : Math.ceil((stepX * 4 + rx) * OUTLINE_SCALE)
  const yMin = points.length ? Math.min(...points.map(p => p[1])) : 0
  const yMax = points.length ? Math.max(...points.map(p => p[1])) : 0
  if (yMin < METRICS.descender || yMax > METRICS.ascender || xMax <= xMin) {
    throw new Error(`Invalid metrics for glyph ${char}.`)
  }
  const bearing = SIDE_BEARING * OUTLINE_SCALE
  const shift = bearing - xMin
  const translate = ([x, y]: Point): Point => [x + shift, y]
  const toFontPoint = ([x, y]: Point): Point => [x * OUTLINE_SCALE + shift, y * OUTLINE_SCALE]
  const translated = contours.map(ring => ring.map(translate))
  const grid: GridNode[] = []
  const active = new Set(project.glyphPoints[char])
  for (let y = 0; y < GRID_ROWS; y++) {
    for (let x = 0; x < GRID_COLUMNS; x++) {
      const id = y * GRID_COLUMNS + x
      grid.push({ id, position: toFontPoint(transform([x, y])), active: active.has(id) })
    }
  }
  return {
    char,
    contours: translated,
    pathData: translated.map(ring => `M${ring.slice(0, -1).map(p => p.join(' ')).join('L')}Z`).join(''),
    advanceWidth: Math.ceil(xMax - xMin + bearing * 2),
    bounds: points.length ? { xMin: bearing, xMax: xMax + shift, yMin, yMax } : { xMin: 0, xMax: 0, yMin: 0, yMax: 0 },
    construction: {
      nodes: nodes.map(toFontPoint),
      connections: connections.map(([a, b], index) => ({
        from: project.glyphPoints[char][recipe.connections[index][0]],
        to: project.glyphPoints[char][recipe.connections[index][1]],
        start: toFontPoint(a), end: toFontPoint(b),
      })),
      grid,
    },
  }
}
