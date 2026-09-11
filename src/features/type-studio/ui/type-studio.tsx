import { GlyphSelector } from './glyph-selector'
import { useTypeStudio } from '../model/use-type-studio'
import { GlyphPreview } from './glyph-preview'
import { StyleControls } from './style-controls'
import './type-studio.css'

export function TypeStudio() {
  const { session, dispatch, generate, download, exportState, storageError } = useTypeStudio()
  const { current, view } = session

  return (
    <main className="studio">
      <header className="studio-header">
        <h1>Modular Type</h1>
        <div className="header-actions">
          <button type="button" disabled={!session.previous} onClick={() => dispatch({ type: 'previous' })}>Undo</button>
          <button type="button" onClick={generate}>Generate</button>
          <button className="export-button" type="button" disabled={exportState.busy} onClick={download}>
            {exportState.busy ? 'Exporting…' : 'Export OTF'}
          </button>
        </div>
      </header>

      {session.notice && <div className="notice" role="alert"><span>{session.notice}</span><button type="button" onClick={() => dispatch({ type: 'dismiss' })} aria-label="Dismiss notification">×</button></div>}
      {storageError && <p className="notice" role="status">{storageError}</p>}

      <div className="studio-layout">
        <section className="glyph-workspace" aria-label="Glyph editor">
          <div className="canvas-toolbar">
            <GlyphSelector selected={view.selectedGlyph} onSelect={selectedGlyph => dispatch({ type: 'view', patch: { selectedGlyph } })} />
            <div className="canvas-actions">
              <button className="reset-glyph" type="button" onClick={() => dispatch({ type: 'reset-glyph', glyph: view.selectedGlyph })}>Reset {view.selectedGlyph}</button>
              <label className="grid-toggle"><input type="checkbox" checked={view.showGrid}
                onChange={event => dispatch({ type: 'view', patch: { showGrid: event.target.checked } })} />Grid</label>
            </div>
          </div>
          <div className="glyph-canvas"><GlyphPreview key={`${view.selectedGlyph}-${view.showGrid}-${current.project.seed}`}
            glyph={current.glyphs[view.selectedGlyph]} unitsPerEm={current.metrics.unitsPerEm}
            inspect={view.showGrid} onTogglePoint={pointId => dispatch({ type: 'toggle-point', glyph: view.selectedGlyph, pointId })}
            onConnectPoints={(from, to) => dispatch({ type: 'connect-points', glyph: view.selectedGlyph, from, to })} /></div>
        </section>
        <aside className="control-panel" aria-label="Style controls">
          <StyleControls style={current.project.style} onChange={patch => dispatch({ type: 'adjust', patch })} />
          <p className="export-status" role="status">{exportState.message}</p>
        </aside>
      </div>
    </main>
  )
}
