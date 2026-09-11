import type { GlyphChar } from './catalog'
export { GLYPHS } from './catalog'
export type { GlyphChar } from './catalog'
export type ConnectionStyle = 'union' | 'bridge'
export type Point = readonly [number, number]
export type GridConnection = readonly [number, number]
export type GridAxis = 'column' | 'row'

export interface FontStyle {
  width: number
  height: number
  moduleSize: number
  /** How far each node takes the size of its grid cell: 0 keeps every node the same size. */
  cellFit: number
  spacing: number
  roundness: number
  contrast: number
  connectionStyle: ConnectionStyle
}

export type ContinuousControl = Exclude<keyof FontStyle, 'connectionStyle'>

export interface DesignDNA {
  softness: number
  density: number
  width: number
  contrast: number
  weirdness: number
}

/** Relative gaps between neighbouring grid lines; a regular grid is all ones. */
export interface GridSpacing {
  /** Four column gaps, left to right. */
  columns: number[]
  /** Eight row gaps, top to bottom. */
  rows: number[]
}

export interface FontProject {
  schemaVersion: 6
  engineVersion: string
  seed: number
  generation: { dna: DesignDNA }
  style: FontStyle
  /** Gap weights of the grid shared by every letter. */
  grid: GridSpacing
  glyphVariants: Record<GlyphChar, 0 | 1>
  /** Active grid point IDs, in row-major order: y * 5 + x. */
  glyphPoints: Record<GlyphChar, number[]>
  /** Explicit links between active nodes, stored once with the smaller point ID first. */
  glyphConnections: Record<GlyphChar, GridConnection[]>
}

export interface GridNode {
  id: number
  position: Point
  active: boolean
}

/** Grid line positions in font units: x of each column, y of each row from the top. */
export interface GridLines {
  columns: number[]
  rows: number[]
}

export interface GlyphOutline {
  char: GlyphChar
  /** Closed integer contours in font coordinates (Y up), including holes. */
  contours: Point[][]
  pathData: string
  advanceWidth: number
  bounds: { xMin: number; yMin: number; xMax: number; yMax: number }
  construction: {
    nodes: Point[]
    connections: { from: number; to: number; start: Point; end: Point }[]
    grid: GridNode[]
    lines: GridLines
  }
}

export interface Typeface {
  project: FontProject
  styleId: string
  glyphs: Record<GlyphChar, GlyphOutline>
  metrics: { unitsPerEm: number; ascender: number; descender: number }
}

export interface FontArtifact {
  buffer: ArrayBuffer
  fileName: string
  mimeType: 'font/otf'
}
