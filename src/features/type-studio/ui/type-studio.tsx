import { useState } from "react";
import { FontPreview } from "./font-preview";
import { GlyphSelector } from "./glyph-selector";
import { useTypeStudio } from "../model/use-type-studio";
import { GlyphPreview } from "./glyph-preview";
import { GridControls } from "./grid-controls";
import { StyleControls } from "./style-controls";
import type { GridLineEditor } from "./use-grid-line-gesture";
import "./type-studio.css";

export function TypeStudio() {
  const {
    session,
    dispatch,
    generate,
    randomizeGrid,
    previewLine,
    download,
    exportState,
    storageError,
  } = useTypeStudio();
  const [previewOpen, setPreviewOpen] = useState(false);
  const { current, view } = session;
  const glyph = view.selectedGlyph;
  const { grid } = current.project;
  // A regular grid is all ones: Reset stays disabled until a line moved.
  const canResetGrid = [...grid.columns, ...grid.rows].some((gap) => gap !== 1);
  const lineEditor: GridLineEditor = {
    preview: previewLine,
    move: (axis, line, position, continuous) =>
      dispatch({ type: "move-grid-line", axis, line, position, continuous }),
    reset: (axis, line) => dispatch({ type: "reset-grid-line", axis, line }),
    endAdjust: () => dispatch({ type: "end-adjust" }),
  };

  return (
    <main className="studio">
      <header className="studio-header">
        <h1>Modular Type</h1>
        <div className="header-actions">
          <button
            type="button"
            disabled={!session.past.length}
            onClick={() => dispatch({ type: "undo" })}
          >
            Undo
          </button>
          <button
            type="button"
            disabled={!session.future.length}
            onClick={() => dispatch({ type: "redo" })}
          >
            Redo
          </button>
          <button type="button" onClick={generate}>
            Generate
          </button>
          <button type="button" onClick={() => setPreviewOpen(true)}>
            Preview
          </button>
          <button
            className="export-button"
            type="button"
            disabled={exportState.busy}
            onClick={download}
          >
            {exportState.busy ? "Exporting…" : "Export OTF"}
          </button>
        </div>
      </header>

      {session.notice && (
        <div className="notice" role="alert">
          <span>{session.notice}</span>
          <button
            type="button"
            onClick={() => dispatch({ type: "dismiss" })}
            aria-label="Dismiss notification"
          >
            ×
          </button>
        </div>
      )}
      {storageError && (
        <p className="notice" role="status">
          {storageError}
        </p>
      )}

      <div className="studio-layout">
        <section className="glyph-workspace" aria-label="Glyph editor">
          <div className="canvas-toolbar">
            <GlyphSelector
              selected={glyph}
              onSelect={(selectedGlyph) =>
                dispatch({ type: "view", patch: { selectedGlyph } })
              }
            />
            <div className="canvas-actions">
              <button
                className="reset-glyph"
                type="button"
                onClick={() => dispatch({ type: "reset-glyph", glyph })}
              >
                Reset {glyph}
              </button>
              <label className="grid-toggle">
                <input
                  type="checkbox"
                  checked={view.showGrid}
                  onChange={(event) =>
                    dispatch({
                      type: "view",
                      patch: { showGrid: event.target.checked },
                    })
                  }
                />
                Grid
              </label>
            </div>
          </div>
          <div className="glyph-canvas">
            <GlyphPreview
              key={`${glyph}-${view.showGrid}-${current.project.seed}`}
              glyph={current.glyphs[glyph]}
              unitsPerEm={current.metrics.unitsPerEm}
              inspect={view.showGrid}
              lineEditor={lineEditor}
              onTogglePoint={(pointId) =>
                dispatch({ type: "toggle-point", glyph, pointId })
              }
              onConnectPoints={(from, to) =>
                dispatch({ type: "connect-points", glyph, from, to })
              }
              onDisconnectPoints={(from, to) =>
                dispatch({ type: "disconnect-points", glyph, from, to })
              }
            />
          </div>
        </section>
        <aside className="control-panel" aria-label="Style controls">
          <StyleControls
            style={current.project.style}
            onChange={(patch) => dispatch({ type: "adjust", patch })}
            onCommit={() => dispatch({ type: "end-adjust" })}
          >
            <GridControls
              canReset={canResetGrid}
              onRandomize={randomizeGrid}
              onReset={() => dispatch({ type: "reset-grid" })}
            />
          </StyleControls>
        </aside>
      </div>

      <FontPreview
        typeface={current}
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
      />
    </main>
  );
}
