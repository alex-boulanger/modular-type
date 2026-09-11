import { GLYPHS } from './types'
import type { FontArtifact, Typeface } from './types'

export async function exportTypeface(typeface: Typeface): Promise<FontArtifact> {
  const { Font, Glyph, Path } = await import('opentype.js')
  const scale = typeface.metrics.unitsPerEm / 1000
  const notdef = new Path()
  notdef.moveTo(60 * scale, 0 * scale)
  notdef.lineTo(60 * scale, 600 * scale)
  notdef.lineTo(440 * scale, 600 * scale)
  notdef.lineTo(440 * scale, 0 * scale)
  notdef.close()
  notdef.moveTo(100 * scale, 40 * scale)
  notdef.lineTo(400 * scale, 40 * scale)
  notdef.lineTo(400 * scale, 560 * scale)
  notdef.lineTo(100 * scale, 560 * scale)
  notdef.close()
  const glyphs = [
    new Glyph({ name: '.notdef', advanceWidth: 500 * scale, path: notdef }),
    new Glyph({ name: 'space', unicode: 32, advanceWidth: 250 * scale, path: new Path() }),
  ]
  for (const char of GLYPHS) {
    const outline = typeface.glyphs[char]
    const path = new Path()
    for (const ring of outline.contours) {
      path.moveTo(ring[0][0], ring[0][1])
      for (const [x, y] of ring.slice(1, -1)) path.lineTo(x, y)
      path.close()
    }
    glyphs.push(new Glyph({ name: char, unicode: char.charCodeAt(0), advanceWidth: outline.advanceWidth, path }))
  }
  const identifier = `${typeface.project.seed}-${typeface.styleId}`
  const font = new Font({
    familyName: `Modular Type ${identifier}`,
    styleName: 'Regular',
    ...typeface.metrics,
    glyphs,
  })
  const buffer = font.toArrayBuffer()
  if (new DataView(buffer).getUint32(0) !== 0x4f54544f) throw new Error("Export did not produce a valid OTF file.")
  return { buffer, fileName: `modular-type-${identifier}.otf`, mimeType: 'font/otf' }
}
