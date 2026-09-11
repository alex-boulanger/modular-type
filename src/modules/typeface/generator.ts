import { clamp, ENGINE_VERSION } from './style'
import { GLYPHS, mapGlyphs } from './catalog'
import { initialGlyphConnections, initialGlyphPoints } from './drawing'
import type { DesignDNA, FontProject, FontStyle } from './types'

// Mulberry32: randomness is local to a generation, never global engine state.
function randomSource(seed: number) {
  let state = seed >>> 0
  return () => {
    state = (state + 0x6d2b79f5) >>> 0
    let value = Math.imul(state ^ state >>> 15, state | 1)
    value ^= value + Math.imul(value ^ value >>> 7, value | 61)
    return ((value ^ value >>> 14) >>> 0) / 4294967296
  }
}

export function generateProject(seed: number): FontProject {
  const random = randomSource(seed)
  const connectionStyle = random() < 0.7 ? 'union' : 'bridge'
  const dna: DesignDNA = {
    softness: random(), density: random(), width: random(), contrast: random(), weirdness: random(),
  }
  const style: FontStyle = {
    width: dna.width,
    height: clamp(0.45 + (random() - 0.3) * 0.7),
    moduleSize: 0.6 + dna.density * 0.4,
    spacing: 0.35 - dna.density * 0.25,
    roundness: 0.75 + dna.softness * 0.25,
    contrast: dna.contrast * 0.4,
    connectionStyle,
  }
  const variant = dna.weirdness > 0.5 ? 1 : 0
  const glyphVariants = mapGlyphs<0 | 1>(() => variant)
  for (const char of GLYPHS) {
    if (random() < dna.weirdness * 0.25) glyphVariants[char] = variant === 0 ? 1 : 0
  }
  return {
    schemaVersion: 5,
    engineVersion: ENGINE_VERSION,
    seed: seed >>> 0,
    generation: { dna },
    style,
    glyphVariants,
    glyphPoints: initialGlyphPoints(glyphVariants),
    glyphConnections: initialGlyphConnections(glyphVariants),
  }
}
