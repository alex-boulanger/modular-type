import { buildGlyph } from './geometry'
import { GRID_SIZE, initialGlyphConnections, initialGlyphPoints, normalizeConnections } from './drawing'
import { generateProject } from './generator'
import { identifyStyle, readProject } from './project'
import { METRICS, normalizeStyle } from './style'
import { GLYPHS, mapGlyphs } from './catalog'
import type { FontProject, FontStyle, GlyphChar, GridConnection, Typeface } from './types'

export { GLYPHS, GLYPH_GROUPS } from './catalog'
export { GRID_COLUMNS, GRID_ROWS, BASELINE_ROW, X_HEIGHT_ROW } from './drawing'
export type { ContinuousControl, FontArtifact, FontProject, FontStyle, GlyphChar, GlyphOutline, GridConnection, GridNode, Typeface } from './types'
export { CONTROLS } from './style'
export { exportTypeface } from './export'

/** Compiles atomically: errors never return a partially valid alphabet. */
function compile(project: FontProject): Typeface {
  const normalized = { ...project, style: normalizeStyle(project.style) }
  return {
    project: normalized,
    styleId: identifyStyle(normalized),
    metrics: METRICS,
    glyphs: mapGlyphs(char => buildGlyph(char, normalized)),
  }
}

function recompileGlyph(typeface: Typeface, char: GlyphChar, project: FontProject): Typeface {
  const glyph = buildGlyph(char, project)
  return {
    ...typeface, project, styleId: identifyStyle(project),
    glyphs: { ...typeface.glyphs, [char]: glyph },
  }
}

/** Same seed produces the same initial project and contours for this engine. */
export function generateTypeface(seed: number): Typeface {
  if (!Number.isInteger(seed) || seed < 0 || seed > 0xffffffff) throw new Error('Invalid seed.')
  // Bounded deterministic retries. The returned seed always reproduces the
  // accepted proposal, including when a previous candidate was rejected.
  for (let attempt = 0; attempt < 8; attempt++) {
    try {
      return compile(generateProject((seed + attempt) >>> 0))
    } catch {
      // A numerical boolean failure must not discard the caller's project.
    }
  }
  throw new Error('Could not generate a valid design. Your current project has been kept; try again.')
}

export function createDefaultTypeface(): Typeface {
  return generateTypeface(23)
}

/** Manual edits preserve generation metadata; effective style is authoritative. */
export function adjustTypeface(typeface: Typeface, patch: Partial<FontStyle>): Typeface {
  return compile({ ...typeface.project, style: { ...typeface.project.style, ...patch } })
}

/** Edit one letter; compile before committing and retain the other outlines. */
export function toggleGlyphPoint(typeface: Typeface, char: GlyphChar, pointId: number): Typeface {
  if (!GLYPHS.includes(char) || !Number.isInteger(pointId) || pointId < 0 || pointId >= GRID_SIZE) {
    throw new Error('Invalid grid node.')
  }
  const points = typeface.project.glyphPoints[char]
  const next = points.includes(pointId) ? points.filter(id => id !== pointId) : [...points, pointId].sort((a, b) => a - b)
  const project: FontProject = {
    ...typeface.project,
    glyphPoints: { ...typeface.project.glyphPoints, [char]: next },
    glyphConnections: {
      ...typeface.project.glyphConnections,
      [char]: typeface.project.glyphConnections[char].filter(([from, to]) => next.includes(from) && next.includes(to)),
    },
  }
  return recompileGlyph(typeface, char, project)
}

/** Connect any two grid points atomically, activating both endpoints if needed. */
export function connectGlyphPoints(typeface: Typeface, char: GlyphChar, from: number, to: number): Typeface {
  if (!GLYPHS.includes(char) || ![from, to].every(id => Number.isInteger(id) && id >= 0 && id < GRID_SIZE)) {
    throw new Error('Invalid grid node.')
  }
  if (from === to) return typeface
  const pair: GridConnection = [Math.min(from, to), Math.max(from, to)]
  const points = [...new Set([...typeface.project.glyphPoints[char], from, to])].sort((a, b) => a - b)
  const connections = normalizeConnections([...typeface.project.glyphConnections[char], pair])
  if (JSON.stringify(points) === JSON.stringify(typeface.project.glyphPoints[char]) &&
      JSON.stringify(connections) === JSON.stringify(typeface.project.glyphConnections[char])) return typeface
  const project: FontProject = {
    ...typeface.project,
    glyphPoints: { ...typeface.project.glyphPoints, [char]: points },
    glyphConnections: { ...typeface.project.glyphConnections, [char]: connections },
  }
  return recompileGlyph(typeface, char, project)
}

/** Remove an edge without removing either endpoint. */
export function disconnectGlyphPoints(typeface: Typeface, char: GlyphChar, from: number, to: number): Typeface {
  if (!GLYPHS.includes(char)) throw new Error('Unknown glyph.')
  const connections = typeface.project.glyphConnections[char]
  const next = connections.filter(([a, b]) => !((a === from && b === to) || (a === to && b === from)))
  if (next.length === connections.length) return typeface
  return recompileGlyph(typeface, char, {
    ...typeface.project, glyphConnections: { ...typeface.project.glyphConnections, [char]: next },
  })
}

/** Start this character from a blank grid, preserving the rest of the font. */
export function clearGlyphDrawing(typeface: Typeface, char: GlyphChar): Typeface {
  if (!GLYPHS.includes(char)) throw new Error('Unknown glyph.')
  if (!typeface.project.glyphPoints[char].length) return typeface
  return recompileGlyph(typeface, char, {
    ...typeface.project,
    glyphPoints: { ...typeface.project.glyphPoints, [char]: [] },
    glyphConnections: { ...typeface.project.glyphConnections, [char]: [] },
  })
}

/** Restore this letter's generated recipe, keeping its style and other letters. */
export function resetGlyphDrawing(typeface: Typeface, char: GlyphChar): Typeface {
  if (!GLYPHS.includes(char)) throw new Error('Unknown glyph.')
  const points = initialGlyphPoints(typeface.project.glyphVariants)[char]
  const connections = initialGlyphConnections(typeface.project.glyphVariants)[char]
  if (JSON.stringify(connections) === JSON.stringify(typeface.project.glyphConnections[char]) &&
      JSON.stringify(points) === JSON.stringify(typeface.project.glyphPoints[char])) return typeface
  const project: FontProject = {
    ...typeface.project,
    glyphPoints: { ...typeface.project.glyphPoints, [char]: points },
    glyphConnections: { ...typeface.project.glyphConnections, [char]: connections },
  }
  return recompileGlyph(typeface, char, project)
}

/** Treat persisted input as untrusted. Never reapply DNA over manual edits. */
export function restoreTypeface(project: unknown): Typeface {
  return compile(readProject(project))
}
