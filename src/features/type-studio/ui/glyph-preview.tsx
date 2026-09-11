import { BASELINE_ROW, GRID_COLUMNS, GRID_ROWS, X_HEIGHT_ROW, isGridLineMovable } from '../../../modules/typeface'
import type { GlyphOutline } from '../../../modules/typeface'
import { useGridLineGesture } from './use-grid-line-gesture'
import type { GridLineEditor } from './use-grid-line-gesture'
import { useNodeGesture } from './use-node-gesture'

interface GlyphPreviewProps {
  glyph: GlyphOutline
  unitsPerEm: number
  inspect: boolean
  lineEditor: GridLineEditor
  onTogglePoint: (pointId: number) => void
  onConnectPoints: (from: number, to: number) => void
  onDisconnectPoints: (from: number, to: number) => void
}

const AXES = ['column', 'row'] as const

export function GlyphPreview({ glyph: committed, unitsPerEm, inspect, lineEditor, onTogglePoint, onConnectPoints, onDisconnectPoints }: GlyphPreviewProps) {
  const scale = unitsPerEm / 1000
  const {
    drawingRef, preview, onPointerMove, onPointerUp, onPointerCancel,
    onLostPointerCapture, onKeyDown, onPointPointerDown, onPointFocus, onPointKeyDown,
  } = useNodeGesture(committed.construction.grid, scale, onTogglePoint, onConnectPoints)
  // While a grid line is dragged, the canvas shows its uncommitted outline.
  const { glyph, active, positionOf, handleProps } = useGridLineGesture(committed, drawingRef, lineEditor)
  const { grid, lines } = glyph.construction
  // Anchor the canvas to the grid frame, not the ink bounds: removing an
  // outside module must never move the next click target under the pointer.
  const gridCenter = (lines.columns[0] + lines.columns[GRID_COLUMNS - 1]) / 2
  const offset = 400 * scale - gridCenter
  // Line handles live in the canvas margins, clear of the nodes: columns
  // above the ascender, rows at the left edge of the view.
  const top = 800 * scale
  const left = -80 * scale - offset

  return (
    <svg viewBox={`${-80 * scale} ${-40 * scale} ${960 * scale} ${1120 * scale}`} role="group" aria-label={`Edit glyph ${glyph.char}`}
      onPointerMove={onPointerMove} onPointerUp={onPointerUp}
      onPointerCancel={onPointerCancel} onLostPointerCapture={onLostPointerCapture} onKeyDown={onKeyDown}>
      <g ref={drawingRef} transform={`translate(${offset} ${800 * scale}) scale(1 -1)`}>
        {inspect && <g className="construction-grid" aria-hidden="true">
          {lines.rows.map((y, row) => <line className={row === BASELINE_ROW ? 'baseline' : row === X_HEIGHT_ROW ? 'x-height' : undefined}
            key={`row-${row}`} x1={-800 * scale} y1={y} x2={1600 * scale} y2={y} />)}
          {lines.columns.map((x, column) => <line key={`column-${column}`} x1={x} y1={-800 * scale} x2={x} y2={1600 * scale} />)}
        </g>}
        <path d={glyph.pathData} fill="currentColor" fillRule="nonzero" className="glyph-outline" />
        {inspect && <g className="connection-targets">
          {glyph.construction.connections.map(({ from, to, start, end }) => <line key={`${from}-${to}`}
            className="connection-hit" x1={start[0]} y1={start[1]} x2={end[0]} y2={end[1]}
            role="button" tabIndex={0} aria-label={`Remove connection ${glyph.char} ${from + 1}–${to + 1}`}
            onClick={() => onDisconnectPoints(from, to)}
            onKeyDown={event => {
              if (['Enter', ' ', 'Delete', 'Backspace'].includes(event.key)) {
                event.preventDefault()
                if (!event.repeat) onDisconnectPoints(from, to)
              }
            }}><title>Click to remove this connection</title></line>)}
        </g>}
        {inspect && preview && <line className={`connection-preview${preview.target !== null ? ' has-target' : ''}`}
          x1={grid[preview.source].position[0]} y1={grid[preview.source].position[1]}
          x2={preview.end[0]} y2={preview.end[1]} aria-hidden="true" />}
        {inspect && <g className="grid-points">
          {grid.map(({ id, position: [x, y], active }) => (
            <g key={id} role="button" tabIndex={0} aria-pressed={active}
              aria-label={`Node ${glyph.char}, column ${id % GRID_COLUMNS + 1}, row ${Math.floor(id / GRID_COLUMNS) + 1}`}
              className={`grid-point${active ? ' is-active' : ''}${preview?.source === id ? ' is-source' : ''}${preview?.target === id ? ' is-target' : ''}`}
              transform={`translate(${x} ${y})`}
              onPointerDown={event => onPointPointerDown(event, id)}
              onClick={event => { if (event.detail === 0) onTogglePoint(id) }}
              onFocus={() => onPointFocus(id)} onKeyDown={event => onPointKeyDown(event, id)}>
              <title>Click to {active ? 'disable' : 'enable'}. Drag to another node to connect, or press Shift+Enter on each node.</title>
              <circle className="point-hit" r={22 * scale} />
              <circle className="point-marker" r={(active ? 5 : 3.5) * scale} />
            </g>
          ))}
        </g>}
        {inspect && <g className="grid-handles">
          {AXES.flatMap(axis => (axis === 'column' ? lines.columns : lines.rows).map((value, line) => {
            // The frame and baseline never move, so they get no handle.
            if (!isGridLineMovable(axis, line)) return null
            const dragging = active?.axis === axis && active.line === line
            return (
              <g key={`${axis}-${line}`} role="slider" tabIndex={0}
                aria-label={`${axis === 'column' ? 'Column' : 'Row'} line ${line + 1}`}
                aria-orientation={axis === 'column' ? 'horizontal' : 'vertical'}
                aria-valuemin={0} aria-valuemax={axis === 'column' ? GRID_COLUMNS - 1 : GRID_ROWS - 1}
                aria-valuenow={Math.round(positionOf(axis, line) * 100) / 100}
                className={`grid-handle is-${axis}${dragging ? ' is-dragging' : ''}`}
                {...handleProps(axis, line)}>
                <title>Drag to move this line; arrow keys nudge it. Double-click or press Delete to reset it.</title>
                {axis === 'column' ? <>
                  <line className="handle-guide" x1={value} y1={-800 * scale} x2={value} y2={top} />
                  <path className="handle-tab" d={`M${value} ${top + 2 * scale}l${7 * scale} ${10 * scale}v${20 * scale}h${-14 * scale}v${-20 * scale}z`} />
                  <rect className="handle-hit" x={value - 14 * scale} y={top} width={28 * scale} height={40 * scale} />
                </> : <>
                  <line className="handle-guide" x1={left + 40 * scale} y1={value} x2={1600 * scale} y2={value} />
                  <path className="handle-tab" d={`M${left + 40 * scale} ${value}l${-10 * scale} ${7 * scale}h${-20 * scale}v${-14 * scale}h${20 * scale}z`} />
                  <rect className="handle-hit" x={left} y={value - 14 * scale} width={46 * scale} height={28 * scale} />
                </>}
              </g>
            )
          }))}
        </g>}
      </g>
    </svg>
  )
}
