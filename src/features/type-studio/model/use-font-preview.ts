import { useEffect, useState } from 'react'
import { exportTypeface } from '../../../modules/typeface'
import type { Typeface } from '../../../modules/typeface'

interface LoadedFont {
  id: string
  family: string
  face: FontFace | null
  error: string | null
}

export type FontPreviewState =
  | { status: 'loading' }
  | { status: 'ready'; family: string }
  | { status: 'error'; message: string }

/**
 * Sets preview text in the real exported font: the OTF is compiled when the
 * preview opens and stays installed in the page until the design changes.
 */
export function useFontPreview(typeface: Typeface, open: boolean): FontPreviewState {
  const [font, setFont] = useState<LoadedFont | null>(null)
  const id = typeface.styleId
  const current = font?.id === id ? font : null

  useEffect(() => {
    if (!open || current) return
    let cancelled = false
    const family = `Modular Type Preview ${id}`
    exportTypeface(typeface)
      .then(artifact => new FontFace(family, artifact.buffer).load())
      .then(face => { if (!cancelled) setFont({ id, family, face, error: null }) })
      .catch((error: unknown) => {
        if (!cancelled) setFont({ id, family, face: null, error: error instanceof Error ? error.message : 'unknown error' })
      })
    return () => { cancelled = true }
  }, [typeface, id, open, current])

  // Only the latest design's font stays installed in the page.
  useEffect(() => {
    const face = font?.face
    if (!face) return
    document.fonts.add(face)
    return () => { document.fonts.delete(face) }
  }, [font])

  if (!current) return { status: 'loading' }
  return current.face ? { status: 'ready', family: current.family } : { status: 'error', message: current.error ?? 'unknown error' }
}
