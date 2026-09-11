import type { GlyphChar } from './catalog'
export { GLYPHS } from './catalog'
export type { GlyphChar } from './catalog'
export type ConnectionStyle = 'union' | 'bridge'
export type Point = readonly [number, number]
export type GridConnection = readonly [number, number]

export interface FontStyle {
  width: number
  height: number
  moduleSize: number
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

export interface FontProject {
  schemaVersion: 5
  engineVersion: string
  seed: number
  generation: { dna: DesignDNA }
  style: FontStyle
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
