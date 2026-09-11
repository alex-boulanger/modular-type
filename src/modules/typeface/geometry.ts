import polygonClipping from 'polygon-clipping'
import type { Polygon, Ring } from 'polygon-clipping'
import { BASELINE_ROW, GRID_COLUMNS, GRID_ROWS, resolveDrawing } from './drawing'
import { linePositions, resolveGrid } from './grid'
import { organicConnection } from './connections'
import { lerp, METRICS, OUTLINE_SCALE } from './style'
import type { FontProject, GlyphChar, GlyphOutline, GridNode, Point } from './types'

const SIDE_BEARING = 36
const ARC_STEPS = 16
// Vertical metric limits in design units.
const TOP = METRICS.ascender / OUTLINE_SCALE
const BOTTOM = METRICS.descender / OUTLINE_SCALE

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

function canonicalRing(ring: Ring): Point[] | null {
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
  // Boolean junctions can leave subpixel pinholes, and bridges between modules
  // of very different proportions can fold into specks outside the letter;
  // integer quantization may collapse either. Drop only rings under 16 square
  // units: the smallest module is several times larger, and so is any counter.
  if (points.length < 4 || Math.abs(area) < 32 * OUTLINE_SCALE ** 2) return null
  return points
}

/** A node's share of the grid along one axis: the mean of the gaps beside it. */
function cellScale(gaps: number[], index: number): number {
  if (index === 0) return gaps[0]
  if (index === gaps.length) return gaps[index - 1]
  return (gaps[index - 1] + gaps[index]) / 2
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
  // The lift depends on style alone, so every letter shares one baseline and frame.
  const lift = Math.ceil(Math.max(ry, strokeRadius))
  const gaps = resolveGrid(project)
  const columns = linePositions(gaps.columns)
  const rows = linePositions(gaps.rows)
  const place = (column: number, row: number): Point => [column * stepX, (BASELINE_ROW - row) * stepY + lift]
  const transform = ([x, y]: Point): Point => place(columns[x], rows[y])
  const nodes = recipe.nodes.map(transform)
  // Each module takes the size of its cell as far as Cell fit allows: its radii
  // follow the spacing around its node, within the font metrics. A regular
  // grid, or no cell fit, keeps the style's uniform module.
  const fit = (gaps: number[], index: number) => lerp(1, cellScale(gaps, index), style.cellFit)
  const radii = recipe.nodes.map(([x, y], index): Point => [
    rx * fit(gaps.columns, x),
    Math.min(ry * fit(gaps.rows, y), TOP - nodes[index][1], nodes[index][1] - BOTTOM),
  ])
  const shapes: Polygon[] = nodes.map(([x, y], index) => ellipse(x, y, radii[index][0], radii[index][1]))
  const fullness = (style.connectionStyle === 'union' ? 0.62 : 0.42) + style.spacing * 0.1
  for (const [a, b] of recipe.connections) {
    const bridge = organicConnection(nodes[a], radii[a], nodes[b], radii[b], fullness, style.roundness)
    if (bridge) shapes.push(bridge)
  }

  // Input snapping prevents almost-coincident edges from accumulating floating
  // point noise in the boolean sweep. Final quantization is in font units.
  const snapped = shapes.map(polygon => polygon.map(ring => ring.map(([x, y]): [number, number] => [
    Math.round(x * 64) / 64, Math.round(y * 64) / 64,
  ])))
  // A drawing may contain islands or be empty while the author reshapes it.
  const merged = snapped.length ? polygonClipping.union(snapped[0], ...snapped.slice(1)) : []
  const contours = merged.flatMap(polygon => polygon.flatMap(ring => {
    const canonical = canonicalRing(ring)
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
      connections: recipe.connections.map(([a, b]) => ({
        from: project.glyphPoints[char][a],
        to: project.glyphPoints[char][b],
        start: toFontPoint(nodes[a]), end: toFontPoint(nodes[b]),
      })),
      grid,
      lines: {
        columns: columns.map(column => toFontPoint(place(column, 0))[0]),
        rows: rows.map(row => toFontPoint(place(0, row))[1]),
      },
    },
  }
}
