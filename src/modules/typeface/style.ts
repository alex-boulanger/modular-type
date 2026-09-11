import type { ContinuousControl, FontStyle } from './types'

export const ENGINE_VERSION = '5.0.0'
// Design coordinates use a 1000-unit frame; canonical outlines have 4× the
// resolution so integer font encoding does not visibly roughen the curves.
export const OUTLINE_SCALE = 4
export const METRICS = { unitsPerEm: 4000, ascender: 3200, descender: -800 } as const

export const CONTROLS: readonly { key: ContinuousControl; label: string; low: string; high: string; description: string }[] = [
  { key: 'width', label: 'Width', low: 'Narrow', high: 'Wide', description: 'Stretch the grid horizontally.' },
  { key: 'height', label: 'Height', low: 'Short', high: 'Tall', description: 'Stretch the grid vertically while keeping the font size fixed.' },
  { key: 'moduleSize', label: 'Weight', low: 'Light', high: 'Heavy', description: 'Thicken the modules and their connections.' },
  { key: 'spacing', label: 'Spacing', low: 'Tight', high: 'Open', description: 'Shrink modules around fixed nodes to open up the spaces inside letters.' },
  { key: 'roundness', label: 'Roundness', low: 'Sharp', high: 'Soft', description: 'Deepen the concave joins between circular modules.' },
  { key: 'contrast', label: 'Contrast', low: 'Even', high: 'Strong', description: 'Thicken vertical strokes and thin horizontal strokes, with diagonals in between.' },
]

export const clamp = (value: number) => Math.min(1, Math.max(0, value))
export const lerp = (min: number, max: number, value: number) => min + (max - min) * value

export function normalizeStyle(style: FontStyle): FontStyle {
  if (!['union', 'bridge'].includes(style.connectionStyle)) {
    throw new Error('Unknown connection style.')
  }
  const normalized = { ...style }
  for (const { key } of CONTROLS) {
    if (typeof style[key] !== 'number' || !Number.isFinite(style[key])) {
      throw new Error(`Invalid parameter: ${key}.`)
    }
    normalized[key] = Math.round(clamp(style[key]) * 1000) / 1000
  }
  return normalized
}
