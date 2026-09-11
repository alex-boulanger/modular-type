import { useEffect, useReducer, useState } from 'react'
import { exportTypeface, previewGridLine } from '../../../modules/typeface'
import type { GlyphOutline, GridAxis } from '../../../modules/typeface'
import { loadSession, saveSession } from './persistence'
import { transition } from './session'

const randomSeed = () => window.crypto.getRandomValues(new Uint32Array(1))[0]

export function useTypeStudio() {
  const [session, dispatch] = useReducer(transition, undefined, loadSession)
  const [storageError, setStorageError] = useState<string | null>(null)
  const [exportState, setExportState] = useState<{ busy: boolean; message: string | null }>({ busy: false, message: null })

  useEffect(() => {
    // Persist immediately after each committed state; a quick refresh must not
    // lose the final slider edit. Only compact projects, never contours, are saved.
    try {
      saveSession(session)
    } catch {
      const timer = window.setTimeout(() => setStorageError('Local saving is unavailable. Export your font before leaving.'), 0)
      return () => window.clearTimeout(timer)
    }
  }, [session])

  const generate = () => dispatch({ type: 'generate', seed: randomSeed() })

  const randomizeGrid = () => dispatch({ type: 'randomize-grid', seed: randomSeed() })

  /** Outline of the selected letter while a grid line is dragged; the project changes only on release. */
  const previewLine = (axis: GridAxis, line: number, position: number): GlyphOutline | null => {
    try {
      return previewGridLine(session.current, session.view.selectedGlyph, axis, line, position)
    } catch {
      return null
    }
  }

  const download = async () => {
    if (exportState.busy) return
    setExportState({ busy: true, message: null })
    try {
      const artifact = await exportTypeface(session.current)
      const url = URL.createObjectURL(new Blob([artifact.buffer], { type: artifact.mimeType }))
      const link = document.createElement('a')
      link.href = url
      link.download = artifact.fileName
      document.body.append(link)
      link.click()
      link.remove()
      // Keep the URL alive long enough for Safari to start the download.
      window.setTimeout(() => URL.revokeObjectURL(url), 30_000)
      setExportState({ busy: false, message: `Download started: ${artifact.fileName}` })
    } catch (error) {
      setExportState({ busy: false, message: `Export failed: ${error instanceof Error ? error.message : 'unknown error'}. Your project has been kept.` })
    }
  }

  return { session, dispatch, generate, randomizeGrid, previewLine, download, exportState, storageError }
}
