/** One character catalog drives generation, persistence, editing, and export. */
export const GLYPH_GROUPS = [
  { label: 'Uppercase', shortLabel: 'A–Z', characters: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'] },
  { label: 'Lowercase', shortLabel: 'a–z', characters: ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z'] },
  { label: 'Numbers', shortLabel: '0–9', characters: ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'] },
  { label: 'Punctuation', shortLabel: '.,!?', characters: ['.', ',', '!', '?', '-'] },
] as const

export type GlyphChar = (typeof GLYPH_GROUPS)[number]['characters'][number]
export const GLYPHS: readonly GlyphChar[] = GLYPH_GROUPS.flatMap(group => [...group.characters])

export function mapGlyphs<T>(create: (char: GlyphChar) => T): Record<GlyphChar, T> {
  // Every key in the union is visited exactly once by the catalog.
  return Object.fromEntries(GLYPHS.map(char => [char, create(char)])) as Record<GlyphChar, T>
}
