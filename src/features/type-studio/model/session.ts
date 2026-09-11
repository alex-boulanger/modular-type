import { adjustTypeface, clearGlyphDrawing, connectGlyphPoints, createDefaultTypeface, disconnectGlyphPoints, generateTypeface, resetGlyphDrawing, restoreTypeface, toggleGlyphPoint } from '../../../modules/typeface'
import type { FontProject, FontStyle, GlyphChar, Typeface } from '../../../modules/typeface'

export interface StudioView {
  selectedGlyph: GlyphChar
  showGrid: boolean
}

export interface StudioSession {
  current: Typeface
  past: FontProject[]
  future: FontProject[]
  adjustment: keyof FontStyle | null
  view: StudioView
  notice: string | null
}

export type StudioAction =
  | { type: 'generate'; seed: number }
  | { type: 'adjust'; patch: Partial<FontStyle> }
  | { type: 'end-adjust' }
  | { type: 'toggle-point'; glyph: GlyphChar; pointId: number }
  | { type: 'connect-points' | 'disconnect-points'; glyph: GlyphChar; from: number; to: number }
  | { type: 'reset-glyph' | 'clear-glyph'; glyph: GlyphChar }
  | { type: 'restore'; project: unknown }
  | { type: 'undo' | 'redo' }
  | { type: 'view'; patch: Partial<StudioView> }
  | { type: 'dismiss' }

export function createSession(): StudioSession {
  return {
    current: createDefaultTypeface(), past: [], future: [], adjustment: null, notice: null,
    view: { selectedGlyph: 'A', showGrid: true },
  }
}

// History keeps compact projects, not thousands of compiled outline points.
const append = (history: FontProject[], project: FontProject) => [...history, project].slice(-50)

function commit(session: StudioSession, current: Typeface, adjustment: StudioSession['adjustment'] = null): StudioSession {
  if (current === session.current) return session
  return {
    ...session, current, future: [], notice: null, adjustment,
    past: adjustment && adjustment === session.adjustment ? session.past : append(session.past, session.current.project),
  }
}

/** Only successful compilation changes the drawing or its history. */
export function transition(session: StudioSession, action: StudioAction): StudioSession {
  try {
    switch (action.type) {
      case 'generate': return commit(session, generateTypeface(action.seed))
      case 'adjust': {
        const key = Object.keys(action.patch)[0] as keyof FontStyle | undefined
        if (!key || Object.entries(action.patch).every(([key, value]) => session.current.project.style[key as keyof FontStyle] === value)) return session
        return commit(session, adjustTypeface(session.current, action.patch), key)
      }
      case 'end-adjust': return { ...session, adjustment: null }
      case 'toggle-point': return commit(session, toggleGlyphPoint(session.current, action.glyph, action.pointId))
      case 'connect-points': return commit(session, connectGlyphPoints(session.current, action.glyph, action.from, action.to))
      case 'disconnect-points': return commit(session, disconnectGlyphPoints(session.current, action.glyph, action.from, action.to))
      case 'reset-glyph': return commit(session, resetGlyphDrawing(session.current, action.glyph))
      case 'clear-glyph': return commit(session, clearGlyphDrawing(session.current, action.glyph))
      case 'restore': return commit(session, restoreTypeface(action.project))
      case 'undo': {
        const project = session.past.at(-1)
        return project ? { ...session, current: restoreTypeface(project), past: session.past.slice(0, -1), future: append(session.future, session.current.project), adjustment: null, notice: null } : session
      }
      case 'redo': {
        const project = session.future.at(-1)
        return project ? { ...session, current: restoreTypeface(project), future: session.future.slice(0, -1), past: append(session.past, session.current.project), adjustment: null, notice: null } : session
      }
      case 'view': return { ...session, view: { ...session.view, ...action.patch }, adjustment: null }
      case 'dismiss': return { ...session, notice: null }
    }
  } catch (error) {
    return { ...session, notice: `${error instanceof Error ? error.message : 'Could not apply the change.'} The last valid design has been kept.` }
  }
}
