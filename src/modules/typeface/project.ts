import { ENGINE_VERSION, normalizeStyle } from './style'
import { GLYPHS } from './catalog'
import { generateProject } from './generator'
import { GRID_SIZE, initialGlyphConnections, initialGlyphPoints, migrateGlyphConnections } from './drawing'
import type { DesignDNA, FontProject, FontStyle, GridConnection } from './types'

function object(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Invalid project.')
  return value as Record<string, unknown>
}

function unit(value: unknown): number {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0 || value > 1) {
    throw new Error('Invalid saved parameter.')
  }
  return value
}

export function readProject(value: unknown): FontProject {
  const project = object(value)
  const legacy = project.schemaVersion === 1 && project.engineVersion === '3.0.0'
  const legacyPoints = project.schemaVersion === 2 && project.engineVersion === '3.1.0'
  const legacyLinks = project.schemaVersion === 3 && project.engineVersion === '3.2.0'
  const legacyAlphabet = project.schemaVersion === 4 && project.engineVersion === '4.0.0'
  const oldAlphabet = legacy || legacyPoints || legacyLinks || legacyAlphabet
  if (!oldAlphabet && (project.schemaVersion !== 5 || project.engineVersion !== ENGINE_VERSION)) {
    throw new Error('This project uses an incompatible engine version.')
  }
  if (typeof project.seed !== 'number' || !Number.isInteger(project.seed) || project.seed < 0 || project.seed > 0xffffffff) {
    throw new Error('Invalid seed.')
  }
  const generation = object(project.generation)
  const rawDNA = object(generation.dna)
  const dna: DesignDNA = {
    softness: unit(rawDNA.softness), density: unit(rawDNA.density), width: unit(rawDNA.width),
    contrast: unit(rawDNA.contrast), weirdness: unit(rawDNA.weirdness),
  }
  const rawStyle = object(project.style)
  const { connectionStyle } = rawStyle
  if (connectionStyle !== 'union' && connectionStyle !== 'bridge') throw new Error('Unknown connection style.')
  const style: FontStyle = normalizeStyle({
    width: unit(rawStyle.width), height: unit(rawStyle.height), moduleSize: unit(rawStyle.moduleSize),
    spacing: unit(rawStyle.spacing), roundness: unit(rawStyle.roundness), contrast: unit(rawStyle.contrast),
    connectionStyle,
  })
  const variants = object(project.glyphVariants)
  const glyphVariants = generateProject(project.seed).glyphVariants
  const savedGlyphs = oldAlphabet ? ['A', 'B', 'C', 'D', 'E'] as const : GLYPHS
  for (const char of savedGlyphs) {
    const variant = variants[char]
    if (variant !== 0 && variant !== 1) throw new Error(`Unknown recipe for ${char}.`)
    glyphVariants[char] = variant
  }
  const glyphPoints = initialGlyphPoints(glyphVariants)
  if (!legacy) {
    const savedPoints = object(project.glyphPoints)
    for (const char of savedGlyphs) {
      const points = savedPoints[char]
      if (!Array.isArray(points) || points.length > GRID_SIZE ||
          !points.every((id: unknown): id is number => typeof id === 'number' && Number.isInteger(id) && id >= 0 && id < GRID_SIZE) ||
          new Set(points).size !== points.length) {
        throw new Error(`Invalid nodes for ${char}.`)
      }
      glyphPoints[char] = [...points].sort((a, b) => a - b)
    }
  }
  const glyphConnections = initialGlyphConnections(glyphVariants)
  for (const char of savedGlyphs) glyphConnections[char] = []
  if (!legacy && !legacyPoints) {
    const savedConnections = object(project.glyphConnections)
    for (const char of savedGlyphs) {
      const links = savedConnections[char]
      if (!Array.isArray(links) || links.length > GRID_SIZE * (GRID_SIZE - 1) / 2) {
        throw new Error(`Invalid connections for ${char}.`)
      }
      const seen = new Set<string>()
      for (const link of links) {
        if (!Array.isArray(link) || link.length !== 2 ||
            !link.every((id: unknown): id is number => typeof id === 'number' && Number.isInteger(id) && id >= 0 && id < GRID_SIZE) ||
            link[0] === link[1]) throw new Error(`Invalid connection for ${char}.`)
        const pair: GridConnection = [Math.min(link[0], link[1]), Math.max(link[0], link[1])]
        const key = pair.join(':')
        if (seen.has(key)) throw new Error(`Duplicate connection for ${char}.`)
        seen.add(key)
        // Discard dormant links from saves: enabling a node must never reconnect it.
        if (glyphPoints[char].includes(pair[0]) && glyphPoints[char].includes(pair[1])) {
          glyphConnections[char].push(pair)
        }
      }
      glyphConnections[char].sort(([a, b], [c, d]) => a - c || b - d)
    }
  }
  return {
    schemaVersion: 5, engineVersion: ENGINE_VERSION, seed: project.seed,
    generation: { dna }, style, glyphVariants, glyphPoints,
    glyphConnections: legacy || legacyPoints || legacyLinks
      ? migrateGlyphConnections(glyphVariants, glyphPoints, glyphConnections) : glyphConnections,
  }
}

export function identifyStyle(project: FontProject): string {
  // Only effective geometry matters: editing the view or generation metadata
  // must not rename an otherwise identical font.
  const source = JSON.stringify([
    project.engineVersion, project.style,
    GLYPHS.map(char => [project.glyphVariants[char], project.glyphPoints[char], project.glyphConnections[char]]),
  ])
  let hash = 0x811c9dc5
  for (let i = 0; i < source.length; i++) hash = Math.imul(hash ^ source.charCodeAt(i), 0x01000193)
  return (hash >>> 0).toString(16).padStart(8, '0')
}
