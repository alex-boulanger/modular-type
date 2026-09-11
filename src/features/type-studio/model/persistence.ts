import { GLYPHS, restoreTypeface } from '../../../modules/typeface'
import { createSession } from './session'
import type { StudioSession, StudioView } from './session'
import type { GlyphChar } from '../../../modules/typeface'

const STORAGE_KEY = 'modular-type-generator:studio:v1'

function record(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Invalid saved project.')
  return value as Record<string, unknown>
}

function readView(value: unknown): StudioView {
  const view = record(value)
  return {
    selectedGlyph: GLYPHS.includes(view.selectedGlyph as GlyphChar) ? view.selectedGlyph as GlyphChar : 'A',
    showGrid: typeof view.showGrid === 'boolean' ? view.showGrid : true,
  }
}

export function loadSession(): StudioSession {
  let saved: string | null
  try {
    saved = window.localStorage.getItem(STORAGE_KEY)
  } catch {
    return { ...createSession(), notice: 'Local storage is unavailable. You can create and export fonts, but your project will not be restored after closing.' }
  }
  if (!saved) return createSession()
  try {
    const snapshot = record(JSON.parse(saved))
    if (snapshot.version !== 1) throw new Error('Incompatible save version.')
    return {
      current: restoreTypeface(snapshot.current),
      past: snapshot.previous == null ? [] : [restoreTypeface(snapshot.previous).project],
      future: [], adjustment: null,
      view: readView(snapshot.view),
      notice: null,
    }
  } catch (error) {
    return { ...createSession(), notice: `Could not restore the saved project. ${error instanceof Error ? error.message : ''} The default design has been loaded.` }
  }
}

export function saveSession(session: StudioSession): void {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify({
    version: 1,
    current: session.current.project,
    // Keep the latest undo across reloads without persisting the entire history.
    previous: session.past.at(-1) ?? null,
    view: session.view,
  }))
}
